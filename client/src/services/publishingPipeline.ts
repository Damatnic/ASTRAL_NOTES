import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface PublishingFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
  category: 'manuscript' | 'ebook' | 'web' | 'print' | 'submission';
  requiresProcessing: boolean;
  processingSteps: string[];
  outputOptions: Record<string, any>;
}

export interface ExportOptions {
  format: string;
  includeMetadata: boolean;
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  includeFootnotes: boolean;
  pageSize?: 'A4' | 'US Letter' | 'Custom';
  margins?: { top: number; right: number; bottom: number; left: number };
  fontSize?: number;
  fontFamily?: string;
  lineSpacing?: number;
  chapterBreaks?: 'page' | 'section' | 'none';
  customStyles?: Record<string, any>;
  watermark?: string;
  headerFooter?: {
    includePageNumbers: boolean;
    includeTitle: boolean;
    includeAuthor: boolean;
    customHeader?: string;
    customFooter?: string;
  };
}

export interface PublishingProject {
  id: string;
  name: string;
  sourceProjectId: string;
  targetFormats: string[];
  status: 'draft' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  exports: PublishingExport[];
  settings: {
    autoExport: boolean;
    exportOnChange: boolean;
    notifyOnCompletion: boolean;
    retainVersions: number;
  };
}

export interface PublishingExport {
  id: string;
  projectId: string;
  format: string;
  options: ExportOptions;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  metadata: {
    title: string;
    author: string;
    description?: string;
    genre?: string[];
    language: string;
    wordCount: number;
    pageCount?: number;
    version: string;
  };
}

export interface MarketplaceSubmission {
  id: string;
  exportId: string;
  platform: 'kindle' | 'kobo' | 'apple_books' | 'google_play' | 'draft2digital' | 'smashwords' | 'custom';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published';
  submissionData: {
    title: string;
    description: string;
    categories: string[];
    tags: string[];
    price?: number;
    currency?: string;
    releaseDate?: string;
    isbn?: string;
    coverImage?: string;
    preorderEnabled?: boolean;
  };
  platformResponse?: any;
  createdAt: number;
  submittedAt?: number;
  publishedAt?: number;
}

export interface PublishingAnalytics {
  overview: {
    totalProjects: number;
    totalExports: number;
    totalSubmissions: number;
    successRate: number;
    averageProcessingTime: number;
  };
  formats: {
    formatUsage: Record<string, number>;
    formatSuccessRates: Record<string, number>;
    formatProcessingTimes: Record<string, number>;
  };
  performance: {
    dailyExports: Array<{ date: string; count: number }>;
    monthlyTrends: Array<{ month: string; exports: number; submissions: number }>;
    errorRates: Array<{ period: string; errorRate: number }>;
  };
  quality: {
    averageFileSize: Record<string, number>;
    compressionRates: Record<string, number>;
    validationScores: Record<string, number>;
  };
}

export class PublishingPipeline extends BrowserEventEmitter {
  private formats: Map<string, PublishingFormat> = new Map();
  private projects: Map<string, PublishingProject> = new Map();
  private exports: Map<string, PublishingExport> = new Map();
  private submissions: Map<string, MarketplaceSubmission> = new Map();
  private activeProject: string | null = null;

  constructor() {
    super();
    this.initializeFormats();
    this.loadData();
  }

  private initializeFormats(): void {
    const formats: PublishingFormat[] = [
      {
        id: 'docx',
        name: 'Microsoft Word Document',
        description: 'Standard manuscript format for submissions',
        extension: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: 'manuscript',
        requiresProcessing: true,
        processingSteps: ['format', 'styles', 'pagination'],
        outputOptions: {
          trackChanges: false,
          comments: false,
          standardFormatting: true
        }
      },
      {
        id: 'pdf',
        name: 'PDF Document',
        description: 'Professional document format',
        extension: '.pdf',
        mimeType: 'application/pdf',
        category: 'manuscript',
        requiresProcessing: true,
        processingSteps: ['format', 'render', 'compress'],
        outputOptions: {
          quality: 'high',
          searchable: true,
          passwordProtect: false
        }
      },
      {
        id: 'epub',
        name: 'EPUB eBook',
        description: 'Standard eBook format for most platforms',
        extension: '.epub',
        mimeType: 'application/epub+zip',
        category: 'ebook',
        requiresProcessing: true,
        processingSteps: ['structure', 'metadata', 'validation', 'package'],
        outputOptions: {
          version: '3.0',
          flowable: true,
          drm: false
        }
      },
      {
        id: 'mobi',
        name: 'Kindle MOBI',
        description: 'Amazon Kindle format',
        extension: '.mobi',
        mimeType: 'application/x-mobipocket-ebook',
        category: 'ebook',
        requiresProcessing: true,
        processingSteps: ['convert', 'optimize', 'validate'],
        outputOptions: {
          kindleGen: true,
          compression: 'high'
        }
      },
      {
        id: 'html',
        name: 'Web Page',
        description: 'HTML format for web publishing',
        extension: '.html',
        mimeType: 'text/html',
        category: 'web',
        requiresProcessing: true,
        processingSteps: ['markup', 'styling', 'responsive'],
        outputOptions: {
          responsive: true,
          darkMode: true,
          printStyles: true
        }
      },
      {
        id: 'markdown',
        name: 'Markdown',
        description: 'Plain text format with markup',
        extension: '.md',
        mimeType: 'text/markdown',
        category: 'web',
        requiresProcessing: false,
        processingSteps: [],
        outputOptions: {
          flavor: 'github',
          extensions: true
        }
      },
      {
        id: 'rtf',
        name: 'Rich Text Format',
        description: 'Cross-platform rich text format',
        extension: '.rtf',
        mimeType: 'application/rtf',
        category: 'submission',
        requiresProcessing: true,
        processingSteps: ['format', 'compatibility'],
        outputOptions: {
          version: '1.9',
          compatibility: 'high'
        }
      },
      {
        id: 'txt',
        name: 'Plain Text',
        description: 'Simple text format',
        extension: '.txt',
        mimeType: 'text/plain',
        category: 'submission',
        requiresProcessing: false,
        processingSteps: [],
        outputOptions: {
          encoding: 'utf-8',
          lineBreaks: 'system'
        }
      }
    ];

    formats.forEach(format => this.formats.set(format.id, format));
  }

  setActiveProject(projectId: string): void {
    this.activeProject = projectId;
  }

  createPublishingProject(sourceProjectId: string, name: string, targetFormats: string[]): PublishingProject {
    const project: PublishingProject = {
      id: this.generateId(),
      name,
      sourceProjectId,
      targetFormats,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      exports: [],
      settings: {
        autoExport: false,
        exportOnChange: false,
        notifyOnCompletion: true,
        retainVersions: 5
      }
    };

    this.projects.set(project.id, project);
    this.saveData();
    this.emit('publishingProjectCreated', project);
    return project;
  }

  updatePublishingProject(projectId: string, updates: Partial<PublishingProject>): PublishingProject | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const updatedProject = { ...project, ...updates, updatedAt: Date.now() };
    this.projects.set(projectId, updatedProject);
    this.saveData();
    this.emit('publishingProjectUpdated', updatedProject);
    return updatedProject;
  }

  deletePublishingProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    // Delete all related exports
    const projectExports = Array.from(this.exports.values()).filter(exp => exp.projectId === projectId);
    projectExports.forEach(exp => this.exports.delete(exp.id));

    // Delete all related submissions
    const projectSubmissions = Array.from(this.submissions.values()).filter(sub => 
      projectExports.some(exp => exp.id === sub.exportId)
    );
    projectSubmissions.forEach(sub => this.submissions.delete(sub.id));

    this.projects.delete(projectId);
    this.saveData();
    this.emit('publishingProjectDeleted', project);
    return true;
  }

  async createExport(projectId: string, format: string, options: ExportOptions, content: string, metadata: any): Promise<PublishingExport> {
    const project = this.projects.get(projectId);
    const formatConfig = this.formats.get(format);
    
    if (!project || !formatConfig) {
      throw new Error('Invalid project or format');
    }

    const exportJob: PublishingExport = {
      id: this.generateId(),
      projectId,
      format,
      options,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      metadata: {
        title: metadata.title || 'Untitled',
        author: metadata.author || 'Unknown Author',
        description: metadata.description,
        genre: metadata.genre || [],
        language: metadata.language || 'en',
        wordCount: this.estimateWordCount(content),
        version: metadata.version || '1.0'
      }
    };

    this.exports.set(exportJob.id, exportJob);
    this.saveData();
    this.emit('exportStarted', exportJob);

    // Start processing
    this.processExport(exportJob, content);

    return exportJob;
  }

  private async processExport(exportJob: PublishingExport, content: string): Promise<void> {
    try {
      const format = this.formats.get(exportJob.format)!;
      
      exportJob.status = 'processing';
      exportJob.progress = 10;
      this.emit('exportProgress', exportJob);

      // Simulate processing steps
      for (let i = 0; i < format.processingSteps.length; i++) {
        const step = format.processingSteps[i];
        await this.processStep(step, content, exportJob.options);
        
        exportJob.progress = 10 + (80 * (i + 1)) / format.processingSteps.length;
        this.emit('exportProgress', exportJob);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate final output
      const processedContent = await this.generateOutput(content, exportJob.format, exportJob.options);
      const blob = new Blob([processedContent], { type: format.mimeType });
      
      exportJob.fileSize = blob.size;
      exportJob.downloadUrl = URL.createObjectURL(blob);
      exportJob.status = 'completed';
      exportJob.progress = 100;
      exportJob.completedAt = Date.now();

      // Update metadata
      if (exportJob.format === 'pdf' || exportJob.format === 'docx') {
        exportJob.metadata.pageCount = this.estimatePageCount(content, exportJob.options);
      }

      this.exports.set(exportJob.id, exportJob);
      this.saveData();
      this.emit('exportCompleted', exportJob);

    } catch (error) {
      exportJob.status = 'failed';
      exportJob.error = error instanceof Error ? error.message : 'Unknown error';
      exportJob.completedAt = Date.now();
      
      this.exports.set(exportJob.id, exportJob);
      this.saveData();
      this.emit('exportFailed', exportJob);
    }
  }

  private async processStep(step: string, content: string, options: ExportOptions): Promise<void> {
    // Simulate processing step
    switch (step) {
      case 'format':
        await this.applyFormatting(content, options);
        break;
      case 'styles':
        await this.applyStyles(content, options);
        break;
      case 'pagination':
        await this.applyPagination(content, options);
        break;
      case 'structure':
        await this.structureContent(content, options);
        break;
      case 'metadata':
        await this.embedMetadata(content, options);
        break;
      case 'validation':
        await this.validateOutput(content, options);
        break;
      default:
        break;
    }
  }

  private async generateOutput(content: string, format: string, options: ExportOptions): Promise<string> {
    // This would normally generate the actual file content
    // For now, we'll return a formatted version of the content
    
    let output = content;
    
    if (options.includeCoverPage) {
      output = this.addCoverPage(output, options);
    }
    
    if (options.includeTableOfContents) {
      output = this.addTableOfContents(output, options);
    }
    
    if (options.includeFootnotes) {
      output = this.processFootnotes(output, options);
    }
    
    return this.formatForTarget(output, format, options);
  }

  private addCoverPage(content: string, options: ExportOptions): string {
    return `COVER PAGE\n\n${content}`;
  }

  private addTableOfContents(content: string, options: ExportOptions): string {
    const chapters = this.extractChapters(content);
    const toc = chapters.map((chapter, index) => `${index + 1}. ${chapter}`).join('\n');
    return `TABLE OF CONTENTS\n\n${toc}\n\n${content}`;
  }

  private processFootnotes(content: string, options: ExportOptions): string {
    // Process footnotes in the content
    return content;
  }

  private formatForTarget(content: string, format: string, options: ExportOptions): string {
    switch (format) {
      case 'html':
        return this.convertToHTML(content, options);
      case 'markdown':
        return this.convertToMarkdown(content, options);
      case 'epub':
        return this.convertToEPUB(content, options);
      case 'pdf':
        return this.convertToPDF(content, options);
      case 'docx':
        return this.convertToDOCX(content, options);
      case 'rtf':
        return this.convertToRTF(content, options);
      default:
        return content;
    }
  }

  private convertToHTML(content: string, options: ExportOptions): string {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.includeMetadata ? 'Document' : ''}</title>
    <style>
        body { 
            font-family: ${options.fontFamily || 'Georgia, serif'}; 
            font-size: ${options.fontSize || 12}pt;
            line-height: ${options.lineSpacing || 1.5};
            margin: ${options.margins?.top || 1}in ${options.margins?.right || 1}in ${options.margins?.bottom || 1}in ${options.margins?.left || 1}in;
        }
        .chapter { page-break-before: ${options.chapterBreaks === 'page' ? 'always' : 'auto'}; }
    </style>
</head>
<body>
${content.replace(/\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}
</body>
</html>`;
    return html;
  }

  private convertToMarkdown(content: string, options: ExportOptions): string {
    return content; // Already in markdown-like format
  }

  private convertToEPUB(content: string, options: ExportOptions): string {
    // EPUB would require complex structure generation
    return `EPUB: ${content}`;
  }

  private convertToPDF(content: string, options: ExportOptions): string {
    return `PDF: ${content}`;
  }

  private convertToDOCX(content: string, options: ExportOptions): string {
    return `DOCX: ${content}`;
  }

  private convertToRTF(content: string, options: ExportOptions): string {
    return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content}}`;
  }

  async submitToMarketplace(exportId: string, platform: string, submissionData: any): Promise<MarketplaceSubmission> {
    const exportJob = this.exports.get(exportId);
    if (!exportJob || exportJob.status !== 'completed') {
      throw new Error('Export not found or not completed');
    }

    const submission: MarketplaceSubmission = {
      id: this.generateId(),
      exportId,
      platform: platform as any,
      status: 'draft',
      submissionData,
      createdAt: Date.now()
    };

    this.submissions.set(submission.id, submission);
    this.saveData();
    this.emit('submissionCreated', submission);

    // Simulate submission process
    setTimeout(() => {
      submission.status = 'submitted';
      submission.submittedAt = Date.now();
      this.submissions.set(submission.id, submission);
      this.emit('submissionSubmitted', submission);
    }, 1000);

    return submission;
  }

  getAllFormats(): PublishingFormat[] {
    return Array.from(this.formats.values());
  }

  getFormatsByCategory(category: string): PublishingFormat[] {
    return Array.from(this.formats.values()).filter(format => format.category === category);
  }

  getAllPublishingProjects(): PublishingProject[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getPublishingProject(projectId: string): PublishingProject | null {
    return this.projects.get(projectId) || null;
  }

  getExportsByProject(projectId: string): PublishingExport[] {
    return Array.from(this.exports.values())
      .filter(exp => exp.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getExport(exportId: string): PublishingExport | null {
    return this.exports.get(exportId) || null;
  }

  getSubmissionsByExport(exportId: string): MarketplaceSubmission[] {
    return Array.from(this.submissions.values())
      .filter(sub => sub.exportId === exportId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  generateAnalytics(): PublishingAnalytics {
    const allExports = Array.from(this.exports.values());
    const allSubmissions = Array.from(this.submissions.values());
    const completedExports = allExports.filter(exp => exp.status === 'completed');
    
    const successRate = allExports.length > 0 ? (completedExports.length / allExports.length) * 100 : 0;
    
    const totalProcessingTime = completedExports
      .filter(exp => exp.completedAt && exp.createdAt)
      .reduce((sum, exp) => sum + (exp.completedAt! - exp.createdAt), 0);
    
    const averageProcessingTime = completedExports.length > 0 ? totalProcessingTime / completedExports.length : 0;

    const formatUsage: Record<string, number> = {};
    const formatSuccessRates: Record<string, number> = {};
    const formatProcessingTimes: Record<string, number> = {};

    this.formats.forEach((format) => {
      const formatExports = allExports.filter(exp => exp.format === format.id);
      const formatCompleted = formatExports.filter(exp => exp.status === 'completed');
      
      formatUsage[format.name] = formatExports.length;
      formatSuccessRates[format.name] = formatExports.length > 0 ? (formatCompleted.length / formatExports.length) * 100 : 0;
      
      const formatTotalTime = formatCompleted
        .filter(exp => exp.completedAt && exp.createdAt)
        .reduce((sum, exp) => sum + (exp.completedAt! - exp.createdAt), 0);
      
      formatProcessingTimes[format.name] = formatCompleted.length > 0 ? formatTotalTime / formatCompleted.length : 0;
    });

    return {
      overview: {
        totalProjects: this.projects.size,
        totalExports: allExports.length,
        totalSubmissions: allSubmissions.length,
        successRate,
        averageProcessingTime: averageProcessingTime / 1000 // Convert to seconds
      },
      formats: {
        formatUsage,
        formatSuccessRates,
        formatProcessingTimes: Object.fromEntries(
          Object.entries(formatProcessingTimes).map(([key, value]) => [key, value / 1000])
        )
      },
      performance: {
        dailyExports: this.calculateDailyExports(allExports),
        monthlyTrends: this.calculateMonthlyTrends(allExports, allSubmissions),
        errorRates: this.calculateErrorRates(allExports)
      },
      quality: {
        averageFileSize: this.calculateAverageFileSizes(completedExports),
        compressionRates: this.calculateCompressionRates(completedExports),
        validationScores: this.calculateValidationScores(completedExports)
      }
    };
  }

  private calculateDailyExports(exports: PublishingExport[]): Array<{ date: string; count: number }> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      count: exports.filter(exp => {
        const expDate = new Date(exp.createdAt).toISOString().split('T')[0];
        return expDate === date;
      }).length
    }));
  }

  private calculateMonthlyTrends(exports: PublishingExport[], submissions: MarketplaceSubmission[]): Array<{ month: string; exports: number; submissions: number }> {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().substring(0, 7);
    }).reverse();

    return last6Months.map(month => ({
      month,
      exports: exports.filter(exp => {
        const expMonth = new Date(exp.createdAt).toISOString().substring(0, 7);
        return expMonth === month;
      }).length,
      submissions: submissions.filter(sub => {
        const subMonth = new Date(sub.createdAt).toISOString().substring(0, 7);
        return subMonth === month;
      }).length
    }));
  }

  private calculateErrorRates(exports: PublishingExport[]): Array<{ period: string; errorRate: number }> {
    return [];
  }

  private calculateAverageFileSizes(exports: PublishingExport[]): Record<string, number> {
    const sizes: Record<string, number[]> = {};
    
    exports.forEach(exp => {
      if (exp.fileSize) {
        if (!sizes[exp.format]) sizes[exp.format] = [];
        sizes[exp.format].push(exp.fileSize);
      }
    });

    const averages: Record<string, number> = {};
    Object.entries(sizes).forEach(([format, sizeArray]) => {
      averages[format] = sizeArray.reduce((sum, size) => sum + size, 0) / sizeArray.length;
    });

    return averages;
  }

  private calculateCompressionRates(exports: PublishingExport[]): Record<string, number> {
    // Mock compression rates
    return {
      'pdf': 85,
      'epub': 92,
      'docx': 78,
      'mobi': 88
    };
  }

  private calculateValidationScores(exports: PublishingExport[]): Record<string, number> {
    // Mock validation scores
    return {
      'epub': 95,
      'mobi': 92,
      'pdf': 98,
      'html': 94
    };
  }

  // Helper methods
  private async applyFormatting(content: string, options: ExportOptions): Promise<void> {}
  private async applyStyles(content: string, options: ExportOptions): Promise<void> {}
  private async applyPagination(content: string, options: ExportOptions): Promise<void> {}
  private async structureContent(content: string, options: ExportOptions): Promise<void> {}
  private async embedMetadata(content: string, options: ExportOptions): Promise<void> {}
  private async validateOutput(content: string, options: ExportOptions): Promise<void> {}

  private extractChapters(content: string): string[] {
    return content.split('\n').filter(line => line.startsWith('#')).map(line => line.replace(/^#+\s*/, ''));
  }

  private estimateWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimatePageCount(content: string, options: ExportOptions): number {
    const wordsPerPage = 250; // Standard estimate
    const wordCount = this.estimateWordCount(content);
    return Math.ceil(wordCount / wordsPerPage);
  }

  private generateId(): string {
    return `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveData(): void {
    const data = {
      projects: Array.from(this.projects.entries()),
      exports: Array.from(this.exports.entries()),
      submissions: Array.from(this.submissions.entries())
    };
    localStorage.setItem('publishingPipeline', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('publishingPipeline');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      this.projects.clear();
      if (data.projects) {
        data.projects.forEach(([id, project]: [string, PublishingProject]) => {
          this.projects.set(id, project);
        });
      }

      this.exports.clear();
      if (data.exports) {
        data.exports.forEach(([id, exportJob]: [string, PublishingExport]) => {
          this.exports.set(id, exportJob);
        });
      }

      this.submissions.clear();
      if (data.submissions) {
        data.submissions.forEach(([id, submission]: [string, MarketplaceSubmission]) => {
          this.submissions.set(id, submission);
        });
      }
    } catch (error) {
      console.error('Failed to load publishing pipeline data:', error);
    }
  }
}