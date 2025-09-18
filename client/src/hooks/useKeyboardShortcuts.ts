/**
 * Keyboard Shortcuts Hook
 * Handles global keyboard shortcuts for the application
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  onQuickNote?: () => void;
  onSearch?: () => void;
  onDashboard?: () => void;
  onProjects?: () => void;
  onQuickNotes?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

/**
 * Hook for managing global keyboard shortcuts
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const navigate = useNavigate();
  const activeShortcutsRef = useRef<Set<string>>(new Set());

  const shortcuts: KeyboardShortcut[] = [
    // Quick Note Creation
    {
      key: 'n',
      ctrlKey: true,
      action: () => options.onQuickNote?.(),
      description: 'Create quick note (Ctrl+N)',
    },
    
    // Navigation shortcuts
    {
      key: '1',
      ctrlKey: true,
      action: () => {
        options.onDashboard?.();
        navigate('/dashboard');
      },
      description: 'Go to Dashboard (Ctrl+1)',
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => {
        options.onProjects?.();
        navigate('/projects');
      },
      description: 'Go to Projects (Ctrl+2)',
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => {
        options.onQuickNotes?.();
        navigate('/quick-notes');
      },
      description: 'Go to Quick Notes (Ctrl+3)',
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => {
        options.onSearch?.();
        navigate('/search');
      },
      description: 'Go to Search (Ctrl+4)',
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => {
        options.onSettings?.();
        navigate('/settings');
      },
      description: 'Go to Settings (Ctrl+5)',
    },

    // Search shortcut
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        options.onSearch?.();
        navigate('/search');
      },
      description: 'Open Search (Ctrl+K)',
    },
    {
      key: '/',
      action: () => {
        options.onSearch?.();
        navigate('/search');
      },
      description: 'Open Search (/)',
    },

    // Alternative quick note shortcut
    {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
      action: () => options.onQuickNote?.(),
      description: 'Create quick note (Ctrl+Shift+Enter)',
    },

    // Help system
    {
      key: 'F1',
      action: () => options.onHelp?.(),
      description: 'Open help system (F1)',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input/textarea/contenteditable
    const target = event.target as HTMLElement;
    const isInputElement = target.matches('input, textarea, [contenteditable]');
    const isInModal = target.closest('[role="dialog"]');
    
    if (isInputElement && !isInModal) {
      return;
    }

    // Check for matching shortcuts
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !shortcut.ctrlKey || event.ctrlKey;
      const shiftMatches = !shortcut.shiftKey || event.shiftKey;
      const altMatches = !shortcut.altKey || event.altKey;
      const metaMatches = !shortcut.metaKey || event.metaKey;

      // Ensure exact modifier match (no extra modifiers unless specified)
      const extraCtrl = event.ctrlKey && !shortcut.ctrlKey;
      const extraShift = event.shiftKey && !shortcut.shiftKey;
      const extraAlt = event.altKey && !shortcut.altKey;
      const extraMeta = event.metaKey && !shortcut.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches &&
          !extraCtrl && !extraShift && !extraAlt && !extraMeta) {
        
        // Create shortcut key for tracking
        const shortcutKey = `${shortcut.ctrlKey ? 'ctrl+' : ''}${shortcut.shiftKey ? 'shift+' : ''}${shortcut.altKey ? 'alt+' : ''}${shortcut.metaKey ? 'meta+' : ''}${shortcut.key}`;
        
        // Prevent duplicate triggers
        if (activeShortcutsRef.current.has(shortcutKey)) {
          return;
        }

        activeShortcutsRef.current.add(shortcutKey);
        
        // Prevent default behavior and execute action
        event.preventDefault();
        event.stopPropagation();
        
        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
        
        // Clean up after a short delay
        setTimeout(() => {
          activeShortcutsRef.current.delete(shortcutKey);
        }, 100);
        
        break;
      }
    }
  }, [shortcuts]);

  const handleKeyUp = useCallback(() => {
    // Clear all active shortcuts on key up to prevent stuck keys
    activeShortcutsRef.current.clear();
  }, []);

  useEffect(() => {
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      activeShortcutsRef.current.clear();
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    shortcuts,
    isShortcutActive: (key: string) => activeShortcutsRef.current.has(key),
  };
}

/**
 * Format shortcut description for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
}

/**
 * Get all available shortcuts grouped by category
 */
export function getShortcutCategories(): Record<string, KeyboardShortcut[]> {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => {},
      description: 'Create quick note',
    },
    {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
      action: () => {},
      description: 'Create quick note (alternative)',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {},
      description: 'Open search',
    },
    {
      key: '/',
      action: () => {},
      description: 'Open search (alternative)',
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => {},
      description: 'Go to Dashboard',
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => {},
      description: 'Go to Projects',
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => {},
      description: 'Go to Quick Notes',
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => {},
      description: 'Go to Search',
    },
    {
      key: '5',
      ctrlKey: true,
      action: () => {},
      description: 'Go to Settings',
    },
  ];

  return {
    'Quick Actions': [
      shortcuts[0], // Create quick note
      shortcuts[1], // Create quick note (alt)
    ],
    'Search': [
      shortcuts[2], // Open search
      shortcuts[3], // Open search (alt)
    ],
    'Navigation': [
      shortcuts[4], // Dashboard
      shortcuts[5], // Projects
      shortcuts[6], // Quick Notes
      shortcuts[7], // Search
      shortcuts[8], // Settings
    ],
  };
}