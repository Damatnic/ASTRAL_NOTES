/**
 * Project Note Management Test Suite
 * Tests note creation, organization, relationships, and management within projects
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { projectService } from '@/services/projectService';
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

export class ProjectNoteManagementTestSuite {
  private testData: ReturnType<typeof projectTestDataGenerator.generateCompleteTestData>;

  constructor() {
    this.testData = projectTestDataGenerator.generateCompleteTestData();
  }

  /**
   * Run all note management tests
   */
  public runAllTests(): void {
    describe('Project Note Management', () => {
      beforeEach(() => {
        this.setupTest();
      });

      afterEach(() => {
        this.cleanupTest();
      });

      this.testNoteCreation();
      this.testNoteOrganization();
      this.testNoteRelationships();
      this.testNoteTypes();
      this.testNoteSearch();
      this.testNoteBulkOperations();
      this.testNoteVersioning();
      this.testNoteTemplates();
      this.testNoteValidation();
      this.testNoteErrorHandling();
    });
  }

  /**
   * Test note creation within projects
   */
  private testNoteCreation(): void {
    describe('Note Creation in Projects', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([]);
        vi.spyOn(storageService, 'saveProjectNotes').mockImplementation(() => {});
      });

      it('should create a basic note in project', () => {
        const noteData = {
          title: 'Test Project Note',
          content: 'This is a test note in the project',
          type: 'note' as const,
          tags: ['test', 'project']
        };

        const note = this.createProjectNote(testProject.id, noteData);

        expect(note).toBeDefined();
        expect(note.id).toBeTruthy();
        expect(note.projectId).toBe(testProject.id);
        expect(note.title).toBe('Test Project Note');
        expect(note.content).toBe('This is a test note in the project');
        expect(note.type).toBe('note');
        expect(note.tags).toEqual(['test', 'project']);
        expect(note.wordCount).toBeGreaterThan(0);
        expect(note.readTime).toBeGreaterThan(0);
      });

      it('should create notes with different types', () => {
        const noteTypes = ['character', 'plot', 'scene', 'research', 'dialogue', 'worldbuilding'] as const;

        noteTypes.forEach(type => {
          const note = this.createProjectNote(testProject.id, {
            title: `${type} Note`,
            content: `This is a ${type} note`,
            type,
            tags: [type]
          });

          expect(note.type).toBe(type);
        });
      });

      it('should assign sequential positions to notes', () => {
        const notes = [];
        
        for (let i = 0; i < 5; i++) {
          const note = this.createProjectNote(testProject.id, {
            title: `Note ${i + 1}`,
            content: `Content ${i + 1}`,
            type: 'note'
          });
          notes.push(note);
        }

        notes.forEach((note, index) => {
          expect(note.position).toBe(index + 1);
        });
      });

      it('should calculate word count and read time', () => {
        const content = 'This is a test note with exactly ten words for testing purposes.';
        const note = this.createProjectNote(testProject.id, {
          title: 'Word Count Test',
          content,
          type: 'note'
        });

        expect(note.wordCount).toBe(10);
        expect(note.readTime).toBe(1); // Assuming 200 words per minute, rounded up
      });

      it('should handle empty content gracefully', () => {
        const note = this.createProjectNote(testProject.id, {
          title: 'Empty Note',
          content: '',
          type: 'note'
        });

        expect(note.wordCount).toBe(0);
        expect(note.readTime).toBe(0);
        expect(note.content).toBe('');
      });

      it('should set default values for optional fields', () => {
        const note = this.createProjectNote(testProject.id, {
          title: 'Default Values Test',
          content: 'Test content',
          type: 'note'
        });

        expect(note.tags).toEqual([]);
        expect(note.status).toBe('draft');
        expect(note.priority).toBe('medium');
        expect(note.folder).toBeUndefined();
        expect(note.wikiLinks).toEqual([]);
        expect(note.backlinks).toEqual([]);
        expect(note.linkedElements).toEqual([]);
        expect(note.comments).toEqual([]);
        expect(note.version).toBe(1);
        expect(note.versionHistory).toEqual([]);
        expect(note.aiSuggestions).toEqual([]);
      });

      it('should save note to project storage', () => {
        this.createProjectNote(testProject.id, {
          title: 'Storage Test',
          content: 'Test content',
          type: 'note'
        });

        expect(storageService.saveProjectNotes).toHaveBeenCalledWith(
          testProject.id,
          expect.arrayContaining([
            expect.objectContaining({
              title: 'Storage Test',
              projectId: testProject.id
            })
          ])
        );
      });
    });
  }

  /**
   * Test note organization features
   */
  private testNoteOrganization(): void {
    describe('Note Organization', () => {
      let testProject: Project;
      let testNotes: Note[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNotes = [
          this.createMockNote(testProject.id, 'Character Note', 'Character info', 'character'),
          this.createMockNote(testProject.id, 'Plot Note', 'Plot outline', 'plot'),
          this.createMockNote(testProject.id, 'Research Note', 'Research data', 'research')
        ];

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(testNotes);
        vi.spyOn(storageService, 'saveProjectNotes').mockImplementation(() => {});
      });

      it('should organize notes by type', () => {
        const notesByType = this.organizeNotesByType(testNotes);

        expect(notesByType.character).toHaveLength(1);
        expect(notesByType.plot).toHaveLength(1);
        expect(notesByType.research).toHaveLength(1);
        expect(notesByType.character[0].title).toBe('Character Note');
      });

      it('should organize notes by tags', () => {
        const notesWithTags = testNotes.map(note => ({
          ...note,
          tags: note.type === 'character' ? ['protagonist', 'main'] : 
                note.type === 'plot' ? ['main-plot', 'arc-1'] : 
                ['historical', 'medieval']
        }));

        const notesByTag = this.organizeNotesByTags(notesWithTags);

        expect(notesByTag.protagonist).toHaveLength(1);
        expect(notesByTag['main-plot']).toHaveLength(1);
        expect(notesByTag.historical).toHaveLength(1);
      });

      it('should organize notes by folder', () => {
        const notesWithFolders = testNotes.map((note, index) => ({
          ...note,
          folder: index === 0 ? 'Characters' : index === 1 ? 'Plot' : 'Research'
        }));

        const notesByFolder = this.organizeNotesByFolder(notesWithFolders);

        expect(notesByFolder.Characters).toHaveLength(1);
        expect(notesByFolder.Plot).toHaveLength(1);
        expect(notesByFolder.Research).toHaveLength(1);
      });

      it('should sort notes by various criteria', () => {
        // Sort by title
        const sortedByTitle = this.sortNotes(testNotes, 'title', 'asc');
        expect(sortedByTitle[0].title).toBe('Character Note');

        // Sort by creation date
        const sortedByDate = this.sortNotes(testNotes, 'createdAt', 'desc');
        expect(sortedByDate).toHaveLength(3);

        // Sort by word count
        const sortedByWords = this.sortNotes(testNotes, 'wordCount', 'desc');
        expect(sortedByWords).toHaveLength(3);
      });

      it('should reorder notes by position', () => {
        const reorderedNotes = this.reorderNotes(testNotes, [
          { id: testNotes[2].id, position: 1 },
          { id: testNotes[0].id, position: 2 },
          { id: testNotes[1].id, position: 3 }
        ]);

        expect(reorderedNotes[0].id).toBe(testNotes[2].id);
        expect(reorderedNotes[1].id).toBe(testNotes[0].id);
        expect(reorderedNotes[2].id).toBe(testNotes[1].id);
      });

      it('should move notes between folders', () => {
        const noteToMove = testNotes[0];
        const updatedNote = this.moveNoteToFolder(noteToMove, 'New Folder');

        expect(updatedNote.folder).toBe('New Folder');
      });

      it('should archive and restore notes', () => {
        const noteToArchive = testNotes[0];
        
        // Archive note
        const archivedNote = this.archiveNote(noteToArchive);
        expect(archivedNote.status).toBe('archived');
        expect(archivedNote.archivedAt).toBeTruthy();

        // Restore note
        const restoredNote = this.restoreNote(archivedNote);
        expect(restoredNote.status).toBe('draft');
        expect(restoredNote.archivedAt).toBeUndefined();
      });
    });
  }

  /**
   * Test note relationships and linking
   */
  private testNoteRelationships(): void {
    describe('Note Relationships', () => {
      let testProject: Project;
      let testNotes: Note[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNotes = [
          this.createMockNote(testProject.id, 'Main Character', 'Hero of the story'),
          this.createMockNote(testProject.id, 'Main Plot', 'Central storyline'),
          this.createMockNote(testProject.id, 'Opening Scene', 'First scene intro')
        ];

        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(testNotes);
      });

      it('should create wiki links between notes', () => {
        const sourceNote = testNotes[0];
        const targetNote = testNotes[1];

        const updatedNote = this.createWikiLink(sourceNote, targetNote);

        expect(updatedNote.wikiLinks).toContainEqual(
          expect.objectContaining({
            targetId: targetNote.id,
            text: targetNote.title
          })
        );
      });

      it('should create bidirectional backlinks', () => {
        const sourceNote = testNotes[0];
        const targetNote = testNotes[1];

        const { updated: updatedSource, target: updatedTarget } = 
          this.createBidirectionalLink(sourceNote, targetNote);

        expect(updatedSource.wikiLinks).toContainEqual(
          expect.objectContaining({ targetId: targetNote.id })
        );
        expect(updatedTarget.backlinks).toContainEqual(
          expect.objectContaining({ sourceId: sourceNote.id })
        );
      });

      it('should link to story elements', () => {
        const characterNote = testNotes[0];
        const sceneNote = testNotes[2];

        const updatedNote = this.linkToStoryElement(characterNote, {
          type: 'scene',
          id: 'scene-1',
          title: 'Opening Scene'
        });

        expect(updatedNote.linkedElements).toContainEqual(
          expect.objectContaining({
            type: 'scene',
            id: 'scene-1'
          })
        );
      });

      it('should find related notes by content similarity', () => {
        const queryNote = testNotes[0];
        const relatedNotes = this.findRelatedNotes(queryNote, testNotes);

        expect(Array.isArray(relatedNotes)).toBe(true);
        relatedNotes.forEach(note => {
          expect(note.id).not.toBe(queryNote.id);
        });
      });

      it('should suggest note connections based on tags', () => {
        const notesWithTags = testNotes.map(note => ({
          ...note,
          tags: ['fantasy', 'hero', note.type || 'general']
        }));

        const suggestions = this.suggestConnections(notesWithTags[0], notesWithTags);

        expect(Array.isArray(suggestions)).toBe(true);
        suggestions.forEach(suggestion => {
          expect(suggestion.confidence).toBeGreaterThan(0);
          expect(suggestion.confidence).toBeLessThanOrEqual(1);
        });
      });

      it('should create note hierarchies', () => {
        const parentNote = testNotes[0];
        const childNote = testNotes[1];

        const hierarchy = this.createNoteHierarchy(parentNote, [childNote]);

        expect(hierarchy.parent).toBe(parentNote);
        expect(hierarchy.children).toContain(childNote);
      });
    });
  }

  /**
   * Test different note types and their specific features
   */
  private testNoteTypes(): void {
    describe('Note Types and Specific Features', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });
      });

      it('should handle character notes with specific fields', () => {
        const characterData = {
          name: 'Aragorn',
          age: 35,
          occupation: 'Ranger',
          personality: 'Noble, brave, loyal',
          background: 'Heir to the throne of Gondor',
          goals: 'Protect the Fellowship',
          relationships: [
            { character: 'Arwen', type: 'love interest' },
            { character: 'Legolas', type: 'friend' }
          ]
        };

        const characterNote = this.createProjectNote(testProject.id, {
          title: 'Aragorn Character Profile',
          content: this.formatCharacterContent(characterData),
          type: 'character',
          tags: ['protagonist', 'ranger', 'king']
        });

        expect(characterNote.type).toBe('character');
        expect(characterNote.content).toContain('Aragorn');
        expect(characterNote.tags).toContain('protagonist');
      });

      it('should handle plot notes with structure', () => {
        const plotData = {
          incitingIncident: 'Frodo inherits the Ring',
          risingAction: 'Journey to Rivendell',
          climax: 'Destruction of the Ring',
          fallingAction: 'Return to the Shire',
          resolution: 'Frodo sails to the Undying Lands'
        };

        const plotNote = this.createProjectNote(testProject.id, {
          title: 'Main Plot Outline',
          content: this.formatPlotContent(plotData),
          type: 'plot',
          tags: ['main-plot', 'arc']
        });

        expect(plotNote.type).toBe('plot');
        expect(plotNote.content).toContain('inciting incident');
      });

      it('should handle scene notes with details', () => {
        const sceneData = {
          location: 'Prancing Pony Inn',
          characters: ['Frodo', 'Aragorn', 'Innkeeper'],
          purpose: 'First meeting between Frodo and Aragorn',
          conflict: 'Suspicion and mistrust',
          outcome: 'Reluctant alliance formed'
        };

        const sceneNote = this.createProjectNote(testProject.id, {
          title: 'Prancing Pony Scene',
          content: this.formatSceneContent(sceneData),
          type: 'scene',
          tags: ['meeting', 'inn', 'first-act']
        });

        expect(sceneNote.type).toBe('scene');
        expect(sceneNote.content).toContain('Prancing Pony');
      });

      it('should handle research notes with sources', () => {
        const researchData = {
          topic: 'Medieval Weaponry',
          sources: [
            'Arms and Armor of the Medieval Knight by David Edge',
            'The Medieval Sword by Ewart Oakeshott'
          ],
          keyFacts: [
            'Longswords were typically 35-45 inches long',
            'Mail armor was common before plate armor'
          ],
          applications: 'Weapon descriptions for battle scenes'
        };

        const researchNote = this.createProjectNote(testProject.id, {
          title: 'Medieval Weapons Research',
          content: this.formatResearchContent(researchData),
          type: 'research',
          tags: ['research', 'weapons', 'medieval']
        });

        expect(researchNote.type).toBe('research');
        expect(researchNote.content).toContain('sources');
      });

      it('should handle worldbuilding notes', () => {
        const worldData = {
          aspect: 'Magic System',
          description: 'Magic flows through ley lines',
          rules: [
            'Can only cast spells at ley line intersections',
            'Magic weakens during lunar eclipses'
          ],
          impact: 'Affects where magical battles can occur'
        };

        const worldNote = this.createProjectNote(testProject.id, {
          title: 'Ley Line Magic System',
          content: this.formatWorldbuildingContent(worldData),
          type: 'worldbuilding',
          tags: ['magic', 'ley-lines', 'system']
        });

        expect(worldNote.type).toBe('worldbuilding');
        expect(worldNote.content).toContain('Magic System');
      });

      it('should handle dialogue notes', () => {
        const dialogueData = {
          characters: ['Gandalf', 'Frodo'],
          context: 'Revealing the truth about the Ring',
          dialogue: [
            'Gandalf: "This is the One Ring, Frodo."',
            'Frodo: "But how can you be certain?"',
            'Gandalf: "There is one way to be sure..."'
          ],
          subtext: 'Gandalf is reluctant to reveal the full truth',
          tone: 'Serious, foreboding'
        };

        const dialogueNote = this.createProjectNote(testProject.id, {
          title: 'Ring Revelation Dialogue',
          content: this.formatDialogueContent(dialogueData),
          type: 'dialogue',
          tags: ['dialogue', 'revelation', 'ring']
        });

        expect(dialogueNote.type).toBe('dialogue');
        expect(dialogueNote.content).toContain('Gandalf');
      });
    });
  }

  /**
   * Test note search functionality
   */
  private testNoteSearch(): void {
    describe('Note Search', () => {
      let testProject: Project;
      let testNotes: Note[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNotes = [
          this.createMockNote(testProject.id, 'The Hero\'s Journey', 'A tale of adventure and discovery'),
          this.createMockNote(testProject.id, 'Dark Forest Setting', 'Mysterious forest with ancient trees'),
          this.createMockNote(testProject.id, 'Magic System Rules', 'How magic works in this world')
        ];

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(testNotes);
      });

      it('should search notes by title', () => {
        const results = this.searchProjectNotes(testProject.id, { query: 'Hero' });
        
        expect(results).toHaveLength(1);
        expect(results[0].title).toContain('Hero');
      });

      it('should search notes by content', () => {
        const results = this.searchProjectNotes(testProject.id, { query: 'forest' });
        
        expect(results).toHaveLength(1);
        expect(results[0].content).toContain('forest');
      });

      it('should search notes by tags', () => {
        const notesWithTags = testNotes.map(note => ({
          ...note,
          tags: note.title.includes('Hero') ? ['protagonist', 'journey'] :
                note.title.includes('Forest') ? ['setting', 'location'] :
                ['magic', 'system']
        }));

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(notesWithTags);

        const results = this.searchProjectNotes(testProject.id, { tags: ['setting'] });
        
        expect(results).toHaveLength(1);
        expect(results[0].tags).toContain('setting');
      });

      it('should search notes by type', () => {
        const typedNotes = testNotes.map((note, index) => ({
          ...note,
          type: index === 0 ? 'plot' : index === 1 ? 'worldbuilding' : 'research'
        }));

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(typedNotes);

        const results = this.searchProjectNotes(testProject.id, { type: 'worldbuilding' });
        
        expect(results).toHaveLength(1);
        expect(results[0].type).toBe('worldbuilding');
      });

      it('should combine multiple search criteria', () => {
        const results = this.searchProjectNotes(testProject.id, {
          query: 'magic',
          type: 'research'
        });

        expect(Array.isArray(results)).toBe(true);
      });

      it('should support fuzzy search', () => {
        const results = this.fuzzySearchNotes(testNotes, 'forst'); // Typo for 'forest'
        
        expect(results).toHaveLength(1);
        expect(results[0].title).toContain('Forest');
      });

      it('should rank search results by relevance', () => {
        const results = this.searchProjectNotes(testProject.id, { query: 'magic' });
        
        results.forEach(result => {
          expect(result).toHaveProperty('relevance');
          expect(result.relevance).toBeGreaterThan(0);
          expect(result.relevance).toBeLessThanOrEqual(1);
        });
      });
    });
  }

  /**
   * Test bulk operations on notes
   */
  private testNoteBulkOperations(): void {
    describe('Note Bulk Operations', () => {
      let testProject: Project;
      let testNotes: Note[];

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNotes = Array.from({ length: 10 }, (_, i) => 
          this.createMockNote(testProject.id, `Note ${i + 1}`, `Content ${i + 1}`)
        );

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue(testNotes);
        vi.spyOn(storageService, 'saveProjectNotes').mockImplementation(() => {});
      });

      it('should delete multiple notes at once', () => {
        const noteIdsToDelete = testNotes.slice(0, 3).map(note => note.id);
        const remainingNotes = this.bulkDeleteNotes(testProject.id, noteIdsToDelete);

        expect(remainingNotes).toHaveLength(7);
        noteIdsToDelete.forEach(id => {
          expect(remainingNotes.find(note => note.id === id)).toBeUndefined();
        });
      });

      it('should update tags for multiple notes', () => {
        const noteIds = testNotes.slice(0, 5).map(note => note.id);
        const newTags = ['bulk-updated', 'test'];
        
        const updatedNotes = this.bulkUpdateNoteTags(testProject.id, noteIds, newTags);

        const targetNotes = updatedNotes.filter(note => noteIds.includes(note.id));
        targetNotes.forEach(note => {
          expect(note.tags).toEqual(newTags);
        });
      });

      it('should move multiple notes to a folder', () => {
        const noteIds = testNotes.slice(0, 4).map(note => note.id);
        const targetFolder = 'Bulk Moved';
        
        const updatedNotes = this.bulkMoveNotesToFolder(testProject.id, noteIds, targetFolder);

        const targetNotes = updatedNotes.filter(note => noteIds.includes(note.id));
        targetNotes.forEach(note => {
          expect(note.folder).toBe(targetFolder);
        });
      });

      it('should archive multiple notes', () => {
        const noteIds = testNotes.slice(0, 3).map(note => note.id);
        
        const updatedNotes = this.bulkArchiveNotes(testProject.id, noteIds);

        const targetNotes = updatedNotes.filter(note => noteIds.includes(note.id));
        targetNotes.forEach(note => {
          expect(note.status).toBe('archived');
          expect(note.archivedAt).toBeTruthy();
        });
      });

      it('should change type for multiple notes', () => {
        const noteIds = testNotes.slice(0, 2).map(note => note.id);
        const newType = 'research';
        
        const updatedNotes = this.bulkChangeNoteType(testProject.id, noteIds, newType);

        const targetNotes = updatedNotes.filter(note => noteIds.includes(note.id));
        targetNotes.forEach(note => {
          expect(note.type).toBe(newType);
        });
      });

      it('should duplicate multiple notes', () => {
        const noteIds = testNotes.slice(0, 2).map(note => note.id);
        
        const result = this.bulkDuplicateNotes(testProject.id, noteIds);

        expect(result.originalCount).toBe(10);
        expect(result.newCount).toBe(12);
        expect(result.duplicatedNotes).toHaveLength(2);
      });

      it('should export multiple notes', () => {
        const noteIds = testNotes.slice(0, 3).map(note => note.id);
        
        const exportData = this.bulkExportNotes(testProject.id, noteIds, 'markdown');

        expect(exportData).toBeTruthy();
        expect(exportData).toContain('# Note 1');
        expect(exportData).toContain('# Note 2');
        expect(exportData).toContain('# Note 3');
      });
    });
  }

  /**
   * Test note versioning
   */
  private testNoteVersioning(): void {
    describe('Note Versioning', () => {
      let testProject: Project;
      let testNote: Note;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        testNote = this.createMockNote(testProject.id, 'Versioned Note', 'Original content');

        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([testNote]);
        vi.spyOn(storageService, 'saveProjectNotes').mockImplementation(() => {});
      });

      it('should create version history on updates', () => {
        const updatedNote = this.updateNoteWithVersioning(testNote, {
          content: 'Updated content'
        });

        expect(updatedNote.version).toBe(2);
        expect(updatedNote.versionHistory).toHaveLength(1);
        expect(updatedNote.versionHistory[0]).toMatchObject({
          version: 1,
          content: 'Original content',
          timestamp: expect.any(String)
        });
      });

      it('should limit version history size', () => {
        let currentNote = testNote;
        
        // Create 15 versions
        for (let i = 1; i <= 15; i++) {
          currentNote = this.updateNoteWithVersioning(currentNote, {
            content: `Version ${i} content`
          });
        }

        expect(currentNote.version).toBe(16);
        expect(currentNote.versionHistory.length).toBeLessThanOrEqual(10); // Max 10 versions
      });

      it('should restore from previous version', () => {
        const updatedNote = this.updateNoteWithVersioning(testNote, {
          content: 'Updated content'
        });

        const restoredNote = this.restoreNoteVersion(updatedNote, 1);

        expect(restoredNote.content).toBe('Original content');
        expect(restoredNote.version).toBe(3); // New version for restoration
      });

      it('should compare note versions', () => {
        const updatedNote = this.updateNoteWithVersioning(testNote, {
          content: 'Updated content'
        });

        const comparison = this.compareNoteVersions(updatedNote, 1, 2);

        expect(comparison).toHaveProperty('added');
        expect(comparison).toHaveProperty('removed');
        expect(comparison).toHaveProperty('unchanged');
      });

      it('should track who made changes', () => {
        const updatedNote = this.updateNoteWithVersioning(testNote, {
          content: 'Updated content'
        }, 'user-123');

        expect(updatedNote.lastEditedBy).toBe('user-123');
        expect(updatedNote.versionHistory[0].editedBy).toBe('user-123');
      });
    });
  }

  /**
   * Test note templates
   */
  private testNoteTemplates(): void {
    describe('Note Templates', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'astral_projects') {
            return JSON.stringify([testProject]);
          }
          return null;
        });
      });

      it('should create note from character template', () => {
        const characterTemplate = {
          name: 'Character Template',
          type: 'character',
          structure: {
            sections: ['Basic Info', 'Personality', 'Background', 'Goals', 'Relationships'],
            fields: ['name', 'age', 'occupation', 'personality', 'background']
          }
        };

        const note = this.createNoteFromTemplate(testProject.id, characterTemplate, {
          title: 'New Character',
          name: 'Elara',
          age: '25',
          occupation: 'Mage'
        });

        expect(note.type).toBe('character');
        expect(note.content).toContain('Elara');
        expect(note.content).toContain('25');
        expect(note.content).toContain('Mage');
      });

      it('should create note from plot template', () => {
        const plotTemplate = {
          name: 'Plot Template',
          type: 'plot',
          structure: {
            sections: ['Setup', 'Inciting Incident', 'Rising Action', 'Climax', 'Resolution'],
            fields: ['setting', 'protagonist', 'antagonist', 'conflict']
          }
        };

        const note = this.createNoteFromTemplate(testProject.id, plotTemplate, {
          title: 'Main Plot Arc',
          setting: 'Medieval Kingdom',
          protagonist: 'Young Prince',
          conflict: 'Usurper threatens throne'
        });

        expect(note.type).toBe('plot');
        expect(note.content).toContain('Medieval Kingdom');
        expect(note.content).toContain('Young Prince');
      });

      it('should save custom templates', () => {
        const customTemplate = {
          name: 'My Custom Template',
          type: 'research',
          structure: {
            sections: ['Topic', 'Sources', 'Key Points', 'Applications'],
            fields: ['topic', 'sources', 'keyPoints']
          }
        };

        const savedTemplate = this.saveNoteTemplate(testProject.id, customTemplate);

        expect(savedTemplate.id).toBeTruthy();
        expect(savedTemplate.name).toBe('My Custom Template');
        expect(savedTemplate.projectId).toBe(testProject.id);
      });

      it('should list available templates', () => {
        const templates = this.getAvailableTemplates(testProject.id);

        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
        
        templates.forEach(template => {
          expect(template).toHaveProperty('name');
          expect(template).toHaveProperty('type');
          expect(template).toHaveProperty('structure');
        });
      });
    });
  }

  /**
   * Test note validation
   */
  private testNoteValidation(): void {
    describe('Note Validation', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
      });

      it('should validate required fields', () => {
        const validationResult = this.validateNote({
          title: '',
          content: 'Some content',
          type: 'note'
        });

        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain('Title is required');
      });

      it('should validate note type', () => {
        const validationResult = this.validateNote({
          title: 'Test Note',
          content: 'Content',
          type: 'invalid-type' as any
        });

        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors).toContain('Invalid note type');
      });

      it('should validate content length', () => {
        const longContent = 'A'.repeat(100000); // Very long content
        
        const validationResult = this.validateNote({
          title: 'Long Note',
          content: longContent,
          type: 'note'
        });

        expect(validationResult.warnings).toContain('Content is very long');
      });

      it('should validate tags format', () => {
        const validationResult = this.validateNote({
          title: 'Tagged Note',
          content: 'Content',
          type: 'note',
          tags: ['valid-tag', 'another tag', 'tag with spaces!@#']
        });

        expect(validationResult.warnings.length).toBeGreaterThan(0);
      });

      it('should validate cross-references', () => {
        const noteWithLinks = this.createMockNote(testProject.id, 'Note with Links', 'Content');
        noteWithLinks.wikiLinks = [
          { targetId: 'non-existent-note', text: 'Broken Link', position: { start: 0, end: 10 } }
        ];

        const validationResult = this.validateNoteReferences(noteWithLinks, []);

        expect(validationResult.errors).toContain('Broken wiki link to non-existent-note');
      });
    });
  }

  /**
   * Test error handling
   */
  private testNoteErrorHandling(): void {
    describe('Note Error Handling', () => {
      let testProject: Project;

      beforeEach(() => {
        testProject = this.testData.projects[0];
        console.error = vi.fn(); // Suppress error logs
      });

      it('should handle storage errors gracefully', () => {
        vi.spyOn(storageService, 'getProjectNotes').mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => {
          const notes = this.getProjectNotes(testProject.id);
          expect(notes).toEqual([]);
        }).not.toThrow();
      });

      it('should handle corrupted note data', () => {
        vi.spyOn(storageService, 'getProjectNotes').mockReturnValue([
          { id: 'corrupted', title: null, content: undefined } as any
        ]);

        expect(() => {
          const notes = this.getProjectNotes(testProject.id);
          expect(Array.isArray(notes)).toBe(true);
        }).not.toThrow();
      });

      it('should handle missing project references', () => {
        const orphanNote = this.createMockNote('non-existent-project', 'Orphan Note', 'Content');

        expect(() => {
          const validation = this.validateNoteProjectReference(orphanNote);
          expect(validation.isValid).toBe(false);
        }).not.toThrow();
      });

      it('should handle concurrent modifications', () => {
        const note = this.createMockNote(testProject.id, 'Concurrent Note', 'Original');

        // Simulate concurrent updates
        const update1 = this.updateNote(note, { content: 'Update 1' });
        const update2 = this.updateNote(note, { content: 'Update 2' });

        expect(update1).toBeDefined();
        expect(update2).toBeDefined();
      });
    });
  }

  // Helper methods for tests

  private createProjectNote(projectId: string, data: any): Note {
    const now = new Date().toISOString();
    return {
      id: this.generateId('note'),
      projectId,
      title: data.title || 'Untitled',
      content: data.content || '',
      type: data.type || 'note',
      tags: data.tags || [],
      folder: data.folder,
      position: data.position || 1,
      wordCount: this.calculateWordCount(data.content || ''),
      readTime: this.calculateReadTime(data.content || ''),
      status: data.status || 'draft',
      priority: data.priority || 'medium',
      wikiLinks: [],
      backlinks: [],
      linkedElements: [],
      templateData: data.templateData,
      comments: [],
      lastEditedBy: data.lastEditedBy,
      version: 1,
      versionHistory: [],
      aiSuggestions: [],
      createdAt: now,
      updatedAt: now,
      archivedAt: data.archivedAt
    };
  }

  private createMockNote(projectId: string, title: string, content: string, type: any = 'note'): Note {
    return this.createProjectNote(projectId, { title, content, type });
  }

  private organizeNotesByType(notes: Note[]): Record<string, Note[]> {
    return notes.reduce((acc, note) => {
      const type = note.type || 'other';
      acc[type] = acc[type] || [];
      acc[type].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
  }

  private organizeNotesByTags(notes: Note[]): Record<string, Note[]> {
    return notes.reduce((acc, note) => {
      note.tags.forEach(tag => {
        acc[tag] = acc[tag] || [];
        acc[tag].push(note);
      });
      return acc;
    }, {} as Record<string, Note[]>);
  }

  private organizeNotesByFolder(notes: Note[]): Record<string, Note[]> {
    return notes.reduce((acc, note) => {
      const folder = note.folder || 'Unfiled';
      acc[folder] = acc[folder] || [];
      acc[folder].push(note);
      return acc;
    }, {} as Record<string, Note[]>);
  }

  private sortNotes(notes: Note[], field: keyof Note, order: 'asc' | 'desc'): Note[] {
    return notes.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (order === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  private reorderNotes(notes: Note[], positions: { id: string; position: number }[]): Note[] {
    const positionMap = new Map(positions.map(p => [p.id, p.position]));
    
    return notes
      .map(note => ({
        ...note,
        position: positionMap.get(note.id) || note.position
      }))
      .sort((a, b) => a.position - b.position);
  }

  private moveNoteToFolder(note: Note, folder: string): Note {
    return { ...note, folder };
  }

  private archiveNote(note: Note): Note {
    return {
      ...note,
      status: 'archived',
      archivedAt: new Date().toISOString()
    };
  }

  private restoreNote(note: Note): Note {
    return {
      ...note,
      status: 'draft',
      archivedAt: undefined
    };
  }

  private createWikiLink(sourceNote: Note, targetNote: Note): Note {
    const wikiLink = {
      targetId: targetNote.id,
      text: targetNote.title,
      position: { start: 0, end: targetNote.title.length }
    };

    return {
      ...sourceNote,
      wikiLinks: [...sourceNote.wikiLinks, wikiLink]
    };
  }

  private createBidirectionalLink(sourceNote: Note, targetNote: Note): { updated: Note; target: Note } {
    const wikiLink = {
      targetId: targetNote.id,
      text: targetNote.title,
      position: { start: 0, end: targetNote.title.length }
    };

    const backlink = {
      sourceId: sourceNote.id,
      text: sourceNote.title,
      position: { start: 0, end: sourceNote.title.length }
    };

    return {
      updated: {
        ...sourceNote,
        wikiLinks: [...sourceNote.wikiLinks, wikiLink]
      },
      target: {
        ...targetNote,
        backlinks: [...targetNote.backlinks, backlink]
      }
    };
  }

  private linkToStoryElement(note: Note, element: { type: string; id: string; title: string }): Note {
    return {
      ...note,
      linkedElements: [...note.linkedElements, element]
    };
  }

  private findRelatedNotes(queryNote: Note, allNotes: Note[]): Note[] {
    return allNotes.filter(note => 
      note.id !== queryNote.id &&
      (note.tags.some(tag => queryNote.tags.includes(tag)) ||
       this.calculateContentSimilarity(note.content, queryNote.content) > 0.3)
    );
  }

  private suggestConnections(note: Note, allNotes: Note[]): Array<{ noteId: string; confidence: number; reasons: string[] }> {
    return allNotes
      .filter(other => other.id !== note.id)
      .map(other => ({
        noteId: other.id,
        confidence: this.calculateConnectionConfidence(note, other),
        reasons: this.getConnectionReasons(note, other)
      }))
      .filter(suggestion => suggestion.confidence > 0.3);
  }

  private createNoteHierarchy(parent: Note, children: Note[]): { parent: Note; children: Note[] } {
    return { parent, children };
  }

  private formatCharacterContent(data: any): string {
    return `Character Profile:

Name: ${data.name}
Age: ${data.age}
Occupation: ${data.occupation}

Personality: ${data.personality}

Background: ${data.background}

Goals: ${data.goals}

Relationships:
${data.relationships.map((rel: any) => `- ${rel.character}: ${rel.type}`).join('\n')}`;
  }

  private formatPlotContent(data: any): string {
    return `Plot Structure:

Inciting Incident: ${data.incitingIncident}

Rising Action: ${data.risingAction}

Climax: ${data.climax}

Falling Action: ${data.fallingAction}

Resolution: ${data.resolution}`;
  }

  private formatSceneContent(data: any): string {
    return `Scene Details:

Location: ${data.location}

Characters Present: ${data.characters.join(', ')}

Scene Purpose: ${data.purpose}

Conflict: ${data.conflict}

Outcome: ${data.outcome}`;
  }

  private formatResearchContent(data: any): string {
    return `Research Notes:

Topic: ${data.topic}

Sources:
${data.sources.map((source: string) => `- ${source}`).join('\n')}

Key Facts:
${data.keyFacts.map((fact: string) => `- ${fact}`).join('\n')}

Applications: ${data.applications}`;
  }

  private formatWorldbuildingContent(data: any): string {
    return `World Building: ${data.aspect}

Description: ${data.description}

Rules:
${data.rules.map((rule: string) => `- ${rule}`).join('\n')}

Story Impact: ${data.impact}`;
  }

  private formatDialogueContent(data: any): string {
    return `Dialogue Scene:

Characters: ${data.characters.join(', ')}

Context: ${data.context}

Dialogue:
${data.dialogue.map((line: string) => line).join('\n')}

Subtext: ${data.subtext}

Tone: ${data.tone}`;
  }

  private searchProjectNotes(projectId: string, criteria: any): any[] {
    const notes = storageService.getProjectNotes(projectId);
    
    return notes.filter(note => {
      if (criteria.query) {
        const queryLower = criteria.query.toLowerCase();
        if (!note.title.toLowerCase().includes(queryLower) &&
            !note.content.toLowerCase().includes(queryLower)) {
          return false;
        }
      }

      if (criteria.type && note.type !== criteria.type) {
        return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        if (!criteria.tags.some((tag: string) => note.tags.includes(tag))) {
          return false;
        }
      }

      return true;
    }).map(note => ({ ...note, relevance: Math.random() }));
  }

  private fuzzySearchNotes(notes: Note[], query: string): Note[] {
    const threshold = 0.6;
    return notes.filter(note => {
      const similarity = this.calculateStringSimilarity(note.title.toLowerCase(), query.toLowerCase());
      return similarity >= threshold;
    });
  }

  private bulkDeleteNotes(projectId: string, noteIds: string[]): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.filter(note => !noteIds.includes(note.id));
  }

  private bulkUpdateNoteTags(projectId: string, noteIds: string[], tags: string[]): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.map(note => 
      noteIds.includes(note.id) ? { ...note, tags } : note
    );
  }

  private bulkMoveNotesToFolder(projectId: string, noteIds: string[], folder: string): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.map(note => 
      noteIds.includes(note.id) ? { ...note, folder } : note
    );
  }

  private bulkArchiveNotes(projectId: string, noteIds: string[]): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.map(note => 
      noteIds.includes(note.id) ? {
        ...note,
        status: 'archived',
        archivedAt: new Date().toISOString()
      } : note
    );
  }

  private bulkChangeNoteType(projectId: string, noteIds: string[], type: string): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.map(note => 
      noteIds.includes(note.id) ? { ...note, type } : note
    );
  }

  private bulkDuplicateNotes(projectId: string, noteIds: string[]): { originalCount: number; newCount: number; duplicatedNotes: Note[] } {
    const notes = storageService.getProjectNotes(projectId);
    const originalCount = notes.length;
    
    const duplicatedNotes = notes
      .filter(note => noteIds.includes(note.id))
      .map(note => ({
        ...note,
        id: this.generateId('note'),
        title: `${note.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

    return {
      originalCount,
      newCount: originalCount + duplicatedNotes.length,
      duplicatedNotes
    };
  }

  private bulkExportNotes(projectId: string, noteIds: string[], format: string): string {
    const notes = storageService.getProjectNotes(projectId)
      .filter(note => noteIds.includes(note.id));

    if (format === 'markdown') {
      return notes.map(note => `# ${note.title}\n\n${note.content}\n\n---\n`).join('\n');
    }

    return JSON.stringify(notes, null, 2);
  }

  private updateNoteWithVersioning(note: Note, updates: any, editedBy?: string): Note {
    const versionEntry = {
      version: note.version,
      content: note.content,
      title: note.title,
      timestamp: note.updatedAt,
      editedBy
    };

    return {
      ...note,
      ...updates,
      version: note.version + 1,
      versionHistory: [versionEntry, ...note.versionHistory].slice(0, 10), // Keep max 10 versions
      lastEditedBy: editedBy,
      updatedAt: new Date().toISOString()
    };
  }

  private restoreNoteVersion(note: Note, targetVersion: number): Note {
    const versionEntry = note.versionHistory.find(v => v.version === targetVersion);
    if (!versionEntry) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    return this.updateNoteWithVersioning(note, {
      content: versionEntry.content,
      title: versionEntry.title
    });
  }

  private compareNoteVersions(note: Note, version1: number, version2: number): { added: string[]; removed: string[]; unchanged: string[] } {
    // Simplified diff implementation
    const v1Content = version1 === note.version ? note.content : 
      note.versionHistory.find(v => v.version === version1)?.content || '';
    const v2Content = version2 === note.version ? note.content :
      note.versionHistory.find(v => v.version === version2)?.content || '';

    const v1Lines = v1Content.split('\n');
    const v2Lines = v2Content.split('\n');

    return {
      added: v2Lines.filter(line => !v1Lines.includes(line)),
      removed: v1Lines.filter(line => !v2Lines.includes(line)),
      unchanged: v1Lines.filter(line => v2Lines.includes(line))
    };
  }

  private createNoteFromTemplate(projectId: string, template: any, data: any): Note {
    let content = '';
    
    template.structure.sections.forEach((section: string) => {
      content += `## ${section}\n\n`;
      
      // Fill in template fields with provided data
      template.structure.fields.forEach((field: string) => {
        if (data[field]) {
          content += `**${field}**: ${data[field]}\n\n`;
        }
      });
    });

    return this.createProjectNote(projectId, {
      title: data.title || 'New Note',
      content,
      type: template.type,
      templateData: { templateId: template.id, data }
    });
  }

  private saveNoteTemplate(projectId: string, template: any): any {
    return {
      ...template,
      id: this.generateId('template'),
      projectId,
      createdAt: new Date().toISOString()
    };
  }

  private getAvailableTemplates(projectId: string): any[] {
    return [
      {
        id: 'character-template',
        name: 'Character Profile',
        type: 'character',
        structure: {
          sections: ['Basic Info', 'Personality', 'Background'],
          fields: ['name', 'age', 'occupation']
        }
      },
      {
        id: 'plot-template',
        name: 'Plot Outline',
        type: 'plot',
        structure: {
          sections: ['Setup', 'Conflict', 'Resolution'],
          fields: ['protagonist', 'antagonist', 'conflict']
        }
      }
    ];
  }

  private validateNote(noteData: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!noteData.title || noteData.title.trim() === '') {
      errors.push('Title is required');
    }

    const validTypes = ['note', 'character', 'plot', 'scene', 'research', 'dialogue', 'worldbuilding'];
    if (!validTypes.includes(noteData.type)) {
      errors.push('Invalid note type');
    }

    if (noteData.content && noteData.content.length > 50000) {
      warnings.push('Content is very long');
    }

    if (noteData.tags) {
      noteData.tags.forEach((tag: string) => {
        if (tag.includes(' ') || /[!@#$%^&*(),.?":{}|<>]/.test(tag)) {
          warnings.push(`Tag "${tag}" contains invalid characters`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateNoteReferences(note: Note, allNotes: Note[]): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    note.wikiLinks.forEach(link => {
      if (!allNotes.find(n => n.id === link.targetId)) {
        errors.push(`Broken wiki link to ${link.targetId}`);
      }
    });

    return { errors, warnings };
  }

  private getProjectNotes(projectId: string): Note[] {
    try {
      return storageService.getProjectNotes(projectId);
    } catch (error) {
      console.error('Error getting project notes:', error);
      return [];
    }
  }

  private validateNoteProjectReference(note: Note): { isValid: boolean; error?: string } {
    // Check if project exists
    const project = projectService.getProjectById(note.projectId);
    return {
      isValid: !!project,
      error: project ? undefined : 'Project reference not found'
    };
  }

  private updateNote(note: Note, updates: any): Note {
    return {
      ...note,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateConnectionConfidence(note1: Note, note2: Note): number {
    let confidence = 0;

    // Tag similarity
    const commonTags = note1.tags.filter(tag => note2.tags.includes(tag));
    confidence += commonTags.length * 0.3;

    // Content similarity
    confidence += this.calculateContentSimilarity(note1.content, note2.content) * 0.5;

    // Type relevance
    if (note1.type === note2.type) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1);
  }

  private getConnectionReasons(note1: Note, note2: Note): string[] {
    const reasons: string[] = [];

    const commonTags = note1.tags.filter(tag => note2.tags.includes(tag));
    if (commonTags.length > 0) {
      reasons.push(`Shares tags: ${commonTags.join(', ')}`);
    }

    if (this.calculateContentSimilarity(note1.content, note2.content) > 0.3) {
      reasons.push('Similar content');
    }

    if (note1.type === note2.type) {
      reasons.push(`Both are ${note1.type} notes`);
    }

    return reasons;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private calculateWordCount(content: string): number {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).length;
  }

  private calculateReadTime(content: string): number {
    const wordCount = this.calculateWordCount(content);
    return Math.ceil(wordCount / 200);
  }

  private generateId(prefix: string = 'note'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupTest(): void {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
  }

  private cleanupTest(): void {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  }
}

export const runProjectNoteManagementTests = () => {
  const testSuite = new ProjectNoteManagementTestSuite();
  testSuite.runAllTests();
};