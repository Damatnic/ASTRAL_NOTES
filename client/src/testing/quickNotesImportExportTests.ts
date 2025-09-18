/**
 * Quick Notes Import/Export Test Suite
 * Comprehensive testing for import/export functionality across different formats
 */

import { quickNotesService, QuickNote } from '@/services/quickNotesService';
import { quickNotesTestDataGenerator } from './quickNotesTestDataGenerator';

interface ImportExportTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface ImportExportTestSuite {
  suiteName: string;
  results: ImportExportTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class QuickNotesImportExportTestSuite {
  private results: ImportExportTestResult[] = [];
  private originalData: QuickNote[] = [];

  /**
   * Run all import/export tests
   */
  public async runAllTests(): Promise<ImportExportTestSuite> {
    console.log('📁 Starting Quick Notes Import/Export Test Suite...');
    
    // Backup existing data
    this.backupData();
    
    try {
      await this.runExportTests();
      await this.runImportTests();
      await this.runFormatValidationTests();
      await this.runDataIntegrityTests();
      await this.runErrorHandlingTests();
      await this.runPerformanceTests();
      
    } finally {
      // Restore original data
      this.restoreData();
    }

    return this.generateTestReport();
  }

  /**
   * Export functionality tests
   */
  private async runExportTests(): Promise<void> {
    console.log('📤 Testing Export Functionality...');

    // Setup test data
    this.setupTestData();

    // Test Markdown export
    await this.runTest('Export to Markdown', async () => {
      const exported = quickNotesService.exportQuickNotes('md');
      
      if (typeof exported !== 'string') {
        throw new Error('Export should return a string');
      }
      
      if (!exported.includes('# Quick Notes')) {
        throw new Error('Markdown export missing main heading');
      }
      
      if (!exported.includes('##')) {
        throw new Error('Markdown export missing note headings');
      }
      
      // Check for note content
      const notes = quickNotesService.getAllQuickNotes();
      if (notes.length > 0 && !exported.includes(notes[0].title)) {
        throw new Error('Markdown export missing note titles');
      }

      return { 
        exportLength: exported.length,
        hasHeading: exported.includes('# Quick Notes'),
        noteCount: notes.length,
      };
    });

    // Test JSON export
    await this.runTest('Export to JSON', async () => {
      const exported = quickNotesService.exportQuickNotes('json');
      
      if (typeof exported !== 'string') {
        throw new Error('Export should return a string');
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(exported);
      } catch (error) {
        throw new Error('Exported JSON is not valid JSON');
      }
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Exported JSON should be an array');
      }
      
      const notes = quickNotesService.getAllQuickNotes();
      if (parsedData.length !== notes.length) {
        throw new Error('Exported JSON missing notes');
      }
      
      // Verify structure
      if (parsedData.length > 0) {
        const firstNote = parsedData[0];
        if (!firstNote.id || !firstNote.title || !firstNote.createdAt) {
          throw new Error('Exported note missing required fields');
        }
      }

      return { 
        exportLength: exported.length,
        notesCount: parsedData.length,
        validJSON: true,
        hasRequiredFields: parsedData.length === 0 || !!parsedData[0].id,
      };
    });

    // Test TXT export
    await this.runTest('Export to Plain Text', async () => {
      const exported = quickNotesService.exportQuickNotes('txt');
      
      if (typeof exported !== 'string') {
        throw new Error('Export should return a string');
      }
      
      if (!exported.includes('Quick Notes')) {
        throw new Error('Text export missing main heading');
      }
      
      const notes = quickNotesService.getAllQuickNotes();
      if (notes.length > 0 && !exported.includes(notes[0].title)) {
        throw new Error('Text export missing note titles');
      }

      return { 
        exportLength: exported.length,
        hasHeading: exported.includes('Quick Notes'),
        noteCount: notes.length,
      };
    });

    // Test export with empty data
    await this.runTest('Export with No Notes', async () => {
      // Clear notes
      localStorage.setItem('astral_quick_notes', JSON.stringify([]));
      
      const mdExport = quickNotesService.exportQuickNotes('md');
      const jsonExport = quickNotesService.exportQuickNotes('json');
      const txtExport = quickNotesService.exportQuickNotes('txt');
      
      if (!mdExport.includes('# Quick Notes')) {
        throw new Error('Markdown export should have heading even with no notes');
      }
      
      const parsedJson = JSON.parse(jsonExport);
      if (!Array.isArray(parsedJson) || parsedJson.length !== 0) {
        throw new Error('JSON export should be empty array with no notes');
      }

      return { 
        mdLength: mdExport.length,
        jsonIsEmptyArray: Array.isArray(parsedJson) && parsedJson.length === 0,
        txtLength: txtExport.length,
      };
    });

    // Test export with special characters
    await this.runTest('Export with Special Characters', async () => {
      // Create note with special characters
      const specialNote = quickNotesService.createQuickNote({
        title: 'Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?~`\'"\\/',
        content: 'Unicode: 🎭📝✨ and HTML: <script>alert("test")</script>',
        tags: ['special-chars', 'unicode', 'html'],
      });
      
      const mdExport = quickNotesService.exportQuickNotes('md');
      const jsonExport = quickNotesService.exportQuickNotes('json');
      
      if (!mdExport.includes('Special Chars:')) {
        throw new Error('Markdown export missing special characters in title');
      }
      
      if (!mdExport.includes('🎭📝✨')) {
        throw new Error('Markdown export missing unicode characters');
      }
      
      const parsedJson = JSON.parse(jsonExport);
      const exportedNote = parsedJson.find((n: any) => n.id === specialNote.id);
      
      if (!exportedNote) {
        throw new Error('Special character note not found in JSON export');
      }
      
      if (exportedNote.title !== specialNote.title) {
        throw new Error('Special characters not preserved in JSON export');
      }

      return { 
        specialCharsPreserved: exportedNote.title === specialNote.title,
        unicodePreserved: mdExport.includes('🎭📝✨'),
        htmlPreserved: exportedNote.content.includes('<script>'),
      };
    });

    // Test export with large dataset
    await this.runTest('Export with Large Dataset', async () => {
      // Create many notes
      const largeDataset = quickNotesTestDataGenerator.generatePerformanceTestData(100);
      const createdNotes = largeDataset.map(data => quickNotesService.createQuickNote(data));
      
      const startTime = Date.now();
      const jsonExport = quickNotesService.exportQuickNotes('json');
      const exportTime = Date.now() - startTime;
      
      const parsedJson = JSON.parse(jsonExport);
      
      if (parsedJson.length !== createdNotes.length) {
        throw new Error('Large dataset export missing notes');
      }
      
      if (exportTime > 2000) {
        throw new Error(`Large dataset export too slow: ${exportTime}ms`);
      }

      return { 
        notesExported: parsedJson.length,
        exportTime,
        averageTimePerNote: exportTime / parsedJson.length,
      };
    });
  }

  /**
   * Import functionality tests
   */
  private async runImportTests(): Promise<void> {
    console.log('📥 Testing Import Functionality...');

    // Test valid JSON import
    await this.runTest('Import Valid JSON', async () => {
      const testData = quickNotesTestDataGenerator.generateImportExportTestData();
      
      const result = quickNotesService.importQuickNotes(testData.validJson);
      
      if (!result.success) {
        throw new Error(`Import failed: ${result.errors.join(', ')}`);
      }
      
      if (result.imported === 0) {
        throw new Error('No notes imported from valid JSON');
      }
      
      // Verify notes were actually imported
      const importedNotes = quickNotesService.getAllQuickNotes();
      if (importedNotes.length === 0) {
        throw new Error('Notes not found after import');
      }

      return { 
        success: result.success,
        imported: result.imported,
        errors: result.errors.length,
        notesInStorage: importedNotes.length,
      };
    });

    // Test invalid JSON import
    await this.runTest('Import Invalid JSON', async () => {
      const testData = quickNotesTestDataGenerator.generateImportExportTestData();
      
      const result = quickNotesService.importQuickNotes(testData.invalidJson);
      
      if (result.success) {
        throw new Error('Invalid JSON import should fail');
      }
      
      if (result.errors.length === 0) {
        throw new Error('Invalid JSON should generate errors');
      }

      return { 
        success: result.success,
        errorCount: result.errors.length,
        imported: result.imported,
      };
    });

    // Test duplicate ID handling
    await this.runTest('Import with Duplicate IDs', async () => {
      const testData = quickNotesTestDataGenerator.generateImportExportTestData();
      
      const result = quickNotesService.importQuickNotes(testData.duplicateIds);
      
      if (result.success && result.errors.length === 0) {
        throw new Error('Duplicate IDs should generate errors or warnings');
      }
      
      if (result.imported > 1) {
        throw new Error('Should not import multiple notes with same ID');
      }

      return { 
        success: result.success,
        imported: result.imported,
        errorCount: result.errors.length,
        handledDuplicates: result.errors.some(error => error.includes('Duplicate')),
      };
    });

    // Test partial data import
    await this.runTest('Import Partial Data', async () => {
      const testData = quickNotesTestDataGenerator.generateImportExportTestData();
      
      const result = quickNotesService.importQuickNotes(testData.partialData);
      
      // Should handle missing fields gracefully
      if (result.errors.length === 0) {
        throw new Error('Partial data should generate validation errors');
      }

      return { 
        success: result.success,
        imported: result.imported,
        errorCount: result.errors.length,
        handledPartialData: true,
      };
    });

    // Test import data validation
    await this.runTest('Import Data Validation', async () => {
      const invalidData = JSON.stringify([
        {
          id: 'test_1',
          title: '', // Empty title should be handled
          content: 'Valid content',
          isQuickNote: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          type: 'note',
          status: 'draft',
          priority: 'medium',
          position: 1,
          wordCount: 2,
          readTime: 1,
        },
        {
          id: 'test_2',
          // Missing title field
          content: 'Content without title',
          isQuickNote: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          type: 'note',
          status: 'draft',
          priority: 'medium',
          position: 2,
          wordCount: 3,
          readTime: 1,
        },
        {
          id: 'test_3',
          title: 'Valid Note',
          content: 'Valid content',
          isQuickNote: true,
          createdAt: 'invalid-date', // Invalid date
          updatedAt: new Date().toISOString(),
          tags: [],
          type: 'invalid-type', // Invalid type
          status: 'draft',
          priority: 'medium',
          position: 3,
          wordCount: 2,
          readTime: 1,
        },
      ]);
      
      const result = quickNotesService.importQuickNotes(invalidData);
      
      // Should validate and report issues
      if (result.errors.length === 0 && result.imported === 3) {
        throw new Error('Should validate data and report issues');
      }

      return { 
        imported: result.imported,
        errorCount: result.errors.length,
        hasValidation: result.errors.length > 0,
      };
    });

    // Test large import performance
    await this.runTest('Import Performance', async () => {
      // Generate large valid dataset
      const largeDataset = [];
      for (let i = 0; i < 200; i++) {
        largeDataset.push({
          id: `perf_test_${i}`,
          title: `Performance Test Note ${i}`,
          content: `Content for performance test note ${i}`,
          isQuickNote: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [`tag${i % 5}`],
          type: 'note',
          status: 'draft',
          priority: 'medium',
          position: i,
          wordCount: 5,
          readTime: 1,
        });
      }
      
      const jsonData = JSON.stringify(largeDataset);
      
      const startTime = Date.now();
      const result = quickNotesService.importQuickNotes(jsonData);
      const importTime = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error('Large import failed');
      }
      
      if (importTime > 3000) {
        throw new Error(`Large import too slow: ${importTime}ms`);
      }

      return { 
        imported: result.imported,
        importTime,
        averageTimePerNote: importTime / result.imported,
        dataSize: jsonData.length,
      };
    });
  }

  /**
   * Format validation tests
   */
  private async runFormatValidationTests(): Promise<void> {
    console.log('🔍 Testing Format Validation...');

    // Test markdown format structure
    await this.runTest('Markdown Format Structure', async () => {
      this.setupTestData();
      
      const exported = quickNotesService.exportQuickNotes('md');
      
      // Should have proper markdown structure
      const lines = exported.split('\n');
      const hasMainHeading = lines.some(line => line.startsWith('# Quick Notes'));
      const hasNoteHeadings = lines.some(line => line.startsWith('## '));
      const hasSeparators = exported.includes('---');
      
      if (!hasMainHeading) {
        throw new Error('Markdown missing main heading');
      }
      
      if (!hasNoteHeadings) {
        throw new Error('Markdown missing note headings');
      }

      return { 
        hasMainHeading,
        hasNoteHeadings,
        hasSeparators,
        lineCount: lines.length,
      };
    });

    // Test JSON format structure
    await this.runTest('JSON Format Structure', async () => {
      this.setupTestData();
      
      const exported = quickNotesService.exportQuickNotes('json');
      const parsed = JSON.parse(exported);
      
      if (!Array.isArray(parsed)) {
        throw new Error('JSON export should be an array');
      }
      
      if (parsed.length > 0) {
        const note = parsed[0];
        const requiredFields = ['id', 'title', 'content', 'createdAt', 'updatedAt', 'tags', 'type'];
        const missingFields = requiredFields.filter(field => !(field in note));
        
        if (missingFields.length > 0) {
          throw new Error(`JSON missing required fields: ${missingFields.join(', ')}`);
        }
      }

      return { 
        isArray: Array.isArray(parsed),
        noteCount: parsed.length,
        hasRequiredFields: parsed.length === 0 || 'id' in parsed[0],
      };
    });

    // Test text format structure
    await this.runTest('Text Format Structure', async () => {
      this.setupTestData();
      
      const exported = quickNotesService.exportQuickNotes('txt');
      
      const hasMainHeading = exported.includes('Quick Notes');
      const hasEqualsSeparator = exported.includes('===========');
      const hasDashSeparators = exported.includes('---');
      
      if (!hasMainHeading) {
        throw new Error('Text export missing main heading');
      }

      return { 
        hasMainHeading,
        hasEqualsSeparator,
        hasDashSeparators,
        exportLength: exported.length,
      };
    });

    // Test format consistency
    await this.runTest('Format Consistency', async () => {
      this.setupTestData();
      
      const notes = quickNotesService.getAllQuickNotes();
      if (notes.length === 0) {
        return { consistent: true, reason: 'No notes to test' };
      }
      
      const mdExport = quickNotesService.exportQuickNotes('md');
      const jsonExport = quickNotesService.exportQuickNotes('json');
      const txtExport = quickNotesService.exportQuickNotes('txt');
      
      const parsedJson = JSON.parse(jsonExport);
      
      // Check that all formats contain the same notes
      const firstNote = notes[0];
      const mdHasFirstNote = mdExport.includes(firstNote.title);
      const jsonHasFirstNote = parsedJson.some((n: any) => n.id === firstNote.id);
      const txtHasFirstNote = txtExport.includes(firstNote.title);
      
      if (!mdHasFirstNote || !jsonHasFirstNote || !txtHasFirstNote) {
        throw new Error('Formats not consistent - missing notes');
      }

      return { 
        consistent: true,
        mdHasNote: mdHasFirstNote,
        jsonHasNote: jsonHasFirstNote,
        txtHasNote: txtHasFirstNote,
        noteCount: notes.length,
      };
    });
  }

  /**
   * Data integrity tests
   */
  private async runDataIntegrityTests(): Promise<void> {
    console.log('🔒 Testing Data Integrity...');

    // Test export-import roundtrip
    await this.runTest('Export-Import Roundtrip', async () => {
      // Create test notes
      const originalNotes = [
        quickNotesService.createQuickNote({
          title: 'Roundtrip Test 1',
          content: 'Content for roundtrip test 1',
          tags: ['test', 'roundtrip'],
          type: 'note',
        }),
        quickNotesService.createQuickNote({
          title: 'Roundtrip Test 2',
          content: 'Content for roundtrip test 2',
          tags: ['test', 'roundtrip', 'second'],
          type: 'research',
        }),
      ];
      
      // Export to JSON
      const exported = quickNotesService.exportQuickNotes('json');
      
      // Clear and import back
      localStorage.setItem('astral_quick_notes', JSON.stringify([]));
      const importResult = quickNotesService.importQuickNotes(exported);
      
      if (!importResult.success) {
        throw new Error('Roundtrip import failed');
      }
      
      // Verify data integrity
      const importedNotes = quickNotesService.getAllQuickNotes();
      
      if (importedNotes.length !== originalNotes.length) {
        throw new Error('Roundtrip note count mismatch');
      }
      
      // Check each note
      for (const originalNote of originalNotes) {
        const importedNote = importedNotes.find(n => n.title === originalNote.title);
        if (!importedNote) {
          throw new Error(`Note "${originalNote.title}" missing after roundtrip`);
        }
        
        if (importedNote.content !== originalNote.content) {
          throw new Error('Content mismatch after roundtrip');
        }
        
        if (importedNote.tags.length !== originalNote.tags.length) {
          throw new Error('Tags mismatch after roundtrip');
        }
        
        if (importedNote.type !== originalNote.type) {
          throw new Error('Type mismatch after roundtrip');
        }
      }

      return { 
        originalCount: originalNotes.length,
        importedCount: importedNotes.length,
        dataIntegrityPreserved: true,
        imported: importResult.imported,
      };
    });

    // Test metadata preservation
    await this.runTest('Metadata Preservation', async () => {
      const testNote = quickNotesService.createQuickNote({
        title: 'Metadata Test',
        content: 'Test metadata preservation',
        tags: ['metadata', 'test'],
        type: 'reference',
      });
      
      // Update to set specific metadata
      const updatedNote = quickNotesService.updateQuickNote(testNote.id, {
        status: 'complete',
        priority: 'high',
      });
      
      if (!updatedNote) throw new Error('Failed to update note');
      
      // Export and reimport
      const exported = quickNotesService.exportQuickNotes('json');
      localStorage.setItem('astral_quick_notes', JSON.stringify([]));
      const importResult = quickNotesService.importQuickNotes(exported);
      
      if (!importResult.success) {
        throw new Error('Metadata test import failed');
      }
      
      const reimportedNote = quickNotesService.getAllQuickNotes()[0];
      
      if (reimportedNote.status !== 'complete') {
        throw new Error('Status not preserved');
      }
      
      if (reimportedNote.priority !== 'high') {
        throw new Error('Priority not preserved');
      }
      
      if (reimportedNote.wordCount !== updatedNote.wordCount) {
        throw new Error('Word count not preserved');
      }

      return { 
        statusPreserved: reimportedNote.status === 'complete',
        priorityPreserved: reimportedNote.priority === 'high',
        wordCountPreserved: reimportedNote.wordCount === updatedNote.wordCount,
        metadataIntact: true,
      };
    });

    // Test special characters preservation
    await this.runTest('Special Characters Preservation', async () => {
      const specialNote = quickNotesService.createQuickNote({
        title: 'Special: "Quotes" & \'Apostrophes\' <HTML> 🎭',
        content: 'Content with\nnewlines\tand\ttabs and unicode: 你好世界 🌍',
        tags: ['special-chars', 'unicode', '"quoted-tag"'],
      });
      
      // Export and reimport
      const exported = quickNotesService.exportQuickNotes('json');
      localStorage.setItem('astral_quick_notes', JSON.stringify([]));
      const importResult = quickNotesService.importQuickNotes(exported);
      
      if (!importResult.success) {
        throw new Error('Special characters import failed');
      }
      
      const reimportedNote = quickNotesService.getAllQuickNotes()[0];
      
      if (reimportedNote.title !== specialNote.title) {
        throw new Error('Special characters in title not preserved');
      }
      
      if (reimportedNote.content !== specialNote.content) {
        throw new Error('Special characters in content not preserved');
      }
      
      if (reimportedNote.tags.length !== specialNote.tags.length) {
        throw new Error('Special character tags not preserved');
      }

      return { 
        titlePreserved: reimportedNote.title === specialNote.title,
        contentPreserved: reimportedNote.content === specialNote.content,
        tagsPreserved: reimportedNote.tags.length === specialNote.tags.length,
        unicodeIntact: reimportedNote.content.includes('你好世界'),
      };
    });
  }

  /**
   * Error handling tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    console.log('⚠️ Testing Import/Export Error Handling...');

    // Test malformed JSON
    await this.runTest('Malformed JSON Handling', async () => {
      const malformedJson = '{"incomplete": json without closing brace';
      
      const result = quickNotesService.importQuickNotes(malformedJson);
      
      if (result.success) {
        throw new Error('Malformed JSON should not succeed');
      }
      
      if (result.errors.length === 0) {
        throw new Error('Malformed JSON should generate errors');
      }

      return { 
        handled: true,
        errorCount: result.errors.length,
        containsParsingError: result.errors.some(error => 
          error.toLowerCase().includes('json') || error.toLowerCase().includes('parsing')
        ),
      };
    });

    // Test empty string import
    await this.runTest('Empty String Import', async () => {
      const result = quickNotesService.importQuickNotes('');
      
      if (result.success) {
        throw new Error('Empty string import should not succeed');
      }

      return { 
        handled: true,
        errorCount: result.errors.length,
        imported: result.imported,
      };
    });

    // Test non-array JSON
    await this.runTest('Non-Array JSON Handling', async () => {
      const nonArrayJson = '{"notes": []}'; // Object instead of array
      
      const result = quickNotesService.importQuickNotes(nonArrayJson);
      
      if (result.success && result.imported > 0) {
        throw new Error('Non-array JSON should not import successfully');
      }

      return { 
        handled: true,
        errorCount: result.errors.length,
        imported: result.imported,
      };
    });

    // Test extremely large import
    await this.runTest('Large Import Handling', async () => {
      // Create very large dataset
      const veryLargeDataset = [];
      for (let i = 0; i < 1000; i++) {
        veryLargeDataset.push({
          id: `large_test_${i}`,
          title: `Large Test Note ${i}`,
          content: 'A'.repeat(1000), // 1KB content per note
          isQuickNote: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [`tag${i % 10}`],
          type: 'note',
          status: 'draft',
          priority: 'medium',
          position: i,
          wordCount: 1000,
          readTime: 5,
        });
      }
      
      const largeJson = JSON.stringify(veryLargeDataset);
      
      try {
        const startTime = Date.now();
        const result = quickNotesService.importQuickNotes(largeJson);
        const importTime = Date.now() - startTime;
        
        // Should either succeed within reasonable time or fail gracefully
        if (result.success && importTime > 10000) {
          throw new Error(`Large import too slow: ${importTime}ms`);
        }
        
        return { 
          handled: true,
          success: result.success,
          imported: result.imported,
          importTime,
          dataSize: largeJson.length,
        };
      } catch (error) {
        // Should handle memory/size errors gracefully
        return { 
          handled: true,
          caughtError: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  /**
   * Performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('🚀 Testing Import/Export Performance...');

    // Test export performance
    await this.runTest('Export Performance', async () => {
      // Create moderate dataset
      const performanceData = quickNotesTestDataGenerator.generatePerformanceTestData(50);
      const notes = performanceData.map(data => quickNotesService.createQuickNote(data));
      
      // Test each format
      const mdStart = Date.now();
      const mdExport = quickNotesService.exportQuickNotes('md');
      const mdTime = Date.now() - mdStart;
      
      const jsonStart = Date.now();
      const jsonExport = quickNotesService.exportQuickNotes('json');
      const jsonTime = Date.now() - jsonStart;
      
      const txtStart = Date.now();
      const txtExport = quickNotesService.exportQuickNotes('txt');
      const txtTime = Date.now() - txtStart;
      
      // Performance thresholds
      if (mdTime > 1000) throw new Error(`MD export too slow: ${mdTime}ms`);
      if (jsonTime > 1000) throw new Error(`JSON export too slow: ${jsonTime}ms`);
      if (txtTime > 1000) throw new Error(`TXT export too slow: ${txtTime}ms`);
      
      // Cleanup
      notes.forEach(note => quickNotesService.deleteQuickNote(note.id));

      return { 
        noteCount: notes.length,
        mdTime,
        jsonTime,
        txtTime,
        mdSize: mdExport.length,
        jsonSize: jsonExport.length,
        txtSize: txtExport.length,
      };
    });

    // Test import performance
    await this.runTest('Import Performance', async () => {
      // Generate test data
      const testData = [];
      for (let i = 0; i < 100; i++) {
        testData.push({
          id: `perf_import_${i}`,
          title: `Performance Import ${i}`,
          content: `Content for performance import test ${i}`,
          isQuickNote: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [`perf${i % 5}`],
          type: 'note',
          status: 'draft',
          priority: 'medium',
          position: i,
          wordCount: 5,
          readTime: 1,
        });
      }
      
      const jsonData = JSON.stringify(testData);
      
      const startTime = Date.now();
      const result = quickNotesService.importQuickNotes(jsonData);
      const importTime = Date.now() - startTime;
      
      if (!result.success) {
        throw new Error('Performance import failed');
      }
      
      if (importTime > 2000) {
        throw new Error(`Import too slow: ${importTime}ms`);
      }

      return { 
        imported: result.imported,
        importTime,
        averageTimePerNote: importTime / result.imported,
        dataSize: jsonData.length,
      };
    });

    // Test concurrent operations
    await this.runTest('Concurrent Import/Export', async () => {
      this.setupTestData();
      
      // Perform export and import simultaneously
      const promises = [
        new Promise(resolve => {
          const startTime = Date.now();
          const exported = quickNotesService.exportQuickNotes('json');
          resolve({ operation: 'export', time: Date.now() - startTime, size: exported.length });
        }),
        new Promise(resolve => {
          const testData = JSON.stringify([{
            id: 'concurrent_test',
            title: 'Concurrent Test',
            content: 'Test concurrent import',
            isQuickNote: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: [],
            type: 'note',
            status: 'draft',
            priority: 'medium',
            position: 1,
            wordCount: 3,
            readTime: 1,
          }]);
          
          const startTime = Date.now();
          const result = quickNotesService.importQuickNotes(testData);
          resolve({ operation: 'import', time: Date.now() - startTime, success: result.success });
        }),
      ];
      
      const results = await Promise.all(promises);

      return { 
        concurrent: true,
        results,
        bothCompleted: results.length === 2,
      };
    });
  }

  /**
   * Helper methods
   */
  private setupTestData(): void {
    // Clear existing data
    localStorage.setItem('astral_quick_notes', JSON.stringify([]));
    
    // Create varied test notes
    const testNotes = [
      {
        title: 'Export Test Note 1',
        content: 'This is the first test note for export functionality',
        tags: ['export', 'test'],
        type: 'note' as const,
      },
      {
        title: 'Export Test Note 2',
        content: 'This is the second test note with more content and different formatting.\n\nIt has multiple paragraphs.',
        tags: ['export', 'test', 'formatting'],
        type: 'research' as const,
      },
      {
        title: 'Special Characters Note',
        content: 'Note with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        tags: ['special', 'characters'],
        type: 'reference' as const,
      },
    ];
    
    testNotes.forEach(note => quickNotesService.createQuickNote(note));
  }

  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        details: result,
        duration,
      });
      
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      console.log(`❌ ${testName} (${duration}ms): ${error}`);
    }
  }

  private backupData(): void {
    this.originalData = quickNotesService.getAllQuickNotes();
  }

  private restoreData(): void {
    localStorage.setItem('astral_quick_notes', JSON.stringify(this.originalData));
  }

  private generateTestReport(): ImportExportTestSuite {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName: 'Quick Notes Import/Export Features',
      results: this.results,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
    };
  }
}

// Export test runner
export const quickNotesImportExportTests = new QuickNotesImportExportTestSuite();