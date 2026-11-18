import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { 
  Code, 
  Bug, 
  TrendingUp, 
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  Swords
} from "lucide-react";

import type { ViewType } from "@/pages/home-page";

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

function ThemeToggleItem() {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon }
  ];
  
  // Set default theme to dark if not set
  useEffect(() => {
    const savedTheme = localStorage.getItem('ui-theme');
    if (!savedTheme) {
      setTheme('dark');
    }
  }, []);

  return (
    <div className="space-y-1">
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          className={`w-full justify-start text-left ${theme === value ? 'bg-accent' : ''}`}
          onClick={() => setTheme(value as any)}
        >
          <Icon className="mr-2 h-4 w-4" />
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out animate-slide-in flex-shrink-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Code className="text-primary-foreground text-sm" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">CodeMentor AI</h1>
            <p className="text-xs text-muted-foreground">Debug & Learn</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant={activeView === 'editor' ? "secondary" : "ghost"}
          className={`w-full justify-start space-x-3 nav-item animate-slide-in-up ${activeView === 'editor' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-accent'}`}
          data-testid="nav-code-editor"
          style={{ animationDelay: '0.1s' }}
          onClick={() => onNavigate('editor')}
        >
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">Code Editor</span>
        </Button>
        
        <Button
          variant={activeView === 'debug-history' ? "secondary" : "ghost"}
          className={`w-full justify-start space-x-3 nav-item animate-slide-in-up ${activeView === 'debug-history' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-accent'}`}
          data-testid="nav-debug-history"
          style={{ animationDelay: '0.2s' }}
          onClick={() => onNavigate('debug-history')}
        >
          <Bug className="w-4 h-4" />
          <span className="text-sm font-medium">Debug History</span>
        </Button>
        
        <Button
          variant={activeView === 'progress' ? "secondary" : "ghost"}
          className={`w-full justify-start space-x-3 nav-item animate-slide-in-up ${activeView === 'progress' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-accent'}`}
          data-testid="nav-progress"
          style={{ animationDelay: '0.3s' }}
          onClick={() => onNavigate('progress')}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Progress</span>
        </Button>

        <Button
          variant={activeView === 'battle' ? "secondary" : "ghost"}
          className={`w-full justify-start space-x-3 nav-item animate-slide-in-up ${activeView === 'battle' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-accent'}`}
          data-testid="nav-battle"
          style={{ animationDelay: '0.4s' }}
          onClick={() => onNavigate('battle')}
        >
          <Swords className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">Battle Mode</span>
        </Button>

        <div className="pt-2 border-t border-border mt-2">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2 mt-2">APPEARANCE</p>
          <ThemeToggleItem />
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="text-muted-foreground text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground" data-testid="text-username">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              Level {user?.level} • {user?.xp} XP
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </aside>
  );
}
