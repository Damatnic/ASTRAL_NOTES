/**
 * TipTap React Mock
 * Comprehensive mock for @tiptap/react to enable editor testing
 */

import { vi } from 'vitest';
import React from 'react';

export const Editor = vi.fn().mockImplementation(() => ({
  commands: {
    setContent: vi.fn(),
    insertContent: vi.fn(),
    setTextSelection: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    setBold: vi.fn(),
    setItalic: vi.fn(),
    setUnderline: vi.fn(),
    setStrike: vi.fn(),
    setCode: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleStrike: vi.fn(),
    toggleCode: vi.fn(),
    toggleHeading: vi.fn(),
    setParagraph: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleTaskList: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleBlockquote: vi.fn(),
    setHorizontalRule: vi.fn(),
    setHardBreak: vi.fn(),
    setLink: vi.fn(),
    unsetLink: vi.fn(),
    setImage: vi.fn(),
    setTable: vi.fn(),
    deleteTable: vi.fn(),
    addRowBefore: vi.fn(),
    addRowAfter: vi.fn(),
    deleteRow: vi.fn(),
    addColumnBefore: vi.fn(),
    addColumnAfter: vi.fn(),
    deleteColumn: vi.fn(),
    setTextAlign: vi.fn(),
    setColor: vi.fn(),
    setHighlight: vi.fn(),
    toggleHighlight: vi.fn(),
    setFontFamily: vi.fn(),
    selectAll: vi.fn(),
    clearContent: vi.fn(),
  },
  state: {
    doc: {
      content: [],
      textContent: 'Mock content',
    },
    selection: {
      from: 0,
      to: 0,
      empty: true,
    },
  },
  view: {
    dom: document.createElement('div'),
    dispatch: vi.fn(),
  },
  schema: {},
  isActive: vi.fn().mockReturnValue(false),
  isEditable: true,
  isFocused: false,
  isEmpty: false,
  can: () => ({
    setBold: vi.fn().mockReturnValue(true),
    setItalic: vi.fn().mockReturnValue(true),
    undo: vi.fn().mockReturnValue(true),
    redo: vi.fn().mockReturnValue(true),
    toggleHighlight: vi.fn().mockReturnValue(true),
    toggleBold: vi.fn().mockReturnValue(true),
    toggleItalic: vi.fn().mockReturnValue(true),
    toggleUnderline: vi.fn().mockReturnValue(true),
    chain: vi.fn().mockReturnValue({
      focus: vi.fn().mockReturnValue({
        toggleHighlight: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleBold: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleItalic: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleUnderline: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        undo: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        redo: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleHeading: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        setParagraph: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleBulletList: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleOrderedList: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleTaskList: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        setLink: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        insertTable: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleCodeBlock: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        toggleCode: vi.fn().mockReturnValue({
          run: vi.fn()
        }),
        run: vi.fn()
      })
    })
  }),
  chain: () => ({
    focus: vi.fn().mockReturnValue({
      toggleHighlight: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleBold: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleItalic: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleUnderline: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      undo: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      redo: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleHeading: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      setParagraph: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleBulletList: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleOrderedList: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleTaskList: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      setLink: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      insertTable: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleCodeBlock: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      toggleCode: vi.fn().mockReturnValue({
        run: vi.fn()
      }),
      run: vi.fn()
    })
  }),
  getHTML: vi.fn().mockReturnValue('<p>Mock HTML content</p>'),
  getText: vi.fn().mockReturnValue('Mock text content'),
  getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
  getCharacterCount: vi.fn().mockReturnValue(100),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));

export const useEditor = vi.fn().mockImplementation((options = {}) => {
  const mockEditor = new Editor();
  
  // Apply any content from options
  if (options.content) {
    mockEditor.getHTML = vi.fn().mockReturnValue(options.content);
    mockEditor.getText = vi.fn().mockReturnValue(
      options.content.replace(/<[^>]*>/g, '')
    );
  }

  // Mock onChange handler
  if (options.onChange) {
    mockEditor.on = vi.fn().mockImplementation((event, callback) => {
      if (event === 'update') {
        // Simulate onChange calls
        setTimeout(() => {
          callback({ editor: mockEditor });
        }, 0);
      }
    });
  }

  return mockEditor;
});

export const EditorContent = vi.fn().mockImplementation(({ editor, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'editor-content',
    contentEditable: true,
    suppressContentEditableWarning: true,
    ...props,
  }, editor?.getHTML?.() || 'Mock editor content');
});

export const FloatingMenu = vi.fn().mockImplementation(({ children, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'floating-menu',
    ...props,
  }, children);
});

export const BubbleMenu = vi.fn().mockImplementation(({ children, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'bubble-menu',
    ...props,
  }, children);
});

export const NodeViewWrapper = vi.fn().mockImplementation(({ children, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'node-view-wrapper',
    ...props,
  }, children);
});

export const NodeViewContent = vi.fn().mockImplementation((props) => {
  return React.createElement('div', {
    'data-testid': 'node-view-content',
    ...props,
  });
});

// Export default
export default {
  Editor,
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
  NodeViewWrapper,
  NodeViewContent,
};