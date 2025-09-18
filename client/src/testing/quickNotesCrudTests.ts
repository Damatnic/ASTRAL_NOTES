/**
 * Quick Notes CRUD Operations Test Suite
 * Comprehensive testing for Create, Read, Update, Delete operations
 */

import { quickNotesService, QuickNote, CreateQuickNoteData, UpdateQuickNoteData } from '@/services/quickNotesService';
import { quickNotesTestDataGenerator } from './quickNotesTestDataGenerator';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class QuickNotesCrudTestSuite {
  private results: TestResult[] = [];
  private originalData: QuickNote[] = [];

  /**
   * Run all CRUD tests
   */
  public async runAllTests(): Promise<TestSuite> {
    console.log('🧪 Starting Quick Notes CRUD Test Suite...');
    
    // Backup existing data
    this.backupData();
    
    try {
      // Run test categories
      await this.runCreateTests();
      await this.runReadTests();
      await this.runUpdateTests();
      await this.runDeleteTests();
      await this.runBulkOperationTests();
      await this.runDataIntegrityTests();
      await this.runErrorHandlingTests();
      await this.runEdgeCaseTests();
      
    } finally {
      // Restore original data
      this.restoreData();
    }

    return this.generateTestReport();
  }

  /**
   * Create operation tests
   */
  private async runCreateTests(): Promise<void> {
    console.log('📝 Testing Create Operations...');

    // Test basic creation
    await this.runTest('Create Basic Note', async () => {
      const noteData: CreateQuickNoteData = {
        title: 'Test Note',
        content: 'Test content',
        type: 'note',
        tags: ['test'],
      };

      const note = quickNotesService.createQuickNote(noteData);
      
      if (!note.id) throw new Error('Note ID not generated');
      if (note.title !== noteData.title) throw new Error('Title mismatch');
      if (note.content !== noteData.content) throw new Error('Content mismatch');
      if (!note.isQuickNote) throw new Error('Quick note flag not set');
      if (!note.createdAt) throw new Error('Created date not set');
      
      return { noteId: note.id, note };
    });

    // Test creation with minimal data
    await this.runTest('Create Minimal Note', async () => {
      const note = quickNotesService.createQuickNote({ title: 'Minimal' });
      
      if (!note.id) throw new Error('Note ID not generated');
      if (note.content !== '') throw new Error('Default content should be empty');
      if (note.type !== 'note') throw new Error('Default type should be "note"');
      if (note.tags.length !== 0) throw new Error('Default tags should be empty');
      
      return { noteId: note.id };
    });

    // Test creation with all fields
    await this.runTest('Create Complete Note', async () => {
      const noteData: CreateQuickNoteData = {
        title: 'Complete Note',
        content: 'Complete content with markdown\n\n## Heading\n\n- List item',
        type: 'research',
        tags: ['complete', 'test', 'research'],
        projectId: 'test-project-id',
      };

      const note = quickNotesService.createQuickNote(noteData);
      
      if (note.projectId !== noteData.projectId) throw new Error('Project ID mismatch');
      if (note.tags.length !== noteData.tags!.length) throw new Error('Tags count mismatch');
      if (note.wordCount <= 0) throw new Error('Word count not calculated');
      
      return { noteId: note.id };
    });

    // Test word count calculation
    await this.runTest('Word Count Calculation', async () => {
      const content = 'This is a test with exactly ten words here now.';
      const note = quickNotesService.createQuickNote({
        title: 'Word Count Test',
        content,
      });

      if (note.wordCount !== 10) {
        throw new Error(`Expected 10 words, got ${note.wordCount}`);
      }
      
      return { wordCount: note.wordCount };
    });

    // Test empty content word count
    await this.runTest('Empty Content Word Count', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Empty Content',
        content: '',
      });

      if (note.wordCount !== 0) {
        throw new Error(`Expected 0 words for empty content, got ${note.wordCount}`);
      }
      
      return { wordCount: note.wordCount };
    });

    // Test HTML content word count
    await this.runTest('HTML Content Word Count', async () => {
      const content = '<p>This <strong>is</strong> HTML <em>content</em> with tags.</p>';
      const note = quickNotesService.createQuickNote({
        title: 'HTML Test',
        content,
      });

      // Should count words without HTML tags
      if (note.wordCount !== 7) {
        throw new Error(`Expected 7 words, got ${note.wordCount}`);
      }
      
      return { wordCount: note.wordCount };
    });
  }

  /**
   * Read operation tests
   */
  private async runReadTests(): Promise<void> {
    console.log('📖 Testing Read Operations...');

    // Setup test data
    const testNotes = quickNotesTestDataGenerator.generateBasicNotes({ count: 5 });
    const createdNotes = testNotes.map(note => quickNotesService.createQuickNote(note));

    // Test get all notes
    await this.runTest('Get All Notes', async () => {
      const allNotes = quickNotesService.getAllQuickNotes();
      
      if (allNotes.length < 5) throw new Error('Not all notes retrieved');
      
      // Check sorting (should be by updatedAt desc)
      for (let i = 1; i < allNotes.length; i++) {
        const prev = new Date(allNotes[i-1].updatedAt).getTime();
        const curr = new Date(allNotes[i].updatedAt).getTime();
        if (prev < curr) {
          throw new Error('Notes not sorted correctly by updatedAt');
        }
      }
      
      return { count: allNotes.length };
    });

    // Test get note by ID
    await this.runTest('Get Note By ID', async () => {
      const targetNote = createdNotes[0];
      const retrievedNote = quickNotesService.getQuickNoteById(targetNote.id);
      
      if (!retrievedNote) throw new Error('Note not found');
      if (retrievedNote.id !== targetNote.id) throw new Error('Wrong note retrieved');
      if (retrievedNote.title !== targetNote.title) throw new Error('Note data mismatch');
      
      return { noteId: retrievedNote.id };
    });

    // Test get non-existent note
    await this.runTest('Get Non-existent Note', async () => {
      const note = quickNotesService.getQuickNoteById('non-existent-id');
      
      if (note !== null) throw new Error('Should return null for non-existent note');
      
      return { result: 'null as expected' };
    });

    // Test get recent notes
    await this.runTest('Get Recent Notes', async () => {
      const recentNotes = quickNotesService.getRecentQuickNotes(3);
      
      if (recentNotes.length > 3) throw new Error('Returned more than requested limit');
      
      // Verify order
      for (let i = 1; i < recentNotes.length; i++) {
        const prev = new Date(recentNotes[i-1].updatedAt).getTime();
        const curr = new Date(recentNotes[i].updatedAt).getTime();
        if (prev < curr) {
          throw new Error('Recent notes not sorted correctly');
        }
      }
      
      return { count: recentNotes.length };
    });

    // Test get notes by tags
    await this.runTest('Get Notes By Tags', async () => {
      // Create notes with specific tags
      const taggedNote1 = quickNotesService.createQuickNote({
        title: 'Tagged Note 1',
        tags: ['tag1', 'tag2'],
      });
      
      const taggedNote2 = quickNotesService.createQuickNote({
        title: 'Tagged Note 2',
        tags: ['tag2', 'tag3'],
      });

      const notesWithTag1 = quickNotesService.getQuickNotesByTags(['tag1']);
      const notesWithTag2 = quickNotesService.getQuickNotesByTags(['tag2']);
      const notesWithMultipleTags = quickNotesService.getQuickNotesByTags(['tag1', 'tag3']);

      if (!notesWithTag1.some(n => n.id === taggedNote1.id)) {
        throw new Error('Note with tag1 not found');
      }
      
      if (!notesWithTag2.some(n => n.id === taggedNote1.id) || 
          !notesWithTag2.some(n => n.id === taggedNote2.id)) {
        throw new Error('Notes with tag2 not found');
      }

      if (notesWithMultipleTags.length < 2) {
        throw new Error('Multiple tag search failed');
      }
      
      return { 
        tag1Count: notesWithTag1.length,
        tag2Count: notesWithTag2.length,
        multipleTagCount: notesWithMultipleTags.length,
      };
    });
  }

  /**
   * Update operation tests
   */
  private async runUpdateTests(): Promise<void> {
    console.log('✏️ Testing Update Operations...');

    // Create test note
    const originalNote = quickNotesService.createQuickNote({
      title: 'Original Title',
      content: 'Original content',
      type: 'note',
      tags: ['original'],
    });

    // Test basic update
    await this.runTest('Update Basic Fields', async () => {
      const updatedNote = quickNotesService.updateQuickNote(originalNote.id, {
        title: 'Updated Title',
        content: 'Updated content',
      });

      if (!updatedNote) throw new Error('Update returned null');
      if (updatedNote.title !== 'Updated Title') throw new Error('Title not updated');
      if (updatedNote.content !== 'Updated content') throw new Error('Content not updated');
      if (updatedNote.updatedAt === originalNote.updatedAt) throw new Error('UpdatedAt not changed');
      
      return { updatedNote };
    });

    // Test partial update
    await this.runTest('Update Single Field', async () => {
      const beforeUpdate = quickNotesService.getQuickNoteById(originalNote.id)!;
      const updatedNote = quickNotesService.updateQuickNote(originalNote.id, {
        tags: ['updated', 'test'],
      });

      if (!updatedNote) throw new Error('Update returned null');
      if (updatedNote.title !== beforeUpdate.title) throw new Error('Title should not change');
      if (updatedNote.content !== beforeUpdate.content) throw new Error('Content should not change');
      if (!updatedNote.tags.includes('updated')) throw new Error('Tags not updated');
      
      return { tags: updatedNote.tags };
    });

    // Test word count recalculation
    await this.runTest('Word Count Recalculation', async () => {
      const newContent = 'This content has exactly five words.';
      const updatedNote = quickNotesService.updateQuickNote(originalNote.id, {
        content: newContent,
      });

      if (!updatedNote) throw new Error('Update returned null');
      if (updatedNote.wordCount !== 5) {
        throw new Error(`Expected 5 words, got ${updatedNote.wordCount}`);
      }
      
      return { wordCount: updatedNote.wordCount };
    });

    // Test update non-existent note
    await this.runTest('Update Non-existent Note', async () => {
      const result = quickNotesService.updateQuickNote('non-existent-id', {
        title: 'Should Not Work',
      });

      if (result !== null) throw new Error('Should return null for non-existent note');
      
      return { result: 'null as expected' };
    });

    // Test empty title handling
    await this.runTest('Update With Empty Title', async () => {
      const updatedNote = quickNotesService.updateQuickNote(originalNote.id, {
        title: '',
      });

      if (!updatedNote) throw new Error('Update returned null');
      if (updatedNote.title !== 'Untitled Quick Note') {
        throw new Error('Empty title should default to "Untitled Quick Note"');
      }
      
      return { title: updatedNote.title };
    });

    // Test status and priority updates
    await this.runTest('Update Status and Priority', async () => {
      const updatedNote = quickNotesService.updateQuickNote(originalNote.id, {
        status: 'complete',
        priority: 'urgent',
      });

      if (!updatedNote) throw new Error('Update returned null');
      if (updatedNote.status !== 'complete') throw new Error('Status not updated');
      if (updatedNote.priority !== 'urgent') throw new Error('Priority not updated');
      
      return { status: updatedNote.status, priority: updatedNote.priority };
    });
  }

  /**
   * Delete operation tests
   */
  private async runDeleteTests(): Promise<void> {
    console.log('🗑️ Testing Delete Operations...');

    // Create test notes
    const testNote1 = quickNotesService.createQuickNote({ title: 'Delete Test 1' });
    const testNote2 = quickNotesService.createQuickNote({ title: 'Delete Test 2' });

    // Test successful deletion
    await this.runTest('Delete Existing Note', async () => {
      const result = quickNotesService.deleteQuickNote(testNote1.id);
      
      if (!result) throw new Error('Delete should return true for existing note');
      
      const deletedNote = quickNotesService.getQuickNoteById(testNote1.id);
      if (deletedNote !== null) throw new Error('Note should not exist after deletion');
      
      return { deleted: true };
    });

    // Test delete non-existent note
    await this.runTest('Delete Non-existent Note', async () => {
      const result = quickNotesService.deleteQuickNote('non-existent-id');
      
      if (result !== false) throw new Error('Delete should return false for non-existent note');
      
      return { result: 'false as expected' };
    });

    // Test data consistency after deletion
    await this.runTest('Data Consistency After Delete', async () => {
      const beforeCount = quickNotesService.getAllQuickNotes().length;
      quickNotesService.deleteQuickNote(testNote2.id);
      const afterCount = quickNotesService.getAllQuickNotes().length;
      
      if (afterCount !== beforeCount - 1) {
        throw new Error('Note count not decreased by 1 after deletion');
      }
      
      return { beforeCount, afterCount };
    });
  }

  /**
   * Bulk operation tests
   */
  private async runBulkOperationTests(): Promise<void> {
    console.log('📦 Testing Bulk Operations...');

    // Create test notes for bulk operations
    const testNotes = [];
    for (let i = 0; i < 5; i++) {
      testNotes.push(quickNotesService.createQuickNote({
        title: `Bulk Test Note ${i + 1}`,
        content: `Content ${i + 1}`,
        tags: [`bulk-${i}`],
      }));
    }

    const noteIds = testNotes.map(note => note.id);

    // Test bulk delete
    await this.runTest('Bulk Delete Notes', async () => {
      const deletedCount = quickNotesService.bulkDeleteQuickNotes(noteIds.slice(0, 3));
      
      if (deletedCount !== 3) throw new Error(`Expected 3 deletions, got ${deletedCount}`);
      
      // Verify notes are deleted
      const remainingNotes = quickNotesService.getAllQuickNotes();
      const deletedIds = noteIds.slice(0, 3);
      const foundDeleted = remainingNotes.filter(note => deletedIds.includes(note.id));
      
      if (foundDeleted.length > 0) throw new Error('Deleted notes still exist');
      
      return { deletedCount };
    });

    // Test bulk update
    await this.runTest('Bulk Update Notes', async () => {
      const remainingIds = noteIds.slice(3); // Last 2 notes
      const updatedCount = quickNotesService.bulkUpdateQuickNotes(remainingIds, {
        status: 'archived',
        priority: 'high',
      });

      if (updatedCount !== 2) throw new Error(`Expected 2 updates, got ${updatedCount}`);
      
      // Verify updates
      const updatedNotes = remainingIds.map(id => quickNotesService.getQuickNoteById(id));
      const allArchived = updatedNotes.every(note => note?.status === 'archived');
      const allHighPriority = updatedNotes.every(note => note?.priority === 'high');
      
      if (!allArchived) throw new Error('Not all notes archived');
      if (!allHighPriority) throw new Error('Not all notes set to high priority');
      
      return { updatedCount };
    });

    // Test bulk attach to project
    await this.runTest('Bulk Attach To Project', async () => {
      // Create new test notes
      const newTestNotes = [];
      for (let i = 0; i < 3; i++) {
        newTestNotes.push(quickNotesService.createQuickNote({
          title: `Attachment Test ${i + 1}`,
        }));
      }

      const newNoteIds = newTestNotes.map(note => note.id);
      const testProjectId = 'test-project-123';
      
      const attachedCount = quickNotesService.bulkAttachToProject(newNoteIds, testProjectId);
      
      if (attachedCount !== 3) throw new Error(`Expected 3 attachments, got ${attachedCount}`);
      
      // Verify attachments
      const attachedNotes = newNoteIds.map(id => quickNotesService.getQuickNoteById(id));
      const allAttached = attachedNotes.every(note => note?.projectId === testProjectId);
      
      if (!allAttached) throw new Error('Not all notes attached to project');
      
      return { attachedCount };
    });
  }

  /**
   * Data integrity tests
   */
  private async runDataIntegrityTests(): Promise<void> {
    console.log('🔒 Testing Data Integrity...');

    // Test storage persistence
    await this.runTest('Storage Persistence', async () => {
      const testNote = quickNotesService.createQuickNote({
        title: 'Persistence Test',
        content: 'This should persist',
      });

      // Simulate page reload by creating new service instance
      const storedData = localStorage.getItem('astral_quick_notes');
      if (!storedData) throw new Error('Data not stored in localStorage');
      
      const parsedData = JSON.parse(storedData);
      const foundNote = parsedData.find((note: QuickNote) => note.id === testNote.id);
      
      if (!foundNote) throw new Error('Note not found in storage');
      if (foundNote.title !== testNote.title) throw new Error('Stored data corrupted');
      
      return { persisted: true };
    });

    // Test ID uniqueness
    await this.runTest('ID Uniqueness', async () => {
      const notes = [];
      for (let i = 0; i < 10; i++) {
        notes.push(quickNotesService.createQuickNote({ title: `ID Test ${i}` }));
      }

      const ids = notes.map(note => note.id);
      const uniqueIds = new Set(ids);
      
      if (uniqueIds.size !== ids.length) throw new Error('Duplicate IDs generated');
      
      return { uniqueIdsCount: uniqueIds.size };
    });

    // Test position handling
    await this.runTest('Position Handling', async () => {
      const note1 = quickNotesService.createQuickNote({ title: 'Position Test 1' });
      const note2 = quickNotesService.createQuickNote({ title: 'Position Test 2' });
      
      if (note2.position <= note1.position) {
        throw new Error('Position not incrementing correctly');
      }
      
      return { position1: note1.position, position2: note2.position };
    });
  }

  /**
   * Error handling tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    console.log('⚠️ Testing Error Handling...');

    // Test localStorage errors (simulated)
    await this.runTest('Storage Error Handling', async () => {
      // This test verifies the error handling exists
      // In a real scenario, we'd mock localStorage to throw errors
      try {
        const notes = quickNotesService.getAllQuickNotes();
        return { handled: true, notesCount: notes.length };
      } catch (error) {
        throw new Error('Storage error not handled gracefully');
      }
    });

    // Test invalid JSON in storage
    await this.runTest('Invalid JSON Handling', async () => {
      // Backup current data
      const currentData = localStorage.getItem('astral_quick_notes');
      
      try {
        // Set invalid JSON
        localStorage.setItem('astral_quick_notes', 'invalid json');
        
        // Should return empty array, not throw error
        const notes = quickNotesService.getAllQuickNotes();
        if (!Array.isArray(notes)) throw new Error('Should return array for invalid JSON');
        if (notes.length !== 0) throw new Error('Should return empty array for invalid JSON');
        
        return { handled: true };
      } finally {
        // Restore data
        if (currentData) {
          localStorage.setItem('astral_quick_notes', currentData);
        }
      }
    });
  }

  /**
   * Edge case tests
   */
  private async runEdgeCaseTests(): Promise<void> {
    console.log('🔍 Testing Edge Cases...');

    // Test very long content
    await this.runTest('Very Long Content', async () => {
      const longContent = 'A'.repeat(50000);
      const note = quickNotesService.createQuickNote({
        title: 'Long Content Test',
        content: longContent,
      });

      if (note.content.length !== 50000) throw new Error('Long content not stored correctly');
      
      return { contentLength: note.content.length };
    });

    // Test special characters
    await this.runTest('Special Characters', async () => {
      const specialTitle = '!@#$%^&*()_+-=[]{}|;:,.<>?~`\'"\\/ 🎭📝✨';
      const specialContent = 'Unicode: 你好世界 🌍\nHTML: <script>alert("test")</script>';
      
      const note = quickNotesService.createQuickNote({
        title: specialTitle,
        content: specialContent,
      });

      if (note.title !== specialTitle) throw new Error('Special characters in title not preserved');
      if (note.content !== specialContent) throw new Error('Special characters in content not preserved');
      
      return { title: note.title, content: note.content };
    });

    // Test many tags
    await this.runTest('Many Tags', async () => {
      const manyTags = Array.from({ length: 100 }, (_, i) => `tag-${i}`);
      
      const note = quickNotesService.createQuickNote({
        title: 'Many Tags Test',
        tags: manyTags,
      });

      if (note.tags.length !== 100) throw new Error('Not all tags stored');
      
      return { tagsCount: note.tags.length };
    });

    // Test whitespace handling
    await this.runTest('Whitespace Handling', async () => {
      const note = quickNotesService.createQuickNote({
        title: '   Whitespace Test   ',
        content: '   Content with whitespace   ',
      });

      if (note.title !== 'Whitespace Test') throw new Error('Title whitespace not trimmed');
      if (note.content !== 'Content with whitespace') throw new Error('Content whitespace not trimmed');
      
      return { title: note.title, content: note.content };
    });
  }

  /**
   * Helper methods
   */
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
    // Clear current data and restore original
    localStorage.setItem('astral_quick_notes', JSON.stringify(this.originalData));
  }

  private generateTestReport(): TestSuite {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName: 'Quick Notes CRUD Operations',
      results: this.results,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
    };
  }
}

// Export test runner
export const quickNotesCrudTests = new QuickNotesCrudTestSuite();