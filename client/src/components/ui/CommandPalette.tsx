/**
 * Command Palette Component
 * Advanced keyboard shortcuts and command search interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Command, 
  FileText, 
  FolderOpen, 
  Settings, 
  Brain, 
  PlusCircle,
  Keyboard,
  ArrowRight,
  Hash,
  Clock,
  Star,
  Bookmark
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Modal } from './Modal';
import { Input } from './Input';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category?: string;
  action: () => void;
  keywords?: string[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
  placeholder?: string;
  className?: string;
}

const defaultCommands: CommandItem[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    icon: <FileText className="h-4 w-4" />,
    shortcut: 'Ctrl+H',
    category: 'Navigation',
    action: () => {},
    keywords: ['home', 'main', 'overview']
  },
  {
    id: 'nav-projects',
    title: 'Go to Projects',
    description: 'View and manage your projects',
    icon: <FolderOpen className="h-4 w-4" />,
    shortcut: 'Ctrl+P',
    category: 'Navigation',
    action: () => {},
    keywords: ['projects', 'work', 'files']
  },
  {
    id: 'nav-settings',
    title: 'Open Settings',
    description: 'Configure your preferences',
    icon: <Settings className="h-4 w-4" />,
    shortcut: 'Ctrl+,',
    category: 'Navigation',
    action: () => {},
    keywords: ['settings', 'preferences', 'config']
  },
  
  // Actions
  {
    id: 'action-new-note',
    title: 'New Quick Note',
    description: 'Create a new quick note',
    icon: <PlusCircle className="h-4 w-4" />,
    shortcut: 'Ctrl+N',
    category: 'Actions',
    action: () => {},
    keywords: ['new', 'create', 'note', 'write']
  },
  {
    id: 'action-ai-assist',
    title: 'AI Writing Assistant',
    description: 'Get help from AI writing tools',
    icon: <Brain className="h-4 w-4" />,
    shortcut: 'Ctrl+I',
    category: 'Actions',
    action: () => {},
    keywords: ['ai', 'assistant', 'help', 'writing']
  },
  {
    id: 'action-search',
    title: 'Search Everything',
    description: 'Search across all your content',
    icon: <Search className="h-4 w-4" />,
    shortcut: 'Ctrl+K',
    category: 'Actions',
    action: () => {},
    keywords: ['search', 'find', 'lookup']
  },
  
  // Tools
  {
    id: 'tool-shortcuts',
    title: 'View Keyboard Shortcuts',
    description: 'See all available keyboard shortcuts',
    icon: <Keyboard className="h-4 w-4" />,
    shortcut: 'Ctrl+?',
    category: 'Tools',
    action: () => {},
    keywords: ['shortcuts', 'hotkeys', 'keyboard']
  }
];

export function CommandPalette({
  isOpen,
  onClose,
  commands = defaultCommands,
  placeholder = "Type a command or search...",
  className
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    
    const searchTerm = query.toLowerCase();
    return commands.filter(command => {
      const searchableText = [
        command.title,
        command.description,
        command.category,
        ...(command.keywords || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    });
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(command => {
      const category = command.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const executeCommand = useCallback((command: CommandItem) => {
    // Execute navigation commands
    if (command.id.startsWith('nav-')) {
      const route = command.id.replace('nav-', '');
      if (route === 'dashboard') navigate('/dashboard');
      else if (route === 'projects') navigate('/projects');
      else if (route === 'settings') navigate('/settings');
    }
    
    // Execute the command action
    command.action();
    onClose();
  }, [navigate, onClose]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navigation': return <ArrowRight className="h-4 w-4" />;
      case 'Actions': return <Star className="h-4 w-4" />;
      case 'Tools': return <Hash className="h-4 w-4" />;
      case 'Recent': return <Clock className="h-4 w-4" />;
      default: return <Bookmark className="h-4 w-4" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={false}
      className={cn("command-palette", className)}
    >
      <div className="p-0 max-h-[70vh] flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-10 border-0 bg-transparent focus-visible:ring-0 text-lg"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs bg-muted rounded border">Esc</kbd>
            </div>
          </div>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-auto p-2">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {getCategoryIcon(category)}
                    {category}
                  </div>
                  <div className="space-y-1">
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={command.id}
                          onClick={() => executeCommand(command)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg transition-all duration-150 flex items-center justify-between group",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-accent/50"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn(
                              "flex-shrink-0",
                              isSelected ? "text-primary-foreground" : "text-muted-foreground"
                            )}>
                              {command.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={cn(
                                "font-medium truncate",
                                isSelected ? "text-primary-foreground" : "text-foreground"
                              )}>
                                {command.title}
                              </div>
                              {command.description && (
                                <div className={cn(
                                  "text-xs truncate mt-0.5",
                                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {command.description}
                                </div>
                              )}
                            </div>
                          </div>
                          {command.shortcut && (
                            <kbd className={cn(
                              "px-2 py-1 text-xs rounded border font-mono",
                              isSelected 
                                ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30" 
                                : "bg-muted text-muted-foreground border-border"
                            )}>
                              {command.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border">↑↓</kbd>
                Navigate
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border">↵</kbd>
                Select
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background rounded border">Esc</kbd>
                Close
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              Command Palette
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Hook for using command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
