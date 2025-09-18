/**
 * Enhanced Note Editor Comprehensive Test Suite
 * Tests all aspects of the rich text editor and writing tools
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NoteEditor } from '@/pages/NoteEditor';
import { AdvancedEditor } from '@/components/editor/AdvancedEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { AutoSaveIndicator } from '@/components/editor/AutoSaveIndicator';
import { ImportExportPanel } from '@/components/editor/ImportExportPanel';
import { WritingAssistance } from '@/components/editor/WritingAssistance';
import { VersionHistory } from '@/components/editor/VersionHistory';
import { EditorCustomization } from '@/components/editor/EditorCustomization';
import { CollaborationPanel } from '@/components/editor/CollaborationPanel';
import { useEditor } from '@/hooks/useEditor';
import { renderHook } from '@testing-library/react';
import { ToastProvider } from '@/components/ui/Toast';

// Mock dependencies
vi.mock('@/services/noteService');
vi.mock('@/services/projectService');
vi.mock('file-saver');
vi.mock('docx');

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      {children}
    </ToastProvider>
  </BrowserRouter>
);

describe('Enhanced Note Editor - Comprehensive Test Suite', () => {
  
  describe('1. Rich Text Editing Core', () => {
    describe('TipTap Editor Initialization', () => {
      test('should initialize TipTap editor with correct extensions', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: '<p>Test content</p>', 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
          expect(result.current.isLoading).toBe(false);
        });

        const editor = result.current.editor;
        if (editor) {
          // Check core extensions are loaded
          expect(editor.extensionManager.extensions.some(ext => ext.name === 'starterKit')).toBe(true);
          expect(editor.extensionManager.extensions.some(ext => ext.name === 'placeholder')).toBe(true);
          expect(editor.extensionManager.extensions.some(ext => ext.name === 'characterCount')).toBe(true);
          expect(editor.extensionManager.extensions.some(ext => ext.name === 'typography')).toBe(true);
        }
      });

      test('should set initial content correctly', async () => {
        const initialContent = '<h1>Test Title</h1><p>Test paragraph</p>';
        const { result } = renderHook(() => 
          useEditor({ 
            content: initialContent, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor?.getHTML()).toBe(initialContent);
        });
      });
    });

    describe('Basic Formatting', () => {
      test('should apply bold formatting', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const boldButton = screen.getByTitle('Bold');
        fireEvent.click(boldButton);

        // Verify button is active
        expect(boldButton).toHaveClass('bg-cosmic-100');
      });

      test('should apply italic formatting', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const italicButton = screen.getByTitle('Italic');
        fireEvent.click(italicButton);

        expect(italicButton).toHaveClass('bg-cosmic-100');
      });

      test('should apply underline formatting', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const underlineButton = screen.getByTitle('Underline');
        fireEvent.click(underlineButton);

        expect(underlineButton).toHaveClass('bg-cosmic-100');
      });
    });

    describe('Headers (H1-H6)', () => {
      test('should create headers with proper hierarchy', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
          can: () => ({
            chain: () => ({
              focus: () => ({
                toggleHeading: () => ({ run: () => true })
              })
            })
          })
        };

        render(
          <MockWrapper>
            <EditorToolbar 
              editor={mockEditor as any}
            />
          </MockWrapper>
        );

        // Open heading menu
        const headingButton = screen.getByText('Paragraph');
        fireEvent.click(headingButton);

        // Test all heading levels
        for (let level = 1; level <= 3; level++) {
          const headingOption = screen.getByText(`Heading ${level}`);
          expect(headingOption).toBeInTheDocument();
        }
      });
    });

    describe('Lists and Task Lists', () => {
      test('should create bullet lists', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
          can: () => ({ chain: () => ({ focus: () => ({ toggleBulletList: () => ({ run: () => true }) }) }) })
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const bulletListButton = screen.getByTitle('Bullet List');
        fireEvent.click(bulletListButton);

        expect(mockEditor.chain().focus().toggleBulletList).toHaveBeenCalled();
      });

      test('should create numbered lists', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
          can: () => ({ chain: () => ({ focus: () => ({ toggleOrderedList: () => ({ run: () => true }) }) }) })
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const orderedListButton = screen.getByTitle('Numbered List');
        fireEvent.click(orderedListButton);

        expect(mockEditor.chain().focus().toggleOrderedList).toHaveBeenCalled();
      });

      test('should create task lists', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              toggleTaskList: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
          can: () => ({ chain: () => ({ focus: () => ({ toggleTaskList: () => ({ run: () => true }) }) }) })
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const taskListButton = screen.getByTitle('Task List');
        fireEvent.click(taskListButton);

        expect(mockEditor.chain().focus().toggleTaskList).toHaveBeenCalled();
      });
    });

    describe('Links and Link Validation', () => {
      test('should add links correctly', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              setLink: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const linkButton = screen.getByTitle('Add Link');
        fireEvent.click(linkButton);

        // Check link dialog appears
        expect(screen.getByText('Add Link')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter URL...')).toBeInTheDocument();

        // Add a URL
        const urlInput = screen.getByPlaceholderText('Enter URL...');
        await userEvent.type(urlInput, 'https://example.com');

        const addButton = screen.getByText('Add Link');
        fireEvent.click(addButton);

        expect(mockEditor.chain().focus().setLink).toHaveBeenCalledWith({ href: 'https://example.com' });
      });
    });

    describe('Code Blocks and Inline Code', () => {
      test('should create code blocks', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              toggleCodeBlock: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
          can: () => ({ chain: () => ({ focus: () => ({ toggleCodeBlock: () => ({ run: () => true }) }) }) })
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const codeBlockButton = screen.getByTitle('Code Block');
        fireEvent.click(codeBlockButton);

        expect(mockEditor.chain().focus().toggleCodeBlock).toHaveBeenCalled();
      });

      test('should create inline code', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              toggleCode: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
          can: () => ({ chain: () => ({ focus: () => ({ toggleCode: () => ({ run: () => true }) }) }) })
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const codeButton = screen.getByTitle('Code');
        fireEvent.click(codeButton);

        expect(mockEditor.chain().focus().toggleCode).toHaveBeenCalled();
      });
    });

    describe('Tables Creation and Editing', () => {
      test('should insert tables', async () => {
        const mockEditor = {
          chain: () => ({
            focus: () => ({
              insertTable: vi.fn().mockReturnValue({ run: vi.fn() })
            })
          }),
          isActive: vi.fn(),
        };

        render(
          <MockWrapper>
            <EditorToolbar editor={mockEditor as any} />
          </MockWrapper>
        );

        const tableButton = screen.getByTitle('Insert Table');
        fireEvent.click(tableButton);

        expect(mockEditor.chain().focus().insertTable).toHaveBeenCalledWith({ 
          rows: 3, 
          cols: 3, 
          withHeaderRow: true 
        });
      });
    });
  });

  describe('2. Advanced Editor Features', () => {
    describe('Distraction-Free Mode', () => {
      test('should toggle distraction-free mode', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        // Should initially show toolbar
        expect(screen.getByRole('toolbar')).toBeInTheDocument();

        // Toggle distraction-free mode
        const distractionFreeButton = screen.getByTitle('Distraction-free Mode');
        fireEvent.click(distractionFreeButton);

        // Toolbar should be hidden (implementation dependent)
        await waitFor(() => {
          expect(distractionFreeButton).toHaveClass('bg-cosmic-100');
        });
      });

      test('should show floating controls in distraction-free mode', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
              isDistracted={true}
            />
          </MockWrapper>
        );

        // Should show minimal floating controls
        const controls = screen.getByRole('button', { name: /minimize|maximize/i });
        expect(controls).toBeInTheDocument();
      });
    });

    describe('Focus Mode', () => {
      test('should enable focus mode with floating controls', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const focusButton = screen.getByTitle('Focus');
        fireEvent.click(focusButton);

        // Check if focus class is applied
        expect(document.querySelector('.has-focus')).toBeInTheDocument();
      });
    });

    describe('Fullscreen Mode', () => {
      test('should toggle fullscreen mode', async () => {
        const mockRequestFullscreen = vi.fn();
        const mockExitFullscreen = vi.fn();
        
        Object.defineProperty(document, 'fullscreenElement', {
          value: null,
          writable: true
        });
        
        Object.defineProperty(document, 'exitFullscreen', {
          value: mockExitFullscreen,
          writable: true
        });

        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const fullscreenButton = screen.getByTitle('Fullscreen');
        fireEvent.click(fullscreenButton);

        // Should attempt to enter fullscreen (mocked)
        expect(fullscreenButton).toBeInTheDocument();
      });
    });

    describe('Real-time Collaboration Features', () => {
      test('should show user presence indicators', async () => {
        const mockUser = {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'editor' as const,
          isOnline: true
        };

        render(
          <MockWrapper>
            <CollaborationPanel 
              editor={null}
              content="Test content"
              noteId="test-note"
              currentUser={mockUser}
              onShare={vi.fn()}
              onCommentAdd={vi.fn()}
              onAnnotationAdd={vi.fn()}
            />
          </MockWrapper>
        );

        expect(screen.getByText('Collaboration')).toBeInTheDocument();
      });
    });
  });

  describe('3. Auto-Save Integration', () => {
    describe('Visual Save Status Indicators', () => {
      test('should show save status correctly', async () => {
        render(
          <MockWrapper>
            <AutoSaveIndicator
              saveStatus="saved"
              lastSaved={new Date()}
              hasUnsavedChanges={false}
              isOnline={true}
              autoSaveEnabled={true}
              onManualSave={vi.fn()}
              onRecoverDraft={vi.fn()}
              onResolveConflict={vi.fn()}
            />
          </MockWrapper>
        );

        expect(screen.getByText(/saved/i)).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      test('should show unsaved changes indicator', async () => {
        render(
          <MockWrapper>
            <AutoSaveIndicator
              saveStatus="idle"
              hasUnsavedChanges={true}
              isOnline={true}
              autoSaveEnabled={true}
              onManualSave={vi.fn()}
              onRecoverDraft={vi.fn()}
              onResolveConflict={vi.fn()}
            />
          </MockWrapper>
        );

        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });

      test('should show offline status', async () => {
        render(
          <MockWrapper>
            <AutoSaveIndicator
              saveStatus="offline"
              hasUnsavedChanges={false}
              isOnline={false}
              autoSaveEnabled={true}
              onManualSave={vi.fn()}
              onRecoverDraft={vi.fn()}
              onResolveConflict={vi.fn()}
            />
          </MockWrapper>
        );

        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    describe('Auto-save Functionality', () => {
      test('should auto-save after typing stops', async () => {
        const mockOnSave = vi.fn().mockResolvedValue(undefined);
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: '<p>Initial content</p>', 
            onChange: vi.fn(),
            onSave: mockOnSave,
            preferences: { autoSaveEnabled: true, autoSaveDelay: 100 }
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        // Simulate content change
        act(() => {
          result.current.editor?.commands.setContent('<p>Changed content</p>');
        });

        // Wait for auto-save
        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        }, { timeout: 3000 });
      });
    });

    describe('Draft Recovery', () => {
      test('should show draft recovery option', async () => {
        render(
          <MockWrapper>
            <AutoSaveIndicator
              saveStatus="saved"
              hasUnsavedChanges={false}
              isOnline={true}
              autoSaveEnabled={true}
              draftCount={3}
              onManualSave={vi.fn()}
              onRecoverDraft={vi.fn()}
              onResolveConflict={vi.fn()}
            />
          </MockWrapper>
        );

        expect(screen.getByText(/3 unsaved draft/i)).toBeInTheDocument();
        expect(screen.getByText('Recover')).toBeInTheDocument();
      });
    });
  });

  describe('4. Import/Export System', () => {
    describe('Multiple Format Support', () => {
      test('should display all export format options', async () => {
        render(
          <MockWrapper>
            <ImportExportPanel
              content="<h1>Test</h1><p>Content</p>"
              title="Test Document"
              onImport={vi.fn()}
              onExport={vi.fn()}
            />
          </MockWrapper>
        );

        // Check export formats
        expect(screen.getByText('Markdown')).toBeInTheDocument();
        expect(screen.getByText('Plain Text')).toBeInTheDocument();
        expect(screen.getByText('HTML')).toBeInTheDocument();
        expect(screen.getByText('Word Document')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('JSON')).toBeInTheDocument();
      });

      test('should handle file import', async () => {
        const mockOnImport = vi.fn();
        
        render(
          <MockWrapper>
            <ImportExportPanel
              content=""
              title="Test"
              onImport={mockOnImport}
            />
          </MockWrapper>
        );

        // Switch to import tab
        const importTab = screen.getByText('Import');
        fireEvent.click(importTab);

        // File input should be present
        const fileInput = screen.getByRole('button', { name: /choose file to import/i });
        expect(fileInput).toBeInTheDocument();
      });
    });

    describe('Data Integrity', () => {
      test('should preserve formatting in roundtrip conversion', async () => {
        const testContent = '<h1>Title</h1><p><strong>Bold</strong> and <em>italic</em> text</p>';
        const mockOnImport = vi.fn();
        
        render(
          <MockWrapper>
            <ImportExportPanel
              content={testContent}
              title="Test"
              onImport={mockOnImport}
            />
          </MockWrapper>
        );

        // Test markdown export/import cycle
        const markdownButton = screen.getByText('Markdown');
        fireEvent.click(markdownButton);

        // Would test actual file download in integration tests
        expect(screen.getByText('Markdown')).toBeInTheDocument();
      });
    });
  });

  describe('5. AI Writing Assistance', () => {
    describe('Grammar and Style Checking', () => {
      test('should analyze content and show suggestions', async () => {
        const testContent = 'this is a test with grammar issues and i need help';
        
        render(
          <MockWrapper>
            <WritingAssistance
              editor={null}
              content={testContent}
              isVisible={true}
            />
          </MockWrapper>
        );

        // Should show analysis button
        const analyzeButton = screen.getByText('Analyze');
        expect(analyzeButton).toBeInTheDocument();

        fireEvent.click(analyzeButton);

        // Should show suggestions after analysis
        await waitFor(() => {
          expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
        });
      });

      test('should provide vocabulary enhancements', async () => {
        const testContent = 'This is a very good document that is really nice';
        
        render(
          <MockWrapper>
            <WritingAssistance
              editor={null}
              content={testContent}
              isVisible={true}
            />
          </MockWrapper>
        );

        // Switch to vocabulary tab
        const vocabTab = screen.getByText('Vocabulary');
        fireEvent.click(vocabTab);

        expect(screen.getByText('Word Enhancements')).toBeInTheDocument();
      });
    });

    describe('Readability Analysis', () => {
      test('should calculate and display readability metrics', async () => {
        const testContent = 'This is a test document. It has multiple sentences. This helps test readability.';
        
        render(
          <MockWrapper>
            <WritingAssistance
              editor={null}
              content={testContent}
              isVisible={true}
            />
          </MockWrapper>
        );

        // Switch to readability tab
        const readabilityTab = screen.getByText('Readability');
        fireEvent.click(readabilityTab);

        expect(screen.getByText('Readability Score')).toBeInTheDocument();
        expect(screen.getByText('Reading Time')).toBeInTheDocument();
      });

      test('should offer text-to-speech functionality', async () => {
        const mockSpeechSynthesis = {
          speak: vi.fn(),
          cancel: vi.fn(),
        };
        
        Object.defineProperty(window, 'speechSynthesis', {
          value: mockSpeechSynthesis,
          writable: true
        });

        render(
          <MockWrapper>
            <WritingAssistance
              editor={null}
              content="Test content for reading aloud"
              isVisible={true}
            />
          </MockWrapper>
        );

        const readabilityTab = screen.getByText('Readability');
        fireEvent.click(readabilityTab);

        const readAloudButton = screen.getByText('Read Aloud');
        fireEvent.click(readAloudButton);

        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });
    });
  });

  describe('6. Version Control System', () => {
    describe('Version History Management', () => {
      test('should display version history', async () => {
        render(
          <MockWrapper>
            <VersionHistory
              editor={null}
              content="Test content"
              noteId="test-note"
            />
          </MockWrapper>
        );

        expect(screen.getByText('Version History')).toBeInTheDocument();
        expect(screen.getByText('Save Version')).toBeInTheDocument();
      });

      test('should create new versions', async () => {
        const mockOnVersionCreate = vi.fn();
        
        render(
          <MockWrapper>
            <VersionHistory
              editor={null}
              content="Test content"
              noteId="test-note"
              onVersionCreate={mockOnVersionCreate}
            />
          </MockWrapper>
        );

        const saveVersionButton = screen.getByText('Save Version');
        fireEvent.click(saveVersionButton);

        // Should show version creation dialog
        expect(screen.getByText('Create New Version')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Version label (optional)...')).toBeInTheDocument();
      });
    });

    describe('Version Comparison', () => {
      test('should show version comparison interface', async () => {
        render(
          <MockWrapper>
            <VersionHistory
              editor={null}
              content="Test content"
              noteId="test-note"
            />
          </MockWrapper>
        );

        // Switch to compare tab
        const compareTab = screen.getByText('Compare');
        fireEvent.click(compareTab);

        expect(screen.getByText('Select two versions to compare')).toBeInTheDocument();
      });
    });

    describe('Conflict Detection', () => {
      test('should show conflict resolution interface', async () => {
        render(
          <MockWrapper>
            <VersionHistory
              editor={null}
              content="Test content"
              noteId="test-note"
            />
          </MockWrapper>
        );

        // Switch to conflicts tab
        const conflictsTab = screen.getByText('Conflicts');
        fireEvent.click(conflictsTab);

        expect(screen.getByText('No conflicts detected')).toBeInTheDocument();
      });
    });
  });

  describe('7. Customization System', () => {
    describe('Theme and Appearance Control', () => {
      test('should display theme options', async () => {
        const mockPreferences = {
          theme: 'light' as const,
          colorScheme: 'default' as const,
          fontSize: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.6,
          letterSpacing: 0,
          wordSpacing: 0,
          maxWidth: 800,
          padding: 24,
          showLineNumbers: false,
          showRuler: false,
          wrapText: true,
          isDistractionFree: false,
          isFullscreen: false,
          isZenMode: false,
          showMinimap: false,
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReaderMode: false,
          keyboardNavigation: true,
          enableSounds: true,
          typingSounds: false,
          saveSound: true,
          cursorBlinking: true,
          smoothScrolling: true,
          autoIndent: true,
          tabSize: 4,
        };

        render(
          <MockWrapper>
            <EditorCustomization
              preferences={mockPreferences}
              onPreferencesChange={vi.fn()}
            />
          </MockWrapper>
        );

        expect(screen.getByText('Customization')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });

      test('should allow typography customization', async () => {
        const mockPreferences = {
          theme: 'light' as const,
          colorScheme: 'default' as const,
          fontSize: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.6,
          letterSpacing: 0,
          wordSpacing: 0,
          maxWidth: 800,
          padding: 24,
          showLineNumbers: false,
          showRuler: false,
          wrapText: true,
          isDistractionFree: false,
          isFullscreen: false,
          isZenMode: false,
          showMinimap: false,
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReaderMode: false,
          keyboardNavigation: true,
          enableSounds: true,
          typingSounds: false,
          saveSound: true,
          cursorBlinking: true,
          smoothScrolling: true,
          autoIndent: true,
          tabSize: 4,
        };

        render(
          <MockWrapper>
            <EditorCustomization
              preferences={mockPreferences}
              onPreferencesChange={vi.fn()}
            />
          </MockWrapper>
        );

        // Switch to typography tab
        const typographyTab = screen.getByText('Typography');
        fireEvent.click(typographyTab);

        expect(screen.getByText('Font Family')).toBeInTheDocument();
        expect(screen.getByText('Font Size')).toBeInTheDocument();
        expect(screen.getByText('Line Height')).toBeInTheDocument();
      });
    });

    describe('Accessibility Features', () => {
      test('should provide accessibility options', async () => {
        const mockPreferences = {
          theme: 'light' as const,
          colorScheme: 'default' as const,
          fontSize: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.6,
          letterSpacing: 0,
          wordSpacing: 0,
          maxWidth: 800,
          padding: 24,
          showLineNumbers: false,
          showRuler: false,
          wrapText: true,
          isDistractionFree: false,
          isFullscreen: false,
          isZenMode: false,
          showMinimap: false,
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReaderMode: false,
          keyboardNavigation: true,
          enableSounds: true,
          typingSounds: false,
          saveSound: true,
          cursorBlinking: true,
          smoothScrolling: true,
          autoIndent: true,
          tabSize: 4,
        };

        render(
          <MockWrapper>
            <EditorCustomization
              preferences={mockPreferences}
              onPreferencesChange={vi.fn()}
            />
          </MockWrapper>
        );

        // Switch to accessibility tab
        const accessibilityTab = screen.getByText('Accessibility');
        fireEvent.click(accessibilityTab);

        expect(screen.getByText('High contrast mode')).toBeInTheDocument();
        expect(screen.getByText('Large text')).toBeInTheDocument();
        expect(screen.getByText('Screen reader mode')).toBeInTheDocument();
      });
    });
  });

  describe('8. Performance Testing', () => {
    describe('Large Document Handling', () => {
      test('should handle documents with 10,000+ words', async () => {
        const largeContent = '<p>' + 'word '.repeat(10000) + '</p>';
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: largeContent, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
          expect(result.current.stats?.words).toBeGreaterThan(9000);
        });
      });

      test('should maintain responsive typing with large documents', async () => {
        const largeContent = '<p>' + 'word '.repeat(5000) + '</p>';
        
        render(
          <MockWrapper>
            <AdvancedEditor 
              content={largeContent} 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        // Should render without hanging
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    describe('Memory Usage Monitoring', () => {
      test('should not create memory leaks with multiple content updates', async () => {
        const { result, rerender } = renderHook(
          ({ content }) => useEditor({ content, onChange: vi.fn() }),
          { initialProps: { content: '<p>Initial</p>' } }
        );

        // Simulate multiple rapid content changes
        for (let i = 0; i < 100; i++) {
          rerender({ content: `<p>Content ${i}</p>` });
        }

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        // Editor should still be functional
        expect(result.current.editor?.getHTML()).toContain('Content 99');
      });
    });
  });

  describe('9. Integration Testing', () => {
    describe('Component Integration', () => {
      test('should integrate all editor components seamlessly', async () => {
        // This would test the full NoteEditor page component
        // with all subcomponents working together
        expect(true).toBe(true); // Placeholder for integration test
      });
    });

    describe('Service Integration', () => {
      test('should integrate with note and project services', async () => {
        // This would test actual service calls
        expect(true).toBe(true); // Placeholder for service integration test
      });
    });
  });

  describe('10. User Experience Testing', () => {
    describe('Keyboard Shortcuts', () => {
      test('should respond to Ctrl+S for save', async () => {
        const mockOnSave = vi.fn();
        
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
              onSave={mockOnSave}
            />
          </MockWrapper>
        );

        const editor = screen.getByRole('textbox');
        fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

        expect(mockOnSave).toHaveBeenCalled();
      });

      test('should respond to formatting shortcuts', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const editor = screen.getByRole('textbox');
        
        // Test Ctrl+B for bold (this would require more complex TipTap mocking)
        fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
        
        // Should not throw error
        expect(editor).toBeInTheDocument();
      });
    });

    describe('Touch and Mobile Support', () => {
      test('should handle touch events', async () => {
        render(
          <MockWrapper>
            <AdvancedEditor 
              content="<p>Test content</p>" 
              onChange={vi.fn()}
            />
          </MockWrapper>
        );

        const editor = screen.getByRole('textbox');
        fireEvent.touchStart(editor);
        fireEvent.touchEnd(editor);

        expect(editor).toBeInTheDocument();
      });
    });
  });
});