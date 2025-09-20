/**
 * Template Marketplace API Routes
 * Handles template marketplace operations, submissions, purchases, and community features
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { validateSchema } from '../middleware/validation';
import { marketplaceService } from '../services/marketplaceService';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const templateSubmissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  templateData: z.string(),
  category: z.enum(['novel', 'screenplay', 'non-fiction', 'world-building', 'character', 'marketing']),
  genre: z.array(z.string()).optional(),
  subgenre: z.array(z.string()).optional(),
  structure: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tags: z.array(z.string()).optional(),
  targetWordCount: z.number().min(0).optional(),
  estimatedDuration: z.string().optional(),
  targetAudience: z.string().optional(),
  writingLevel: z.string().optional(),
  licenseType: z.enum(['free', 'premium', 'exclusive']).default('free'),
  price: z.number().min(0).default(0),
  previewContent: z.string().optional(),
  coverImage: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(10).max(2000),
  isRecommended: z.boolean().default(true),
  usageRating: z.number().min(1).max(5).optional(),
  difficultyRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
});

const collectionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['user', 'editorial', 'featured', 'genre']).default('user'),
  isPublic: z.boolean().default(false),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// TEMPLATE DISCOVERY AND BROWSING

/**
 * GET /api/marketplace/templates
 * Browse marketplace templates with filtering and search
 */
router.get('/templates', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      genre,
      difficulty,
      licenseType,
      priceMin,
      priceMax,
      sortBy = 'popular',
      featured,
      verified
    } = req.query;

    const filters = {
      search: search as string,
      category: category as string,
      genre: genre as string,
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      licenseType: licenseType as 'free' | 'premium' | 'exclusive',
      priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
      priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
      featured: featured === 'true',
      verified: verified === 'true',
    };

    const result = await marketplaceService.searchTemplates(
      filters,
      {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 50),
        sortBy: sortBy as 'popular' | 'recent' | 'rating' | 'price' | 'downloads',
      }
    );

    res.json(result);
  } catch (error) {
    logger.error('Error fetching marketplace templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/marketplace/templates/:id
 * Get detailed template information
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const template = await marketplaceService.getTemplateById(id, userId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * GET /api/marketplace/templates/:id/preview
 * Get template preview content
 */
router.get('/templates/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    
    const preview = await marketplaceService.getTemplatePreview(id);
    
    if (!preview) {
      return res.status(404).json({ error: 'Preview not available' });
    }

    res.json(preview);
  } catch (error) {
    logger.error('Error fetching template preview:', error);
    res.status(500).json({ error: 'Failed to fetch preview' });
  }
});

// TEMPLATE SUBMISSION AND MANAGEMENT

/**
 * POST /api/marketplace/templates
 * Submit a new template to the marketplace
 */
router.post('/templates', authMiddleware, validateSchema(templateSubmissionSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const templateData = req.body;

    const submission = await marketplaceService.submitTemplate(userId, templateData);

    res.status(201).json({
      message: 'Template submitted successfully',
      submission,
    });
  } catch (error) {
    logger.error('Error submitting template:', error);
    res.status(500).json({ error: 'Failed to submit template' });
  }
});

/**
 * PUT /api/marketplace/templates/:id
 * Update an existing template (only for creators)
 */
router.put('/templates/:id', authMiddleware, validateSchema(templateSubmissionSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    const template = await marketplaceService.updateTemplate(id, userId, updateData);

    res.json({
      message: 'Template updated successfully',
      template,
    });
  } catch (error) {
    logger.error('Error updating template:', error);
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You can only update your own templates' });
    }
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/marketplace/templates/:id
 * Delete a template (only for creators or admins)
 */
router.delete('/templates/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    await marketplaceService.deleteTemplate(id, userId, userRole);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Error deleting template:', error);
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You can only delete your own templates' });
    }
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// TEMPLATE PURCHASES AND DOWNLOADS

/**
 * POST /api/marketplace/templates/:id/purchase
 * Purchase a premium template
 */
router.post('/templates/:id/purchase', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { paymentMethod } = req.body;

    const purchase = await marketplaceService.purchaseTemplate(id, userId, paymentMethod);

    res.json({
      message: 'Template purchased successfully',
      purchase,
    });
  } catch (error) {
    logger.error('Error purchasing template:', error);
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error.message === 'Template already purchased') {
      return res.status(400).json({ error: 'Template already purchased' });
    }
    if (error.message === 'Template is free') {
      return res.status(400).json({ error: 'This template is free - use download endpoint' });
    }
    res.status(500).json({ error: 'Failed to purchase template' });
  }
});

/**
 * POST /api/marketplace/templates/:id/download
 * Download a free template or purchased template
 */
router.post('/templates/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const download = await marketplaceService.downloadTemplate(id, userId);

    res.json({
      message: 'Template downloaded successfully',
      download,
    });
  } catch (error) {
    logger.error('Error downloading template:', error);
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error.message === 'Purchase required') {
      return res.status(402).json({ error: 'This template requires purchase' });
    }
    res.status(500).json({ error: 'Failed to download template' });
  }
});

// REVIEWS AND RATINGS

/**
 * GET /api/marketplace/templates/:id/reviews
 * Get reviews for a template
 */
router.get('/templates/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;

    const reviews = await marketplaceService.getTemplateReviews(id, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
      sortBy: sortBy as 'recent' | 'rating' | 'helpful',
    });

    res.json(reviews);
  } catch (error) {
    logger.error('Error fetching template reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/marketplace/templates/:id/reviews
 * Submit a review for a template
 */
router.post('/templates/:id/reviews', authMiddleware, validateSchema(reviewSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const reviewData = req.body;

    const review = await marketplaceService.submitReview(id, userId, reviewData);

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    logger.error('Error submitting review:', error);
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error.message === 'Review already exists') {
      return res.status(400).json({ error: 'You have already reviewed this template' });
    }
    if (error.message === 'Purchase required for review') {
      return res.status(400).json({ error: 'You must purchase or download this template to review it' });
    }
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * PUT /api/marketplace/reviews/:id
 * Update an existing review
 */
router.put('/reviews/:id', authMiddleware, validateSchema(reviewSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    const review = await marketplaceService.updateReview(id, userId, updateData);

    res.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    logger.error('Error updating review:', error);
    if (error.message === 'Review not found') {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// TEMPLATE LIKES AND FAVORITES

/**
 * POST /api/marketplace/templates/:id/like
 * Like or unlike a template
 */
router.post('/templates/:id/like', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await marketplaceService.toggleTemplateLike(id, userId);

    res.json({
      message: result.liked ? 'Template liked' : 'Template unliked',
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    logger.error('Error toggling template like:', error);
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// CREATOR PROFILES

/**
 * GET /api/marketplace/creators/:id
 * Get creator profile
 */
router.get('/creators/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const creator = await marketplaceService.getCreatorProfile(id);
    
    if (!creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json(creator);
  } catch (error) {
    logger.error('Error fetching creator profile:', error);
    res.status(500).json({ error: 'Failed to fetch creator profile' });
  }
});

/**
 * GET /api/marketplace/creators/:id/templates
 * Get templates by a creator
 */
router.get('/creators/:id/templates', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, sortBy = 'recent' } = req.query;

    const templates = await marketplaceService.getCreatorTemplates(id, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
      sortBy: sortBy as 'recent' | 'popular' | 'rating',
    });

    res.json(templates);
  } catch (error) {
    logger.error('Error fetching creator templates:', error);
    res.status(500).json({ error: 'Failed to fetch creator templates' });
  }
});

/**
 * POST /api/marketplace/creators/:id/follow
 * Follow or unfollow a creator
 */
router.post('/creators/:id/follow', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await marketplaceService.toggleCreatorFollow(id, userId);

    res.json({
      message: result.following ? 'Creator followed' : 'Creator unfollowed',
      following: result.following,
      followerCount: result.followerCount,
    });
  } catch (error) {
    logger.error('Error toggling creator follow:', error);
    if (error.message === 'Creator not found') {
      return res.status(404).json({ error: 'Creator not found' });
    }
    if (error.message === 'Cannot follow yourself') {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

// TEMPLATE COLLECTIONS

/**
 * GET /api/marketplace/collections
 * Browse template collections
 */
router.get('/collections', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      featured,
      category,
      sortBy = 'recent'
    } = req.query;

    const filters = {
      type: type as string,
      featured: featured === 'true',
      category: category as string,
    };

    const collections = await marketplaceService.getCollections(filters, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
      sortBy: sortBy as 'recent' | 'popular' | 'items',
    });

    res.json(collections);
  } catch (error) {
    logger.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * GET /api/marketplace/collections/:id
 * Get collection details with templates
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await marketplaceService.getCollectionById(id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    logger.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

/**
 * POST /api/marketplace/collections
 * Create a new template collection
 */
router.post('/collections', authMiddleware, validateSchema(collectionSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const collectionData = req.body;

    const collection = await marketplaceService.createCollection(userId, collectionData);

    res.status(201).json({
      message: 'Collection created successfully',
      collection,
    });
  } catch (error) {
    logger.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

/**
 * POST /api/marketplace/collections/:id/templates
 * Add template to collection
 */
router.post('/collections/:id/templates', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { templateId, note } = req.body;

    await marketplaceService.addTemplateToCollection(id, templateId, userId, note);

    res.json({ message: 'Template added to collection successfully' });
  } catch (error) {
    logger.error('Error adding template to collection:', error);
    if (error.message === 'Collection not found') {
      return res.status(404).json({ error: 'Collection not found' });
    }
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You can only modify your own collections' });
    }
    if (error.message === 'Template already in collection') {
      return res.status(400).json({ error: 'Template is already in this collection' });
    }
    res.status(500).json({ error: 'Failed to add template to collection' });
  }
});

// MARKETPLACE ANALYTICS

/**
 * GET /api/marketplace/analytics/trending
 * Get trending templates and creators
 */
router.get('/analytics/trending', async (req, res) => {
  try {
    const trending = await marketplaceService.getTrendingContent();
    res.json(trending);
  } catch (error) {
    logger.error('Error fetching trending content:', error);
    res.status(500).json({ error: 'Failed to fetch trending content' });
  }
});

/**
 * GET /api/marketplace/analytics/stats
 * Get marketplace statistics
 */
router.get('/analytics/stats', async (req, res) => {
  try {
    const stats = await marketplaceService.getMarketplaceStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace stats' });
  }
});

// USER-SPECIFIC ENDPOINTS

/**
 * GET /api/marketplace/user/purchases
 * Get user's purchased templates
 */
router.get('/user/purchases', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const purchases = await marketplaceService.getUserPurchases(userId, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
    });

    res.json(purchases);
  } catch (error) {
    logger.error('Error fetching user purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

/**
 * GET /api/marketplace/user/downloads
 * Get user's downloaded templates
 */
router.get('/user/downloads', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const downloads = await marketplaceService.getUserDownloads(userId, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
    });

    res.json(downloads);
  } catch (error) {
    logger.error('Error fetching user downloads:', error);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

/**
 * GET /api/marketplace/user/likes
 * Get user's liked templates
 */
router.get('/user/likes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const likes = await marketplaceService.getUserLikes(userId, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
    });

    res.json(likes);
  } catch (error) {
    logger.error('Error fetching user likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

/**
 * GET /api/marketplace/user/collections
 * Get user's collections
 */
router.get('/user/collections', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const collections = await marketplaceService.getUserCollections(userId, {
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 50),
    });

    res.json(collections);
  } catch (error) {
    logger.error('Error fetching user collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

export default router;