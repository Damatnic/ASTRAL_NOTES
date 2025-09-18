/**
 * Enhanced Editor Hook
 * Centralized logic for advanced note editing functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor as useTiptapEditor, Editor } from '@tiptap/react';
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
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import FontFamily from '@tiptap/extension-font-family';
import { useToast } from '@/components/ui/Toast';
import { WikiLinkExtension } from '@/components/editor/WikiLinkExtension';

export interface EditorStats {
  characters: number;
  charactersWithoutSpaces: number;
  words: number;
  paragraphs: number;
  readingTime: number;
  pages: number;
  avgWordLength: number;
}

export interface EditorPreferences {
  theme: 'default' | 'minimal' | 'dark-focus' | 'warm';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  isDistractionFree: boolean;
  isFullscreen: boolean;
  showWordCount: boolean;
  showReadingTime: boolean;
  wordTarget: number;
  autoSaveEnabled: boolean;
  autoSaveDelay: number;
}

export interface UseEditorOptions {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  preferences?: Partial<EditorPreferences>;
  autoSaveDelay?: number;
  maxLength?: number;
}

export interface UseEditorReturn {
  editor: Editor | null;
  stats: EditorStats | null;
  preferences: EditorPreferences;
  isTyping: boolean;
  isLoading: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Actions
  updatePreferences: (prefs: Partial<EditorPreferences>) => void;
  saveContent: () => Promise<boolean>;
  exportContent: (format: 'html' | 'md' | 'txt' | 'json') => string;
  importContent: (content: string, format: 'html' | 'md' | 'txt') => void;
  insertTemplate: (template: string) => void;
  findAndReplace: (find: string, replace: string, replaceAll?: boolean) => void;
  
  // Writing assistance
  getWordSuggestions: (word: string) => string[];
  checkGrammar: () => { issues: Array<{ type: string; message: string; position: number }> };
  
  // Version control
  createVersion: (label?: string) => void;
  getVersionHistory: () => Array<{ id: string; label: string; date: Date; content: string }>;
  restoreVersion: (versionId: string) => void;
}

const DEFAULT_PREFERENCES: EditorPreferences = {
  theme: 'default',
  fontSize: 16,
  fontFamily: 'Inter, system-ui, sans-serif',
  lineHeight: 1.6,
  isDistractionFree: false,
  isFullscreen: false,
  showWordCount: true,
  showReadingTime: true,
  wordTarget: 0,
  autoSaveEnabled: true,
  autoSaveDelay: 3000,
};

export function useEditor({
  content,
  onChange,
  onSave,
  placeholder = "Start writing...",
  preferences: initialPreferences = {},
  autoSaveDelay = 3000,
  maxLength = 100000,
}: UseEditorOptions): UseEditorReturn {
  const toast = useToast();
  
  // State
  const [preferences, setPreferences] = useState<EditorPreferences>({
    ...DEFAULT_PREFERENCES,
    ...initialPreferences,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [versions, setVersions] = useState<Array<{ 
    id: string; 
    label: string; 
    date: Date; 
    content: string; 
  }>>([]);
  
  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef(content);
  
  // TipTap Editor Configuration
  const editor = useTiptapEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: false, // Use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-cosmic-600 hover:text-cosmic-700 underline cursor-pointer transition-colors',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-50 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded',
        },
      }),
      CodeBlockLowlight.configure({
        HTMLAttributes: {
          class: 'relative rounded-lg bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-x-auto',
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ListItem,
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose space-y-2',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      Underline,
      Subscript,
      Superscript,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      WikiLinkExtension, // Custom extension for [[wiki links]]
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-6',
        style: `font-size: ${preferences.fontSize}px; font-family: ${preferences.fontFamily}; line-height: ${preferences.lineHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      contentRef.current = newContent;
      onChange(newContent);
      setIsDirty(true);
      
      // Track typing activity
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      
      // Auto-save
      if (preferences.autoSaveEnabled) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveContent();
        }, preferences.autoSaveDelay || autoSaveDelay);
      }
    },
    onCreate: () => {
      setIsLoading(false);
    },
  });

  // Calculate editor statistics
  const stats: EditorStats | null = editor ? {
    characters: editor.storage.characterCount.characters(),
    charactersWithoutSpaces: editor.storage.characterCount.characters({ mode: 'textSize' }),
    words: editor.storage.characterCount.words(),
    paragraphs: contentRef.current.split('\n\n').filter(p => p.trim().length > 0).length,
    readingTime: Math.ceil(editor.storage.characterCount.words() / 200), // Average reading speed
    pages: Math.round((editor.storage.characterCount.words() / 250) * 10) / 10, // 250 words per page
    avgWordLength: editor.storage.characterCount.words() > 0 
      ? Math.round((editor.storage.characterCount.characters({ mode: 'textSize' }) / editor.storage.characterCount.words()) * 10) / 10
      : 0,
  } : null;

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<EditorPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      
      // Update editor styles if font preferences changed
      if (editor && (newPreferences.fontSize || newPreferences.fontFamily || newPreferences.lineHeight)) {
        const prosEl = editor.view.dom.closest('.prose');
        if (prosEl instanceof HTMLElement) {
          prosEl.style.fontSize = `${updated.fontSize}px`;
          prosEl.style.fontFamily = updated.fontFamily;
          prosEl.style.lineHeight = updated.lineHeight.toString();
        }
      }
      
      return updated;
    });
  }, [editor]);

  // Save content
  const saveContent = useCallback(async (): Promise<boolean> => {
    try {
      if (onSave) {
        await onSave();
        setIsDirty(false);
        setLastSaved(new Date());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save content');
      return false;
    }
  }, [onSave, toast]);

  // Export content in different formats
  const exportContent = useCallback((format: 'html' | 'md' | 'txt' | 'json'): string => {
    if (!editor) return '';
    
    switch (format) {
      case 'html':
        return editor.getHTML();
      case 'md':
        // Basic HTML to Markdown conversion
        return editor.getHTML()
          .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (_, level, text) => '#'.repeat(parseInt(level)) + ' ' + text + '\n\n')
          .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
          .replace(/<em>(.*?)<\/em>/g, '*$1*')
          .replace(/<code>(.*?)<\/code>/g, '`$1`')
          .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
          .replace(/<br\s*\/?>/g, '\n')
          .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
      case 'txt':
        return editor.getText();
      case 'json':
        return JSON.stringify(editor.getJSON(), null, 2);
      default:
        return editor.getHTML();
    }
  }, [editor]);

  // Import content
  const importContent = useCallback((importedContent: string, format: 'html' | 'md' | 'txt') => {
    if (!editor) return;
    
    let processedContent = importedContent;
    
    if (format === 'md') {
      // Basic Markdown to HTML conversion
      processedContent = importedContent
        .replace(/^(#{1,6})\s+(.*$)/gm, (_, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
    } else if (format === 'txt') {
      processedContent = `<p>${importedContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }
    
    editor.commands.setContent(processedContent);
    setIsDirty(true);
  }, [editor]);

  // Insert template
  const insertTemplate = useCallback((template: string) => {
    if (!editor) return;
    
    const currentPos = editor.state.selection.from;
    editor.commands.insertContentAt(currentPos, template);
    setIsDirty(true);
  }, [editor]);

  // Find and replace
  const findAndReplace = useCallback((find: string, replace: string, replaceAll = false) => {
    if (!editor) return;
    
    const content = editor.getHTML();
    const regex = new RegExp(find, replaceAll ? 'gi' : 'i');
    const newContent = content.replace(regex, replace);
    
    if (newContent !== content) {
      editor.commands.setContent(newContent);
      setIsDirty(true);
      toast.success(`${replaceAll ? 'All occurrences' : 'First occurrence'} replaced`);
    } else {
      toast.info('No matches found');
    }
  }, [editor, toast]);

  // Get word suggestions (basic implementation)
  const getWordSuggestions = useCallback((word: string): string[] => {
    // This would typically connect to a spell-check API or dictionary
    // For now, return empty array - can be enhanced with actual spell checking
    return [];
  }, []);

  // Check grammar (basic implementation)
  const checkGrammar = useCallback(() => {
    // This would typically connect to a grammar checking service
    // For now, return empty array - can be enhanced with actual grammar checking
    return { issues: [] };
  }, []);

  // Version control
  const createVersion = useCallback((label?: string) => {
    if (!editor) return;
    
    const newVersion = {
      id: Date.now().toString(),
      label: label || `Version ${versions.length + 1}`,
      date: new Date(),
      content: editor.getHTML(),
    };
    
    setVersions(prev => [newVersion, ...prev].slice(0, 50)); // Keep last 50 versions
    toast.success('Version saved');
  }, [editor, versions.length, toast]);

  const getVersionHistory = useCallback(() => {
    return versions;
  }, [versions]);

  const restoreVersion = useCallback((versionId: string) => {
    if (!editor) return;
    
    const version = versions.find(v => v.id === versionId);
    if (version) {
      editor.commands.setContent(version.content);
      setIsDirty(true);
      toast.success('Version restored');
    }
  }, [editor, versions, toast]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== contentRef.current) {
      editor.commands.setContent(content);
      contentRef.current = content;
    }
  }, [editor, content]);

  return {
    editor,
    stats,
    preferences,
    isTyping,
    isLoading,
    isDirty,
    lastSaved,
    
    // Actions
    updatePreferences,
    saveContent,
    exportContent,
    importContent,
    insertTemplate,
    findAndReplace,
    
    // Writing assistance
    getWordSuggestions,
    checkGrammar,
    
    // Version control
    createVersion,
    getVersionHistory,
    restoreVersion,
  };
}