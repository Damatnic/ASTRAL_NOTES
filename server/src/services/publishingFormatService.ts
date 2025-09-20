/**
 * Publishing Format Service
 * Handles industry-standard formatting for manuscripts
 * Supports major publisher guidelines and academic standards
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Publisher-specific formatting guidelines
export const PUBLISHER_GUIDELINES = {
  // Major Traditional Publishers
  'penguin-random-house': {
    name: 'Penguin Random House',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1.25, right: 1.25 },
    pageNumbering: true,
    headerFormat: '{Author Last Name} / {Title} / {Page}',
    firstPageHeader: false,
    chapterStart: 'new-page',
    indentFirstLine: 0.5,
    requirements: [
      'Double-spaced throughout',
      'Standard 8.5x11 paper',
      'Clean, professional appearance',
      'No fancy fonts or formatting'
    ]
  },
  'harpercollins': {
    name: 'HarperCollins',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1, right: 1 },
    pageNumbering: true,
    headerFormat: '{Author Last Name} / {Title}',
    firstPageHeader: false,
    chapterStart: 'new-page',
    indentFirstLine: 0.5,
    requirements: [
      'Standard manuscript format',
      'Clear chapter breaks',
      'Consistent formatting'
    ]
  },
  'macmillan': {
    name: 'Macmillan Publishers',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1.25, right: 1.25 },
    pageNumbering: true,
    headerFormat: '{Title} / {Page}',
    firstPageHeader: false,
    chapterStart: 'new-page',
    indentFirstLine: 0.5,
    requirements: [
      'Professional manuscript format',
      'Numbered pages',
      'Standard margins'
    ]
  },
  'simon-schuster': {
    name: 'Simon & Schuster',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1, right: 1 },
    pageNumbering: true,
    headerFormat: '{Author Last Name} / {Title} / {Page}',
    firstPageHeader: false,
    chapterStart: 'new-page',
    indentFirstLine: 0.5,
    requirements: [
      'Standard format',
      'Clean presentation',
      'Proper headers'
    ]
  }
};

// Academic formatting standards
export const ACADEMIC_STANDARDS = {
  'apa-7': {
    name: 'APA 7th Edition',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1, right: 1 },
    pageNumbering: true,
    headerFormat: '{Running Head}',
    titlePage: true,
    abstract: true,
    references: true,
    inTextCitations: '(Author, Year)',
    requirements: [
      'Running head on every page',
      'Title page required',
      'Double-spaced throughout',
      'In-text citations in APA format'
    ]
  },
  'mla-9': {
    name: 'MLA 9th Edition',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1, right: 1 },
    pageNumbering: true,
    headerFormat: '{Author Last Name} {Page}',
    titlePage: false,
    workscited: true,
    inTextCitations: '(Author Page)',
    requirements: [
      'Author-page format for citations',
      'Works Cited page',
      'Double-spaced',
      'Header with name and page number'
    ]
  },
  'chicago-17': {
    name: 'Chicago Manual of Style 17th Edition',
    fontSize: 12,
    fontFamily: 'Times New Roman',
    lineSpacing: 2.0,
    margins: { top: 1, bottom: 1, left: 1, right: 1 },
    pageNumbering: true,
    headerFormat: '{Title}',
    footnotes: true,
    bibliography: true,
    inTextCitations: 'footnotes',
    requirements: [
      'Footnotes for citations',
      'Bibliography page',
      'Consistent formatting',
      'Proper chapter structure'
    ]
  }
};

// Genre-specific formatting preferences
export const GENRE_STANDARDS = {
  'mystery': {
    name: 'Mystery/Thriller',
    chapterLength: 'short-punchy',
    sceneBreaks: '***',
    cliffhangers: true,
    pacing: 'fast',
    dialogueStyle: 'tight',
    requirements: [
      'Short, engaging chapters',
      'Clear scene breaks',
      'Strong hook endings',
      'Crisp dialogue'
    ]
  },
  'romance': {
    name: 'Romance',
    chapterLength: 'medium',
    sceneBreaks: 'chapter-end',
    emotionalBeats: true,
    pacing: 'varied',
    dialogueStyle: 'emotional',
    requirements: [
      'Emotional arc prominence',
      'Character development focus',
      'Satisfying resolution',
      'Genre expectations met'
    ]
  },
  'fantasy': {
    name: 'Fantasy',
    chapterLength: 'long',
    sceneBreaks: 'scene-dividers',
    worldBuilding: true,
    pacing: 'epic',
    dialogueStyle: 'character-appropriate',
    requirements: [
      'Rich world-building',
      'Consistent magic systems',
      'Character diversity',
      'Epic scope'
    ]
  },
  'literary': {
    name: 'Literary Fiction',
    chapterLength: 'varied',
    sceneBreaks: 'subtle',
    proseStyle: 'elevated',
    pacing: 'thoughtful',
    dialogueStyle: 'naturalistic',
    requirements: [
      'Strong prose style',
      'Character-driven narrative',
      'Thematic depth',
      'Literary merit'
    ]
  }
};

export interface ManuscriptFormatOptions {
  formatType: 'standard' | 'publisher_specific' | 'academic' | 'genre_specific';
  guideline?: string;
  customSettings?: {
    fontSize?: number;
    fontFamily?: string;
    lineSpacing?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    pageNumbering?: boolean;
    headerFormat?: string;
    indentFirstLine?: number;
  };
}

export interface FormattedManuscript {
  content: string;
  wordCount: number;
  pageCount: number;
  formatMetadata: {
    formatType: string;
    guideline?: string;
    settings: any;
    compliance: {
      isCompliant: boolean;
      issues: string[];
      suggestions: string[];
    };
  };
}

export class PublishingFormatService {
  
  /**
   * Format manuscript according to specified guidelines
   */
  async formatManuscript(
    content: string,
    options: ManuscriptFormatOptions
  ): Promise<FormattedManuscript> {
    let formatSettings;
    let compliance;

    switch (options.formatType) {
      case 'publisher_specific':
        formatSettings = this.getPublisherGuidelines(options.guideline!);
        compliance = this.checkPublisherCompliance(content, formatSettings);
        break;
      case 'academic':
        formatSettings = this.getAcademicStandards(options.guideline!);
        compliance = this.checkAcademicCompliance(content, formatSettings);
        break;
      case 'genre_specific':
        formatSettings = this.getGenreStandards(options.guideline!);
        compliance = this.checkGenreCompliance(content, formatSettings);
        break;
      default:
        formatSettings = this.getStandardFormat();
        compliance = this.checkStandardCompliance(content, formatSettings);
    }

    // Apply custom settings if provided
    if (options.customSettings) {
      formatSettings = { ...formatSettings, ...options.customSettings };
    }

    const formattedContent = this.applyFormatting(content, formatSettings);
    const wordCount = this.countWords(content);
    const pageCount = this.estimatePageCount(content, formatSettings);

    return {
      content: formattedContent,
      wordCount,
      pageCount,
      formatMetadata: {
        formatType: options.formatType,
        guideline: options.guideline,
        settings: formatSettings,
        compliance
      }
    };
  }

  /**
   * Get publisher-specific formatting guidelines
   */
  private getPublisherGuidelines(publisher: string) {
    return PUBLISHER_GUIDELINES[publisher as keyof typeof PUBLISHER_GUIDELINES] || 
           PUBLISHER_GUIDELINES['penguin-random-house'];
  }

  /**
   * Get academic formatting standards
   */
  private getAcademicStandards(standard: string) {
    return ACADEMIC_STANDARDS[standard as keyof typeof ACADEMIC_STANDARDS] || 
           ACADEMIC_STANDARDS['apa-7'];
  }

  /**
   * Get genre-specific formatting standards
   */
  private getGenreStandards(genre: string) {
    return GENRE_STANDARDS[genre as keyof typeof GENRE_STANDARDS] || 
           GENRE_STANDARDS['literary'];
  }

  /**
   * Get standard manuscript format
   */
  private getStandardFormat() {
    return {
      name: 'Standard Manuscript Format',
      fontSize: 12,
      fontFamily: 'Times New Roman',
      lineSpacing: 2.0,
      margins: { top: 1, bottom: 1, left: 1.25, right: 1.25 },
      pageNumbering: true,
      headerFormat: '{Author Last Name} / {Title} / {Page}',
      firstPageHeader: false,
      chapterStart: 'new-page',
      indentFirstLine: 0.5
    };
  }

  /**
   * Apply formatting to manuscript content
   */
  private applyFormatting(content: string, settings: any): string {
    let formatted = content;

    // Apply chapter breaks
    if (settings.chapterStart === 'new-page') {
      formatted = formatted.replace(/^# .+$/gm, '\n\n$&\n\n');
    }

    // Apply paragraph indentation
    if (settings.indentFirstLine) {
      formatted = formatted.replace(/^(.+)$/gm, '    $1');
    }

    // Apply scene breaks
    if (settings.sceneBreaks) {
      formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n***\n\n');
    }

    // Add header information (placeholder)
    if (settings.headerFormat) {
      formatted = `[HEADER: ${settings.headerFormat}]\n\n${formatted}`;
    }

    return formatted;
  }

  /**
   * Check compliance with publisher guidelines
   */
  private checkPublisherCompliance(content: string, guidelines: any) {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check word count for appropriate length
    const wordCount = this.countWords(content);
    if (wordCount < 50000) {
      issues.push('Word count below typical novel length (50,000+ words)');
      suggestions.push('Consider expanding chapters or adding subplots');
    }
    if (wordCount > 120000) {
      issues.push('Word count above typical first novel length (80,000-100,000 words)');
      suggestions.push('Consider tightening prose or splitting into series');
    }

    // Check chapter structure
    const chapters = content.match(/^# .+$/gm) || [];
    if (chapters.length < 10) {
      suggestions.push('Consider more chapter breaks for better pacing');
    }

    // Check for proper formatting elements
    if (!content.includes('Chapter') && !content.includes('#')) {
      issues.push('No clear chapter divisions found');
      suggestions.push('Add clear chapter headings');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Check compliance with academic standards
   */
  private checkAcademicCompliance(content: string, standards: any) {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for required sections
    if (standards.abstract && !content.toLowerCase().includes('abstract')) {
      issues.push('Abstract section missing');
      suggestions.push('Add an abstract at the beginning');
    }

    if (standards.references && !content.toLowerCase().includes('references')) {
      issues.push('References section missing');
      suggestions.push('Add a references section at the end');
    }

    // Check citation format
    if (standards.inTextCitations) {
      const citationPattern = standards.inTextCitations === '(Author, Year)' 
        ? /\([A-Za-z]+,\s*\d{4}\)/g
        : /\([A-Za-z]+\s+\d+\)/g;
      
      const citations = content.match(citationPattern) || [];
      if (citations.length === 0) {
        suggestions.push('No in-text citations found - add citations if required');
      }
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Check compliance with genre standards
   */
  private checkGenreCompliance(content: string, standards: any) {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check chapter length appropriateness
    const chapters = content.split(/^# .+$/gm);
    const avgChapterLength = chapters.reduce((sum, ch) => sum + ch.length, 0) / chapters.length;

    if (standards.chapterLength === 'short-punchy' && avgChapterLength > 5000) {
      suggestions.push('Consider shorter chapters for better pacing in this genre');
    }
    if (standards.chapterLength === 'long' && avgChapterLength < 3000) {
      suggestions.push('Consider longer chapters to develop scenes fully');
    }

    // Genre-specific checks
    if (standards.name === 'Mystery/Thriller') {
      if (!content.toLowerCase().includes('murder') && 
          !content.toLowerCase().includes('mystery') &&
          !content.toLowerCase().includes('crime')) {
        suggestions.push('Ensure mystery/crime elements are clearly present');
      }
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Check standard format compliance
   */
  private checkStandardCompliance(content: string, settings: any) {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Basic formatting checks
    if (content.includes('\t')) {
      issues.push('Contains tab characters - use spaces for indentation');
    }

    if (content.includes('  ')) {
      suggestions.push('Consider using single spaces between sentences');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * Estimate page count based on formatting
   */
  private estimatePageCount(content: string, settings: any): number {
    const wordCount = this.countWords(content);
    
    // Standard manuscript page: ~250 words per page (double-spaced, 12pt font)
    let wordsPerPage = 250;
    
    // Adjust for line spacing
    if (settings.lineSpacing) {
      wordsPerPage = Math.round(250 / (settings.lineSpacing / 2.0));
    }
    
    // Adjust for font size
    if (settings.fontSize !== 12) {
      const fontMultiplier = 12 / settings.fontSize;
      wordsPerPage = Math.round(wordsPerPage * fontMultiplier);
    }

    return Math.ceil(wordCount / wordsPerPage);
  }

  /**
   * Export manuscript in various formats
   */
  async exportManuscript(
    manuscriptId: string,
    format: 'docx' | 'pdf' | 'epub' | 'mobi'
  ): Promise<{ url: string; filename: string }> {
    const manuscript = await prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      include: { publishingProject: true }
    });

    if (!manuscript) {
      throw new Error('Manuscript not found');
    }

    // In a real implementation, this would use libraries like:
    // - docx: for Word document generation
    // - puppeteer: for PDF generation
    // - epub-gen: for ePub generation
    // For now, we'll return placeholder URLs

    const filename = `${manuscript.publishingProject.title.replace(/\s+/g, '_')}_${manuscript.version}.${format}`;
    const url = `/exports/${manuscriptId}/${filename}`;

    // Update manuscript with export URL
    await prisma.manuscript.update({
      where: { id: manuscriptId },
      data: {
        [`${format}Url`]: url
      }
    });

    return { url, filename };
  }

  /**
   * Validate manuscript for submission readiness
   */
  async validateForSubmission(manuscriptId: string): Promise<{
    isReady: boolean;
    checklist: Array<{
      item: string;
      status: 'complete' | 'incomplete' | 'warning';
      message: string;
    }>;
  }> {
    const manuscript = await prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      include: { publishingProject: true }
    });

    if (!manuscript) {
      throw new Error('Manuscript not found');
    }

    const checklist = [
      {
        item: 'Professional formatting',
        status: manuscript.formatType === 'standard' ? 'complete' : 'warning',
        message: manuscript.formatType === 'standard' 
          ? 'Standard format applied' 
          : 'Consider using standard manuscript format for submissions'
      },
      {
        item: 'Word count appropriate',
        status: manuscript.wordCount >= 50000 && manuscript.wordCount <= 120000 ? 'complete' : 'warning',
        message: manuscript.wordCount >= 50000 && manuscript.wordCount <= 120000
          ? `Word count: ${manuscript.wordCount.toLocaleString()}`
          : `Word count: ${manuscript.wordCount.toLocaleString()} - Consider industry standards`
      },
      {
        item: 'Finalized version',
        status: manuscript.isFinalized ? 'complete' : 'incomplete',
        message: manuscript.isFinalized ? 'Manuscript marked as final' : 'Mark manuscript as finalized when ready'
      },
      {
        item: 'Export formats available',
        status: manuscript.docxUrl ? 'complete' : 'incomplete',
        message: manuscript.docxUrl ? 'DOCX export available' : 'Generate DOCX export for submissions'
      }
    ];

    const isReady = checklist.every(item => item.status === 'complete');

    return { isReady, checklist };
  }
}

export default new PublishingFormatService();