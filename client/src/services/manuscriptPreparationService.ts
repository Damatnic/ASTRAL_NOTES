import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface ManuscriptFormat {
  id: string;
  name: string;
  description: string;
  category: 'industry' | 'academic' | 'self-publishing' | 'competition';
  settings: ManuscriptSettings;
  requirements: string[];
  exportFormats: ExportFormat[];
  isDefault: boolean;
  isCustom: boolean;
}

export interface ManuscriptSettings {
  pageSetup: {
    size: 'letter' | 'a4' | 'legal';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    paragraphSpacing: number;
    indentation: {
      firstLine: number;
      hanging: number;
    };
  };
  headers: {
    includePageNumbers: boolean;
    includeAuthorName: boolean;
    includeTitle: boolean;
    position: 'top-left' | 'top-center' | 'top-right';
    format: string;
  };
  chapters: {
    startOnNewPage: boolean;
    numberFormat: 'arabic' | 'roman' | 'spelled';
    titleFormat: string;
    spacing: {
      before: number;
      after: number;
    };
  };
  scenes: {
    separator: string;
    spacing: {
      before: number;
      after: number;
    };
  };
  dialogue: {
    indentation: number;
    quotationStyle: 'american' | 'british' | 'french';
    paragraphBreaks: boolean;
  };
}

export interface ExportFormat {
  type: 'pdf' | 'docx' | 'rtf' | 'txt' | 'epub' | 'mobi';
  name: string;
  description: string;
  quality: 'draft' | 'review' | 'final';
  options: Record<string, any>;
}

export interface ManuscriptMetadata {
  title: string;
  subtitle?: string;
  author: string;
  pseudonym?: string;
  genre: string;
  wordCount: number;
  pageCount: number;
  chapterCount: number;
  synopsis: string;
  logline?: string;
  keywords: string[];
  targetAudience: string;
  marketCategory: string;
  completionDate: Date;
  version: string;
  notes: string;
}

export interface SubmissionPackage {
  id: string;
  name: string;
  targetPublisher: string;
  submissionType: 'query' | 'synopsis' | 'partial' | 'full';
  requirements: SubmissionRequirement[];
  documents: SubmissionDocument[];
  status: 'draft' | 'ready' | 'submitted' | 'responded';
  createdAt: Date;
  submittedAt?: Date;
  responseAt?: Date;
  notes: string;
}

export interface SubmissionRequirement {
  type: 'query-letter' | 'synopsis' | 'sample-pages' | 'full-manuscript' | 'author-bio' | 'cover-letter';
  description: string;
  wordLimit?: number;
  pageLimit?: number;
  format: string;
  required: boolean;
}

export interface SubmissionDocument {
  type: string;
  name: string;
  content: string;
  wordCount: number;
  pageCount: number;
  format: ExportFormat;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishingGuideline {
  id: string;
  publisher: string;
  category: string;
  requirements: SubmissionRequirement[];
  preferences: {
    genres: string[];
    wordCountRange: {
      min: number;
      max: number;
    };
    formatPreferences: string[];
    responseTime: string;
    exclusivity: boolean;
  };
  contactInfo: {
    email?: string;
    website?: string;
    submissionPortal?: string;
  };
  notes: string;
  lastUpdated: Date;
}

export interface FormattingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  settings: ManuscriptSettings;
  samples: {
    chapter: string;
    scene: string;
    dialogue: string;
  };
  usageCount: number;
  rating: number;
  createdAt: Date;
  isOfficial: boolean;
}

export interface QualityCheck {
  category: 'formatting' | 'structure' | 'content' | 'submission';
  severity: 'error' | 'warning' | 'suggestion';
  description: string;
  location?: {
    chapter?: number;
    page?: number;
    line?: number;
  };
  suggestion: string;
  autoFixAvailable: boolean;
}

export interface ManuscriptAnalysis {
  wordCount: {
    total: number;
    byChapter: number[];
    average: number;
    target: number;
  };
  readabilityScore: number;
  pacing: {
    dialogueRatio: number;
    actionRatio: number;
    descriptionRatio: number;
    narrativeRatio: number;
  };
  structureAnalysis: {
    chapterBalance: 'good' | 'uneven' | 'poor';
    sceneFlow: 'smooth' | 'choppy' | 'inconsistent';
    pacing: 'well-paced' | 'rushed' | 'slow';
  };
  qualityChecks: QualityCheck[];
  recommendations: string[];
}

export interface ExportJob {
  id: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  outputPath?: string;
  error?: string;
  settings: ManuscriptSettings;
}

class ManuscriptPreparationService extends BrowserEventEmitter {
  private formats: Map<string, ManuscriptFormat>;
  private templates: Map<string, FormattingTemplate>;
  private guidelines: Map<string, PublishingGuideline>;
  private packages: Map<string, SubmissionPackage>;
  private exportJobs: Map<string, ExportJob>;
  private defaultSettings: ManuscriptSettings;

  constructor() {
    super();
    this.formats = new Map();
    this.templates = new Map();
    this.guidelines = new Map();
    this.packages = new Map();
    this.exportJobs = new Map();
    
    this.defaultSettings = this.createDefaultSettings();
    this.initializeIndustryFormats();
    this.initializeFormattingTemplates();
    this.initializePublishingGuidelines();
    this.loadUserData();
  }

  private createDefaultSettings(): ManuscriptSettings {
    return {
      pageSetup: {
        size: 'letter',
        orientation: 'portrait',
        margins: {
          top: 1.0,
          bottom: 1.0,
          left: 1.25,
          right: 1.25
        }
      },
      typography: {
        fontFamily: 'Times New Roman',
        fontSize: 12,
        lineHeight: 2.0,
        paragraphSpacing: 0,
        indentation: {
          firstLine: 0.5,
          hanging: 0
        }
      },
      headers: {
        includePageNumbers: true,
        includeAuthorName: true,
        includeTitle: true,
        position: 'top-right',
        format: '{author} / {title} / {page}'
      },
      chapters: {
        startOnNewPage: true,
        numberFormat: 'spelled',
        titleFormat: 'Chapter {number}: {title}',
        spacing: {
          before: 6,
          after: 3
        }
      },
      scenes: {
        separator: '***',
        spacing: {
          before: 1,
          after: 1
        }
      },
      dialogue: {
        indentation: 0,
        quotationStyle: 'american',
        paragraphBreaks: true
      }
    };
  }

  private initializeIndustryFormats(): void {
    const formats: ManuscriptFormat[] = [
      {
        id: 'standard-novel',
        name: 'Standard Novel Manuscript',
        description: 'Industry-standard format for novel submissions to agents and publishers',
        category: 'industry',
        settings: this.defaultSettings,
        requirements: [
          'Double-spaced throughout',
          'Times New Roman 12pt font',
          '1-inch margins on all sides',
          'Header with author name, title, and page number',
          'Chapter breaks on new pages'
        ],
        exportFormats: [
          {
            type: 'docx',
            name: 'Microsoft Word Document',
            description: 'Standard submission format',
            quality: 'final',
            options: { compatibility: 'word2016' }
          },
          {
            type: 'pdf',
            name: 'PDF Document',
            description: 'Read-only submission format',
            quality: 'final',
            options: { embedFonts: true }
          }
        ],
        isDefault: true,
        isCustom: false
      },
      {
        id: 'screenplay',
        name: 'Screenplay Format',
        description: 'Industry-standard screenplay formatting',
        category: 'industry',
        settings: {
          ...this.defaultSettings,
          typography: {
            ...this.defaultSettings.typography,
            fontFamily: 'Courier New',
            lineHeight: 1.0
          },
          pageSetup: {
            ...this.defaultSettings.pageSetup,
            margins: {
              top: 1.0,
              bottom: 1.0,
              left: 1.5,
              right: 1.0
            }
          }
        },
        requirements: [
          'Courier New 12pt font',
          'Specific margins for dialogue and action',
          'Scene headings in all caps',
          'Character names centered above dialogue'
        ],
        exportFormats: [
          {
            type: 'pdf',
            name: 'Final Draft PDF',
            description: 'Industry-standard screenplay format',
            quality: 'final',
            options: { screenplayFormat: true }
          }
        ],
        isDefault: false,
        isCustom: false
      },
      {
        id: 'academic-paper',
        name: 'Academic Paper',
        description: 'MLA/APA style academic formatting',
        category: 'academic',
        settings: {
          ...this.defaultSettings,
          headers: {
            ...this.defaultSettings.headers,
            format: '{author} {page}'
          },
          chapters: {
            ...this.defaultSettings.chapters,
            startOnNewPage: false
          }
        },
        requirements: [
          'Double-spaced text',
          'Works Cited page',
          'In-text citations',
          'Proper heading format'
        ],
        exportFormats: [
          {
            type: 'docx',
            name: 'Academic Paper',
            description: 'Formatted for academic submission',
            quality: 'final',
            options: { academicStyle: 'mla' }
          }
        ],
        isDefault: false,
        isCustom: false
      }
    ];

    formats.forEach(format => {
      this.formats.set(format.id, format);
    });
  }

  private initializeFormattingTemplates(): void {
    const templates: FormattingTemplate[] = [
      {
        id: 'professional-novel',
        name: 'Professional Novel Template',
        description: 'Clean, professional formatting for commercial fiction',
        category: 'fiction',
        settings: this.defaultSettings,
        samples: {
          chapter: 'Chapter One\n\nThe morning sun cast long shadows...',
          scene: '***\n\nThree hours later, Sarah found herself...',
          dialogue: '"I can\'t believe you said that," she whispered.\n\n"I had to," he replied.'
        },
        usageCount: 0,
        rating: 5.0,
        createdAt: new Date(),
        isOfficial: true
      },
      {
        id: 'literary-fiction',
        name: 'Literary Fiction Template',
        description: 'Elegant formatting for literary works',
        category: 'literary',
        settings: {
          ...this.defaultSettings,
          scenes: {
            separator: '◆ ◆ ◆',
            spacing: { before: 2, after: 2 }
          }
        },
        samples: {
          chapter: 'I.\n\nIn the beginning was the word...',
          scene: '◆ ◆ ◆\n\nMemory, like water, finds its own level...',
          dialogue: '"The heart," she said, "remembers what the mind forgets."'
        },
        usageCount: 0,
        rating: 4.8,
        createdAt: new Date(),
        isOfficial: true
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializePublishingGuidelines(): void {
    const guidelines: PublishingGuideline[] = [
      {
        id: 'penguin-random-house',
        publisher: 'Penguin Random House',
        category: 'major-publisher',
        requirements: [
          {
            type: 'query-letter',
            description: 'One-page query letter',
            wordLimit: 300,
            format: 'Email or postal',
            required: true
          },
          {
            type: 'synopsis',
            description: 'One to two page synopsis',
            pageLimit: 2,
            format: 'Double-spaced',
            required: true
          },
          {
            type: 'sample-pages',
            description: 'First 5-50 pages',
            pageLimit: 50,
            format: 'Standard manuscript format',
            required: true
          }
        ],
        preferences: {
          genres: ['Literary Fiction', 'Commercial Fiction', 'Mystery', 'Romance'],
          wordCountRange: { min: 70000, max: 100000 },
          formatPreferences: ['docx', 'pdf'],
          responseTime: '6-8 weeks',
          exclusivity: false
        },
        contactInfo: {
          website: 'https://www.penguinrandomhouse.com/about/submissions',
          submissionPortal: 'QueryManager'
        },
        notes: 'Submit through literary agents only. No unsolicited manuscripts.',
        lastUpdated: new Date()
      }
    ];

    guidelines.forEach(guideline => {
      this.guidelines.set(guideline.id, guideline);
    });
  }

  private loadUserData(): void {
    try {
      const savedPackages = localStorage.getItem('manuscriptPreparation_packages');
      if (savedPackages) {
        const packages = JSON.parse(savedPackages);
        packages.forEach((pkg: any) => {
          this.packages.set(pkg.id, {
            ...pkg,
            createdAt: new Date(pkg.createdAt),
            submittedAt: pkg.submittedAt ? new Date(pkg.submittedAt) : undefined,
            responseAt: pkg.responseAt ? new Date(pkg.responseAt) : undefined
          });
        });
      }

      const savedTemplates = localStorage.getItem('manuscriptPreparation_customTemplates');
      if (savedTemplates) {
        const templates = JSON.parse(savedTemplates);
        templates.forEach((template: any) => {
          this.templates.set(template.id, {
            ...template,
            createdAt: new Date(template.createdAt)
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load manuscript preparation data:', error);
    }
  }

  private saveUserData(): void {
    try {
      const packages = Array.from(this.packages.values()).filter(pkg => pkg.status !== 'draft' || pkg.name !== 'New Submission Package');
      localStorage.setItem('manuscriptPreparation_packages', JSON.stringify(packages));

      const customTemplates = Array.from(this.templates.values()).filter(template => !template.isOfficial);
      localStorage.setItem('manuscriptPreparation_customTemplates', JSON.stringify(customTemplates));
    } catch (error) {
      console.warn('Failed to save manuscript preparation data:', error);
    }
  }

  public getFormats(): ManuscriptFormat[] {
    return Array.from(this.formats.values());
  }

  public getFormatById(id: string): ManuscriptFormat | null {
    return this.formats.get(id) || null;
  }

  public getFormatsByCategory(category: string): ManuscriptFormat[] {
    return Array.from(this.formats.values()).filter(format => format.category === category);
  }

  public createCustomFormat(formatData: Partial<ManuscriptFormat>): ManuscriptFormat {
    const format: ManuscriptFormat = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formatData.name || 'Custom Format',
      description: formatData.description || '',
      category: formatData.category || 'self-publishing',
      settings: formatData.settings || this.defaultSettings,
      requirements: formatData.requirements || [],
      exportFormats: formatData.exportFormats || [],
      isDefault: false,
      isCustom: true
    };

    this.formats.set(format.id, format);
    this.saveUserData();
    this.emit('formatCreated', format);
    return format;
  }

  public updateFormat(id: string, updates: Partial<ManuscriptFormat>): ManuscriptFormat | null {
    const format = this.formats.get(id);
    if (!format || !format.isCustom) {
      return null;
    }

    const updatedFormat = { ...format, ...updates };
    this.formats.set(id, updatedFormat);
    this.saveUserData();
    this.emit('formatUpdated', updatedFormat);
    return updatedFormat;
  }

  public deleteFormat(id: string): boolean {
    const format = this.formats.get(id);
    if (!format || !format.isCustom) {
      return false;
    }

    this.formats.delete(id);
    this.saveUserData();
    this.emit('formatDeleted', { id, format });
    return true;
  }

  public getTemplates(): FormattingTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => b.rating - a.rating);
  }

  public getTemplateById(id: string): FormattingTemplate | null {
    return this.templates.get(id) || null;
  }

  public getTemplatesByCategory(category: string): FormattingTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  public analyzeManuscript(content: string, metadata: Partial<ManuscriptMetadata>): ManuscriptAnalysis {
    const words = content.trim().split(/\s+/).length;
    const chapters = content.split(/Chapter \d+/i).length - 1;
    const dialogueMatches = content.match(/"[^"]*"/g) || [];
    const actionMatches = content.match(/\b(ran|jumped|fought|drove|walked)\b/gi) || [];
    
    const dialogueRatio = dialogueMatches.length / words * 100;
    const actionRatio = actionMatches.length / words * 100;
    
    const qualityChecks: QualityCheck[] = [];
    
    if (words < 50000) {
      qualityChecks.push({
        category: 'content',
        severity: 'warning',
        description: 'Manuscript may be too short for commercial fiction',
        suggestion: 'Consider expanding to at least 70,000 words',
        autoFixAvailable: false
      });
    }

    if (dialogueRatio < 10) {
      qualityChecks.push({
        category: 'content',
        severity: 'suggestion',
        description: 'Low dialogue ratio detected',
        suggestion: 'Consider adding more character interactions',
        autoFixAvailable: false
      });
    }

    return {
      wordCount: {
        total: words,
        byChapter: Array(chapters).fill(Math.floor(words / chapters)),
        average: Math.floor(words / chapters),
        target: metadata.genre === 'Romance' ? 70000 : 80000
      },
      readabilityScore: this.calculateReadabilityScore(content),
      pacing: {
        dialogueRatio,
        actionRatio,
        descriptionRatio: 100 - dialogueRatio - actionRatio - 20,
        narrativeRatio: 20
      },
      structureAnalysis: {
        chapterBalance: chapters > 0 && words / chapters > 2000 ? 'good' : 'uneven',
        sceneFlow: 'smooth',
        pacing: words > 60000 ? 'well-paced' : 'rushed'
      },
      qualityChecks,
      recommendations: [
        'Consider adding scene breaks for better pacing',
        'Review chapter lengths for consistency',
        'Ensure proper manuscript formatting before submission'
      ]
    };
  }

  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.trim().split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, fleschScore));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .split(/\s+/)
      .reduce((count, word) => {
        const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
        return count + syllableCount;
      }, 0);
  }

  public formatManuscript(content: string, formatId: string): string {
    const format = this.getFormatById(formatId);
    if (!format) {
      throw new Error(`Format not found: ${formatId}`);
    }

    let formatted = content;
    const settings = format.settings;

    formatted = formatted.replace(/\n\n+/g, '\n\n');
    
    if (settings.chapters.startOnNewPage) {
      formatted = formatted.replace(/(Chapter \d+[^\n]*)/g, '\n\n$1');
    }

    if (settings.scenes.separator) {
      formatted = formatted.replace(/\*\*\*/g, settings.scenes.separator);
    }

    this.emit('manuscriptFormatted', { formatId, wordCount: content.split(/\s+/).length });
    return formatted;
  }

  public createSubmissionPackage(packageData: Partial<SubmissionPackage>): SubmissionPackage {
    const pkg: SubmissionPackage = {
      id: `package-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: packageData.name || 'New Submission Package',
      targetPublisher: packageData.targetPublisher || '',
      submissionType: packageData.submissionType || 'query',
      requirements: packageData.requirements || [],
      documents: packageData.documents || [],
      status: 'draft',
      createdAt: new Date(),
      notes: packageData.notes || ''
    };

    this.packages.set(pkg.id, pkg);
    this.saveUserData();
    this.emit('packageCreated', pkg);
    return pkg;
  }

  public updateSubmissionPackage(id: string, updates: Partial<SubmissionPackage>): SubmissionPackage | null {
    const pkg = this.packages.get(id);
    if (!pkg) {
      return null;
    }

    const updatedPackage = { ...pkg, ...updates };
    this.packages.set(id, updatedPackage);
    this.saveUserData();
    this.emit('packageUpdated', updatedPackage);
    return updatedPackage;
  }

  public getSubmissionPackages(): SubmissionPackage[] {
    return Array.from(this.packages.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getPackageById(id: string): SubmissionPackage | null {
    return this.packages.get(id) || null;
  }

  public exportManuscript(content: string, format: ExportFormat, settings: ManuscriptSettings): string {
    const jobId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ExportJob = {
      id: jobId,
      format,
      status: 'processing',
      progress: 0,
      startTime: new Date(),
      settings
    };

    this.exportJobs.set(jobId, job);
    this.emit('exportStarted', job);

    setTimeout(() => {
      job.progress = 50;
      this.emit('exportProgress', job);

      setTimeout(() => {
        job.status = 'completed';
        job.progress = 100;
        job.endTime = new Date();
        job.outputPath = `/exports/${jobId}.${format.type}`;
        
        this.emit('exportCompleted', job);
      }, 1000);
    }, 500);

    return jobId;
  }

  public getExportJob(id: string): ExportJob | null {
    return this.exportJobs.get(id) || null;
  }

  public getPublishingGuidelines(): PublishingGuideline[] {
    return Array.from(this.guidelines.values()).sort((a, b) => a.publisher.localeCompare(b.publisher));
  }

  public getGuidelineById(id: string): PublishingGuideline | null {
    return this.guidelines.get(id) || null;
  }

  public searchGuidelines(query: string): PublishingGuideline[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.guidelines.values()).filter(guideline =>
      guideline.publisher.toLowerCase().includes(lowercaseQuery) ||
      guideline.category.toLowerCase().includes(lowercaseQuery) ||
      guideline.preferences.genres.some(genre => genre.toLowerCase().includes(lowercaseQuery))
    );
  }

  public validateSubmission(packageId: string): QualityCheck[] {
    const pkg = this.getPackageById(packageId);
    if (!pkg) {
      return [];
    }

    const checks: QualityCheck[] = [];

    pkg.requirements.forEach(requirement => {
      const document = pkg.documents.find(doc => doc.type === requirement.type);
      
      if (requirement.required && !document) {
        checks.push({
          category: 'submission',
          severity: 'error',
          description: `Missing required document: ${requirement.type}`,
          suggestion: `Create ${requirement.description}`,
          autoFixAvailable: false
        });
      }

      if (document && requirement.wordLimit && document.wordCount > requirement.wordLimit) {
        checks.push({
          category: 'submission',
          severity: 'error',
          description: `Document exceeds word limit: ${document.wordCount}/${requirement.wordLimit}`,
          suggestion: `Reduce word count by ${document.wordCount - requirement.wordLimit} words`,
          autoFixAvailable: false
        });
      }
    });

    return checks;
  }

  public getAnalytics(): any {
    const totalPackages = this.packages.size;
    const submittedPackages = Array.from(this.packages.values()).filter(pkg => pkg.status === 'submitted').length;
    const respondedPackages = Array.from(this.packages.values()).filter(pkg => pkg.status === 'responded').length;
    
    const popularFormats = Array.from(this.formats.values())
      .sort((a, b) => (b as any).usageCount - (a as any).usageCount)
      .slice(0, 5);

    const totalExports = this.exportJobs.size;
    const completedExports = Array.from(this.exportJobs.values()).filter(job => job.status === 'completed').length;

    return {
      packages: {
        total: totalPackages,
        submitted: submittedPackages,
        responded: respondedPackages,
        responseRate: submittedPackages > 0 ? (respondedPackages / submittedPackages) * 100 : 0
      },
      formats: {
        total: this.formats.size,
        custom: Array.from(this.formats.values()).filter(f => f.isCustom).length,
        popular: popularFormats
      },
      exports: {
        total: totalExports,
        completed: completedExports,
        successRate: totalExports > 0 ? (completedExports / totalExports) * 100 : 0
      },
      templates: {
        total: this.templates.size,
        custom: Array.from(this.templates.values()).filter(t => !t.isOfficial).length
      }
    };
  }
}

export const manuscriptPreparationService = new ManuscriptPreparationService();