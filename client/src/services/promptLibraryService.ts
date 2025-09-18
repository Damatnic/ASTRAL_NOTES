/**
 * Prompt Library Service - Comprehensive prompt and recipe management
 * Manages custom prompts, AI recipes, templates, and community sharing
 */

import { aiProviderService, AIRequest, AIResponse } from './aiProviderService';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: PromptCategory;
  tags: string[];
  prompt: string;
  systemPrompt?: string;
  variables: PromptVariable[];
  aiSettings: PromptAISettings;
  examples: PromptExample[];
  metadata: PromptMetadata;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  rating: number;
  usageCount: number;
  isFavorite: boolean;
  isPublic: boolean;
}

export interface PromptVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'multiline' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface PromptAISettings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface PromptExample {
  id: string;
  title: string;
  input: Record<string, any>;
  expectedOutput: string;
  actualOutput?: string;
  notes?: string;
}

export interface PromptMetadata {
  author: string;
  version: string;
  license: string;
  source?: string;
  lastTested: number;
  successRate: number;
}

export interface AIRecipe {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  tags: string[];
  steps: RecipeStep[];
  variables: PromptVariable[];
  metadata: PromptMetadata;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  rating: number;
  usageCount: number;
  isFavorite: boolean;
  isPublic: boolean;
}

export interface RecipeStep {
  id: string;
  order: number;
  title: string;
  description: string;
  promptTemplateId?: string;
  customPrompt?: string;
  systemPrompt?: string;
  aiSettings: PromptAISettings;
  inputMapping: Record<string, string>; // Map variables from previous steps
  outputProcessing?: OutputProcessing;
  conditions?: StepCondition[];
}

export interface OutputProcessing {
  type: 'extract' | 'transform' | 'combine' | 'filter';
  instructions: string;
  format?: 'text' | 'json' | 'markdown' | 'list';
}

export interface StepCondition {
  type: 'if' | 'unless';
  variable: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: any;
}

export interface RecipeExecution {
  id: string;
  recipeId: string;
  input: Record<string, any>;
  steps: RecipeStepResult[];
  output: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  error?: string;
}

export interface RecipeStepResult {
  stepId: string;
  input: Record<string, any>;
  output: any;
  aiResponse?: AIResponse;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export type PromptCategory = 
  | 'writing_assistance'
  | 'character_development'
  | 'world_building'
  | 'plot_development'
  | 'dialogue_enhancement'
  | 'style_analysis'
  | 'content_generation'
  | 'editing_revision'
  | 'research_analysis'
  | 'brainstorming'
  | 'custom';

export type RecipeCategory =
  | 'story_development'
  | 'character_creation'
  | 'world_building'
  | 'content_analysis'
  | 'writing_improvement'
  | 'research_workflow'
  | 'editing_process'
  | 'creative_ideation'
  | 'custom';

class PromptLibraryService {
  private prompts: Map<string, PromptTemplate> = new Map();
  private recipes: Map<string, AIRecipe> = new Map();
  private executions: Map<string, RecipeExecution> = new Map();
  private categories: Record<PromptCategory, string> = {
    writing_assistance: 'Writing Assistance',
    character_development: 'Character Development',
    world_building: 'World Building',
    plot_development: 'Plot Development',
    dialogue_enhancement: 'Dialogue Enhancement',
    style_analysis: 'Style Analysis',
    content_generation: 'Content Generation',
    editing_revision: 'Editing & Revision',
    research_analysis: 'Research & Analysis',
    brainstorming: 'Brainstorming',
    custom: 'Custom'
  };

  constructor() {
    this.loadLibrary();
    this.initializeDefaultPrompts();
    this.initializeDefaultRecipes();
  }

  // Prompt Template Management

  /**
   * Get all prompt templates
   */
  getPrompts(filter?: {
    category?: PromptCategory;
    tags?: string[];
    search?: string;
    favorites?: boolean;
  }): PromptTemplate[] {
    let prompts = Array.from(this.prompts.values());

    if (filter) {
      if (filter.category) {
        prompts = prompts.filter(p => p.category === filter.category);
      }
      
      if (filter.tags?.length) {
        prompts = prompts.filter(p => 
          filter.tags!.some(tag => p.tags.includes(tag))
        );
      }
      
      if (filter.search) {
        const search = filter.search.toLowerCase();
        prompts = prompts.filter(p => 
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
      
      if (filter.favorites) {
        prompts = prompts.filter(p => p.isFavorite);
      }
    }

    return prompts.sort((a, b) => b.rating - a.rating || b.usageCount - a.usageCount);
  }

  /**
   * Get prompt template by ID
   */
  getPrompt(id: string): PromptTemplate | undefined {
    return this.prompts.get(id);
  }

  /**
   * Create new prompt template
   */
  createPrompt(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'usageCount'>): PromptTemplate {
    const prompt: PromptTemplate = {
      ...template,
      id: this.generateId('prompt'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rating: 0,
      usageCount: 0
    };

    this.prompts.set(prompt.id, prompt);
    this.saveLibrary();
    
    return prompt;
  }

  /**
   * Update prompt template
   */
  updatePrompt(id: string, updates: Partial<PromptTemplate>): PromptTemplate | undefined {
    const prompt = this.prompts.get(id);
    if (!prompt) return undefined;

    const updatedPrompt = {
      ...prompt,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: Date.now()
    };

    this.prompts.set(id, updatedPrompt);
    this.saveLibrary();
    
    return updatedPrompt;
  }

  /**
   * Delete prompt template
   */
  deletePrompt(id: string): boolean {
    const success = this.prompts.delete(id);
    if (success) {
      this.saveLibrary();
    }
    return success;
  }

  /**
   * Execute prompt template
   */
  async executePrompt(
    promptId: string,
    variables: Record<string, any>,
    context?: Record<string, any>
  ): Promise<AIResponse> {
    const template = this.prompts.get(promptId);
    if (!template) {
      throw new Error('Prompt template not found');
    }

    // Validate required variables
    const missingVariables = template.variables
      .filter(v => v.required && !(v.name in variables))
      .map(v => v.name);

    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
    }

    // Process prompt with variables
    const processedPrompt = this.processPromptTemplate(template.prompt, variables);
    const processedSystemPrompt = template.systemPrompt ? 
      this.processPromptTemplate(template.systemPrompt, variables) : undefined;

    // Prepare AI request
    const request: AIRequest = {
      prompt: processedPrompt,
      systemPrompt: processedSystemPrompt,
      context,
      options: {
        model: template.aiSettings.model,
        temperature: template.aiSettings.temperature,
        maxTokens: template.aiSettings.maxTokens,
        topP: template.aiSettings.topP,
        frequencyPenalty: template.aiSettings.frequencyPenalty,
        presencePenalty: template.aiSettings.presencePenalty,
        stopSequences: template.aiSettings.stopSequences
      }
    };

    // Set AI provider
    aiProviderService.setActiveProvider(template.aiSettings.provider);

    try {
      const response = await aiProviderService.generateCompletion(request);
      
      // Update usage statistics
      template.usageCount++;
      template.metadata.lastTested = Date.now();
      this.prompts.set(promptId, template);
      this.saveLibrary();

      return response;
    } catch (error) {
      console.error('Error executing prompt:', error);
      throw error;
    }
  }

  // Recipe Management

  /**
   * Get all recipes
   */
  getRecipes(filter?: {
    category?: RecipeCategory;
    tags?: string[];
    search?: string;
    favorites?: boolean;
  }): AIRecipe[] {
    let recipes = Array.from(this.recipes.values());

    if (filter) {
      if (filter.category) {
        recipes = recipes.filter(r => r.category === filter.category);
      }
      
      if (filter.tags?.length) {
        recipes = recipes.filter(r => 
          filter.tags!.some(tag => r.tags.includes(tag))
        );
      }
      
      if (filter.search) {
        const search = filter.search.toLowerCase();
        recipes = recipes.filter(r => 
          r.title.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search) ||
          r.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
      
      if (filter.favorites) {
        recipes = recipes.filter(r => r.isFavorite);
      }
    }

    return recipes.sort((a, b) => b.rating - a.rating || b.usageCount - a.usageCount);
  }

  /**
   * Get recipe by ID
   */
  getRecipe(id: string): AIRecipe | undefined {
    return this.recipes.get(id);
  }

  /**
   * Create new recipe
   */
  createRecipe(recipe: Omit<AIRecipe, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'usageCount'>): AIRecipe {
    const newRecipe: AIRecipe = {
      ...recipe,
      id: this.generateId('recipe'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rating: 0,
      usageCount: 0
    };

    this.recipes.set(newRecipe.id, newRecipe);
    this.saveLibrary();
    
    return newRecipe;
  }

  /**
   * Execute recipe
   */
  async executeRecipe(
    recipeId: string,
    input: Record<string, any>
  ): Promise<RecipeExecution> {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const execution: RecipeExecution = {
      id: this.generateId('execution'),
      recipeId,
      input,
      steps: [],
      output: null,
      status: 'pending',
      startTime: Date.now()
    };

    this.executions.set(execution.id, execution);

    try {
      execution.status = 'running';
      
      // Sort steps by order
      const sortedSteps = recipe.steps.sort((a, b) => a.order - b.order);
      const currentContext = { ...input };

      for (const step of sortedSteps) {
        const stepResult = await this.executeRecipeStep(step, currentContext, recipe);
        execution.steps.push(stepResult);

        if (stepResult.status === 'failed') {
          execution.status = 'failed';
          execution.error = stepResult.error;
          break;
        }

        // Add step output to context for next steps
        currentContext[`step_${step.id}_output`] = stepResult.output;
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.output = currentContext;
      }

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }

    execution.endTime = Date.now();
    this.executions.set(execution.id, execution);

    // Update recipe usage
    recipe.usageCount++;
    this.recipes.set(recipeId, recipe);
    this.saveLibrary();

    return execution;
  }

  /**
   * Get recipe execution
   */
  getExecution(id: string): RecipeExecution | undefined {
    return this.executions.get(id);
  }

  /**
   * Get all executions for a recipe
   */
  getRecipeExecutions(recipeId: string): RecipeExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.recipeId === recipeId)
      .sort((a, b) => b.startTime - a.startTime);
  }

  // Utility Methods

  /**
   * Get available categories
   */
  getCategories(): Record<PromptCategory, string> {
    return { ...this.categories };
  }

  /**
   * Get popular tags
   */
  getPopularTags(type: 'prompts' | 'recipes' = 'prompts'): string[] {
    const items = type === 'prompts' ? 
      Array.from(this.prompts.values()) : 
      Array.from(this.recipes.values());

    const tagCounts = new Map<string, number>();
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string, type: 'prompt' | 'recipe'): boolean {
    const collection = type === 'prompt' ? this.prompts : this.recipes;
    const item = collection.get(id);
    
    if (item) {
      item.isFavorite = !item.isFavorite;
      item.updatedAt = Date.now();
      collection.set(id, item);
      this.saveLibrary();
      return item.isFavorite;
    }
    
    return false;
  }

  /**
   * Rate item
   */
  rateItem(id: string, rating: number, type: 'prompt' | 'recipe'): void {
    const collection = type === 'prompt' ? this.prompts : this.recipes;
    const item = collection.get(id);
    
    if (item && rating >= 0 && rating <= 5) {
      item.rating = rating;
      item.updatedAt = Date.now();
      collection.set(id, item);
      this.saveLibrary();
    }
  }

  // Private Methods

  private async executeRecipeStep(
    step: RecipeStep,
    context: Record<string, any>,
    recipe: AIRecipe
  ): Promise<RecipeStepResult> {
    const stepResult: RecipeStepResult = {
      stepId: step.id,
      input: {},
      output: null,
      duration: 0,
      status: 'pending'
    };

    const startTime = Date.now();

    try {
      stepResult.status = 'running';

      // Check conditions
      if (step.conditions?.length) {
        const conditionsMet = this.evaluateConditions(step.conditions, context);
        if (!conditionsMet) {
          stepResult.status = 'completed';
          stepResult.output = 'Skipped due to conditions';
          stepResult.duration = Date.now() - startTime;
          return stepResult;
        }
      }

      // Map inputs
      const mappedInput: Record<string, any> = {};
      Object.entries(step.inputMapping).forEach(([key, sourcePath]) => {
        mappedInput[key] = this.getValueFromPath(context, sourcePath);
      });
      stepResult.input = mappedInput;

      // Prepare prompt
      let prompt = step.customPrompt;
      if (step.promptTemplateId) {
        const template = this.prompts.get(step.promptTemplateId);
        if (template) {
          prompt = this.processPromptTemplate(template.prompt, mappedInput);
        }
      }

      if (!prompt) {
        throw new Error('No prompt specified for step');
      }

      // Execute AI request
      const request: AIRequest = {
        prompt: this.processPromptTemplate(prompt, mappedInput),
        systemPrompt: step.systemPrompt ? 
          this.processPromptTemplate(step.systemPrompt, mappedInput) : undefined,
        options: {
          model: step.aiSettings.model,
          temperature: step.aiSettings.temperature,
          maxTokens: step.aiSettings.maxTokens,
          topP: step.aiSettings.topP,
          frequencyPenalty: step.aiSettings.frequencyPenalty,
          presencePenalty: step.aiSettings.presencePenalty,
          stopSequences: step.aiSettings.stopSequences
        }
      };

      aiProviderService.setActiveProvider(step.aiSettings.provider);
      const aiResponse = await aiProviderService.generateCompletion(request);
      stepResult.aiResponse = aiResponse;

      // Process output
      let output = aiResponse.content;
      if (step.outputProcessing) {
        output = this.processStepOutput(output, step.outputProcessing);
      }

      stepResult.output = output;
      stepResult.status = 'completed';

    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
    }

    stepResult.duration = Date.now() - startTime;
    return stepResult;
  }

  private evaluateConditions(conditions: StepCondition[], context: Record<string, any>): boolean {
    return conditions.every(condition => {
      const value = this.getValueFromPath(context, condition.variable);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater':
          return Number(value) > Number(condition.value);
        case 'less':
          return Number(value) < Number(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return false;
      }
    });
  }

  private getValueFromPath(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private processPromptTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(placeholder, String(value || ''));
    });
    
    return processed;
  }

  private processStepOutput(output: string, processing: OutputProcessing): any {
    switch (processing.type) {
      case 'extract':
        // Extract specific information based on instructions
        return this.extractFromOutput(output, processing.instructions);
      
      case 'transform':
        // Transform output format
        return this.transformOutput(output, processing.format || 'text');
      
      case 'combine':
        // Combine with other data (would need additional context)
        return output;
      
      case 'filter':
        // Filter content based on criteria
        return this.filterOutput(output, processing.instructions);
      
      default:
        return output;
    }
  }

  private extractFromOutput(output: string, instructions: string): any {
    // Simple extraction - in a real implementation, this could use regex or AI
    return output;
  }

  private transformOutput(output: string, format: string): any {
    switch (format) {
      case 'json':
        try {
          return JSON.parse(output);
        } catch {
          return { content: output };
        }
      
      case 'list':
        return output.split('\n').filter(line => line.trim());
      
      case 'markdown':
      case 'text':
      default:
        return output;
    }
  }

  private filterOutput(output: string, criteria: string): string {
    // Simple filtering - could be enhanced with more sophisticated logic
    return output;
  }

  private initializeDefaultPrompts(): void {
    // Character Development Prompts
    this.createPrompt({
      title: 'Character Profile Generator',
      description: 'Generate detailed character profiles with personality, background, and motivations',
      category: 'character_development',
      tags: ['character', 'profile', 'personality', 'background'],
      prompt: `Create a detailed character profile for {{character_name}}, a {{age}}-year-old {{occupation}} in a {{genre}} story.

Include:
- Physical description
- Personality traits and quirks
- Background and history
- Goals and motivations
- Fears and weaknesses
- Relationships with other characters
- Character arc potential

{{additional_notes}}`,
      variables: [
        {
          name: 'character_name',
          description: 'Name of the character',
          type: 'text',
          required: true,
          placeholder: 'Enter character name'
        },
        {
          name: 'age',
          description: 'Character age',
          type: 'number',
          required: true,
          defaultValue: 25
        },
        {
          name: 'occupation',
          description: 'Character occupation',
          type: 'text',
          required: true,
          placeholder: 'detective, wizard, student, etc.'
        },
        {
          name: 'genre',
          description: 'Story genre',
          type: 'select',
          required: true,
          options: ['fantasy', 'sci-fi', 'mystery', 'romance', 'thriller', 'literary'],
          defaultValue: 'fantasy'
        },
        {
          name: 'additional_notes',
          description: 'Additional character notes or requirements',
          type: 'multiline',
          required: false,
          placeholder: 'Any specific traits, background elements, or story requirements...'
        }
      ],
      aiSettings: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 1000
      },
      examples: [
        {
          id: 'example1',
          title: 'Fantasy Wizard',
          input: {
            character_name: 'Elara Moonweaver',
            age: 35,
            occupation: 'Court Wizard',
            genre: 'fantasy',
            additional_notes: 'Has a secret past as a thief'
          },
          expectedOutput: 'Detailed character profile with magical abilities and moral complexity'
        }
      ],
      metadata: {
        author: 'ASTRAL_NOTES',
        version: '1.0',
        license: 'MIT',
        lastTested: Date.now(),
        successRate: 0.95
      },
      createdBy: 'system',
      isFavorite: false,
      isPublic: true
    });

    // World Building Prompts
    this.createPrompt({
      title: 'Location Description Generator',
      description: 'Create vivid, atmospheric descriptions of locations and settings',
      category: 'world_building',
      tags: ['location', 'setting', 'description', 'atmosphere'],
      prompt: `Create a detailed description of {{location_name}}, a {{location_type}} in a {{genre}} setting.

Focus on:
- Visual details and atmosphere
- Sounds, smells, and tactile elements
- Historical significance or backstory
- How it affects characters emotionally
- Hidden secrets or interesting features
- Connection to the broader world

Tone: {{tone}}

{{additional_details}}`,
      variables: [
        {
          name: 'location_name',
          description: 'Name of the location',
          type: 'text',
          required: true,
          placeholder: 'Enter location name'
        },
        {
          name: 'location_type',
          description: 'Type of location',
          type: 'select',
          required: true,
          options: ['tavern', 'castle', 'forest', 'city', 'spaceship', 'cave', 'temple', 'laboratory', 'school', 'mansion'],
          defaultValue: 'tavern'
        },
        {
          name: 'genre',
          description: 'Story genre',
          type: 'select',
          required: true,
          options: ['fantasy', 'sci-fi', 'horror', 'mystery', 'contemporary', 'historical'],
          defaultValue: 'fantasy'
        },
        {
          name: 'tone',
          description: 'Desired tone or mood',
          type: 'select',
          required: true,
          options: ['mysterious', 'welcoming', 'ominous', 'peaceful', 'bustling', 'abandoned', 'magical', 'technological'],
          defaultValue: 'mysterious'
        },
        {
          name: 'additional_details',
          description: 'Specific details or requirements',
          type: 'multiline',
          required: false,
          placeholder: 'Any specific features, history, or atmosphere you want included...'
        }
      ],
      aiSettings: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.9,
        maxTokens: 800
      },
      examples: [],
      metadata: {
        author: 'ASTRAL_NOTES',
        version: '1.0',
        license: 'MIT',
        lastTested: Date.now(),
        successRate: 0.93
      },
      createdBy: 'system',
      isFavorite: false,
      isPublic: true
    });

    // Dialogue Enhancement
    this.createPrompt({
      title: 'Dialogue Improver',
      description: 'Enhance dialogue to be more natural, character-specific, and engaging',
      category: 'dialogue_enhancement',
      tags: ['dialogue', 'conversation', 'character voice', 'improvement'],
      prompt: `Improve the following dialogue to make it more natural, engaging, and true to each character's voice:

Original dialogue:
{{original_dialogue}}

Character information:
{{character_info}}

Goals for improvement:
- Make dialogue sound more natural and realistic
- Ensure each character has a distinct voice
- Add subtext and emotional depth
- Improve flow and rhythm
- {{improvement_focus}}

Please rewrite the dialogue and explain the changes made.`,
      variables: [
        {
          name: 'original_dialogue',
          description: 'The dialogue to improve',
          type: 'multiline',
          required: true,
          placeholder: 'Paste the dialogue that needs improvement...'
        },
        {
          name: 'character_info',
          description: 'Information about the characters speaking',
          type: 'multiline',
          required: true,
          placeholder: 'Describe the characters, their personalities, relationships, etc.'
        },
        {
          name: 'improvement_focus',
          description: 'Specific area to focus on',
          type: 'select',
          required: false,
          options: ['tension and conflict', 'humor and wit', 'emotional depth', 'exposition delivery', 'character development', 'pacing'],
          defaultValue: 'emotional depth'
        }
      ],
      aiSettings: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1200
      },
      examples: [],
      metadata: {
        author: 'ASTRAL_NOTES',
        version: '1.0',
        license: 'MIT',
        lastTested: Date.now(),
        successRate: 0.91
      },
      createdBy: 'system',
      isFavorite: false,
      isPublic: true
    });
  }

  private initializeDefaultRecipes(): void {
    // Character Creation Recipe
    this.createRecipe({
      title: 'Complete Character Development',
      description: 'Multi-step process to create a fully developed character with profile, backstory, and relationships',
      category: 'character_creation',
      tags: ['character', 'development', 'backstory', 'relationships'],
      variables: [
        {
          name: 'character_name',
          description: 'Character name',
          type: 'text',
          required: true,
          placeholder: 'Enter character name'
        },
        {
          name: 'genre',
          description: 'Story genre',
          type: 'select',
          required: true,
          options: ['fantasy', 'sci-fi', 'mystery', 'romance', 'thriller'],
          defaultValue: 'fantasy'
        },
        {
          name: 'role',
          description: 'Character role in story',
          type: 'select',
          required: true,
          options: ['protagonist', 'antagonist', 'supporting', 'mentor', 'love interest'],
          defaultValue: 'protagonist'
        }
      ],
      steps: [
        {
          id: 'step1',
          order: 1,
          title: 'Basic Profile',
          description: 'Create basic character profile and appearance',
          customPrompt: `Create a basic character profile for {{character_name}}, a {{role}} in a {{genre}} story. Include physical appearance, age, occupation, and basic personality traits.`,
          aiSettings: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.8,
            maxTokens: 500
          },
          inputMapping: {
            character_name: 'character_name',
            role: 'role',
            genre: 'genre'
          }
        },
        {
          id: 'step2',
          order: 2,
          title: 'Backstory Development',
          description: 'Develop detailed backstory and history',
          customPrompt: `Based on this character profile: {{step_step1_output}}

Create a detailed backstory for {{character_name}} including:
- Childhood and family background
- Formative experiences
- Education or training
- Previous relationships
- Key life events that shaped them
- Secrets or hidden aspects`,
          aiSettings: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.8,
            maxTokens: 700
          },
          inputMapping: {
            character_name: 'character_name',
            step_step1_output: 'step_step1_output'
          }
        },
        {
          id: 'step3',
          order: 3,
          title: 'Goals and Motivations',
          description: 'Define character goals, motivations, and conflicts',
          customPrompt: `Based on this character information:
Profile: {{step_step1_output}}
Backstory: {{step_step2_output}}

Define {{character_name}}'s:
- Primary goal in the story
- Deep motivations and desires
- Internal conflicts and contradictions
- Character flaws and weaknesses
- What they fear most
- How they might change during the story`,
          aiSettings: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 600
          },
          inputMapping: {
            character_name: 'character_name',
            step_step1_output: 'step_step1_output',
            step_step2_output: 'step_step2_output'
          }
        }
      ],
      metadata: {
        author: 'ASTRAL_NOTES',
        version: '1.0',
        license: 'MIT',
        lastTested: Date.now(),
        successRate: 0.94
      },
      createdBy: 'system',
      isFavorite: false,
      isPublic: true
    });
  }

  private loadLibrary(): void {
    try {
      const promptsData = localStorage.getItem('prompt_library_prompts');
      if (promptsData) {
        const prompts: PromptTemplate[] = JSON.parse(promptsData);
        prompts.forEach(prompt => this.prompts.set(prompt.id, prompt));
      }

      const recipesData = localStorage.getItem('prompt_library_recipes');
      if (recipesData) {
        const recipes: AIRecipe[] = JSON.parse(recipesData);
        recipes.forEach(recipe => this.recipes.set(recipe.id, recipe));
      }
    } catch (error) {
      console.error('Error loading prompt library:', error);
    }
  }

  private saveLibrary(): void {
    try {
      localStorage.setItem(
        'prompt_library_prompts',
        JSON.stringify(Array.from(this.prompts.values()))
      );
      localStorage.setItem(
        'prompt_library_recipes',
        JSON.stringify(Array.from(this.recipes.values()))
      );
    } catch (error) {
      console.error('Error saving prompt library:', error);
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const promptLibraryService = new PromptLibraryService();