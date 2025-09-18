import { EventEmitter } from 'events';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: 'static' | 'dynamic' | 'intelligent';
  content: string;
  variables?: TemplateVariable[];
  snippets?: Snippet[];
  metadata: TemplateMetadata;
  usage: UsageStatistics;
  ai?: AIConfiguration;
  customizable: boolean;
  tags: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory = 
  | 'story' | 'chapter' | 'scene' | 'character' | 'dialogue'
  | 'description' | 'outline' | 'synopsis' | 'query' | 'proposal'
  | 'blog' | 'article' | 'essay' | 'report' | 'email'
  | 'custom';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'list';
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required: boolean;
  options?: string[];
  validation?: ValidationRule;
  description?: string;
}

export interface ValidationRule {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: any) => boolean;
  message: string;
}

export interface Snippet {
  id: string;
  name: string;
  trigger: string;
  content: string;
  description?: string;
  category: string;
  expandOn: 'tab' | 'space' | 'enter' | 'manual';
  variables?: SnippetVariable[];
  contextual: boolean;
  frequency: number;
  lastUsed?: Date;
}

export interface SnippetVariable {
  name: string;
  position: number;
  defaultValue?: string;
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'camelCase' | 'snakeCase';
}

export interface TemplateMetadata {
  author?: string;
  genre?: string;
  wordCount?: number;
  estimatedTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  tone?: string;
  audience?: string;
}

export interface UsageStatistics {
  timesUsed: number;
  lastUsed?: Date;
  averageRating?: number;
  completionRate?: number;
  averageTimeToComplete?: number;
  popularVariables?: { [key: string]: any };
}

export interface AIConfiguration {
  enabled: boolean;
  autoFill: boolean;
  suggestions: boolean;
  adaptToContext: boolean;
  learningEnabled: boolean;
  creativityLevel: number;
  model?: string;
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  name: string;
  content: string;
  variables: { [key: string]: any };
  createdAt: Date;
  modifiedAt: Date;
  completed: boolean;
  wordCount: number;
  metadata?: any;
}

export interface SmartSuggestion {
  id: string;
  type: 'template' | 'snippet' | 'completion';
  suggestion: string | Template | Snippet;
  confidence: number;
  reason: string;
  context: SuggestionContext;
  priority: number;
}

export interface SuggestionContext {
  currentText: string;
  cursorPosition: number;
  recentWords: string[];
  documentType?: string;
  writingGoal?: string;
  timeOfDay?: string;
  mood?: string;
}

export interface TemplateLibrary {
  templates: Template[];
  categories: CategoryInfo[];
  featured: Template[];
  recent: Template[];
  favorites: string[];
  custom: Template[];
}

export interface CategoryInfo {
  name: string;
  count: number;
  icon?: string;
  description?: string;
  templates: string[];
}

export interface SnippetLibrary {
  snippets: Snippet[];
  categories: string[];
  triggers: Map<string, string>;
  contextualSnippets: Map<string, Snippet[]>;
  frequentlyUsed: Snippet[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  conditions?: AutomationCondition[];
  enabled: boolean;
  priority: number;
}

export interface AutomationTrigger {
  type: 'text' | 'time' | 'event' | 'pattern';
  value: string;
  parameters?: any;
}

export interface AutomationAction {
  type: 'insert-template' | 'suggest-snippet' | 'format' | 'transform' | 'custom';
  templateId?: string;
  snippetId?: string;
  parameters?: any;
}

export interface AutomationCondition {
  type: 'context' | 'time' | 'word-count' | 'custom';
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'matches';
  value: any;
}

export interface TemplateBuilder {
  id: string;
  name: string;
  draft: Partial<Template>;
  preview: string;
  validation: ValidationResult[];
  suggestions: BuilderSuggestion[];
}

export interface ValidationResult {
  field: string;
  valid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface BuilderSuggestion {
  type: 'variable' | 'snippet' | 'structure' | 'content';
  suggestion: string;
  description: string;
  apply: () => void;
}

class SmartTemplatesService extends EventEmitter {
  private templates: Map<string, Template> = new Map();
  private snippets: Map<string, Snippet> = new Map();
  private instances: Map<string, TemplateInstance> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private library: TemplateLibrary;
  private snippetLibrary: SnippetLibrary;
  private activeBuilder: TemplateBuilder | null = null;
  private suggestionEngine: SuggestionEngine;
  private learningData: Map<string, any> = new Map();

  constructor() {
    super();
    this.library = this.initializeLibrary();
    this.snippetLibrary = this.initializeSnippetLibrary();
    this.suggestionEngine = new SuggestionEngine();
    this.initializeDefaultTemplates();
    this.initializeDefaultSnippets();
    this.loadUserData();
  }

  private initializeLibrary(): TemplateLibrary {
    return {
      templates: [],
      categories: [],
      featured: [],
      recent: [],
      favorites: [],
      custom: []
    };
  }

  private initializeSnippetLibrary(): SnippetLibrary {
    return {
      snippets: [],
      categories: [],
      triggers: new Map(),
      contextualSnippets: new Map(),
      frequentlyUsed: []
    };
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Template[] = [
      {
        id: 'tpl-story-opening',
        name: 'Story Opening',
        description: 'Engaging story opening with hook',
        category: 'story',
        type: 'intelligent',
        content: `# {{title}}

{{hook}}

{{setting_description}}

{{character_introduction}}

{{inciting_incident}}`,
        variables: [
          {
            name: 'title',
            type: 'text',
            label: 'Story Title',
            required: true,
            validation: {
              maxLength: 100,
              message: 'Title must be under 100 characters'
            }
          },
          {
            name: 'hook',
            type: 'text',
            label: 'Opening Hook',
            placeholder: 'A compelling first line',
            required: true,
            validation: {
              minLength: 10,
              message: 'Hook should be at least 10 characters'
            }
          },
          {
            name: 'setting_description',
            type: 'text',
            label: 'Setting Description',
            placeholder: 'Where and when the story takes place',
            required: false
          },
          {
            name: 'character_introduction',
            type: 'text',
            label: 'Main Character Introduction',
            required: false
          },
          {
            name: 'inciting_incident',
            type: 'text',
            label: 'Inciting Incident',
            placeholder: 'The event that starts the story',
            required: false
          }
        ],
        metadata: {
          genre: 'fiction',
          difficulty: 'intermediate',
          estimatedTime: 30
        },
        usage: {
          timesUsed: 0,
          completionRate: 0
        },
        ai: {
          enabled: true,
          autoFill: true,
          suggestions: true,
          adaptToContext: true,
          learningEnabled: true,
          creativityLevel: 0.7
        },
        customizable: true,
        tags: ['opening', 'beginning', 'hook', 'story'],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tpl-character-profile',
        name: 'Character Profile',
        description: 'Comprehensive character development template',
        category: 'character',
        type: 'dynamic',
        content: `## Character Profile: {{name}}

### Basic Information
- **Full Name:** {{full_name}}
- **Age:** {{age}}
- **Occupation:** {{occupation}}
- **Location:** {{location}}

### Physical Description
{{physical_description}}

### Personality
- **Core Traits:** {{traits}}
- **Strengths:** {{strengths}}
- **Weaknesses:** {{weaknesses}}
- **Fears:** {{fears}}
- **Desires:** {{desires}}

### Background
{{backstory}}

### Relationships
{{relationships}}

### Character Arc
{{character_arc}}

### Notable Quotes
{{quotes}}`,
        variables: [
          {
            name: 'name',
            type: 'text',
            label: 'Character Name',
            required: true
          },
          {
            name: 'age',
            type: 'number',
            label: 'Age',
            required: false,
            validation: {
              min: 0,
              max: 150,
              message: 'Age must be between 0 and 150'
            }
          },
          {
            name: 'traits',
            type: 'list',
            label: 'Personality Traits',
            required: false
          }
        ],
        metadata: {
          genre: 'character',
          difficulty: 'beginner'
        },
        usage: {
          timesUsed: 0,
          completionRate: 0
        },
        customizable: true,
        tags: ['character', 'profile', 'development'],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tpl-scene-structure',
        name: 'Scene Structure',
        description: 'Well-structured scene template',
        category: 'scene',
        type: 'dynamic',
        content: `## Scene {{scene_number}}: {{scene_title}}

### Scene Goal
{{goal}}

### Setting
- **Location:** {{location}}
- **Time:** {{time}}
- **Atmosphere:** {{atmosphere}}

### Characters Present
{{characters}}

### Opening
{{opening}}

### Rising Action
{{rising_action}}

### Climax/Turning Point
{{climax}}

### Resolution
{{resolution}}

### Hook to Next Scene
{{hook}}`,
        variables: [
          {
            name: 'scene_number',
            type: 'number',
            label: 'Scene Number',
            required: false
          },
          {
            name: 'scene_title',
            type: 'text',
            label: 'Scene Title',
            required: true
          }
        ],
        metadata: {
          difficulty: 'intermediate'
        },
        usage: {
          timesUsed: 0,
          completionRate: 0
        },
        customizable: true,
        tags: ['scene', 'structure', 'planning'],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
      this.library.templates.push(template);
    });

    this.updateLibraryCategories();
  }

  private initializeDefaultSnippets(): void {
    const defaultSnippets: Snippet[] = [
      {
        id: 'snip-dialogue-tag',
        name: 'Dialogue Tag',
        trigger: 'dt',
        content: '", ${1:said} ${2:character}, "${3:}',
        description: 'Quick dialogue tag insertion',
        category: 'dialogue',
        expandOn: 'tab',
        variables: [
          { name: 'said', position: 1, defaultValue: 'said' },
          { name: 'character', position: 2 },
          { name: 'continuation', position: 3 }
        ],
        contextual: false,
        frequency: 0
      },
      {
        id: 'snip-transition',
        name: 'Scene Transition',
        trigger: 'trans',
        content: '\n\n* * *\n\n${1:}',
        description: 'Scene break transition',
        category: 'structure',
        expandOn: 'tab',
        variables: [
          { name: 'next_scene', position: 1 }
        ],
        contextual: false,
        frequency: 0
      },
      {
        id: 'snip-description',
        name: 'Sensory Description',
        trigger: 'sense',
        content: 'The ${1:sight/sound/smell/taste/touch} of ${2:object} ${3:action/quality}',
        description: 'Sensory detail snippet',
        category: 'description',
        expandOn: 'tab',
        variables: [
          { name: 'sense', position: 1, defaultValue: 'sight' },
          { name: 'object', position: 2 },
          { name: 'quality', position: 3 }
        ],
        contextual: true,
        frequency: 0
      },
      {
        id: 'snip-emotion',
        name: 'Show Emotion',
        trigger: 'emo',
        content: '${1:Character}\'s ${2:body_part} ${3:action}, ${4:revealing/betraying/showing} ${5:emotion}.',
        description: 'Show emotion through action',
        category: 'character',
        expandOn: 'tab',
        variables: [
          { name: 'character', position: 1 },
          { name: 'body_part', position: 2, defaultValue: 'hands' },
          { name: 'action', position: 3, defaultValue: 'trembled' },
          { name: 'verb', position: 4, defaultValue: 'revealing' },
          { name: 'emotion', position: 5 }
        ],
        contextual: true,
        frequency: 0
      },
      {
        id: 'snip-time-pass',
        name: 'Time Passage',
        trigger: 'time',
        content: '${1:Hours/Days/Weeks/Months} ${2:passed/later/went by}, and ${3:}',
        description: 'Indicate time passage',
        category: 'transition',
        expandOn: 'tab',
        variables: [
          { name: 'duration', position: 1, defaultValue: 'Days' },
          { name: 'verb', position: 2, defaultValue: 'passed' },
          { name: 'continuation', position: 3 }
        ],
        contextual: false,
        frequency: 0
      }
    ];

    defaultSnippets.forEach(snippet => {
      this.snippets.set(snippet.id, snippet);
      this.snippetLibrary.snippets.push(snippet);
      this.snippetLibrary.triggers.set(snippet.trigger, snippet.id);
    });

    this.updateSnippetCategories();
  }

  private updateLibraryCategories(): void {
    const categories: Map<string, CategoryInfo> = new Map();

    this.templates.forEach(template => {
      if (!categories.has(template.category)) {
        categories.set(template.category, {
          name: template.category,
          count: 0,
          templates: []
        });
      }

      const category = categories.get(template.category)!;
      category.count++;
      category.templates.push(template.id);
    });

    this.library.categories = Array.from(categories.values());
  }

  private updateSnippetCategories(): void {
    const categories = new Set<string>();
    this.snippets.forEach(snippet => {
      categories.add(snippet.category);
    });
    this.snippetLibrary.categories = Array.from(categories);
  }

  private loadUserData(): void {
    const savedTemplates = localStorage.getItem('smartTemplates');
    if (savedTemplates) {
      const parsed = JSON.parse(savedTemplates);
      Object.entries(parsed).forEach(([id, template]) => {
        this.templates.set(id, template as Template);
      });
    }

    const savedSnippets = localStorage.getItem('smartSnippets');
    if (savedSnippets) {
      const parsed = JSON.parse(savedSnippets);
      Object.entries(parsed).forEach(([id, snippet]) => {
        this.snippets.set(id, snippet as Snippet);
      });
    }

    const savedInstances = localStorage.getItem('templateInstances');
    if (savedInstances) {
      const parsed = JSON.parse(savedInstances);
      Object.entries(parsed).forEach(([id, instance]) => {
        this.instances.set(id, instance as TemplateInstance);
      });
    }

    const savedRules = localStorage.getItem('automationRules');
    if (savedRules) {
      const parsed = JSON.parse(savedRules);
      Object.entries(parsed).forEach(([id, rule]) => {
        this.automationRules.set(id, rule as AutomationRule);
      });
    }
  }

  private saveData(): void {
    localStorage.setItem('smartTemplates', 
      JSON.stringify(Object.fromEntries(this.templates))
    );
    localStorage.setItem('smartSnippets', 
      JSON.stringify(Object.fromEntries(this.snippets))
    );
    localStorage.setItem('templateInstances', 
      JSON.stringify(Object.fromEntries(this.instances))
    );
    localStorage.setItem('automationRules', 
      JSON.stringify(Object.fromEntries(this.automationRules))
    );
  }

  public createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Template {
    const newTemplate: Template = {
      ...template,
      id: `tpl-${Date.now()}`,
      usage: {
        timesUsed: 0,
        completionRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    this.library.templates.push(newTemplate);
    this.library.custom.push(newTemplate);
    this.updateLibraryCategories();
    this.saveData();

    this.emit('templateCreated', newTemplate);
    return newTemplate;
  }

  public instantiateTemplate(templateId: string, variables: { [key: string]: any }): TemplateInstance {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    // Process template content with variables
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value || '');
    });

    // Create instance
    const instance: TemplateInstance = {
      id: `inst-${Date.now()}`,
      templateId,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      content,
      variables,
      createdAt: new Date(),
      modifiedAt: new Date(),
      completed: false,
      wordCount: content.split(/\s+/).length
    };

    this.instances.set(instance.id, instance);
    
    // Update template usage
    template.usage.timesUsed++;
    template.usage.lastUsed = new Date();
    
    // Learn from usage
    if (template.ai?.learningEnabled) {
      this.learnFromUsage(template, variables);
    }

    this.saveData();
    this.emit('templateInstantiated', instance);

    return instance;
  }

  private learnFromUsage(template: Template, variables: { [key: string]: any }): void {
    const learningKey = `template-${template.id}`;
    const data = this.learningData.get(learningKey) || { variables: {} };

    // Track popular variable values
    Object.entries(variables).forEach(([key, value]) => {
      if (!data.variables[key]) data.variables[key] = {};
      data.variables[key][value] = (data.variables[key][value] || 0) + 1;
    });

    this.learningData.set(learningKey, data);

    // Update template with popular variables
    if (template.usage.timesUsed > 5) {
      template.usage.popularVariables = {};
      Object.entries(data.variables).forEach(([key, values]: [string, any]) => {
        const sorted = Object.entries(values).sort((a: any, b: any) => b[1] - a[1]);
        if (sorted.length > 0) {
          template.usage.popularVariables![key] = sorted[0][0];
        }
      });
    }
  }

  public expandSnippet(trigger: string, context?: string): string | null {
    const snippetId = this.snippetLibrary.triggers.get(trigger);
    if (!snippetId) return null;

    const snippet = this.snippets.get(snippetId);
    if (!snippet) return null;

    // Update usage statistics
    snippet.frequency++;
    snippet.lastUsed = new Date();

    // Process snippet content
    let content = snippet.content;
    
    // Apply variable transformations if needed
    snippet.variables?.forEach(variable => {
      if (variable.defaultValue) {
        const transformed = this.transformVariable(variable.defaultValue, variable.transform);
        content = content.replace(`\${${variable.position}:${variable.name}}`, transformed);
      }
    });

    this.saveData();
    this.emit('snippetExpanded', snippet);

    return content;
  }

  private transformVariable(value: string, transform?: string): string {
    if (!transform) return value;

    switch (transform) {
      case 'uppercase': return value.toUpperCase();
      case 'lowercase': return value.toLowerCase();
      case 'capitalize': return value.charAt(0).toUpperCase() + value.slice(1);
      case 'camelCase': return value.replace(/[-_\s]+(.)?/g, (_, c) => c?.toUpperCase() || '');
      case 'snakeCase': return value.toLowerCase().replace(/[\s-]/g, '_');
      default: return value;
    }
  }

  public getSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Suggest templates based on context
    const templateSuggestions = this.suggestTemplates(context);
    suggestions.push(...templateSuggestions);

    // Suggest snippets based on current text
    const snippetSuggestions = this.suggestSnippets(context);
    suggestions.push(...snippetSuggestions);

    // Sort by priority and confidence
    return suggestions.sort((a, b) => {
      const scoreA = a.priority * a.confidence;
      const scoreB = b.priority * b.confidence;
      return scoreB - scoreA;
    }).slice(0, 5);
  }

  private suggestTemplates(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Check for template triggers
    if (context.currentText.toLowerCase().includes('new chapter')) {
      const chapterTemplate = Array.from(this.templates.values())
        .find(t => t.category === 'chapter');
      
      if (chapterTemplate) {
        suggestions.push({
          id: `sug-${Date.now()}-1`,
          type: 'template',
          suggestion: chapterTemplate,
          confidence: 0.9,
          reason: 'You mentioned starting a new chapter',
          context,
          priority: 1
        });
      }
    }

    // Suggest based on document type
    if (context.documentType === 'story' && context.currentText.length < 100) {
      const openingTemplate = this.templates.get('tpl-story-opening');
      if (openingTemplate) {
        suggestions.push({
          id: `sug-${Date.now()}-2`,
          type: 'template',
          suggestion: openingTemplate,
          confidence: 0.7,
          reason: 'Start your story with a strong opening',
          context,
          priority: 0.8
        });
      }
    }

    return suggestions;
  }

  private suggestSnippets(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const lastWord = context.recentWords[context.recentWords.length - 1]?.toLowerCase();

    // Check for snippet triggers
    this.snippetLibrary.triggers.forEach((snippetId, trigger) => {
      if (lastWord && trigger.startsWith(lastWord)) {
        const snippet = this.snippets.get(snippetId);
        if (snippet) {
          suggestions.push({
            id: `sug-${Date.now()}-snip-${snippet.id}`,
            type: 'snippet',
            suggestion: snippet,
            confidence: 0.8,
            reason: `Type '${trigger}' to expand`,
            context,
            priority: 0.9
          });
        }
      }
    });

    // Contextual suggestions
    if (context.currentText.includes('"') && !context.currentText.includes('said')) {
      const dialogueSnippet = this.snippets.get('snip-dialogue-tag');
      if (dialogueSnippet) {
        suggestions.push({
          id: `sug-${Date.now()}-dialogue`,
          type: 'snippet',
          suggestion: dialogueSnippet,
          confidence: 0.6,
          reason: 'Add a dialogue tag',
          context,
          priority: 0.7
        });
      }
    }

    return suggestions;
  }

  public createSnippet(snippet: Omit<Snippet, 'id' | 'frequency' | 'lastUsed'>): Snippet {
    const newSnippet: Snippet = {
      ...snippet,
      id: `snip-${Date.now()}`,
      frequency: 0
    };

    this.snippets.set(newSnippet.id, newSnippet);
    this.snippetLibrary.snippets.push(newSnippet);
    this.snippetLibrary.triggers.set(newSnippet.trigger, newSnippet.id);
    this.updateSnippetCategories();
    this.saveData();

    this.emit('snippetCreated', newSnippet);
    return newSnippet;
  }

  public createAutomationRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };

    this.automationRules.set(newRule.id, newRule);
    this.saveData();
    this.emit('ruleCreated', newRule);

    return newRule;
  }

  public processAutomation(context: SuggestionContext): AutomationAction | null {
    let triggeredAction: AutomationAction | null = null;
    let highestPriority = -1;

    this.automationRules.forEach(rule => {
      if (!rule.enabled) return;

      if (this.checkTrigger(rule.trigger, context)) {
        if (this.checkConditions(rule.conditions, context)) {
          if (rule.priority > highestPriority) {
            triggeredAction = rule.action;
            highestPriority = rule.priority;
          }
        }
      }
    });

    if (triggeredAction) {
      this.executeAction(triggeredAction, context);
    }

    return triggeredAction;
  }

  private checkTrigger(trigger: AutomationTrigger, context: SuggestionContext): boolean {
    switch (trigger.type) {
      case 'text':
        return context.currentText.includes(trigger.value);
      case 'pattern':
        const regex = new RegExp(trigger.value, 'i');
        return regex.test(context.currentText);
      case 'time':
        const hour = new Date().getHours();
        return hour.toString() === trigger.value;
      default:
        return false;
    }
  }

  private checkConditions(conditions: AutomationCondition[] | undefined, context: SuggestionContext): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      switch (condition.type) {
        case 'context':
          return context.documentType === condition.value;
        case 'word-count':
          const wordCount = context.currentText.split(/\s+/).length;
          return this.compareValues(wordCount, condition.operator, condition.value);
        default:
          return true;
      }
    });
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'contains': return actual.includes(expected);
      case 'greater': return actual > expected;
      case 'less': return actual < expected;
      case 'matches': return new RegExp(expected).test(actual);
      default: return false;
    }
  }

  private executeAction(action: AutomationAction, context: SuggestionContext): void {
    switch (action.type) {
      case 'insert-template':
        if (action.templateId) {
          this.emit('insertTemplate', action.templateId);
        }
        break;
      case 'suggest-snippet':
        if (action.snippetId) {
          this.emit('suggestSnippet', action.snippetId);
        }
        break;
      case 'format':
        this.emit('formatText', action.parameters);
        break;
      case 'transform':
        this.emit('transformText', action.parameters);
        break;
    }
  }

  public startTemplateBuilder(name: string): TemplateBuilder {
    this.activeBuilder = {
      id: `builder-${Date.now()}`,
      name,
      draft: {
        name,
        category: 'custom',
        type: 'dynamic'
      },
      preview: '',
      validation: [],
      suggestions: []
    };

    this.generateBuilderSuggestions();
    this.emit('builderStarted', this.activeBuilder);

    return this.activeBuilder;
  }

  private generateBuilderSuggestions(): void {
    if (!this.activeBuilder) return;

    this.activeBuilder.suggestions = [
      {
        type: 'variable',
        suggestion: 'Add a title variable',
        description: 'Include a {{title}} variable for the document title',
        apply: () => {
          if (this.activeBuilder?.draft) {
            this.activeBuilder.draft.variables = this.activeBuilder.draft.variables || [];
            this.activeBuilder.draft.variables.push({
              name: 'title',
              type: 'text',
              label: 'Title',
              required: true
            });
          }
        }
      },
      {
        type: 'structure',
        suggestion: 'Add section headers',
        description: 'Include markdown headers for organization',
        apply: () => {
          if (this.activeBuilder?.draft) {
            this.activeBuilder.draft.content = (this.activeBuilder.draft.content || '') + '\n\n## Section Title\n\n';
          }
        }
      }
    ];
  }

  public updateBuilder(updates: Partial<Template>): ValidationResult[] {
    if (!this.activeBuilder) return [];

    this.activeBuilder.draft = { ...this.activeBuilder.draft, ...updates };
    this.activeBuilder.validation = this.validateTemplate(this.activeBuilder.draft);
    this.activeBuilder.preview = this.generatePreview(this.activeBuilder.draft);

    this.emit('builderUpdated', this.activeBuilder);

    return this.activeBuilder.validation;
  }

  private validateTemplate(draft: Partial<Template>): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (!draft.name) {
      results.push({
        field: 'name',
        valid: false,
        message: 'Template name is required',
        severity: 'error'
      });
    }

    if (!draft.content) {
      results.push({
        field: 'content',
        valid: false,
        message: 'Template content is required',
        severity: 'error'
      });
    }

    if (draft.variables) {
      draft.variables.forEach((variable, index) => {
        if (!variable.name) {
          results.push({
            field: `variables[${index}].name`,
            valid: false,
            message: `Variable ${index + 1} needs a name`,
            severity: 'error'
          });
        }
      });
    }

    return results;
  }

  private generatePreview(draft: Partial<Template>): string {
    if (!draft.content) return '';

    let preview = draft.content;
    
    // Replace variables with sample values
    if (draft.variables) {
      draft.variables.forEach(variable => {
        const sampleValue = this.getSampleValue(variable);
        const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
        preview = preview.replace(regex, sampleValue);
      });
    }

    return preview;
  }

  private getSampleValue(variable: TemplateVariable): string {
    switch (variable.type) {
      case 'text': return variable.placeholder || `[${variable.label || variable.name}]`;
      case 'number': return '42';
      case 'date': return new Date().toLocaleDateString();
      case 'select': return variable.options?.[0] || '[Option]';
      case 'boolean': return 'true';
      case 'list': return '[Item 1, Item 2, Item 3]';
      default: return `[${variable.name}]`;
    }
  }

  public finalizeBuilder(): Template | null {
    if (!this.activeBuilder) return null;

    const validation = this.validateTemplate(this.activeBuilder.draft);
    if (validation.some(v => v.severity === 'error')) {
      return null;
    }

    const template = this.createTemplate(this.activeBuilder.draft as Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usage'>);
    
    this.activeBuilder = null;
    this.emit('builderFinalized', template);

    return template;
  }

  public getTemplatesByCategory(category: TemplateCategory): Template[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  public getFrequentSnippets(limit: number = 10): Snippet[] {
    return Array.from(this.snippets.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  public searchTemplates(query: string): Template[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  public exportTemplates(): string {
    return JSON.stringify({
      templates: Array.from(this.templates.values()),
      snippets: Array.from(this.snippets.values()),
      automationRules: Array.from(this.automationRules.values()),
      exportDate: new Date()
    }, null, 2);
  }

  public importTemplates(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.templates) {
        parsed.templates.forEach((template: Template) => {
          this.templates.set(template.id, template);
        });
      }
      
      if (parsed.snippets) {
        parsed.snippets.forEach((snippet: Snippet) => {
          this.snippets.set(snippet.id, snippet);
          this.snippetLibrary.triggers.set(snippet.trigger, snippet.id);
        });
      }
      
      if (parsed.automationRules) {
        parsed.automationRules.forEach((rule: AutomationRule) => {
          this.automationRules.set(rule.id, rule);
        });
      }
      
      this.updateLibraryCategories();
      this.updateSnippetCategories();
      this.saveData();
      
      this.emit('templatesImported', { count: parsed.templates?.length || 0 });
      return true;
    } catch (error) {
      this.emit('importError', error);
      return false;
    }
  }
}

class SuggestionEngine {
  analyze(context: SuggestionContext): SmartSuggestion[] {
    // Placeholder for more sophisticated suggestion logic
    return [];
  }
}

export const smartTemplatesService = new SmartTemplatesService();
export default smartTemplatesService;