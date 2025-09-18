/**
 * RichTextEditor Component
 * A comprehensive rich text editor built with TipTap for ASTRAL_NOTES
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { EditorToolbar } from './EditorToolbar';
import { EditorStats } from './EditorStats';
import type { EditorState, EditorAction } from '../../types';

export interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  showToolbar?: boolean;
  showStats?: boolean;
  maxLength?: number;
  className?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  theme?: 'light' | 'dark';
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  onSave,
  placeholder = 'Start writing...',
  editable = true,
  showToolbar = true,
  showStats = true,
  maxLength,
  className = '',
  autoFocus = false,
  onFocus,
  onBlur,
  theme = 'light'
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    content,
    wordCount: 0,
    characterCount: 0,
    isModified: false
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      
      const newState: EditorState = {
        content: html,
        wordCount: words,
        characterCount: text.length,
        isModified: html !== content,
        lastSaved: editorState.lastSaved
      };

      setEditorState(newState);
      onChange?.(html);

      // Auto-save after 2 seconds of inactivity
      if (onSave && newState.isModified) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          handleSave(html);
        }, 2000);
      }
    },
    onFocus: () => {
      onFocus?.();
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  const handleSave = useCallback(async (contentToSave?: string) => {
    if (!onSave || !editor) return;

    const saveContent = contentToSave || editor.getHTML();
    setIsSaving(true);

    try {
      await onSave(saveContent);
      setEditorState(prev => ({
        ...prev,
        isModified: false,
        lastSaved: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editor]);

  const handleAction = useCallback((action: EditorAction) => {
    if (!editor) return;

    switch (action.type) {
      case 'BOLD':
        editor.chain().focus().toggleBold().run();
        break;
      case 'ITALIC':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'UNDERLINE':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'STRIKETHROUGH':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'HEADING':
        const level = action.payload?.level || 1;
        editor.chain().focus().toggleHeading({ level }).run();
        break;
      case 'LINK':
        const url = action.payload?.url;
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        } else {
          editor.chain().focus().unsetLink().run();
        }
        break;
      case 'IMAGE':
        const src = action.payload?.src;
        const alt = action.payload?.alt || '';
        if (src) {
          editor.chain().focus().setImage({ src, alt }).run();
        }
        break;
      case 'LIST':
        const listType = action.payload?.type || 'bullet';
        if (listType === 'bullet') {
          editor.chain().focus().toggleBulletList().run();
        } else {
          editor.chain().focus().toggleOrderedList().run();
        }
        break;
      case 'QUOTE':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'CODE':
        if (action.payload?.block) {
          editor.chain().focus().toggleCodeBlock().run();
        } else {
          editor.chain().focus().toggleCode().run();
        }
        break;
    }
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S for save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const editorClasses = `
    prose prose-lg max-w-none
    ${theme === 'dark' ? 'prose-invert' : ''}
    ${className}
  `.trim();

  return (
    <div className="rich-text-editor flex flex-col h-full">
      {showToolbar && (
        <EditorToolbar
          editor={editor}
          onAction={handleAction}
          isEditable={editable}
          theme={theme}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4" data-testid="rich-text-editor">
          <EditorContent
            editor={editor}
            className={editorClasses}
            data-testid="rich-text-editor-content"
          />
        </div>

        {showStats && (
          <EditorStats
            wordCount={editorState.wordCount}
            characterCount={editorState.characterCount}
            isModified={editorState.isModified}
            isSaving={isSaving}
            lastSaved={editorState.lastSaved}
            maxLength={maxLength}
            theme={theme}
          />
        )}
      </div>

      {/* Character limit warning */}
      {maxLength && editorState.characterCount > maxLength * 0.9 && (
        <div className={`
          px-4 py-2 text-sm border-t
          ${editorState.characterCount >= maxLength
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }
        `}>
          {editorState.characterCount >= maxLength
            ? `Character limit exceeded (${editorState.characterCount}/${maxLength})`
            : `Approaching character limit (${editorState.characterCount}/${maxLength})`
          }
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;