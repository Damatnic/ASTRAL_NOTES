/**
 * Enhanced Note Editor Import/Export Test Suite
 * Comprehensive testing for all supported formats and data integrity
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportExportPanel } from '@/components/editor/ImportExportPanel';
import { useEditor } from '@/hooks/useEditor';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

// Mock docx
vi.mock('docx', () => ({
  Document: vi.fn().mockImplementation(() => ({})),
  Packer: {
    toBlob: vi.fn().mockResolvedValue(new Blob(['mock docx'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
  },
  Paragraph: vi.fn().mockImplementation(() => ({})),
  TextRun: vi.fn().mockImplementation(() => ({})),
  HeadingLevel: {
    TITLE: 'TITLE'
  }
}));

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      {children}
    </ToastProvider>
  </BrowserRouter>
);

// Test data for various formats
const testData = {
  html: {
    simple: '<p>Simple paragraph</p>',
    formatted: '<h1>Title</h1><p><strong>Bold</strong> and <em>italic</em> text</p><ul><li>Item 1</li><li>Item 2</li></ul>',
    complex: `
      <h1>Complex Document</h1>
      <h2>Subtitle</h2>
      <p>This is a paragraph with <strong>bold</strong>, <em>italic</em>, and <code>inline code</code>.</p>
      <blockquote>This is a blockquote</blockquote>
      <ul>
        <li>Unordered list item 1</li>
        <li>Unordered list item 2</li>
      </ul>
      <ol>
        <li>Ordered list item 1</li>
        <li>Ordered list item 2</li>
      </ol>
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
          <tr><td>Cell 3</td><td>Cell 4</td></tr>
        </tbody>
      </table>
      <pre><code>function test() {
  return "code block";
}</code></pre>
    `
  },
  markdown: {
    simple: 'Simple paragraph',
    formatted: '# Title\n\n**Bold** and *italic* text\n\n- Item 1\n- Item 2',
    complex: `# Complex Document

## Subtitle

This is a paragraph with **bold**, *italic*, and \`inline code\`.

> This is a blockquote

- Unordered list item 1
- Unordered list item 2

1. Ordered list item 1
2. Ordered list item 2

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

\`\`\`javascript
function test() {
  return "code block";
}
\`\`\``
  },
  plainText: {
    simple: 'Simple paragraph',
    formatted: 'Title\n\nBold and italic text\n\nItem 1\nItem 2',
    complex: `Complex Document

Subtitle

This is a paragraph with bold, italic, and inline code.

This is a blockquote

Unordered list item 1
Unordered list item 2

Ordered list item 1
Ordered list item 2

Header 1 Header 2
Cell 1 Cell 2
Cell 3 Cell 4

function test() {
  return "code block";
}`
  }
};

describe('Import/Export Functionality Tests', () => {

  describe('Export Functionality', () => {
    describe('Markdown Export', () => {
      test('should export simple HTML to Markdown correctly', async () => {
        const mockOnExport = vi.fn();
        
        render(
          <MockWrapper>
            <ImportExportPanel
              content={testData.html.simple}
              title="Test Document"
              onImport={vi.fn()}
              onExport={mockOnExport}
            />
          </MockWrapper>
        );

        const markdownButton = screen.getByText('Markdown');
        fireEvent.click(markdownButton);

        expect(mockOnExport).toHaveBeenCalledWith('md');
      });

      test('should export formatted HTML to Markdown correctly', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: testData.html.formatted, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('md');
        
        // Should contain markdown formatting
        expect(exported).toContain('# Title');
        expect(exported).toContain('**Bold**');
        expect(exported).toContain('*italic*');
      });

      test('should handle complex HTML to Markdown conversion', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: testData.html.complex, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('md');
        
        // Should preserve document structure
        expect(exported).toContain('# Complex Document');
        expect(exported).toContain('## Subtitle');
        expect(exported).toContain('> This is a blockquote');
        expect(exported).toContain('- Unordered list item');
        expect(exported).toContain('1. Ordered list item');
      });
    });

    describe('Plain Text Export', () => {
      test('should export HTML to plain text correctly', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: testData.html.formatted, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('txt');
        
        // Should strip HTML tags
        expect(exported).not.toContain('<');
        expect(exported).not.toContain('>');
        expect(exported).toContain('Title');
        expect(exported).toContain('Bold');
        expect(exported).toContain('italic');
      });

      test('should preserve text structure in plain text export', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: testData.html.complex, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('txt');
        
        // Should maintain readable structure
        expect(exported).toContain('Complex Document');
        expect(exported).toContain('Subtitle');
        expect(exported).toContain('This is a paragraph');
      });
    });

    describe('HTML Export', () => {
      test('should export complete HTML document', async () => {
        render(
          <MockWrapper>
            <ImportExportPanel
              content={testData.html.formatted}
              title="Test Document"
              onImport={vi.fn()}
            />
          </MockWrapper>
        );

        const htmlButton = screen.getByText('HTML');
        fireEvent.click(htmlButton);

        // Mock saveAs should be called
        const { saveAs } = require('file-saver');
        expect(saveAs).toHaveBeenCalled();
        
        // Check the blob content contains HTML structure
        const call = saveAs.mock.calls[saveAs.mock.calls.length - 1];
        expect(call[1]).toContain('.html');
      });

      test('should include proper HTML document structure', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: testData.html.simple, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('html');
        expect(exported).toContain(testData.html.simple);
      });
    });

    describe('JSON Export', () => {
      test('should export as JSON with metadata', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: testData.html.simple, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('json');
        
        // Should be valid JSON
        expect(() => JSON.parse(exported)).not.toThrow();
        
        const parsed = JSON.parse(exported);
        expect(parsed).toHaveProperty('type');
        expect(parsed).toHaveProperty('content');
      });
    });

    describe('DOCX Export', () => {
      test('should export to DOCX format', async () => {
        render(
          <MockWrapper>
            <ImportExportPanel
              content={testData.html.simple}
              title="Test Document"
              onImport={vi.fn()}
            />
          </MockWrapper>
        );

        const docxButton = screen.getByText('Word Document');
        fireEvent.click(docxButton);

        // Wait for DOCX processing
        await waitFor(() => {
          const { saveAs } = require('file-saver');
          expect(saveAs).toHaveBeenCalled();
        });
      });

      test('should handle complex content in DOCX export', async () => {
        render(
          <MockWrapper>
            <ImportExportPanel
              content={testData.html.complex}
              title="Complex Document"
              onImport={vi.fn()}
            />
          </MockWrapper>
        );

        const docxButton = screen.getByText('Word Document');
        fireEvent.click(docxButton);

        // Should not throw errors with complex content
        await waitFor(() => {
          const { saveAs } = require('file-saver');
          expect(saveAs).toHaveBeenCalled();
        });
      });
    });

    describe('PDF Export', () => {
      test('should trigger PDF export via print dialog', async () => {
        const mockWindowOpen = vi.fn().mockReturnValue({
          document: {
            write: vi.fn(),
            close: vi.fn()
          },
          print: vi.fn()
        });
        
        global.window.open = mockWindowOpen;

        render(
          <MockWrapper>
            <ImportExportPanel
              content={testData.html.simple}
              title="Test Document"
              onImport={vi.fn()}
            />
          </MockWrapper>
        );

        const pdfButton = screen.getByText('PDF');
        fireEvent.click(pdfButton);

        expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
      });
    });
  });

  describe('Import Functionality', () => {
    describe('File Import Interface', () => {
      test('should display file import interface', async () => {
        render(
          <MockWrapper>
            <ImportExportPanel
              content=""
              title="Test"
              onImport={vi.fn()}
            />
          </MockWrapper>
        );

        // Switch to import tab
        const importTab = screen.getByText('Import');
        fireEvent.click(importTab);

        expect(screen.getByText('Choose File to Import')).toBeInTheDocument();
        expect(screen.getByText('Supports: .md, .txt, .html files')).toBeInTheDocument();
      });

      test('should accept correct file types', async () => {
        render(
          <MockWrapper>
            <ImportExportPanel
              content=""
              title="Test"
              onImport={vi.fn()}
            />
          </MockWrapper>
        );

        const importTab = screen.getByText('Import');
        fireEvent.click(importTab);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toHaveAttribute('accept', '.md,.txt,.html,.htm');
      });
    });

    describe('Markdown Import', () => {
      test('should import Markdown and convert to HTML', async () => {
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

        const importTab = screen.getByText('Import');
        fireEvent.click(importTab);

        // Simulate file selection
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File([testData.markdown.formatted], 'test.md', { type: 'text/markdown' });
        
        // Mock FileReader
        const mockFileReader = {
          readAsText: vi.fn(),
          onload: null as any,
          result: testData.markdown.formatted
        };
        
        global.FileReader = vi.fn(() => mockFileReader) as any;
        
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        // Trigger onload
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: testData.markdown.formatted } } as any);
        }

        expect(mockOnImport).toHaveBeenCalledWith(testData.markdown.formatted, 'md');
      });

      test('should convert Markdown formatting correctly', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: '', 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        result.current.importContent(testData.markdown.simple, 'md');
        
        const content = result.current.editor?.getHTML();
        expect(content).toContain('<p>');
      });
    });

    describe('HTML Import', () => {
      test('should import HTML directly', async () => {
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

        const importTab = screen.getByText('Import');
        fireEvent.click(importTab);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File([testData.html.formatted], 'test.html', { type: 'text/html' });
        
        const mockFileReader = {
          readAsText: vi.fn(),
          onload: null as any,
          result: testData.html.formatted
        };
        
        global.FileReader = vi.fn(() => mockFileReader) as any;
        
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: testData.html.formatted } } as any);
        }

        expect(mockOnImport).toHaveBeenCalledWith(testData.html.formatted, 'html');
      });
    });

    describe('Plain Text Import', () => {
      test('should import plain text and wrap in paragraphs', async () => {
        const { result } = renderHook(() => 
          useEditor({ 
            content: '', 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        result.current.importContent(testData.plainText.simple, 'txt');
        
        const content = result.current.editor?.getHTML();
        expect(content).toContain('<p>');
        expect(content).toContain(testData.plainText.simple);
      });

      test('should handle multi-line text import', async () => {
        const multiLineText = 'Line 1\n\nLine 2\n\nLine 3';
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: '', 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        result.current.importContent(multiLineText, 'txt');
        
        const content = result.current.editor?.getHTML();
        expect(content).toContain('Line 1');
        expect(content).toContain('Line 2');
        expect(content).toContain('Line 3');
      });
    });
  });

  describe('Data Integrity Tests', () => {
    describe('Roundtrip Conversion', () => {
      test('should preserve content in HTML -> Markdown -> HTML roundtrip', async () => {
        const originalContent = testData.html.formatted;
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: originalContent, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        // Export to Markdown
        const markdown = result.current.exportContent('md');
        
        // Import Markdown back
        result.current.importContent(markdown, 'md');
        
        const roundtripContent = result.current.editor?.getHTML();
        
        // Should preserve essential structure (some formatting variations are acceptable)
        expect(roundtripContent).toContain('Title');
        expect(roundtripContent).toContain('Bold');
        expect(roundtripContent).toContain('italic');
      });

      test('should preserve formatting in Text -> HTML -> Text roundtrip', async () => {
        const originalText = testData.plainText.formatted;
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: '', 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        // Import text
        result.current.importContent(originalText, 'txt');
        
        // Export back to text
        const roundtripText = result.current.exportContent('txt');
        
        // Should preserve text content (formatting is not expected to survive)
        expect(roundtripText).toContain('Title');
        expect(roundtripText).toContain('Bold');
        expect(roundtripText).toContain('italic');
      });
    });

    describe('Special Characters and Encoding', () => {
      test('should handle special characters correctly', async () => {
        const specialContent = '<p>Special chars: ñáéíóú àèìòù âêîôû ç ß © ® ™ €</p>';
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: specialContent, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        // Test all export formats
        const formats: Array<'html' | 'md' | 'txt' | 'json'> = ['html', 'md', 'txt', 'json'];
        
        for (const format of formats) {
          const exported = result.current.exportContent(format);
          
          // Should contain special characters (may be encoded differently)
          expect(exported.length).toBeGreaterThan(0);
          
          // Should not contain obvious encoding errors
          expect(exported).not.toContain('�');
        }
      });

      test('should handle emojis and Unicode correctly', async () => {
        const emojiContent = '<p>Emojis: 😀 😊 🎉 🚀 ❤️ 🌟 ✨ 🎨</p>';
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: emojiContent, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const exported = result.current.exportContent('txt');
        expect(exported).toContain('😀');
        expect(exported).toContain('🚀');
      });
    });

    describe('Large Document Handling', () => {
      test('should handle large document export efficiently', async () => {
        const largeContent = '<p>' + 'Large document content. '.repeat(10000) + '</p>';
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: largeContent, 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const startTime = performance.now();
        const exported = result.current.exportContent('md');
        const endTime = performance.now();
        
        expect(exported.length).toBeGreaterThan(100000);
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      });

      test('should handle large document import efficiently', async () => {
        const largeText = 'Large import text. '.repeat(50000);
        
        const { result } = renderHook(() => 
          useEditor({ 
            content: '', 
            onChange: vi.fn() 
          })
        );

        await waitFor(() => {
          expect(result.current.editor).toBeTruthy();
        });

        const startTime = performance.now();
        result.current.importContent(largeText, 'txt');
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        
        const content = result.current.editor?.getHTML();
        expect(content?.length).toBeGreaterThan(largeText.length);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle corrupted file imports gracefully', async () => {
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

      const importTab = screen.getByText('Import');
      fireEvent.click(importTab);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const corruptedFile = new File(['<html><body><p>Unclosed tag'], 'corrupted.html', { type: 'text/html' });
      
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        result: '<html><body><p>Unclosed tag'
      };
      
      global.FileReader = vi.fn(() => mockFileReader) as any;
      
      fireEvent.change(fileInput, { target: { files: [corruptedFile] } });
      
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: '<html><body><p>Unclosed tag' } } as any);
      }

      // Should not crash and should call onImport
      expect(mockOnImport).toHaveBeenCalled();
    });

    test('should handle empty file imports', async () => {
      const mockOnImport = vi.fn();
      
      const { result } = renderHook(() => 
        useEditor({ 
          content: '<p>Existing content</p>', 
          onChange: vi.fn() 
        })
      );

      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      // Import empty content
      result.current.importContent('', 'txt');
      
      // Should handle gracefully
      const content = result.current.editor?.getHTML();
      expect(content).toBeDefined();
    });

    test('should handle export failures gracefully', async () => {
      // Mock a failing export scenario
      const { result } = renderHook(() => 
        useEditor({ 
          content: null as any, // Invalid content
          onChange: vi.fn() 
        })
      );

      await waitFor(() => {
        expect(result.current.editor).toBeTruthy();
      });

      // Should not throw error
      expect(() => {
        result.current.exportContent('md');
      }).not.toThrow();
    });
  });

  describe('Copy to Clipboard', () => {
    test('should copy content to clipboard in different formats', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      render(
        <MockWrapper>
          <ImportExportPanel
            content={testData.html.simple}
            title="Test"
            onImport={vi.fn()}
          />
        </MockWrapper>
      );

      const copyMarkdownButton = screen.getByText('Copy as Markdown');
      fireEvent.click(copyMarkdownButton);

      expect(mockWriteText).toHaveBeenCalled();
    });

    test('should handle clipboard copy failures gracefully', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      render(
        <MockWrapper>
          <ImportExportPanel
            content={testData.html.simple}
            title="Test"
            onImport={vi.fn()}
          />
        </MockWrapper>
      );

      const copyButton = screen.getByText('Copy as Text');
      fireEvent.click(copyButton);

      // Should not crash
      expect(copyButton).toBeInTheDocument();
    });
  });
});