/**
 * Global Keyboard Shortcuts Hook
 * Comprehensive keyboard shortcuts for the entire application
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
  preventDefault?: boolean;
}

export interface GlobalShortcutsOptions {
  onQuickNote?: () => void;
  onSearch?: () => void;
  onCommandPalette?: () => void;
  onNewProject?: () => void;
  onSettings?: () => void;
  onToggleTheme?: () => void;
  onSave?: () => void;
  onHelp?: () => void;
  disabled?: boolean;
}

export function useGlobalShortcuts(options: GlobalShortcutsOptions = {}) {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    // Navigation shortcuts
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => navigate('/projects'),
      description: 'Go to Projects',
      category: 'Navigation'
    },
    {
      key: 'q',
      ctrlKey: true,
      action: () => navigate('/quick-notes'),
      description: 'Go to Quick Notes',
      category: 'Navigation'
    },
    {
      key: 'i',
      ctrlKey: true,
      action: () => navigate('/ai-writing'),
      description: 'Go to AI Writing',
      category: 'Navigation'
    },
    {
      key: ',',
      ctrlKey: true,
      action: () => options.onSettings?.() || navigate('/settings'),
      description: 'Open Settings',
      category: 'Navigation'
    },

    // Action shortcuts
    {
      key: 'n',
      ctrlKey: true,
      action: () => options.onQuickNote?.(),
      description: 'New Quick Note',
      category: 'Actions'
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      action: () => options.onNewProject?.(),
      description: 'New Project',
      category: 'Actions'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => options.onSearch?.() || options.onCommandPalette?.(),
      description: 'Open Search / Command Palette',
      category: 'Actions'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => options.onSave?.(),
      description: 'Save Current Work',
      category: 'Actions',
      preventDefault: true
    },

    // Utility shortcuts
    {
      key: 'd',
      ctrlKey: true,
      action: () => options.onToggleTheme?.(),
      description: 'Toggle Dark Mode',
      category: 'Utility'
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => options.onHelp?.(),
      description: 'Show Help',
      category: 'Utility'
    },
    {
      key: '?',
      ctrlKey: true,
      action: () => options.onHelp?.(),
      description: 'Show Keyboard Shortcuts',
      category: 'Utility'
    },

    // Editor shortcuts (when in editor context)
    {
      key: 'b',
      ctrlKey: true,
      action: () => document.execCommand?.('bold'),
      description: 'Bold Text',
      category: 'Editor'
    },
    {
      key: 'i',
      ctrlKey: true,
      action: () => document.execCommand?.('italic'),
      description: 'Italic Text',
      category: 'Editor'
    },
    {
      key: 'u',
      ctrlKey: true,
      action: () => document.execCommand?.('underline'),
      description: 'Underline Text',
      category: 'Editor'
    },
    {
      key: 'z',
      ctrlKey: true,
      action: () => document.execCommand?.('undo'),
      description: 'Undo',
      category: 'Editor'
    },
    {
      key: 'y',
      ctrlKey: true,
      action: () => document.execCommand?.('redo'),
      description: 'Redo',
      category: 'Editor'
    },

    // Quick actions
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => options.onSave?.(),
      description: 'Quick Save',
      category: 'Quick Actions'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or cancel current action
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
      },
      description: 'Cancel / Close',
      category: 'Quick Actions'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (options.disabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    if (target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.contentEditable === 'true'
    )) {
      // Allow only certain shortcuts in input fields
      const allowedInInputs = ['s', 'z', 'y', 'Enter', 'Escape'];
      if (!allowedInInputs.includes(event.key)) {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        try {
          shortcut.action();
        } catch (error) {
          console.warn('Shortcut action failed:', error);
        }
        break;
      }
    }
  }, [options, navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.filter(s => s.action !== undefined),
    getShortcutsByCategory: () => {
      const categories: Record<string, ShortcutConfig[]> = {};
      shortcuts.forEach(shortcut => {
        const category = shortcut.category || 'Other';
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(shortcut);
      });
      return categories;
    }
  };
}

// Helper function to format shortcut display
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl');
  }
  if (shortcut.altKey) {
    parts.push('Alt');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}

// Hook for displaying shortcuts help
export function useShortcutsHelp() {
  const { shortcuts, getShortcutsByCategory } = useGlobalShortcuts({ disabled: true });
  
  return {
    shortcuts,
    shortcutsByCategory: getShortcutsByCategory(),
    formatShortcut
  };
}
