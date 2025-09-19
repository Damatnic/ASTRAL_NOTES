/**
 * Scene Beat Generation Service
 * Handles scene beat creation, AI expansion, and template management
 */

import { aiWritingService } from './aiWritingService';

export interface SceneBeat {
  id: string;
  content: string;
  type: 'action' | 'dialogue' | 'description' | 'transition' | 'emotion' | 'conflict';
  position: number;
  isExpanded: boolean;
  expandedContent?: string;
  metadata?: {
    characters?: string[];
    location?: string;
    timeOfDay?: string;
    mood?: string;
    tension?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BeatTemplate {
  id: string;
  name: string;
  description: string;
  category: 'action' | 'dialogue' | 'emotional' | 'tension' | 'transition' | 'setup';
  beats: Array<{
    type: SceneBeat['type'];
    content: string;
    prompt?: string;
  }>;
  genre?: string[];
}

export interface BeatExpansionOptions {
  tone?: 'dramatic' | 'humorous' | 'suspenseful' | 'romantic' | 'dark' | 'light';
  style?: 'concise' | 'detailed' | 'poetic' | 'conversational';
  perspective?: 'first' | 'third-limited' | 'third-omniscient';
  targetLength?: 'short' | 'medium' | 'long';
  includeDialogue?: boolean;
  includeSensoryDetails?: boolean;
  context?: string;
}

class SceneBeatService {
  private beats: Map<string, SceneBeat[]> = new Map();
  private templates: BeatTemplate[] = this.getDefaultTemplates();
  private beatCounter = 0;

  // Create a new scene beat
  createBeat(sceneId: string, content: string, type: SceneBeat['type'], position?: number): SceneBeat {
    const sceneBeat: SceneBeat = {
      id: `beat-${++this.beatCounter}`,
      content,
      type,
      position: position ?? this.getNextPosition(sceneId),
      isExpanded: false,
      expandedContent: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.beats.has(sceneId)) {
      this.beats.set(sceneId, []);
    }

    const sceneBeats = this.beats.get(sceneId)!;
    if (position !== undefined) {
      sceneBeats.splice(position, 0, sceneBeat);
      this.reorderBeats(sceneId);
    } else {
      sceneBeats.push(sceneBeat);
    }

    return sceneBeat;
  }

  // Parse slash commands from editor content
  parseSlashCommands(content: string): Array<{ command: string; args: string; position: number }> {
    const slashCommandRegex = /\/([\w-]+)(?:\s+([^/]+?))?(?=\s*\/|$)/g;
    const commands: Array<{ command: string; args: string; position: number }> = [];
    let match;

    while ((match = slashCommandRegex.exec(content)) !== null) {
      commands.push({
        command: match[1],
        args: match[2] ? match[2].trim() : '',
        position: match.index,
      });
    }

    return commands;
  }

  // Process slash commands and convert to beats
  async processSlashCommands(sceneId: string, content: string): Promise<SceneBeat[]> {
    const commands = this.parseSlashCommands(content);
    const newBeats: SceneBeat[] = [];

    for (const cmd of commands) {
      const beat = await this.convertCommandToBeat(sceneId, cmd);
      if (beat) {
        newBeats.push(beat);
      }
    }

    return newBeats;
  }

  // Convert slash command to scene beat
  private async convertCommandToBeat(sceneId: string, command: { command: string; args: string; position: number }): Promise<SceneBeat | null> {
    const commandMap: Record<string, SceneBeat['type']> = {
      action: 'action',
      dialogue: 'dialogue',
      desc: 'description',
      description: 'description',
      transition: 'transition',
      emotion: 'emotion',
      conflict: 'conflict',
    };

    const beatType = commandMap[command.command.toLowerCase()];
    if (!beatType) return null;

    return this.createBeat(sceneId, command.args, beatType);
  }

  // Expand beat into prose using AI
  async expandBeat(beatId: string, sceneId: string, options: BeatExpansionOptions = {}): Promise<string> {
    const beat = this.getBeat(sceneId, beatId);
    if (!beat) throw new Error('Beat not found');

    const prompt = this.buildExpansionPrompt(beat, options);
    
    try {
      const expandedContent = await aiWritingService.generateContent(prompt, {
        maxTokens: this.getTokensForLength(options.targetLength || 'medium'),
        temperature: 0.7,
        model: 'gpt-3.5-turbo',
      });

      // Update beat with expanded content
      beat.expandedContent = expandedContent;
      beat.isExpanded = true;
      beat.updatedAt = new Date();

      return expandedContent;
    } catch (error) {
      console.error('Failed to expand beat:', error);
      throw new Error('Failed to expand beat with AI');
    }
  }

  // Build AI prompt for beat expansion
  private buildExpansionPrompt(beat: SceneBeat, options: BeatExpansionOptions): string {
    let prompt = `Expand this scene beat into prose:\n\n"${beat.content}"\n\n`;

    prompt += `Type: ${beat.type}\n`;

    if (options.tone) {
      prompt += `Tone: ${options.tone}\n`;
    }

    if (options.style) {
      prompt += `Style: ${options.style}\n`;
    }

    if (options.perspective) {
      prompt += `Perspective: ${options.perspective} person\n`;
    }

    if (options.context) {
      prompt += `Context: ${options.context}\n`;
    }

    if (options.includeDialogue && beat.type !== 'dialogue') {
      prompt += `Include dialogue where appropriate.\n`;
    }

    if (options.includeSensoryDetails) {
      prompt += `Include sensory details to enhance immersion.\n`;
    }

    prompt += `\nExpand this into ${options.targetLength || 'medium'} length prose that flows naturally and advances the scene. Focus on showing rather than telling.`;

    return prompt;
  }

  // Get token count based on target length
  private getTokensForLength(length: 'short' | 'medium' | 'long'): number {
    switch (length) {
      case 'short': return 150;
      case 'medium': return 300;
      case 'long': return 500;
      default: return 300;
    }
  }

  // Get beat suggestions based on context
  async getBeatSuggestions(sceneId: string, currentContent: string, position: number): Promise<Array<{ type: SceneBeat['type']; content: string; confidence: number }>> {
    const existingBeats = this.getSceneBeats(sceneId);
    const context = this.analyzeSceneContext(existingBeats, currentContent, position);
    
    // AI-powered suggestions
    const prompt = `Based on this scene context, suggest 3-5 potential next scene beats:

Current scene beats:
${existingBeats.map(b => `- ${b.type}: ${b.content}`).join('\n')}

Current content: ${currentContent}

Suggest beats that would naturally follow and advance the scene. Format as JSON array with type, content, and confidence (0-1).`;

    try {
      const suggestions = await aiWritingService.generateContent(prompt, {
        maxTokens: 200,
        temperature: 0.8,
      });

      return JSON.parse(suggestions);
    } catch (error) {
      console.error('Failed to get beat suggestions:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  // Analyze scene context for suggestions
  private analyzeSceneContext(beats: SceneBeat[], content: string, position: number) {
    const lastBeat = beats[beats.length - 1];
    const wordCount = content.split(' ').length;
    const hasDialogue = beats.some(b => b.type === 'dialogue');
    const hasConflict = beats.some(b => b.type === 'conflict');
    const hasAction = beats.some(b => b.type === 'action');

    return {
      lastBeatType: lastBeat?.type,
      sceneLength: wordCount,
      hasDialogue,
      hasConflict,
      hasAction,
      beatCount: beats.length,
    };
  }

  // Fallback suggestions when AI fails
  private getFallbackSuggestions(context: any): Array<{ type: SceneBeat['type']; content: string; confidence: number }> {
    const suggestions = [];

    // For longer scenes, prioritize transition
    if (context.beatCount > 3) {
      suggestions.push({
        type: 'transition' as const,
        content: 'Transition to next scene or moment',
        confidence: 0.9,
      });
    }

    if (!context.hasDialogue) {
      suggestions.push({
        type: 'dialogue' as const,
        content: 'Character speaks or responds',
        confidence: 0.8,
      });
    }

    if (!context.hasConflict) {
      suggestions.push({
        type: 'conflict' as const,
        content: 'Tension or disagreement arises',
        confidence: 0.6,
      });
    }

    if (context.lastBeatType !== 'action') {
      suggestions.push({
        type: 'action' as const,
        content: 'Character performs an action',
        confidence: 0.5,
      });
    }

    suggestions.push({
      type: 'description' as const,
      content: 'Describe the setting or atmosphere',
      confidence: 0.4,
    });

    return suggestions.slice(0, 3);
  }

  // Apply beat template to scene
  applyTemplate(sceneId: string, templateId: string, context?: { characters?: string[]; location?: string }): SceneBeat[] {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const newBeats: SceneBeat[] = [];

    template.beats.forEach((beatTemplate, index) => {
      let content = beatTemplate.content;
      
      // Replace placeholders with context
      if (context?.characters?.length) {
        content = content.replace(/\[CHARACTER\]/g, context.characters[0]);
        content = content.replace(/\[CHARACTERS\]/g, context.characters.join(' and '));
      }
      
      if (context?.location) {
        content = content.replace(/\[LOCATION\]/g, context.location);
      }

      const beat = this.createBeat(sceneId, content, beatTemplate.type, index);
      newBeats.push(beat);
    });

    return newBeats;
  }

  // CRUD operations
  getBeat(sceneId: string, beatId: string): SceneBeat | null {
    const sceneBeats = this.beats.get(sceneId) || [];
    return sceneBeats.find(b => b.id === beatId) || null;
  }

  getSceneBeats(sceneId: string): SceneBeat[] {
    return this.beats.get(sceneId) || [];
  }

  updateBeat(sceneId: string, beatId: string, updates: Partial<SceneBeat>): SceneBeat | null {
    const beat = this.getBeat(sceneId, beatId);
    if (!beat) return null;

    Object.assign(beat, updates, { updatedAt: new Date() });
    return beat;
  }

  deleteBeat(sceneId: string, beatId: string): boolean {
    const sceneBeats = this.beats.get(sceneId);
    if (!sceneBeats) return false;

    const index = sceneBeats.findIndex(b => b.id === beatId);
    if (index === -1) return false;

    sceneBeats.splice(index, 1);
    this.reorderBeats(sceneId);
    return true;
  }

  reorderBeats(sceneId: string): void {
    const sceneBeats = this.beats.get(sceneId);
    if (!sceneBeats) return;

    sceneBeats.forEach((beat, index) => {
      beat.position = index;
    });
  }

  moveBeat(sceneId: string, beatId: string, newPosition: number): boolean {
    const sceneBeats = this.beats.get(sceneId);
    if (!sceneBeats) return false;

    const beatIndex = sceneBeats.findIndex(b => b.id === beatId);
    if (beatIndex === -1) return false;

    const [beat] = sceneBeats.splice(beatIndex, 1);
    sceneBeats.splice(newPosition, 0, beat);
    this.reorderBeats(sceneId);
    return true;
  }

  // Generate prose from all beats
  async generateSceneProse(sceneId: string, options: BeatExpansionOptions = {}): Promise<string> {
    const beats = this.getSceneBeats(sceneId);
    const expandedParts: string[] = [];

    for (const beat of beats) {
      if (beat.isExpanded && beat.expandedContent) {
        expandedParts.push(beat.expandedContent);
      } else {
        const expanded = await this.expandBeat(beat.id, sceneId, options);
        expandedParts.push(expanded);
      }
    }

    return expandedParts.join('\n\n');
  }

  // Template management
  getTemplates(): BeatTemplate[] {
    return this.templates;
  }

  getTemplatesByCategory(category: BeatTemplate['category']): BeatTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  createCustomTemplate(template: Omit<BeatTemplate, 'id'>): BeatTemplate {
    const newTemplate: BeatTemplate = {
      ...template,
      id: `template-${Date.now()}`,
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  private getNextPosition(sceneId: string): number {
    const sceneBeats = this.beats.get(sceneId) || [];
    return sceneBeats.length;
  }

  // Default templates
  // Reset method for testing
  reset(): void {
    this.beats.clear();
    this.beatCounter = 0;
    this.templates = this.getDefaultTemplates();
  }

  private getDefaultTemplates(): BeatTemplate[] {
    return [
      {
        id: 'action-sequence',
        name: 'Action Sequence',
        description: 'High-energy action scene with conflict and resolution',
        category: 'action',
        beats: [
          { type: 'description', content: 'Set the scene - danger approaches in [LOCATION]' },
          { type: 'action', content: '[CHARACTER] reacts to the threat' },
          { type: 'conflict', content: 'The conflict escalates within [LOCATION]' },
          { type: 'action', content: '[CHARACTER] fights back or tries to escape' },
          { type: 'transition', content: 'The aftermath - what changed?' },
        ],
      },
      {
        id: 'dialogue-heavy',
        name: 'Dialogue Scene',
        description: 'Character-driven scene focused on conversation and revelation',
        category: 'dialogue',
        beats: [
          { type: 'description', content: 'Set the scene in [LOCATION] - where and when' },
          { type: 'dialogue', content: '[CHARACTER] opens the conversation' },
          { type: 'emotion', content: 'Show emotional reaction' },
          { type: 'dialogue', content: 'Response reveals information or conflict' },
          { type: 'dialogue', content: 'The conversation reaches its climax' },
          { type: 'transition', content: 'How the conversation ends' },
        ],
      },
      {
        id: 'tension-builder',
        name: 'Tension Building',
        description: 'Gradually build suspense and anticipation',
        category: 'tension',
        beats: [
          { type: 'description', content: 'Establish normal atmosphere' },
          { type: 'description', content: 'First hint something is wrong' },
          { type: 'emotion', content: '[CHARACTER] feels uneasy' },
          { type: 'description', content: 'Another sign of danger' },
          { type: 'conflict', content: 'The threat is revealed' },
        ],
      },
      {
        id: 'emotional-moment',
        name: 'Emotional Moment',
        description: 'Character experiences strong emotions',
        category: 'emotional',
        beats: [
          { type: 'description', content: 'Set the emotional context' },
          { type: 'emotion', content: '[CHARACTER] experiences the emotion' },
          { type: 'description', content: 'Physical manifestation of emotion' },
          { type: 'dialogue', content: 'Internal or external voice' },
          { type: 'transition', content: 'How the emotion resolves or changes' },
        ],
      },
      {
        id: 'scene-transition',
        name: 'Scene Transition',
        description: 'Smooth transition between scenes or time periods',
        category: 'transition',
        beats: [
          { type: 'description', content: 'Close the current scene' },
          { type: 'transition', content: 'Bridge to new time/place' },
          { type: 'description', content: 'Establish new scene setting' },
        ],
      },
    ];
  }
}

export const sceneBeatService = new SceneBeatService();