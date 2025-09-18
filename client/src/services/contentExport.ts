/**
 * Content Export Service
 * Handles exporting writing content to various formats and platforms
 * Supports multiple output formats, templates, and publishing destinations
 */

import { EventEmitter } from 'events';

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  supportsMetadata: boolean;
  supportsImages: boolean;
  supportsCustomStyling: boolean;
  category: 'document' | 'web' | 'ebook' | 'social' | 'code';
}

export interface ExportTemplate {
  id: string;
  name: string;
  format: string;
  description: string;
  category: 'academic' | 'creative' | 'business' | 'personal' | 'technical';
  customizable: boolean;
  previewUrl?: string;
  settings: Record<string, any>;
}

export interface ExportOptions {
  format: string;
  template?: string;
  includeMetadata: boolean;
  includeImages: boolean;
  includeComments: boolean;
  customStyling?: string;
  compression?: 'none' | 'zip' | 'gzip';
  watermark?: string;
  password?: string;
  quality: 'draft' | 'standard' | 'high' | 'print';
}

export interface ExportJob {
  id: string;
  title: string;
  contentIds: string[];
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  completedAt?: number;
  outputUrl?: string;
  error?: string;
  estimatedSize: number;
  actualSize?: number;
}

export interface PublishingDestination {
  id: string;
  name: string;
  type: 'blog' | 'social' | 'portfolio' | 'repository' | 'cloud';
  apiEndpoint?: string;
  authRequired: boolean;
  supportsScheduling: boolean;
  maxFileSize: number;
  supportedFormats: string[];
  customFields: Record<string, any>;
}

export interface PublishingJob {
  id: string;
  exportJobId: string;
  destination: string;
  scheduledTime?: number;
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed';
  publishedUrl?: string;
  error?: string;
  metadata: Record<string, any>;
}

export interface ContentMetadata {
  id: string;
  title: string;
  author: string;
  tags: string[];
  category: string;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  version: string;
  description?: string;
  language: string;
}

class ContentExportService extends EventEmitter {
  private formats: Map<string, ExportFormat> = new Map();
  private templates: Map<string, ExportTemplate> = new Map();
  private destinations: Map<string, PublishingDestination> = new Map();
  private exportJobs: Map<string, ExportJob> = new Map();
  private publishingJobs: Map<string, PublishingJob> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.initializeFormats();
    this.initializeTemplates();
    this.initializeDestinations();
    this.loadJobsFromStorage();
  }

  private initializeFormats(): void {
    // Document formats
    this.formats.set('pdf', {
      id: 'pdf',
      name: 'PDF Document',
      extension: 'pdf',
      mimeType: 'application/pdf',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: true,
      category: 'document'
    });

    this.formats.set('docx', {
      id: 'docx',
      name: 'Microsoft Word',
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: true,
      category: 'document'
    });

    this.formats.set('rtf', {
      id: 'rtf',
      name: 'Rich Text Format',
      extension: 'rtf',
      mimeType: 'application/rtf',
      supportsMetadata: false,
      supportsImages: true,
      supportsCustomStyling: true,
      category: 'document'
    });

    // Web formats
    this.formats.set('html', {
      id: 'html',
      name: 'HTML Document',
      extension: 'html',
      mimeType: 'text/html',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: true,
      category: 'web'
    });

    this.formats.set('markdown', {
      id: 'markdown',
      name: 'Markdown',
      extension: 'md',
      mimeType: 'text/markdown',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: false,
      category: 'web'
    });

    // eBook formats
    this.formats.set('epub', {
      id: 'epub',
      name: 'EPUB eBook',
      extension: 'epub',
      mimeType: 'application/epub+zip',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: true,
      category: 'ebook'
    });

    this.formats.set('mobi', {
      id: 'mobi',
      name: 'MOBI eBook',
      extension: 'mobi',
      mimeType: 'application/x-mobipocket-ebook',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: false,
      category: 'ebook'
    });

    // Social formats
    this.formats.set('twitter', {
      id: 'twitter',
      name: 'Twitter Thread',
      extension: 'json',
      mimeType: 'application/json',
      supportsMetadata: false,
      supportsImages: true,
      supportsCustomStyling: false,
      category: 'social'
    });

    this.formats.set('linkedin', {
      id: 'linkedin',
      name: 'LinkedIn Article',
      extension: 'json',
      mimeType: 'application/json',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: false,
      category: 'social'
    });

    // Code formats
    this.formats.set('latex', {
      id: 'latex',
      name: 'LaTeX Document',
      extension: 'tex',
      mimeType: 'application/x-tex',
      supportsMetadata: true,
      supportsImages: true,
      supportsCustomStyling: true,
      category: 'code'
    });
  }

  private initializeTemplates(): void {
    // Academic templates
    this.templates.set('academic_paper', {
      id: 'academic_paper',
      name: 'Academic Paper',
      format: 'pdf',
      description: 'Standard academic paper format with proper citations',
      category: 'academic',
      customizable: true,
      settings: {
        fontSize: 12,
        lineSpacing: 'double',
        margins: 'standard',
        citationStyle: 'APA'
      }
    });

    this.templates.set('thesis', {
      id: 'thesis',
      name: 'Thesis/Dissertation',
      format: 'pdf',
      description: 'Multi-chapter thesis format with table of contents',
      category: 'academic',
      customizable: true,
      settings: {
        chapters: true,
        tableOfContents: true,
        bibliography: true,
        appendices: true
      }
    });

    // Creative templates
    this.templates.set('novel', {
      id: 'novel',
      name: 'Novel Manuscript',
      format: 'docx',
      description: 'Standard novel manuscript formatting',
      category: 'creative',
      customizable: true,
      settings: {
        fontSize: 12,
        font: 'Times New Roman',
        lineSpacing: 'double',
        indentFirstLine: true
      }
    });

    this.templates.set('screenplay', {
      id: 'screenplay',
      name: 'Screenplay',
      format: 'pdf',
      description: 'Industry standard screenplay format',
      category: 'creative',
      customizable: false,
      settings: {
        font: 'Courier New',
        fontSize: 12,
        margins: 'screenplay'
      }
    });

    // Business templates
    this.templates.set('report', {
      id: 'report',
      name: 'Business Report',
      format: 'pdf',
      description: 'Professional business report with charts and graphs',
      category: 'business',
      customizable: true,
      settings: {
        executiveSummary: true,
        charts: true,
        branding: true
      }
    });

    // Personal templates
    this.templates.set('journal', {
      id: 'journal',
      name: 'Personal Journal',
      format: 'pdf',
      description: 'Beautiful personal journal with custom styling',
      category: 'personal',
      customizable: true,
      settings: {
        dateHeaders: true,
        mood: true,
        photos: true,
        decorative: true
      }
    });

    // Technical templates
    this.templates.set('documentation', {
      id: 'documentation',
      name: 'Technical Documentation',
      format: 'html',
      description: 'Clean technical documentation with code highlighting',
      category: 'technical',
      customizable: true,
      settings: {
        codeHighlighting: true,
        apiReference: true,
        searchable: true
      }
    });
  }

  private initializeDestinations(): void {
    // Blog platforms
    this.destinations.set('wordpress', {
      id: 'wordpress',
      name: 'WordPress',
      type: 'blog',
      apiEndpoint: 'https://wordpress.com/wp-json/wp/v2/',
      authRequired: true,
      supportsScheduling: true,
      maxFileSize: 10 * 1024 * 1024,
      supportedFormats: ['html', 'markdown'],
      customFields: {
        categories: 'array',
        tags: 'array',
        featuredImage: 'string'
      }
    });

    this.destinations.set('medium', {
      id: 'medium',
      name: 'Medium',
      type: 'blog',
      apiEndpoint: 'https://api.medium.com/v1/',
      authRequired: true,
      supportsScheduling: false,
      maxFileSize: 5 * 1024 * 1024,
      supportedFormats: ['html', 'markdown'],
      customFields: {
        tags: 'array',
        canonicalUrl: 'string'
      }
    });

    // Social platforms
    this.destinations.set('twitter', {
      id: 'twitter',
      name: 'Twitter',
      type: 'social',
      apiEndpoint: 'https://api.twitter.com/2/',
      authRequired: true,
      supportsScheduling: true,
      maxFileSize: 1024 * 1024,
      supportedFormats: ['twitter'],
      customFields: {
        threadMode: 'boolean',
        hashtags: 'array'
      }
    });

    this.destinations.set('linkedin', {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'social',
      apiEndpoint: 'https://api.linkedin.com/v2/',
      authRequired: true,
      supportsScheduling: true,
      maxFileSize: 2 * 1024 * 1024,
      supportedFormats: ['linkedin', 'html'],
      customFields: {
        visibility: 'string',
        industry: 'array'
      }
    });

    // Portfolio platforms
    this.destinations.set('github_pages', {
      id: 'github_pages',
      name: 'GitHub Pages',
      type: 'portfolio',
      apiEndpoint: 'https://api.github.com/',
      authRequired: true,
      supportsScheduling: false,
      maxFileSize: 100 * 1024 * 1024,
      supportedFormats: ['html', 'markdown'],
      customFields: {
        repository: 'string',
        branch: 'string'
      }
    });

    // Cloud storage
    this.destinations.set('google_drive', {
      id: 'google_drive',
      name: 'Google Drive',
      type: 'cloud',
      apiEndpoint: 'https://www.googleapis.com/drive/v3/',
      authRequired: true,
      supportsScheduling: false,
      maxFileSize: 100 * 1024 * 1024,
      supportedFormats: ['pdf', 'docx', 'html', 'markdown'],
      customFields: {
        folder: 'string',
        sharing: 'string'
      }
    });
  }

  private loadJobsFromStorage(): void {
    try {
      const exportJobs = localStorage.getItem('astral_export_jobs');
      if (exportJobs) {
        const jobs = JSON.parse(exportJobs);
        Object.entries(jobs).forEach(([id, job]) => {
          this.exportJobs.set(id, job as ExportJob);
        });
      }

      const publishingJobs = localStorage.getItem('astral_publishing_jobs');
      if (publishingJobs) {
        const jobs = JSON.parse(publishingJobs);
        Object.entries(jobs).forEach(([id, job]) => {
          this.publishingJobs.set(id, job as PublishingJob);
        });
      }

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to load export jobs:', error);
    }
  }

  private saveJobsToStorage(): void {
    try {
      const exportJobs = Object.fromEntries(this.exportJobs);
      localStorage.setItem('astral_export_jobs', JSON.stringify(exportJobs));

      const publishingJobs = Object.fromEntries(this.publishingJobs);
      localStorage.setItem('astral_publishing_jobs', JSON.stringify(publishingJobs));
    } catch (error) {
      console.error('Failed to save export jobs:', error);
    }
  }

  public async exportContent(contentIds: string[], options: ExportOptions, title: string = 'Export'): Promise<string> {
    const job: ExportJob = {
      id: this.generateJobId(),
      title,
      contentIds,
      options,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      estimatedSize: await this.estimateExportSize(contentIds, options)
    };

    this.exportJobs.set(job.id, job);
    this.saveJobsToStorage();
    this.emit('exportStarted', job);

    // Process export asynchronously
    this.processExportJob(job);

    return job.id;
  }

  private async processExportJob(job: ExportJob): Promise<void> {
    try {
      job.status = 'processing';
      this.updateJobProgress(job.id, 10);

      // Load content
      const content = await this.loadContent(job.contentIds);
      this.updateJobProgress(job.id, 30);

      // Apply template if specified
      let processedContent = content;
      if (job.options.template) {
        processedContent = await this.applyTemplate(content, job.options.template);
        this.updateJobProgress(job.id, 50);
      }

      // Convert to target format
      const exportedData = await this.convertToFormat(processedContent, job.options);
      this.updateJobProgress(job.id, 80);

      // Apply final processing
      const finalData = await this.applyFinalProcessing(exportedData, job.options);
      this.updateJobProgress(job.id, 90);

      // Save export result
      job.outputUrl = await this.saveExportResult(job.id, finalData, job.options.format);
      job.actualSize = finalData.byteLength || finalData.length;
      job.status = 'completed';
      job.completedAt = Date.now();
      this.updateJobProgress(job.id, 100);

      this.emit('exportCompleted', job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('exportFailed', job);
    }

    this.saveJobsToStorage();
  }

  private async loadContent(contentIds: string[]): Promise<any[]> {
    // This would integrate with the actual content storage system
    const content = [];
    
    for (const id of contentIds) {
      try {
        const storyData = localStorage.getItem(`astral_story_${id}`);
        if (storyData) {
          const story = JSON.parse(storyData);
          content.push({
            id,
            title: story.title || 'Untitled',
            content: story.content || '',
            metadata: this.extractMetadata(story)
          });
        }
      } catch (error) {
        console.warn(`Failed to load content ${id}:`, error);
      }
    }

    return content;
  }

  private extractMetadata(story: any): ContentMetadata {
    return {
      id: story.id,
      title: story.title || 'Untitled',
      author: 'User', // Would come from user profile
      tags: story.tags || [],
      category: story.genre || 'General',
      wordCount: this.countWords(story.content || ''),
      createdAt: story.createdAt || Date.now(),
      updatedAt: story.updatedAt || Date.now(),
      version: '1.0',
      description: story.summary || '',
      language: 'en'
    };
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private async applyTemplate(content: any[], templateId: string): Promise<any[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return content.map(item => ({
      ...item,
      templateSettings: template.settings,
      formatting: this.getTemplateFormatting(template)
    }));
  }

  private getTemplateFormatting(template: ExportTemplate): any {
    switch (template.id) {
      case 'academic_paper':
        return {
          titlePage: true,
          abstract: true,
          references: true,
          pageNumbers: true,
          headerFooter: true
        };
      
      case 'novel':
        return {
          chapterBreaks: true,
          sceneBreaks: true,
          paragraphIndent: true,
          pageBreaks: 'chapter'
        };

      case 'screenplay':
        return {
          actionLines: true,
          characterNames: true,
          dialogue: true,
          transitions: true,
          sceneHeadings: true
        };

      default:
        return {};
    }
  }

  private async convertToFormat(content: any[], options: ExportOptions): Promise<any> {
    const format = this.formats.get(options.format);
    if (!format) {
      throw new Error(`Format ${options.format} not supported`);
    }

    switch (options.format) {
      case 'pdf':
        return await this.generatePDF(content, options);
      
      case 'docx':
        return await this.generateDOCX(content, options);
      
      case 'html':
        return await this.generateHTML(content, options);
      
      case 'markdown':
        return await this.generateMarkdown(content, options);
      
      case 'epub':
        return await this.generateEPUB(content, options);
      
      case 'twitter':
        return await this.generateTwitterThread(content, options);
      
      case 'linkedin':
        return await this.generateLinkedInArticle(content, options);
      
      case 'latex':
        return await this.generateLaTeX(content, options);
      
      default:
        throw new Error(`Conversion for ${options.format} not implemented`);
    }
  }

  private async generatePDF(content: any[], options: ExportOptions): Promise<ArrayBuffer> {
    // This would use a PDF generation library like jsPDF or PDFKit
    const doc = {
      title: content[0]?.title || 'Document',
      content: content.map(item => item.content).join('\n\n'),
      metadata: options.includeMetadata ? content[0]?.metadata : undefined,
      quality: options.quality
    };

    // Mock PDF generation
    const pdfData = new TextEncoder().encode(JSON.stringify(doc));
    return pdfData.buffer;
  }

  private async generateDOCX(content: any[], options: ExportOptions): Promise<ArrayBuffer> {
    // This would use a DOCX generation library like docx
    const doc = {
      sections: content.map(item => ({
        properties: {},
        children: [{
          text: item.title,
          formatting: { bold: true, size: 24 }
        }, {
          text: item.content,
          formatting: { size: 12 }
        }]
      }))
    };

    // Mock DOCX generation
    const docxData = new TextEncoder().encode(JSON.stringify(doc));
    return docxData.buffer;
  }

  private async generateHTML(content: any[], options: ExportOptions): Promise<string> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content[0]?.title || 'Document'}</title>
    ${options.customStyling ? `<style>${options.customStyling}</style>` : ''}
</head>
<body>
    ${content.map(item => `
        <article>
            <h1>${item.title}</h1>
            ${options.includeMetadata ? this.generateMetadataHTML(item.metadata) : ''}
            <div class="content">${this.formatHTMLContent(item.content)}</div>
        </article>
    `).join('')}
</body>
</html>`;

    return html;
  }

  private generateMetadataHTML(metadata: ContentMetadata): string {
    return `
    <div class="metadata">
        <p><strong>Author:</strong> ${metadata.author}</p>
        <p><strong>Created:</strong> ${new Date(metadata.createdAt).toLocaleDateString()}</p>
        <p><strong>Word Count:</strong> ${metadata.wordCount}</p>
        ${metadata.tags.length > 0 ? `<p><strong>Tags:</strong> ${metadata.tags.join(', ')}</p>` : ''}
    </div>`;
  }

  private formatHTMLContent(content: string): string {
    // Basic markdown-like formatting
    return content
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  private async generateMarkdown(content: any[], options: ExportOptions): Promise<string> {
    return content.map(item => {
      let markdown = `# ${item.title}\n\n`;
      
      if (options.includeMetadata && item.metadata) {
        markdown += this.generateMetadataMarkdown(item.metadata) + '\n\n';
      }
      
      markdown += item.content + '\n\n';
      return markdown;
    }).join('---\n\n');
  }

  private generateMetadataMarkdown(metadata: ContentMetadata): string {
    return `
**Author:** ${metadata.author}  
**Created:** ${new Date(metadata.createdAt).toLocaleDateString()}  
**Word Count:** ${metadata.wordCount}  
${metadata.tags.length > 0 ? `**Tags:** ${metadata.tags.join(', ')}` : ''}`;
  }

  private async generateEPUB(content: any[], options: ExportOptions): Promise<ArrayBuffer> {
    // This would use an EPUB generation library
    const epub = {
      metadata: {
        title: content[0]?.title || 'eBook',
        author: content[0]?.metadata?.author || 'Unknown',
        language: 'en'
      },
      chapters: content.map((item, index) => ({
        title: item.title,
        content: item.content,
        order: index
      }))
    };

    // Mock EPUB generation
    const epubData = new TextEncoder().encode(JSON.stringify(epub));
    return epubData.buffer;
  }

  private async generateTwitterThread(content: any[], options: ExportOptions): Promise<string> {
    const maxTweetLength = 280;
    const threads = [];

    for (const item of content) {
      const text = `${item.title}\n\n${item.content}`;
      const tweets = this.splitIntoTweets(text, maxTweetLength);
      threads.push({
        title: item.title,
        tweets,
        hashtags: item.metadata?.tags || []
      });
    }

    return JSON.stringify({ threads });
  }

  private splitIntoTweets(text: string, maxLength: number): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const tweets = [];
    let currentTweet = '';

    for (const sentence of sentences) {
      if ((currentTweet + sentence).length <= maxLength - 10) { // Leave space for thread numbering
        currentTweet += sentence + '. ';
      } else {
        if (currentTweet) {
          tweets.push(currentTweet.trim());
        }
        currentTweet = sentence + '. ';
      }
    }

    if (currentTweet) {
      tweets.push(currentTweet.trim());
    }

    return tweets.map((tweet, index) => 
      tweets.length > 1 ? `${index + 1}/${tweets.length} ${tweet}` : tweet
    );
  }

  private async generateLinkedInArticle(content: any[], options: ExportOptions): Promise<string> {
    const article = {
      title: content[0]?.title || 'Article',
      content: content.map(item => ({
        type: 'text',
        value: item.content
      })),
      visibility: 'PUBLIC',
      tags: content[0]?.metadata?.tags || []
    };

    return JSON.stringify(article);
  }

  private async generateLaTeX(content: any[], options: ExportOptions): Promise<string> {
    let latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{${content[0]?.title || 'Document'}}
\\author{${content[0]?.metadata?.author || 'Author'}}
\\date{${new Date().toLocaleDateString()}}

\\begin{document}

\\maketitle

`;

    for (const item of content) {
      latex += `\\section{${item.title}}\n\n`;
      latex += this.formatLaTeXContent(item.content) + '\n\n';
    }

    latex += '\\end{document}';
    return latex;
  }

  private formatLaTeXContent(content: string): string {
    return content
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
  }

  private async applyFinalProcessing(data: any, options: ExportOptions): Promise<any> {
    let processedData = data;

    // Apply compression if requested
    if (options.compression && options.compression !== 'none') {
      processedData = await this.compressData(processedData, options.compression);
    }

    // Apply password protection if requested
    if (options.password) {
      processedData = await this.passwordProtect(processedData, options.password);
    }

    // Add watermark if requested
    if (options.watermark) {
      processedData = await this.addWatermark(processedData, options.watermark);
    }

    return processedData;
  }

  private async compressData(data: any, compression: string): Promise<any> {
    // Mock compression
    return data;
  }

  private async passwordProtect(data: any, password: string): Promise<any> {
    // Mock password protection
    return { encrypted: true, data };
  }

  private async addWatermark(data: any, watermark: string): Promise<any> {
    // Mock watermarking
    return data;
  }

  private async saveExportResult(jobId: string, data: any, format: string): Promise<string> {
    // In a real implementation, this would save to a file system or cloud storage
    const key = `astral_export_result_${jobId}`;
    
    if (data instanceof ArrayBuffer) {
      // For binary data, convert to base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
      localStorage.setItem(key, JSON.stringify({ type: 'binary', data: base64, format }));
    } else {
      // For text data
      localStorage.setItem(key, JSON.stringify({ type: 'text', data, format }));
    }

    return `local://${key}`;
  }

  private async estimateExportSize(contentIds: string[], options: ExportOptions): Promise<number> {
    let totalSize = 0;
    
    for (const id of contentIds) {
      try {
        const storyData = localStorage.getItem(`astral_story_${id}`);
        if (storyData) {
          totalSize += new Blob([storyData]).size;
        }
      } catch (error) {
        console.warn(`Failed to estimate size for content ${id}`);
      }
    }

    // Apply format multiplier
    const formatMultipliers: Record<string, number> = {
      'pdf': 2.5,
      'docx': 2.0,
      'html': 1.5,
      'markdown': 1.0,
      'epub': 1.8,
      'latex': 1.2
    };

    return Math.round(totalSize * (formatMultipliers[options.format] || 1.5));
  }

  private updateJobProgress(jobId: string, progress: number): void {
    const job = this.exportJobs.get(jobId);
    if (job) {
      job.progress = progress;
      this.emit('exportProgress', job);
    }
  }

  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getAvailableFormats(): ExportFormat[] {
    return Array.from(this.formats.values());
  }

  public getAvailableTemplates(format?: string): ExportTemplate[] {
    const templates = Array.from(this.templates.values());
    return format ? templates.filter(t => t.format === format) : templates;
  }

  public getExportJob(jobId: string): ExportJob | null {
    return this.exportJobs.get(jobId) || null;
  }

  public getAllExportJobs(): ExportJob[] {
    return Array.from(this.exportJobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public async cancelExportJob(jobId: string): Promise<boolean> {
    const job = this.exportJobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      this.emit('exportCancelled', job);
      this.saveJobsToStorage();
      return true;
    }
    return false;
  }

  public async deleteExportJob(jobId: string): Promise<boolean> {
    if (this.exportJobs.has(jobId)) {
      this.exportJobs.delete(jobId);
      this.saveJobsToStorage();
      
      // Clean up export result
      try {
        localStorage.removeItem(`astral_export_result_${jobId}`);
      } catch (error) {
        console.warn('Failed to clean up export result:', error);
      }
      
      return true;
    }
    return false;
  }

  public async downloadExportResult(jobId: string): Promise<Blob | null> {
    try {
      const resultData = localStorage.getItem(`astral_export_result_${jobId}`);
      if (!resultData) return null;

      const result = JSON.parse(resultData);
      
      if (result.type === 'binary') {
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const format = this.formats.get(result.format);
        return new Blob([bytes], { type: format?.mimeType || 'application/octet-stream' });
      } else {
        const format = this.formats.get(result.format);
        return new Blob([result.data], { type: format?.mimeType || 'text/plain' });
      }
    } catch (error) {
      console.error('Failed to download export result:', error);
      return null;
    }
  }
}

export default new ContentExportService();