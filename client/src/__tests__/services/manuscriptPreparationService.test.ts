import { describe, it, expect, beforeEach, vi } from 'vitest';
import { manuscriptPreparationService } from '../../services/manuscriptPreparationService';
import type { 
  ManuscriptFormat, 
  ManuscriptSettings, 
  SubmissionPackage,
  ManuscriptMetadata,
  FormattingTemplate,
  PublishingGuideline,
  ExportFormat
} from '../../services/manuscriptPreparationService';

const mockLocalStorage = {
  data: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.data.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockLocalStorage.data.set(key, value)),
  removeItem: vi.fn((key: string) => mockLocalStorage.data.delete(key)),
  clear: vi.fn(() => mockLocalStorage.data.clear())
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('ManuscriptPreparationService', () => {
  const testUserId = 'test-user-1';
  const testAuthor = 'Test Author';

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    (manuscriptPreparationService as any).packages.clear();
    (manuscriptPreparationService as any).exportJobs.clear();
    (manuscriptPreparationService as any).formats.clear();
    (manuscriptPreparationService as any).templates.clear();
    (manuscriptPreparationService as any).guidelines.clear();
    
    (manuscriptPreparationService as any).initializeIndustryFormats();
    (manuscriptPreparationService as any).initializeFormattingTemplates();
    (manuscriptPreparationService as any).initializePublishingGuidelines();
  });

  describe('Format Management', () => {
    it('should initialize with industry-standard formats', () => {
      const formats = manuscriptPreparationService.getFormats();
      
      expect(formats.length).toBeGreaterThan(0);
      
      const standardNovel = formats.find(f => f.id === 'standard-novel');
      expect(standardNovel).toBeDefined();
      expect(standardNovel?.name).toBe('Standard Novel Manuscript');
      expect(standardNovel?.category).toBe('industry');
      expect(standardNovel?.isDefault).toBe(true);
    });

    it('should get format by ID', () => {
      const format = manuscriptPreparationService.getFormatById('standard-novel');
      
      expect(format).toBeDefined();
      expect(format?.id).toBe('standard-novel');
      expect(format?.settings.typography.fontFamily).toBe('Times New Roman');
    });

    it('should return null for non-existent format', () => {
      const format = manuscriptPreparationService.getFormatById('non-existent');
      expect(format).toBeNull();
    });

    it('should get formats by category', () => {
      const industryFormats = manuscriptPreparationService.getFormatsByCategory('industry');
      
      expect(industryFormats.length).toBeGreaterThan(0);
      expect(industryFormats.every(f => f.category === 'industry')).toBe(true);
    });

    it('should create custom format', () => {
      const formatData = {
        name: 'My Custom Format',
        description: 'A personal formatting style',
        category: 'self-publishing' as const,
        requirements: ['Custom requirement']
      };

      const format = manuscriptPreparationService.createCustomFormat(formatData);
      
      expect(format.id).toMatch(/^custom-\d+$/);
      expect(format.name).toBe(formatData.name);
      expect(format.isCustom).toBe(true);
      expect(format.isDefault).toBe(false);
    });

    it('should update custom format', () => {
      const format = manuscriptPreparationService.createCustomFormat({
        name: 'Original Name'
      });

      const updated = manuscriptPreparationService.updateFormat(format.id, {
        name: 'Updated Name'
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
    });

    it('should not update non-custom format', () => {
      const updated = manuscriptPreparationService.updateFormat('standard-novel', {
        name: 'Hacked Name'
      });

      expect(updated).toBeNull();
    });

    it('should delete custom format', () => {
      const format = manuscriptPreparationService.createCustomFormat({
        name: 'To Delete'
      });

      const deleted = manuscriptPreparationService.deleteFormat(format.id);
      expect(deleted).toBe(true);

      const retrieved = manuscriptPreparationService.getFormatById(format.id);
      expect(retrieved).toBeNull();
    });

    it('should not delete non-custom format', () => {
      const deleted = manuscriptPreparationService.deleteFormat('standard-novel');
      expect(deleted).toBe(false);

      const format = manuscriptPreparationService.getFormatById('standard-novel');
      expect(format).toBeDefined();
    });
  });

  describe('Template Management', () => {
    it('should get all templates', () => {
      const templates = manuscriptPreparationService.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].rating).toBeGreaterThanOrEqual(templates[templates.length - 1].rating);
    });

    it('should get template by ID', () => {
      const template = manuscriptPreparationService.getTemplateById('professional-novel');
      
      expect(template).toBeDefined();
      expect(template?.name).toBe('Professional Novel Template');
      expect(template?.isOfficial).toBe(true);
    });

    it('should get templates by category', () => {
      const fictionTemplates = manuscriptPreparationService.getTemplatesByCategory('fiction');
      
      expect(fictionTemplates.length).toBeGreaterThan(0);
      expect(fictionTemplates.every(t => t.category === 'fiction')).toBe(true);
    });

    it('should return null for non-existent template', () => {
      const template = manuscriptPreparationService.getTemplateById('non-existent');
      expect(template).toBeNull();
    });
  });

  describe('Manuscript Analysis', () => {
    it('should analyze manuscript content', () => {
      const content = `
        Chapter One
        
        The morning sun cast long shadows across the empty street. Sarah walked quickly, her heels clicking against the pavement.
        
        "I can't believe this is happening," she whispered to herself.
        
        The meeting was in ten minutes, and she was already running late. Her presentation folder clutched tightly in her hand.
        
        Chapter Two
        
        The office building loomed before her, its glass facade reflecting the early morning light.
      `;

      const metadata: Partial<ManuscriptMetadata> = {
        genre: 'Commercial Fiction',
        title: 'Test Novel'
      };

      const analysis = manuscriptPreparationService.analyzeManuscript(content, metadata);
      
      expect(analysis.wordCount.total).toBeGreaterThan(0);
      expect(analysis.wordCount.byChapter.length).toBeGreaterThanOrEqual(0);
      expect(analysis.readabilityScore).toBeGreaterThan(0);
      expect(analysis.readabilityScore).toBeLessThanOrEqual(100);
      expect(analysis.pacing.dialogueRatio).toBeGreaterThan(0);
      expect(analysis.structureAnalysis.chapterBalance).toBeDefined();
      expect(analysis.qualityChecks).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should detect low word count', () => {
      const shortContent = 'Chapter One. This is a very short story.';
      const metadata: Partial<ManuscriptMetadata> = { genre: 'Fiction' };

      const analysis = manuscriptPreparationService.analyzeManuscript(shortContent, metadata);
      
      const wordCountWarning = analysis.qualityChecks.find(
        check => check.description.includes('too short')
      );
      expect(wordCountWarning).toBeDefined();
      expect(wordCountWarning?.severity).toBe('warning');
    });

    it('should calculate readability score correctly', () => {
      const simpleContent = 'The cat sat on the mat. It was happy.';
      const complexContent = 'The philosophical implications of existential phenomenology require careful consideration of ontological frameworks.';

      const simpleAnalysis = manuscriptPreparationService.analyzeManuscript(simpleContent, {});
      const complexAnalysis = manuscriptPreparationService.analyzeManuscript(complexContent, {});

      expect(simpleAnalysis.readabilityScore).toBeGreaterThan(complexAnalysis.readabilityScore);
    });
  });

  describe('Manuscript Formatting', () => {
    it('should format manuscript with specified format', () => {
      const content = `Chapter One

The story begins here.

***

Later that day, something happened.`;

      const formatted = manuscriptPreparationService.formatManuscript(content, 'standard-novel');
      
      expect(formatted).toContain('Chapter One');
      expect(formatted).toContain('***');
    });

    it('should throw error for non-existent format', () => {
      const content = 'Test content';
      
      expect(() => {
        manuscriptPreparationService.formatManuscript(content, 'non-existent');
      }).toThrow('Format not found: non-existent');
    });

    it('should handle scene separators', () => {
      const content = 'Scene one\n***\nScene two';
      const formatted = manuscriptPreparationService.formatManuscript(content, 'standard-novel');
      
      expect(formatted).toContain('***');
    });
  });

  describe('Submission Package Management', () => {
    it('should create submission package', () => {
      const packageData = {
        name: 'Query to Agent',
        targetPublisher: 'Literary Agency',
        submissionType: 'query' as const,
        notes: 'First submission attempt'
      };

      const pkg = manuscriptPreparationService.createSubmissionPackage(packageData);
      
      expect(pkg.id).toMatch(/^package-\d+$/);
      expect(pkg.name).toBe(packageData.name);
      expect(pkg.status).toBe('draft');
      expect(pkg.createdAt).toBeInstanceOf(Date);
    });

    it('should update submission package', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'Original Package'
      });

      const updated = manuscriptPreparationService.updateSubmissionPackage(pkg.id, {
        status: 'ready',
        notes: 'Updated notes'
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('ready');
      expect(updated?.notes).toBe('Updated notes');
    });

    it('should get submission packages sorted by date', () => {
      const pkg1 = manuscriptPreparationService.createSubmissionPackage({ name: 'Package 1' });
      const pkg2 = manuscriptPreparationService.createSubmissionPackage({ name: 'Package 2' });

      const packages = manuscriptPreparationService.getSubmissionPackages();
      expect(packages.length).toBe(2);
      expect(packages.some(p => p.id === pkg1.id)).toBe(true);
      expect(packages.some(p => p.id === pkg2.id)).toBe(true);
      expect(packages[0].createdAt.getTime()).toBeGreaterThanOrEqual(packages[1].createdAt.getTime());
    });

    it('should get package by ID', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'Test Package'
      });

      const retrieved = manuscriptPreparationService.getPackageById(pkg.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Package');
    });

    it('should return null for non-existent package', () => {
      const retrieved = manuscriptPreparationService.getPackageById('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('Export Functionality', () => {
    it('should start export job', () => {
      const content = 'Manuscript content';
      const format: ExportFormat = {
        type: 'pdf',
        name: 'PDF Export',
        description: 'High-quality PDF',
        quality: 'final',
        options: {}
      };
      const settings = (manuscriptPreparationService as any).defaultSettings;

      const jobId = manuscriptPreparationService.exportManuscript(content, format, settings);
      
      expect(jobId).toMatch(/^export-\d+$/);
      
      const job = manuscriptPreparationService.getExportJob(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe('processing');
      expect(job?.format.type).toBe('pdf');
    });

    it('should complete export job', (done) => {
      const content = 'Test content';
      const format: ExportFormat = {
        type: 'docx',
        name: 'Word Document',
        description: 'Standard format',
        quality: 'final',
        options: {}
      };
      const settings = (manuscriptPreparationService as any).defaultSettings;

      manuscriptPreparationService.on('exportCompleted', (job) => {
        expect(job.status).toBe('completed');
        expect(job.progress).toBe(100);
        expect(job.outputPath).toContain('.docx');
        done();
      });

      manuscriptPreparationService.exportManuscript(content, format, settings);
    });

    it('should return null for non-existent export job', () => {
      const job = manuscriptPreparationService.getExportJob('non-existent');
      expect(job).toBeNull();
    });
  });

  describe('Publishing Guidelines', () => {
    it('should get all publishing guidelines', () => {
      const guidelines = manuscriptPreparationService.getPublishingGuidelines();
      
      expect(guidelines.length).toBeGreaterThan(0);
      expect(guidelines[0].publisher).toBeDefined();
    });

    it('should get guideline by ID', () => {
      const guideline = manuscriptPreparationService.getGuidelineById('penguin-random-house');
      
      expect(guideline).toBeDefined();
      expect(guideline?.publisher).toBe('Penguin Random House');
    });

    it('should search guidelines by publisher', () => {
      const results = manuscriptPreparationService.searchGuidelines('Penguin');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].publisher).toContain('Penguin');
    });

    it('should search guidelines by genre', () => {
      const results = manuscriptPreparationService.searchGuidelines('Romance');
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = manuscriptPreparationService.searchGuidelines('NonExistentPublisher');
      expect(results).toHaveLength(0);
    });
  });

  describe('Submission Validation', () => {
    it('should validate complete submission package', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'Complete Package',
        requirements: [
          {
            type: 'query-letter',
            description: 'Query letter',
            required: true,
            format: 'email'
          }
        ],
        documents: [
          {
            type: 'query-letter',
            name: 'Query Letter',
            content: 'Dear Agent...',
            wordCount: 250,
            pageCount: 1,
            format: {
              type: 'docx',
              name: 'Word Doc',
              description: 'Standard format',
              quality: 'final',
              options: {}
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      const checks = manuscriptPreparationService.validateSubmission(pkg.id);
      expect(checks).toHaveLength(0);
    });

    it('should detect missing required documents', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'Incomplete Package',
        requirements: [
          {
            type: 'query-letter',
            description: 'Query letter',
            required: true,
            format: 'email'
          }
        ],
        documents: []
      });

      const checks = manuscriptPreparationService.validateSubmission(pkg.id);
      
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].severity).toBe('error');
      expect(checks[0].description).toContain('Missing required document');
    });

    it('should detect word count violations', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'Over Limit Package',
        requirements: [
          {
            type: 'synopsis',
            description: 'Synopsis',
            required: true,
            format: 'docx',
            wordLimit: 500
          }
        ],
        documents: [
          {
            type: 'synopsis',
            name: 'Synopsis',
            content: 'Very long synopsis...',
            wordCount: 750,
            pageCount: 2,
            format: {
              type: 'docx',
              name: 'Word Doc',
              description: 'Standard format',
              quality: 'final',
              options: {}
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      });

      const checks = manuscriptPreparationService.validateSubmission(pkg.id);
      
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0].severity).toBe('error');
      expect(checks[0].description).toContain('exceeds word limit');
    });

    it('should return empty array for non-existent package', () => {
      const checks = manuscriptPreparationService.validateSubmission('non-existent');
      expect(checks).toHaveLength(0);
    });
  });

  describe('Analytics', () => {
    it('should provide comprehensive analytics', () => {
      const pkg1 = manuscriptPreparationService.createSubmissionPackage({
        name: 'Package 1'
      });
      manuscriptPreparationService.updateSubmissionPackage(pkg1.id, { status: 'submitted' });
      
      const pkg2 = manuscriptPreparationService.createSubmissionPackage({
        name: 'Package 2'
      });
      manuscriptPreparationService.updateSubmissionPackage(pkg2.id, { status: 'responded' });

      const analytics = manuscriptPreparationService.getAnalytics();
      
      expect(analytics.packages.total).toBeGreaterThan(0);
      expect(analytics.packages.submitted).toBeGreaterThan(0);
      expect(analytics.packages.responded).toBeGreaterThan(0);
      expect(analytics.packages.responseRate).toBeGreaterThan(0);
      expect(analytics.formats.total).toBeGreaterThan(0);
      expect(analytics.exports).toBeDefined();
      expect(analytics.templates).toBeDefined();
    });

    it('should handle zero submissions gracefully', () => {
      const analytics = manuscriptPreparationService.getAnalytics();
      
      expect(analytics.packages.responseRate).toBe(0);
      expect(analytics.exports.successRate).toBe(0);
    });
  });

  describe('Data Persistence', () => {
    it('should persist custom formats to localStorage', () => {
      const format = manuscriptPreparationService.createCustomFormat({
        name: 'Persistent Format'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should persist submission packages to localStorage', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'Persistent Package',
        status: 'ready'
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle corrupted localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        (manuscriptPreparationService as any).loadUserData();
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should emit formatCreated event', (done) => {
      manuscriptPreparationService.on('formatCreated', (format) => {
        expect(format.name).toBe('Event Test Format');
        done();
      });

      manuscriptPreparationService.createCustomFormat({
        name: 'Event Test Format'
      });
    });

    it('should emit packageCreated event', (done) => {
      manuscriptPreparationService.on('packageCreated', (pkg) => {
        expect(pkg.name).toBe('Event Test Package');
        done();
      });

      manuscriptPreparationService.createSubmissionPackage({
        name: 'Event Test Package'
      });
    });

    it('should emit exportStarted event', (done) => {
      manuscriptPreparationService.on('exportStarted', (job) => {
        expect(job.status).toBe('processing');
        done();
      });

      const format: ExportFormat = {
        type: 'pdf',
        name: 'Test Export',
        description: 'Test',
        quality: 'final',
        options: {}
      };

      manuscriptPreparationService.exportManuscript('content', format, (manuscriptPreparationService as any).defaultSettings);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty content analysis', () => {
      const analysis = manuscriptPreparationService.analyzeManuscript('', {});
      
      expect(analysis.wordCount.total).toBe(1);
      expect(analysis.readabilityScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle content with only whitespace', () => {
      const analysis = manuscriptPreparationService.analyzeManuscript('   \n\n   ', {});
      
      expect(analysis.wordCount.total).toBe(1);
    });

    it('should handle very long content', () => {
      const longContent = 'word '.repeat(100000);
      const analysis = manuscriptPreparationService.analyzeManuscript(longContent, {});
      
      expect(analysis.wordCount.total).toBe(100000);
    });

    it('should handle content without chapters', () => {
      const content = 'This is a story without chapter breaks.';
      const analysis = manuscriptPreparationService.analyzeManuscript(content, {});
      
      expect(analysis.wordCount.byChapter).toHaveLength(0);
    });

    it('should validate package with empty requirements', () => {
      const pkg = manuscriptPreparationService.createSubmissionPackage({
        name: 'No Requirements',
        requirements: []
      });

      const checks = manuscriptPreparationService.validateSubmission(pkg.id);
      expect(checks).toHaveLength(0);
    });
  });
});