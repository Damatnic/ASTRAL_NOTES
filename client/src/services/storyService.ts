/**
 * Story Service
 * Manages stories within projects, including scenes, chapters, and acts
 */

import type { Story, Scene, Chapter, Act } from '@/types/story';
import { storageService } from './storageService';

export interface CreateStoryData {
  projectId: string;
  title: string;
  description?: string;
  targetWordCount?: number;
  order?: number;
}

export interface UpdateStoryData {
  title?: string;
  description?: string;
  status?: Story['status'];
  targetWordCount?: number;
  order?: number;
}

export interface CreateChapterData {
  storyId: string;
  actId?: string;
  title: string;
  description?: string;
  targetWordCount?: number;
  order?: number;
}

export interface CreateActData {
  storyId: string;
  title: string;
  description?: string;
  order?: number;
  purpose?: string;
  targetWordCount?: number;
}

export interface CreateSceneData {
  storyId: string;
  chapterId?: string;
  actId?: string;
  title: string;
  content?: string;
  summary?: string;
  povCharacter?: string;
  location?: string;
  timeOfDay?: Scene['timeOfDay'];
  duration?: number;
  characters?: string[];
  locations?: string[];
  items?: string[];
  plotThreads?: string[];
  order?: number;
}

class StoryService {
  private static instance: StoryService;

  public static getInstance(): StoryService {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  // Story Management

  /**
   * Get all stories for a project
   */
  public getProjectStories(projectId: string): Story[] {
    const stories = JSON.parse(localStorage.getItem(`stories_${projectId}`) || '[]');
    return stories.sort((a: Story, b: Story) => a.order - b.order);
  }

  /**
   * Get story by ID
   */
  public getStoryById(storyId: string, projectId: string): Story | null {
    const stories = this.getProjectStories(projectId);
    return stories.find(s => s.id === storyId) || null;
  }

  /**
   * Create a new story
   */
  public createStory(data: CreateStoryData): Story {
    const now = new Date().toISOString();
    const existingStories = this.getProjectStories(data.projectId);
    const maxOrder = Math.max(...existingStories.map(s => s.order), 0);

    const story: Story = {
      id: this.generateId('story'),
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      status: 'planning',
      order: data.order ?? maxOrder + 1,
      scenes: [],
      storyNotes: [],
      timeline: {
        id: this.generateId('timeline'),
        storyId: '',
        name: `${data.title} Timeline`,
        type: 'story',
        events: [],
        scale: 'scenes',
        createdAt: now,
        updatedAt: now
      },
      wordCount: 0,
      targetWordCount: data.targetWordCount,
      estimatedReadTime: 0,
      acts: [],
      chapters: [],
      createdAt: now,
      updatedAt: now
    };

    // Set the timeline's storyId
    story.timeline.storyId = story.id;

    const stories = [...existingStories, story];
    this.saveProjectStories(data.projectId, stories);

    return story;
  }

  /**
   * Update an existing story
   */
  public updateStory(projectId: string, storyId: string, data: UpdateStoryData): Story | null {
    const stories = this.getProjectStories(projectId);
    const index = stories.findIndex(s => s.id === storyId);
    
    if (index === -1) {
      return null;
    }

    const updated: Story = {
      ...stories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    stories[index] = updated;
    this.saveProjectStories(projectId, stories);

    return updated;
  }

  /**
   * Delete a story
   */
  public deleteStory(projectId: string, storyId: string): boolean {
    const stories = this.getProjectStories(projectId);
    const filteredStories = stories.filter(s => s.id !== storyId);
    
    if (filteredStories.length === stories.length) {
      return false; // Story not found
    }

    this.saveProjectStories(projectId, filteredStories);

    // Clean up related data
    this.deleteStoryChapters(projectId, storyId);
    this.deleteStoryActs(projectId, storyId);
    this.deleteStoryScenes(projectId, storyId);

    return true;
  }

  /**
   * Reorder stories
   */
  public reorderStories(projectId: string, storyIds: string[]): boolean {
    const stories = this.getProjectStories(projectId);
    
    const reorderedStories = storyIds.map((id, index) => {
      const story = stories.find(s => s.id === id);
      if (!story) return null;
      
      return {
        ...story,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      };
    }).filter(Boolean) as Story[];

    // Add any stories that weren't in the reorder list
    const remainingStories = stories.filter(s => !storyIds.includes(s.id));
    const allStories = [...reorderedStories, ...remainingStories];

    return this.saveProjectStories(projectId, allStories);
  }

  // Chapter Management

  /**
   * Get chapters for a story
   */
  public getStoryChapters(projectId: string, storyId: string): Chapter[] {
    const chapters = JSON.parse(localStorage.getItem(`chapters_${projectId}_${storyId}`) || '[]');
    return chapters.sort((a: Chapter, b: Chapter) => a.order - b.order);
  }

  /**
   * Create a new chapter
   */
  public createChapter(projectId: string, data: CreateChapterData): Chapter {
    const now = new Date().toISOString();
    const existingChapters = this.getStoryChapters(projectId, data.storyId);
    const maxOrder = Math.max(...existingChapters.map(c => c.order), 0);

    const chapter: Chapter = {
      id: this.generateId('chapter'),
      storyId: data.storyId,
      actId: data.actId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      order: data.order ?? maxOrder + 1,
      scenes: [],
      wordCount: 0,
      targetWordCount: data.targetWordCount,
      status: 'planned',
      createdAt: now,
      updatedAt: now
    };

    const chapters = [...existingChapters, chapter];
    this.saveStoryChapters(projectId, data.storyId, chapters);

    return chapter;
  }

  /**
   * Update a chapter
   */
  public updateChapter(projectId: string, storyId: string, chapterId: string, data: Partial<Chapter>): Chapter | null {
    const chapters = this.getStoryChapters(projectId, storyId);
    const index = chapters.findIndex(c => c.id === chapterId);
    
    if (index === -1) {
      return null;
    }

    const updated: Chapter = {
      ...chapters[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    chapters[index] = updated;
    this.saveStoryChapters(projectId, storyId, chapters);

    return updated;
  }

  /**
   * Delete a chapter
   */
  public deleteChapter(projectId: string, storyId: string, chapterId: string): boolean {
    const chapters = this.getStoryChapters(projectId, storyId);
    const filteredChapters = chapters.filter(c => c.id !== chapterId);
    
    if (filteredChapters.length === chapters.length) {
      return false;
    }

    this.saveStoryChapters(projectId, storyId, filteredChapters);
    return true;
  }

  // Act Management

  /**
   * Get acts for a story
   */
  public getStoryActs(projectId: string, storyId: string): Act[] {
    const acts = JSON.parse(localStorage.getItem(`acts_${projectId}_${storyId}`) || '[]');
    return acts.sort((a: Act, b: Act) => a.order - b.order);
  }

  /**
   * Create a new act
   */
  public createAct(projectId: string, data: CreateActData): Act {
    const now = new Date().toISOString();
    const existingActs = this.getStoryActs(projectId, data.storyId);
    const maxOrder = Math.max(...existingActs.map(a => a.order), 0);

    const act: Act = {
      id: this.generateId('act'),
      storyId: data.storyId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      order: data.order ?? maxOrder + 1,
      chapters: [],
      scenes: [],
      targetWordCount: data.targetWordCount,
      purpose: data.purpose
    };

    const acts = [...existingActs, act];
    this.saveStoryActs(projectId, data.storyId, acts);

    return act;
  }

  // Scene Management

  /**
   * Get scenes for a story
   */
  public getStoryScenes(projectId: string, storyId: string): Scene[] {
    const scenes = JSON.parse(localStorage.getItem(`scenes_${projectId}_${storyId}`) || '[]');
    return scenes.sort((a: Scene, b: Scene) => a.order - b.order);
  }

  /**
   * Create a new scene
   */
  public createScene(projectId: string, data: CreateSceneData): Scene {
    const now = new Date().toISOString();
    const existingScenes = this.getStoryScenes(projectId, data.storyId);
    const maxOrder = Math.max(...existingScenes.map(s => s.order), 0);

    const scene: Scene = {
      id: this.generateId('scene'),
      storyId: data.storyId,
      chapterId: data.chapterId,
      actId: data.actId,
      title: data.title.trim(),
      content: data.content || '',
      summary: data.summary,
      povCharacter: data.povCharacter,
      location: data.location,
      timeOfDay: data.timeOfDay,
      duration: data.duration,
      characters: data.characters || [],
      locations: data.locations || [],
      items: data.items || [],
      plotThreads: data.plotThreads || [],
      order: data.order ?? maxOrder + 1,
      dependencies: [],
      conflicts: [],
      status: 'planned',
      notes: '',
      tags: [],
      wordCount: this.calculateWordCount(data.content || ''),
      estimatedReadTime: this.calculateReadTime(data.content || ''),
      createdAt: now,
      updatedAt: now
    };

    const scenes = [...existingScenes, scene];
    this.saveStoryScenes(projectId, data.storyId, scenes);

    // Update story word count
    this.updateStoryWordCount(projectId, data.storyId);

    return scene;
  }

  /**
   * Update a scene
   */
  public updateScene(projectId: string, storyId: string, sceneId: string, data: Partial<Scene>): Scene | null {
    const scenes = this.getStoryScenes(projectId, storyId);
    const index = scenes.findIndex(s => s.id === sceneId);
    
    if (index === -1) {
      return null;
    }

    const updated: Scene = {
      ...scenes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate word count if content changed
    if (data.content !== undefined) {
      updated.wordCount = this.calculateWordCount(data.content);
      updated.estimatedReadTime = this.calculateReadTime(data.content);
    }

    scenes[index] = updated;
    this.saveStoryScenes(projectId, storyId, scenes);

    // Update story word count
    this.updateStoryWordCount(projectId, storyId);

    return updated;
  }

  /**
   * Delete a scene
   */
  public deleteScene(projectId: string, storyId: string, sceneId: string): boolean {
    const scenes = this.getStoryScenes(projectId, storyId);
    const filteredScenes = scenes.filter(s => s.id !== sceneId);
    
    if (filteredScenes.length === scenes.length) {
      return false;
    }

    this.saveStoryScenes(projectId, storyId, filteredScenes);

    // Update story word count
    this.updateStoryWordCount(projectId, storyId);

    return true;
  }

  /**
   * Reorder scenes
   */
  public reorderScenes(projectId: string, storyId: string, sceneIds: string[]): boolean {
    const scenes = this.getStoryScenes(projectId, storyId);
    
    const reorderedScenes = sceneIds.map((id, index) => {
      const scene = scenes.find(s => s.id === id);
      if (!scene) return null;
      
      return {
        ...scene,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      };
    }).filter(Boolean) as Scene[];

    // Add any scenes that weren't in the reorder list
    const remainingScenes = scenes.filter(s => !sceneIds.includes(s.id));
    const allScenes = [...reorderedScenes, ...remainingScenes];

    return this.saveStoryScenes(projectId, storyId, allScenes);
  }

  // Statistics and Analytics

  /**
   * Get story statistics
   */
  public getStoryStats(projectId: string, storyId: string): {
    totalScenes: number;
    totalChapters: number;
    totalActs: number;
    wordCount: number;
    targetWordCount?: number;
    estimatedReadTime: number;
    scenesByStatus: Record<Scene['status'], number>;
    averageSceneLength: number;
  } {
    const scenes = this.getStoryScenes(projectId, storyId);
    const chapters = this.getStoryChapters(projectId, storyId);
    const acts = this.getStoryActs(projectId, storyId);
    
    const totalWordCount = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
    const totalReadTime = scenes.reduce((sum, scene) => sum + scene.estimatedReadTime, 0);
    
    const scenesByStatus = scenes.reduce((acc, scene) => {
      acc[scene.status] = (acc[scene.status] || 0) + 1;
      return acc;
    }, {} as Record<Scene['status'], number>);

    const story = this.getStoryById(storyId, projectId);

    return {
      totalScenes: scenes.length,
      totalChapters: chapters.length,
      totalActs: acts.length,
      wordCount: totalWordCount,
      targetWordCount: story?.targetWordCount,
      estimatedReadTime: totalReadTime,
      scenesByStatus,
      averageSceneLength: scenes.length > 0 ? Math.round(totalWordCount / scenes.length) : 0
    };
  }

  /**
   * Get project story statistics
   */
  public getProjectStoryStats(projectId: string): {
    totalStories: number;
    totalScenes: number;
    totalWordCount: number;
    storiesByStatus: Record<Story['status'], number>;
  } {
    const stories = this.getProjectStories(projectId);
    
    let totalScenes = 0;
    let totalWordCount = 0;
    
    const storiesByStatus = stories.reduce((acc, story) => {
      acc[story.status] = (acc[story.status] || 0) + 1;
      
      // Add scene counts and word counts
      const scenes = this.getStoryScenes(projectId, story.id);
      totalScenes += scenes.length;
      totalWordCount += scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
      
      return acc;
    }, {} as Record<Story['status'], number>);

    return {
      totalStories: stories.length,
      totalScenes,
      totalWordCount,
      storiesByStatus
    };
  }

  // Private helper methods

  private updateStoryWordCount(projectId: string, storyId: string): void {
    const scenes = this.getStoryScenes(projectId, storyId);
    const totalWordCount = scenes.reduce((sum, scene) => sum + scene.wordCount, 0);
    const estimatedReadTime = scenes.reduce((sum, scene) => sum + scene.estimatedReadTime, 0);

    const stories = this.getProjectStories(projectId);
    const storyIndex = stories.findIndex(s => s.id === storyId);
    
    if (storyIndex !== -1) {
      stories[storyIndex] = {
        ...stories[storyIndex],
        wordCount: totalWordCount,
        estimatedReadTime,
        updatedAt: new Date().toISOString()
      };
      
      this.saveProjectStories(projectId, stories);
    }
  }

  private calculateWordCount(content: string): number {
    if (!content.trim()) return 0;
    
    const cleanText = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanText) return 0;
    
    return cleanText.split(' ').length;
  }

  private calculateReadTime(content: string, wordsPerMinute: number = 250): number {
    const wordCount = this.calculateWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods

  private saveProjectStories(projectId: string, stories: Story[]): boolean {
    try {
      localStorage.setItem(`stories_${projectId}`, JSON.stringify(stories));
      return true;
    } catch (error) {
      console.error('Failed to save stories:', error);
      return false;
    }
  }

  private saveStoryChapters(projectId: string, storyId: string, chapters: Chapter[]): boolean {
    try {
      localStorage.setItem(`chapters_${projectId}_${storyId}`, JSON.stringify(chapters));
      return true;
    } catch (error) {
      console.error('Failed to save chapters:', error);
      return false;
    }
  }

  private saveStoryActs(projectId: string, storyId: string, acts: Act[]): boolean {
    try {
      localStorage.setItem(`acts_${projectId}_${storyId}`, JSON.stringify(acts));
      return true;
    } catch (error) {
      console.error('Failed to save acts:', error);
      return false;
    }
  }

  private saveStoryScenes(projectId: string, storyId: string, scenes: Scene[]): boolean {
    try {
      localStorage.setItem(`scenes_${projectId}_${storyId}`, JSON.stringify(scenes));
      return true;
    } catch (error) {
      console.error('Failed to save scenes:', error);
      return false;
    }
  }

  // Cleanup methods

  private deleteStoryChapters(projectId: string, storyId: string): void {
    localStorage.removeItem(`chapters_${projectId}_${storyId}`);
  }

  private deleteStoryActs(projectId: string, storyId: string): void {
    localStorage.removeItem(`acts_${projectId}_${storyId}`);
  }

  private deleteStoryScenes(projectId: string, storyId: string): void {
    localStorage.removeItem(`scenes_${projectId}_${storyId}`);
  }
}

export const storyService = StoryService.getInstance();