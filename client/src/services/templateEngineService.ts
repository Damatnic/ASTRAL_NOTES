/**
 * Template Engine Service
 * Advanced template system for custom export layouts and formatting
 */

import type { Project, Story, Scene, Character, Location } from '@/types/story';

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  format: ExportFormat;
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isBuiltIn: boolean;
  isPublic: boolean;
  tags: string[];
  
  // Template Configuration
  layout: LayoutSettings;
  styles: StyleConfiguration;
  structure: StructureConfiguration;
  variables: TemplateVariable[];
  sections: TemplateSection[];
  
  // Preview and metadata
  preview?: string;
  thumbnail?: string;
  downloadCount?: number;
  rating?: number;
  reviews?: TemplateReview[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'color' | 'font';
  label: string;
  description?: string;
  defaultValue: any;
  required: boolean;
  options?: string[];
  validation?: ValidationRule;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: SectionType;
  template: string;
  condition?: string;
  order: number;
  enabled: boolean;
  variables?: Record<string, any>;
}

export interface LayoutSettings {
  pageSize: PageSize;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  columns: number;
  header?: HeaderFooterSettings;
  footer?: HeaderFooterSettings;
  pageNumbers: PageNumberSettings;
}

export interface StyleConfiguration {
  fonts: FontConfiguration;
  colors: ColorScheme;
  spacing: SpacingConfiguration;
  typography: TypographySettings;
  customCSS?: string;
}

export interface StructureConfiguration {
  titlePage: boolean;
  tableOfContents: boolean;
  chapterBreaks: boolean;
  sceneBreaks: boolean;
  includeMetadata: boolean;
  includeNotes: boolean;
  includeCharacters: boolean;
  includeLocations: boolean;
  customSections: CustomSection[];
}

export interface FontConfiguration {
  primary: FontDefinition;
  secondary: FontDefinition;
  monospace: FontDefinition;
  heading: FontDefinition;
}

export interface FontDefinition {
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
  variants?: FontVariant[];
}

export interface FontVariant {
  name: string;
  weight: number;
  style: 'normal' | 'italic';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  borders: string;
  links: string;
}

export interface SpacingConfiguration {
  paragraphSpacing: number;
  sectionSpacing: number;
  chapterSpacing: number;
  lineSpacing: number;
  indentation: number;
}

export interface TypographySettings {
  headings: HeadingStyles;
  paragraphs: ParagraphStyles;
  quotes: QuoteStyles;
  lists: ListStyles;
  emphasis: EmphasisStyles;
}

export interface HeadingStyles {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: number;
  color: string;
  spacing: SpacingSettings;
  decoration?: TextDecoration;
  transform?: TextTransform;
}

export interface SpacingSettings {
  marginTop: number;
  marginBottom: number;
  paddingTop: number;
  paddingBottom: number;
}

export interface ParagraphStyles {
  default: TextStyle;
  firstLine: TextStyle;
  dialogue: TextStyle;
  description: TextStyle;
}

export interface QuoteStyles {
  blockquote: TextStyle;
  inline: TextStyle;
  citation: TextStyle;
}

export interface ListStyles {
  ordered: ListStyle;
  unordered: ListStyle;
}

export interface ListStyle {
  item: TextStyle;
  marker: MarkerStyle;
  nesting: NestingStyle[];
}

export interface MarkerStyle {
  type: 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
  color: string;
  size: number;
}

export interface NestingStyle {
  level: number;
  marker: MarkerStyle;
  indentation: number;
}

export interface EmphasisStyles {
  bold: TextStyle;
  italic: TextStyle;
  underline: TextStyle;
  strikethrough: TextStyle;
  code: TextStyle;
}

export interface CustomSection {
  id: string;
  name: string;
  template: string;
  position: 'before' | 'after' | 'replace';
  target: string;
}

export interface PageNumberSettings {
  enabled: boolean;
  position: 'top' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  format: string;
  startPage: number;
  showOnFirstPage: boolean;
}

export interface HeaderFooterSettings {
  enabled: boolean;
  content: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  color: string;
  showOnFirstPage: boolean;
}

export interface TemplateReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface TemplateRenderContext {
  project: Project;
  stories: Story[];
  scenes: Scene[];
  characters?: Character[];
  locations?: Location[];
  variables: Record<string, any>;
  options: RenderOptions;
}

export interface RenderOptions {
  includeMetadata: boolean;
  includeNotes: boolean;
  includeCharacters: boolean;
  includeLocations: boolean;
  customSettings: Record<string, any>;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: TemplateError[];
  warnings: TemplateWarning[];
}

export interface TemplateError {
  section: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface TemplateWarning {
  section: string;
  message: string;
  suggestion: string;
}

export type TemplateCategory = 
  | 'manuscript' 
  | 'academic' 
  | 'publishing' 
  | 'screenplay' 
  | 'novel' 
  | 'blog' 
  | 'ebook' 
  | 'print' 
  | 'mobile'
  | 'custom';

export type ExportFormat = 
  | 'html' 
  | 'docx' 
  | 'pdf' 
  | 'epub' 
  | 'markdown' 
  | 'latex' 
  | 'rtf' 
  | 'odt';

export type SectionType = 
  | 'title-page' 
  | 'table-of-contents' 
  | 'chapter' 
  | 'scene' 
  | 'character-sheet' 
  | 'location-sheet' 
  | 'appendix' 
  | 'bibliography' 
  | 'index'
  | 'custom';

export type PageSize = 'A4' | 'Letter' | 'A5' | 'Legal' | 'Tabloid' | 'Custom';
export type Margins = { top: number; bottom: number; left: number; right: number; };
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export class TemplateEngineService {
  private static instance: TemplateEngineService;
  private templates: Map<string, ExportTemplate> = new Map();
  private templateCache: Map<string, string> = new Map();

  private constructor() {
    this.initializeBuiltInTemplates();
  }

  public static getInstance(): TemplateEngineService {
    if (!TemplateEngineService.instance) {
      TemplateEngineService.instance = new TemplateEngineService();
    }
    return TemplateEngineService.instance;
  }

  /**
   * Initialize built-in templates
   */
  private initializeBuiltInTemplates(): void {
    const builtInTemplates: ExportTemplate[] = [
      this.createManuscriptTemplate(),
      this.createAcademicTemplate(),
      this.createEbookTemplate(),
      this.createScreenplayTemplate(),
      this.createBlogTemplate(),
      this.createMinimalTemplate()
    ];

    builtInTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get all available templates
   */
  public getAllTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: TemplateCategory): ExportTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  /**
   * Get templates by format
   */
  public getTemplatesByFormat(format: ExportFormat): ExportTemplate[] {
    return this.getAllTemplates().filter(template => template.format === format);
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): ExportTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Create a new custom template
   */
  public createTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ExportTemplate {
    const newTemplate: ExportTemplate = {
      ...template,
      id: this.generateTemplateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  public updateTemplate(id: string, updates: Partial<ExportTemplate>): ExportTemplate | null {
    const template = this.templates.get(id);
    if (!template || template.isBuiltIn) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Delete a template
   */
  public deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template || template.isBuiltIn) {
      return false;
    }

    this.templates.delete(id);
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Validate template
   */
  public validateTemplate(template: ExportTemplate): TemplateValidationResult {
    const errors: TemplateError[] = [];
    const warnings: TemplateWarning[] = [];

    // Validate required fields
    if (!template.name?.trim()) {
      errors.push({
        section: 'general',
        message: 'Template name is required',
        severity: 'error'
      });
    }

    if (!template.format) {
      errors.push({
        section: 'general',
        message: 'Template format is required',
        severity: 'error'
      });
    }

    // Validate sections
    template.sections.forEach((section, index) => {
      if (!section.template?.trim()) {
        errors.push({
          section: `section-${index}`,
          message: `Section "${section.name}" template is empty`,
          severity: 'error'
        });
      }

      // Validate template syntax
      try {
        this.validateTemplateSyntax(section.template);
      } catch (error) {
        errors.push({
          section: `section-${index}`,
          message: `Template syntax error: ${error.message}`,
          severity: 'error'
        });
      }
    });

    // Validate variables
    template.variables.forEach((variable, index) => {
      if (!variable.name?.trim()) {
        errors.push({
          section: `variable-${index}`,
          message: 'Variable name is required',
          severity: 'error'
        });
      }

      if (variable.type === 'select' && (!variable.options || variable.options.length === 0)) {
        errors.push({
          section: `variable-${index}`,
          message: `Select variable "${variable.name}" must have options`,
          severity: 'error'
        });
      }
    });

    // Check for potential issues
    if (template.sections.length === 0) {
      warnings.push({
        section: 'structure',
        message: 'Template has no sections defined',
        suggestion: 'Add at least one section to define the template structure'
      });
    }

    if (template.variables.length === 0) {
      warnings.push({
        section: 'customization',
        message: 'Template has no customizable variables',
        suggestion: 'Add variables to make the template more flexible'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Render template with context
   */
  public async renderTemplate(
    templateId: string,
    context: TemplateRenderContext
  ): Promise<string> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(templateId, context);
    const cached = this.templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Render template
    const rendered = await this.performTemplateRendering(template, context);
    
    // Cache result
    this.templateCache.set(cacheKey, rendered);
    
    return rendered;
  }

  /**
   * Perform the actual template rendering
   */
  private async performTemplateRendering(
    template: ExportTemplate,
    context: TemplateRenderContext
  ): Promise<string> {
    const renderContext = this.createRenderContext(template, context);
    
    let output = '';

    // Render sections in order
    const sortedSections = template.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      if (this.shouldRenderSection(section, context)) {
        const sectionContent = await this.renderSection(section, renderContext);
        output += sectionContent + '\n';
      }
    }

    // Apply post-processing
    output = this.postProcessOutput(output, template, context);

    return output;
  }

  /**
   * Create render context with variables and helpers
   */
  private createRenderContext(
    template: ExportTemplate,
    context: TemplateRenderContext
  ): Record<string, any> {
    return {
      // Project data
      project: context.project,
      stories: context.stories,
      scenes: context.scenes,
      characters: context.characters || [],
      locations: context.locations || [],
      
      // Template variables
      ...context.variables,
      
      // Helper functions
      helpers: {
        formatDate: this.formatDate,
        wordCount: this.calculateWordCount,
        stripHtml: this.stripHtml,
        capitalize: this.capitalize,
        truncate: this.truncate,
        repeat: this.repeat,
        join: this.join,
        map: this.map,
        filter: this.filter,
        sort: this.sort,
        group: this.group,
        format: this.format
      },
      
      // Template metadata
      template: {
        name: template.name,
        version: template.version,
        author: template.author
      },
      
      // Rendering options
      options: context.options
    };
  }

  /**
   * Check if section should be rendered based on conditions
   */
  private shouldRenderSection(
    section: TemplateSection,
    context: TemplateRenderContext
  ): boolean {
    if (!section.condition) {
      return true;
    }

    try {
      // Simple condition evaluation
      return this.evaluateCondition(section.condition, context);
    } catch (error) {
      console.warn(`Failed to evaluate section condition: ${error.message}`);
      return true;
    }
  }

  /**
   * Render individual section
   */
  private async renderSection(
    section: TemplateSection,
    renderContext: Record<string, any>
  ): Promise<string> {
    try {
      return this.processTemplate(section.template, renderContext);
    } catch (error) {
      console.error(`Failed to render section "${section.name}":`, error);
      return `<!-- Error rendering section: ${section.name} -->`;
    }
  }

  /**
   * Process template string with handlebars-like syntax
   */
  private processTemplate(
    template: string,
    context: Record<string, any>
  ): string {
    let processed = template;

    // Simple variable substitution {{variable}}
    processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), context);
        return this.formatValue(value);
      } catch (error) {
        console.warn(`Failed to evaluate expression "${expression}":`, error);
        return match;
      }
    });

    // Simple loops {{#each items}}...{{/each}}
    processed = processed.replace(
      /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, listExpression, itemTemplate) => {
        try {
          const items = this.evaluateExpression(listExpression.trim(), context);
          if (!Array.isArray(items)) {
            return '';
          }

          return items.map((item, index) => {
            const itemContext = {
              ...context,
              '@index': index,
              '@first': index === 0,
              '@last': index === items.length - 1,
              'this': item,
              ...item
            };
            return this.processTemplate(itemTemplate, itemContext);
          }).join('');
        } catch (error) {
          console.warn(`Failed to process each loop:`, error);
          return match;
        }
      }
    );

    // Simple conditionals {{#if condition}}...{{/if}}
    processed = processed.replace(
      /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{#else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
      (match, condition, truthyTemplate, falsyTemplate = '') => {
        try {
          const result = this.evaluateExpression(condition.trim(), context);
          return result ? 
            this.processTemplate(truthyTemplate, context) : 
            this.processTemplate(falsyTemplate, context);
        } catch (error) {
          console.warn(`Failed to process if condition:`, error);
          return match;
        }
      }
    );

    return processed;
  }

  /**
   * Evaluate simple expressions
   */
  private evaluateExpression(expression: string, context: Record<string, any>): any {
    // Handle helper functions
    const helperMatch = expression.match(/^(\w+)\s*\((.*)\)$/);
    if (helperMatch) {
      const [, helperName, argsStr] = helperMatch;
      const helper = context.helpers[helperName];
      if (typeof helper === 'function') {
        const args = this.parseArguments(argsStr, context);
        return helper(...args);
      }
    }

    // Handle property access
    const path = expression.split('.');
    let value = context;
    
    for (const key of path) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Parse function arguments
   */
  private parseArguments(argsStr: string, context: Record<string, any>): any[] {
    if (!argsStr.trim()) {
      return [];
    }

    // Simple argument parsing (doesn't handle nested quotes/commas)
    const args = argsStr.split(',').map(arg => {
      const trimmed = arg.trim();
      
      // String literal
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }
      
      // Number literal
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
      }
      
      // Boolean literal
      if (trimmed === 'true' || trimmed === 'false') {
        return trimmed === 'true';
      }
      
      // Variable reference
      return this.evaluateExpression(trimmed, context);
    });

    return args;
  }

  /**
   * Evaluate simple conditions
   */
  private evaluateCondition(condition: string, context: TemplateRenderContext): boolean {
    // Simple condition evaluation for common cases
    switch (condition.toLowerCase()) {
      case 'options.includeMetadata':
        return context.options.includeMetadata;
      case 'options.includeNotes':
        return context.options.includeNotes;
      case 'options.includeCharacters':
        return context.options.includeCharacters;
      case 'options.includeLocations':
        return context.options.includeLocations;
      case 'characters.length > 0':
        return (context.characters?.length || 0) > 0;
      case 'locations.length > 0':
        return (context.locations?.length || 0) > 0;
      default:
        return true;
    }
  }

  /**
   * Format value for output
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Post-process output
   */
  private postProcessOutput(
    output: string,
    template: ExportTemplate,
    context: TemplateRenderContext
  ): string {
    let processed = output;

    // Apply custom CSS for HTML templates
    if (template.format === 'html' && template.styles.customCSS) {
      processed = processed.replace(
        '</head>',
        `<style>${template.styles.customCSS}</style>\n</head>`
      );
    }

    // Clean up extra whitespace
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    processed = processed.trim();

    return processed;
  }

  /**
   * Validate template syntax
   */
  private validateTemplateSyntax(template: string): void {
    // Check for balanced handlebars
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new Error('Unbalanced handlebars braces');
    }

    // Check for balanced each/if blocks
    const eachOpen = (template.match(/\{\{#each/g) || []).length;
    const eachClose = (template.match(/\{\{\/each\}\}/g) || []).length;
    
    if (eachOpen !== eachClose) {
      throw new Error('Unbalanced each blocks');
    }

    const ifOpen = (template.match(/\{\{#if/g) || []).length;
    const ifClose = (template.match(/\{\{\/if\}\}/g) || []).length;
    
    if (ifOpen !== ifClose) {
      throw new Error('Unbalanced if blocks');
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    templateId: string,
    context: TemplateRenderContext
  ): string {
    const contextHash = this.hashObject({
      projectId: context.project.id,
      storyCount: context.stories.length,
      sceneCount: context.scenes.length,
      variables: context.variables,
      options: context.options
    });
    
    return `${templateId}:${contextHash}`;
  }

  /**
   * Generate template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Hash object for caching
   */
  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  // Helper functions for templates
  private formatDate = (date: Date | string, format?: string): string => {
    const d = date instanceof Date ? date : new Date(date);
    if (format === 'short') {
      return d.toLocaleDateString();
    }
    if (format === 'long') {
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return d.toLocaleDateString();
  };

  private calculateWordCount = (text: string): number => {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  private stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  };

  private capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  private truncate = (text: string, length: number = 100): string => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  private repeat = (text: string, count: number): string => {
    return text.repeat(count);
  };

  private join = (array: any[], separator: string = ', '): string => {
    return Array.isArray(array) ? array.join(separator) : '';
  };

  private map = (array: any[], property: string): any[] => {
    return Array.isArray(array) ? array.map(item => item[property]) : [];
  };

  private filter = (array: any[], property: string, value: any): any[] => {
    return Array.isArray(array) ? array.filter(item => item[property] === value) : [];
  };

  private sort = (array: any[], property?: string): any[] => {
    if (!Array.isArray(array)) return [];
    if (!property) return array.sort();
    return array.sort((a, b) => {
      const aVal = a[property];
      const bVal = b[property];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  };

  private group = (array: any[], property: string): Record<string, any[]> => {
    if (!Array.isArray(array)) return {};
    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  };

  private format = (template: string, ...args: any[]): string => {
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      return args[parseInt(index)] || match;
    });
  };

  // Built-in template creators
  private createManuscriptTemplate(): ExportTemplate {
    return {
      id: 'manuscript-standard',
      name: 'Standard Manuscript',
      description: 'Professional manuscript format suitable for submission to publishers',
      category: 'manuscript',
      format: 'docx',
      author: 'ASTRAL NOTES',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: true,
      isPublic: true,
      tags: ['manuscript', 'professional', 'submission'],
      
      layout: {
        pageSize: 'Letter',
        orientation: 'portrait',
        margins: { top: 25, bottom: 25, left: 25, right: 25 },
        columns: 1,
        header: {
          enabled: true,
          content: '{{project.title}} / {{project.metadata.author}}',
          alignment: 'left',
          fontSize: 12,
          color: '#000000',
          showOnFirstPage: false
        },
        footer: {
          enabled: true,
          content: 'Page {{pageNumber}}',
          alignment: 'right',
          fontSize: 12,
          color: '#000000',
          showOnFirstPage: false
        },
        pageNumbers: {
          enabled: true,
          position: 'bottom',
          alignment: 'right',
          format: '{{pageNumber}}',
          startPage: 1,
          showOnFirstPage: false
        }
      },
      
      styles: {
        fonts: {
          primary: { family: 'Times New Roman', size: 12, weight: 400, lineHeight: 2 },
          secondary: { family: 'Times New Roman', size: 12, weight: 400, lineHeight: 2 },
          monospace: { family: 'Courier New', size: 12, weight: 400, lineHeight: 2 },
          heading: { family: 'Times New Roman', size: 14, weight: 700, lineHeight: 2 }
        },
        colors: {
          primary: '#000000',
          secondary: '#333333',
          accent: '#666666',
          background: '#ffffff',
          surface: '#ffffff',
          text: { primary: '#000000', secondary: '#333333', muted: '#666666' },
          borders: '#cccccc',
          links: '#0066cc'
        },
        spacing: {
          paragraphSpacing: 0,
          sectionSpacing: 24,
          chapterSpacing: 48,
          lineSpacing: 2,
          indentation: 0.5
        },
        typography: {
          headings: {
            h1: { fontSize: 14, fontWeight: 700, color: '#000000', spacing: { marginTop: 48, marginBottom: 24, paddingTop: 0, paddingBottom: 0 } },
            h2: { fontSize: 13, fontWeight: 700, color: '#000000', spacing: { marginTop: 36, marginBottom: 18, paddingTop: 0, paddingBottom: 0 } },
            h3: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 24, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            h4: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 18, marginBottom: 9, paddingTop: 0, paddingBottom: 0 } },
            h5: { fontSize: 12, fontWeight: 600, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h6: { fontSize: 12, fontWeight: 600, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          paragraphs: {
            default: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            firstLine: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            dialogue: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            description: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } }
          },
          quotes: {
            blockquote: { fontSize: 12, fontWeight: 400, color: '#333333', spacing: { marginTop: 12, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            inline: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            citation: { fontSize: 11, fontWeight: 400, color: '#666666', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          lists: {
            ordered: {
              item: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'decimal', color: '#000000', size: 12 },
              nesting: []
            },
            unordered: {
              item: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'disc', color: '#000000', size: 12 },
              nesting: []
            }
          },
          emphasis: {
            bold: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            italic: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            underline: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'underline' },
            strikethrough: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'line-through' },
            code: { fontSize: 11, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } }
          }
        }
      },
      
      structure: {
        titlePage: true,
        tableOfContents: false,
        chapterBreaks: true,
        sceneBreaks: true,
        includeMetadata: false,
        includeNotes: false,
        includeCharacters: false,
        includeLocations: false,
        customSections: []
      },
      
      variables: [
        {
          name: 'author',
          type: 'string',
          label: 'Author Name',
          description: 'Name to display on title page',
          defaultValue: '{{project.metadata.author}}',
          required: true
        },
        {
          name: 'fontSize',
          type: 'select',
          label: 'Font Size',
          description: 'Base font size for document',
          defaultValue: '12',
          required: false,
          options: ['10', '11', '12', '13', '14']
        }
      ],
      
      sections: [
        {
          id: 'title-page',
          name: 'Title Page',
          type: 'title-page',
          template: `<div style="text-align: center; page-break-after: always;">
            <h1 style="margin-top: 2in;">{{project.title}}</h1>
            <p style="margin-top: 2in;">by</p>
            <p>{{variables.author}}</p>
          </div>`,
          condition: '',
          order: 1,
          enabled: true
        },
        {
          id: 'content',
          name: 'Main Content',
          type: 'chapter',
          template: `{{#each stories}}
            <div style="page-break-before: always;">
              <h1>{{title}}</h1>
              {{#if summary}}<p><em>{{summary}}</em></p>{{/if}}
              
              {{#each (filter ../scenes 'storyId' id)}}
                <h2>{{title}}</h2>
                <div>{{{content}}}</div>
              {{/each}}
            </div>
          {{/each}}`,
          condition: '',
          order: 2,
          enabled: true
        }
      ]
    };
  }

  private createAcademicTemplate(): ExportTemplate {
    // Similar structure for academic template...
    return {
      id: 'academic-paper',
      name: 'Academic Paper',
      description: 'Academic paper format with citations and bibliography',
      category: 'academic',
      format: 'pdf',
      author: 'ASTRAL NOTES',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: true,
      isPublic: true,
      tags: ['academic', 'research', 'citations'],
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 25, bottom: 25, left: 30, right: 25 },
        columns: 1,
        pageNumbers: {
          enabled: true,
          position: 'bottom',
          alignment: 'center',
          format: '{{pageNumber}}',
          startPage: 1,
          showOnFirstPage: false
        }
      },
      styles: {
        fonts: {
          primary: { family: 'Times New Roman', size: 12, weight: 400, lineHeight: 1.5 },
          secondary: { family: 'Times New Roman', size: 12, weight: 400, lineHeight: 1.5 },
          monospace: { family: 'Courier New', size: 11, weight: 400, lineHeight: 1.5 },
          heading: { family: 'Times New Roman', size: 14, weight: 700, lineHeight: 1.5 }
        },
        colors: {
          primary: '#000000',
          secondary: '#333333',
          accent: '#0066cc',
          background: '#ffffff',
          surface: '#ffffff',
          text: { primary: '#000000', secondary: '#333333', muted: '#666666' },
          borders: '#cccccc',
          links: '#0066cc'
        },
        spacing: {
          paragraphSpacing: 12,
          sectionSpacing: 24,
          chapterSpacing: 36,
          lineSpacing: 1.5,
          indentation: 0.5
        },
        typography: {
          headings: {
            h1: { fontSize: 16, fontWeight: 700, color: '#000000', spacing: { marginTop: 24, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            h2: { fontSize: 14, fontWeight: 700, color: '#000000', spacing: { marginTop: 18, marginBottom: 9, paddingTop: 0, paddingBottom: 0 } },
            h3: { fontSize: 13, fontWeight: 700, color: '#000000', spacing: { marginTop: 15, marginBottom: 7, paddingTop: 0, paddingBottom: 0 } },
            h4: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h5: { fontSize: 12, fontWeight: 600, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h6: { fontSize: 12, fontWeight: 600, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          paragraphs: {
            default: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            firstLine: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            dialogue: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            description: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } }
          },
          quotes: {
            blockquote: { fontSize: 11, fontWeight: 400, color: '#333333', spacing: { marginTop: 12, marginBottom: 12, paddingTop: 12, paddingBottom: 12 } },
            inline: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            citation: { fontSize: 10, fontWeight: 400, color: '#666666', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          lists: {
            ordered: {
              item: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'decimal', color: '#000000', size: 12 },
              nesting: []
            },
            unordered: {
              item: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'disc', color: '#000000', size: 12 },
              nesting: []
            }
          },
          emphasis: {
            bold: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            italic: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            underline: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'underline' },
            strikethrough: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'line-through' },
            code: { fontSize: 11, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 2, paddingBottom: 2 } }
          }
        }
      },
      structure: {
        titlePage: true,
        tableOfContents: true,
        chapterBreaks: true,
        sceneBreaks: false,
        includeMetadata: true,
        includeNotes: true,
        includeCharacters: false,
        includeLocations: false,
        customSections: []
      },
      variables: [],
      sections: []
    };
  }

  private createEbookTemplate(): ExportTemplate {
    // Ebook template implementation...
    return {
      id: 'ebook-standard',
      name: 'Standard Ebook',
      description: 'Optimized for digital reading with responsive layout',
      category: 'ebook',
      format: 'epub',
      author: 'ASTRAL NOTES',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: true,
      isPublic: true,
      tags: ['ebook', 'digital', 'responsive'],
      layout: {
        pageSize: 'A5',
        orientation: 'portrait',
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        columns: 1,
        pageNumbers: {
          enabled: false,
          position: 'bottom',
          alignment: 'center',
          format: '{{pageNumber}}',
          startPage: 1,
          showOnFirstPage: false
        }
      },
      styles: {
        fonts: {
          primary: { family: 'Georgia', size: 16, weight: 400, lineHeight: 1.6 },
          secondary: { family: 'Arial', size: 14, weight: 400, lineHeight: 1.5 },
          monospace: { family: 'Courier New', size: 14, weight: 400, lineHeight: 1.4 },
          heading: { family: 'Georgia', size: 18, weight: 700, lineHeight: 1.4 }
        },
        colors: {
          primary: '#2c3e50',
          secondary: '#34495e',
          accent: '#3498db',
          background: '#ffffff',
          surface: '#f8f9fa',
          text: { primary: '#2c3e50', secondary: '#34495e', muted: '#7f8c8d' },
          borders: '#bdc3c7',
          links: '#3498db'
        },
        spacing: {
          paragraphSpacing: 16,
          sectionSpacing: 32,
          chapterSpacing: 48,
          lineSpacing: 1.6,
          indentation: 1.5
        },
        typography: {
          headings: {
            h1: { fontSize: 24, fontWeight: 700, color: '#2c3e50', spacing: { marginTop: 48, marginBottom: 24, paddingTop: 0, paddingBottom: 0 } },
            h2: { fontSize: 20, fontWeight: 600, color: '#2c3e50', spacing: { marginTop: 36, marginBottom: 18, paddingTop: 0, paddingBottom: 0 } },
            h3: { fontSize: 18, fontWeight: 600, color: '#34495e', spacing: { marginTop: 24, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            h4: { fontSize: 16, fontWeight: 600, color: '#34495e', spacing: { marginTop: 18, marginBottom: 9, paddingTop: 0, paddingBottom: 0 } },
            h5: { fontSize: 16, fontWeight: 500, color: '#34495e', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h6: { fontSize: 16, fontWeight: 500, color: '#34495e', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          paragraphs: {
            default: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            firstLine: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            dialogue: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            description: { fontSize: 16, fontWeight: 400, color: '#34495e', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } }
          },
          quotes: {
            blockquote: { fontSize: 15, fontWeight: 400, color: '#34495e', spacing: { marginTop: 16, marginBottom: 16, paddingTop: 16, paddingBottom: 16 } },
            inline: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            citation: { fontSize: 14, fontWeight: 400, color: '#7f8c8d', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } }
          },
          lists: {
            ordered: {
              item: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'decimal', color: '#3498db', size: 16 },
              nesting: []
            },
            unordered: {
              item: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'disc', color: '#3498db', size: 16 },
              nesting: []
            }
          },
          emphasis: {
            bold: { fontSize: 16, fontWeight: 700, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            italic: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            underline: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'underline' },
            strikethrough: { fontSize: 16, fontWeight: 400, color: '#2c3e50', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'line-through' },
            code: { fontSize: 14, fontWeight: 400, color: '#e74c3c', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 2, paddingBottom: 2 } }
          }
        }
      },
      structure: {
        titlePage: true,
        tableOfContents: true,
        chapterBreaks: true,
        sceneBreaks: true,
        includeMetadata: true,
        includeNotes: false,
        includeCharacters: true,
        includeLocations: true,
        customSections: []
      },
      variables: [],
      sections: []
    };
  }

  private createScreenplayTemplate(): ExportTemplate {
    // Screenplay template implementation...
    return {
      id: 'screenplay-standard',
      name: 'Standard Screenplay',
      description: 'Industry-standard screenplay format',
      category: 'screenplay',
      format: 'pdf',
      author: 'ASTRAL NOTES',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: true,
      isPublic: true,
      tags: ['screenplay', 'script', 'industry-standard'],
      layout: {
        pageSize: 'Letter',
        orientation: 'portrait',
        margins: { top: 25, bottom: 25, left: 38, right: 25 },
        columns: 1,
        pageNumbers: {
          enabled: true,
          position: 'top',
          alignment: 'right',
          format: '{{pageNumber}}.',
          startPage: 1,
          showOnFirstPage: false
        }
      },
      styles: {
        fonts: {
          primary: { family: 'Courier New', size: 12, weight: 400, lineHeight: 1 },
          secondary: { family: 'Courier New', size: 12, weight: 400, lineHeight: 1 },
          monospace: { family: 'Courier New', size: 12, weight: 400, lineHeight: 1 },
          heading: { family: 'Courier New', size: 12, weight: 700, lineHeight: 1 }
        },
        colors: {
          primary: '#000000',
          secondary: '#000000',
          accent: '#000000',
          background: '#ffffff',
          surface: '#ffffff',
          text: { primary: '#000000', secondary: '#000000', muted: '#000000' },
          borders: '#000000',
          links: '#000000'
        },
        spacing: {
          paragraphSpacing: 12,
          sectionSpacing: 24,
          chapterSpacing: 24,
          lineSpacing: 1,
          indentation: 0
        },
        typography: {
          headings: {
            h1: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 24, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            h2: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h3: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h4: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h5: { fontSize: 12, fontWeight: 600, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
            h6: { fontSize: 12, fontWeight: 600, color: '#000000', spacing: { marginTop: 12, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          paragraphs: {
            default: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 12, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            firstLine: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 12, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            dialogue: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            description: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 12, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } }
          },
          quotes: {
            blockquote: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 12, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            inline: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            citation: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } }
          },
          lists: {
            ordered: {
              item: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'decimal', color: '#000000', size: 12 },
              nesting: []
            },
            unordered: {
              item: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 6, marginBottom: 6, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'disc', color: '#000000', size: 12 },
              nesting: []
            }
          },
          emphasis: {
            bold: { fontSize: 12, fontWeight: 700, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            italic: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            underline: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'underline' },
            strikethrough: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'line-through' },
            code: { fontSize: 12, fontWeight: 400, color: '#000000', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } }
          }
        }
      },
      structure: {
        titlePage: true,
        tableOfContents: false,
        chapterBreaks: false,
        sceneBreaks: true,
        includeMetadata: false,
        includeNotes: false,
        includeCharacters: false,
        includeLocations: false,
        customSections: []
      },
      variables: [],
      sections: []
    };
  }

  private createBlogTemplate(): ExportTemplate {
    // Blog template implementation...
    return {
      id: 'blog-modern',
      name: 'Modern Blog',
      description: 'Clean, modern blog post format with responsive design',
      category: 'blog',
      format: 'html',
      author: 'ASTRAL NOTES',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: true,
      isPublic: true,
      tags: ['blog', 'web', 'responsive', 'modern'],
      layout: {
        pageSize: 'Custom',
        orientation: 'portrait',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        columns: 1,
        pageNumbers: {
          enabled: false,
          position: 'bottom',
          alignment: 'center',
          format: '{{pageNumber}}',
          startPage: 1,
          showOnFirstPage: false
        }
      },
      styles: {
        fonts: {
          primary: { family: 'Inter', size: 16, weight: 400, lineHeight: 1.7 },
          secondary: { family: 'Inter', size: 14, weight: 400, lineHeight: 1.6 },
          monospace: { family: 'Fira Code', size: 14, weight: 400, lineHeight: 1.5 },
          heading: { family: 'Inter', size: 20, weight: 600, lineHeight: 1.3 }
        },
        colors: {
          primary: '#1a202c',
          secondary: '#2d3748',
          accent: '#3182ce',
          background: '#ffffff',
          surface: '#f7fafc',
          text: { primary: '#1a202c', secondary: '#4a5568', muted: '#718096' },
          borders: '#e2e8f0',
          links: '#3182ce'
        },
        spacing: {
          paragraphSpacing: 20,
          sectionSpacing: 40,
          chapterSpacing: 60,
          lineSpacing: 1.7,
          indentation: 0
        },
        typography: {
          headings: {
            h1: { fontSize: 36, fontWeight: 700, color: '#1a202c', spacing: { marginTop: 60, marginBottom: 30, paddingTop: 0, paddingBottom: 0 } },
            h2: { fontSize: 28, fontWeight: 600, color: '#1a202c', spacing: { marginTop: 48, marginBottom: 24, paddingTop: 0, paddingBottom: 0 } },
            h3: { fontSize: 24, fontWeight: 600, color: '#2d3748', spacing: { marginTop: 36, marginBottom: 18, paddingTop: 0, paddingBottom: 0 } },
            h4: { fontSize: 20, fontWeight: 600, color: '#2d3748', spacing: { marginTop: 28, marginBottom: 14, paddingTop: 0, paddingBottom: 0 } },
            h5: { fontSize: 18, fontWeight: 500, color: '#2d3748', spacing: { marginTop: 24, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            h6: { fontSize: 16, fontWeight: 500, color: '#2d3748', spacing: { marginTop: 20, marginBottom: 10, paddingTop: 0, paddingBottom: 0 } }
          },
          paragraphs: {
            default: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 0, marginBottom: 20, paddingTop: 0, paddingBottom: 0 } },
            firstLine: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 0, marginBottom: 20, paddingTop: 0, paddingBottom: 0 } },
            dialogue: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 0, marginBottom: 20, paddingTop: 0, paddingBottom: 0 } },
            description: { fontSize: 16, fontWeight: 400, color: '#4a5568', spacing: { marginTop: 0, marginBottom: 20, paddingTop: 0, paddingBottom: 0 } }
          },
          quotes: {
            blockquote: { fontSize: 18, fontWeight: 400, color: '#4a5568', spacing: { marginTop: 24, marginBottom: 24, paddingTop: 20, paddingBottom: 20 } },
            inline: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            citation: { fontSize: 14, fontWeight: 400, color: '#718096', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } }
          },
          lists: {
            ordered: {
              item: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'decimal', color: '#3182ce', size: 16 },
              nesting: []
            },
            unordered: {
              item: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'disc', color: '#3182ce', size: 16 },
              nesting: []
            }
          },
          emphasis: {
            bold: { fontSize: 16, fontWeight: 600, color: '#1a202c', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            italic: { fontSize: 16, fontWeight: 400, color: '#1a202c', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            underline: { fontSize: 16, fontWeight: 400, color: '#3182ce', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'underline' },
            strikethrough: { fontSize: 16, fontWeight: 400, color: '#718096', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'line-through' },
            code: { fontSize: 14, fontWeight: 400, color: '#e53e3e', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 4, paddingBottom: 4 } }
          }
        },
        customCSS: `
          body { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          h1, h2, h3, h4, h5, h6 { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.3;
          }
          
          blockquote {
            border-left: 4px solid #3182ce;
            padding-left: 20px;
            background: #f7fafc;
            margin: 24px 0;
            padding: 20px;
            border-radius: 8px;
          }
          
          code {
            background: #f7fafc;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
          }
          
          pre {
            background: #1a202c;
            color: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
          }
          
          pre code {
            background: none;
            padding: 0;
            color: inherit;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
          }
          
          a {
            color: #3182ce;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          .post-meta {
            color: #718096;
            font-size: 14px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          @media (max-width: 768px) {
            body {
              padding: 20px 16px;
            }
            
            h1 { font-size: 28px; }
            h2 { font-size: 24px; }
            h3 { font-size: 20px; }
          }
        `
      },
      structure: {
        titlePage: false,
        tableOfContents: false,
        chapterBreaks: false,
        sceneBreaks: false,
        includeMetadata: true,
        includeNotes: false,
        includeCharacters: false,
        includeLocations: false,
        customSections: []
      },
      variables: [],
      sections: []
    };
  }

  private createMinimalTemplate(): ExportTemplate {
    // Minimal template implementation...
    return {
      id: 'minimal-clean',
      name: 'Minimal Clean',
      description: 'Clean, minimal template with focus on content',
      category: 'custom',
      format: 'html',
      author: 'ASTRAL NOTES',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: true,
      isPublic: true,
      tags: ['minimal', 'clean', 'simple'],
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        columns: 1,
        pageNumbers: {
          enabled: false,
          position: 'bottom',
          alignment: 'center',
          format: '{{pageNumber}}',
          startPage: 1,
          showOnFirstPage: false
        }
      },
      styles: {
        fonts: {
          primary: { family: 'system-ui', size: 16, weight: 400, lineHeight: 1.6 },
          secondary: { family: 'system-ui', size: 14, weight: 400, lineHeight: 1.5 },
          monospace: { family: 'monospace', size: 14, weight: 400, lineHeight: 1.4 },
          heading: { family: 'system-ui', size: 18, weight: 600, lineHeight: 1.3 }
        },
        colors: {
          primary: '#333333',
          secondary: '#666666',
          accent: '#000000',
          background: '#ffffff',
          surface: '#ffffff',
          text: { primary: '#333333', secondary: '#666666', muted: '#999999' },
          borders: '#eeeeee',
          links: '#000000'
        },
        spacing: {
          paragraphSpacing: 16,
          sectionSpacing: 32,
          chapterSpacing: 48,
          lineSpacing: 1.6,
          indentation: 0
        },
        typography: {
          headings: {
            h1: { fontSize: 24, fontWeight: 600, color: '#333333', spacing: { marginTop: 48, marginBottom: 24, paddingTop: 0, paddingBottom: 0 } },
            h2: { fontSize: 20, fontWeight: 600, color: '#333333', spacing: { marginTop: 36, marginBottom: 18, paddingTop: 0, paddingBottom: 0 } },
            h3: { fontSize: 18, fontWeight: 600, color: '#333333', spacing: { marginTop: 24, marginBottom: 12, paddingTop: 0, paddingBottom: 0 } },
            h4: { fontSize: 16, fontWeight: 600, color: '#333333', spacing: { marginTop: 20, marginBottom: 10, paddingTop: 0, paddingBottom: 0 } },
            h5: { fontSize: 16, fontWeight: 500, color: '#333333', spacing: { marginTop: 16, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
            h6: { fontSize: 16, fontWeight: 500, color: '#333333', spacing: { marginTop: 16, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } }
          },
          paragraphs: {
            default: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            firstLine: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            dialogue: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            description: { fontSize: 16, fontWeight: 400, color: '#666666', spacing: { marginTop: 0, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } }
          },
          quotes: {
            blockquote: { fontSize: 16, fontWeight: 400, color: '#666666', spacing: { marginTop: 16, marginBottom: 16, paddingTop: 0, paddingBottom: 0 } },
            inline: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            citation: { fontSize: 14, fontWeight: 400, color: '#999999', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } }
          },
          lists: {
            ordered: {
              item: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'decimal', color: '#333333', size: 16 },
              nesting: []
            },
            unordered: {
              item: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 8, marginBottom: 8, paddingTop: 0, paddingBottom: 0 } },
              marker: { type: 'disc', color: '#333333', size: 16 },
              nesting: []
            }
          },
          emphasis: {
            bold: { fontSize: 16, fontWeight: 600, color: '#333333', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            italic: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } },
            underline: { fontSize: 16, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'underline' },
            strikethrough: { fontSize: 16, fontWeight: 400, color: '#999999', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }, decoration: 'line-through' },
            code: { fontSize: 14, fontWeight: 400, color: '#333333', spacing: { marginTop: 0, marginBottom: 0, paddingTop: 2, paddingBottom: 2 } }
          }
        }
      },
      structure: {
        titlePage: false,
        tableOfContents: false,
        chapterBreaks: true,
        sceneBreaks: false,
        includeMetadata: false,
        includeNotes: false,
        includeCharacters: false,
        includeLocations: false,
        customSections: []
      },
      variables: [],
      sections: []
    };
  }
}

export const templateEngineService = TemplateEngineService.getInstance();