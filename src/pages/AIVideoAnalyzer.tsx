import { useState, useCallback } from 'react';
import { Loader2, FileVideo, AlertCircle } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import VideoUploadZone from '../components/video/VideoUploadZone';
import VideoPlayer from '../components/video/VideoPlayer';
import AnalysisResults from '../components/video/AnalysisResults';
import ChatInterface from '../components/video/ChatInterface';
import {
  createVideoAnalysis,
  uploadVideoToStorage,
  updateVideoAnalysisUrl,
  triggerVideoAnalysis,
  getVideoAnalysis,
  sendChatMessage,
  updateChatHistory,
} from '../lib/videoAnalysisApi';
import type { VideoAnalysis, ChatMessage } from '../types';

export default function AIVideoAnalyzer() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

  const pollAnalysis = useCallback(async (videoId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      const { data, error } = await getVideoAnalysis(videoId);

      if (error) {
        console.error('Error polling analysis:', error);
        return;
      }

      if (data) {
        setCurrentAnalysis(data);

        if (data.status === 'completed') {
          toast({
            title: 'Analysis complete',
            description: 'Your video has been analyzed successfully',
          });
          return;
        }

        if (data.status === 'failed') {
          toast({
            title: 'Analysis failed',
            description: data.error_message || 'An error occurred during analysis',
            variant: 'destructive',
          });
          return;
        }

        if (attempts < maxAttempts && (data.status === 'processing' || data.status === 'uploading')) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  }, [toast]);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';

      videoElement.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(videoElement.src);
        const duration = Math.floor(videoElement.duration);

        const { data: analysis, error: createError } = await createVideoAnalysis(
          file.name,
          file.size,
          duration
        );

        if (createError || !analysis) {
          toast({
            title: 'Error',
            description: createError?.message || 'Failed to create video analysis',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        setCurrentAnalysis(analysis);
        setUploadProgress(20);

        const { url, error: uploadError } = await uploadVideoToStorage(file, analysis.id);

        if (uploadError || !url) {
          toast({
            title: 'Upload failed',
            description: uploadError?.message || 'Failed to upload video',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        setUploadProgress(60);

        const { error: updateError } = await updateVideoAnalysisUrl(analysis.id, url);

        if (updateError) {
          toast({
            title: 'Error',
            description: updateError.message,
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        setUploadProgress(80);

        const { error: triggerError } = await triggerVideoAnalysis(
          analysis.id,
          file.name,
          file.size
        );

        if (triggerError) {
          toast({
            title: 'Analysis failed to start',
            description: triggerError.message,
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }

        setUploadProgress(100);
        setIsUploading(false);

        toast({
          title: 'Upload complete',
          description: 'Your video is being analyzed. This may take a few minutes.',
        });

        pollAnalysis(analysis.id);
      };

      videoElement.src = URL.createObjectURL(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentAnalysis || !currentAnalysis.analysis_data) return;

    setIsChatLoading(true);

    const newUserMessage: ChatMessage = {
      role: 'user',
      message,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...currentAnalysis.chat_history, newUserMessage];
    setCurrentAnalysis({
      ...currentAnalysis,
      chat_history: updatedHistory,
    });

    try {
      const { response, error } = await sendChatMessage(
        currentAnalysis.id,
        message,
        currentAnalysis.analysis_data,
        updatedHistory
      );

      if (error || !response) {
        toast({
          title: 'Error',
          description: error?.message || 'Failed to send message',
          variant: 'destructive',
        });
        setIsChatLoading(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        message: response,
        timestamp: new Date().toISOString(),
      };

      const finalHistory = [...updatedHistory, assistantMessage];

      await updateChatHistory(currentAnalysis.id, finalHistory);

      setCurrentAnalysis({
        ...currentAnalysis,
        chat_history: finalHistory,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleTimestampClick = (timeInSeconds: number) => {
    setVideoTime(timeInSeconds);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-slate-950 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">AI Video Analyzer</h1>
        <p className="text-slate-400">
          Upload your video and receive AI-powered analysis to optimize for virality
        </p>
      </div>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-5rem)] rounded-lg border border-slate-800">
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full p-6 overflow-y-auto bg-slate-900/50">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Upload & Preview</h2>

            {!currentAnalysis && (
              <VideoUploadZone
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            )}

            {currentAnalysis && (
              <div className="space-y-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <FileVideo className="w-5 h-5 text-blue-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          {currentAnalysis.file_name}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {currentAnalysis.file_size && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              {formatFileSize(currentAnalysis.file_size)}
                            </Badge>
                          )}
                          {currentAnalysis.duration && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              {formatDuration(currentAnalysis.duration)}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              currentAnalysis.status === 'completed'
                                ? 'border-green-400 text-green-400'
                                : currentAnalysis.status === 'failed'
                                ? 'border-red-400 text-red-400'
                                : 'border-blue-400 text-blue-400'
                            }
                          >
                            {currentAnalysis.status === 'processing' && (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            )}
                            {currentAnalysis.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {currentAnalysis.video_url && (
                  <VideoPlayer
                    videoUrl={currentAnalysis.video_url}
                    currentTime={videoTime}
                    onTimeUpdate={(time) => setVideoTime(time)}
                  />
                )}

                {currentAnalysis.status === 'processing' && (
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        <div>
                          <p className="text-slate-200 font-medium">Analyzing your video</p>
                          <p className="text-sm text-slate-400">
                            This usually takes 2-5 minutes
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentAnalysis.status === 'failed' && (
                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-slate-200 font-medium">Analysis failed</p>
                          <p className="text-sm text-slate-400">
                            {currentAnalysis.error_message || 'An error occurred during analysis'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col bg-slate-900/30">
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Analysis Results</h2>

              {!currentAnalysis && (
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="pt-12 pb-12 text-center">
                    <FileVideo className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                      Upload a video to start the analysis
                    </p>
                  </CardContent>
                </Card>
              )}

              {currentAnalysis && !currentAnalysis.analysis_data && currentAnalysis.status !== 'failed' && (
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-400">
                      Waiting for analysis results...
                    </p>
                  </CardContent>
                </Card>
              )}

              {currentAnalysis?.analysis_data && (
                <>
                  <AnalysisResults
                    analysis={currentAnalysis.analysis_data}
                    onTimestampClick={handleTimestampClick}
                  />

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">
                      Chat with AI
                    </h3>
                    <div className="h-[500px]">
                      <ChatInterface
                        messages={currentAnalysis.chat_history}
                        onSendMessage={handleSendMessage}
                        isLoading={isChatLoading}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
