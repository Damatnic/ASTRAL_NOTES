/**
 * Header Component
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sun, Moon, User, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MobileMenuButton } from './Sidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { CreateNoteModal } from '@/components/quick-notes';
import { quickNotesService } from '@/services/quickNotesService';
import { projectService } from '@/services/projectService';
import { cn } from '@/utils/cn';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const [showCreateNote, setShowCreateNote] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search functionality can be implemented later if needed
  };

  const handleCreateNote = async (data: any) => {
    try {
      await quickNotesService.createQuickNote(data);
      setShowCreateNote(false);
      // Could show a success toast here
    } catch (error) {
      console.error('Error creating quick note:', error);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <MobileMenuButton />
          
          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects and notes..."
                className="w-64 pl-10"
                autoComplete="off"
              />
            </div>
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Quick Note button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateNote(true)}
            className="hidden sm:flex items-center gap-2"
            aria-label="Create quick note"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Quick Note</span>
          </Button>

          {/* Quick Note button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreateNote(true)}
            className="sm:hidden"
            aria-label="Create quick note"
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Search button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
          >
            {effectiveTheme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Settings menu - Personal app, no auth needed */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            aria-label="Settings"
            asChild
          >
            <Link to="/settings">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Note Creation Modal */}
      <CreateNoteModal
        isOpen={showCreateNote}
        onClose={() => setShowCreateNote(false)}
        onSubmit={handleCreateNote}
        availableProjects={projectService.getAllProjects().map(p => ({ id: p.id, title: p.title }))}
        availableTags={quickNotesService.getAllTags()}
      />
    </header>
  );
}