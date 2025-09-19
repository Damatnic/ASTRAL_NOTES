/**
 * Export Routes - Phase 1D Enhanced Export System
 * 
 * RESTful API endpoints for the advanced export and publishing system
 * Supports professional manuscript processing, batch exports, and real-time job tracking
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import exportProcessingService, { ExportOptions, BatchExportRequest } from '../services/exportProcessingService';
import { noAuth } from '../middleware/noAuth';

const router = Router();

// Apply no-auth middleware for development
router.use(noAuth);

/**
 * Create a new export job
 * POST /api/exports/jobs
 */
router.post('/jobs',
  [
    body('projectId').isString().notEmpty().withMessage('Project ID is required'),
    body('contentIds').isArray().withMessage('Content IDs must be an array'),
    body('format').isString().notEmpty().withMessage('Format is required'),
    body('options').isObject().withMessage('Options must be an object'),
    body('template').optional().isString(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { projectId, contentIds, format, options, template, priority } = req.body;
      const userId = req.headers['x-user-id'] as string || 'anonymous';

      // Validate export options
      const validationErrors = validateExportOptions(options);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: validationErrors
        });
      }

      const jobId = await exportProcessingService.createExportJob(
        userId,
        projectId,
        contentIds,
        format,
        options,
        template,
        priority || 'normal'
      );

      const job = exportProcessingService.getJob(jobId);

      res.status(201).json({
        success: true,
        data: {
          jobId,
          job,
          message: 'Export job created successfully'
        }
      });

    } catch (error) {
      console.error('Error creating export job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create export job',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Create a batch export job
 * POST /api/exports/batch
 */
router.post('/batch',
  [
    body('projectIds').isArray().withMessage('Project IDs must be an array'),
    body('format').isString().notEmpty().withMessage('Format is required'),
    body('options').isObject().withMessage('Options must be an object'),
    body('template').optional().isString(),
    body('batchSettings').isObject().withMessage('Batch settings must be an object')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { projectIds, format, options, template, batchSettings } = req.body;
      const userId = req.headers['x-user-id'] as string || 'anonymous';

      const batchRequest: BatchExportRequest = {
        userId,
        projectIds,
        format,
        options,
        template,
        batchSettings: {
          namingPattern: batchSettings.namingPattern || '{title}_{format}',
          outputDirectory: batchSettings.outputDirectory || 'exports',
          parallelProcessing: batchSettings.parallelProcessing || true,
          maxConcurrentJobs: batchSettings.maxConcurrentJobs || 3
        }
      };

      const jobIds = await exportProcessingService.createBatchExport(batchRequest);

      res.status(201).json({
        success: true,
        data: {
          batchId: `batch_${Date.now()}`,
          jobIds,
          message: `Created ${jobIds.length} export jobs`
        }
      });

    } catch (error) {
      console.error('Error creating batch export:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create batch export',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get export job status
 * GET /api/exports/jobs/:jobId
 */
router.get('/jobs/:jobId',
  [
    param('jobId').isString().notEmpty().withMessage('Job ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = exportProcessingService.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Export job not found'
        });
      }

      res.json({
        success: true,
        data: job
      });

    } catch (error) {
      console.error('Error fetching export job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch export job',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get user's export jobs
 * GET /api/exports/jobs
 */
router.get('/jobs',
  [
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    query('format').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'anonymous';
      const { status, format, limit = 20, offset = 0 } = req.query;

      let jobs = exportProcessingService.getUserJobs(userId);

      // Apply filters
      if (status) {
        jobs = jobs.filter(job => job.status === status);
      }

      if (format) {
        jobs = jobs.filter(job => job.format === format);
      }

      // Apply pagination
      const totalJobs = jobs.length;
      const paginatedJobs = jobs.slice(Number(offset), Number(offset) + Number(limit));

      res.json({
        success: true,
        data: {
          jobs: paginatedJobs,
          pagination: {
            total: totalJobs,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < totalJobs
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch export jobs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Cancel export job
 * POST /api/exports/jobs/:jobId/cancel
 */
router.post('/jobs/:jobId/cancel',
  [
    param('jobId').isString().notEmpty().withMessage('Job ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const success = await exportProcessingService.cancelJob(jobId);

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Job cannot be cancelled or does not exist'
        });
      }

      res.json({
        success: true,
        message: 'Export job cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling export job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel export job',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Delete export job
 * DELETE /api/exports/jobs/:jobId
 */
router.delete('/jobs/:jobId',
  [
    param('jobId').isString().notEmpty().withMessage('Job ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const success = await exportProcessingService.deleteJob(jobId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Export job not found'
        });
      }

      res.json({
        success: true,
        message: 'Export job deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting export job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete export job',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Download export result
 * GET /api/exports/jobs/:jobId/download
 */
router.get('/jobs/:jobId/download',
  [
    param('jobId').isString().notEmpty().withMessage('Job ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = exportProcessingService.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Export job not found'
        });
      }

      if (job.status !== 'completed' || !job.outputPath) {
        return res.status(400).json({
          success: false,
          error: 'Export not ready for download'
        });
      }

      // In a real implementation, this would stream the file from storage
      // For now, we'll return a download URL
      res.json({
        success: true,
        data: {
          downloadUrl: `/downloads/${jobId}`,
          filename: `${job.metadata.title}.${getFileExtension(job.format)}`,
          size: job.outputSize,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

    } catch (error) {
      console.error('Error preparing download:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to prepare download',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Get export statistics
 * GET /api/exports/statistics
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = exportProcessingService.getStatistics();
    
    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get queue status
 * GET /api/exports/queue/status
 */
router.get('/queue/status', async (req: Request, res: Response) => {
  try {
    const queueStatus = exportProcessingService.getQueueStatus();
    
    res.json({
      success: true,
      data: queueStatus
    });

  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available export formats
 * GET /api/exports/formats
 */
router.get('/formats', async (req: Request, res: Response) => {
  try {
    // This would typically come from a service that manages formats
    const formats = [
      {
        id: 'manuscript_pdf',
        name: 'Professional Manuscript (PDF)',
        category: 'manuscript',
        industryStandard: true,
        description: 'Industry-standard manuscript format for agents and publishers'
      },
      {
        id: 'kdp_interior',
        name: 'Kindle Direct Publishing Interior',
        category: 'print',
        industryStandard: true,
        description: 'KDP-compliant paperback interior formatting'
      },
      {
        id: 'final_draft',
        name: 'Final Draft (FDX)',
        category: 'screenplay',
        industryStandard: true,
        description: 'Industry-standard screenplay format'
      },
      {
        id: 'epub3',
        name: 'EPUB 3.0 Enhanced',
        category: 'ebook',
        industryStandard: true,
        description: 'Modern eBook format with enhanced features'
      }
    ];

    res.json({
      success: true,
      data: formats
    });

  } catch (error) {
    console.error('Error fetching formats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export formats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available templates for a format
 * GET /api/exports/templates
 */
router.get('/templates',
  [
    query('format').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const { format } = req.query;

      // This would typically come from a template service
      let templates = [
        {
          id: 'novel_manuscript',
          name: 'Novel Manuscript (Industry Standard)',
          format: 'manuscript_pdf',
          category: 'manuscript',
          industryStandard: 'Publishing Industry Standard',
          description: 'Industry-standard novel manuscript format for agents and publishers'
        },
        {
          id: 'kdp_paperback',
          name: 'Kindle Direct Publishing Paperback',
          format: 'kdp_interior',
          category: 'manuscript',
          industryStandard: 'KDP Standard',
          description: 'KDP-compliant paperback interior formatting'
        },
        {
          id: 'feature_screenplay',
          name: 'Feature Film Screenplay',
          format: 'final_draft',
          category: 'screenplay',
          industryStandard: 'WGA Format',
          description: 'Industry-standard feature film screenplay (90-120 pages)'
        }
      ];

      if (format) {
        templates = templates.filter(template => template.format === format);
      }

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Helper functions

function validateExportOptions(options: ExportOptions): string[] {
  const errors: string[] = [];

  if (!options.format) {
    errors.push('Format is required in options');
  }

  if (!options.quality || !['draft', 'standard', 'professional', 'print-ready'].includes(options.quality)) {
    errors.push('Valid quality level is required (draft, standard, professional, print-ready)');
  }

  if (typeof options.includeMetadata !== 'boolean') {
    errors.push('includeMetadata must be a boolean');
  }

  if (typeof options.includeCodexData !== 'boolean') {
    errors.push('includeCodexData must be a boolean');
  }

  if (!options.qualityAssurance || typeof options.qualityAssurance !== 'object') {
    errors.push('qualityAssurance options are required');
  }

  if (!options.outputSettings || typeof options.outputSettings !== 'object') {
    errors.push('outputSettings are required');
  }

  return errors;
}

function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    'manuscript_pdf': 'pdf',
    'kdp_interior': 'pdf',
    'epub3': 'epub',
    'final_draft': 'fdx',
    'docx': 'docx',
    'html': 'html',
    'markdown': 'md'
  };
  
  return extensions[format] || 'txt';
}

export default router;