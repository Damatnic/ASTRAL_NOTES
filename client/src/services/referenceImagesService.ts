/**
 * Reference Images and Mood Boards Service
 * Visual inspiration and reference management for writers
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface ReferenceImage {
  id: string;
  url: string;
  title: string;
  description?: string;
  source?: string;
  tags: string[];
  category: 'character' | 'location' | 'object' | 'mood' | 'style' | 'inspiration' | 'other';
  uploadDate: Date;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface MoodBoard {
  id: string;
  title: string;
  description?: string;
  theme: string;
  color: string;
  images: ReferenceImage[];
  layout: 'grid' | 'masonry' | 'collage' | 'timeline';
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  collaborators?: string[];
  linkedElements?: {
    type: 'character' | 'location' | 'scene' | 'chapter';
    id: string;
    name: string;
  }[];
}

export interface ImageCollection {
  id: string;
  name: string;
  description?: string;
  images: ReferenceImage[];
  type: 'project' | 'personal' | 'shared';
  createdAt: Date;
  tags: string[];
}

export interface ImageAnalysis {
  dominantColors: string[];
  mood: 'bright' | 'dark' | 'warm' | 'cool' | 'neutral';
  style: 'realistic' | 'artistic' | 'abstract' | 'cartoon' | 'photographic';
  composition: 'portrait' | 'landscape' | 'square' | 'panoramic';
  subjects: string[];
  aiTags: string[];
  emotionalTone: string[];
}

export interface InspirationPrompt {
  id: string;
  text: string;
  imageId: string;
  category: 'character' | 'setting' | 'plot' | 'dialogue' | 'scene';
  generatedAt: Date;
  used: boolean;
}

class ReferenceImagesService {
  private static instance: ReferenceImagesService;
  private eventEmitter: BrowserEventEmitter;
  
  private images: Map<string, ReferenceImage> = new Map();
  private moodBoards: Map<string, MoodBoard> = new Map();
  private collections: Map<string, ImageCollection> = new Map();
  private inspirationPrompts: InspirationPrompt[] = [];
  private searchFilters: {
    category?: ReferenceImage['category'];
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    searchText?: string;
  } = {};

  private constructor() {
    this.eventEmitter = BrowserEventEmitter.getInstance();
    this.loadData();
    this.initializeDefaultCollections();
  }

  static getInstance(): ReferenceImagesService {
    if (!ReferenceImagesService.instance) {
      ReferenceImagesService.instance = new ReferenceImagesService();
    }
    return ReferenceImagesService.instance;
  }

  // Image Management
  async addImage(file: File, metadata?: Partial<ReferenceImage>): Promise<ReferenceImage> {
    const imageUrl = await this.processImageFile(file);
    
    const image: ReferenceImage = {
      id: this.generateId(),
      url: imageUrl,
      title: metadata?.title || file.name,
      description: metadata?.description,
      source: metadata?.source,
      tags: metadata?.tags || [],
      category: metadata?.category || 'other',
      uploadDate: new Date(),
      fileSize: file.size,
      dimensions: await this.getImageDimensions(imageUrl),
      metadata: metadata?.metadata
    };

    this.images.set(image.id, image);
    this.saveData();
    
    // Generate AI analysis and tags
    this.analyzeImage(image);
    
    this.eventEmitter.emit('image:added', image);
    return image;
  }

  async addImageFromUrl(url: string, metadata?: Partial<ReferenceImage>): Promise<ReferenceImage> {
    const image: ReferenceImage = {
      id: this.generateId(),
      url,
      title: metadata?.title || 'Untitled Image',
      description: metadata?.description,
      source: metadata?.source,
      tags: metadata?.tags || [],
      category: metadata?.category || 'other',
      uploadDate: new Date(),
      dimensions: await this.getImageDimensions(url),
      metadata: metadata?.metadata
    };

    this.images.set(image.id, image);
    this.saveData();
    
    this.analyzeImage(image);
    
    this.eventEmitter.emit('image:added', image);
    return image;
  }

  updateImage(imageId: string, updates: Partial<ReferenceImage>): void {
    const image = this.images.get(imageId);
    if (!image) return;

    Object.assign(image, updates);
    this.saveData();
    
    this.eventEmitter.emit('image:updated', image);
  }

  removeImage(imageId: string): void {
    const image = this.images.get(imageId);
    if (!image) return;

    this.images.delete(imageId);
    
    // Remove from mood boards
    this.moodBoards.forEach(board => {
      board.images = board.images.filter(img => img.id !== imageId);
      board.updatedAt = new Date();
    });
    
    // Remove from collections
    this.collections.forEach(collection => {
      collection.images = collection.images.filter(img => img.id !== imageId);
    });
    
    this.saveData();
    this.eventEmitter.emit('image:removed', imageId);
  }

  // Mood Board Management
  createMoodBoard(data: Omit<MoodBoard, 'id' | 'createdAt' | 'updatedAt'>): MoodBoard {
    const moodBoard: MoodBoard = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.moodBoards.set(moodBoard.id, moodBoard);
    this.saveData();
    
    this.eventEmitter.emit('moodboard:created', moodBoard);
    return moodBoard;
  }

  updateMoodBoard(boardId: string, updates: Partial<MoodBoard>): void {
    const board = this.moodBoards.get(boardId);
    if (!board) return;

    Object.assign(board, updates, { updatedAt: new Date() });
    this.saveData();
    
    this.eventEmitter.emit('moodboard:updated', board);
  }

  addImageToMoodBoard(boardId: string, imageId: string): void {
    const board = this.moodBoards.get(boardId);
    const image = this.images.get(imageId);
    
    if (!board || !image) return;
    
    if (!board.images.some(img => img.id === imageId)) {
      board.images.push(image);
      board.updatedAt = new Date();
      this.saveData();
      
      this.eventEmitter.emit('moodboard:image-added', { board, image });
    }
  }

  removeImageFromMoodBoard(boardId: string, imageId: string): void {
    const board = this.moodBoards.get(boardId);
    if (!board) return;

    board.images = board.images.filter(img => img.id !== imageId);
    board.updatedAt = new Date();
    this.saveData();
    
    this.eventEmitter.emit('moodboard:image-removed', { boardId, imageId });
  }

  duplicateMoodBoard(boardId: string): MoodBoard | null {
    const original = this.moodBoards.get(boardId);
    if (!original) return null;

    const duplicate: MoodBoard = {
      ...original,
      id: this.generateId(),
      title: `${original.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.moodBoards.set(duplicate.id, duplicate);
    this.saveData();
    
    this.eventEmitter.emit('moodboard:created', duplicate);
    return duplicate;
  }

  // Collection Management
  createCollection(data: Omit<ImageCollection, 'id' | 'createdAt'>): ImageCollection {
    const collection: ImageCollection = {
      ...data,
      id: this.generateId(),
      createdAt: new Date()
    };

    this.collections.set(collection.id, collection);
    this.saveData();
    
    this.eventEmitter.emit('collection:created', collection);
    return collection;
  }

  addImageToCollection(collectionId: string, imageId: string): void {
    const collection = this.collections.get(collectionId);
    const image = this.images.get(imageId);
    
    if (!collection || !image) return;
    
    if (!collection.images.some(img => img.id === imageId)) {
      collection.images.push(image);
      this.saveData();
      
      this.eventEmitter.emit('collection:image-added', { collection, image });
    }
  }

  // Search and Filter
  searchImages(query: string, filters?: typeof this.searchFilters): ReferenceImage[] {
    const allImages = Array.from(this.images.values());
    
    return allImages.filter(image => {
      // Text search
      if (query) {
        const searchableText = [
          image.title,
          image.description,
          image.source,
          ...image.tags
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(query.toLowerCase())) {
          return false;
        }
      }
      
      // Category filter
      if (filters?.category && image.category !== filters.category) {
        return false;
      }
      
      // Tags filter
      if (filters?.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tag => image.tags.includes(tag))) {
          return false;
        }
      }
      
      // Date range filter
      if (filters?.dateRange) {
        const imageDate = new Date(image.uploadDate);
        if (imageDate < filters.dateRange.start || imageDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }

  getImagesByCategory(category: ReferenceImage['category']): ReferenceImage[] {
    return Array.from(this.images.values()).filter(img => img.category === category);
  }

  getImagesByTags(tags: string[]): ReferenceImage[] {
    return Array.from(this.images.values()).filter(img => 
      tags.some(tag => img.tags.includes(tag))
    );
  }

  // AI Analysis and Inspiration
  private async analyzeImage(image: ReferenceImage): Promise<void> {
    // Simulate AI analysis - in production, use actual AI service
    const analysis: ImageAnalysis = {
      dominantColors: this.extractDominantColors(image.url),
      mood: this.analyzeMood(image.url),
      style: this.analyzeStyle(image.url),
      composition: this.analyzeComposition(image.dimensions),
      subjects: this.detectSubjects(image.url),
      aiTags: this.generateAITags(image),
      emotionalTone: this.analyzeEmotionalTone(image.url)
    };

    // Add AI tags to image
    const aiTags = analysis.aiTags.filter(tag => !image.tags.includes(tag));
    image.tags.push(...aiTags);
    
    // Store analysis in metadata
    image.metadata = { ...image.metadata, analysis };
    
    this.saveData();
    this.eventEmitter.emit('image:analyzed', { image, analysis });
  }

  generateInspirationPrompts(imageId: string, count: number = 3): InspirationPrompt[] {
    const image = this.images.get(imageId);
    if (!image) return [];

    const prompts: InspirationPrompt[] = [];
    const categories: InspirationPrompt['category'][] = ['character', 'setting', 'plot', 'dialogue', 'scene'];

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const prompt: InspirationPrompt = {
        id: this.generateId(),
        text: this.generatePromptText(image, category),
        imageId,
        category,
        generatedAt: new Date(),
        used: false
      };
      
      prompts.push(prompt);
      this.inspirationPrompts.push(prompt);
    }

    this.saveData();
    this.eventEmitter.emit('prompts:generated', prompts);
    return prompts;
  }

  private generatePromptText(image: ReferenceImage, category: InspirationPrompt['category']): string {
    const templates = {
      character: [
        `Describe a character who would feel at home in this image.`,
        `What kind of person would be drawn to this place/object?`,
        `Create a character whose personality matches the mood of this image.`
      ],
      setting: [
        `Use this image as inspiration for a key location in your story.`,
        `Describe how this place might smell, sound, and feel.`,
        `What important event could happen in this setting?`
      ],
      plot: [
        `What conflict could arise in this setting?`,
        `How could this image represent a turning point in your story?`,
        `What mystery or secret might be hidden here?`
      ],
      dialogue: [
        `Write a conversation that could take place in this setting.`,
        `What would two characters argue about here?`,
        `Create dialogue that captures the mood of this image.`
      ],
      scene: [
        `Write a scene that begins with this image.`,
        `How would your protagonist react to seeing this?`,
        `Describe this moment from multiple perspectives.`
      ]
    };

    const categoryTemplates = templates[category];
    return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  }

  // Color Analysis
  getColorPalette(imageId: string): string[] {
    const image = this.images.get(imageId);
    if (!image) return [];

    return this.extractDominantColors(image.url);
  }

  findImagesByColor(color: string, tolerance: number = 30): ReferenceImage[] {
    return Array.from(this.images.values()).filter(image => {
      if (!image.metadata?.analysis?.dominantColors) return false;
      
      return image.metadata.analysis.dominantColors.some(imageColor => 
        this.colorDistance(color, imageColor) <= tolerance
      );
    });
  }

  // Mock AI Analysis Methods
  private extractDominantColors(imageUrl: string): string[] {
    // Mock implementation - in production, use image analysis library
    const mockColors = [
      ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      ['#96CEB4', '#FECA57', '#FF9FF3'],
      ['#54A0FF', '#5F27CD', '#00D2D3'],
      ['#FF9F43', '#EE5A24', '#0ABDE3'],
      ['#10AC84', '#EE5A24', '#5F27CD']
    ];
    
    return mockColors[Math.floor(Math.random() * mockColors.length)];
  }

  private analyzeMood(imageUrl: string): ImageAnalysis['mood'] {
    const moods: ImageAnalysis['mood'][] = ['bright', 'dark', 'warm', 'cool', 'neutral'];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  private analyzeStyle(imageUrl: string): ImageAnalysis['style'] {
    const styles: ImageAnalysis['style'][] = ['realistic', 'artistic', 'abstract', 'cartoon', 'photographic'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private analyzeComposition(dimensions?: { width: number; height: number }): ImageAnalysis['composition'] {
    if (!dimensions) return 'square';
    
    const ratio = dimensions.width / dimensions.height;
    
    if (ratio > 1.5) return 'panoramic';
    if (ratio > 1.1) return 'landscape';
    if (ratio < 0.9) return 'portrait';
    return 'square';
  }

  private detectSubjects(imageUrl: string): string[] {
    // Mock implementation
    const subjects = [
      ['person', 'building', 'sky'],
      ['landscape', 'mountains', 'trees'],
      ['object', 'interior', 'furniture'],
      ['nature', 'water', 'wildlife'],
      ['architecture', 'urban', 'street']
    ];
    
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  private generateAITags(image: ReferenceImage): string[] {
    // Mock implementation
    const baseTags = [
      'inspiration', 'reference', 'visual', 'mood', 'atmosphere',
      'color', 'composition', 'style', 'texture', 'lighting'
    ];
    
    return baseTags.slice(0, Math.floor(Math.random() * 5) + 2);
  }

  private analyzeEmotionalTone(imageUrl: string): string[] {
    const tones = [
      ['peaceful', 'serene', 'calm'],
      ['dramatic', 'intense', 'bold'],
      ['mysterious', 'dark', 'enigmatic'],
      ['joyful', 'bright', 'energetic'],
      ['melancholic', 'nostalgic', 'reflective']
    ];
    
    return tones[Math.floor(Math.random() * tones.length)];
  }

  private colorDistance(color1: string, color2: string): number {
    // Simple color distance calculation
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
  }

  // File Processing
  private async processImageFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  private async getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }

  // Data Management
  private initializeDefaultCollections(): void {
    if (this.collections.size === 0) {
      const defaultCollections = [
        { name: 'Characters', type: 'project' as const, tags: ['character', 'people'] },
        { name: 'Locations', type: 'project' as const, tags: ['location', 'setting'] },
        { name: 'Inspiration', type: 'personal' as const, tags: ['inspiration', 'mood'] }
      ];

      defaultCollections.forEach(data => {
        this.createCollection({
          ...data,
          description: `Default collection for ${data.name.toLowerCase()}`,
          images: []
        });
      });
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Data Persistence
  private saveData(): void {
    const data = {
      images: Array.from(this.images.entries()),
      moodBoards: Array.from(this.moodBoards.entries()),
      collections: Array.from(this.collections.entries()),
      inspirationPrompts: this.inspirationPrompts,
      searchFilters: this.searchFilters
    };
    localStorage.setItem('referenceImages', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('referenceImages');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.images) {
          this.images = new Map(data.images);
        }
        if (data.moodBoards) {
          this.moodBoards = new Map(data.moodBoards);
        }
        if (data.collections) {
          this.collections = new Map(data.collections);
        }
        if (data.inspirationPrompts) {
          this.inspirationPrompts = data.inspirationPrompts;
        }
        if (data.searchFilters) {
          this.searchFilters = data.searchFilters;
        }
      } catch (error) {
        console.error('Failed to load reference images data:', error);
      }
    }
  }

  // Public API
  getAllImages(): ReferenceImage[] {
    return Array.from(this.images.values());
  }

  getImage(id: string): ReferenceImage | undefined {
    return this.images.get(id);
  }

  getAllMoodBoards(): MoodBoard[] {
    return Array.from(this.moodBoards.values());
  }

  getMoodBoard(id: string): MoodBoard | undefined {
    return this.moodBoards.get(id);
  }

  getAllCollections(): ImageCollection[] {
    return Array.from(this.collections.values());
  }

  getCollection(id: string): ImageCollection | undefined {
    return this.collections.get(id);
  }

  getInspirationPrompts(): InspirationPrompt[] {
    return this.inspirationPrompts;
  }

  getUnusedPrompts(): InspirationPrompt[] {
    return this.inspirationPrompts.filter(p => !p.used);
  }

  markPromptAsUsed(promptId: string): void {
    const prompt = this.inspirationPrompts.find(p => p.id === promptId);
    if (prompt) {
      prompt.used = true;
      this.saveData();
    }
  }

  cleanup(): void {
    // Clean up any resources
  }
}

export default new ReferenceImagesService();

export const referenceImagesService = ReferenceImagesService.getInstance();