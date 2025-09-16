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
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { toggleSidebar } from '@/store/slices/uiSlice';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
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
              Astral Notes
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

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="px-4 py-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/projects/new">
                <PlusCircle className="h-4 w-4" />
                New Project
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
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}