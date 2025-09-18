/**
 * Chapter Planning Service
 * Comprehensive chapter organization with word targets, structure templates, and progress tracking
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface ChapterPlan {
  id: string;
  title: string;
  number: number;
  summary: string;
  wordTarget: number;
  currentWordCount: number;
  status: 'outlined' | 'drafted' | 'revised' | 'completed';
  scenes: ScenePlan[];
  structure: ChapterStructure;
  timeline: {
    startDate?: Date;
    deadline?: Date;
    completedDate?: Date;
  };
  tags: string[];
  notes: string;
  plotPoints: PlotPoint[];
  characterGoals: CharacterGoal[];
  conflicts: string[];
  themes: string[];
  pov: string; // Point of view character
  setting: string;
  mood: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenePlan {
  id: string;
  title: string;
  summary: string;
  wordTarget: number;
  currentWordCount: number;
  purpose: 'exposition' | 'rising-action' | 'climax' | 'falling-action' | 'resolution' | 'transition';
  characters: string[];
  setting: string;
  conflict: string;
  outcome: string;
  mood: string;
  pov: string;
  notes: string;
  order: number;
  status: 'planned' | 'drafted' | 'revised' | 'completed';
}

export interface ChapterStructure {
  template: 'three-act' | 'hero-journey' | 'fichtean-curve' | 'freytag-pyramid' | 'custom';
  beats: StructureBeat[];
  hooks: {
    opening: string;
    midpoint: string;
    ending: string;
  };
  transitions: {
    fromPrevious: string;
    toNext: string;
  };
}

export interface StructureBeat {
  id: string;
  name: string;
  description: string;
  percentage: number; // Position in chapter (0-100)
  wordTarget: number;
  completed: boolean;
  notes: string;
}

export interface PlotPoint {
  id: string;
  type: 'setup' | 'inciting-incident' | 'plot-point-1' | 'midpoint' | 'plot-point-2' | 'climax' | 'resolution';
  description: string;
  importance: 'critical' | 'major' | 'minor';
  relatedCharacters: string[];
  consequences: string[];
}

export interface CharacterGoal {
  characterId: string;
  characterName: string;
  goal: string;
  motivation: string;
  obstacle: string;
  outcome: 'achieved' | 'failed' | 'postponed' | 'unknown';
  emotionalArc: string;
}

export interface BookStructure {
  id: string;
  title: string;
  totalWordTarget: number;
  currentWordCount: number;
  chapters: ChapterPlan[];
  acts: Act[];
  overallStructure: 'three-act' | 'four-act' | 'five-act' | 'hero-journey' | 'custom';
  genre: string[];
  themes: string[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Act {
  id: string;
  name: string;
  description: string;
  chapters: string[]; // Chapter IDs
  wordTarget: number;
  currentWordCount: number;
  purpose: string;
  keyEvents: string[];
}

export interface WritingSession {
  id: string;
  chapterId: string;
  sceneId?: string;
  startTime: Date;
  endTime?: Date;
  wordsWritten: number;
  targetMet: boolean;
  mood: 'productive' | 'struggling' | 'flowing' | 'average';
  notes: string;
}

export interface ChapterTemplate {
  id: string;
  name: string;
  description: string;
  genre: string[];
  structure: ChapterStructure;
  defaultWordTarget: number;
  scenes: Omit<ScenePlan, 'id' | 'currentWordCount' | 'status'>[];
  tags: string[];
}

// Pre-defined chapter templates
const CHAPTER_TEMPLATES: ChapterTemplate[] = [
  {
    id: 'action-chapter',
    name: 'Action Chapter',
    description: 'High-energy chapter with conflict and tension',
    genre: ['thriller', 'action', 'adventure'],
    defaultWordTarget: 3000,
    structure: {
      template: 'three-act',
      beats: [
        { id: '1', name: 'Setup', description: 'Establish situation and stakes', percentage: 25, wordTarget: 750, completed: false, notes: '' },
        { id: '2', name: 'Confrontation', description: 'Main action sequence', percentage: 50, wordTarget: 1500, completed: false, notes: '' },
        { id: '3', name: 'Resolution', description: 'Aftermath and consequences', percentage: 25, wordTarget: 750, completed: false, notes: '' }
      ],
      hooks: { opening: 'Immediate tension', midpoint: 'Major escalation', ending: 'Cliffhanger or revelation' },
      transitions: { fromPrevious: 'Building momentum', toNext: 'Sets up next conflict' }
    },
    scenes: [
      {
        title: 'Opening Tension',
        summary: 'Establish immediate conflict',
        wordTarget: 1000,
        purpose: 'rising-action',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'tense',
        pov: '',
        notes: '',
        order: 1
      },
      {
        title: 'Main Action',
        summary: 'Central action sequence',
        wordTarget: 1500,
        purpose: 'climax',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'intense',
        pov: '',
        notes: '',
        order: 2
      },
      {
        title: 'Aftermath',
        summary: 'Deal with consequences',
        wordTarget: 500,
        purpose: 'resolution',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'reflective',
        pov: '',
        notes: '',
        order: 3
      }
    ],
    tags: ['action', 'conflict', 'tension']
  },
  {
    id: 'character-development',
    name: 'Character Development',
    description: 'Focus on character growth and relationships',
    genre: ['literary', 'drama', 'romance'],
    defaultWordTarget: 2500,
    structure: {
      template: 'three-act',
      beats: [
        { id: '1', name: 'Character State', description: 'Show current character situation', percentage: 30, wordTarget: 750, completed: false, notes: '' },
        { id: '2', name: 'Challenge/Change', description: 'Character faces growth opportunity', percentage: 40, wordTarget: 1000, completed: false, notes: '' },
        { id: '3', name: 'New Understanding', description: 'Character reaches new insight', percentage: 30, wordTarget: 750, completed: false, notes: '' }
      ],
      hooks: { opening: 'Character in familiar situation', midpoint: 'Moment of realization', ending: 'Character changed' },
      transitions: { fromPrevious: 'Builds on character arc', toNext: 'Sets up future development' }
    },
    scenes: [
      {
        title: 'Character Moment',
        summary: 'Reveal character through action/dialogue',
        wordTarget: 1200,
        purpose: 'exposition',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'introspective',
        pov: '',
        notes: '',
        order: 1
      },
      {
        title: 'Growth Catalyst',
        summary: 'Event that challenges character',
        wordTarget: 800,
        purpose: 'rising-action',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'challenging',
        pov: '',
        notes: '',
        order: 2
      },
      {
        title: 'Resolution',
        summary: 'Character responds with growth',
        wordTarget: 500,
        purpose: 'resolution',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'hopeful',
        pov: '',
        notes: '',
        order: 3
      }
    ],
    tags: ['character', 'development', 'emotional']
  },
  {
    id: 'mystery-reveal',
    name: 'Mystery Reveal',
    description: 'Chapter that reveals clues or solves mysteries',
    genre: ['mystery', 'thriller', 'detective'],
    defaultWordTarget: 2800,
    structure: {
      template: 'fichtean-curve',
      beats: [
        { id: '1', name: 'Investigation', description: 'Gather clues and information', percentage: 40, wordTarget: 1120, completed: false, notes: '' },
        { id: '2', name: 'Discovery', description: 'Key clue or revelation', percentage: 30, wordTarget: 840, completed: false, notes: '' },
        { id: '3', name: 'Implications', description: 'Understand what discovery means', percentage: 30, wordTarget: 840, completed: false, notes: '' }
      ],
      hooks: { opening: 'New lead or question', midpoint: 'Major discovery', ending: 'Raises new questions' },
      transitions: { fromPrevious: 'Follows up on previous clues', toNext: 'Sets up next investigation' }
    },
    scenes: [
      {
        title: 'Investigation',
        summary: 'Search for clues',
        wordTarget: 1000,
        purpose: 'rising-action',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'curious',
        pov: '',
        notes: '',
        order: 1
      },
      {
        title: 'Discovery',
        summary: 'Find important clue',
        wordTarget: 900,
        purpose: 'climax',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'revelatory',
        pov: '',
        notes: '',
        order: 2
      },
      {
        title: 'Analysis',
        summary: 'Process the implications',
        wordTarget: 900,
        purpose: 'falling-action',
        characters: [],
        setting: '',
        conflict: '',
        outcome: '',
        mood: 'thoughtful',
        pov: '',
        notes: '',
        order: 3
      }
    ],
    tags: ['mystery', 'clues', 'revelation']
  }
];

class ChapterPlanningService {
  private static instance: ChapterPlanningService;
  private eventEmitter: BrowserEventEmitter;
  
  private bookStructures: Map<string, BookStructure> = new Map();
  private chapters: Map<string, ChapterPlan> = new Map();
  private templates: ChapterTemplate[] = [...CHAPTER_TEMPLATES];
  private writingSessions: WritingSession[] = [];
  private activeBook: string | null = null;

  private constructor() {
    this.eventEmitter = BrowserEventEmitter.getInstance();
    this.loadData();
    this.setupEventListeners();
  }

  static getInstance(): ChapterPlanningService {
    if (!ChapterPlanningService.instance) {
      ChapterPlanningService.instance = new ChapterPlanningService();
    }
    return ChapterPlanningService.instance;
  }

  // Book Structure Management
  createBookStructure(data: Omit<BookStructure, 'id' | 'currentWordCount' | 'createdAt' | 'updatedAt'>): BookStructure {
    const book: BookStructure = {
      ...data,
      id: this.generateId(),
      currentWordCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.bookStructures.set(book.id, book);
    this.activeBook = book.id;
    this.saveData();
    
    this.eventEmitter.emit('book:created', book);
    return book;
  }

  updateBookStructure(bookId: string, updates: Partial<BookStructure>): void {
    const book = this.bookStructures.get(bookId);
    if (!book) return;

    Object.assign(book, updates, { updatedAt: new Date() });
    this.saveData();
    
    this.eventEmitter.emit('book:updated', book);
  }

  setActiveBook(bookId: string): void {
    if (this.bookStructures.has(bookId)) {
      this.activeBook = bookId;
      this.saveData();
      this.eventEmitter.emit('book:activated', bookId);
    }
  }

  // Chapter Management
  createChapter(bookId: string, data: Omit<ChapterPlan, 'id' | 'currentWordCount' | 'createdAt' | 'updatedAt'>): ChapterPlan {
    const chapter: ChapterPlan = {
      ...data,
      id: this.generateId(),
      currentWordCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.chapters.set(chapter.id, chapter);

    // Add to book structure
    const book = this.bookStructures.get(bookId);
    if (book) {
      book.chapters.push(chapter);
      book.updatedAt = new Date();
      this.updateWordCounts(bookId);
    }

    this.saveData();
    this.eventEmitter.emit('chapter:created', chapter);
    return chapter;
  }

  createChapterFromTemplate(bookId: string, templateId: string, customData?: Partial<ChapterPlan>): ChapterPlan {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const book = this.bookStructures.get(bookId);
    const chapterNumber = book ? book.chapters.length + 1 : 1;

    const scenes: ScenePlan[] = template.scenes.map((sceneTemplate, index) => ({
      ...sceneTemplate,
      id: this.generateId(),
      currentWordCount: 0,
      status: 'planned' as const,
      order: index + 1
    }));

    const chapter: ChapterPlan = {
      id: this.generateId(),
      title: customData?.title || `Chapter ${chapterNumber}`,
      number: chapterNumber,
      summary: customData?.summary || '',
      wordTarget: customData?.wordTarget || template.defaultWordTarget,
      currentWordCount: 0,
      status: 'outlined',
      scenes,
      structure: { ...template.structure },
      timeline: {},
      tags: [...template.tags, ...(customData?.tags || [])],
      notes: customData?.notes || '',
      plotPoints: customData?.plotPoints || [],
      characterGoals: customData?.characterGoals || [],
      conflicts: customData?.conflicts || [],
      themes: customData?.themes || [],
      pov: customData?.pov || '',
      setting: customData?.setting || '',
      mood: customData?.mood || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...customData
    };

    this.chapters.set(chapter.id, chapter);

    // Add to book structure
    if (book) {
      book.chapters.push(chapter);
      book.updatedAt = new Date();
      this.updateWordCounts(bookId);
    }

    this.saveData();
    this.eventEmitter.emit('chapter:created', chapter);
    return chapter;
  }

  updateChapter(chapterId: string, updates: Partial<ChapterPlan>): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;

    Object.assign(chapter, updates, { updatedAt: new Date() });

    // Update word counts if currentWordCount changed
    if ('currentWordCount' in updates) {
      this.updateBookWordCounts();
    }

    this.saveData();
    this.eventEmitter.emit('chapter:updated', chapter);
  }

  deleteChapter(chapterId: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;

    this.chapters.delete(chapterId);

    // Remove from book structures
    this.bookStructures.forEach(book => {
      book.chapters = book.chapters.filter(ch => ch.id !== chapterId);
      book.updatedAt = new Date();
    });

    this.updateBookWordCounts();
    this.saveData();
    this.eventEmitter.emit('chapter:deleted', chapterId);
  }

  reorderChapters(bookId: string, chapterIds: string[]): void {
    const book = this.bookStructures.get(bookId);
    if (!book) return;

    const reorderedChapters = chapterIds.map(id => 
      book.chapters.find(ch => ch.id === id)
    ).filter(Boolean) as ChapterPlan[];

    // Update chapter numbers
    reorderedChapters.forEach((chapter, index) => {
      chapter.number = index + 1;
      chapter.updatedAt = new Date();
    });

    book.chapters = reorderedChapters;
    book.updatedAt = new Date();

    this.saveData();
    this.eventEmitter.emit('chapters:reordered', { bookId, chapters: reorderedChapters });
  }

  // Scene Management
  addScene(chapterId: string, sceneData: Omit<ScenePlan, 'id' | 'currentWordCount' | 'status'>): ScenePlan {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    const scene: ScenePlan = {
      ...sceneData,
      id: this.generateId(),
      currentWordCount: 0,
      status: 'planned',
      order: chapter.scenes.length + 1
    };

    chapter.scenes.push(scene);
    chapter.updatedAt = new Date();

    this.saveData();
    this.eventEmitter.emit('scene:added', { chapterId, scene });
    return scene;
  }

  updateScene(chapterId: string, sceneId: string, updates: Partial<ScenePlan>): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;

    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    Object.assign(scene, updates);
    chapter.updatedAt = new Date();

    // Update chapter word count if scene word count changed
    if ('currentWordCount' in updates) {
      this.updateChapterWordCount(chapterId);
    }

    this.saveData();
    this.eventEmitter.emit('scene:updated', { chapterId, scene });
  }

  deleteScene(chapterId: string, sceneId: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;

    chapter.scenes = chapter.scenes.filter(s => s.id !== sceneId);
    chapter.updatedAt = new Date();

    // Reorder remaining scenes
    chapter.scenes.forEach((scene, index) => {
      scene.order = index + 1;
    });

    this.updateChapterWordCount(chapterId);
    this.saveData();
    this.eventEmitter.emit('scene:deleted', { chapterId, sceneId });
  }

  reorderScenes(chapterId: string, sceneIds: string[]): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;

    const reorderedScenes = sceneIds.map(id => 
      chapter.scenes.find(s => s.id === id)
    ).filter(Boolean) as ScenePlan[];

    // Update scene order
    reorderedScenes.forEach((scene, index) => {
      scene.order = index + 1;
    });

    chapter.scenes = reorderedScenes;
    chapter.updatedAt = new Date();

    this.saveData();
    this.eventEmitter.emit('scenes:reordered', { chapterId, scenes: reorderedScenes });
  }

  // Progress Tracking
  updateWordCount(chapterId: string, sceneId: string | null, wordCount: number): void {
    if (sceneId) {
      this.updateScene(chapterId, sceneId, { currentWordCount: wordCount });
    } else {
      this.updateChapter(chapterId, { currentWordCount: wordCount });
    }
  }

  private updateChapterWordCount(chapterId: string): void {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return;

    const totalWords = chapter.scenes.reduce((sum, scene) => sum + scene.currentWordCount, 0);
    chapter.currentWordCount = totalWords;

    this.updateBookWordCounts();
  }

  private updateBookWordCounts(): void {
    this.bookStructures.forEach(book => {
      this.updateWordCounts(book.id);
    });
  }

  private updateWordCounts(bookId: string): void {
    const book = this.bookStructures.get(bookId);
    if (!book) return;

    const totalWords = book.chapters.reduce((sum, chapter) => sum + chapter.currentWordCount, 0);
    book.currentWordCount = totalWords;

    // Update act word counts
    book.acts.forEach(act => {
      const actChapters = book.chapters.filter(ch => act.chapters.includes(ch.id));
      act.currentWordCount = actChapters.reduce((sum, ch) => sum + ch.currentWordCount, 0);
    });

    book.updatedAt = new Date();
  }

  // Writing Sessions
  startWritingSession(chapterId: string, sceneId?: string): WritingSession {
    const session: WritingSession = {
      id: this.generateId(),
      chapterId,
      sceneId,
      startTime: new Date(),
      wordsWritten: 0,
      targetMet: false,
      mood: 'average',
      notes: ''
    };

    this.writingSessions.push(session);
    this.saveData();
    
    this.eventEmitter.emit('session:started', session);
    return session;
  }

  endWritingSession(sessionId: string, wordsWritten: number, mood: WritingSession['mood'], notes?: string): void {
    const session = this.writingSessions.find(s => s.id === sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.wordsWritten = wordsWritten;
    session.mood = mood;
    session.notes = notes || '';

    // Check if target was met
    const chapter = this.chapters.get(session.chapterId);
    if (chapter && session.sceneId) {
      const scene = chapter.scenes.find(s => s.id === session.sceneId);
      session.targetMet = scene ? wordsWritten >= scene.wordTarget : false;
    } else if (chapter) {
      session.targetMet = wordsWritten >= chapter.wordTarget;
    }

    this.saveData();
    this.eventEmitter.emit('session:ended', session);
  }

  // Analytics
  getChapterProgress(chapterId: string): number {
    const chapter = this.chapters.get(chapterId);
    if (!chapter || chapter.wordTarget === 0) return 0;
    
    return Math.min((chapter.currentWordCount / chapter.wordTarget) * 100, 100);
  }

  getBookProgress(bookId: string): number {
    const book = this.bookStructures.get(bookId);
    if (!book || book.totalWordTarget === 0) return 0;
    
    return Math.min((book.currentWordCount / book.totalWordTarget) * 100, 100);
  }

  getChapterStats(chapterId: string) {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) return null;

    const sessions = this.writingSessions.filter(s => s.chapterId === chapterId);
    const totalSessionTime = sessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + (session.endTime.getTime() - session.startTime.getTime());
      }
      return sum;
    }, 0);

    return {
      progress: this.getChapterProgress(chapterId),
      sessionsCount: sessions.length,
      totalWritingTime: totalSessionTime,
      averageWordsPerSession: sessions.length > 0 ? 
        sessions.reduce((sum, s) => sum + s.wordsWritten, 0) / sessions.length : 0,
      completedScenes: chapter.scenes.filter(s => s.status === 'completed').length,
      totalScenes: chapter.scenes.length
    };
  }

  // Template Management
  createCustomTemplate(template: Omit<ChapterTemplate, 'id'>): ChapterTemplate {
    const newTemplate: ChapterTemplate = {
      ...template,
      id: this.generateId()
    };

    this.templates.push(newTemplate);
    this.saveData();
    
    this.eventEmitter.emit('template:created', newTemplate);
    return newTemplate;
  }

  getTemplates(): ChapterTemplate[] {
    return this.templates;
  }

  getTemplatesByGenre(genre: string): ChapterTemplate[] {
    return this.templates.filter(t => t.genre.includes(genre));
  }

  // Event Listeners
  private setupEventListeners(): void {
    // Listen for word count updates from editor
    this.eventEmitter.on('editor:wordcount', ({ chapterId, sceneId, count }) => {
      if (chapterId) {
        this.updateWordCount(chapterId, sceneId, count);
      }
    });

    // Listen for chapter status changes
    this.eventEmitter.on('chapter:status-change', ({ chapterId, status }) => {
      this.updateChapter(chapterId, { status });
    });
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Data Persistence
  private saveData(): void {
    const data = {
      bookStructures: Array.from(this.bookStructures.entries()),
      chapters: Array.from(this.chapters.entries()),
      templates: this.templates.filter(t => !CHAPTER_TEMPLATES.find(ct => ct.id === t.id)), // Only save custom templates
      writingSessions: this.writingSessions,
      activeBook: this.activeBook
    };
    localStorage.setItem('chapterPlanning', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('chapterPlanning');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.bookStructures) {
          this.bookStructures = new Map(data.bookStructures);
        }
        if (data.chapters) {
          this.chapters = new Map(data.chapters);
        }
        if (data.templates) {
          this.templates = [...CHAPTER_TEMPLATES, ...data.templates];
        }
        if (data.writingSessions) {
          this.writingSessions = data.writingSessions;
        }
        if (data.activeBook) {
          this.activeBook = data.activeBook;
        }
      } catch (error) {
        console.error('Failed to load chapter planning data:', error);
      }
    }
  }

  // Public API
  getAllBooks(): BookStructure[] {
    return Array.from(this.bookStructures.values());
  }

  getBook(bookId: string): BookStructure | undefined {
    return this.bookStructures.get(bookId);
  }

  getActiveBook(): BookStructure | null {
    return this.activeBook ? this.bookStructures.get(this.activeBook) || null : null;
  }

  getChapter(chapterId: string): ChapterPlan | undefined {
    return this.chapters.get(chapterId);
  }

  getChaptersByBook(bookId: string): ChapterPlan[] {
    const book = this.bookStructures.get(bookId);
    return book ? book.chapters : [];
  }

  getWritingSessions(chapterId?: string): WritingSession[] {
    return chapterId 
      ? this.writingSessions.filter(s => s.chapterId === chapterId)
      : this.writingSessions;
  }

  cleanup(): void {
    // Clean up any active sessions
    const activeSessions = this.writingSessions.filter(s => !s.endTime);
    activeSessions.forEach(session => {
      this.endWritingSession(session.id, 0, 'average', 'Session ended automatically');
    });
  }
}

export default new ChapterPlanningService();

export const chapterPlanningService = ChapterPlanningService.getInstance();