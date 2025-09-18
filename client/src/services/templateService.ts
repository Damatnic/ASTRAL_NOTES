/**
 * Novel Templates Service
 * Manages novel templates, project structures, and genre-specific frameworks
 */

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  type: 'chapter' | 'scene' | 'act' | 'part' | 'section' | 'note';
  order: number;
  content?: string;
  isRequired: boolean;
  estimatedWordCount?: number;
  metadata?: {
    pointOfView?: string;
    characters?: string[];
    location?: string;
    timeframe?: string;
    purpose?: string;
    tone?: string;
  };
}

export interface NovelTemplate {
  id: string;
  title: string;
  description: string;
  author?: string;
  genre: string[];
  subgenre?: string[];
  structure: 'three-act' | 'five-act' | 'hero-journey' | 'save-the-cat' | 'snowflake' | 'custom';
  targetWordCount: number;
  estimatedDuration: string; // e.g., "3-6 months"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  sections: TemplateSection[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  rating?: number;
  downloads?: number;
  metadata?: {
    characterArcTemplates?: Array<{
      name: string;
      description: string;
      arc: string[];
    }>;
    plotThreads?: Array<{
      name: string;
      description: string;
      beats: string[];
    }>;
    worldBuildingElements?: string[];
    researchTopics?: string[];
    writingPrompts?: string[];
    tips?: string[];
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: string[]; // template IDs
}

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  baseTemplateId?: string;
  customizations: {
    addedSections: TemplateSection[];
    removedSections: string[];
    modifiedSections: Array<{
      sectionId: string;
      changes: Partial<TemplateSection>;
    }>;
  };
  createdAt: Date;
}

class TemplateService {
  private templates: Map<string, NovelTemplate> = new Map();
  private categories: Map<string, TemplateCategory> = new Map();
  private customTemplates: Map<string, CustomTemplate> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeCategories();
  }

  // Initialize default templates
  private initializeDefaultTemplates(): void {
    const defaultTemplates: NovelTemplate[] = [
      {
        id: 'three-act-novel',
        title: 'Three-Act Novel Structure',
        description: 'Classic three-act structure perfect for most genres. Includes setup, confrontation, and resolution.',
        genre: ['literary', 'commercial', 'mystery', 'romance', 'thriller'],
        structure: 'three-act',
        targetWordCount: 80000,
        estimatedDuration: '6-12 months',
        difficulty: 'beginner',
        tags: ['classic', 'versatile', 'proven'],
        sections: [
          {
            id: 'act1-setup',
            title: 'Act I: Setup',
            description: 'Introduce characters, world, and inciting incident',
            type: 'act',
            order: 1,
            isRequired: true,
            estimatedWordCount: 20000,
            metadata: {
              purpose: 'Establish normal world and introduce protagonist',
            },
          },
          {
            id: 'inciting-incident',
            title: 'Inciting Incident',
            description: 'The event that kicks off the main story',
            type: 'scene',
            order: 2,
            isRequired: true,
            estimatedWordCount: 2000,
          },
          {
            id: 'plot-point-1',
            title: 'Plot Point 1',
            description: 'Point of no return - protagonist commits to the journey',
            type: 'scene',
            order: 3,
            isRequired: true,
            estimatedWordCount: 2000,
          },
          {
            id: 'act2-confrontation',
            title: 'Act II: Confrontation',
            description: 'Rising action, obstacles, and character development',
            type: 'act',
            order: 4,
            isRequired: true,
            estimatedWordCount: 40000,
            metadata: {
              purpose: 'Develop conflict and test protagonist',
            },
          },
          {
            id: 'midpoint',
            title: 'Midpoint',
            description: 'Major revelation or reversal',
            type: 'scene',
            order: 5,
            isRequired: true,
            estimatedWordCount: 3000,
          },
          {
            id: 'plot-point-2',
            title: 'Plot Point 2',
            description: 'Lowest point - all seems lost',
            type: 'scene',
            order: 6,
            isRequired: true,
            estimatedWordCount: 2000,
          },
          {
            id: 'act3-resolution',
            title: 'Act III: Resolution',
            description: 'Climax and resolution of all conflicts',
            type: 'act',
            order: 7,
            isRequired: true,
            estimatedWordCount: 20000,
            metadata: {
              purpose: 'Resolve all conflicts and show character growth',
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        rating: 4.5,
        downloads: 1250,
      },
      {
        id: 'heros-journey',
        title: "Hero's Journey",
        description: "Joseph Campbell's monomyth structure. Perfect for adventure, fantasy, and coming-of-age stories.",
        genre: ['fantasy', 'adventure', 'science-fiction', 'young-adult'],
        structure: 'hero-journey',
        targetWordCount: 90000,
        estimatedDuration: '8-15 months',
        difficulty: 'intermediate',
        tags: ['mythic', 'character-driven', 'archetypal'],
        sections: [
          {
            id: 'ordinary-world',
            title: 'Ordinary World',
            description: "Hero's normal life before transformation",
            type: 'section',
            order: 1,
            isRequired: true,
            estimatedWordCount: 8000,
          },
          {
            id: 'call-to-adventure',
            title: 'Call to Adventure',
            description: 'Hero faces problem or challenge',
            type: 'scene',
            order: 2,
            isRequired: true,
            estimatedWordCount: 3000,
          },
          {
            id: 'refusal-call',
            title: 'Refusal of the Call',
            description: 'Hero hesitates or refuses the adventure',
            type: 'scene',
            order: 3,
            isRequired: false,
            estimatedWordCount: 2000,
          },
          {
            id: 'meeting-mentor',
            title: 'Meeting the Mentor',
            description: 'Hero encounters wise figure who gives advice',
            type: 'scene',
            order: 4,
            isRequired: true,
            estimatedWordCount: 4000,
          },
          {
            id: 'crossing-threshold',
            title: 'Crossing the First Threshold',
            description: 'Hero commits to adventure and enters special world',
            type: 'scene',
            order: 5,
            isRequired: true,
            estimatedWordCount: 5000,
          },
          {
            id: 'tests-allies-enemies',
            title: 'Tests, Allies, and Enemies',
            description: 'Hero learns rules of special world',
            type: 'section',
            order: 6,
            isRequired: true,
            estimatedWordCount: 25000,
          },
          {
            id: 'approach-inmost-cave',
            title: 'Approach to the Inmost Cave',
            description: 'Hero prepares for major challenge',
            type: 'section',
            order: 7,
            isRequired: true,
            estimatedWordCount: 8000,
          },
          {
            id: 'ordeal',
            title: 'Ordeal',
            description: 'Hero confronts greatest fear or most difficult challenge',
            type: 'scene',
            order: 8,
            isRequired: true,
            estimatedWordCount: 6000,
          },
          {
            id: 'reward',
            title: 'Reward (Seizing the Sword)',
            description: 'Hero survives and gains something',
            type: 'scene',
            order: 9,
            isRequired: true,
            estimatedWordCount: 4000,
          },
          {
            id: 'road-back',
            title: 'The Road Back',
            description: 'Hero begins journey back to ordinary world',
            type: 'section',
            order: 10,
            isRequired: true,
            estimatedWordCount: 10000,
          },
          {
            id: 'resurrection',
            title: 'Resurrection',
            description: 'Final test where hero is purified or transformed',
            type: 'scene',
            order: 11,
            isRequired: true,
            estimatedWordCount: 8000,
          },
          {
            id: 'return-elixir',
            title: 'Return with the Elixir',
            description: 'Hero returns home transformed and with wisdom',
            type: 'section',
            order: 12,
            isRequired: true,
            estimatedWordCount: 7000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        rating: 4.7,
        downloads: 890,
        metadata: {
          characterArcTemplates: [
            {
              name: 'Hero Arc',
              description: 'Transformation from ordinary to extraordinary',
              arc: ['Ordinary', 'Called', 'Resistant', 'Committed', 'Tested', 'Transformed'],
            },
          ],
        },
      },
      {
        id: 'romance-novel',
        title: 'Romance Novel Structure',
        description: 'Classic romance structure with meet-cute, conflict, and happily ever after.',
        genre: ['romance', 'contemporary', 'historical'],
        structure: 'custom',
        targetWordCount: 75000,
        estimatedDuration: '4-8 months',
        difficulty: 'beginner',
        tags: ['romance', 'relationship', 'emotional'],
        sections: [
          {
            id: 'meet-cute',
            title: 'Meet Cute',
            description: 'Protagonists meet in memorable way',
            type: 'scene',
            order: 1,
            isRequired: true,
            estimatedWordCount: 3000,
          },
          {
            id: 'attraction-conflict',
            title: 'Attraction and Conflict',
            description: 'Immediate attraction complicated by obstacles',
            type: 'section',
            order: 2,
            isRequired: true,
            estimatedWordCount: 15000,
          },
          {
            id: 'getting-to-know',
            title: 'Getting to Know Each Other',
            description: 'Characters learn about each other, building intimacy',
            type: 'section',
            order: 3,
            isRequired: true,
            estimatedWordCount: 20000,
          },
          {
            id: 'first-crisis',
            title: 'First Crisis',
            description: 'Major obstacle threatens relationship',
            type: 'scene',
            order: 4,
            isRequired: true,
            estimatedWordCount: 5000,
          },
          {
            id: 'deepening-relationship',
            title: 'Deepening Relationship',
            description: 'Characters overcome obstacles and grow closer',
            type: 'section',
            order: 5,
            isRequired: true,
            estimatedWordCount: 18000,
          },
          {
            id: 'black-moment',
            title: 'Black Moment',
            description: 'All seems lost - relationship appears doomed',
            type: 'scene',
            order: 6,
            isRequired: true,
            estimatedWordCount: 4000,
          },
          {
            id: 'grand-gesture',
            title: 'Grand Gesture',
            description: 'One character makes ultimate sacrifice or declaration',
            type: 'scene',
            order: 7,
            isRequired: true,
            estimatedWordCount: 5000,
          },
          {
            id: 'happily-ever-after',
            title: 'Happily Ever After',
            description: 'Resolution with commitment and future happiness',
            type: 'scene',
            order: 8,
            isRequired: true,
            estimatedWordCount: 5000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        rating: 4.3,
        downloads: 1100,
      },
      {
        id: 'mystery-novel',
        title: 'Mystery Novel Structure',
        description: 'Classic mystery structure with crime, investigation, and resolution.',
        genre: ['mystery', 'crime', 'thriller', 'detective'],
        structure: 'custom',
        targetWordCount: 70000,
        estimatedDuration: '5-10 months',
        difficulty: 'intermediate',
        tags: ['mystery', 'investigation', 'puzzle'],
        sections: [
          {
            id: 'crime-setup',
            title: 'Crime and Setup',
            description: 'Crime occurs and detective is introduced',
            type: 'section',
            order: 1,
            isRequired: true,
            estimatedWordCount: 10000,
          },
          {
            id: 'initial-investigation',
            title: 'Initial Investigation',
            description: 'Detective begins investigating, gathering clues',
            type: 'section',
            order: 2,
            isRequired: true,
            estimatedWordCount: 15000,
          },
          {
            id: 'first-suspect',
            title: 'First Suspect',
            description: 'Detective identifies and questions first suspect',
            type: 'scene',
            order: 3,
            isRequired: true,
            estimatedWordCount: 5000,
          },
          {
            id: 'complications',
            title: 'Complications and Red Herrings',
            description: 'Investigation becomes complex with false leads',
            type: 'section',
            order: 4,
            isRequired: true,
            estimatedWordCount: 20000,
          },
          {
            id: 'breakthrough',
            title: 'Breakthrough',
            description: 'Detective discovers crucial clue or makes connection',
            type: 'scene',
            order: 5,
            isRequired: true,
            estimatedWordCount: 4000,
          },
          {
            id: 'final-investigation',
            title: 'Final Investigation',
            description: 'Detective puts pieces together',
            type: 'section',
            order: 6,
            isRequired: true,
            estimatedWordCount: 8000,
          },
          {
            id: 'confrontation',
            title: 'Confrontation',
            description: 'Detective confronts the culprit',
            type: 'scene',
            order: 7,
            isRequired: true,
            estimatedWordCount: 5000,
          },
          {
            id: 'resolution',
            title: 'Resolution',
            description: 'All mysteries explained and loose ends tied up',
            type: 'scene',
            order: 8,
            isRequired: true,
            estimatedWordCount: 3000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        rating: 4.4,
        downloads: 675,
      },
      {
        id: 'epic-fantasy-novel',
        title: 'Epic Fantasy Novel',
        description: 'Complex multi-POV fantasy with intricate world-building and plot threads',
        author: 'Fantasy Masters',
        genre: ['fantasy', 'epic'],
        subgenre: ['high fantasy', 'sword and sorcery'],
        structure: 'custom',
        targetWordCount: 120000,
        estimatedDuration: '12-18 months',
        difficulty: 'advanced',
        tags: ['fantasy', 'epic', 'complex', 'multi-pov'],
        sections: [
          {
            id: 'world-intro',
            title: 'World Introduction',
            description: 'Establish the fantasy world and magic system',
            type: 'section',
            order: 1,
            isRequired: true,
            estimatedWordCount: 15000,
          },
          {
            id: 'pov-1-intro',
            title: 'POV Character 1 Introduction',
            description: 'Introduce first main character and their quest',
            type: 'section',
            order: 2,
            isRequired: true,
            estimatedWordCount: 20000,
          },
          {
            id: 'pov-2-intro',
            title: 'POV Character 2 Introduction',
            description: 'Introduce second main character and their storyline',
            type: 'section',
            order: 3,
            isRequired: true,
            estimatedWordCount: 20000,
          },
          {
            id: 'convergence',
            title: 'Storyline Convergence',
            description: 'Multiple POV storylines begin to intersect',
            type: 'section',
            order: 4,
            isRequired: true,
            estimatedWordCount: 25000,
          },
          {
            id: 'climax-resolution',
            title: 'Epic Climax and Resolution',
            description: 'Final battles and resolution of all plot threads',
            type: 'section',
            order: 5,
            isRequired: true,
            estimatedWordCount: 40000,
          },
        ],
        createdAt: new Date('2023-10-01'),
        updatedAt: new Date('2024-01-15'),
        isPublic: true,
        rating: 4.7,
        downloads: 234,
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Initialize categories
  private initializeCategories(): void {
    const categories: TemplateCategory[] = [
      {
        id: 'popular',
        name: 'Popular Templates',
        description: 'Most downloaded and highly rated templates',
        icon: '⭐',
        templates: ['three-act-novel', 'heros-journey', 'romance-novel'],
      },
      {
        id: 'beginner',
        name: 'Beginner Friendly',
        description: 'Simple structures perfect for first-time novelists',
        icon: '🌱',
        templates: ['three-act-novel', 'romance-novel'],
      },
      {
        id: 'fantasy',
        name: 'Fantasy & Sci-Fi',
        description: 'Templates for world-building heavy genres',
        icon: '🔮',
        templates: ['heros-journey'],
      },
      {
        id: 'romance',
        name: 'Romance',
        description: 'Relationship-focused story structures',
        icon: '💕',
        templates: ['romance-novel'],
      },
      {
        id: 'mystery',
        name: 'Mystery & Thriller',
        description: 'Plot-driven structures with puzzles and suspense',
        icon: '🔍',
        templates: ['mystery-novel'],
      },
      {
        id: 'literary',
        name: 'Literary Fiction',
        description: 'Character-driven and experimental structures',
        icon: '📚',
        templates: ['three-act-novel'],
      },
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  // Template management
  getTemplates(): NovelTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(templateId: string): NovelTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getTemplatesByGenre(genre: string): NovelTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      template.genre.includes(genre.toLowerCase())
    );
  }

  getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): NovelTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      template.difficulty === difficulty
    );
  }

  searchTemplates(query: string): NovelTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.title.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.genre.some(g => g.includes(lowerQuery)) ||
      template.tags.some(t => t.includes(lowerQuery))
    );
  }

  // Categories
  getCategories(): TemplateCategory[] {
    return Array.from(this.categories.values());
  }

  getCategory(categoryId: string): TemplateCategory | null {
    return this.categories.get(categoryId) || null;
  }

  getTemplatesByCategory(categoryId: string): NovelTemplate[] {
    const category = this.categories.get(categoryId);
    if (!category) return [];

    return category.templates
      .map(templateId => this.templates.get(templateId))
      .filter(template => template !== undefined) as NovelTemplate[];
  }

  // Custom templates
  createCustomTemplate(
    name: string,
    description: string,
    baseTemplateId?: string
  ): CustomTemplate {
    const customTemplate: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      baseTemplateId,
      customizations: {
        addedSections: [],
        removedSections: [],
        modifiedSections: [],
      },
      createdAt: new Date(),
    };

    this.customTemplates.set(customTemplate.id, customTemplate);
    this.emit('custom-template-created', customTemplate);
    return customTemplate;
  }

  getCustomTemplates(): CustomTemplate[] {
    return Array.from(this.customTemplates.values());
  }

  updateCustomTemplate(
    templateId: string,
    updates: Partial<CustomTemplate>
  ): boolean {
    const template = this.customTemplates.get(templateId);
    if (!template) return false;

    Object.assign(template, updates);
    this.emit('custom-template-updated', template);
    return true;
  }

  deleteCustomTemplate(templateId: string): boolean {
    const deleted = this.customTemplates.delete(templateId);
    if (deleted) {
      this.emit('custom-template-deleted', templateId);
    }
    return deleted;
  }

  // Apply template to project
  applyTemplate(templateId: string, projectData: any): {
    sections: TemplateSection[];
    metadata: any;
    estimatedStructure: any;
  } {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Clone sections and customize with project data
    const sections = template.sections.map(section => ({
      ...section,
      content: this.generateSectionContent(section, projectData),
    }));

    const metadata = {
      templateId: template.id,
      templateTitle: template.title,
      structure: template.structure,
      targetWordCount: template.targetWordCount,
      appliedAt: new Date(),
      ...template.metadata,
    };

    const estimatedStructure = this.calculateProjectStructure(template, projectData);

    this.emit('template-applied', { templateId, projectData, sections });

    return {
      sections,
      metadata,
      estimatedStructure,
    };
  }

  // Generate content for a section based on template and project data
  private generateSectionContent(section: TemplateSection, projectData: any): string {
    let content = `# ${section.title}\n\n`;
    
    if (section.description) {
      content += `*${section.description}*\n\n`;
    }

    content += `## Writing Guidelines\n\n`;
    
    if (section.estimatedWordCount) {
      content += `**Target word count:** ${section.estimatedWordCount} words\n\n`;
    }

    if (section.metadata?.purpose) {
      content += `**Purpose:** ${section.metadata.purpose}\n\n`;
    }

    content += `## Notes\n\n`;
    content += `[Your notes and ideas for this ${section.type}]\n\n`;
    content += `## Draft\n\n`;
    content += `[Begin writing your ${section.type} here]\n\n`;

    return content;
  }

  // Calculate project structure and timeline
  private calculateProjectStructure(template: NovelTemplate, projectData: any): any {
    const totalWordCount = template.targetWordCount;
    const sectionsCount = template.sections.length;
    const avgWordsPerSection = Math.round(totalWordCount / sectionsCount);

    return {
      totalSections: sectionsCount,
      requiredSections: template.sections.filter(s => s.isRequired).length,
      optionalSections: template.sections.filter(s => !s.isRequired).length,
      estimatedDuration: template.estimatedDuration,
      avgWordsPerSection,
      structure: template.structure,
      difficulty: template.difficulty,
    };
  }

  // Template preview
  generatePreview(templateId: string): {
    outline: string;
    structure: string;
    timeline: string;
  } {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const outline = this.generateOutlinePreview(template);
    const structure = this.generateStructurePreview(template);
    const timeline = this.generateTimelinePreview(template);

    return { outline, structure, timeline };
  }

  private generateOutlinePreview(template: NovelTemplate): string {
    let outline = `# ${template.title}\n\n`;
    outline += `${template.description}\n\n`;
    outline += `**Genre:** ${template.genre.join(', ')}\n`;
    outline += `**Target Length:** ${template.targetWordCount.toLocaleString()} words\n`;
    outline += `**Estimated Duration:** ${template.estimatedDuration}\n\n`;

    outline += `## Structure\n\n`;
    template.sections.forEach((section, index) => {
      outline += `${index + 1}. **${section.title}**${section.isRequired ? '' : ' (Optional)'}\n`;
      if (section.description) {
        outline += `   ${section.description}\n`;
      }
      if (section.estimatedWordCount) {
        outline += `   *Target: ${section.estimatedWordCount} words*\n`;
      }
      outline += `\n`;
    });

    return outline;
  }

  private generateStructurePreview(template: NovelTemplate): string {
    return template.structure;
  }

  private generateTimelinePreview(template: NovelTemplate): string {
    const sections = template.sections.length;
    const wordsPerWeek = 5000; // Assume 5k words per week
    const weeksNeeded = Math.ceil(template.targetWordCount / wordsPerWeek);
    
    let timeline = `Estimated timeline for ${template.targetWordCount.toLocaleString()} words:\n\n`;
    timeline += `- **Planning phase:** 2-4 weeks\n`;
    timeline += `- **First draft:** ${weeksNeeded} weeks\n`;
    timeline += `- **Revision phases:** ${Math.ceil(weeksNeeded * 0.5)} weeks\n`;
    timeline += `- **Total estimated time:** ${template.estimatedDuration}\n`;

    return timeline;
  }

  // Export/Import
  exportTemplate(templateId: string): string | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return JSON.stringify({
      template,
      version: '1.0.0',
      exportedAt: new Date(),
    }, null, 2);
  }

  importTemplate(jsonData: string): NovelTemplate | null {
    try {
      const data = JSON.parse(jsonData);
      if (data.template) {
        const template: NovelTemplate = {
          ...data.template,
          id: `imported-${Date.now()}`,
          isPublic: false,
          downloads: 0,
          rating: undefined,
        };
        
        this.templates.set(template.id, template);
        this.emit('template-imported', template);
        return template;
      }
    } catch (error) {
      console.error('Failed to import template:', error);
    }
    return null;
  }

  // Statistics
  getTemplateStats(): {
    totalTemplates: number;
    templatesByGenre: Record<string, number>;
    templatesByDifficulty: Record<string, number>;
    averageWordCount: number;
    mostPopular: NovelTemplate[];
  } {
    const templates = this.getTemplates();
    
    const genreStats: Record<string, number> = {};
    const difficultyStats: Record<string, number> = {};
    let totalWordCount = 0;

    templates.forEach(template => {
      template.genre.forEach(genre => {
        genreStats[genre] = (genreStats[genre] || 0) + 1;
      });
      
      difficultyStats[template.difficulty] = (difficultyStats[template.difficulty] || 0) + 1;
      totalWordCount += template.targetWordCount;
    });

    const mostPopular = templates
      .filter(t => t.rating && t.downloads)
      .sort((a, b) => (b.rating! * Math.log(b.downloads!)) - (a.rating! * Math.log(a.downloads!)))
      .slice(0, 5);

    return {
      totalTemplates: templates.length,
      templatesByGenre: genreStats,
      templatesByDifficulty: difficultyStats,
      averageWordCount: Math.round(totalWordCount / templates.length),
      mostPopular,
    };
  }

  // Event system
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}

export const templateService = new TemplateService();