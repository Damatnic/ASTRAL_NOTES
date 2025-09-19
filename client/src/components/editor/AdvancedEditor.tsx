/**
 * Advanced Rich Text Editor
 * TipTap-based editor with distraction-free mode and professional features
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Settings,
  Save,
  Undo,
  Redo,
  Search,
  Moon,
  Sun,
  Focus as FocusIcon,
  Timer,
  BarChart3,
  Target
} from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';
import { EditorStats } from './EditorStats';
import { WikiLinkExtension } from './WikiLinkExtension';

interface AdvancedEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  isDistracted?: boolean;
  showStats?: boolean;
  showToolbar?: boolean;
  className?: string;
}

export function AdvancedEditor({
  content,
  onChange,
  onSave,
  placeholder = "Start writing...",
  isDistracted = false,
  showStats = true,
  showToolbar = true,
  className
}: AdvancedEditorProps) {
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [wordTarget, setWordTarget] = useState(0);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // TipTap Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      CharacterCount.configure({
        limit: 100000, // 100k character limit
      }),
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-cosmic-600 hover:text-cosmic-700 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      WikiLinkExtension, // Custom extension for [[wiki links]]
    ],
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);
      
      // Track typing activity
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-gray dark:prose-invert max-w-none',
          'focus:outline-none min-h-[300px] p-6',
          'prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-li:text-foreground prose-strong:text-foreground',
          'prose-code:text-foreground prose-code:bg-muted',
          'prose-blockquote:text-muted-foreground prose-blockquote:border-l-cosmic-500',
          isDistractionFree && 'prose-lg prose-relaxed',
          isDarkMode && 'dark'
        ),
      },
    },
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      
      // Distraction-free mode toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsDistractionFree(!isDistractionFree);
      }
      
      // Fullscreen toggle
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
      
      // Find toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowFind(!showFind);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDistractionFree, isFullscreen, showFind, onSave]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (editor && !isTyping) {
        onSave?.();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSave);
  }, [editor, isTyping, onSave]);

  // Statistics
  const stats = editor ? {
    characters: editor.storage.characterCount.characters(),
    charactersWithoutSpaces: editor.storage.characterCount.characters({ mode: 'textSize' }),
    words: editor.storage.characterCount.words(),
    paragraphs: content.split('\n\n').filter(p => p.trim().length > 0).length,
    readingTime: Math.ceil(editor.storage.characterCount.words() / 200), // Average reading speed
  } : null;

  const handleDistractionFreeToggle = () => {
    setIsDistractionFree(!isDistractionFree);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen && editorRef.current) {
      editorRef.current.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500"></div>
      </div>
    );
  }

  return (
    <div 
      ref={editorRef}
      className={cn(
        "advanced-editor relative",
        isFullscreen && "fixed inset-0 z-50 bg-background",
        isDistractionFree && "distraction-free",
        isDarkMode && "dark",
        className
      )}
    >
      {/* Editor Toolbar */}
      {showToolbar && !isDistractionFree && (
        <EditorToolbar
          editor={editor}
          onDistractionFreeToggle={handleDistractionFreeToggle}
          onFullscreenToggle={handleFullscreenToggle}
          onDarkModeToggle={handleDarkModeToggle}
          onSave={onSave}
          isDistractionFree={isDistractionFree}
          isFullscreen={isFullscreen}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Find/Replace Bar */}
      {showFind && !isDistractionFree && (
        <Card className="p-3 mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Find in document..."
              className="flex-1 px-3 py-1 border rounded bg-background text-sm"
            />
            <Button size="sm" variant="outline">
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowFind(false)}>
              ×
            </Button>
          </div>
        </Card>
      )}

      {/* Editor Content */}
      <div className={cn(
        "editor-content relative",
        isDistractionFree && "max-w-4xl mx-auto",
        isFullscreen && "h-full overflow-auto"
      )}>
        {/* Distraction-free mode controls */}
        {isDistractionFree && (
          <div className="absolute top-4 right-4 z-10 opacity-20 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDistractionFreeToggle}
                className="bg-background/80 backdrop-blur"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreenToggle}
                className="bg-background/80 backdrop-blur"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDarkModeToggle}
                className="bg-background/80 backdrop-blur"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && !isDistractionFree && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur rounded px-2 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Writing...</span>
            </div>
          </div>
        )}

        {/* Word Target Progress */}
        {wordTarget > 0 && stats && !isDistractionFree && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-background/80 backdrop-blur rounded px-3 py-1 text-xs">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3" />
                <span>{stats.words} / {wordTarget} words</span>
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cosmic-500 transition-all duration-300"
                    style={{ width: `${Math.min((stats.words / wordTarget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Editor */}
        <Card className={cn(
          "min-h-[500px]",
          isDistractionFree && "border-none shadow-none bg-transparent",
          isFullscreen && "h-full border-none shadow-none"
        )}>
          <EditorContent 
            editor={editor} 
            className={cn(
              "h-full",
              isDistractionFree && "pt-16 pb-16"
            )}
          />
        </Card>

        {/* Bottom Stats Bar */}
        {showStats && stats && !isDistractionFree && (
          <EditorStats
            stats={stats}
            wordTarget={wordTarget}
            onWordTargetChange={setWordTarget}
            className="mt-4"
          />
        )}

        {/* Distraction-free stats */}
        {isDistractionFree && stats && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 opacity-20 hover:opacity-100 transition-opacity">
            <div className="bg-background/80 backdrop-blur rounded px-4 py-2 text-sm">
              <div className="flex items-center gap-4">
                <span>{stats.words} words</span>
                <span>{stats.characters} characters</span>
                <span>{stats.readingTime}m read</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Exit Hint */}
      {isFullscreen && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 opacity-50 hover:opacity-100 transition-opacity">
          <div className="bg-background/80 backdrop-blur rounded px-3 py-1 text-xs text-muted-foreground">
            Press F11 or click the minimize button to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedEditor;