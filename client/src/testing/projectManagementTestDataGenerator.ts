/**
 * Project Management Test Data Generator
 * Generates comprehensive test data for all project management functionality
 */

import type { Project, Note } from '@/types/global';
import type { QuickNote } from '@/services/quickNotesService';
import type { CreateProjectData, UpdateProjectData } from '@/services/projectService';
import type { AttachmentRelationship, AttachmentSuggestion, BulkAttachmentOperation } from '@/services/projectAttachmentService';

export interface ProjectTestData {
  projects: Project[];
  quickNotes: QuickNote[];
  projectNotes: Record<string, Note[]>;
  attachmentRelationships: AttachmentRelationship[];
  testScenarios: ProjectTestScenario[];
}

export interface ProjectTestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  cleanup: () => Promise<void>;
  data: {
    projects?: Project[];
    notes?: QuickNote[];
    attachments?: AttachmentRelationship[];
  };
}

export class ProjectManagementTestDataGenerator {
  private static instance: ProjectManagementTestDataGenerator;

  public static getInstance(): ProjectManagementTestDataGenerator {
    if (!ProjectManagementTestDataGenerator.instance) {
      ProjectManagementTestDataGenerator.instance = new ProjectManagementTestDataGenerator();
    }
    return ProjectManagementTestDataGenerator.instance;
  }

  // ==================== PROJECT GENERATORS ====================

  /**
   * Generate a basic project for testing
   */
  public generateBasicProject(overrides: Partial<Project> = {}): Project {
    const now = new Date().toISOString();
    const id = this.generateId('project');
    
    return {
      id,
      title: 'Test Project',
      description: 'A test project for validation',
      userId: 'test-user-1',
      status: 'planning',
      isPublic: false,
      tags: ['test', 'automation'],
      wordCount: 0,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
      stories: [],
      projectNotes: [],
      plotboard: {
        id: this.generateId('plotboard'),
        projectId: id,
        stories: [],
        threads: [],
        connections: [],
        timeline: [],
        settings: {
          viewMode: 'grid',
          showConnections: true,
          autoLayout: true,
          gridSize: 20,
          theme: 'light'
        },
        createdAt: now,
        updatedAt: now
      },
      settings: {
        defaultPOV: undefined,
        defaultLocation: undefined,
        timeFormat: '12h',
        dateFormat: 'MDY',
        autoSave: true,
        versionHistory: true,
        linkPreview: true,
        wordCountTarget: undefined,
        dailyGoal: undefined,
        theme: 'light',
        distractionFree: false
      },
      collaborators: [],
      isCollaborative: false,
      genre: 'Fiction',
      targetWordCount: 50000,
      ...overrides
    };
  }

  /**
   * Generate projects with different types and complexities
   */
  public generateProjectVariations(): Project[] {
    const projects: Project[] = [];

    // Novel project
    projects.push(this.generateBasicProject({
      title: 'Epic Fantasy Novel',
      description: 'A comprehensive fantasy world with magic and dragons',
      genre: 'Fantasy',
      targetWordCount: 120000,
      tags: ['fantasy', 'novel', 'magic', 'dragons'],
      status: 'writing'
    }));

    // Short story collection
    projects.push(this.generateBasicProject({
      title: 'Short Story Collection',
      description: 'Collection of interconnected short stories',
      genre: 'Literary Fiction',
      targetWordCount: 25000,
      tags: ['short-stories', 'collection', 'literary'],
      status: 'planning'
    }));

    // Research project
    projects.push(this.generateBasicProject({
      title: 'Historical Research Project',
      description: 'Research on medieval European history',
      genre: 'Non-fiction',
      targetWordCount: 80000,
      tags: ['research', 'history', 'medieval', 'non-fiction'],
      status: 'research'
    }));

    // Screenplay
    projects.push(this.generateBasicProject({
      title: 'Sci-Fi Screenplay',
      description: 'Futuristic thriller screenplay',
      genre: 'Science Fiction',
      targetWordCount: 30000,
      tags: ['screenplay', 'sci-fi', 'thriller'],
      status: 'outlining'
    }));

    // Empty project
    projects.push(this.generateBasicProject({
      title: 'Empty Project',
      description: '',
      genre: undefined,
      targetWordCount: undefined,
      tags: [],
      status: 'planning'
    }));

    // Large project with many notes
    const largeProject = this.generateBasicProject({
      title: 'Large Complex Project',
      description: 'Project with extensive world-building and character development',
      genre: 'Epic Fantasy',
      targetWordCount: 200000,
      tags: ['epic', 'complex', 'world-building', 'character-driven'],
      status: 'writing',
      wordCount: 45000
    });
    projects.push(largeProject);

    // Archived project
    projects.push(this.generateBasicProject({
      title: 'Completed Novel',
      description: 'A finished novel that has been published',
      genre: 'Mystery',
      targetWordCount: 75000,
      tags: ['mystery', 'completed', 'published'],
      status: 'completed',
      wordCount: 78500
    }));

    // Collaborative project
    projects.push(this.generateBasicProject({
      title: 'Collaborative Writing Project',
      description: 'Multi-author anthology project',
      genre: 'Anthology',
      targetWordCount: 100000,
      tags: ['collaboration', 'anthology', 'multi-author'],
      status: 'writing',
      isCollaborative: true,
      collaborators: [
        {
          id: 'collab-1',
          userId: 'user-2',
          projectId: '',
          role: 'editor',
          permissions: ['read', 'write', 'comment'],
          joinedAt: new Date().toISOString(),
          invitedBy: 'test-user-1'
        }
      ]
    }));

    return projects;
  }

  // ==================== QUICK NOTE GENERATORS ====================

  /**
   * Generate basic quick note
   */
  public generateBasicQuickNote(overrides: Partial<QuickNote> = {}): QuickNote {
    const now = new Date().toISOString();
    const content = 'This is a test quick note with some content to analyze.';
    
    return {
      id: this.generateId('quick_note'),
      projectId: null,
      title: 'Test Quick Note',
      content,
      type: 'note',
      tags: ['test'],
      position: 1,
      wordCount: this.calculateWordCount(content),
      readTime: this.calculateReadTime(content),
      status: 'draft',
      priority: 'medium',
      isQuickNote: true,
      createdAt: now,
      updatedAt: now,
      archivedAt: undefined,
      ...overrides
    };
  }

  /**
   * Generate quick notes with different types and content
   */
  public generateQuickNoteVariations(): QuickNote[] {
    const notes: QuickNote[] = [];

    // Character idea note
    notes.push(this.generateBasicQuickNote({
      title: 'Character Idea: The Mysterious Librarian',
      content: 'An elderly librarian who secretly guards ancient magical texts. Has the ability to communicate with books and understand forgotten languages.',
      type: 'character',
      tags: ['character', 'fantasy', 'magic', 'librarian'],
      priority: 'high'
    }));

    // Plot twist idea
    notes.push(this.generateBasicQuickNote({
      title: 'Plot Twist: The Mentor is the Villain',
      content: 'What if the wise mentor character who has been guiding the hero is actually the main antagonist? This could create a powerful betrayal moment.',
      type: 'plot',
      tags: ['plot', 'twist', 'betrayal', 'mentor'],
      priority: 'high'
    }));

    // World-building note
    notes.push(this.generateBasicQuickNote({
      title: 'Magic System: Elemental Binding',
      content: 'Magic users can bind themselves to natural elements (fire, water, earth, air) but doing so limits their flexibility and creates weaknesses.',
      type: 'worldbuilding',
      tags: ['worldbuilding', 'magic-system', 'elements'],
      priority: 'medium'
    }));

    // Research note
    notes.push(this.generateBasicQuickNote({
      title: 'Medieval Castle Architecture',
      content: 'Notes on authentic medieval castle design: motte and bailey construction, defensive features like murder holes and portcullises.',
      type: 'research',
      tags: ['research', 'medieval', 'architecture', 'castle'],
      priority: 'low'
    }));

    // Scene snippet
    notes.push(this.generateBasicQuickNote({
      title: 'Opening Scene Draft',
      content: 'The rain hammered against the window as Sarah stared at the letter that would change everything. Her hands trembled as she read the words again.',
      type: 'scene',
      tags: ['scene', 'opening', 'rain', 'letter'],
      priority: 'high'
    }));

    // Dialogue note
    notes.push(this.generateBasicQuickNote({
      title: 'Witty Dialogue Exchange',
      content: '"You know what your problem is?" she asked. "I have a feeling you\'re about to tell me," he replied with a smirk.',
      type: 'dialogue',
      tags: ['dialogue', 'witty', 'banter'],
      priority: 'medium'
    }));

    // Empty note
    notes.push(this.generateBasicQuickNote({
      title: 'Untitled Quick Note',
      content: '',
      tags: [],
      priority: 'low'
    }));

    // Long content note
    const longContent = this.generateLongContent();
    notes.push(this.generateBasicQuickNote({
      title: 'Detailed Character Background',
      content: longContent,
      type: 'character',
      tags: ['character', 'background', 'detailed'],
      priority: 'medium'
    }));

    // Note with special characters
    notes.push(this.generateBasicQuickNote({
      title: 'Note with Special Characters',
      content: 'This note contains special characters: àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ and symbols: @#$%^&*(){}[]',
      tags: ['special-characters', 'unicode', 'symbols'],
      priority: 'low'
    }));

    // Archived note
    notes.push(this.generateBasicQuickNote({
      title: 'Archived Idea',
      content: 'This was a good idea but we decided not to use it.',
      status: 'archived',
      archivedAt: new Date().toISOString(),
      tags: ['archived', 'unused'],
      priority: 'low'
    }));

    return notes;
  }

  /**
   * Generate notes already attached to projects
   */
  public generateAttachedQuickNotes(projects: Project[]): QuickNote[] {
    const notes: QuickNote[] = [];

    projects.forEach((project, index) => {
      if (index % 2 === 0) { // Attach notes to every other project
        // Create 2-3 notes per project
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          notes.push(this.generateBasicQuickNote({
            title: `${project.title} - Note ${i + 1}`,
            content: `This note is related to ${project.title}. ${project.description}`,
            projectId: project.id,
            attachedToProject: project.id,
            tags: [...project.tags, 'attached'],
            type: i === 0 ? 'character' : i === 1 ? 'plot' : 'research'
          }));
        }
      }
    });

    return notes;
  }

  // ==================== PROJECT NOTES GENERATORS ====================

  /**
   * Generate project notes for each project
   */
  public generateProjectNotes(projects: Project[]): Record<string, Note[]> {
    const projectNotes: Record<string, Note[]> = {};

    projects.forEach(project => {
      const notes: Note[] = [];
      const noteCount = this.getRandomNumber(3, 8); // 3-8 notes per project

      for (let i = 0; i < noteCount; i++) {
        notes.push(this.generateProjectNote(project, i));
      }

      projectNotes[project.id] = notes;
    });

    return projectNotes;
  }

  private generateProjectNote(project: Project, index: number): Note {
    const now = new Date().toISOString();
    const types = ['character', 'plot', 'scene', 'research', 'dialogue', 'worldbuilding'];
    const type = types[index % types.length];
    
    const content = this.generateNoteContentByType(type, project);
    
    return {
      id: this.generateId('note'),
      projectId: project.id,
      title: `${project.title} - ${this.capitalizeFirst(type)} Note ${index + 1}`,
      content,
      type: type as any,
      tags: [...project.tags, type],
      folder: undefined,
      position: index + 1,
      wordCount: this.calculateWordCount(content),
      readTime: this.calculateReadTime(content),
      status: 'draft',
      priority: 'medium',
      wikiLinks: [],
      backlinks: [],
      linkedElements: [],
      templateData: undefined,
      comments: [],
      lastEditedBy: undefined,
      version: 1,
      versionHistory: [],
      aiSuggestions: [],
      createdAt: now,
      updatedAt: now,
      archivedAt: undefined
    };
  }

  // ==================== ATTACHMENT RELATIONSHIP GENERATORS ====================

  /**
   * Generate attachment relationships between quick notes and projects
   */
  public generateAttachmentRelationships(quickNotes: QuickNote[], projects: Project[]): AttachmentRelationship[] {
    const relationships: AttachmentRelationship[] = [];

    quickNotes.forEach(note => {
      if (note.projectId) {
        relationships.push({
          id: this.generateId('attachment'),
          noteId: note.id,
          projectId: note.projectId,
          attachedAt: note.updatedAt,
          attachmentType: 'manual',
          tags: [...note.tags],
          metadata: {
            originalAttachment: true
          }
        });
      }
    });

    return relationships;
  }

  /**
   * Generate attachment suggestions for testing
   */
  public generateAttachmentSuggestions(quickNotes: QuickNote[], projects: Project[]): AttachmentSuggestion[] {
    const suggestions: AttachmentSuggestion[] = [];
    const unattachedNotes = quickNotes.filter(note => !note.projectId);

    unattachedNotes.forEach(note => {
      projects.forEach(project => {
        // Calculate similarity based on tags and content
        const commonTags = note.tags.filter(tag => project.tags.includes(tag));
        const hasKeywordMatch = this.hasKeywordSimilarity(note.content, project.description || '');
        
        if (commonTags.length > 0 || hasKeywordMatch) {
          const confidence = this.calculateSuggestionConfidence(note, project);
          
          suggestions.push({
            noteId: note.id,
            projectId: project.id,
            confidence,
            reasons: this.generateSuggestionReasons(note, project, commonTags),
            autoAttach: confidence >= 0.8
          });
        }
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // ==================== TEST SCENARIOS ====================

  /**
   * Generate comprehensive test scenarios
   */
  public generateTestScenarios(projects: Project[], quickNotes: QuickNote[]): ProjectTestScenario[] {
    return [
      {
        name: 'Empty State Testing',
        description: 'Test project management with no existing data',
        setup: async () => {
          localStorage.removeItem('astral_projects');
          localStorage.removeItem('astral_quick_notes');
        },
        cleanup: async () => {
          // Cleanup is handled by individual tests
        },
        data: {
          projects: [],
          notes: [],
          attachments: []
        }
      },
      {
        name: 'Single Project Workflow',
        description: 'Test complete workflow with one project',
        setup: async () => {
          const singleProject = [projects[0]];
          localStorage.setItem('astral_projects', JSON.stringify(singleProject));
        },
        cleanup: async () => {
          localStorage.removeItem('astral_projects');
        },
        data: {
          projects: [projects[0]],
          notes: quickNotes.slice(0, 3),
          attachments: []
        }
      },
      {
        name: 'Multiple Projects with Notes',
        description: 'Test with multiple projects and various note types',
        setup: async () => {
          localStorage.setItem('astral_projects', JSON.stringify(projects));
          localStorage.setItem('astral_quick_notes', JSON.stringify(quickNotes));
        },
        cleanup: async () => {
          localStorage.removeItem('astral_projects');
          localStorage.removeItem('astral_quick_notes');
        },
        data: {
          projects,
          notes: quickNotes,
          attachments: []
        }
      },
      {
        name: 'Large Scale Data Testing',
        description: 'Test performance with large amounts of data',
        setup: async () => {
          const largeProjects = this.generateLargeDataSet(50, 200);
          localStorage.setItem('astral_projects', JSON.stringify(largeProjects.projects));
          localStorage.setItem('astral_quick_notes', JSON.stringify(largeProjects.quickNotes));
        },
        cleanup: async () => {
          localStorage.removeItem('astral_projects');
          localStorage.removeItem('astral_quick_notes');
        },
        data: {}
      },
      {
        name: 'Edge Cases and Error Conditions',
        description: 'Test handling of corrupt data, missing references, etc.',
        setup: async () => {
          const corruptData = this.generateCorruptData();
          localStorage.setItem('astral_projects', JSON.stringify(corruptData.projects));
          localStorage.setItem('astral_quick_notes', JSON.stringify(corruptData.quickNotes));
        },
        cleanup: async () => {
          localStorage.removeItem('astral_projects');
          localStorage.removeItem('astral_quick_notes');
        },
        data: {}
      }
    ];
  }

  // ==================== BULK OPERATIONS DATA ====================

  /**
   * Generate data for bulk operations testing
   */
  public generateBulkOperationData(): {
    operations: Omit<BulkAttachmentOperation, 'id' | 'status' | 'progress' | 'startedAt' | 'results' | 'errors'>[];
    noteIds: string[];
    projectIds: string[];
  } {
    const noteIds = Array.from({ length: 20 }, (_, i) => this.generateId('bulk_note_' + i));
    const projectIds = Array.from({ length: 5 }, (_, i) => this.generateId('bulk_project_' + i));

    const operations = [
      {
        type: 'attach' as const,
        noteIds: noteIds.slice(0, 5),
        projectId: projectIds[0]
      },
      {
        type: 'detach' as const,
        noteIds: noteIds.slice(5, 10)
      },
      {
        type: 'migrate' as const,
        noteIds: noteIds.slice(10, 15),
        projectId: projectIds[1],
        targetProjectId: projectIds[2]
      },
      {
        type: 'organize' as const,
        noteIds: noteIds.slice(15, 20)
      }
    ];

    return { operations, noteIds, projectIds };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate complete test data set
   */
  public generateCompleteTestData(): ProjectTestData {
    const projects = this.generateProjectVariations();
    const quickNotes = [
      ...this.generateQuickNoteVariations(),
      ...this.generateAttachedQuickNotes(projects)
    ];
    const projectNotes = this.generateProjectNotes(projects);
    const attachmentRelationships = this.generateAttachmentRelationships(quickNotes, projects);
    const testScenarios = this.generateTestScenarios(projects, quickNotes);

    return {
      projects,
      quickNotes,
      projectNotes,
      attachmentRelationships,
      testScenarios
    };
  }

  /**
   * Generate large dataset for performance testing
   */
  public generateLargeDataSet(projectCount: number, noteCount: number): {
    projects: Project[];
    quickNotes: QuickNote[];
  } {
    const projects: Project[] = [];
    const quickNotes: QuickNote[] = [];

    // Generate projects
    for (let i = 0; i < projectCount; i++) {
      projects.push(this.generateBasicProject({
        title: `Performance Test Project ${i + 1}`,
        description: `This is project number ${i + 1} for performance testing`,
        tags: [`perf-test-${i}`, 'performance', 'large-scale'],
        status: i % 3 === 0 ? 'writing' : i % 3 === 1 ? 'planning' : 'research'
      }));
    }

    // Generate quick notes
    for (let i = 0; i < noteCount; i++) {
      const attachToProject = i % 4 === 0 ? projects[i % projects.length].id : null;
      quickNotes.push(this.generateBasicQuickNote({
        title: `Performance Test Note ${i + 1}`,
        content: `This is note number ${i + 1} for performance testing. ${this.generateRandomContent()}`,
        projectId: attachToProject,
        attachedToProject: attachToProject || undefined,
        tags: [`perf-note-${i}`, 'performance', 'large-scale'],
        type: ['note', 'character', 'plot', 'research', 'scene'][i % 5] as any
      }));
    }

    return { projects, quickNotes };
  }

  /**
   * Generate corrupt data for error testing
   */
  private generateCorruptData(): { projects: any[]; quickNotes: any[] } {
    return {
      projects: [
        // Missing required fields
        { id: 'corrupt-1', title: '' },
        // Invalid data types
        { id: 'corrupt-2', title: 123, description: true, tags: 'not-an-array' },
        // Circular references
        { id: 'corrupt-3', title: 'Corrupt Project', parent: 'corrupt-3' }
      ],
      quickNotes: [
        // Missing required fields
        { id: 'corrupt-note-1' },
        // Invalid projectId reference
        { id: 'corrupt-note-2', title: 'Orphan Note', projectId: 'non-existent-project' },
        // Invalid data types
        { id: 'corrupt-note-3', title: 123, content: [], tags: 'invalid' }
      ]
    };
  }

  private generateNoteContentByType(type: string, project: Project): string {
    const templates = {
      character: `Character profile for ${project.title}:\n\nName: [Character Name]\nAge: [Age]\nRole: [Role in story]\nPersonality: [Key traits]\nBackground: [Character history]\nGoals: [What they want]\nConflicts: [Internal/external conflicts]`,
      plot: `Plot outline for ${project.title}:\n\nInciting Incident: [What starts the story]\nRising Action: [Building tension]\nClimax: [Turning point]\nFalling Action: [Consequences]\nResolution: [How it ends]`,
      scene: `Scene for ${project.title}:\n\nLocation: [Where it takes place]\nCharacters: [Who is present]\nPurpose: [What this scene accomplishes]\nConflict: [Tension or problem]\nOutcome: [How it ends]`,
      research: `Research notes for ${project.title}:\n\nTopic: [Research subject]\nSources: [Where information came from]\nKey Facts: [Important details]\nApplications: [How to use in story]`,
      dialogue: `Dialogue for ${project.title}:\n\n"[Character 1 speaks]"\n"[Character 2 responds]"\n\nSubtext: [What's really being said]\nTone: [Emotional undercurrent]`,
      worldbuilding: `World-building for ${project.title}:\n\nAspect: [What element of the world]\nDescription: [How it works]\nRules: [Limitations or guidelines]\nImpact: [How it affects the story]`
    };

    return templates[type] || `Notes for ${project.title}:\n\nGeneral information and ideas related to this project.`;
  }

  private hasKeywordSimilarity(text1: string, text2: string): boolean {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
    return commonWords.length > 0;
  }

  private calculateSuggestionConfidence(note: QuickNote, project: Project): number {
    let confidence = 0;

    // Tag matching (40% weight)
    const commonTags = note.tags.filter(tag => project.tags.includes(tag));
    confidence += (commonTags.length / Math.max(note.tags.length, project.tags.length)) * 0.4;

    // Content similarity (30% weight)
    const contentMatch = this.hasKeywordSimilarity(note.content, project.description || '');
    if (contentMatch) confidence += 0.3;

    // Title similarity (20% weight)
    const titleMatch = this.hasKeywordSimilarity(note.title, project.title);
    if (titleMatch) confidence += 0.2;

    // Type matching (10% weight)
    if (note.type && project.genre && note.type.includes(project.genre.toLowerCase())) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private generateSuggestionReasons(note: QuickNote, project: Project, commonTags: string[]): string[] {
    const reasons: string[] = [];

    if (commonTags.length > 0) {
      reasons.push(`Shares ${commonTags.length} tag(s): ${commonTags.join(', ')}`);
    }

    if (this.hasKeywordSimilarity(note.content, project.description || '')) {
      reasons.push('Content contains relevant keywords');
    }

    if (this.hasKeywordSimilarity(note.title, project.title)) {
      reasons.push('Title similarity detected');
    }

    if (note.type && project.genre && note.type.includes(project.genre.toLowerCase())) {
      reasons.push(`Note type matches project genre`);
    }

    return reasons;
  }

  private generateLongContent(): string {
    return `This is a detailed character background that contains a lot of text to test performance and handling of longer content. 

The character was born in a small village nestled between rolling hills and ancient forests. From an early age, they showed signs of unusual abilities that would later shape their destiny. Their childhood was marked by both wonder and isolation, as their powers made them different from other children.

As they grew older, they learned to control and understand their abilities through trial and error, often with dangerous consequences. The village elders eventually recognized their potential and sent them to train with a master who lived in the distant mountains.

Years of rigorous training followed, during which they not only honed their skills but also developed a deep understanding of the responsibilities that came with their power. They learned about the ancient conflicts that had shaped their world and their role in the ongoing struggle between light and darkness.

Eventually, they returned to their village as a changed person, ready to face the challenges that awaited them. Little did they know that their greatest test was yet to come, and it would require everything they had learned and more.

This background provides rich material for character development throughout the story, offering multiple plot hooks and emotional touchstones that can be explored as the narrative unfolds.`;
  }

  private generateRandomContent(): string {
    const snippets = [
      'A mysterious figure appeared at the crossroads.',
      'The ancient tome revealed secrets of the past.',
      'Thunder echoed across the darkening sky.',
      'She discovered a hidden passage behind the bookshelf.',
      'The city lights twinkled like stars below.',
      'A gentle breeze carried the scent of jasmine.',
      'The old wizard stroked his long beard thoughtfully.',
      'Footsteps echoed in the empty corridor.',
      'The map led to an uncharted island.',
      'Magic sparkled in the air around them.'
    ];
    
    return snippets[Math.floor(Math.random() * snippets.length)];
  }

  private calculateWordCount(content: string): number {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).length;
  }

  private calculateReadTime(content: string): number {
    const wordCount = this.calculateWordCount(content);
    return Math.ceil(wordCount / 200); // 200 words per minute
  }

  private generateId(prefix: string = 'test'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const projectTestDataGenerator = ProjectManagementTestDataGenerator.getInstance();