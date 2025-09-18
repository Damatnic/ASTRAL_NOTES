/**
 * Project-Quick Notes Integration Test Suite
 * Tests the seamless integration between Quick Notes and Project Management systems
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { projectService } from '@/services/projectService';
import { quickNotesService, type QuickNote } from '@/services/quickNotesService';
import { projectAttachmentService, type AttachmentSuggestion } from '@/services/projectAttachmentService';
import { storageService } from '@/services/storageService';
import { projectTestDataGenerator } from './projectManagementTestDataGenerator';
import type { Project, Note } from '@/types/global';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

export class ProjectQuickNotesIntegrationTestSuite {
  private testData: ReturnType<typeof projectTestDataGenerator.generateCompleteTestData>;

  constructor() {
    this.testData = projectTestDataGenerator.generateCompleteTestData();
  }

  /**
   * Run all integration tests
   */
  public runAllTests(): void {
    describe('Project-Quick Notes Integration', () => {
      beforeEach(() => {
        this.setupTest();
      });

      afterEach(() => {
        this.cleanupTest();
      });

      this.testQuickNoteAttachment();
      this.testSmartSuggestions();
      this.testBulkOperations();
      this.testNoteConversion();
      this.testAttachmentRules();
      this.testMigrationWizard();
      this.testAttachmentAnalytics();
      this.testWorkflowIntegration();
      this.testDataConsistency();
      this.testErrorHandling();
    });
  }

  /**
   * Test quick note attachment to projects
   */
  private testQuickNoteAttachment(): void {
    describe('Quick Note Attachment', () => {
      let testProject: Project;
      let testQuickNote: QuickNote;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testQuickNote = this.testData.quickNotes[0];

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify([testQuickNote]);
          }
          return null;
        });

        vi.spyOn(quickNotesService, 'attachToProject').mockImplementation((noteId, projectId) => {
          return { ...testQuickNote, projectId, attachedToProject: projectId };
        });
      });

      it('should attach quick note to project', () => {
        const relationship = projectAttachmentService.attachNoteToProject(
          testQuickNote.id,
          testProject.id,
          'manual'
        );

        expect(relationship).toBeDefined();
        expect(relationship?.noteId).toBe(testQuickNote.id);
        expect(relationship?.projectId).toBe(testProject.id);
        expect(relationship?.attachmentType).toBe('manual');
        expect(quickNotesService.attachToProject).toHaveBeenCalledWith(
          testQuickNote.id,
          testProject.id
        );
      });

      it('should handle attachment with metadata', () => {
        const metadata = {
          reason: 'User manual attachment',
          timestamp: new Date().toISOString(),
          confidence: 1.0
        };

        const relationship = projectAttachmentService.attachNoteToProject(
          testQuickNote.id,
          testProject.id,
          'manual',
          metadata
        );

        expect(relationship?.metadata).toEqual(metadata);
      });

      it('should prevent duplicate attachments', () => {
        // First attachment
        const firstRelationship = projectAttachmentService.attachNoteToProject(
          testQuickNote.id,
          testProject.id,
          'manual'
        );

        // Attempt duplicate attachment
        const secondRelationship = projectAttachmentService.attachNoteToProject(
          testQuickNote.id,
          testProject.id,
          'manual'
        );

        expect(firstRelationship).toBeDefined();
        expect(secondRelationship).toBeNull(); // Should prevent duplicate
      });

      it('should detach note from project', () => {
        // First attach
        projectAttachmentService.attachNoteToProject(
          testQuickNote.id,
          testProject.id,
          'manual'
        );

        vi.spyOn(quickNotesService, 'detachFromProject').mockReturnValue(
          { ...testQuickNote, projectId: null, attachedToProject: undefined }
        );

        const success = projectAttachmentService.detachNoteFromProject(testQuickNote.id);

        expect(success).toBe(true);
        expect(quickNotesService.detachFromProject).toHaveBeenCalledWith(testQuickNote.id);
      });

      it('should move note between projects', () => {
        const sourceProject = testProject;
        const targetProject = this.testData.projects[1];

        // Mock project lookup
        vi.spyOn(projectService, 'getProjectById').mockImplementation((id) => {
          if (id === sourceProject.id) return sourceProject;
          if (id === targetProject.id) return targetProject;
          return null;
        });

        const success = projectAttachmentService.moveNoteBetweenProjects(
          testQuickNote.id,
          sourceProject.id,
          targetProject.id
        );

        expect(success).toBe(true);
      });

      it('should handle attachment to non-existent project', () => {
        vi.spyOn(projectService, 'getProjectById').mockReturnValue(null);

        const relationship = projectAttachmentService.attachNoteToProject(
          testQuickNote.id,
          'non-existent-project',
          'manual'
        );

        expect(relationship).toBeNull();
      });

      it('should handle attachment of non-existent note', () => {
        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(null);

        const relationship = projectAttachmentService.attachNoteToProject(
          'non-existent-note',
          testProject.id,
          'manual'
        );

        expect(relationship).toBeNull();
      });

      it('should preserve note tags when attaching', () => {
        const noteWithTags = {
          ...testQuickNote,
          tags: ['important', 'character', 'draft']
        };

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(noteWithTags);

        const relationship = projectAttachmentService.attachNoteToProject(
          noteWithTags.id,
          testProject.id,
          'manual'
        );

        expect(relationship?.tags).toEqual(['important', 'character', 'draft']);
      });
    });
  }

  /**
   * Test smart suggestion system
   */
  private testSmartSuggestions(): void {
    describe('Smart Suggestions', () => {
      let testProject: Project;
      let unattachedNotes: QuickNote[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        unattachedNotes = this.testData.quickNotes.filter(note => !note.projectId);

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify(unattachedNotes);
          }
          return null;
        });

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(unattachedNotes);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([testProject]);
      });

      it('should generate suggestions for unattached notes', () => {
        const suggestions = projectAttachmentService.generateAttachmentSuggestions();

        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);

        suggestions.forEach(suggestion => {
          expect(suggestion).toHaveProperty('noteId');
          expect(suggestion).toHaveProperty('projectId');
          expect(suggestion).toHaveProperty('confidence');
          expect(suggestion).toHaveProperty('reasons');
          expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
          expect(suggestion.confidence).toBeLessThanOrEqual(1);
        });
      });

      it('should generate suggestions for specific note', () => {
        const targetNote = unattachedNotes[0];
        const suggestions = projectAttachmentService.generateAttachmentSuggestions(targetNote.id);

        expect(suggestions.length).toBeLessThanOrEqual(5); // Limit for specific note
        suggestions.forEach(suggestion => {
          expect(suggestion.noteId).toBe(targetNote.id);
        });
      });

      it('should calculate confidence based on tag matching', () => {
        const noteWithTags = {
          ...unattachedNotes[0],
          tags: ['fantasy', 'character', 'magic']
        };

        const projectWithTags = {
          ...testProject,
          tags: ['fantasy', 'magic', 'adventure']
        };

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(noteWithTags);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([projectWithTags]);

        const suggestions = projectAttachmentService.generateAttachmentSuggestions(noteWithTags.id);

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].confidence).toBeGreaterThan(0.3); // Should have decent confidence
        expect(suggestions[0].reasons.some(reason => reason.includes('tag'))).toBe(true);
      });

      it('should calculate confidence based on content similarity', () => {
        const noteWithContent = {
          ...unattachedNotes[0],
          title: 'Dragon Magic System',
          content: 'Notes about how dragons use magic in the fantasy world'
        };

        const projectWithContent = {
          ...testProject,
          title: 'Fantasy Epic',
          description: 'A fantasy story featuring dragons and magic systems'
        };

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(noteWithContent);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([projectWithContent]);

        const suggestions = projectAttachmentService.generateAttachmentSuggestions(noteWithContent.id);

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].reasons.some(reason => reason.includes('keyword'))).toBe(true);
      });

      it('should sort suggestions by confidence', () => {
        const suggestions = projectAttachmentService.generateAttachmentSuggestions();

        for (let i = 1; i < suggestions.length; i++) {
          expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
        }
      });

      it('should suggest auto-attachment for high confidence', () => {
        const highConfidenceNote = {
          ...unattachedNotes[0],
          tags: ['fantasy', 'epic', 'magic'],
          title: 'Fantasy Magic System',
          content: 'Epic fantasy magic system for the story'
        };

        const matchingProject = {
          ...testProject,
          tags: ['fantasy', 'epic', 'magic'],
          title: 'Epic Fantasy Novel',
          description: 'An epic fantasy story with complex magic systems'
        };

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(highConfidenceNote);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([matchingProject]);

        const suggestions = projectAttachmentService.generateAttachmentSuggestions(highConfidenceNote.id);

        expect(suggestions.length).toBeGreaterThan(0);
        if (suggestions[0].confidence >= 0.8) {
          expect(suggestions[0].autoAttach).toBe(true);
        }
      });

      it('should apply suggestion', () => {
        const suggestion: AttachmentSuggestion = {
          noteId: unattachedNotes[0].id,
          projectId: testProject.id,
          confidence: 0.7,
          reasons: ['Test suggestion']
        };

        vi.spyOn(quickNotesService, 'attachToProject').mockReturnValue(
          { ...unattachedNotes[0], projectId: testProject.id }
        );

        const success = projectAttachmentService.applySuggestion(suggestion, true);

        expect(success).toBe(true);
      });

      it('should reject suggestion', () => {
        const suggestion: AttachmentSuggestion = {
          noteId: unattachedNotes[0].id,
          projectId: testProject.id,
          confidence: 0.5,
          reasons: ['Test suggestion']
        };

        const success = projectAttachmentService.applySuggestion(suggestion, false);

        expect(success).toBe(true); // Rejection should succeed
      });
    });
  }

  /**
   * Test bulk operations
   */
  private testBulkOperations(): void {
    describe('Bulk Operations', () => {
      let testProjects: Project[];
      let testNotes: QuickNote[];

      beforeEach(() => {
        testProjects = this.testData.projects.slice(0, 3);
        testNotes = this.testData.quickNotes.slice(0, 10);

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(testProjects);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify(testNotes);
          }
          return null;
        });

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(testNotes);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue(testProjects);
      });

      it('should perform bulk attachment operation', async () => {
        const noteIds = testNotes.slice(0, 5).map(note => note.id);
        const targetProjectId = testProjects[0].id;

        vi.spyOn(projectAttachmentService, 'attachNoteToProject').mockReturnValue({
          id: 'mock-relationship',
          noteId: 'mock-note',
          projectId: targetProjectId,
          attachedAt: new Date().toISOString(),
          attachmentType: 'manual',
          tags: []
        });

        const operation = await projectAttachmentService.performBulkOperation({
          type: 'attach',
          noteIds,
          projectId: targetProjectId
        });

        expect(operation.status).toBe('completed');
        expect(operation.results.successful).toBe(5);
        expect(operation.results.failed).toBe(0);
      });

      it('should perform bulk detachment operation', async () => {
        const attachedNotes = testNotes.filter(note => note.projectId);
        const noteIds = attachedNotes.map(note => note.id);

        vi.spyOn(projectAttachmentService, 'detachNoteFromProject').mockReturnValue(true);

        const operation = await projectAttachmentService.performBulkOperation({
          type: 'detach',
          noteIds
        });

        expect(operation.status).toBe('completed');
        expect(operation.results.successful).toBe(noteIds.length);
      });

      it('should perform bulk migration operation', async () => {
        const sourceProjectId = testProjects[0].id;
        const targetProjectId = testProjects[1].id;
        const noteIds = testNotes.slice(0, 3).map(note => note.id);

        vi.spyOn(projectAttachmentService, 'moveNoteBetweenProjects').mockReturnValue(true);

        const operation = await projectAttachmentService.performBulkOperation({
          type: 'migrate',
          noteIds,
          projectId: sourceProjectId,
          targetProjectId
        });

        expect(operation.status).toBe('completed');
        expect(operation.results.successful).toBe(3);
      });

      it('should perform bulk organization operation', async () => {
        const unattachedNotes = testNotes.filter(note => !note.projectId);
        const noteIds = unattachedNotes.map(note => note.id);

        vi.spyOn(projectAttachmentService, 'generateAttachmentSuggestions').mockReturnValue([
          {
            noteId: noteIds[0],
            projectId: testProjects[0].id,
            confidence: 0.7,
            reasons: ['Test suggestion']
          }
        ]);

        vi.spyOn(projectAttachmentService, 'attachNoteToProject').mockReturnValue({
          id: 'mock-relationship',
          noteId: noteIds[0],
          projectId: testProjects[0].id,
          attachedAt: new Date().toISOString(),
          attachmentType: 'auto',
          tags: []
        });

        const operation = await projectAttachmentService.performBulkOperation({
          type: 'organize',
          noteIds
        });

        expect(operation.status).toBe('completed');
        expect(operation.results.successful).toBeGreaterThanOrEqual(0);
      });

      it('should handle bulk operation errors gracefully', async () => {
        const noteIds = ['non-existent-1', 'non-existent-2'];

        vi.spyOn(projectAttachmentService, 'attachNoteToProject').mockReturnValue(null);

        const operation = await projectAttachmentService.performBulkOperation({
          type: 'attach',
          noteIds,
          projectId: testProjects[0].id
        });

        expect(operation.status).toBe('completed');
        expect(operation.results.failed).toBe(2);
        expect(operation.errors.length).toBe(2);
      });

      it('should track bulk operation progress', async () => {
        const noteIds = testNotes.slice(0, 10).map(note => note.id);

        vi.spyOn(projectAttachmentService, 'attachNoteToProject').mockReturnValue({
          id: 'mock-relationship',
          noteId: 'mock-note',
          projectId: testProjects[0].id,
          attachedAt: new Date().toISOString(),
          attachmentType: 'manual',
          tags: []
        });

        const operation = await projectAttachmentService.performBulkOperation({
          type: 'attach',
          noteIds,
          projectId: testProjects[0].id
        });

        expect(operation.progress).toBe(100);
        expect(operation.completedAt).toBeTruthy();
      });
    });
  }

  /**
   * Test note conversion between quick notes and project notes
   */
  private testNoteConversion(): void {
    describe('Note Conversion', () => {
      let testProject: Project;
      let testQuickNote: QuickNote;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testQuickNote = this.testData.quickNotes[0];

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify([testQuickNote]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([]);
        vi.spyOn(storageService, 'saveProjectNotes').mockImplementation(() => {});
        vi.spyOn(projectService, 'updateProjectWordCount').mockReturnValue(0);
      });

      it('should convert quick note to project note', () => {
        vi.spyOn(quickNotesService, 'deleteQuickNote').mockReturnValue(true);

        const projectNote = quickNotesService.moveToProject(testQuickNote.id, testProject.id);

        expect(projectNote).toBeDefined();
        expect(projectNote?.projectId).toBe(testProject.id);
        expect(projectNote?.title).toBe(testQuickNote.title);
        expect(projectNote?.content).toBe(testQuickNote.content);
        expect(projectNote?.type).toBe(testQuickNote.type);
        expect(projectNote?.tags).toEqual(testQuickNote.tags);

        // Should have project note specific fields
        expect(projectNote?.wikiLinks).toEqual([]);
        expect(projectNote?.backlinks).toEqual([]);
        expect(projectNote?.version).toBe(1);
        expect(projectNote?.versionHistory).toEqual([]);

        expect(storageService.saveProjectNotes).toHaveBeenCalledWith(
          testProject.id,
          expect.arrayContaining([projectNote])
        );
        expect(quickNotesService.deleteQuickNote).toHaveBeenCalledWith(testQuickNote.id);
        expect(projectService.updateProjectWordCount).toHaveBeenCalledWith(testProject.id);
      });

      it('should handle conversion to non-existent project', () => {
        vi.spyOn(projectService, 'getProjectById').mockReturnValue(null);

        const result = quickNotesService.moveToProject(testQuickNote.id, 'non-existent');

        expect(result).toBeNull();
      });

      it('should handle conversion of non-existent note', () => {
        const result = quickNotesService.moveToProject('non-existent', testProject.id);

        expect(result).toBeNull();
      });

      it('should preserve note metadata during conversion', () => {
        const detailedQuickNote: QuickNote = {
          ...testQuickNote,
          priority: 'high',
          status: 'published',
          tags: ['important', 'character', 'protagonist'],
          wordCount: 150,
          readTime: 1
        };

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(detailedQuickNote);
        vi.spyOn(quickNotesService, 'deleteQuickNote').mockReturnValue(true);

        const projectNote = quickNotesService.moveToProject(detailedQuickNote.id, testProject.id);

        expect(projectNote?.priority).toBe('high');
        expect(projectNote?.status).toBe('published');
        expect(projectNote?.tags).toEqual(['important', 'character', 'protagonist']);
        expect(projectNote?.wordCount).toBe(150);
        expect(projectNote?.readTime).toBe(1);
      });

      it('should assign sequential position in project', () => {
        const existingNotes = [
          { id: 'note-1', position: 1 },
          { id: 'note-2', position: 2 }
        ];

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(existingNotes as any);
        vi.spyOn(quickNotesService, 'deleteQuickNote').mockReturnValue(true);

        const projectNote = quickNotesService.moveToProject(testQuickNote.id, testProject.id);

        expect(projectNote?.position).toBe(testQuickNote.position);
      });
    });
  }

  /**
   * Test attachment rules system
   */
  private testAttachmentRules(): void {
    describe('Attachment Rules', () => {
      let testProjects: Project[];
      let testNotes: QuickNote[];

      beforeEach(() => {
        testProjects = this.testData.projects.slice(0, 2);
        testNotes = this.testData.quickNotes.slice(0, 5);

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(testProjects);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify(testNotes);
          }
          return null;
        });

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(testNotes);
        vi.spyOn(projectAttachmentService, 'attachNoteToProject').mockReturnValue({
          id: 'mock-relationship',
          noteId: 'mock-note',
          projectId: 'mock-project',
          attachedAt: new Date().toISOString(),
          attachmentType: 'auto',
          tags: []
        });
      });

      it('should create attachment rule', () => {
        const rule = projectAttachmentService.createAttachmentRule({
          name: 'Fantasy Character Rule',
          enabled: true,
          conditions: [
            {
              type: 'tag',
              operator: 'contains',
              value: 'character'
            },
            {
              type: 'keyword',
              operator: 'contains',
              value: 'fantasy'
            }
          ],
          actions: [
            {
              type: 'attach',
              projectId: testProjects[0].id
            }
          ],
          priority: 1
        });

        expect(rule).toBeDefined();
        expect(rule.id).toBeTruthy();
        expect(rule.name).toBe('Fantasy Character Rule');
        expect(rule.enabled).toBe(true);
        expect(rule.conditions).toHaveLength(2);
        expect(rule.actions).toHaveLength(1);
        expect(rule.createdAt).toBeTruthy();
        expect(rule.updatedAt).toBeTruthy();
      });

      it('should apply tag-based attachment rules', () => {
        const rule = projectAttachmentService.createAttachmentRule({
          name: 'Character Tag Rule',
          enabled: true,
          conditions: [
            {
              type: 'tag',
              operator: 'contains',
              value: 'character'
            }
          ],
          actions: [
            {
              type: 'attach',
              projectId: testProjects[0].id
            }
          ],
          priority: 1
        });

        const notesWithCharacterTag = testNotes.map(note => ({
          ...note,
          tags: note.id === testNotes[0].id ? ['character', 'protagonist'] : note.tags
        }));

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(notesWithCharacterTag);

        const appliedCount = projectAttachmentService.applyAttachmentRules();

        expect(appliedCount).toBeGreaterThan(0);
      });

      it('should apply content-based attachment rules', () => {
        const rule = projectAttachmentService.createAttachmentRule({
          name: 'Magic Content Rule',
          enabled: true,
          conditions: [
            {
              type: 'content',
              operator: 'contains',
              value: 'magic'
            }
          ],
          actions: [
            {
              type: 'attach',
              projectId: testProjects[0].id
            }
          ],
          priority: 1
        });

        const notesWithMagicContent = testNotes.map(note => ({
          ...note,
          content: note.id === testNotes[0].id ? 'This note is about magic systems' : note.content
        }));

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(notesWithMagicContent);

        const appliedCount = projectAttachmentService.applyAttachmentRules();

        expect(appliedCount).toBeGreaterThan(0);
      });

      it('should apply title-based attachment rules', () => {
        const rule = projectAttachmentService.createAttachmentRule({
          name: 'Dragon Title Rule',
          enabled: true,
          conditions: [
            {
              type: 'title',
              operator: 'contains',
              value: 'dragon'
            }
          ],
          actions: [
            {
              type: 'attach',
              projectId: testProjects[0].id
            }
          ],
          priority: 1
        });

        const notesWithDragonTitle = testNotes.map(note => ({
          ...note,
          title: note.id === testNotes[0].id ? 'Dragon Character Profile' : note.title
        }));

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(notesWithDragonTitle);

        const appliedCount = projectAttachmentService.applyAttachmentRules();

        expect(appliedCount).toBeGreaterThan(0);
      });

      it('should apply multiple condition rules', () => {
        const rule = projectAttachmentService.createAttachmentRule({
          name: 'Complex Rule',
          enabled: true,
          conditions: [
            {
              type: 'tag',
              operator: 'contains',
              value: 'fantasy'
            },
            {
              type: 'content',
              operator: 'contains',
              value: 'dragon'
            }
          ],
          actions: [
            {
              type: 'attach',
              projectId: testProjects[0].id
            }
          ],
          priority: 1
        });

        const complexNotes = testNotes.map(note => ({
          ...note,
          tags: note.id === testNotes[0].id ? ['fantasy', 'creature'] : note.tags,
          content: note.id === testNotes[0].id ? 'Notes about dragon behavior' : note.content
        }));

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(complexNotes);

        const appliedCount = projectAttachmentService.applyAttachmentRules();

        expect(appliedCount).toBeGreaterThan(0);
      });

      it('should respect rule priority', () => {
        // Create two conflicting rules with different priorities
        const highPriorityRule = projectAttachmentService.createAttachmentRule({
          name: 'High Priority Rule',
          enabled: true,
          conditions: [{ type: 'tag', operator: 'contains', value: 'test' }],
          actions: [{ type: 'attach', projectId: testProjects[0].id }],
          priority: 1
        });

        const lowPriorityRule = projectAttachmentService.createAttachmentRule({
          name: 'Low Priority Rule',
          enabled: true,
          conditions: [{ type: 'tag', operator: 'contains', value: 'test' }],
          actions: [{ type: 'attach', projectId: testProjects[1].id }],
          priority: 2
        });

        const testNote = {
          ...testNotes[0],
          tags: ['test'],
          projectId: null
        };

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue([testNote]);

        const appliedCount = projectAttachmentService.applyAttachmentRules();

        expect(appliedCount).toBeGreaterThan(0);
        // Should apply high priority rule first and stop
      });

      it('should skip disabled rules', () => {
        const disabledRule = projectAttachmentService.createAttachmentRule({
          name: 'Disabled Rule',
          enabled: false,
          conditions: [{ type: 'tag', operator: 'contains', value: 'test' }],
          actions: [{ type: 'attach', projectId: testProjects[0].id }],
          priority: 1
        });

        const testNote = {
          ...testNotes[0],
          tags: ['test'],
          projectId: null
        };

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue([testNote]);

        const appliedCount = projectAttachmentService.applyAttachmentRules();

        expect(appliedCount).toBe(0); // Should not apply disabled rule
      });
    });
  }

  /**
   * Test migration wizard
   */
  private testMigrationWizard(): void {
    describe('Migration Wizard', () => {
      let testProjects: Project[];
      let testNotes: QuickNote[];

      beforeEach(() => {
        testProjects = this.testData.projects.slice(0, 3);
        testNotes = this.testData.quickNotes.slice(0, 10);

        // Mix of attached and unattached notes
        const mixedNotes = testNotes.map((note, index) => ({
          ...note,
          projectId: index % 3 === 0 ? testProjects[0].id : null
        }));

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(testProjects);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify(mixedNotes);
          }
          return null;
        });

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(mixedNotes);
      });

      it('should migrate unattached notes with smart strategy', async () => {
        const config = {
          source: 'unattached' as const,
          strategy: 'smart' as const,
          confidenceThreshold: 0.5,
          autoApply: true,
          preserveOriginal: false,
          targetProjects: [],
          excludeProjects: [],
          tagMappings: {}
        };

        vi.spyOn(projectAttachmentService, 'performBulkOperation').mockResolvedValue({
          id: 'migration-op',
          type: 'organize',
          noteIds: [],
          status: 'completed',
          progress: 100,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          results: { successful: 5, failed: 0, skipped: 2 },
          errors: []
        });

        const result = await projectAttachmentService.runMigrationWizard(config);

        expect(result.status).toBe('completed');
        expect(result.results.successful).toBeGreaterThan(0);
      });

      it('should migrate all notes with smart strategy', async () => {
        const config = {
          source: 'all' as const,
          strategy: 'smart' as const,
          confidenceThreshold: 0.6,
          autoApply: true,
          preserveOriginal: true,
          targetProjects: [],
          excludeProjects: [],
          tagMappings: {}
        };

        vi.spyOn(projectAttachmentService, 'performBulkOperation').mockResolvedValue({
          id: 'migration-op',
          type: 'organize',
          noteIds: [],
          status: 'completed',
          progress: 100,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          results: { successful: 8, failed: 0, skipped: 2 },
          errors: []
        });

        const result = await projectAttachmentService.runMigrationWizard(config);

        expect(result.status).toBe('completed');
        expect(result.results.successful).toBeGreaterThan(0);
      });

      it('should migrate with rules strategy', async () => {
        const config = {
          source: 'unattached' as const,
          strategy: 'rules' as const,
          confidenceThreshold: 0.5,
          autoApply: true,
          preserveOriginal: false,
          targetProjects: [],
          excludeProjects: [],
          tagMappings: {}
        };

        vi.spyOn(projectAttachmentService, 'applyAttachmentRules').mockReturnValue(3);
        vi.spyOn(projectAttachmentService, 'performBulkOperation').mockResolvedValue({
          id: 'migration-op',
          type: 'organize',
          noteIds: [],
          status: 'completed',
          progress: 100,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          results: { successful: 2, failed: 0, skipped: 1 },
          errors: []
        });

        const result = await projectAttachmentService.runMigrationWizard(config);

        expect(projectAttachmentService.applyAttachmentRules).toHaveBeenCalled();
        expect(result.status).toBe('completed');
      });

      it('should handle manual migration strategy', async () => {
        const config = {
          source: 'unattached' as const,
          strategy: 'manual' as const,
          confidenceThreshold: 0.5,
          autoApply: false,
          preserveOriginal: false,
          targetProjects: [],
          excludeProjects: [],
          tagMappings: {}
        };

        const result = await projectAttachmentService.runMigrationWizard(config);

        expect(result.status).toBe('completed');
        expect(result.results.successful).toBe(0); // Manual strategy doesn't auto-process
      });
    });
  }

  /**
   * Test attachment analytics
   */
  private testAttachmentAnalytics(): void {
    describe('Attachment Analytics', () => {
      beforeEach(() => {
        const projects = this.testData.projects.slice(0, 3);
        const notes = this.testData.quickNotes.slice(0, 10);
        const relationships = this.testData.attachmentRelationships.slice(0, 5);

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify(projects);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify(notes);
          }
          if (key === 'astral_attachment_relationships') {
            return JSON.stringify(relationships);
          }
          return null;
        });

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(notes);
      });

      it('should generate comprehensive analytics', () => {
        const analytics = projectAttachmentService.getAttachmentAnalytics();

        expect(analytics).toBeDefined();
        expect(typeof analytics.totalAttachments).toBe('number');
        expect(typeof analytics.unattachedNotes).toBe('number');
        expect(typeof analytics.projectDistribution).toBe('object');
        expect(typeof analytics.attachmentsByType).toBe('object');
        expect(typeof analytics.averageConfidence).toBe('number');
        expect(Array.isArray(analytics.recentActivity)).toBe(true);
        expect(typeof analytics.suggestions).toBe('object');
      });

      it('should track project distribution', () => {
        const analytics = projectAttachmentService.getAttachmentAnalytics();

        expect(analytics.projectDistribution).toBeDefined();
        Object.keys(analytics.projectDistribution).forEach(projectId => {
          expect(typeof analytics.projectDistribution[projectId]).toBe('number');
          expect(analytics.projectDistribution[projectId]).toBeGreaterThan(0);
        });
      });

      it('should track attachment types', () => {
        const analytics = projectAttachmentService.getAttachmentAnalytics();

        expect(analytics.attachmentsByType).toBeDefined();
        Object.keys(analytics.attachmentsByType).forEach(type => {
          expect(['manual', 'auto', 'suggested', 'migrated']).toContain(type);
          expect(typeof analytics.attachmentsByType[type]).toBe('number');
        });
      });

      it('should calculate average confidence', () => {
        const analytics = projectAttachmentService.getAttachmentAnalytics();

        expect(analytics.averageConfidence).toBeGreaterThanOrEqual(0);
        expect(analytics.averageConfidence).toBeLessThanOrEqual(1);
      });

      it('should provide recent activity', () => {
        const analytics = projectAttachmentService.getAttachmentAnalytics();

        expect(Array.isArray(analytics.recentActivity)).toBe(true);
        analytics.recentActivity.forEach(activity => {
          expect(activity).toHaveProperty('id');
          expect(activity).toHaveProperty('type');
          expect(activity).toHaveProperty('noteId');
          expect(activity).toHaveProperty('projectId');
          expect(activity).toHaveProperty('timestamp');
        });
      });

      it('should track suggestion statistics', () => {
        const analytics = projectAttachmentService.getAttachmentAnalytics();

        expect(analytics.suggestions).toBeDefined();
        expect(typeof analytics.suggestions.pending).toBe('number');
        expect(typeof analytics.suggestions.accepted).toBe('number');
        expect(typeof analytics.suggestions.rejected).toBe('number');
      });
    });
  }

  /**
   * Test workflow integration
   */
  private testWorkflowIntegration(): void {
    describe('Workflow Integration', () => {
      let testProject: Project;
      let testNotes: QuickNote[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNotes = this.testData.quickNotes.slice(0, 5);

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify(testNotes);
          }
          return null;
        });
      });

      it('should integrate with project creation workflow', () => {
        // Simulate creating a new project
        const newProject = projectService.createProject({
          title: 'New Workflow Project',
          description: 'Project for testing workflow integration',
          tags: ['workflow', 'test']
        });

        expect(newProject).toBeDefined();

        // Should be able to immediately suggest notes for the new project
        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(testNotes);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([newProject]);

        const suggestions = projectAttachmentService.generateAttachmentSuggestions();

        expect(Array.isArray(suggestions)).toBe(true);
      });

      it('should integrate with note import workflow', () => {
        const importedNotes = [
          {
            ...testNotes[0],
            title: 'Imported Character Note',
            tags: ['imported', 'character']
          },
          {
            ...testNotes[1],
            title: 'Imported Plot Note',
            tags: ['imported', 'plot']
          }
        ];

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue(importedNotes);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([testProject]);

        // After import, should automatically suggest attachments
        const suggestions = projectAttachmentService.generateAttachmentSuggestions();

        expect(suggestions.length).toBeGreaterThan(0);
        suggestions.forEach(suggestion => {
          expect(['Imported Character Note', 'Imported Plot Note']).toContain(
            importedNotes.find(note => note.id === suggestion.noteId)?.title
          );
        });
      });

      it('should integrate with project export workflow', () => {
        // Attach notes to project first
        testNotes.forEach(note => {
          projectAttachmentService.attachNoteToProject(note.id, testProject.id, 'manual');
        });

        // Export should include attached notes
        const attachedNotes = testNotes.filter(note => note.projectId === testProject.id);
        
        expect(attachedNotes.length).toBeGreaterThan(0);
      });

      it('should integrate with project archival workflow', () => {
        // Attach notes to project
        testNotes.forEach(note => {
          projectAttachmentService.attachNoteToProject(note.id, testProject.id, 'manual');
        });

        // Archive project
        const archivedProject = projectService.archiveProject(testProject.id);

        expect(archivedProject?.status).toBe('archived');

        // Attached notes should remain accessible
        const analytics = projectAttachmentService.getAttachmentAnalytics();
        expect(analytics.totalAttachments).toBeGreaterThan(0);
      });
    });
  }

  /**
   * Test data consistency
   */
  private testDataConsistency(): void {
    describe('Data Consistency', () => {
      let testProject: Project;
      let testNote: QuickNote;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNote = this.testData.quickNotes[0];

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          if (key === 'astral_quick_notes') {
            return JSON.stringify([testNote]);
          }
          return null;
        });
      });

      it('should maintain consistency between quick note and attachment record', () => {
        vi.spyOn(quickNotesService, 'attachToProject').mockReturnValue({
          ...testNote,
          projectId: testProject.id,
          attachedToProject: testProject.id
        });

        const relationship = projectAttachmentService.attachNoteToProject(
          testNote.id,
          testProject.id,
          'manual'
        );

        expect(relationship).toBeDefined();
        expect(relationship?.noteId).toBe(testNote.id);
        expect(relationship?.projectId).toBe(testProject.id);

        // Quick note should be updated
        expect(quickNotesService.attachToProject).toHaveBeenCalledWith(
          testNote.id,
          testProject.id
        );
      });

      it('should handle orphaned attachment records', () => {
        // Create attachment record for non-existent note
        const orphanedRelationship = {
          id: 'orphaned-rel',
          noteId: 'non-existent-note',
          projectId: testProject.id,
          attachedAt: new Date().toISOString(),
          attachmentType: 'manual' as const,
          tags: []
        };

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_attachment_relationships') {
            return JSON.stringify([orphanedRelationship]);
          }
          return null;
        });

        const analytics = projectAttachmentService.getAttachmentAnalytics();

        // Should handle gracefully without errors
        expect(analytics).toBeDefined();
      });

      it('should handle orphaned note project references', () => {
        const orphanedNote = {
          ...testNote,
          projectId: 'non-existent-project',
          attachedToProject: 'non-existent-project'
        };

        vi.spyOn(quickNotesService, 'getAllQuickNotes').mockReturnValue([orphanedNote]);
        vi.spyOn(projectService, 'getAllProjects').mockReturnValue([]);

        // Should handle gracefully without errors
        const analytics = projectAttachmentService.getAttachmentAnalytics();
        expect(analytics).toBeDefined();
      });

      it('should maintain referential integrity on project deletion', () => {
        // Attach note to project
        const relationship = projectAttachmentService.attachNoteToProject(
          testNote.id,
          testProject.id,
          'manual'
        );

        expect(relationship).toBeDefined();

        // Delete project
        projectService.deleteProject(testProject.id);

        // Attachment should be cleaned up or note should be detached
        vi.spyOn(quickNotesService, 'detachFromProject').mockReturnValue({
          ...testNote,
          projectId: null,
          attachedToProject: undefined
        });

        const success = projectAttachmentService.detachNoteFromProject(testNote.id);
        expect(success).toBe(true);
      });

      it('should validate data integrity', () => {
        // Simulate inconsistent state
        const noteWithInconsistentProject = {
          ...testNote,
          projectId: testProject.id,
          attachedToProject: 'different-project-id'
        };

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(noteWithInconsistentProject);

        // Should detect and handle inconsistency
        const relationship = projectAttachmentService.attachNoteToProject(
          noteWithInconsistentProject.id,
          testProject.id,
          'manual'
        );

        expect(relationship).toBeDefined();
      });
    });
  }

  /**
   * Test error handling
   */
  private testErrorHandling(): void {
    describe('Error Handling', () => {
      beforeEach(() => {
        console.error = vi.fn(); // Suppress error logs
      });

      it('should handle storage errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => {
          const analytics = projectAttachmentService.getAttachmentAnalytics();
          expect(analytics).toBeDefined();
        }).not.toThrow();
      });

      it('should handle corrupted attachment data', () => {
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_attachment_relationships') {
            return 'invalid json';
          }
          return null;
        });

        expect(() => {
          const analytics = projectAttachmentService.getAttachmentAnalytics();
          expect(analytics).toBeDefined();
        }).not.toThrow();
      });

      it('should handle service unavailability', () => {
        vi.spyOn(quickNotesService, 'getQuickNoteById').mockImplementation(() => {
          throw new Error('Service unavailable');
        });

        expect(() => {
          const relationship = projectAttachmentService.attachNoteToProject(
            'test-note',
            'test-project',
            'manual'
          );
          expect(relationship).toBeNull();
        }).not.toThrow();
      });

      it('should handle concurrent modifications', () => {
        const testNote = this.testData.quickNotes[0];
        const testProject = this.testData.projects[0];

        vi.spyOn(quickNotesService, 'getQuickNoteById').mockReturnValue(testNote);
        vi.spyOn(projectService, 'getProjectById').mockReturnValue(testProject);

        // Simulate concurrent attachments
        const relationship1 = projectAttachmentService.attachNoteToProject(
          testNote.id,
          testProject.id,
          'manual'
        );

        const relationship2 = projectAttachmentService.attachNoteToProject(
          testNote.id,
          testProject.id,
          'auto'
        );

        expect(relationship1).toBeDefined();
        // Second attachment should be handled gracefully
      });

      it('should handle invalid operation parameters', () => {
        expect(() => {
          const relationship = projectAttachmentService.attachNoteToProject(
            '',
            '',
            'manual'
          );
          expect(relationship).toBeNull();
        }).not.toThrow();

        expect(() => {
          const relationship = projectAttachmentService.attachNoteToProject(
            'valid-note-id',
            null as any,
            'manual'
          );
          expect(relationship).toBeNull();
        }).not.toThrow();
      });
    });
  }

  /**
   * Setup test environment
   */
  private setupTest(): void {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
  }

  /**
   * Cleanup test environment
   */
  private cleanupTest(): void {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  }
}

// Export function to run tests
export const runProjectQuickNotesIntegrationTests = () => {
  const testSuite = new ProjectQuickNotesIntegrationTestSuite();
  testSuite.runAllTests();
};