/**
 * Mock Data Service
 * Provides sample data for testing all features of ASTRAL_NOTES
 */

import type { Project, Note, Character, Timeline, Scene, PlotThread } from '@/types';
import type { QuickNote } from './quickNotesService';
import { storageService } from './storageService';
import { projectService } from './projectService';
import { quickNotesService } from './quickNotesService';

export interface MockDataSet {
  id: string;
  name: string;
  description: string;
  projects: Project[];
  quickNotes: QuickNote[];
  notes: Record<string, Note[]>;
}

class MockDataService {
  private static instance: MockDataService;

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  /**
   * Get all available mock data sets
   */
  public getAvailableDataSets(): MockDataSet[] {
    return [
      this.getBasicTestData(),
      this.getAdvancedStoryData(),
      this.getPerformanceTestData(),
      this.getEdgeCaseTestData(),
    ];
  }

  /**
   * Load a specific mock data set
   */
  public loadDataSet(dataSetId: string): boolean {
    const dataSets = this.getAvailableDataSets();
    const dataSet = dataSets.find(ds => ds.id === dataSetId);
    
    if (!dataSet) {
      console.error(`Data set ${dataSetId} not found`);
      return false;
    }

    try {
      // Clear existing data
      this.clearAllData();

      // Load projects
      dataSet.projects.forEach(project => {
        const projects = storageService.getProjects();
        projects.push(project);
        storageService.saveProjects(projects);
      });

      // Load project notes
      Object.entries(dataSet.notes).forEach(([projectId, notes]) => {
        storageService.saveProjectNotes(projectId, notes);
      });

      // Load quick notes
      dataSet.quickNotes.forEach(quickNote => {
        const existingNotes = quickNotesService.getAllQuickNotes();
        const allNotes = [quickNote, ...existingNotes];
        localStorage.setItem('astral_quick_notes', JSON.stringify(allNotes));
      });

      console.log(`Successfully loaded data set: ${dataSet.name}`);
      return true;
    } catch (error) {
      console.error('Error loading data set:', error);
      return false;
    }
  }

  /**
   * Clear all existing data
   */
  public clearAllData(): boolean {
    try {
      localStorage.removeItem('astral_notes_data');
      localStorage.removeItem('astral_quick_notes');
      console.log('All data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Create random project for stress testing
   */
  public createRandomProject(): Project {
    const now = new Date().toISOString();
    const randomId = this.generateId();
    
    const genres = ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Historical', 'Contemporary'];
    const statuses = ['planning', 'writing', 'editing', 'completed'] as const;
    
    return {
      id: randomId,
      title: this.generateRandomTitle(),
      description: this.generateRandomDescription(),
      userId: 'test-user',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      isPublic: Math.random() > 0.5,
      tags: this.generateRandomTags(),
      wordCount: Math.floor(Math.random() * 100000),
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
      stories: [],
      projectNotes: [],
      plotboard: {
        id: this.generateId(),
        projectId: randomId,
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
      genre: genres[Math.floor(Math.random() * genres.length)],
      targetWordCount: 50000 + Math.floor(Math.random() * 100000)
    };
  }

  /**
   * Basic test data set - minimal data for basic functionality testing
   */
  private getBasicTestData(): MockDataSet {
    const now = new Date().toISOString();
    const projectId = 'test-project-basic';
    
    const project: Project = {
      id: projectId,
      title: 'Basic Test Novel',
      description: 'A simple test project for basic functionality validation',
      userId: 'test-user',
      status: 'writing',
      isPublic: false,
      tags: ['test', 'basic', 'novel'],
      wordCount: 5000,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
      stories: [],
      projectNotes: [],
      plotboard: {
        id: this.generateId(),
        projectId,
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
        wordCountTarget: 50000,
        dailyGoal: 500,
        theme: 'light',
        distractionFree: false
      },
      collaborators: [],
      isCollaborative: false,
      genre: 'Fantasy',
      targetWordCount: 50000
    };

    const notes: Note[] = [
      {
        id: 'note-1',
        projectId,
        title: 'Chapter 1: The Beginning',
        content: 'In the beginning was the word, and the word was good. This is the opening chapter of our test novel, containing enough content to validate word counting and basic editing functionality.',
        type: 'scene',
        tags: ['chapter', 'opening'],
        folder: undefined,
        position: 1,
        wordCount: 32,
        readTime: 1,
        status: 'draft',
        priority: 'high',
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
      },
      {
        id: 'note-2',
        projectId,
        title: 'Character Notes: Protagonist',
        content: 'Main character details:\n- Name: Alex\n- Age: 25\n- Motivation: Save the world\n- Backstory: Orphaned at young age',
        type: 'character',
        tags: ['character', 'protagonist'],
        folder: 'Characters',
        position: 2,
        wordCount: 18,
        readTime: 1,
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
      }
    ];

    const quickNotes: QuickNote[] = [
      {
        id: 'quick-1',
        projectId: null,
        title: 'Random Idea',
        content: 'What if dragons could speak but only told dad jokes?',
        type: 'idea',
        tags: ['humor', 'dragons'],
        folder: undefined,
        position: 1,
        wordCount: 11,
        readTime: 1,
        status: 'draft',
        priority: 'low',
        isQuickNote: true,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined
      },
      {
        id: 'quick-2',
        projectId,
        title: 'Plot Twist Idea',
        content: 'The mentor character is actually the main villain in disguise',
        type: 'plot',
        tags: ['plot', 'twist'],
        folder: undefined,
        position: 2,
        wordCount: 11,
        readTime: 1,
        status: 'draft',
        priority: 'high',
        isQuickNote: true,
        attachedToProject: projectId,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined
      }
    ];

    return {
      id: 'basic-test',
      name: 'Basic Test Data',
      description: 'Minimal data set for basic functionality testing',
      projects: [project],
      quickNotes,
      notes: { [projectId]: notes }
    };
  }

  /**
   * Advanced story data set - complex narrative structures
   */
  private getAdvancedStoryData(): MockDataSet {
    const now = new Date().toISOString();
    const projectId = 'test-project-advanced';
    
    const project: Project = {
      id: projectId,
      title: 'The Chronicles of Advanced Testing',
      description: 'An epic fantasy saga with complex characters, multiple storylines, and intricate world-building for advanced feature testing',
      userId: 'test-user',
      status: 'writing',
      isPublic: true,
      tags: ['fantasy', 'epic', 'saga', 'complex'],
      wordCount: 75000,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
      stories: [],
      projectNotes: [],
      plotboard: {
        id: this.generateId(),
        projectId,
        stories: [],
        threads: [],
        connections: [],
        timeline: [],
        settings: {
          viewMode: 'timeline',
          showConnections: true,
          autoLayout: false,
          gridSize: 20,
          theme: 'dark'
        },
        createdAt: now,
        updatedAt: now
      },
      settings: {
        defaultPOV: 'third-limited',
        defaultLocation: 'Aethermoor',
        timeFormat: '24h',
        dateFormat: 'DMY',
        autoSave: true,
        versionHistory: true,
        linkPreview: true,
        wordCountTarget: 120000,
        dailyGoal: 1000,
        theme: 'dark',
        distractionFree: true
      },
      collaborators: [],
      isCollaborative: false,
      genre: 'Epic Fantasy',
      targetWordCount: 120000
    };

    // Generate complex note structure
    const notes: Note[] = [];
    const chapters = 20;
    const charactersCount = 15;
    const worldBuildingNotes = 10;

    // Create chapters
    for (let i = 1; i <= chapters; i++) {
      notes.push({
        id: `chapter-${i}`,
        projectId,
        title: `Chapter ${i}: ${this.generateChapterTitle()}`,
        content: this.generateLongContent(500 + Math.floor(Math.random() * 1000)),
        type: 'scene',
        tags: ['chapter', 'scene'],
        folder: 'Chapters',
        position: i,
        wordCount: 500 + Math.floor(Math.random() * 1000),
        readTime: Math.ceil((500 + Math.floor(Math.random() * 1000)) / 200),
        status: i <= 15 ? 'completed' : 'draft',
        priority: 'high',
        wikiLinks: [`[[Character ${Math.floor(Math.random() * 5) + 1}]]`],
        backlinks: [],
        linkedElements: [],
        templateData: undefined,
        comments: [],
        lastEditedBy: undefined,
        version: Math.floor(Math.random() * 3) + 1,
        versionHistory: [],
        aiSuggestions: [],
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined
      });
    }

    // Create character profiles
    for (let i = 1; i <= charactersCount; i++) {
      notes.push({
        id: `character-${i}`,
        projectId,
        title: `Character Profile: ${this.generateCharacterName()}`,
        content: this.generateCharacterProfile(),
        type: 'character',
        tags: ['character', 'profile'],
        folder: 'Characters',
        position: i,
        wordCount: 150,
        readTime: 1,
        status: 'completed',
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
      });
    }

    // Create world-building notes
    for (let i = 1; i <= worldBuildingNotes; i++) {
      notes.push({
        id: `world-${i}`,
        projectId,
        title: `World Building: ${this.generateLocationName()}`,
        content: this.generateWorldBuildingContent(),
        type: 'worldbuilding',
        tags: ['worldbuilding', 'location'],
        folder: 'World',
        position: i,
        wordCount: 200,
        readTime: 1,
        status: 'draft',
        priority: 'low',
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
      });
    }

    const quickNotes: QuickNote[] = [
      {
        id: 'advanced-quick-1',
        projectId,
        title: 'Magic System Rules',
        content: 'Magic requires emotional resonance with natural elements. Overuse leads to elemental corruption.',
        type: 'worldbuilding',
        tags: ['magic', 'rules', 'system'],
        folder: undefined,
        position: 1,
        wordCount: 13,
        readTime: 1,
        status: 'draft',
        priority: 'high',
        isQuickNote: true,
        attachedToProject: projectId,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined
      }
    ];

    return {
      id: 'advanced-story',
      name: 'Advanced Story Data',
      description: 'Complex narrative with multiple characters and storylines',
      projects: [project],
      quickNotes,
      notes: { [projectId]: notes }
    };
  }

  /**
   * Performance test data set - large amounts of data
   */
  private getPerformanceTestData(): MockDataSet {
    const now = new Date().toISOString();
    const projects: Project[] = [];
    const notes: Record<string, Note[]> = {};
    const quickNotes: QuickNote[] = [];

    // Create 50 projects
    for (let i = 1; i <= 50; i++) {
      const projectId = `perf-project-${i}`;
      const project = this.createRandomProject();
      project.id = projectId;
      project.title = `Performance Test Project ${i}`;
      projects.push(project);

      // Create 100 notes per project
      const projectNotes: Note[] = [];
      for (let j = 1; j <= 100; j++) {
        projectNotes.push({
          id: `perf-note-${i}-${j}`,
          projectId,
          title: `Note ${j}: ${this.generateRandomTitle()}`,
          content: this.generateLongContent(100 + Math.floor(Math.random() * 500)),
          type: j % 3 === 0 ? 'character' : j % 3 === 1 ? 'scene' : 'note',
          tags: this.generateRandomTags(),
          folder: j <= 33 ? 'Folder A' : j <= 66 ? 'Folder B' : 'Folder C',
          position: j,
          wordCount: 100 + Math.floor(Math.random() * 500),
          readTime: 1,
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
        });
      }
      notes[projectId] = projectNotes;
    }

    // Create 500 quick notes
    for (let i = 1; i <= 500; i++) {
      quickNotes.push({
        id: `perf-quick-${i}`,
        projectId: i % 10 === 0 ? projects[Math.floor(Math.random() * projects.length)].id : null,
        title: `Quick Note ${i}`,
        content: this.generateRandomContent(),
        type: i % 4 === 0 ? 'idea' : 'note',
        tags: this.generateRandomTags(),
        folder: undefined,
        position: i,
        wordCount: 20 + Math.floor(Math.random() * 100),
        readTime: 1,
        status: 'draft',
        priority: 'medium',
        isQuickNote: true,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined
      });
    }

    return {
      id: 'performance-test',
      name: 'Performance Test Data',
      description: 'Large dataset for performance and stress testing',
      projects,
      quickNotes,
      notes
    };
  }

  /**
   * Edge case test data set - unusual scenarios and edge cases
   */
  private getEdgeCaseTestData(): MockDataSet {
    const now = new Date().toISOString();
    const projectId = 'edge-case-project';
    
    const project: Project = {
      id: projectId,
      title: '',  // Empty title edge case
      description: 'A' + 'x'.repeat(10000),  // Very long description
      userId: 'test-user',
      status: 'completed',
      isPublic: false,
      tags: Array(100).fill(0).map((_, i) => `tag${i}`),  // Many tags
      wordCount: 0,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
      stories: [],
      projectNotes: [],
      plotboard: {
        id: this.generateId(),
        projectId,
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
      genre: 'Test Genre',
      targetWordCount: 0
    };

    const notes: Note[] = [
      // Empty note
      {
        id: 'empty-note',
        projectId,
        title: '',
        content: '',
        type: 'note',
        tags: [],
        folder: undefined,
        position: 1,
        wordCount: 0,
        readTime: 0,
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
      },
      // Very long note
      {
        id: 'long-note',
        projectId,
        title: 'Extremely Long Note Title That Goes On And On And Tests The Limits Of What The UI Can Handle Without Breaking',
        content: 'A'.repeat(50000),  // Very long content
        type: 'note',
        tags: Array(50).fill(0).map((_, i) => `longtag${i}`),
        folder: undefined,
        position: 2,
        wordCount: 50000,
        readTime: 250,
        status: 'draft',
        priority: 'high',
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
      },
      // Special characters note
      {
        id: 'special-chars-note',
        projectId,
        title: '🚀 Note with 特殊字符 and émojis 💀 and ñ',
        content: 'Testing unicode: 你好世界 🌍 ñoño café résumé naïve Москва עברית العربية 한국어',
        type: 'note',
        tags: ['unicode', '특수문자', 'émojis'],
        folder: undefined,
        position: 3,
        wordCount: 10,
        readTime: 1,
        status: 'draft',
        priority: 'low',
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
      }
    ];

    const quickNotes: QuickNote[] = [
      {
        id: 'edge-quick-1',
        projectId: null,
        title: '',  // Empty title
        content: '',  // Empty content
        type: 'note',
        tags: [],
        folder: undefined,
        position: 1,
        wordCount: 0,
        readTime: 0,
        status: 'draft',
        priority: 'medium',
        isQuickNote: true,
        createdAt: now,
        updatedAt: now,
        archivedAt: undefined
      }
    ];

    return {
      id: 'edge-cases',
      name: 'Edge Cases Test Data',
      description: 'Unusual scenarios and boundary conditions',
      projects: [project],
      quickNotes,
      notes: { [projectId]: notes }
    };
  }

  /**
   * Generate AI mock responses for testing
   */
  public generateMockAIResponse(prompt: string): {
    content: string;
    suggestions: string[];
    confidence: number;
  } {
    const responses = [
      "This is a mock AI response for testing purposes. The AI would provide helpful suggestions based on your writing context.",
      "Here's a sample suggestion that might help improve your story. Consider exploring the character's motivation deeper.",
      "An AI writing assistant would analyze your text and offer constructive feedback about pacing, character development, and plot progression."
    ];

    const suggestions = [
      "Consider adding more sensory details",
      "This dialogue could be more natural",
      "The pacing here feels a bit rushed",
      "Great character development in this section",
      "This scene could benefit from more tension"
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      suggestions: suggestions.slice(0, Math.floor(Math.random() * 3) + 1),
      confidence: 0.7 + Math.random() * 0.3
    };
  }

  // Helper methods for generating random content
  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRandomTitle(): string {
    const adjectives = ['Epic', 'Mysterious', 'Forgotten', 'Ancient', 'Lost', 'Hidden', 'Sacred', 'Forbidden'];
    const nouns = ['Journey', 'Quest', 'Legend', 'Tale', 'Chronicle', 'Saga', 'Adventure', 'Mystery'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private generateRandomDescription(): string {
    return `A compelling story about adventure, mystery, and discovery. This project explores themes of ${this.generateRandomTags().join(', ')} with rich character development and intricate plot twists.`;
  }

  private generateRandomTags(): string[] {
    const allTags = ['adventure', 'mystery', 'romance', 'fantasy', 'scifi', 'thriller', 'drama', 'comedy', 'action', 'magic', 'dragons', 'heroes', 'villains', 'quest'];
    const count = Math.floor(Math.random() * 5) + 1;
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateRandomContent(): string {
    const sentences = [
      "The ancient tome revealed secrets long forgotten by mortals.",
      "In the distance, thunder echoed across the mystical landscape.",
      "Characters must face their deepest fears to achieve their goals.",
      "The plot thickens with each chapter, revealing new mysteries.",
      "World-building requires attention to detail and consistency."
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
  }

  private generateLongContent(wordCount: number): string {
    const words = ['the', 'and', 'to', 'of', 'a', 'in', 'that', 'have', 'for', 'not', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their'];
    let content = '';
    for (let i = 0; i < wordCount; i++) {
      content += words[Math.floor(Math.random() * words.length)];
      if (i < wordCount - 1) content += ' ';
    }
    return content;
  }

  private generateChapterTitle(): string {
    const titles = ['The Beginning', 'First Steps', 'Dark Shadows', 'New Allies', 'The Challenge', 'Revelation', 'The Journey', 'Confrontation', 'Hope Returns', 'Final Battle'];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateCharacterName(): string {
    const firstNames = ['Alex', 'Morgan', 'Riley', 'Jordan', 'Casey', 'Taylor', 'Jamie', 'Avery', 'Quinn', 'Sage'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private generateCharacterProfile(): string {
    return `Age: ${18 + Math.floor(Math.random() * 50)}
Occupation: Writer
Personality: Determined, creative, sometimes overthinks
Goals: Complete their novel and find their voice
Fears: Failure, judgment from others
Background: Grew up in a small town, always loved stories`;
  }

  private generateLocationName(): string {
    const prefixes = ['North', 'South', 'East', 'West', 'Upper', 'Lower', 'Old', 'New'];
    const places = ['Haven', 'Valley', 'Ridge', 'Falls', 'Grove', 'Field', 'Hollow', 'Point'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${places[Math.floor(Math.random() * places.length)]}`;
  }

  private generateWorldBuildingContent(): string {
    return `Geography: Rolling hills with ancient forests
Climate: Temperate with mystical weather patterns
Culture: Rich storytelling tradition
Government: Council of Elders
Magic: Elemental magic tied to natural features
History: Founded after the Great Convergence
Notable Features: Crystal caves that amplify magical abilities`;
  }
}

export const mockDataService = MockDataService.getInstance();