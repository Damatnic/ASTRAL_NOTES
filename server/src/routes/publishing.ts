/**
 * Publishing Routes
 * API endpoints for Phase 2D Professional Publishing features
 */

import express from 'express';
import { auth } from '../middleware/auth.js';
import publishingFormatService from '../services/publishingFormatService.js';
import submissionTrackingService from '../services/submissionTrackingService.js';
import marketingAutomationService from '../services/marketingAutomationService.js';
import rightsManagementService from '../services/rightsManagementService.js';
import directPublishingService from '../services/directPublishingService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// PUBLISHING PROJECTS

/**
 * Create a new publishing project
 */
router.post('/projects', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      title,
      subtitle,
      description,
      projectId,
      storyId,
      genre,
      subgenre,
      keywords,
      targetAudience,
      language,
      publishingPath
    } = req.body;

    const publishingProject = await prisma.publishingProject.create({
      data: {
        title,
        subtitle,
        description,
        projectId,
        storyId,
        genre: JSON.stringify(genre || []),
        subgenre: JSON.stringify(subgenre || []),
        keywords: JSON.stringify(keywords || []),
        targetAudience: targetAudience || 'adult',
        language: language || 'en',
        publishingPath: publishingPath || 'self',
        authorId: userId
      },
      include: {
        project: true,
        author: true
      }
    });

    res.json(publishingProject);
  } catch (error) {
    console.error('Error creating publishing project:', error);
    res.status(500).json({ error: 'Failed to create publishing project' });
  }
});

/**
 * Get user's publishing projects
 */
router.get('/projects', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projects = await prisma.publishingProject.findMany({
      where: { authorId: userId },
      include: {
        manuscripts: true,
        submissions: {
          include: {
            agent: true,
            publisher: true
          }
        },
        contracts: {
          include: {
            publisher: true
          }
        },
        marketingCampaigns: true,
        salesData: true,
        directPublications: {
          include: {
            platform: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching publishing projects:', error);
    res.status(500).json({ error: 'Failed to fetch publishing projects' });
  }
});

/**
 * Get specific publishing project
 */
router.get('/projects/:id', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const project = await prisma.publishingProject.findFirst({
      where: {
        id,
        authorId: userId
      },
      include: {
        project: true,
        author: true,
        manuscripts: true,
        submissions: {
          include: {
            agent: true,
            publisher: true
          }
        },
        contracts: {
          include: {
            publisher: true
          }
        },
        marketingCampaigns: {
          include: {
            activities: true
          }
        },
        salesData: true,
        reviews: true,
        rightsTransactions: true,
        directPublications: {
          include: {
            platform: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Publishing project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching publishing project:', error);
    res.status(500).json({ error: 'Failed to fetch publishing project' });
  }
});

// MANUSCRIPT FORMATTING

/**
 * Format manuscript with industry standards
 */
router.post('/manuscripts/:id/format', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { formatType, guideline, customSettings } = req.body;

    const manuscript = await prisma.manuscript.findUnique({
      where: { id }
    });

    if (!manuscript) {
      return res.status(404).json({ error: 'Manuscript not found' });
    }

    const formatted = await publishingFormatService.formatManuscript(
      manuscript.content,
      { formatType, guideline, customSettings }
    );

    // Update manuscript with formatting
    const updatedManuscript = await prisma.manuscript.update({
      where: { id },
      data: {
        content: formatted.content,
        formatType,
        publisherGuideline: guideline,
        wordCount: formatted.wordCount,
        pageCount: formatted.pageCount
      }
    });

    res.json({
      manuscript: updatedManuscript,
      formatting: formatted.formatMetadata
    });
  } catch (error) {
    console.error('Error formatting manuscript:', error);
    res.status(500).json({ error: 'Failed to format manuscript' });
  }
});

/**
 * Export manuscript in various formats
 */
router.post('/manuscripts/:id/export', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.body;

    if (!['docx', 'pdf', 'epub', 'mobi'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }

    const result = await publishingFormatService.exportManuscript(id, format);
    res.json(result);
  } catch (error) {
    console.error('Error exporting manuscript:', error);
    res.status(500).json({ error: 'Failed to export manuscript' });
  }
});

/**
 * Validate manuscript for submission
 */
router.get('/manuscripts/:id/validate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const validation = await publishingFormatService.validateForSubmission(id);
    res.json(validation);
  } catch (error) {
    console.error('Error validating manuscript:', error);
    res.status(500).json({ error: 'Failed to validate manuscript' });
  }
});

// SUBMISSION TRACKING

/**
 * Create a submission
 */
router.post('/submissions', auth, async (req, res) => {
  try {
    const submission = await submissionTrackingService.createSubmission(req.body);
    res.json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

/**
 * Update submission response
 */
router.put('/submissions/:id/response', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const submission = await submissionTrackingService.updateSubmissionResponse(
      id,
      status,
      response
    );

    res.json(submission);
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

/**
 * Get submissions for follow-up
 */
router.get('/submissions/follow-up', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const submissions = await submissionTrackingService.getSubmissionsForFollowUp(userId);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching follow-up submissions:', error);
    res.status(500).json({ error: 'Failed to fetch follow-up submissions' });
  }
});

/**
 * Get submission analytics
 */
router.get('/submissions/analytics', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analytics = await submissionTrackingService.getUserSubmissionAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching submission analytics:', error);
    res.status(500).json({ error: 'Failed to fetch submission analytics' });
  }
});

/**
 * Get market intelligence
 */
router.get('/market-intelligence', auth, async (req, res) => {
  try {
    const intelligence = await submissionTrackingService.getMarketIntelligence();
    res.json(intelligence);
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch market intelligence' });
  }
});

/**
 * Search agents
 */
router.get('/agents/search', auth, async (req, res) => {
  try {
    const { genres, clientTypes, acceptingQueries } = req.query;
    
    const criteria = {
      genres: genres ? (genres as string).split(',') : undefined,
      clientTypes: clientTypes ? (clientTypes as string).split(',') : undefined,
      acceptingQueries: acceptingQueries === 'true'
    };

    const agents = await submissionTrackingService.searchAgents(criteria);
    res.json(agents);
  } catch (error) {
    console.error('Error searching agents:', error);
    res.status(500).json({ error: 'Failed to search agents' });
  }
});

/**
 * Search publishers
 */
router.get('/publishers/search', auth, async (req, res) => {
  try {
    const { genres, type, acceptsUnsolicited, acceptingSubmissions } = req.query;
    
    const criteria = {
      genres: genres ? (genres as string).split(',') : undefined,
      type: type as string,
      acceptsUnsolicited: acceptsUnsolicited === 'true',
      acceptingSubmissions: acceptingSubmissions === 'true'
    };

    const publishers = await submissionTrackingService.searchPublishers(criteria);
    res.json(publishers);
  } catch (error) {
    console.error('Error searching publishers:', error);
    res.status(500).json({ error: 'Failed to search publishers' });
  }
});

// MARKETING AUTOMATION

/**
 * Create marketing campaign
 */
router.post('/marketing/campaigns', auth, async (req, res) => {
  try {
    const campaign = await marketingAutomationService.createCampaign(req.body);
    res.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * Create campaign from template
 */
router.post('/marketing/campaigns/from-template', auth, async (req, res) => {
  try {
    const { publishingProjectId, templateName, launchDate } = req.body;
    
    const campaign = await marketingAutomationService.createCampaignFromTemplate(
      publishingProjectId,
      templateName,
      new Date(launchDate)
    );

    res.json(campaign);
  } catch (error) {
    console.error('Error creating campaign from template:', error);
    res.status(500).json({ error: 'Failed to create campaign from template' });
  }
});

/**
 * Get campaign analytics
 */
router.get('/marketing/campaigns/:id/analytics', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const analytics = await marketingAutomationService.getCampaignAnalytics(id);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

/**
 * Get marketing analytics overview
 */
router.get('/marketing/analytics', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analytics = await marketingAutomationService.getMarketingAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching marketing analytics:', error);
    res.status(500).json({ error: 'Failed to fetch marketing analytics' });
  }
});

/**
 * Generate press kit
 */
router.post('/marketing/press-kit/:publishingProjectId', auth, async (req, res) => {
  try {
    const { publishingProjectId } = req.params;
    
    const pressKit = await marketingAutomationService.generatePressKit(publishingProjectId);
    res.json(pressKit);
  } catch (error) {
    console.error('Error generating press kit:', error);
    res.status(500).json({ error: 'Failed to generate press kit' });
  }
});

/**
 * Generate marketing content
 */
router.post('/marketing/content/generate', auth, async (req, res) => {
  try {
    const { type, bookInfo } = req.body;
    
    const content = marketingAutomationService.generateMarketingContent(type, bookInfo);
    res.json({ content });
  } catch (error) {
    console.error('Error generating marketing content:', error);
    res.status(500).json({ error: 'Failed to generate marketing content' });
  }
});

// RIGHTS MANAGEMENT

/**
 * Register copyright
 */
router.post('/rights/copyright', auth, async (req, res) => {
  try {
    const registration = await rightsManagementService.registerCopyright(req.body);
    res.json(registration);
  } catch (error) {
    console.error('Error registering copyright:', error);
    res.status(500).json({ error: 'Failed to register copyright' });
  }
});

/**
 * Create rights transaction
 */
router.post('/rights/transactions', auth, async (req, res) => {
  try {
    const transaction = await rightsManagementService.createRightsTransaction(req.body);
    res.json(transaction);
  } catch (error) {
    console.error('Error creating rights transaction:', error);
    res.status(500).json({ error: 'Failed to create rights transaction' });
  }
});

/**
 * Create publishing contract
 */
router.post('/contracts', auth, async (req, res) => {
  try {
    const contract = await rightsManagementService.createContract(req.body);
    res.json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

/**
 * Get rights portfolio
 */
router.get('/rights/portfolio/:publishingProjectId', auth, async (req, res) => {
  try {
    const { publishingProjectId } = req.params;
    
    const portfolio = await rightsManagementService.getRightsPortfolio(publishingProjectId);
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching rights portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch rights portfolio' });
  }
});

/**
 * Get expiring rights
 */
router.get('/rights/expiring', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { daysAhead } = req.query;
    const expiringRights = await rightsManagementService.getExpiringRights(
      userId,
      daysAhead ? parseInt(daysAhead as string) : 90
    );

    res.json(expiringRights);
  } catch (error) {
    console.error('Error fetching expiring rights:', error);
    res.status(500).json({ error: 'Failed to fetch expiring rights' });
  }
});

/**
 * Generate valuation report
 */
router.get('/rights/valuation/:publishingProjectId', auth, async (req, res) => {
  try {
    const { publishingProjectId } = req.params;
    
    const report = await rightsManagementService.generateValuationReport(publishingProjectId);
    res.json(report);
  } catch (error) {
    console.error('Error generating valuation report:', error);
    res.status(500).json({ error: 'Failed to generate valuation report' });
  }
});

// DIRECT PUBLISHING

/**
 * Initialize publishing platforms
 */
router.post('/platforms/initialize', auth, async (req, res) => {
  try {
    const platforms = await directPublishingService.initializePlatforms();
    res.json(platforms);
  } catch (error) {
    console.error('Error initializing platforms:', error);
    res.status(500).json({ error: 'Failed to initialize platforms' });
  }
});

/**
 * Get available platforms
 */
router.get('/platforms', auth, async (req, res) => {
  try {
    const platforms = await prisma.publishingPlatform.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

/**
 * Publish to platform
 */
router.post('/platforms/publish', auth, async (req, res) => {
  try {
    const result = await directPublishingService.publishToPlatform(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error publishing to platform:', error);
    res.status(500).json({ error: 'Failed to publish to platform' });
  }
});

/**
 * Bulk publish to multiple platforms
 */
router.post('/platforms/bulk-publish', auth, async (req, res) => {
  try {
    const { publishingProjectId, platformIds, ...commonData } = req.body;
    
    const results = await directPublishingService.bulkPublish(
      publishingProjectId,
      platformIds,
      commonData
    );

    res.json(results);
  } catch (error) {
    console.error('Error bulk publishing:', error);
    res.status(500).json({ error: 'Failed to bulk publish' });
  }
});

/**
 * Get publishing status
 */
router.get('/projects/:id/publishing-status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await directPublishingService.getPublishingStatus(id);
    res.json(status);
  } catch (error) {
    console.error('Error fetching publishing status:', error);
    res.status(500).json({ error: 'Failed to fetch publishing status' });
  }
});

/**
 * Sync sales data
 */
router.post('/projects/:id/sync-sales', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const salesReports = await directPublishingService.syncSalesData(id);
    res.json(salesReports);
  } catch (error) {
    console.error('Error syncing sales data:', error);
    res.status(500).json({ error: 'Failed to sync sales data' });
  }
});

/**
 * Get pricing recommendations
 */
router.get('/platforms/:platformId/pricing', auth, async (req, res) => {
  try {
    const { platformId } = req.params;
    const { genre, wordCount } = req.query;

    const platform = await prisma.publishingPlatform.findUnique({
      where: { id: platformId }
    });

    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    const genres = genre ? (genre as string).split(',') : [];
    const count = wordCount ? parseInt(wordCount as string) : 50000;

    const recommendations = directPublishingService.getPricingRecommendations(
      genres,
      count,
      platform.name
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting pricing recommendations:', error);
    res.status(500).json({ error: 'Failed to get pricing recommendations' });
  }
});

export default router;