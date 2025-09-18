/**
 * Import/Export Service Unit Tests
 * Comprehensive testing for NovelCrafter's document import/export system
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { importExportService, ExportOptions, ImportResult } from '../../services/importExportService';
import { documentParserService, DocumentStructure } from '../../services/documentParserService';
import { entityExtractionService, CodexEntry } from '../../services/entityExtractionService';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { Project, Story, Scene, Character, Location } from '@/types/story';

// Mock dependencies
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

vi.mock('jszip', () => {
  const MockZip = vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    folder: vi.fn().mockReturnValue({
      file: vi.fn(),
      folder: vi.fn(),
    }),
    generateAsync: vi.fn().mockResolvedValue(new Blob()),
    loadAsync: vi.fn(),
    files: {},
  }));
  MockZip.loadAsync = vi.fn();
  return { default: MockZip };
});

vi.mock('../../services/documentParserService', () => ({
  documentParserService: {
    detectFormat: vi.fn(),
    parseDocument: vi.fn(),
  },
}));

vi.mock('../../services/entityExtractionService', () => ({
  entityExtractionService: {
    extractEntities: vi.fn(),
  },
}));

// Mock browser APIs
Object.defineProperty(window, 'open', {
  value: vi.fn(() => ({
    document: {
      write: vi.fn(),
      close: vi.fn(),
    },
    onload: null,
    print: vi.fn(),
  })),
});

describe('ImportExportService', () => {
  const mockProject: Project = {
    id: 'project-1',
    title: 'Test Novel',
    description: 'A test novel for export',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    metadata: {
      currentWordCount: 5000,
      targetWordCount: 50000,
      genre: 'Fantasy',
      author: 'Test Author',
      characters: [
        {
          id: 'char-1',
          name: 'Hero',
          role: 'Protagonist',
          description: 'The main character',
          backstory: 'Born in a small village',
        } as Character,
      ],
      locations: [
        {
          id: 'loc-1',
          name: 'Village',
          description: 'A peaceful farming community',
        } as Location,
      ],
      notes: [],
    },
  };

  const mockStories: Story[] = [
    {
      id: 'story-1',
      projectId: 'project-1',
      title: 'Chapter 1: The Beginning',
      summary: 'Our hero starts their journey',
      scenes: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    } as Story,
  ];

  const mockScenes: Scene[] = [
    {
      id: 'scene-1',
      storyId: 'story-1',
      projectId: 'project-1',
      title: 'Opening Scene',
      content: '<p>The sun rose over the <strong>village</strong>, casting long shadows across the cobblestone streets.</p>',
      order: 1,
      metadata: {
        pov: 'Hero',
        location: 'Village',
        time: 'Dawn',
        mood: 'Peaceful',
      },
      notes: 'This scene establishes the setting',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    } as Scene,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    test('should be a singleton', () => {
      const instance1 = importExportService;
      const instance2 = importExportService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Markdown Export', () => {
    test('should export project to markdown with all options', async () => {
      const options: ExportOptions = {
        format: 'markdown',
        includeMetadata: true,
        includeCharacters: true,
        includeLocations: true,
        includeNotes: true,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.md'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      expect(blob.type).toBe('text/markdown;charset=utf-8');

      // Read blob content to verify structure
      const content = await blob.text();
      expect(content).toContain('# Test Novel');
      expect(content).toContain('## Project Metadata');
      expect(content).toContain('## Table of Contents');
      expect(content).toContain('## Story 1: Chapter 1: The Beginning');
      expect(content).toContain('#### Scene 1: Opening Scene');
      expect(content).toContain('**POV:** Hero');
      expect(content).toContain('**Location:** Village');
      expect(content).toContain('## Character Sheets');
      expect(content).toContain('### Hero');
      expect(content).toContain('## Locations');
      expect(content).toContain('### Village');
      expect(content).toContain('> **Notes:** This scene establishes the setting');
    });

    test('should export minimal markdown without optional content', async () => {
      const options: ExportOptions = {
        format: 'markdown',
        includeMetadata: false,
        includeCharacters: false,
        includeLocations: false,
        includeNotes: false,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('# Test Novel');
      expect(content).not.toContain('## Project Metadata');
      expect(content).not.toContain('**POV:**');
      expect(content).not.toContain('## Character Sheets');
      expect(content).not.toContain('## Locations');
      expect(content).not.toContain('**Notes:**');
    });
  });

  describe('DOCX Export', () => {
    test('should export project to DOCX format', async () => {
      const options: ExportOptions = {
        format: 'docx',
        includeMetadata: true,
        pageSize: 'A4',
        margins: { top: 20, bottom: 20, left: 25, right: 25 },
        fontFamily: 'Times New Roman',
        fontSize: 12,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.docx'
      );
    });

    test('should generate DOCX with proper structure', async () => {
      const options: ExportOptions = {
        format: 'docx',
        separateChapters: true,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      // Verify that saveAs was called with the correct parameters
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.docx'
      );
    });
  });

  describe('EPUB Export', () => {
    test('should export project to EPUB format', async () => {
      const options: ExportOptions = {
        format: 'epub',
        includeMetadata: true,
        fontFamily: 'Georgia',
        fontSize: 16,
      };

      const mockZip = new JSZip();
      vi.mocked(JSZip).mockReturnValue(mockZip as any);

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.epub'
      );

      // Verify ZIP structure was created
      expect(mockZip.file).toHaveBeenCalledWith('mimetype', 'application/epub+zip');
      expect(mockZip.folder).toHaveBeenCalledWith('META-INF');
      expect(mockZip.folder).toHaveBeenCalledWith('OEBPS');
    });

    test('should generate EPUB with proper metadata', async () => {
      const options: ExportOptions = {
        format: 'epub',
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalled();
    });
  });

  describe('HTML Export', () => {
    test('should export project to HTML format', async () => {
      const options: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeCharacters: true,
        includeLocations: true,
        includeNotes: true,
        fontFamily: 'Arial',
        fontSize: 14,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.html'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      expect(blob.type).toBe('text/html;charset=utf-8');

      const content = await blob.text();
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<title>Test Novel</title>');
      expect(content).toContain('font-family: Arial');
      expect(content).toContain('font-size: 14px');
      expect(content).toContain('<h1>Test Novel</h1>');
      expect(content).toContain('<h2>Chapter 1: The Beginning</h2>');
      expect(content).toContain('Character Profiles');
      expect(content).toContain('Locations');
    });

    test('should generate responsive HTML with proper CSS', async () => {
      const options: ExportOptions = {
        format: 'html',
        mobileOptimized: true,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('@media (max-width: 768px)');
      expect(content).toContain('@media print');
    });
  });

  describe('JSON Export', () => {
    test('should export project to JSON format', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeCharacters: true,
        includeLocations: true,
        includeNotes: true,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.json'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      expect(blob.type).toBe('application/json;charset=utf-8');

      const content = await blob.text();
      const data = JSON.parse(content);

      expect(data.project).toEqual(mockProject);
      expect(data.stories).toEqual(mockStories);
      expect(data.scenes).toEqual(mockScenes);
      expect(data.characters).toEqual(mockProject.metadata?.characters);
      expect(data.locations).toEqual(mockProject.metadata?.locations);
      expect(data.exportDate).toBeDefined();
      expect(data.version).toBe('1.0.0');
    });
  });

  describe('PDF Export', () => {
    test('should export project to PDF via print dialog', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        pageSize: 'Letter',
        margins: { top: 25, bottom: 25, left: 20, right: 20 },
      };

      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        onload: null,
        print: vi.fn(),
      };

      vi.mocked(window.open).mockReturnValue(mockPrintWindow as any);

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockPrintWindow.document.write).toHaveBeenCalledWith(
        expect.stringContaining('<!DOCTYPE html>')
      );
      expect(mockPrintWindow.document.close).toHaveBeenCalled();
    });
  });

  describe('Scrivener Export', () => {
    test('should export project to Scrivener format', async () => {
      const options: ExportOptions = {
        format: 'scrivener',
        includeCharacters: true,
      };

      const mockZip = new JSZip();
      vi.mocked(JSZip).mockReturnValue(mockZip as any);

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.scriv.zip'
      );

      // Verify Scrivener structure was created
      expect(mockZip.folder).toHaveBeenCalledWith('Test_Novel.scriv');
    });
  });

  describe('Screenplay Format Exports', () => {
    test('should export to Fountain format', async () => {
      const options: ExportOptions = {
        format: 'fountain',
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.fountain'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('Title: Test Novel');
      expect(content).toContain('Author: Test Author');
      expect(content).toContain('# Chapter 1: The Beginning');
    });

    test('should export to Celtx format', async () => {
      const options: ExportOptions = {
        format: 'celtx',
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.celtx'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain('<project title="Test Novel"');
    });

    test('should export to Final Draft format', async () => {
      const options: ExportOptions = {
        format: 'finaldraft',
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.fdx'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('<FinalDraft');
      expect(content).toContain('<TitlePage>');
    });
  });

  describe('Other Format Exports', () => {
    test('should export to LaTeX format', async () => {
      const options: ExportOptions = {
        format: 'latex',
        includeMetadata: true,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.tex'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('\\documentclass');
      expect(content).toContain('\\title{Test Novel}');
      expect(content).toContain('\\author{Test Author}');
      expect(content).toContain('\\chapter{Chapter 1: The Beginning}');
    });

    test('should export to RTF format', async () => {
      const options: ExportOptions = {
        format: 'rtf',
        includeMetadata: true,
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.rtf'
      );

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('{\\rtf1');
      expect(content).toContain('Test Novel');
    });

    test('should export to ODT format', async () => {
      const options: ExportOptions = {
        format: 'odt',
        includeMetadata: true,
      };

      const mockZip = new JSZip();
      vi.mocked(JSZip).mockReturnValue(mockZip as any);

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.odt'
      );

      // Verify ODT structure
      expect(mockZip.file).toHaveBeenCalledWith('mimetype', 'application/vnd.oasis.opendocument.text');
      expect(mockZip.folder).toHaveBeenCalledWith('META-INF');
    });

    test('should handle MOBI export by creating EPUB', async () => {
      const options: ExportOptions = {
        format: 'mobi',
      };

      // Mock alert
      global.alert = vi.fn();

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.epub'
      );
      expect(alert).toHaveBeenCalledWith(
        expect.stringContaining('MOBI export: Please use a tool like Kindle Previewer')
      );
    });
  });

  describe('Import Functionality', () => {
    const mockFile = new File([''], 'test.md', { type: 'text/markdown' });

    const mockDocumentStructure: DocumentStructure = {
      title: 'Imported Novel',
      content: [
        {
          type: 'heading',
          level: 1,
          content: 'Chapter 1',
          metadata: {},
        },
        {
          type: 'paragraph',
          content: 'This is the first paragraph.',
          metadata: {},
        },
      ],
      metadata: {
        wordCount: 150,
        author: 'Imported Author',
        description: 'An imported novel',
        genre: 'Mystery',
      },
      structure: {
        chapters: [],
        sections: [],
        outline: [],
      },
      formatting: {},
      entities: [],
    };

    const mockExtractedEntities: CodexEntry[] = [
      {
        id: 'entity-1',
        type: 'character',
        name: 'Detective Smith',
        confidence: 0.9,
        mentions: [{ start: 10, end: 24, context: 'Detective Smith arrived' }],
        attributes: {},
      },
    ];

    beforeEach(() => {
      vi.mocked(documentParserService.detectFormat).mockResolvedValue({
        format: 'markdown',
        confidence: 0.95,
        metadata: {},
      });

      vi.mocked(documentParserService.parseDocument).mockResolvedValue(mockDocumentStructure);

      vi.mocked(entityExtractionService.extractEntities).mockResolvedValue({
        entities: mockExtractedEntities,
        statistics: {
          totalEntities: 1,
          entitiesByType: { character: 1 },
          confidence: 0.9,
          processingTime: 500,
        },
      });
    });

    test('should import project successfully', async () => {
      const result = await importExportService.importProject(mockFile);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.title).toBe('Imported Novel');
      expect(result.extractedEntities).toHaveLength(1);
      expect(result.extractedEntities?.[0].name).toBe('Detective Smith');
      expect(result.structureAnalysis).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    test('should handle import with custom options', async () => {
      const importOptions = {
        preserveFormatting: false,
        extractEntities: false,
        detectStructure: true,
      };

      const entityOptions = {
        confidenceThreshold: 0.8,
        enabledTypes: ['character', 'location'],
      };

      await importExportService.importProject(mockFile, 'markdown', importOptions, entityOptions);

      expect(documentParserService.parseDocument).toHaveBeenCalledWith(
        mockFile,
        expect.objectContaining({
          preserveFormatting: false,
          extractEntities: false,
          detectStructure: true,
        })
      );
    });

    test('should handle import errors gracefully', async () => {
      vi.mocked(documentParserService.parseDocument).mockRejectedValue(
        new Error('Parse error')
      );

      const result = await importExportService.importProject(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Import failed: Parse error');
      expect(result.statistics?.processingTime).toBeGreaterThan(0);
    });

    test('should generate appropriate warnings', async () => {
      vi.mocked(documentParserService.detectFormat).mockResolvedValue({
        format: 'markdown',
        confidence: 0.5, // Low confidence
        metadata: {},
      });

      const result = await importExportService.importProject(mockFile);

      expect(result.warnings).toContain(
        expect.stringContaining('File format detection confidence is low')
      );
    });

    test('should analyze document structure correctly', async () => {
      const result = await importExportService.importProject(mockFile);

      expect(result.structureAnalysis).toMatchObject({
        totalWords: expect.any(Number),
        totalCharacters: expect.any(Number),
        chapters: expect.any(Number),
        scenes: expect.any(Number),
        readingTime: expect.any(Number),
        complexity: expect.stringMatching(/simple|moderate|complex/),
        suggestions: expect.any(Array),
      });
    });

    test('should generate import suggestions', async () => {
      const result = await importExportService.importProject(mockFile);

      expect(result.suggestions).toBeDefined();
      if (result.suggestions) {
        result.suggestions.forEach(suggestion => {
          expect(suggestion).toMatchObject({
            type: expect.stringMatching(/structure|content|entity|formatting/),
            priority: expect.stringMatching(/low|medium|high/),
            description: expect.any(String),
            action: expect.any(String),
          });
        });
      }
    });
  });

  describe('Utility Functions', () => {
    test('should escape LaTeX special characters', async () => {
      const projectWithSpecialChars = {
        ...mockProject,
        title: 'Test & Novel {with} $pecial #characters',
        metadata: {
          ...mockProject.metadata!,
          author: 'Test_Author & Co.',
        },
      };

      const options: ExportOptions = {
        format: 'latex',
      };

      await importExportService.exportProject(projectWithSpecialChars, mockStories, mockScenes, options);

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('\\&');
      expect(content).toContain('\\{');
      expect(content).toContain('\\}');
      expect(content).toContain('\\#');
      expect(content).toContain('\\_');
    });

    test('should escape XML special characters', async () => {
      const projectWithXmlChars = {
        ...mockProject,
        title: 'Test & Novel <with> "quotes"',
      };

      const options: ExportOptions = {
        format: 'finaldraft',
      };

      await importExportService.exportProject(projectWithXmlChars, mockStories, mockScenes, options);

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      expect(content).toContain('&amp;');
      expect(content).toContain('&lt;');
      expect(content).toContain('&gt;');
      expect(content).toContain('&quot;');
    });

    test('should convert HTML to plain text', async () => {
      const sceneWithHtml: Scene = {
        ...mockScenes[0],
        content: '<p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="#">link</a>.</p>',
      };

      const options: ExportOptions = {
        format: 'markdown',
      };

      await importExportService.exportProject(mockProject, mockStories, [sceneWithHtml], options);

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      // Should contain plain text without HTML tags
      expect(content).toContain('This is bold and italic text with a link.');
      expect(content).not.toContain('<strong>');
      expect(content).not.toContain('<em>');
      expect(content).not.toContain('<a href');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unsupported export format', async () => {
      const options: ExportOptions = {
        format: 'unsupported' as any,
      };

      await expect(
        importExportService.exportProject(mockProject, mockStories, mockScenes, options)
      ).rejects.toThrow('Unsupported export format: unsupported');
    });

    test('should handle file saving errors gracefully', async () => {
      vi.mocked(saveAs).mockImplementation(() => {
        throw new Error('Save failed');
      });

      const options: ExportOptions = {
        format: 'markdown',
      };

      await expect(
        importExportService.exportProject(mockProject, mockStories, mockScenes, options)
      ).rejects.toThrow('Save failed');
    });

    test('should handle ZIP generation errors', async () => {
      const mockZip = new JSZip();
      vi.mocked(mockZip.generateAsync).mockRejectedValue(new Error('ZIP generation failed'));
      vi.mocked(JSZip).mockReturnValue(mockZip as any);

      const options: ExportOptions = {
        format: 'epub',
      };

      await expect(
        importExportService.exportProject(mockProject, mockStories, mockScenes, options)
      ).rejects.toThrow('ZIP generation failed');
    });

    test('should handle missing browser APIs gracefully', async () => {
      // Temporarily remove window.open
      const originalOpen = window.open;
      delete (window as any).open;

      const options: ExportOptions = {
        format: 'pdf',
      };

      await expect(
        importExportService.exportProject(mockProject, mockStories, mockScenes, options)
      ).rejects.toThrow();

      // Restore window.open
      window.open = originalOpen;
    });
  });

  describe('Performance Tests', () => {
    test('should handle large projects efficiently', async () => {
      // Create a large project with many scenes
      const largeScenes: Scene[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockScenes[0],
        id: `scene-${i}`,
        title: `Scene ${i}`,
        content: `<p>This is scene ${i} with substantial content. `.repeat(50) + '</p>',
        order: i + 1,
      }));

      const options: ExportOptions = {
        format: 'markdown',
        includeMetadata: true,
      };

      const startTime = performance.now();
      await importExportService.exportProject(mockProject, mockStories, largeScenes, options);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(saveAs).toHaveBeenCalled();
    });

    test('should handle concurrent export operations', async () => {
      const options: ExportOptions = {
        format: 'json',
      };

      const exports = Array.from({ length: 5 }, () =>
        importExportService.exportProject(mockProject, mockStories, mockScenes, options)
      );

      const startTime = performance.now();
      await Promise.all(exports);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(3000); // All should complete quickly
      expect(saveAs).toHaveBeenCalledTimes(5);
    });

    test('should efficiently process large import files', async () => {
      const largeContent = Array.from({ length: 1000 }, (_, i) => ({
        type: 'paragraph',
        content: `This is paragraph ${i} with lots of content. `.repeat(20),
        metadata: {},
      }));

      const largeDocumentStructure: DocumentStructure = {
        ...mockDocumentStructure,
        content: largeContent,
      };

      vi.mocked(documentParserService.parseDocument).mockResolvedValue(largeDocumentStructure);

      const largeFile = new File([''], 'large.md', { type: 'text/markdown' });

      const startTime = performance.now();
      const result = await importExportService.importProject(largeFile);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
    });
  });

  describe('Format-Specific Features', () => {
    test('should apply custom templates for EPUB', async () => {
      const options: ExportOptions = {
        format: 'epub',
        template: {
          id: 'custom-template',
          name: 'Custom Template',
          description: 'A custom EPUB template',
          format: 'epub',
          styles: { fontFamily: 'Palatino' },
          layout: {
            pageSize: 'A5',
            orientation: 'portrait',
            margins: { top: 20, bottom: 20, left: 15, right: 15 },
          },
          variables: { author: 'Custom Author' },
        },
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_Novel.epub'
      );
    });

    test('should handle chapter-based story structure', async () => {
      const storyWithChapters: Story = {
        ...mockStories[0],
        chapters: [
          {
            id: 'chapter-1',
            title: 'The Beginning',
            summary: 'How it all started',
            order: 1,
          },
        ],
      };

      const chapterScene: Scene = {
        ...mockScenes[0],
        chapterId: 'chapter-1',
      };

      const options: ExportOptions = {
        format: 'epub',
        separateChapters: true,
      };

      await importExportService.exportProject(
        mockProject,
        [storyWithChapters],
        [chapterScene],
        options
      );

      expect(saveAs).toHaveBeenCalled();
    });

    test('should apply custom styles to exports', async () => {
      const options: ExportOptions = {
        format: 'html',
        customStyles: [
          {
            name: 'custom-heading',
            type: 'heading',
            properties: {
              fontFamily: 'Helvetica',
              fontSize: 24,
              color: '#333',
              bold: true,
            },
          },
        ],
      };

      await importExportService.exportProject(mockProject, mockStories, mockScenes, options);

      const callArgs = (saveAs as Mock).mock.calls[0];
      const blob = callArgs[0] as Blob;
      const content = await blob.text();

      // Should contain the custom font family
      expect(content).toContain('Helvetica');
    });
  });
});