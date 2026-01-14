import { useCallback, useState } from 'react';
import { Upload, X, FileVideo } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';

interface VideoUploadZoneProps {
  onFileSelect: (file: File) => void;
  onCancel?: () => void;
  isUploading: boolean;
  uploadProgress: number;
}

export default function VideoUploadZone({
  onFileSelect,
  onCancel,
  isUploading,
  uploadProgress,
}: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 500 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload MP4, MOV, or AVI files only.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size exceeds 500MB limit.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0]) {
        const file = files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0]) {
        const file = files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  if (isUploading) {
    return (
      <div className="border-2 border-slate-700 rounded-lg p-8 bg-slate-900/50">
        <div className="flex flex-col items-center space-y-4">
          <FileVideo className="w-12 h-12 text-blue-400" />
          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Uploading video...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="mt-4"
            >
              Cancel Upload
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer
          ${isDragging
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }
        `}
      >
        <label htmlFor="video-upload" className="cursor-pointer">
          <input
            id="video-upload"
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-blue-500/10 rounded-full">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-200 font-medium mb-1">
                Drop video here or click to upload
              </p>
              <p className="text-sm text-slate-400">
                MP4, MOV, or AVI (max 500MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
