/**
 * Scene Templates Service
 * Professional scene templates for writers with genre-specific content and structures
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface SceneTemplate {
  id: string;
  title: string;
  description: string;
  genre: string;
  category: 'action' | 'dialogue' | 'description' | 'character' | 'plot' | 'emotion' | 'worldbuilding';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  structure: SceneStructure;
  prompts: WritingPrompt[];
  examples: SceneExample[];
  metadata: {
    estimatedWordCount: number;
    estimatedWritingTime: number; // in minutes
    popularity: number;
    rating: number;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
    author: string;
    isOfficial: boolean;
    isCustom: boolean;
  };
}

export interface SceneStructure {
  sections: SceneSection[];
  pacing: PacingGuideline[];
  transitions: TransitionTip[];
  requirements: string[];
  optional: string[];
}

export interface SceneSection {
  id: string;
  title: string;
  description: string;
  purpose: string;
  wordCountRange: [number, number];
  keyElements: string[];
  techniques: WritingTechnique[];
  example: string;
  order: number;
}

export interface WritingPrompt {
  id: string;
  type: 'opening' | 'dialogue' | 'action' | 'emotion' | 'setting' | 'conflict' | 'resolution';
  prompt: string;
  guidance: string;
  examples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SceneExample {
  id: string;
  title: string;
  genre: string;
  text: string;
  analysis: string;
  highlights: ExampleHighlight[];
  authorNotes: string;
}

export interface ExampleHighlight {
  startIndex: number;
  endIndex: number;
  technique: string;
  explanation: string;
}

export interface WritingTechnique {
  name: string;
  description: string;
  when: string;
  how: string;
  examples: string[];
}

export interface PacingGuideline {
  phase: string;
  description: string;
  wordCount: number;
  tension: 'low' | 'medium' | 'high' | 'climax';
  focus: string;
}

export interface TransitionTip {
  from: string;
  to: string;
  technique: string;
  example: string;
}

export interface SceneGeneration {
  templateId: string;
  customizations: {
    genre: string;
    characters: string[];
    setting: string;
    mood: string;
    pointOfView: 'first' | 'second' | 'third-limited' | 'third-omniscient';
    tense: 'past' | 'present' | 'future';
    tone: string;
    conflict: string;
    theme: string;
  };
  generatedContent: {
    outline: string;
    opening: string;
    keyScenes: string[];
    transitions: string[];
    notes: string[];
  };
  metadata: {
    generatedAt: Date;
    estimatedLength: number;
    complexity: number;
  };
}

export interface TemplateCustomization {
  templateId: string;
  userId: string;
  customizations: {
    title: string;
    description: string;
    structure: Partial<SceneStructure>;
    additionalPrompts: WritingPrompt[];
    personalNotes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateAnalytics {
  templateId: string;
  usage: {
    totalUses: number;
    recentUses: number;
    averageRating: number;
    completionRate: number;
  };
  demographics: {
    popularGenres: string[];
    experienceLevels: Record<string, number>;
    commonCustomizations: string[];
  };
  performance: {
    averageWritingTime: number;
    successRate: number;
    userFeedback: string[];
  };
}

class SceneTemplatesService extends BrowserEventEmitter {
  private templates: Map<string, SceneTemplate> = new Map();
  private customizations: Map<string, TemplateCustomization> = new Map();
  private generations: Map<string, SceneGeneration> = new Map();
  private analytics: Map<string, TemplateAnalytics> = new Map();
  private storageKey = 'astral_notes_scene_templates';

  constructor() {
    super();
    this.loadData();
    this.initializeOfficialTemplates();
  }

  // Template Management
  getTemplate(id: string): SceneTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): SceneTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }

  getTemplatesByGenre(genre: string): SceneTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.genre.toLowerCase().includes(genre.toLowerCase()))
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }

  getTemplatesByCategory(category: SceneTemplate['category']): SceneTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category)
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }

  getTemplatesByDifficulty(difficulty: SceneTemplate['difficulty']): SceneTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.difficulty === difficulty)
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }

  searchTemplates(query: string): SceneTemplate[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return Array.from(this.templates.values())
      .filter(template => {
        const searchableText = [
          template.title,
          template.description,
          template.genre,
          template.category,
          ...template.tags
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      })
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity);
  }

  createCustomTemplate(
    baseTemplateId: string | null,
    templateData: Partial<SceneTemplate>,
    author: string
  ): SceneTemplate {
    const baseTemplate = baseTemplateId ? this.templates.get(baseTemplateId) : null;
    
    const template: SceneTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: templateData.title || 'Custom Scene Template',
      description: templateData.description || 'A custom scene template',
      genre: templateData.genre || 'General',
      category: templateData.category || 'plot',
      difficulty: templateData.difficulty || 'intermediate',
      tags: templateData.tags || [],
      structure: templateData.structure || this.getDefaultStructure(),
      prompts: templateData.prompts || [],
      examples: templateData.examples || [],
      metadata: {
        estimatedWordCount: templateData.metadata?.estimatedWordCount || 1000,
        estimatedWritingTime: templateData.metadata?.estimatedWritingTime || 30,
        popularity: 0,
        rating: 0,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        author,
        isOfficial: false,
        isCustom: true
      }
    };

    // Inherit from base template if provided
    if (baseTemplate) {
      template.structure = { ...baseTemplate.structure, ...template.structure };
      template.prompts = [...baseTemplate.prompts, ...template.prompts];
    }

    this.templates.set(template.id, template);
    this.saveData();
    this.emit('templateCreated', template);
    
    return template;
  }

  updateTemplate(id: string, updates: Partial<SceneTemplate>): SceneTemplate | null {
    const template = this.templates.get(id);
    if (!template || template.metadata.isOfficial) return null;

    const updatedTemplate = {
      ...template,
      ...updates,
      id: template.id, // Preserve ID
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    this.templates.set(id, updatedTemplate);
    this.saveData();
    this.emit('templateUpdated', updatedTemplate);
    
    return updatedTemplate;
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template || template.metadata.isOfficial) return false;

    this.templates.delete(id);
    this.saveData();
    this.emit('templateDeleted', { templateId: id, template });
    
    return true;
  }

  // Template Usage and Analytics
  useTemplate(templateId: string, userId?: string): SceneTemplate | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Update usage statistics
    template.metadata.usageCount++;
    template.metadata.popularity = this.calculatePopularity(template);

    // Update analytics
    this.updateAnalytics(templateId, 'use');

    this.templates.set(templateId, template);
    this.saveData();
    this.emit('templateUsed', { template, userId });
    
    return template;
  }

  rateTemplate(templateId: string, rating: number, userId?: string): boolean {
    const template = this.templates.get(templateId);
    if (!template || rating < 1 || rating > 5) return false;

    // Simple average rating calculation (would be more sophisticated in production)
    const currentRating = template.metadata.rating;
    const usageCount = template.metadata.usageCount;
    
    template.metadata.rating = (currentRating * usageCount + rating) / (usageCount + 1);

    this.templates.set(templateId, template);
    this.saveData();
    this.emit('templateRated', { template, rating, userId });
    
    return true;
  }

  // Scene Generation
  generateScene(templateId: string, customizations: SceneGeneration['customizations']): SceneGeneration {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const generation: SceneGeneration = {
      templateId,
      customizations,
      generatedContent: this.generateContent(template, customizations),
      metadata: {
        generatedAt: new Date(),
        estimatedLength: this.estimateSceneLength(template, customizations),
        complexity: this.calculateComplexity(template, customizations)
      }
    };

    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.generations.set(generationId, generation);
    this.saveData();
    this.emit('sceneGenerated', { generationId, generation });
    
    return generation;
  }

  private generateContent(template: SceneTemplate, customizations: SceneGeneration['customizations']) {
    const outline = this.generateOutline(template, customizations);
    const opening = this.generateOpening(template, customizations);
    const keyScenes = this.generateKeyScenes(template, customizations);
    const transitions = this.generateTransitions(template, customizations);
    const notes = this.generateNotes(template, customizations);

    return { outline, opening, keyScenes, transitions, notes };
  }

  private generateOutline(template: SceneTemplate, customizations: SceneGeneration['customizations']): string {
    const sections = template.structure.sections.map(section => {
      return `${section.title}: ${section.description}
Purpose: ${section.purpose}
Key Elements: ${section.keyElements.join(', ')}
Word Count: ${section.wordCountRange[0]}-${section.wordCountRange[1]} words`;
    }).join('\n\n');

    return `Scene Outline for "${template.title}"
Genre: ${customizations.genre}
Setting: ${customizations.setting}
POV: ${customizations.pointOfView} person ${customizations.tense} tense
Mood: ${customizations.mood}
Conflict: ${customizations.conflict}

Structure:
${sections}`;
  }

  private generateOpening(template: SceneTemplate, customizations: SceneGeneration['customizations']): string {
    const openingPrompts = template.prompts.filter(p => p.type === 'opening');
    if (openingPrompts.length === 0) return '';

    const selectedPrompt = openingPrompts[0];
    
    return `Opening Scene Guidance:
${selectedPrompt.prompt}

Customized for your scene:
- Characters: ${customizations.characters.join(', ')}
- Setting: ${customizations.setting}
- Mood: ${customizations.mood}
- POV: ${customizations.pointOfView}

${selectedPrompt.guidance}

Example approach:
${selectedPrompt.examples[0] || 'Start with action or dialogue to immediately engage the reader.'}`;
  }

  private generateKeyScenes(template: SceneTemplate, customizations: SceneGeneration['customizations']): string[] {
    return template.structure.sections.map(section => {
      return `${section.title}:
${section.description}

For your ${customizations.genre} scene:
- Focus on: ${section.keyElements.join(', ')}
- Techniques to use: ${section.techniques.map(t => t.name).join(', ')}
- Word count target: ${section.wordCountRange[0]}-${section.wordCountRange[1]} words

Example approach:
${section.example}`;
    });
  }

  private generateTransitions(template: SceneTemplate, customizations: SceneGeneration['customizations']): string[] {
    return template.structure.transitions.map(transition => {
      return `Transition from ${transition.from} to ${transition.to}:
Technique: ${transition.technique}
Example: ${transition.example}

Adapted for your ${customizations.mood} mood and ${customizations.tense} tense narration.`;
    });
  }

  private generateNotes(template: SceneTemplate, customizations: SceneGeneration['customizations']): string[] {
    const notes = [
      `Theme Integration: Weave "${customizations.theme}" throughout the scene naturally`,
      `Character Voice: Ensure ${customizations.characters.join(' and ')} maintain consistent voices`,
      `Pacing: This ${template.category} scene should maintain ${this.getPacingAdvice(template.category)} pacing`,
      `Conflict Resolution: Address "${customizations.conflict}" within the scene structure`,
      `Sensory Details: Incorporate ${customizations.setting} atmosphere through all five senses`
    ];

    return notes;
  }

  private getPacingAdvice(category: SceneTemplate['category']): string {
    const pacingMap = {
      action: 'fast-paced and urgent',
      dialogue: 'conversational and dynamic',
      description: 'measured and immersive',
      character: 'introspective and steady',
      plot: 'purposeful and progressive',
      emotion: 'sensitive and gradual',
      worldbuilding: 'exploratory and detailed'
    };
    
    return pacingMap[category] || 'appropriate';
  }

  // Template Customization
  saveCustomization(customization: TemplateCustomization): void {
    const id = `custom-${customization.templateId}-${customization.userId}`;
    this.customizations.set(id, customization);
    this.saveData();
    this.emit('customizationSaved', customization);
  }

  getUserCustomizations(userId: string): TemplateCustomization[] {
    return Array.from(this.customizations.values())
      .filter(custom => custom.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getTemplateCustomizations(templateId: string): TemplateCustomization[] {
    return Array.from(this.customizations.values())
      .filter(custom => custom.templateId === templateId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Analytics and Insights
  getTemplateAnalytics(templateId: string): TemplateAnalytics | null {
    return this.analytics.get(templateId) || null;
  }

  getPopularTemplates(limit: number = 10): SceneTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity)
      .slice(0, limit);
  }

  getTrendingTemplates(timeframe: 'day' | 'week' | 'month' = 'week'): SceneTemplate[] {
    // Simplified trending calculation based on recent usage
    const now = Date.now();
    const timeframeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }[timeframe];

    return Array.from(this.templates.values())
      .filter(template => {
        const analytics = this.analytics.get(template.id);
        return analytics && analytics.usage.recentUses > 0;
      })
      .sort((a, b) => {
        const aAnalytics = this.analytics.get(a.id);
        const bAnalytics = this.analytics.get(b.id);
        return (bAnalytics?.usage.recentUses || 0) - (aAnalytics?.usage.recentUses || 0);
      })
      .slice(0, 10);
  }

  getRecommendations(userId: string, preferences: { genres: string[], categories: string[], difficulty: string }): SceneTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => {
        const genreMatch = preferences.genres.length === 0 || 
          preferences.genres.some(genre => template.genre.toLowerCase().includes(genre.toLowerCase()));
        const categoryMatch = preferences.categories.length === 0 || 
          preferences.categories.includes(template.category);
        const difficultyMatch = !preferences.difficulty || template.difficulty === preferences.difficulty;
        
        return genreMatch && categoryMatch && difficultyMatch;
      })
      .sort((a, b) => b.metadata.rating - a.metadata.rating)
      .slice(0, 15);
  }

  // Utility Methods
  private calculatePopularity(template: SceneTemplate): number {
    const baseScore = template.metadata.usageCount * 10;
    const ratingBonus = template.metadata.rating * 20;
    const recentnessBonus = this.getRecentnessBonus(template.metadata.updatedAt);
    
    return Math.round(baseScore + ratingBonus + recentnessBonus);
  }

  private getRecentnessBonus(date: Date): number {
    const daysSinceUpdate = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 100 - daysSinceUpdate * 2);
  }

  private estimateSceneLength(template: SceneTemplate, customizations: SceneGeneration['customizations']): number {
    const baseLength = template.metadata.estimatedWordCount;
    const complexityMultiplier = customizations.characters.length * 0.1 + 1;
    const detailMultiplier = template.category === 'description' ? 1.3 : 
                            template.category === 'action' ? 0.8 : 1;
    
    return Math.round(baseLength * complexityMultiplier * detailMultiplier);
  }

  private calculateComplexity(template: SceneTemplate, customizations: SceneGeneration['customizations']): number {
    let complexity = 1;
    
    complexity += customizations.characters.length * 0.2;
    complexity += template.difficulty === 'advanced' ? 1 : template.difficulty === 'intermediate' ? 0.5 : 0;
    complexity += template.structure.sections.length * 0.1;
    
    return Math.min(5, Math.max(1, complexity));
  }

  private updateAnalytics(templateId: string, action: string): void {
    let analytics = this.analytics.get(templateId);
    
    if (!analytics) {
      analytics = {
        templateId,
        usage: { totalUses: 0, recentUses: 0, averageRating: 0, completionRate: 0 },
        demographics: { popularGenres: [], experienceLevels: {}, commonCustomizations: [] },
        performance: { averageWritingTime: 0, successRate: 0, userFeedback: [] }
      };
    }
    
    if (action === 'use') {
      analytics.usage.totalUses++;
      analytics.usage.recentUses++;
    }
    
    this.analytics.set(templateId, analytics);
  }

  private getDefaultStructure(): SceneStructure {
    return {
      sections: [
        {
          id: 'opening',
          title: 'Opening',
          description: 'Set the scene and hook the reader',
          purpose: 'Establish context and engage the audience',
          wordCountRange: [100, 300],
          keyElements: ['setting', 'character introduction', 'initial hook'],
          techniques: [
            {
              name: 'In Medias Res',
              description: 'Start in the middle of action',
              when: 'When you want immediate engagement',
              how: 'Begin with dialogue or action, then fill in context',
              examples: ['The gunshot echoed through the empty warehouse.']
            }
          ],
          example: 'Start with a compelling moment that draws readers in immediately.',
          order: 1
        },
        {
          id: 'development',
          title: 'Development',
          description: 'Build tension and develop the core conflict',
          purpose: 'Advance the plot and deepen character understanding',
          wordCountRange: [400, 800],
          keyElements: ['conflict escalation', 'character development', 'plot advancement'],
          techniques: [
            {
              name: 'Show Don\'t Tell',
              description: 'Reveal through action and dialogue',
              when: 'When conveying character emotions or motivations',
              how: 'Use specific actions, dialogue, and sensory details',
              examples: ['Her hands trembled as she reached for the door handle.']
            }
          ],
          example: 'Develop the central conflict through character interactions and rising tension.',
          order: 2
        },
        {
          id: 'resolution',
          title: 'Resolution',
          description: 'Conclude the scene with purpose',
          purpose: 'Provide satisfying closure or transition',
          wordCountRange: [100, 300],
          keyElements: ['conflict resolution', 'emotional payoff', 'transition setup'],
          techniques: [
            {
              name: 'Cliffhanger',
              description: 'End with unresolved tension',
              when: 'When transitioning between scenes or chapters',
              how: 'Leave key questions unanswered or introduce new complications',
              examples: ['Just as she turned to leave, she heard footsteps behind her.']
            }
          ],
          example: 'End with either resolution or a compelling reason to continue reading.',
          order: 3
        }
      ],
      pacing: [
        { phase: 'Opening', description: 'Quick setup', wordCount: 200, tension: 'medium', focus: 'Hook and context' },
        { phase: 'Development', description: 'Steady build', wordCount: 600, tension: 'high', focus: 'Conflict and character' },
        { phase: 'Resolution', description: 'Satisfying conclusion', wordCount: 200, tension: 'low', focus: 'Closure or transition' }
      ],
      transitions: [
        { from: 'Opening', to: 'Development', technique: 'Escalating tension', example: 'The peaceful morning was about to change everything.' },
        { from: 'Development', to: 'Resolution', technique: 'Climactic moment', example: 'In that instant, everything she thought she knew crumbled.' }
      ],
      requirements: ['Clear character motivation', 'Defined setting', 'Consistent point of view'],
      optional: ['Subplots', 'Flashbacks', 'Multiple characters']
    };
  }

  // Official Templates Initialization
  private initializeOfficialTemplates(): void {
    if (this.templates.size > 0) return; // Already initialized

    const officialTemplates: Partial<SceneTemplate>[] = [
      {
        title: 'Action Sequence',
        description: 'High-energy action scene with clear choreography and pacing',
        genre: 'Action/Adventure',
        category: 'action',
        difficulty: 'intermediate',
        tags: ['combat', 'chase', 'tension', 'fast-paced'],
        metadata: {
          estimatedWordCount: 800,
          estimatedWritingTime: 25,
          popularity: 95,
          rating: 4.5,
          author: 'ASTRAL_NOTES',
          isOfficial: true,
          isCustom: false
        }
      },
      {
        title: 'Intimate Dialogue',
        description: 'Character-driven conversation scene focusing on relationships and conflict',
        genre: 'Drama/Romance',
        category: 'dialogue',
        difficulty: 'advanced',
        tags: ['conversation', 'character development', 'emotion', 'subtext'],
        metadata: {
          estimatedWordCount: 600,
          estimatedWritingTime: 20,
          popularity: 88,
          rating: 4.7,
          author: 'ASTRAL_NOTES',
          isOfficial: true,
          isCustom: false
        }
      },
      {
        title: 'Atmospheric Setting',
        description: 'Immersive world-building scene that establishes mood and environment',
        genre: 'Fantasy/Horror',
        category: 'description',
        difficulty: 'beginner',
        tags: ['world-building', 'atmosphere', 'sensory details', 'mood'],
        metadata: {
          estimatedWordCount: 500,
          estimatedWritingTime: 30,
          popularity: 82,
          rating: 4.3,
          author: 'ASTRAL_NOTES',
          isOfficial: true,
          isCustom: false
        }
      },
      {
        title: 'Character Revelation',
        description: 'Pivotal scene where character truths and motivations are revealed',
        genre: 'Literary Fiction',
        category: 'character',
        difficulty: 'advanced',
        tags: ['character arc', 'revelation', 'psychology', 'turning point'],
        metadata: {
          estimatedWordCount: 700,
          estimatedWritingTime: 35,
          popularity: 79,
          rating: 4.6,
          author: 'ASTRAL_NOTES',
          isOfficial: true,
          isCustom: false
        }
      },
      {
        title: 'Mystery Investigation',
        description: 'Clue discovery and deduction scene for mystery narratives',
        genre: 'Mystery/Thriller',
        category: 'plot',
        difficulty: 'intermediate',
        tags: ['investigation', 'clues', 'deduction', 'suspense'],
        metadata: {
          estimatedWordCount: 900,
          estimatedWritingTime: 40,
          popularity: 75,
          rating: 4.4,
          author: 'ASTRAL_NOTES',
          isOfficial: true,
          isCustom: false
        }
      }
    ];

    officialTemplates.forEach(templateData => {
      const template: SceneTemplate = {
        id: `official-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: templateData.title || '',
        description: templateData.description || '',
        genre: templateData.genre || '',
        category: templateData.category || 'plot',
        difficulty: templateData.difficulty || 'intermediate',
        tags: templateData.tags || [],
        structure: this.getDefaultStructure(),
        prompts: this.generatePromptsForCategory(templateData.category || 'plot'),
        examples: [],
        metadata: {
          estimatedWordCount: 1000,
          estimatedWritingTime: 30,
          popularity: 0,
          rating: 0,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...templateData.metadata
        }
      };

      this.templates.set(template.id, template);
    });

    this.saveData();
  }

  private generatePromptsForCategory(category: string): WritingPrompt[] {
    const promptsByCategory = {
      action: [
        {
          type: 'opening' as const,
          prompt: 'Start with immediate physical action or danger',
          guidance: 'Use short, punchy sentences. Focus on movement and urgency.',
          examples: ['The blade whistled past her ear.', 'He dove as the explosion lit up the sky.'],
          difficulty: 'intermediate' as const
        },
        {
          type: 'action' as const,
          prompt: 'Describe the fight choreography clearly',
          guidance: 'Keep track of positioning and momentum. Avoid confusing the reader.',
          examples: ['She spun left, using his momentum against him.'],
          difficulty: 'advanced' as const
        }
      ],
      dialogue: [
        {
          type: 'dialogue' as const,
          prompt: 'Create subtext beneath the surface conversation',
          guidance: 'Characters should say one thing while meaning another.',
          examples: ['"Nice weather," she said, loading the gun.'],
          difficulty: 'advanced' as const
        },
        {
          type: 'emotion' as const,
          prompt: 'Show emotion through dialogue patterns and word choice',
          guidance: 'Angry characters use shorter sentences. Nervous characters repeat themselves.',
          examples: ['"I just... I can\'t... why would you do this?"'],
          difficulty: 'intermediate' as const
        }
      ],
      description: [
        {
          type: 'setting' as const,
          prompt: 'Engage all five senses in your description',
          guidance: 'Don\'t just show what characters see. Include sounds, smells, textures.',
          examples: ['The musty air tasted of forgotten years and mouse droppings.'],
          difficulty: 'beginner' as const
        }
      ]
    };

    const categoryPrompts = promptsByCategory[category as keyof typeof promptsByCategory] || [];
    
    return categoryPrompts.map((prompt, index) => ({
      id: `prompt-${category}-${index}`,
      ...prompt
    }));
  }

  // Data Persistence
  private saveData(): void {
    try {
      const data = {
        templates: Array.from(this.templates.entries()),
        customizations: Array.from(this.customizations.entries()),
        generations: Array.from(this.generations.entries()),
        analytics: Array.from(this.analytics.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save scene templates data:', error);
    }
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.templates = new Map(data.templates?.map(([id, template]: [string, any]) => [
          id,
          {
            ...template,
            metadata: {
              ...template.metadata,
              createdAt: new Date(template.metadata.createdAt),
              updatedAt: new Date(template.metadata.updatedAt)
            }
          }
        ]) || []);
        
        this.customizations = new Map(data.customizations?.map(([id, custom]: [string, any]) => [
          id,
          {
            ...custom,
            createdAt: new Date(custom.createdAt),
            updatedAt: new Date(custom.updatedAt)
          }
        ]) || []);
        
        this.generations = new Map(data.generations?.map(([id, gen]: [string, any]) => [
          id,
          {
            ...gen,
            metadata: {
              ...gen.metadata,
              generatedAt: new Date(gen.metadata.generatedAt)
            }
          }
        ]) || []);
        
        this.analytics = new Map(data.analytics || []);
      }
    } catch (error) {
      console.error('Failed to load scene templates data:', error);
    }
  }
}

export const sceneTemplatesService = new SceneTemplatesService();
export default sceneTemplatesService;