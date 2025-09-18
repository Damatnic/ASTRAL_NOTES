/**
 * Keyboard Shortcuts Help Component
 * Displays all available keyboard shortcuts organized by category
 */

import React from 'react';
import { Keyboard, Command, Navigation, Zap, Edit, Settings } from 'lucide-react';
import { Modal } from './Modal';
import { useShortcutsHelp } from '@/hooks/useGlobalShortcuts';
import { cn } from '@/utils/cn';

export interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ShortcutsHelp({ isOpen, onClose, className }: ShortcutsHelpProps) {
  const { shortcutsByCategory, formatShortcut } = useShortcutsHelp();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Navigation': return <Navigation className="h-4 w-4" />;
      case 'Actions': return <Zap className="h-4 w-4" />;
      case 'Editor': return <Edit className="h-4 w-4" />;
      case 'Utility': return <Settings className="h-4 w-4" />;
      case 'Quick Actions': return <Command className="h-4 w-4" />;
      default: return <Keyboard className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Navigation': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Actions': return 'text-green-600 bg-green-50 border-green-200';
      case 'Editor': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Utility': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Quick Actions': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="xl"
      className={cn("shortcuts-help", className)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Keyboard className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Master ASTRAL_NOTES with these powerful keyboard shortcuts
          </p>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <div className={cn(
                  "p-1.5 rounded-lg border",
                  getCategoryColor(category)
                )}>
                  {getCategoryIcon(category)}
                </div>
                <h3 className="font-semibold text-lg">{category}</h3>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground">
                        {shortcut.description}
                      </div>
                    </div>
                    <div className="ml-4">
                      <kbd className="px-3 py-1.5 text-xs font-mono bg-background border border-border rounded-md shadow-sm">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Command className="h-4 w-4" />
            Pro Tips
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span>Press <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl+K</kbd> anywhere to open the command palette</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span>Most shortcuts work globally, even when not focused on specific elements</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <span>On Mac, <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Cmd</kbd> replaces <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl</kbd></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd> or click outside to close this dialog
          </p>
        </div>
      </div>
    </Modal>
  );
}

// Hook for managing shortcuts help
export function useShortcutsHelpModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + ? to show shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
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
