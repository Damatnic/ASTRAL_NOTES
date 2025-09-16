/**
 * Main Layout Component
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { cn } from '@/utils/cn';

export function Layout() {
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          'lg:ml-0' // Always show content on large screens
        )}
      >
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}