/**
 * Sidebar Component
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Settings, 
  Search,
  PlusCircle,
  Menu,
  X,
  FileText,
  Brain,
  BarChart3,
  Zap,
  Workflow,
  Briefcase,
  PenTool
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { toggleSidebar } from '@/store/slices/uiSlice';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Writing Hub', href: '/dashboard', icon: Home },
  { name: 'Quick Notes', href: '/quick-notes', icon: FileText },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'AI Assistant', href: '/ai-writing', icon: Brain },
  { name: 'Professional', href: '/professional', icon: Briefcase },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={handleToggleSidebar}
        >
          <div className="fixed inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <h1 className="text-xl font-semibold text-foreground">
              Writing Assistant
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-sm backdrop-blur-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <item.icon className={cn(
                    'h-5 w-5 relative z-10 transition-transform group-hover:scale-110',
                    isActive && 'text-primary'
                  )} />
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform">
                    {item.name}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse relative z-10" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="px-4 py-4 border-t space-y-2">
            <Button
              variant="default"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/quick-notes">
                <PlusCircle className="h-4 w-4" />
                Quick Note
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/ai-writing">
                <Zap className="h-4 w-4" />
                AI Writing Help
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile menu button
export function MobileMenuButton() {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => dispatch(toggleSidebar())}
      className="lg:hidden"
      aria-label="Open sidebar"
      data-testid="mobile-menu-button"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}