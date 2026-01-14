import { LayoutGrid, Kanban, Calendar, Video, Users, Settings, Camera, X, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  sidebarOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'projects', label: 'Projects', icon: Kanban },
    { id: 'calendar', label: 'Shoot Calendar', icon: Calendar },
    { id: 'content', label: 'Content Calendar', icon: Video },
    { id: 'analyzer', label: 'AI Analyzer', icon: Sparkles },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleMenuItemClick = (pageId: string) => {
    setCurrentPage(pageId);
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 z-50',
          'fixed md:relative h-full',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'w-64 md:w-64 lg:w-64',
          !sidebarOpen && 'md:w-20'
        )}
      >
        <div className={cn('p-4 border-b border-slate-800 flex items-center gap-3', !sidebarOpen && 'md:justify-center')}>
          <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          {(sidebarOpen || window.innerWidth < 768) && <h1 className="font-bold text-lg text-white flex-1">Bosroller</h1>}
          {sidebarOpen && onClose && (
            <button
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-slate-200 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px]',
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn('text-sm', !sidebarOpen && 'md:hidden')}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
