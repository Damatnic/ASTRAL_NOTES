/**
 * Advanced Text Editor Component with Astral Theming
 * Features: rich text editing, auto-save, word count, formatting tools
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { Tabs, TabItem } from './Tabs';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  showWordCount?: boolean;
  showToolbar?: boolean;
  maxHeight?: string;
  variant?: 'default' | 'cosmic' | 'astral';
  className?: string;
  onSave?: (content: string) => void;
  onAutoSave?: (content: string) => void;
}

export function TextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  autoSave = true,
  autoSaveDelay = 2000,
  showWordCount = true,
  showToolbar = true,
  maxHeight = '400px',
  variant = 'default',
  className,
  onSave,
  onAutoSave,
}: TextEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedContent, setSavedContent] = useState(content);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (!autoSave || localContent === savedContent) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave?.(localContent);
      setSavedContent(localContent);
      setLastSaved(new Date());
    }, autoSaveDelay);
  }, [localContent, savedContent, autoSave, autoSaveDelay, onAutoSave]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [triggerAutoSave]);

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onChange(newContent);
    
    // Add to history for undo/redo
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newContent = history[newIndex];
      setLocalContent(newContent);
      onChange(newContent);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newContent = history[newIndex];
      setLocalContent(newContent);
      onChange(newContent);
    }
  };

  // Format text functions
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    const newText = localContent.substring(0, start) + before + selectedText + after + localContent.substring(end);
    
    handleContentChange(newText);
    
    // Restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // Manual save
  const handleSave = () => {
    onSave?.(localContent);
    setSavedContent(localContent);
    setLastSaved(new Date());
  };

  // Calculate word count and reading time
  const wordCount = localContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = localContent.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'b':
          e.preventDefault();
          insertText('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*');
          break;
        case 'u':
          e.preventDefault();
          insertText('<u>', '</u>');
          break;
      }
    }
  };

  const variantStyles = {
    default: 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
    cosmic: 'border-violet-300 dark:border-violet-600 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/30',
    astral: 'border-purple-500/30 bg-gradient-to-br from-slate-900/50 via-purple-900/10 to-slate-900/50',
  };

  const toolbarItems = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold (Ctrl+B)' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic (Ctrl+I)' },
    { icon: Underline, action: () => insertText('<u>', '</u>'), title: 'Underline (Ctrl+U)' },
    { icon: Code, action: () => insertText('`', '`'), title: 'Code' },
    { icon: Quote, action: () => insertText('> '), title: 'Quote' },
    { icon: List, action: () => insertText('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. '), title: 'Numbered List' },
  ];

  const tabs: TabItem[] = [
    {
      id: 'write',
      label: 'Write',
      content: (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            className={cn(
              'w-full resize-none rounded-lg border p-4 text-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
              'placeholder-slate-400 dark:placeholder-slate-500',
              'text-slate-900 dark:text-white',
              variantStyles[variant],
              className
            )}
            style={{ minHeight: '200px', maxHeight }}
          />
          {readOnly && (
            <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center">
              <span className="text-slate-500 dark:text-slate-400">Read-only mode</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <div
          className={cn(
            'w-full rounded-lg border p-4 prose prose-sm dark:prose-invert max-w-none',
            variantStyles[variant]
          )}
          style={{ minHeight: '200px', maxHeight }}
          dangerouslySetInnerHTML={{
            __html: localContent
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code>$1</code>')
              .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
              .replace(/^- (.+)$/gm, '<li>$1</li>')
              .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
              .replace(/\n/g, '<br>')
          }}
        />
      ),
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div className={cn(
          'flex items-center gap-2 p-2 rounded-lg border',
          variantStyles[variant]
        )}>
          {/* Format buttons */}
          <div className="flex items-center gap-1">
            {toolbarItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="icon-sm"
                onClick={item.action}
                title={item.title}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />

          {/* History buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />

          {/* Save button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            title="Save (Ctrl+S)"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          {/* Auto-save indicator */}
          {autoSave && (
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {localContent !== savedContent ? (
                <span>Unsaved changes</span>
              ) : lastSaved ? (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Editor with tabs */}
      <Tabs tabs={tabs} variant="underline" />

      {/* Status bar */}
      {showWordCount && (
        <div className={cn(
          'flex items-center justify-between p-2 rounded-lg border text-xs',
          'text-slate-500 dark:text-slate-400',
          variantStyles[variant]
        )}>
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>~{readingTime} min read</span>
          </div>
          <div className="flex items-center gap-2">
            {autoSave && localContent !== savedContent && (
              <span className="text-amber-600 dark:text-amber-400">Auto-saving...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}