/**
 * Quick Notes Auto-Save Functionality Test Suite
 * Tests auto-save behavior, debouncing, conflict resolution, and offline queue
 */

import { quickNotesService, QuickNote } from '@/services/quickNotesService';
import { quickNotesTestDataGenerator } from './quickNotesTestDataGenerator';

interface AutoSaveTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface AutoSaveTestSuite {
  suiteName: string;
  results: AutoSaveTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class QuickNotesAutoSaveTestSuite {
  private results: AutoSaveTestResult[] = [];
  private originalData: QuickNote[] = [];

  /**
   * Run all auto-save tests
   */
  public async runAllTests(): Promise<AutoSaveTestSuite> {
    console.log('💾 Starting Quick Notes Auto-Save Test Suite...');
    
    // Backup existing data
    this.backupData();
    
    try {
      await this.runBasicAutoSaveTests();
      await this.runDebounceTests();
      await this.runConflictResolutionTests();
      await this.runOfflineQueueTests();
      await this.runSaveStatusTests();
      await this.runPerformanceTests();
      await this.runErrorHandlingTests();
      
    } finally {
      // Restore original data
      this.restoreData();
    }

    return this.generateTestReport();
  }

  /**
   * Basic auto-save functionality tests
   */
  private async runBasicAutoSaveTests(): Promise<void> {
    console.log('🔄 Testing Basic Auto-Save...');

    // Test auto-save trigger
    await this.runTest('Auto-Save Trigger', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Auto-Save Test',
        content: 'Initial content',
      });

      const originalUpdatedAt = note.updatedAt;
      
      // Simulate typing with auto-save
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Updated content via auto-save',
      });

      // Wait for auto-save delay (1000ms + buffer)
      await this.wait(1200);

      const updatedNote = quickNotesService.getQuickNoteById(note.id);
      if (!updatedNote) throw new Error('Note not found after auto-save');
      if (updatedNote.content !== 'Updated content via auto-save') {
        throw new Error('Auto-save did not update content');
      }
      if (updatedNote.updatedAt === originalUpdatedAt) {
        throw new Error('UpdatedAt not changed after auto-save');
      }

      return { 
        original: originalUpdatedAt,
        updated: updatedNote.updatedAt,
        content: updatedNote.content,
      };
    });

    // Test immediate save vs auto-save
    await this.runTest('Immediate vs Auto-Save', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Immediate Save Test',
        content: 'Initial content',
      });

      // Immediate save
      const immediateUpdate = quickNotesService.updateQuickNote(note.id, {
        content: 'Immediate update',
      });
      const immediateTime = Date.now();

      // Auto-save (should not override immediate save during delay)
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Auto-save update',
      });

      // Check immediately (should still have immediate update)
      const checkNote = quickNotesService.getQuickNoteById(note.id);
      if (!checkNote) throw new Error('Note not found');
      if (checkNote.content !== 'Immediate update') {
        throw new Error('Immediate save was overridden by pending auto-save');
      }

      // Wait for auto-save
      await this.wait(1200);

      const finalNote = quickNotesService.getQuickNoteById(note.id);
      if (!finalNote) throw new Error('Note not found after auto-save delay');
      if (finalNote.content !== 'Auto-save update') {
        throw new Error('Auto-save did not apply after delay');
      }

      return {
        immediateContent: checkNote.content,
        finalContent: finalNote.content,
      };
    });

    // Test rapid auto-save calls
    await this.runTest('Rapid Auto-Save Calls', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Rapid Auto-Save Test',
        content: 'Initial',
      });

      // Simulate rapid typing
      const changes = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE'];
      
      for (let i = 0; i < changes.length; i++) {
        quickNotesService.autoSaveQuickNote(note.id, {
          content: changes[i],
        });
        await this.wait(100); // Rapid changes
      }

      // Wait for final auto-save
      await this.wait(1200);

      const finalNote = quickNotesService.getQuickNoteById(note.id);
      if (!finalNote) throw new Error('Note not found');
      if (finalNote.content !== 'ABCDE') {
        throw new Error(`Expected 'ABCDE', got '${finalNote.content}'`);
      }

      return { finalContent: finalNote.content };
    });
  }

  /**
   * Debounce behavior tests
   */
  private async runDebounceTests(): Promise<void> {
    console.log('⏱️ Testing Debounce Behavior...');

    // Test debounce delay
    await this.runTest('Debounce Delay', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Debounce Test',
        content: 'Initial',
      });

      const startTime = Date.now();
      
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'First change',
      });

      // Wait less than debounce delay
      await this.wait(500);
      
      // Should not be saved yet
      let checkNote = quickNotesService.getQuickNoteById(note.id);
      if (checkNote?.content === 'First change') {
        throw new Error('Auto-save triggered before debounce delay');
      }

      // Wait for remaining delay
      await this.wait(700);
      
      // Should be saved now
      checkNote = quickNotesService.getQuickNoteById(note.id);
      if (checkNote?.content !== 'First change') {
        throw new Error('Auto-save did not trigger after debounce delay');
      }

      const totalTime = Date.now() - startTime;
      
      return { 
        totalTime,
        saved: checkNote.content === 'First change',
      };
    });

    // Test debounce reset
    await this.runTest('Debounce Reset', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Debounce Reset Test',
        content: 'Initial',
      });

      // First auto-save call
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Change 1',
      });

      // Wait part of the delay
      await this.wait(500);

      // Second auto-save call (should reset timer)
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Change 2',
      });

      // Wait less than full delay from second call
      await this.wait(500);
      
      // Should not be saved yet (timer was reset)
      let checkNote = quickNotesService.getQuickNoteById(note.id);
      if (checkNote?.content !== 'Initial') {
        throw new Error('Debounce timer was not reset');
      }

      // Wait for remaining delay
      await this.wait(600);
      
      // Should have the second change
      checkNote = quickNotesService.getQuickNoteById(note.id);
      if (checkNote?.content !== 'Change 2') {
        throw new Error('Final auto-save did not apply correct content');
      }

      return { finalContent: checkNote.content };
    });

    // Test multiple rapid changes
    await this.runTest('Multiple Rapid Changes', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Rapid Changes Test',
        content: '',
      });

      const testData = quickNotesTestDataGenerator.generateAutoSaveTestData();
      const changes = testData.rapidChanges;

      // Simulate rapid typing
      for (let i = 0; i < changes.length; i++) {
        quickNotesService.autoSaveQuickNote(note.id, {
          content: changes[i],
        });
        await this.wait(50); // Very rapid changes
      }

      // Wait for final auto-save
      await this.wait(1200);

      const finalNote = quickNotesService.getQuickNoteById(note.id);
      if (!finalNote) throw new Error('Note not found');
      
      const expectedFinalContent = changes[changes.length - 1];
      if (finalNote.content !== expectedFinalContent) {
        throw new Error(`Expected '${expectedFinalContent}', got '${finalNote.content}'`);
      }

      return { 
        changesCount: changes.length,
        finalContent: finalNote.content,
      };
    });
  }

  /**
   * Conflict resolution tests
   */
  private async runConflictResolutionTests(): Promise<void> {
    console.log('🔀 Testing Conflict Resolution...');

    // Test auto-save vs manual save conflict
    await this.runTest('Auto-Save vs Manual Save', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Conflict Test',
        content: 'Initial content',
      });

      // Start auto-save
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Auto-save content',
      });

      // Manual save before auto-save triggers
      await this.wait(200);
      const manualUpdate = quickNotesService.updateQuickNote(note.id, {
        content: 'Manual save content',
      });

      if (!manualUpdate) throw new Error('Manual save failed');

      // Wait for auto-save to potentially trigger
      await this.wait(1000);

      const finalNote = quickNotesService.getQuickNoteById(note.id);
      if (!finalNote) throw new Error('Note not found');

      // Auto-save should still apply (last write wins)
      if (finalNote.content !== 'Auto-save content') {
        throw new Error(`Expected auto-save content, got '${finalNote.content}'`);
      }

      return { 
        manualContent: 'Manual save content',
        finalContent: finalNote.content,
      };
    });

    // Test concurrent auto-save calls
    await this.runTest('Concurrent Auto-Save Calls', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Concurrent Test',
        content: 'Initial',
      });

      // Simulate concurrent updates
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Update A',
        title: 'Title A',
      });

      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Update B',
        tags: ['tag-b'],
      });

      // Wait for auto-saves
      await this.wait(1200);

      const finalNote = quickNotesService.getQuickNoteById(note.id);
      if (!finalNote) throw new Error('Note not found');

      // Last auto-save should win
      if (finalNote.content !== 'Update B') {
        throw new Error('Last auto-save did not win');
      }

      return { 
        content: finalNote.content,
        title: finalNote.title,
        tags: finalNote.tags,
      };
    });
  }

  /**
   * Offline queue tests (simulated)
   */
  private async runOfflineQueueTests(): Promise<void> {
    console.log('📱 Testing Offline Queue Simulation...');

    // Test offline save queue simulation
    await this.runTest('Offline Save Queue', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Offline Test',
        content: 'Initial',
      });

      // Simulate going offline (we'll just test the queue logic)
      const offlineChanges = [
        { content: 'Offline change 1' },
        { content: 'Offline change 2' },
        { content: 'Offline change 3' },
      ];

      // Apply changes as if they were queued offline
      for (const change of offlineChanges) {
        quickNotesService.autoSaveQuickNote(note.id, change);
        await this.wait(100);
      }

      // Wait for final save
      await this.wait(1200);

      const finalNote = quickNotesService.getQuickNoteById(note.id);
      if (!finalNote) throw new Error('Note not found');
      
      if (finalNote.content !== 'Offline change 3') {
        throw new Error('Offline changes not applied correctly');
      }

      return { 
        changesApplied: offlineChanges.length,
        finalContent: finalNote.content,
      };
    });

    // Test save status indication simulation
    await this.runTest('Save Status Indication', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Save Status Test',
        content: 'Initial',
      });

      // Simulate tracking save status
      let saveStatus = 'saved';
      
      // Trigger auto-save
      saveStatus = 'saving';
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Updated content',
      });

      // Wait for save
      await this.wait(1200);
      saveStatus = 'saved';

      const updatedNote = quickNotesService.getQuickNoteById(note.id);
      if (!updatedNote) throw new Error('Note not found');
      if (updatedNote.content !== 'Updated content') {
        throw new Error('Content not saved');
      }

      return { 
        finalStatus: saveStatus,
        contentSaved: updatedNote.content === 'Updated content',
      };
    });
  }

  /**
   * Save status tests
   */
  private async runSaveStatusTests(): Promise<void> {
    console.log('💾 Testing Save Status...');

    // Test save confirmation
    await this.runTest('Save Confirmation', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Save Confirmation Test',
        content: 'Initial',
      });

      const startTime = Date.now();
      
      quickNotesService.autoSaveQuickNote(note.id, {
        content: 'Confirmed save',
      });

      await this.wait(1200);
      
      const endTime = Date.now();
      const savedNote = quickNotesService.getQuickNoteById(note.id);
      
      if (!savedNote) throw new Error('Note not found');
      if (savedNote.content !== 'Confirmed save') {
        throw new Error('Save not confirmed');
      }

      const saveTime = endTime - startTime;
      
      return { 
        saveTime,
        confirmed: true,
        content: savedNote.content,
      };
    });

    // Test save failure recovery
    await this.runTest('Save Failure Recovery', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Save Failure Test',
        content: 'Initial',
      });

      // This test verifies that the system handles errors gracefully
      try {
        quickNotesService.autoSaveQuickNote(note.id, {
          content: 'Recovery test',
        });

        await this.wait(1200);

        const savedNote = quickNotesService.getQuickNoteById(note.id);
        if (!savedNote) throw new Error('Note not found');
        
        return { 
          recovered: true,
          content: savedNote.content,
        };
      } catch (error) {
        // If there's an error, it should be handled gracefully
        return { 
          recovered: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  /**
   * Performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('🚀 Testing Auto-Save Performance...');

    // Test large content auto-save
    await this.runTest('Large Content Auto-Save', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Large Content Test',
        content: 'Initial',
      });

      const testData = quickNotesTestDataGenerator.generateAutoSaveTestData();
      const largeContent = testData.largeContent;

      const startTime = Date.now();
      
      quickNotesService.autoSaveQuickNote(note.id, {
        content: largeContent,
      });

      await this.wait(1200);
      
      const endTime = Date.now();
      const saveTime = endTime - startTime;

      const savedNote = quickNotesService.getQuickNoteById(note.id);
      if (!savedNote) throw new Error('Note not found');
      if (savedNote.content !== largeContent) {
        throw new Error('Large content not saved correctly');
      }

      return { 
        contentLength: largeContent.length,
        saveTime,
        wordCount: savedNote.wordCount,
      };
    });

    // Test special characters auto-save
    await this.runTest('Special Characters Auto-Save', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Special Chars Test',
        content: 'Initial',
      });

      const testData = quickNotesTestDataGenerator.generateAutoSaveTestData();
      const specialContent = testData.specialCharacters;

      quickNotesService.autoSaveQuickNote(note.id, {
        content: specialContent,
      });

      await this.wait(1200);

      const savedNote = quickNotesService.getQuickNoteById(note.id);
      if (!savedNote) throw new Error('Note not found');
      if (savedNote.content !== specialContent) {
        throw new Error('Special characters not preserved');
      }

      return { 
        specialChars: specialContent,
        preserved: true,
      };
    });

    // Test multiple notes auto-save
    await this.runTest('Multiple Notes Auto-Save', async () => {
      const notes = [];
      for (let i = 0; i < 5; i++) {
        notes.push(quickNotesService.createQuickNote({
          title: `Multi Note ${i + 1}`,
          content: 'Initial',
        }));
      }

      const startTime = Date.now();

      // Trigger auto-save for all notes
      notes.forEach((note, index) => {
        quickNotesService.autoSaveQuickNote(note.id, {
          content: `Updated content ${index + 1}`,
        });
      });

      await this.wait(1200);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all notes were saved
      const savedNotes = notes.map(note => quickNotesService.getQuickNoteById(note.id));
      const allSaved = savedNotes.every((note, index) => 
        note?.content === `Updated content ${index + 1}`
      );

      if (!allSaved) throw new Error('Not all notes were auto-saved');

      return { 
        notesCount: notes.length,
        totalTime,
        averageTime: totalTime / notes.length,
      };
    });
  }

  /**
   * Error handling tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    console.log('⚠️ Testing Auto-Save Error Handling...');

    // Test auto-save with non-existent note
    await this.runTest('Non-Existent Note Auto-Save', async () => {
      try {
        quickNotesService.autoSaveQuickNote('non-existent-id', {
          content: 'Should not save',
        });

        await this.wait(1200);

        // Should not throw error, should handle gracefully
        return { handled: true };
      } catch (error) {
        throw new Error('Auto-save error not handled gracefully');
      }
    });

    // Test auto-save with invalid data
    await this.runTest('Invalid Data Auto-Save', async () => {
      const note = quickNotesService.createQuickNote({
        title: 'Invalid Data Test',
        content: 'Initial',
      });

      try {
        // Test with undefined content
        quickNotesService.autoSaveQuickNote(note.id, {
          content: undefined,
        });

        await this.wait(1200);

        const savedNote = quickNotesService.getQuickNoteById(note.id);
        if (!savedNote) throw new Error('Note not found');

        return { 
          handled: true,
          content: savedNote.content,
        };
      } catch (error) {
        throw new Error('Invalid data not handled gracefully');
      }
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

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private backupData(): void {
    this.originalData = quickNotesService.getAllQuickNotes();
  }

  private restoreData(): void {
    localStorage.setItem('astral_quick_notes', JSON.stringify(this.originalData));
  }

  private generateTestReport(): AutoSaveTestSuite {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName: 'Quick Notes Auto-Save Functionality',
      results: this.results,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
    };
  }
}

// Export test runner
export const quickNotesAutoSaveTests = new QuickNotesAutoSaveTestSuite();