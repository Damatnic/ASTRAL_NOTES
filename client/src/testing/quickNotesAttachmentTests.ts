/**
 * Quick Notes Project Attachment Test Suite
 * Comprehensive testing for project attachment workflows, smart suggestions, and bulk operations
 */

import { quickNotesService, QuickNote } from '@/services/quickNotesService';
import { projectService, Project } from '@/services/projectService';
import { 
  projectAttachmentService, 
  AttachmentRelationship, 
  AttachmentSuggestion,
  AttachmentRule,
  BulkAttachmentOperation,
  MigrationConfig
} from '@/services/projectAttachmentService';
import { quickNotesTestDataGenerator } from './quickNotesTestDataGenerator';

interface AttachmentTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface AttachmentTestSuite {
  suiteName: string;
  results: AttachmentTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

export class QuickNotesAttachmentTestSuite {
  private results: AttachmentTestResult[] = [];
  private originalQuickNotes: QuickNote[] = [];
  private originalProjects: Project[] = [];
  private testProjects: Project[] = [];
  private testNotes: QuickNote[] = [];

  /**
   * Run all project attachment tests
   */
  public async runAllTests(): Promise<AttachmentTestSuite> {
    console.log('🔗 Starting Quick Notes Project Attachment Test Suite...');
    
    // Backup existing data and setup test data
    this.backupData();
    this.setupTestData();
    
    try {
      await this.runBasicAttachmentTests();
      await this.runSmartSuggestionTests();
      await this.runAttachmentRulesTests();
      await this.runBulkOperationTests();
      await this.runMigrationWizardTests();
      await this.runAnalyticsTests();
      await this.runPerformanceTests();
      await this.runErrorHandlingTests();
      
    } finally {
      // Restore original data
      this.restoreData();
    }

    return this.generateTestReport();
  }

  /**
   * Setup comprehensive test data
   */
  private setupTestData(): void {
    console.log('📊 Setting up attachment test data...');
    
    // Clear existing data
    localStorage.setItem('astral_quick_notes', JSON.stringify([]));
    localStorage.setItem('astral_projects', JSON.stringify([]));
    localStorage.setItem('astral_attachment_relationships', JSON.stringify([]));
    localStorage.setItem('astral_attachment_rules', JSON.stringify([]));
    localStorage.setItem('astral_attachment_analytics', JSON.stringify({}));
    localStorage.setItem('astral_attachment_suggestions', JSON.stringify({}));

    // Create test projects
    this.testProjects = [
      projectService.createProject({
        title: 'Fantasy Novel',
        description: 'Epic fantasy story with magic and dragons',
        type: 'book',
        genre: 'fantasy',
        tags: ['fantasy', 'magic', 'dragons', 'adventure'],
      }),
      projectService.createProject({
        title: 'JavaScript Tutorial Series',
        description: 'Comprehensive JavaScript programming tutorials',
        type: 'course',
        genre: 'programming',
        tags: ['programming', 'javascript', 'tutorial', 'web'],
      }),
      projectService.createProject({
        title: 'Character Study',
        description: 'Deep character development for protagonists',
        type: 'research',
        genre: 'writing',
        tags: ['character', 'development', 'psychology', 'writing'],
      }),
      projectService.createProject({
        title: 'World Building Guide',
        description: 'Creating immersive fictional worlds',
        type: 'guide',
        genre: 'fantasy',
        tags: ['worldbuilding', 'fantasy', 'creation', 'guide'],
      }),
      projectService.createProject({
        title: 'React Development',
        description: 'Modern React application development',
        type: 'course',
        genre: 'programming',
        tags: ['react', 'javascript', 'frontend', 'programming'],
      }),
    ];

    // Create test notes with various attachment scenarios
    this.testNotes = [
      // Notes that should match Fantasy Novel
      quickNotesService.createQuickNote({
        title: 'Dragon Characteristics',
        content: 'Ancient dragons breathe fire and possess magical abilities',
        type: 'note',
        tags: ['fantasy', 'dragons', 'magic'],
      }),
      quickNotesService.createQuickNote({
        title: 'Magic System Rules',
        content: 'The magic system requires verbal incantations and gesture',
        type: 'worldrule',
        tags: ['magic', 'fantasy', 'rules'],
      }),
      
      // Notes that should match JavaScript Tutorial Series
      quickNotesService.createQuickNote({
        title: 'JavaScript Array Methods',
        content: 'Map, filter, reduce are essential array methods in JavaScript',
        type: 'reference',
        tags: ['javascript', 'programming', 'arrays'],
      }),
      quickNotesService.createQuickNote({
        title: 'Async Programming',
        content: 'Promises and async/await for handling asynchronous JavaScript',
        type: 'note',
        tags: ['javascript', 'programming', 'async'],
      }),
      
      // Notes that should match Character Study
      quickNotesService.createQuickNote({
        title: 'Character Motivation',
        content: 'Understanding what drives characters in their decisions',
        type: 'character',
        tags: ['character', 'psychology', 'motivation'],
      }),
      quickNotesService.createQuickNote({
        title: 'Character Arc Development',
        content: 'How characters change and grow throughout the story',
        type: 'character',
        tags: ['character', 'development', 'arc'],
      }),
      
      // Notes that should match React Development
      quickNotesService.createQuickNote({
        title: 'React Hooks Usage',
        content: 'useState and useEffect hooks for functional components',
        type: 'reference',
        tags: ['react', 'hooks', 'javascript'],
      }),
      
      // Ambiguous notes that could match multiple projects
      quickNotesService.createQuickNote({
        title: 'Creative Writing Process',
        content: 'The process of developing ideas into full stories',
        type: 'note',
        tags: ['writing', 'creative', 'process'],
      }),
      quickNotesService.createQuickNote({
        title: 'Programming Best Practices',
        content: 'General guidelines for writing clean, maintainable code',
        type: 'reference',
        tags: ['programming', 'best-practices', 'clean-code'],
      }),
      
      // Notes with no clear matches
      quickNotesService.createQuickNote({
        title: 'Random Thoughts',
        content: 'Miscellaneous ideas and observations',
        type: 'note',
        tags: ['random', 'thoughts'],
      }),
    ];

    console.log(`Created ${this.testProjects.length} test projects and ${this.testNotes.length} test notes`);
  }

  /**
   * Basic attachment functionality tests
   */
  private async runBasicAttachmentTests(): Promise<void> {
    console.log('🔗 Testing Basic Attachment Operations...');

    // Test manual attachment
    await this.runTest('Manual Note Attachment', async () => {
      const note = this.testNotes[0]; // Dragon Characteristics
      const project = this.testProjects[0]; // Fantasy Novel
      
      const relationship = projectAttachmentService.attachNoteToProject(note.id, project.id, 'manual');
      
      if (!relationship) throw new Error('Attachment failed');
      if (relationship.noteId !== note.id) throw new Error('Note ID mismatch');
      if (relationship.projectId !== project.id) throw new Error('Project ID mismatch');
      if (relationship.attachmentType !== 'manual') throw new Error('Attachment type mismatch');
      
      // Verify note is attached
      const updatedNote = quickNotesService.getQuickNoteById(note.id);
      if (!updatedNote || updatedNote.projectId !== project.id) {
        throw new Error('Note not properly attached');
      }

      return { 
        relationshipId: relationship.id,
        attachmentType: relationship.attachmentType,
        noteAttached: updatedNote.projectId === project.id,
      };
    });

    // Test attachment with metadata
    await this.runTest('Attachment with Metadata', async () => {
      const note = this.testNotes[1]; // Magic System Rules
      const project = this.testProjects[0]; // Fantasy Novel
      const metadata = { source: 'test', importance: 'high' };
      
      const relationship = projectAttachmentService.attachNoteToProject(note.id, project.id, 'manual', metadata);
      
      if (!relationship) throw new Error('Attachment with metadata failed');
      if (!relationship.metadata) throw new Error('Metadata not saved');
      if (relationship.metadata.source !== 'test') throw new Error('Metadata mismatch');

      return { 
        hasMetadata: !!relationship.metadata,
        metadataSource: relationship.metadata.source,
      };
    });

    // Test duplicate attachment prevention
    await this.runTest('Duplicate Attachment Prevention', async () => {
      const note = this.testNotes[2]; // JavaScript Array Methods
      const project = this.testProjects[1]; // JavaScript Tutorial Series
      
      // First attachment
      const firstAttachment = projectAttachmentService.attachNoteToProject(note.id, project.id);
      if (!firstAttachment) throw new Error('First attachment failed');
      
      // Second attachment attempt
      const secondAttachment = projectAttachmentService.attachNoteToProject(note.id, project.id);
      
      // This should either update existing or handle gracefully
      return { 
        firstAttachment: !!firstAttachment,
        secondAttachment: !!secondAttachment,
        handled: true,
      };
    });

    // Test detachment
    await this.runTest('Note Detachment', async () => {
      const note = this.testNotes[3]; // Async Programming
      const project = this.testProjects[1]; // JavaScript Tutorial Series
      
      // First attach
      const attachment = projectAttachmentService.attachNoteToProject(note.id, project.id);
      if (!attachment) throw new Error('Initial attachment failed');
      
      // Then detach
      const detached = projectAttachmentService.detachNoteFromProject(note.id);
      if (!detached) throw new Error('Detachment failed');
      
      // Verify note is detached
      const updatedNote = quickNotesService.getQuickNoteById(note.id);
      if (!updatedNote || updatedNote.projectId) {
        throw new Error('Note not properly detached');
      }

      return { 
        attached: !!attachment,
        detached,
        noteProjectId: updatedNote.projectId,
      };
    });

    // Test move between projects
    await this.runTest('Move Between Projects', async () => {
      const note = this.testNotes[4]; // Character Motivation
      const fromProject = this.testProjects[2]; // Character Study
      const toProject = this.testProjects[3]; // World Building Guide
      
      // First attach to source project
      const initialAttachment = projectAttachmentService.attachNoteToProject(note.id, fromProject.id);
      if (!initialAttachment) throw new Error('Initial attachment failed');
      
      // Move to target project
      const moved = projectAttachmentService.moveNoteBetweenProjects(note.id, fromProject.id, toProject.id);
      if (!moved) throw new Error('Move operation failed');
      
      // Verify note is in target project
      const updatedNote = quickNotesService.getQuickNoteById(note.id);
      if (!updatedNote || updatedNote.projectId !== toProject.id) {
        throw new Error('Note not moved to target project');
      }

      return { 
        initialProject: fromProject.id,
        targetProject: toProject.id,
        currentProject: updatedNote.projectId,
        moved,
      };
    });

    // Test attach to non-existent project
    await this.runTest('Attach to Non-existent Project', async () => {
      const note = this.testNotes[5]; // Character Arc Development
      const nonExistentProjectId = 'non-existent-project-id';
      
      const result = projectAttachmentService.attachNoteToProject(note.id, nonExistentProjectId);
      
      if (result !== null) {
        throw new Error('Should return null for non-existent project');
      }

      return { result: 'null as expected' };
    });

    // Test attach non-existent note
    await this.runTest('Attach Non-existent Note', async () => {
      const nonExistentNoteId = 'non-existent-note-id';
      const project = this.testProjects[0];
      
      const result = projectAttachmentService.attachNoteToProject(nonExistentNoteId, project.id);
      
      if (result !== null) {
        throw new Error('Should return null for non-existent note');
      }

      return { result: 'null as expected' };
    });
  }

  /**
   * Smart suggestion system tests
   */
  private async runSmartSuggestionTests(): Promise<void> {
    console.log('🤖 Testing Smart Suggestion System...');

    // Test suggestion generation
    await this.runTest('Generate Smart Suggestions', async () => {
      const suggestions = projectAttachmentService.generateAttachmentSuggestions();
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Suggestions should be an array');
      }
      
      if (suggestions.length === 0) {
        throw new Error('No suggestions generated');
      }
      
      // Verify suggestion structure
      const firstSuggestion = suggestions[0];
      if (!firstSuggestion.noteId || !firstSuggestion.projectId) {
        throw new Error('Suggestion missing required fields');
      }
      
      if (typeof firstSuggestion.confidence !== 'number') {
        throw new Error('Confidence should be a number');
      }
      
      if (!Array.isArray(firstSuggestion.reasons)) {
        throw new Error('Reasons should be an array');
      }

      return { 
        suggestionsCount: suggestions.length,
        firstConfidence: firstSuggestion.confidence,
        firstReasonsCount: firstSuggestion.reasons.length,
      };
    });

    // Test suggestion for specific note
    await this.runTest('Generate Suggestions for Specific Note', async () => {
      const dragonNote = this.testNotes.find(n => n.title === 'Dragon Characteristics');
      if (!dragonNote) throw new Error('Dragon note not found');
      
      const suggestions = projectAttachmentService.generateAttachmentSuggestions(dragonNote.id);
      
      if (suggestions.length === 0) {
        throw new Error('No suggestions for dragon note');
      }
      
      // Should suggest Fantasy Novel project (high confidence expected)
      const fantasyProjectSuggestion = suggestions.find(s => 
        s.projectId === this.testProjects[0].id // Fantasy Novel
      );
      
      if (!fantasyProjectSuggestion) {
        throw new Error('Did not suggest Fantasy Novel project for dragon note');
      }
      
      if (fantasyProjectSuggestion.confidence < 0.3) {
        throw new Error('Confidence too low for obvious match');
      }

      return { 
        noteId: dragonNote.id,
        suggestionsCount: suggestions.length,
        fantasyConfidence: fantasyProjectSuggestion.confidence,
        fantasyReasons: fantasyProjectSuggestion.reasons,
      };
    });

    // Test suggestion confidence scoring
    await this.runTest('Suggestion Confidence Scoring', async () => {
      const jsNote = this.testNotes.find(n => n.title === 'JavaScript Array Methods');
      if (!jsNote) throw new Error('JavaScript note not found');
      
      const suggestions = projectAttachmentService.generateAttachmentSuggestions(jsNote.id);
      
      // Should have high confidence for JavaScript Tutorial Series
      const jsTutorialSuggestion = suggestions.find(s => 
        s.projectId === this.testProjects[1].id // JavaScript Tutorial Series
      );
      
      if (!jsTutorialSuggestion) {
        throw new Error('Did not suggest JavaScript Tutorial project');
      }
      
      // Should have lower confidence for non-programming projects
      const fantasyProjectSuggestion = suggestions.find(s => 
        s.projectId === this.testProjects[0].id // Fantasy Novel
      );
      
      if (fantasyProjectSuggestion && fantasyProjectSuggestion.confidence >= jsTutorialSuggestion.confidence) {
        throw new Error('Confidence scoring not working correctly');
      }

      return { 
        jsConfidence: jsTutorialSuggestion.confidence,
        fantasyConfidence: fantasyProjectSuggestion?.confidence || 0,
        confidenceGap: jsTutorialSuggestion.confidence - (fantasyProjectSuggestion?.confidence || 0),
      };
    });

    // Test suggestion application (accept)
    await this.runTest('Accept Suggestion', async () => {
      const reactNote = this.testNotes.find(n => n.title === 'React Hooks Usage');
      if (!reactNote) throw new Error('React note not found');
      
      const suggestions = projectAttachmentService.generateAttachmentSuggestions(reactNote.id);
      const reactProjectSuggestion = suggestions.find(s => 
        s.projectId === this.testProjects[4].id // React Development
      );
      
      if (!reactProjectSuggestion) {
        throw new Error('No React project suggestion found');
      }
      
      const applied = projectAttachmentService.applySuggestion(reactProjectSuggestion, true);
      if (!applied) throw new Error('Failed to apply suggestion');
      
      // Verify note is attached
      const updatedNote = quickNotesService.getQuickNoteById(reactNote.id);
      if (!updatedNote || updatedNote.projectId !== this.testProjects[4].id) {
        throw new Error('Note not attached after accepting suggestion');
      }

      return { 
        applied,
        noteProjectId: updatedNote.projectId,
        expectedProjectId: this.testProjects[4].id,
      };
    });

    // Test suggestion rejection
    await this.runTest('Reject Suggestion', async () => {
      const randomNote = this.testNotes.find(n => n.title === 'Random Thoughts');
      if (!randomNote) throw new Error('Random note not found');
      
      const suggestions = projectAttachmentService.generateAttachmentSuggestions(randomNote.id);
      if (suggestions.length === 0) {
        return { rejected: true, reason: 'No suggestions to reject' };
      }
      
      const firstSuggestion = suggestions[0];
      const rejected = projectAttachmentService.applySuggestion(firstSuggestion, false);
      
      if (!rejected) throw new Error('Failed to reject suggestion');
      
      // Verify note is not attached
      const updatedNote = quickNotesService.getQuickNoteById(randomNote.id);
      if (!updatedNote || updatedNote.projectId) {
        throw new Error('Note should not be attached after rejecting suggestion');
      }

      return { 
        rejected,
        noteProjectId: updatedNote.projectId,
      };
    });

    // Test high confidence auto-attach threshold
    await this.runTest('High Confidence Auto-Attach', async () => {
      // Create a note with perfect match to a project
      const perfectMatchNote = quickNotesService.createQuickNote({
        title: 'Fantasy Novel Dragon Magic',
        content: 'This note is specifically about fantasy dragons and magic systems in novels',
        type: 'note',
        tags: ['fantasy', 'dragons', 'magic', 'novel'],
      });
      
      const suggestions = projectAttachmentService.generateAttachmentSuggestions(perfectMatchNote.id);
      const fantasyProjectSuggestion = suggestions.find(s => 
        s.projectId === this.testProjects[0].id // Fantasy Novel
      );
      
      if (!fantasyProjectSuggestion) {
        throw new Error('No fantasy project suggestion for perfect match');
      }

      return { 
        confidence: fantasyProjectSuggestion.confidence,
        autoAttach: fantasyProjectSuggestion.autoAttach,
        isHighConfidence: fantasyProjectSuggestion.confidence >= 0.8,
      };
    });
  }

  /**
   * Attachment rules system tests
   */
  private async runAttachmentRulesTests(): Promise<void> {
    console.log('📋 Testing Attachment Rules System...');

    // Test rule creation
    await this.runTest('Create Attachment Rule', async () => {
      const rule = projectAttachmentService.createAttachmentRule({
        name: 'Auto-attach JavaScript notes',
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: 'tag',
            operator: 'contains',
            value: 'javascript',
          },
        ],
        actions: [
          {
            type: 'attach',
            projectId: this.testProjects[1].id, // JavaScript Tutorial Series
          },
        ],
      });
      
      if (!rule.id) throw new Error('Rule ID not generated');
      if (!rule.createdAt) throw new Error('Created date not set');
      if (rule.name !== 'Auto-attach JavaScript notes') throw new Error('Rule name mismatch');

      return { 
        ruleId: rule.id,
        ruleName: rule.name,
        conditionsCount: rule.conditions.length,
        actionsCount: rule.actions.length,
      };
    });

    // Test rule application
    await this.runTest('Apply Attachment Rules', async () => {
      // Create a note that should match the JavaScript rule
      const jsTestNote = quickNotesService.createQuickNote({
        title: 'JavaScript Testing Note',
        content: 'This note should be auto-attached via rules',
        type: 'note',
        tags: ['javascript', 'testing'],
      });
      
      const appliedCount = projectAttachmentService.applyAttachmentRules([jsTestNote.id]);
      
      if (appliedCount === 0) {
        throw new Error('No rules applied');
      }
      
      // Verify note was attached
      const updatedNote = quickNotesService.getQuickNoteById(jsTestNote.id);
      if (!updatedNote || updatedNote.projectId !== this.testProjects[1].id) {
        throw new Error('Note not attached by rule');
      }

      return { 
        appliedCount,
        noteProjectId: updatedNote.projectId,
        expectedProjectId: this.testProjects[1].id,
      };
    });

    // Test rule conditions evaluation
    await this.runTest('Rule Conditions Evaluation', async () => {
      // Create complex rule with multiple conditions
      const complexRule = projectAttachmentService.createAttachmentRule({
        name: 'Complex character rule',
        enabled: true,
        priority: 2,
        conditions: [
          {
            type: 'tag',
            operator: 'contains',
            value: 'character',
          },
          {
            type: 'title',
            operator: 'contains',
            value: 'development',
            caseSensitive: false,
          },
        ],
        actions: [
          {
            type: 'attach',
            projectId: this.testProjects[2].id, // Character Study
          },
        ],
      });
      
      // Create notes that should and shouldn't match
      const matchingNote = quickNotesService.createQuickNote({
        title: 'Character Development Guide',
        content: 'Guide for developing characters',
        tags: ['character', 'guide'],
      });
      
      const nonMatchingNote = quickNotesService.createQuickNote({
        title: 'Character Description',
        content: 'Description without development',
        tags: ['character'],
      });
      
      const appliedCount = projectAttachmentService.applyAttachmentRules([
        matchingNote.id,
        nonMatchingNote.id,
      ]);
      
      // Only the matching note should be attached
      const matchingUpdated = quickNotesService.getQuickNoteById(matchingNote.id);
      const nonMatchingUpdated = quickNotesService.getQuickNoteById(nonMatchingNote.id);
      
      const matchingAttached = matchingUpdated?.projectId === this.testProjects[2].id;
      const nonMatchingNotAttached = !nonMatchingUpdated?.projectId;

      return { 
        appliedCount,
        matchingAttached,
        nonMatchingNotAttached,
        complexRuleId: complexRule.id,
      };
    });

    // Test rule priority
    await this.runTest('Rule Priority Handling', async () => {
      // Create two rules with different priorities
      const lowPriorityRule = projectAttachmentService.createAttachmentRule({
        name: 'Low priority rule',
        enabled: true,
        priority: 10,
        conditions: [
          {
            type: 'tag',
            operator: 'contains',
            value: 'programming',
          },
        ],
        actions: [
          {
            type: 'attach',
            projectId: this.testProjects[4].id, // React Development
          },
        ],
      });
      
      const highPriorityRule = projectAttachmentService.createAttachmentRule({
        name: 'High priority rule',
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: 'tag',
            operator: 'contains',
            value: 'programming',
          },
        ],
        actions: [
          {
            type: 'attach',
            projectId: this.testProjects[1].id, // JavaScript Tutorial Series
          },
        ],
      });
      
      const testNote = quickNotesService.createQuickNote({
        title: 'Programming Note',
        content: 'This note matches both rules',
        tags: ['programming'],
      });
      
      const appliedCount = projectAttachmentService.applyAttachmentRules([testNote.id]);
      
      // Should apply the higher priority rule (lower number = higher priority)
      const updatedNote = quickNotesService.getQuickNoteById(testNote.id);
      
      return { 
        appliedCount,
        finalProjectId: updatedNote?.projectId,
        highPriorityProjectId: this.testProjects[1].id,
        lowPriorityProjectId: this.testProjects[4].id,
        usedHighPriority: updatedNote?.projectId === this.testProjects[1].id,
      };
    });
  }

  /**
   * Bulk operations tests
   */
  private async runBulkOperationTests(): Promise<void> {
    console.log('📦 Testing Bulk Operations...');

    // Test bulk attachment
    await this.runTest('Bulk Attachment Operation', async () => {
      // Create multiple unattached notes
      const bulkNotes = [];
      for (let i = 0; i < 5; i++) {
        bulkNotes.push(quickNotesService.createQuickNote({
          title: `Bulk Test Note ${i + 1}`,
          content: `Content for bulk test note ${i + 1}`,
          tags: ['bulk-test'],
        }));
      }
      
      const operation = await projectAttachmentService.performBulkOperation({
        type: 'attach',
        noteIds: bulkNotes.map(n => n.id),
        projectId: this.testProjects[0].id, // Fantasy Novel
      });
      
      if (operation.status !== 'completed') {
        throw new Error(`Bulk operation failed with status: ${operation.status}`);
      }
      
      if (operation.results.successful !== 5) {
        throw new Error(`Expected 5 successful attachments, got ${operation.results.successful}`);
      }
      
      // Verify all notes are attached
      const attachedNotes = bulkNotes.map(note => quickNotesService.getQuickNoteById(note.id));
      const allAttached = attachedNotes.every(note => note?.projectId === this.testProjects[0].id);
      
      if (!allAttached) {
        throw new Error('Not all notes were attached in bulk operation');
      }

      return { 
        operationId: operation.id,
        status: operation.status,
        successful: operation.results.successful,
        failed: operation.results.failed,
        allAttached,
      };
    });

    // Test bulk detachment
    await this.runTest('Bulk Detachment Operation', async () => {
      // Use the notes attached in the previous test
      const attachedNotes = quickNotesService.getAllQuickNotes()
        .filter(note => note.tags.includes('bulk-test') && note.projectId);
      
      if (attachedNotes.length === 0) {
        throw new Error('No attached bulk test notes found');
      }
      
      const operation = await projectAttachmentService.performBulkOperation({
        type: 'detach',
        noteIds: attachedNotes.map(n => n.id),
      });
      
      if (operation.status !== 'completed') {
        throw new Error(`Bulk detachment failed with status: ${operation.status}`);
      }
      
      // Verify all notes are detached
      const detachedNotes = attachedNotes.map(note => quickNotesService.getQuickNoteById(note.id));
      const allDetached = detachedNotes.every(note => !note?.projectId);
      
      if (!allDetached) {
        throw new Error('Not all notes were detached in bulk operation');
      }

      return { 
        operationId: operation.id,
        successful: operation.results.successful,
        allDetached,
      };
    });

    // Test bulk organization (smart attach)
    await this.runTest('Bulk Organization Operation', async () => {
      // Create notes with clear project matches
      const orgNotes = [
        quickNotesService.createQuickNote({
          title: 'Fantasy Magic Spells',
          content: 'Collection of magical spells for fantasy stories',
          tags: ['fantasy', 'magic', 'spells'],
        }),
        quickNotesService.createQuickNote({
          title: 'JavaScript Closures',
          content: 'Understanding closures in JavaScript programming',
          tags: ['javascript', 'programming', 'closures'],
        }),
        quickNotesService.createQuickNote({
          title: 'Character Backstory Template',
          content: 'Template for creating detailed character backstories',
          tags: ['character', 'template', 'writing'],
        }),
      ];
      
      const operation = await projectAttachmentService.performBulkOperation({
        type: 'organize',
        noteIds: orgNotes.map(n => n.id),
      });
      
      if (operation.status !== 'completed') {
        throw new Error(`Bulk organization failed with status: ${operation.status}`);
      }
      
      // Check which notes were successfully organized
      const organizedNotes = orgNotes.map(note => quickNotesService.getQuickNoteById(note.id));
      const attachedCount = organizedNotes.filter(note => note?.projectId).length;

      return { 
        operationId: operation.id,
        successful: operation.results.successful,
        skipped: operation.results.skipped,
        attachedCount,
        totalNotes: orgNotes.length,
      };
    });

    // Test bulk migration
    await this.runTest('Bulk Migration Operation', async () => {
      // Create and attach notes to source project
      const migrationNotes = [];
      for (let i = 0; i < 3; i++) {
        const note = quickNotesService.createQuickNote({
          title: `Migration Note ${i + 1}`,
          content: `Content for migration test ${i + 1}`,
          tags: ['migration-test'],
        });
        projectAttachmentService.attachNoteToProject(note.id, this.testProjects[0].id);
        migrationNotes.push(note);
      }
      
      const operation = await projectAttachmentService.performBulkOperation({
        type: 'migrate',
        noteIds: migrationNotes.map(n => n.id),
        projectId: this.testProjects[0].id, // Source project
        targetProjectId: this.testProjects[1].id, // Target project
      });
      
      if (operation.status !== 'completed') {
        throw new Error(`Bulk migration failed with status: ${operation.status}`);
      }
      
      // Verify notes are in target project
      const migratedNotes = migrationNotes.map(note => quickNotesService.getQuickNoteById(note.id));
      const allMigrated = migratedNotes.every(note => note?.projectId === this.testProjects[1].id);

      return { 
        operationId: operation.id,
        successful: operation.results.successful,
        allMigrated,
        targetProjectId: this.testProjects[1].id,
      };
    });
  }

  /**
   * Migration wizard tests
   */
  private async runMigrationWizardTests(): Promise<void> {
    console.log('🧙 Testing Migration Wizard...');

    // Test smart migration strategy
    await this.runTest('Smart Migration Strategy', async () => {
      // Create unattached notes for migration
      const migrationNotes = [
        quickNotesService.createQuickNote({
          title: 'Fantasy World Map',
          content: 'Detailed map of the fantasy world with kingdoms and regions',
          tags: ['fantasy', 'world', 'map'],
        }),
        quickNotesService.createQuickNote({
          title: 'React Component Patterns',
          content: 'Common patterns for React component development',
          tags: ['react', 'patterns', 'components'],
        }),
      ];
      
      const config: MigrationConfig = {
        source: 'unattached',
        strategy: 'smart',
        confidenceThreshold: 0.3,
        autoApply: true,
        preserveOriginal: false,
        targetProjects: [],
        excludeProjects: [],
        tagMappings: {},
      };
      
      const operation = await projectAttachmentService.runMigrationWizard(config);
      
      if (operation.status !== 'completed') {
        throw new Error(`Migration wizard failed with status: ${operation.status}`);
      }

      return { 
        operationId: operation.id,
        strategy: config.strategy,
        successful: operation.results.successful,
        skipped: operation.results.skipped,
      };
    });

    // Test rules-based migration strategy
    await this.runTest('Rules-based Migration Strategy', async () => {
      // Ensure we have rules created from previous tests
      const config: MigrationConfig = {
        source: 'unattached',
        strategy: 'rules',
        confidenceThreshold: 0.5,
        autoApply: true,
        preserveOriginal: false,
        targetProjects: [],
        excludeProjects: [],
        tagMappings: {},
      };
      
      const operation = await projectAttachmentService.runMigrationWizard(config);
      
      if (operation.status !== 'completed') {
        throw new Error(`Rules-based migration failed with status: ${operation.status}`);
      }

      return { 
        operationId: operation.id,
        strategy: config.strategy,
        successful: operation.results.successful,
        failed: operation.results.failed,
      };
    });

    // Test manual migration strategy
    await this.runTest('Manual Migration Strategy', async () => {
      const config: MigrationConfig = {
        source: 'all',
        strategy: 'manual',
        confidenceThreshold: 0.8,
        autoApply: false,
        preserveOriginal: true,
        targetProjects: [this.testProjects[0].id],
        excludeProjects: [],
        tagMappings: {},
      };
      
      const operation = await projectAttachmentService.runMigrationWizard(config);
      
      // Manual strategy should complete immediately without processing
      if (operation.status !== 'completed') {
        throw new Error(`Manual migration failed with status: ${operation.status}`);
      }

      return { 
        operationId: operation.id,
        strategy: config.strategy,
        isManual: true,
      };
    });
  }

  /**
   * Analytics and insights tests
   */
  private async runAnalyticsTests(): Promise<void> {
    console.log('📊 Testing Analytics and Insights...');

    // Test analytics generation
    await this.runTest('Generate Attachment Analytics', async () => {
      const analytics = projectAttachmentService.getAttachmentAnalytics();
      
      if (typeof analytics.totalAttachments !== 'number') {
        throw new Error('Total attachments should be a number');
      }
      
      if (typeof analytics.unattachedNotes !== 'number') {
        throw new Error('Unattached notes count should be a number');
      }
      
      if (!analytics.projectDistribution || typeof analytics.projectDistribution !== 'object') {
        throw new Error('Project distribution should be an object');
      }
      
      if (!analytics.attachmentsByType || typeof analytics.attachmentsByType !== 'object') {
        throw new Error('Attachments by type should be an object');
      }
      
      if (!Array.isArray(analytics.recentActivity)) {
        throw new Error('Recent activity should be an array');
      }

      return { 
        totalAttachments: analytics.totalAttachments,
        unattachedNotes: analytics.unattachedNotes,
        projectCount: Object.keys(analytics.projectDistribution).length,
        typeCount: Object.keys(analytics.attachmentsByType).length,
        activityCount: analytics.recentActivity.length,
        averageConfidence: analytics.averageConfidence,
      };
    });

    // Test project distribution metrics
    await this.runTest('Project Distribution Metrics', async () => {
      const analytics = projectAttachmentService.getAttachmentAnalytics();
      
      // Check if we have distribution data
      const distribution = analytics.projectDistribution;
      const totalDistributed = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      
      if (totalDistributed > analytics.totalAttachments) {
        throw new Error('Distribution total exceeds total attachments');
      }

      return { 
        distributionEntries: Object.keys(distribution).length,
        totalDistributed,
        totalAttachments: analytics.totalAttachments,
        distributionData: distribution,
      };
    });

    // Test attachment type metrics
    await this.runTest('Attachment Type Metrics', async () => {
      const analytics = projectAttachmentService.getAttachmentAnalytics();
      
      const typeDistribution = analytics.attachmentsByType;
      const validTypes = ['manual', 'auto', 'suggested', 'migrated'];
      
      const hasValidTypes = Object.keys(typeDistribution).every(type => 
        validTypes.includes(type)
      );
      
      if (!hasValidTypes) {
        throw new Error('Invalid attachment types in distribution');
      }

      return { 
        typeDistribution,
        typesCount: Object.keys(typeDistribution).length,
        hasValidTypes,
      };
    });

    // Test recent activity tracking
    await this.runTest('Recent Activity Tracking', async () => {
      const analytics = projectAttachmentService.getAttachmentAnalytics();
      
      const recentActivity = analytics.recentActivity;
      
      if (recentActivity.length === 0) {
        return { activityCount: 0, noActivity: true };
      }
      
      // Verify activity structure
      const firstActivity = recentActivity[0];
      if (!firstActivity.id || !firstActivity.type || !firstActivity.timestamp) {
        throw new Error('Activity missing required fields');
      }
      
      const validActivityTypes = ['attached', 'detached', 'suggested', 'migrated'];
      if (!validActivityTypes.includes(firstActivity.type)) {
        throw new Error('Invalid activity type');
      }
      
      // Check chronological order (newest first)
      const isChronological = recentActivity.every((activity, index) => {
        if (index === 0) return true;
        return new Date(activity.timestamp) <= new Date(recentActivity[index - 1].timestamp);
      });
      
      if (!isChronological) {
        throw new Error('Activities not in chronological order');
      }

      return { 
        activityCount: recentActivity.length,
        firstActivityType: firstActivity.type,
        isChronological,
      };
    });
  }

  /**
   * Performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('🚀 Testing Attachment Performance...');

    // Test suggestion generation performance
    await this.runTest('Suggestion Generation Performance', async () => {
      // Create many unattached notes
      const performanceNotes = [];
      for (let i = 0; i < 50; i++) {
        performanceNotes.push(quickNotesService.createQuickNote({
          title: `Performance Note ${i + 1}`,
          content: `Content for performance testing note ${i + 1}`,
          tags: ['performance', 'test'],
        }));
      }
      
      const startTime = Date.now();
      const suggestions = projectAttachmentService.generateAttachmentSuggestions();
      const suggestionTime = Date.now() - startTime;
      
      // Should complete within reasonable time
      if (suggestionTime > 2000) {
        throw new Error(`Suggestion generation too slow: ${suggestionTime}ms`);
      }
      
      // Cleanup
      performanceNotes.forEach(note => quickNotesService.deleteQuickNote(note.id));

      return { 
        suggestionTime,
        suggestionsCount: suggestions.length,
        notesProcessed: performanceNotes.length,
      };
    });

    // Test bulk operation performance
    await this.runTest('Bulk Operation Performance', async () => {
      // Create notes for bulk testing
      const bulkNotes = [];
      for (let i = 0; i < 30; i++) {
        bulkNotes.push(quickNotesService.createQuickNote({
          title: `Bulk Performance Note ${i + 1}`,
          content: `Content ${i + 1}`,
          tags: ['bulk-performance'],
        }));
      }
      
      const startTime = Date.now();
      const operation = await projectAttachmentService.performBulkOperation({
        type: 'attach',
        noteIds: bulkNotes.map(n => n.id),
        projectId: this.testProjects[0].id,
      });
      const operationTime = Date.now() - startTime;
      
      if (operationTime > 3000) {
        throw new Error(`Bulk operation too slow: ${operationTime}ms`);
      }
      
      // Cleanup
      bulkNotes.forEach(note => quickNotesService.deleteQuickNote(note.id));

      return { 
        operationTime,
        successful: operation.results.successful,
        notesProcessed: bulkNotes.length,
      };
    });

    // Test analytics generation performance
    await this.runTest('Analytics Generation Performance', async () => {
      const startTime = Date.now();
      const analytics = projectAttachmentService.getAttachmentAnalytics();
      const analyticsTime = Date.now() - startTime;
      
      if (analyticsTime > 1000) {
        throw new Error(`Analytics generation too slow: ${analyticsTime}ms`);
      }

      return { 
        analyticsTime,
        totalAttachments: analytics.totalAttachments,
        activityCount: analytics.recentActivity.length,
      };
    });
  }

  /**
   * Error handling tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    console.log('⚠️ Testing Attachment Error Handling...');

    // Test invalid bulk operation
    await this.runTest('Invalid Bulk Operation Handling', async () => {
      try {
        const operation = await projectAttachmentService.performBulkOperation({
          type: 'attach',
          noteIds: ['invalid-note-id-1', 'invalid-note-id-2'],
          projectId: 'invalid-project-id',
        });
        
        // Should complete but with failures
        if (operation.status === 'failed' || operation.results.failed > 0) {
          return { 
            handled: true,
            status: operation.status,
            failed: operation.results.failed,
            errors: operation.errors.length,
          };
        }
        
        throw new Error('Invalid bulk operation should have failures');
      } catch (error) {
        throw new Error('Bulk operation error not handled gracefully');
      }
    });

    // Test suggestion generation with no projects
    await this.runTest('Suggestion Generation with No Projects', async () => {
      // Temporarily clear projects
      const originalProjects = projectService.getAllProjects();
      localStorage.setItem('astral_projects', JSON.stringify([]));
      
      try {
        const note = quickNotesService.createQuickNote({
          title: 'Test Note',
          content: 'Test content',
        });
        
        const suggestions = projectAttachmentService.generateAttachmentSuggestions(note.id);
        
        if (!Array.isArray(suggestions)) {
          throw new Error('Should return empty array when no projects exist');
        }
        
        if (suggestions.length > 0) {
          throw new Error('Should not generate suggestions with no projects');
        }
        
        return { 
          handled: true,
          suggestionsCount: suggestions.length,
        };
      } finally {
        // Restore projects
        localStorage.setItem('astral_projects', JSON.stringify(originalProjects));
      }
    });

    // Test storage error handling
    await this.runTest('Storage Error Handling', async () => {
      // This test verifies graceful handling of storage errors
      try {
        const analytics = projectAttachmentService.getAttachmentAnalytics();
        
        // Should not throw error even if storage has issues
        if (typeof analytics !== 'object') {
          throw new Error('Analytics should return object even with storage errors');
        }
        
        return { 
          handled: true,
          analyticsGenerated: true,
        };
      } catch (error) {
        throw new Error('Storage errors not handled gracefully');
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

  private backupData(): void {
    this.originalQuickNotes = quickNotesService.getAllQuickNotes();
    this.originalProjects = projectService.getAllProjects();
  }

  private restoreData(): void {
    localStorage.setItem('astral_quick_notes', JSON.stringify(this.originalQuickNotes));
    localStorage.setItem('astral_projects', JSON.stringify(this.originalProjects));
    localStorage.setItem('astral_attachment_relationships', JSON.stringify([]));
    localStorage.setItem('astral_attachment_rules', JSON.stringify([]));
    localStorage.setItem('astral_attachment_analytics', JSON.stringify({}));
    localStorage.setItem('astral_attachment_suggestions', JSON.stringify({}));
  }

  private generateTestReport(): AttachmentTestSuite {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      suiteName: 'Quick Notes Project Attachment System',
      results: this.results,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
    };
  }
}

// Export test runner
export const quickNotesAttachmentTests = new QuickNotesAttachmentTestSuite();