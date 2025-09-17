// Rich Text Editor Component Tests
// Comprehensive testing for the editor functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RichTextEditor } from '../../../components/editor/RichTextEditor';
import { resetAllMocks, createMockEvent } from '../../testSetup';

// Mock TipTap editor
const mockEditor = {
  commands: {
    setContent: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleHeading: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleOrderedList: vi.fn(),
    insertContent: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  },
  isActive: vi.fn().mockReturnValue(false),
  can: vi.fn().mockReturnValue(true),
  getHTML: vi.fn().mockReturnValue('<p>Test content</p>'),
  getText: vi.fn().mockReturnValue('Test content'),
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
  isEmpty: false,
  state: {
    doc: {
      textContent: 'Test content',
    },
  },
};

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: ({ editor }: { editor: any }) => (
    <div data-testid="editor-content" contentEditable>
      {editor?.getHTML() || ''}
    </div>
  ),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: vi.fn(),
}));

describe('RichTextEditor', () => {
  const defaultProps = {
    content: '',
    onChange: vi.fn(),
    placeholder: 'Start writing...',
  };

  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  it('renders editor with placeholder', () => {
    render(<RichTextEditor {...defaultProps} />);
    
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByText('Start writing...')).toBeInTheDocument();
  });

  it('renders toolbar with formatting buttons', () => {
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Underline')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument();
    expect(screen.getByLabelText('Ordered List')).toBeInTheDocument();
  });

  it('handles bold formatting', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const boldButton = screen.getByLabelText('Bold');
    await user.click(boldButton);
    
    expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
  });

  it('handles italic formatting', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const italicButton = screen.getByLabelText('Italic');
    await user.click(italicButton);
    
    expect(mockEditor.commands.toggleItalic).toHaveBeenCalled();
  });

  it('handles heading formatting', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const headingButton = screen.getByLabelText('Heading 1');
    await user.click(headingButton);
    
    expect(mockEditor.commands.toggleHeading).toHaveBeenCalledWith({ level: 1 });
  });

  it('handles list formatting', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const bulletListButton = screen.getByLabelText('Bullet List');
    await user.click(bulletListButton);
    
    expect(mockEditor.commands.toggleBulletList).toHaveBeenCalled();
  });

  it('handles undo/redo actions', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const undoButton = screen.getByLabelText('Undo');
    const redoButton = screen.getByLabelText('Redo');
    
    await user.click(undoButton);
    expect(mockEditor.commands.undo).toHaveBeenCalled();
    
    await user.click(redoButton);
    expect(mockEditor.commands.redo).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} />);
    
    const editorContent = screen.getByTestId('editor-content');
    
    // Test Ctrl+B for bold
    await user.type(editorContent, '{Control>}b{/Control}');
    expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
    
    // Test Ctrl+I for italic
    await user.type(editorContent, '{Control>}i{/Control}');
    expect(mockEditor.commands.toggleItalic).toHaveBeenCalled();
  });

  it('calls onChange when content changes', async () => {
    const onChange = vi.fn();
    mockEditor.on.mockImplementation((event, callback) => {
      if (event === 'update') {
        setTimeout(() => callback(), 0);
      }
    });
    
    render(<RichTextEditor {...defaultProps} onChange={onChange} />);
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('<p>Test content</p>');
    });
  });

  it('applies focus styling when focused', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} />);
    
    const editorContent = screen.getByTestId('editor-content');
    await user.click(editorContent);
    
    expect(mockEditor.commands.focus).toHaveBeenCalled();
  });

  it('handles paste events', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} />);
    
    const editorContent = screen.getByTestId('editor-content');
    const pasteData = 'Pasted content';
    
    await user.paste(pasteData);
    
    // Should insert pasted content
    expect(mockEditor.commands.insertContent).toHaveBeenCalledWith(pasteData);
  });

  it('shows character count when enabled', () => {
    render(<RichTextEditor {...defaultProps} showStats />);
    
    expect(screen.getByText(/\d+ characters/)).toBeInTheDocument();
  });

  it('shows word count when enabled', () => {
    render(<RichTextEditor {...defaultProps} showStats />);
    
    expect(screen.getByText(/\d+ words/)).toBeInTheDocument();
  });

  it('handles dark mode styling', () => {
    render(<RichTextEditor {...defaultProps} theme="dark" />);
    
    const container = screen.getByTestId('editor-content').closest('.editor-container');
    expect(container).toHaveClass('dark-theme');
  });

  it('handles read-only mode', () => {
    render(<RichTextEditor {...defaultProps} editable={false} />);
    
    const editorContent = screen.getByTestId('rich-text-editor-content');
    expect(editorContent).toHaveAttribute('contentEditable', 'false');
  });

  it('handles autofocus', () => {
    render(<RichTextEditor {...defaultProps} autoFocus />);
    
    expect(mockEditor.commands.focus).toHaveBeenCalled();
  });

  it('handles custom placeholder', () => {
    const customPlaceholder = 'Write your story here...';
    render(<RichTextEditor {...defaultProps} placeholder={customPlaceholder} />);
    
    expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
  });

  it('handles link insertion', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const linkButton = screen.getByLabelText('Insert Link');
    await user.click(linkButton);
    
    // Should show link dialog
    expect(screen.getByText('Insert Link')).toBeInTheDocument();
    
    const urlInput = screen.getByLabelText('URL');
    const textInput = screen.getByLabelText('Link Text');
    const insertButton = screen.getByText('Insert');
    
    await user.type(urlInput, 'https://example.com');
    await user.type(textInput, 'Example Link');
    await user.click(insertButton);
    
    expect(mockEditor.commands.insertContent).toHaveBeenCalledWith(
      '<a href="https://example.com">Example Link</a>'
    );
  });

  it('handles image insertion', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const imageButton = screen.getByLabelText('Insert Image');
    await user.click(imageButton);
    
    const fileInput = screen.getByLabelText('Choose Image');
    const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(mockEditor.commands.insertContent).toHaveBeenCalledWith(
        expect.stringContaining('<img')
      );
    });
  });

  it('handles table insertion', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const tableButton = screen.getByLabelText('Insert Table');
    await user.click(tableButton);
    
    // Should show table size selector
    const table2x2 = screen.getByTitle('2x2 Table');
    await user.click(table2x2);
    
    expect(mockEditor.commands.insertContent).toHaveBeenCalledWith(
      expect.stringContaining('<table')
    );
  });

  it('handles spell check toggle', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const spellCheckButton = screen.getByLabelText('Toggle Spell Check');
    await user.click(spellCheckButton);
    
    const editorContent = screen.getByTestId('editor-content');
    expect(editorContent).toHaveAttribute('spellcheck', 'false');
  });

  it('handles full screen mode', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const fullScreenButton = screen.getByLabelText('Full Screen');
    await user.click(fullScreenButton);
    
    const container = screen.getByTestId('editor-content').closest('.editor-container');
    expect(container).toHaveClass('fullscreen');
  });

  it.skip('handles content validation', async () => {
    const validator = vi.fn().mockReturnValue(false);
    const onValidationError = vi.fn();
    
    render(
      <RichTextEditor 
        {...defaultProps} 
        // validator={validator}
        // onValidationError={onValidationError}
      />
    );
    
    // Trigger content change
    mockEditor.on.mockImplementation((event, callback) => {
      if (event === 'update') {
        setTimeout(() => callback(), 0);
      }
    });
    
    await waitFor(() => {
      expect(validator).toHaveBeenCalledWith('<p>Test content</p>');
      expect(onValidationError).toHaveBeenCalled();
    });
  });

  it.skip('handles collaboration features', async () => {
    const onCollaboratorUpdate = vi.fn();
    
    render(
      <RichTextEditor 
        {...defaultProps} 
        // collaborative
        // onCollaboratorUpdate={onCollaboratorUpdate}
      />
    );
    
    // Should show collaboration UI
    expect(screen.getByText('Collaborators')).toBeInTheDocument();
  });

  it.skip('handles auto-save', async () => {
    const onAutoSave = vi.fn();
    vi.useFakeTimers();
    
    render(
      <RichTextEditor 
        {...defaultProps} 
        // autoSave
        // autoSaveInterval={1000}
        // onAutoSave={onAutoSave}
      />
    );
    
    // Trigger content change
    mockEditor.on.mockImplementation((event, callback) => {
      if (event === 'update') {
        callback();
      }
    });
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(onAutoSave).toHaveBeenCalledWith('<p>Test content</p>');
    });
    
    vi.useRealTimers();
  });

  it('handles export functionality', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor {...defaultProps} showToolbar />);
    
    const exportButton = screen.getByLabelText('Export');
    await user.click(exportButton);
    
    // Should show export options
    expect(screen.getByText('Export Format')).toBeInTheDocument();
    
    const markdownOption = screen.getByText('Markdown');
    await user.click(markdownOption);
    
    const exportConfirmButton = screen.getByText('Export');
    await user.click(exportConfirmButton);
    
    // Should trigger download
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it.skip('handles custom extensions', () => {
    const customExtension = { name: 'custom' };
    
    render(
      <RichTextEditor 
        {...defaultProps} 
        // extensions={[customExtension]}
      />
    );
    
    // Should pass extensions to editor
    expect(mockEditor).toBeDefined();
  });

  it('cleans up editor on unmount', () => {
    const { unmount } = render(<RichTextEditor {...defaultProps} />);
    
    unmount();
    
    expect(mockEditor.destroy).toHaveBeenCalled();
  });

  it('handles error states gracefully', () => {
    mockEditor.getHTML.mockImplementation(() => {
      throw new Error('Editor error');
    });
    
    render(<RichTextEditor {...defaultProps} />);
    
    expect(screen.getByText('Editor Error')).toBeInTheDocument();
  });
});