/**
 * Advanced Formatting Service
 * Professional manuscript formatting and typography tools
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface FormattingSettings {
  manuscript: {
    font: string;
    fontSize: number;
    lineHeight: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    paperSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
  };
  typography: {
    indentFirstLine: boolean;
    indentSize: number;
    paragraphSpacing: number;
    sceneBreaks: {
      symbol: string;
      spacing: number;
    };
    chapterBreaks: {
      pageBreak: boolean;
      spacing: number;
    };
  };
  headers: {
    showPageNumbers: boolean;
    showTitle: boolean;
    showAuthor: boolean;
    showChapter: boolean;
    position: 'top' | 'bottom';
    alignment: 'left' | 'center' | 'right';
  };
  dialogue: {
    quotationStyle: 'smart' | 'straight' | 'guillemets';
    indentDialogue: boolean;
    dialogueSpacing: number;
  };
}

export interface ManuscriptPreset {
  id: string;
  name: string;
  description: string;
  category: 'industry' | 'personal' | 'submission';
  settings: FormattingSettings;
}

export interface StyleGuide {
  id: string;
  name: string;
  rules: {
    punctuation: Record<string, string>;
    capitalization: Record<string, string>;
    spacing: Record<string, string>;
    abbreviations: Record<string, string>;
  };
  customRules: Array<{
    pattern: RegExp;
    replacement: string;
    description: string;
  }>;
}

export interface FormatValidation {
  isValid: boolean;
  issues: Array<{
    type: 'warning' | 'error';
    line: number;
    column: number;
    message: string;
    suggestion?: string;
  }>;
  wordCount: number;
  characterCount: number;
  pageCount: number;
}

class AdvancedFormattingService extends BrowserEventEmitter {
  private settings: FormattingSettings;
  private presets: ManuscriptPreset[] = [];
  private styleGuides: StyleGuide[] = [];
  private storageKey = 'astral_notes_formatting';

  constructor() {
    super();
    this.loadSettings();
    this.initializePresets();
    this.initializeStyleGuides();
  }

  // Settings Management
  getSettings(): FormattingSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<FormattingSettings>): void {
    this.settings = this.mergeSettings(this.settings, newSettings);
    this.saveSettings();
    this.emit('settingsUpdated', this.settings);
  }

  resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    this.emit('settingsReset', this.settings);
  }

  // Manuscript Presets
  getPresets(): ManuscriptPreset[] {
    return [...this.presets];
  }

  getPreset(id: string): ManuscriptPreset | null {
    return this.presets.find(p => p.id === id) || null;
  }

  applyPreset(presetId: string): boolean {
    const preset = this.getPreset(presetId);
    if (!preset) return false;

    this.settings = { ...preset.settings };
    this.saveSettings();
    this.emit('presetApplied', { presetId, settings: this.settings });
    return true;
  }

  createCustomPreset(name: string, description: string, settings: FormattingSettings): string {
    const preset: ManuscriptPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: 'personal',
      settings: { ...settings }
    };

    this.presets.push(preset);
    this.savePresets();
    this.emit('presetCreated', preset);
    return preset.id;
  }

  deletePreset(presetId: string): boolean {
    const index = this.presets.findIndex(p => p.id === presetId);
    if (index === -1) return false;

    const preset = this.presets[index];
    if (preset.category === 'industry') return false; // Can't delete industry presets

    this.presets.splice(index, 1);
    this.savePresets();
    this.emit('presetDeleted', { presetId });
    return true;
  }

  // Text Formatting
  formatText(text: string, options: {
    applyTypography?: boolean;
    applyStyleGuide?: boolean;
    styleGuideId?: string;
  } = {}): string {
    let formatted = text;

    if (options.applyTypography) {
      formatted = this.applyTypography(formatted);
    }

    if (options.applyStyleGuide && options.styleGuideId) {
      formatted = this.applyStyleGuide(formatted, options.styleGuideId);
    }

    return formatted;
  }

  private applyTypography(text: string): string {
    const { typography } = this.settings;
    let formatted = text;

    // Apply paragraph indentation
    if (typography.indentFirstLine) {
      const indentSpaces = ' '.repeat(typography.indentSize);
      // Split by double newlines to identify paragraphs
      const paragraphs = formatted.split('\n\n');
      formatted = paragraphs.map(para => {
        // Add indent to first line of each non-empty paragraph
        if (para.trim()) {
          return indentSpaces + para;
        }
        return para;
      }).join('\n\n');
    }

    // Apply scene breaks
    formatted = formatted.replace(
      /^\s*\*\s*\*\s*\*\s*$/gm,
      `\n${typography.sceneBreaks.symbol}\n`
    );

    // Apply dialogue formatting
    if (this.settings.dialogue.indentDialogue) {
      // Match lines that start with quotes
      formatted = formatted.split('\n').map(line => {
        if (line.trim().startsWith('"')) {
          return '    ' + line.trim();
        }
        return line;
      }).join('\n');
    }

    return formatted;
  }

  private applyStyleGuide(text: string, styleGuideId: string): string {
    const styleGuide = this.styleGuides.find(sg => sg.id === styleGuideId);
    if (!styleGuide) return text;

    let formatted = text;

    // Apply punctuation rules
    Object.entries(styleGuide.rules.punctuation).forEach(([pattern, replacement]) => {
      formatted = formatted.replace(new RegExp(pattern, 'g'), replacement);
    });

    // Apply custom rules
    styleGuide.customRules.forEach(rule => {
      formatted = formatted.replace(rule.pattern, rule.replacement);
    });

    return formatted;
  }

  // Document Analysis
  analyzeDocument(text: string): FormatValidation {
    const issues: FormatValidation['issues'] = [];
    
    // Check for common formatting issues
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      // Check for double spaces
      if (line.includes('  ')) {
        issues.push({
          type: 'warning',
          line: index + 1,
          column: line.indexOf('  ') + 1,
          message: 'Multiple consecutive spaces found',
          suggestion: 'Replace with single space'
        });
      }

      // Check for inconsistent quotation marks
      const straightQuotes = (line.match(/"/g) || []).length;
      const smartQuotes = (line.match(/[""]/g) || []).length;
      if (straightQuotes > 0 && smartQuotes > 0) {
        issues.push({
          type: 'warning',
          line: index + 1,
          column: 1,
          message: 'Mixed quotation mark styles',
          suggestion: 'Use consistent quotation style'
        });
      }

      // Check for paragraph spacing
      if (line.trim() === '' && lines[index + 1]?.trim() === '') {
        issues.push({
          type: 'warning',
          line: index + 1,
          column: 1,
          message: 'Multiple blank lines',
          suggestion: 'Use single blank line for paragraph breaks'
        });
      }
    });

    // Calculate statistics
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;
    const pageCount = Math.ceil(wordCount / 250); // Assuming 250 words per page

    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      wordCount,
      characterCount,
      pageCount
    };
  }

  // Export Functions
  exportAsManuscript(text: string, title: string, author: string): string {
    const formatted = this.formatText(text, { applyTypography: true });
    
    // Build manuscript header
    let manuscript = '';
    
    if (this.settings.headers.showTitle && this.settings.headers.showAuthor) {
      manuscript += `${title}\nby ${author}\n\n`;
    }

    // Add page break before content
    if (this.settings.typography.chapterBreaks.pageBreak) {
      manuscript += '\n\n';
    }

    manuscript += formatted;

    return manuscript;
  }

  exportAsPDF(text: string, title: string, author: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // This would integrate with a PDF library like jsPDF
        // For now, returning a text blob as placeholder
        const formatted = this.exportAsManuscript(text, title, author);
        const blob = new Blob([formatted], { type: 'text/plain' });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  exportAsWord(text: string, title: string, author: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // This would integrate with a Word generation library
        // For now, returning a text blob as placeholder
        const formatted = this.exportAsManuscript(text, title, author);
        const blob = new Blob([formatted], { type: 'application/msword' });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Style Guides
  getStyleGuides(): StyleGuide[] {
    return [...this.styleGuides];
  }

  createStyleGuide(name: string, rules: StyleGuide['rules']): string {
    const styleGuide: StyleGuide = {
      id: `style-${Date.now()}`,
      name,
      rules,
      customRules: []
    };

    this.styleGuides.push(styleGuide);
    this.saveStyleGuides();
    this.emit('styleGuideCreated', styleGuide);
    return styleGuide.id;
  }

  // Smart Formatting Tools
  autoFormat(text: string): string {
    let formatted = text;

    // Fix common punctuation issues
    formatted = formatted
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\.\s*\.\s*\./g, '...') // Fix ellipses
      .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
      .replace(/([.!?])\s*([A-Z])/g, '$1  $2') // Double space after sentences
      .replace(/"\s+/g, '"') // Remove space after opening quotes
      .replace(/\s+"/g, '"') // Remove space before closing quotes
      .replace(/'\s+/g, "'") // Fix apostrophes
      .replace(/\s+'/g, "'");

    // Fix dialogue formatting
    formatted = formatted.replace(
      /"([^"]*[.!?])"\s*([A-Z])/g,
      '"$1"\n\n$2'
    );

    // Fix paragraph breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted.trim();
  }

  smartQuotes(text: string): string {
    let result = text;
    
    // Convert straight quotes to smart quotes
    result = result.replace(/"([^"]*)"/g, '"$1"'); // Double quotes
    result = result.replace(/(?<!\w)'([^']*)'(?!\w)/g, "'$1'"); // Single quotes
    
    return result;
  }

  // Private Methods
  private getDefaultSettings(): FormattingSettings {
    return {
      manuscript: {
        font: 'Times New Roman',
        fontSize: 12,
        lineHeight: 2.0,
        marginTop: 1.0,
        marginBottom: 1.0,
        marginLeft: 1.0,
        marginRight: 1.0,
        paperSize: 'Letter',
        orientation: 'portrait'
      },
      typography: {
        indentFirstLine: true,
        indentSize: 4,
        paragraphSpacing: 1,
        sceneBreaks: {
          symbol: '***',
          spacing: 2
        },
        chapterBreaks: {
          pageBreak: true,
          spacing: 4
        }
      },
      headers: {
        showPageNumbers: true,
        showTitle: true,
        showAuthor: true,
        showChapter: false,
        position: 'top',
        alignment: 'right'
      },
      dialogue: {
        quotationStyle: 'smart',
        indentDialogue: false,
        dialogueSpacing: 1
      }
    };
  }

  private mergeSettings(current: FormattingSettings, updates: Partial<FormattingSettings>): FormattingSettings {
    return {
      manuscript: { ...current.manuscript, ...updates.manuscript },
      typography: { ...current.typography, ...updates.typography },
      headers: { ...current.headers, ...updates.headers },
      dialogue: { ...current.dialogue, ...updates.dialogue }
    };
  }

  private initializePresets(): void {
    this.presets = [
      {
        id: 'standard-manuscript',
        name: 'Standard Manuscript',
        description: 'Industry standard manuscript formatting for submissions',
        category: 'industry',
        settings: this.getDefaultSettings()
      },
      {
        id: 'paperback-novel',
        name: 'Paperback Novel',
        description: 'Formatting for paperback novel layout',
        category: 'industry',
        settings: {
          ...this.getDefaultSettings(),
          manuscript: {
            ...this.getDefaultSettings().manuscript,
            font: 'Georgia',
            fontSize: 11,
            lineHeight: 1.4,
            marginTop: 0.75,
            marginBottom: 0.75,
            marginLeft: 0.75,
            marginRight: 0.75
          }
        }
      },
      {
        id: 'ebook-format',
        name: 'E-book Format',
        description: 'Optimized for digital reading devices',
        category: 'industry',
        settings: {
          ...this.getDefaultSettings(),
          manuscript: {
            ...this.getDefaultSettings().manuscript,
            font: 'Georgia',
            fontSize: 14,
            lineHeight: 1.6
          },
          typography: {
            ...this.getDefaultSettings().typography,
            indentFirstLine: false,
            paragraphSpacing: 1.5
          }
        }
      }
    ];

    this.loadPresets();
  }

  private initializeStyleGuides(): void {
    this.styleGuides = [
      {
        id: 'chicago-manual',
        name: 'Chicago Manual of Style',
        rules: {
          punctuation: {
            '\\.\\.\\.': '…',
            '(?<=\\.)\\s+(?=[A-Z])': '  '
          },
          capitalization: {},
          spacing: {},
          abbreviations: {
            'Mr\\.': 'Mr.',
            'Mrs\\.': 'Mrs.',
            'Dr\\.': 'Dr.'
          }
        },
        customRules: []
      },
      {
        id: 'ap-style',
        name: 'AP Stylebook',
        rules: {
          punctuation: {
            '"([^"]*)"': '"$1"'
          },
          capitalization: {},
          spacing: {},
          abbreviations: {}
        },
        customRules: []
      }
    ];

    this.loadStyleGuides();
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(`${this.storageKey}_settings`, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save formatting settings:', error);
    }
  }

  public loadSettings(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_settings`);
      if (stored) {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      } else {
        this.settings = this.getDefaultSettings();
      }
    } catch (error) {
      console.error('Failed to load formatting settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  private savePresets(): void {
    try {
      const customPresets = this.presets.filter(p => p.category === 'personal');
      localStorage.setItem(`${this.storageKey}_presets`, JSON.stringify(customPresets));
    } catch (error) {
      console.error('Failed to save formatting presets:', error);
    }
  }

  private loadPresets(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_presets`);
      if (stored) {
        const customPresets = JSON.parse(stored);
        this.presets.push(...customPresets);
      }
    } catch (error) {
      console.error('Failed to load formatting presets:', error);
    }
  }

  private saveStyleGuides(): void {
    try {
      localStorage.setItem(`${this.storageKey}_style_guides`, JSON.stringify(this.styleGuides));
    } catch (error) {
      console.error('Failed to save style guides:', error);
    }
  }

  private loadStyleGuides(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_style_guides`);
      if (stored) {
        this.styleGuides = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load style guides:', error);
    }
  }
}

export const advancedFormattingService = new AdvancedFormattingService();
export default advancedFormattingService;