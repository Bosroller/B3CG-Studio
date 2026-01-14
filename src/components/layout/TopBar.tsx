import { Menu, Bell, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  userEmail: string;
  onLogout: () => void;
}

export default function TopBar({ onMenuClick, userEmail, onLogout }: TopBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-gradient-to-r from-purple-900 to-purple-950 border-b border-purple-700 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-slate-400 hover:text-slate-200 flex-shrink-0 min-h-[44px] min-w-[44px]"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate">B3CG Studio</h2>
          <p className="text-xs text-slate-400 hidden sm:block">Creator Project Management</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200 relative min-h-[44px] min-w-[44px]"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200 gap-2 min-h-[44px]">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm hidden sm:inline">{userEmail.split('@')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem onClick={onLogout} className="text-slate-200 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
