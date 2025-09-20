/**
 * Template Marketplace Service
 * Handles all marketplace business logic including submissions, purchases, reviews, and analytics
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface SearchFilters {
  search?: string;
  category?: string;
  genre?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  licenseType?: 'free' | 'premium' | 'exclusive';
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
  verified?: boolean;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
}

interface TemplateSubmissionData {
  title: string;
  description: string;
  templateData: string;
  category: string;
  genre?: string[];
  subgenre?: string[];
  structure?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  targetWordCount?: number;
  estimatedDuration?: string;
  targetAudience?: string;
  writingLevel?: string;
  licenseType?: 'free' | 'premium' | 'exclusive';
  price?: number;
  previewContent?: string;
  coverImage?: string;
  screenshots?: string[];
}

interface ReviewData {
  rating: number;
  title?: string;
  content: string;
  isRecommended?: boolean;
  usageRating?: number;
  difficultyRating?: number;
  valueRating?: number;
}

interface CollectionData {
  title: string;
  description?: string;
  type?: 'user' | 'editorial' | 'featured' | 'genre';
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
  category?: string;
}

class MarketplaceService {
  
  // TEMPLATE DISCOVERY AND SEARCH
  
  async searchTemplates(filters: SearchFilters, options: PaginationOptions) {
    const { page, limit, sortBy } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isPublic: true,
      processingStatus: 'published',
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.genre) {
      where.genre = { contains: filters.genre };
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.licenseType) {
      where.licenseType = filters.licenseType;
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.price = {};
      if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
      if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
    }

    if (filters.featured) {
      where.isFeatured = true;
    }

    if (filters.verified) {
      where.isVerified = true;
    }

    // Build order clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'popular':
        orderBy = [
          { averageRating: 'desc' },
          { downloadCount: 'desc' },
        ];
        break;
      case 'recent':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'price':
        orderBy = { price: 'asc' };
        break;
      case 'downloads':
        orderBy = { downloadCount: 'desc' };
        break;
      default:
        orderBy = { publishedAt: 'desc' };
    }

    const [templates, total] = await Promise.all([
      prisma.marketplaceTemplate.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              downloads: true,
              purchases: true,
              likes: true,
            },
          },
        },
      }),
      prisma.marketplaceTemplate.count({ where }),
    ]);

    return {
      templates: templates.map(template => ({
        ...template,
        genre: JSON.parse(template.genre || '[]'),
        subgenre: JSON.parse(template.subgenre || '[]'),
        tags: JSON.parse(template.tags || '[]'),
        screenshots: JSON.parse(template.screenshots || '[]'),
        stats: template._count,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTemplateById(templateId: string, userId?: string) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: {
        id: templateId,
        isPublic: true,
        processingStatus: 'published',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            downloads: true,
            purchases: true,
            likes: true,
          },
        },
      },
    });

    if (!template) return null;

    // Track view
    await this.trackTemplateView(templateId, userId);

    // Check if user has purchased/downloaded
    let userStatus = null;
    if (userId) {
      const [purchase, download, like] = await Promise.all([
        prisma.templatePurchase.findUnique({
          where: {
            templateId_purchaserId: {
              templateId,
              purchaserId: userId,
            },
          },
        }),
        prisma.templateDownload.findUnique({
          where: {
            templateId_downloaderId: {
              templateId,
              downloaderId: userId,
            },
          },
        }),
        prisma.templateLike.findUnique({
          where: {
            templateId_userId: {
              templateId,
              userId,
            },
          },
        }),
      ]);

      userStatus = {
        purchased: !!purchase,
        downloaded: !!download,
        liked: !!like,
        hasAccess: !!purchase || !!download || template.licenseType === 'free',
      };
    }

    return {
      ...template,
      genre: JSON.parse(template.genre || '[]'),
      subgenre: JSON.parse(template.subgenre || '[]'),
      tags: JSON.parse(template.tags || '[]'),
      screenshots: JSON.parse(template.screenshots || '[]'),
      sections: JSON.parse(template.sections || '[]'),
      metadata: JSON.parse(template.metadata || '{}'),
      stats: template._count,
      userStatus,
    };
  }

  async getTemplatePreview(templateId: string) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: {
        id: templateId,
        isPublic: true,
        processingStatus: 'published',
      },
      select: {
        id: true,
        title: true,
        description: true,
        previewContent: true,
        structure: true,
        sections: true,
        targetWordCount: true,
        estimatedDuration: true,
        difficulty: true,
      },
    });

    if (!template) return null;

    return {
      ...template,
      sections: JSON.parse(template.sections || '[]').slice(0, 3), // Only first 3 sections
    };
  }

  // TEMPLATE SUBMISSION AND MANAGEMENT

  async submitTemplate(userId: string, templateData: TemplateSubmissionData) {
    // Create template submission for review
    const submission = await prisma.templateSubmission.create({
      data: {
        submitterId: userId,
        title: templateData.title,
        description: templateData.description,
        templateData: templateData.templateData,
        category: templateData.category,
        requestedPrice: templateData.price || 0,
        licenseType: templateData.licenseType || 'free',
        hasPreview: !!templateData.previewContent,
        hasDescription: templateData.description.length >= 10,
        hasMetadata: !!templateData.tags?.length,
        isFormatValid: true, // Would implement proper validation
        isContentOriginal: true, // Would implement plagiarism check
      },
    });

    // Auto-approve free templates with good quality score
    if (this.calculateQualityScore(submission) >= 80 && templateData.licenseType === 'free') {
      await this.approveTemplate(submission.id);
    }

    return submission;
  }

  async updateTemplate(templateId: string, userId: string, updateData: TemplateSubmissionData) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.authorId !== userId) {
      throw new Error('Unauthorized');
    }

    // Create new version
    const updatedTemplate = await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        title: updateData.title,
        description: updateData.description,
        templateData: updateData.templateData,
        genre: JSON.stringify(updateData.genre || []),
        subgenre: JSON.stringify(updateData.subgenre || []),
        tags: JSON.stringify(updateData.tags || []),
        targetWordCount: updateData.targetWordCount || 0,
        estimatedDuration: updateData.estimatedDuration,
        targetAudience: updateData.targetAudience || 'general',
        writingLevel: updateData.writingLevel || 'amateur',
        price: updateData.price || 0,
        previewContent: updateData.previewContent,
        coverImage: updateData.coverImage,
        screenshots: JSON.stringify(updateData.screenshots || []),
        sections: updateData.templateData, // Extract sections from template data
        metadata: JSON.stringify({}), // Extract metadata from template data
        version: this.incrementVersion(template.version),
        changeLog: this.updateChangeLog(template.changeLog, 'Updated template'),
        processingStatus: 'reviewing', // Re-review updated templates
      },
    });

    return updatedTemplate;
  }

  async deleteTemplate(templateId: string, userId: string, userRole: string) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.authorId !== userId && userRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    await prisma.marketplaceTemplate.delete({
      where: { id: templateId },
    });
  }

  // PURCHASES AND DOWNLOADS

  async purchaseTemplate(templateId: string, userId: string, paymentMethod: string) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.licenseType === 'free') {
      throw new Error('Template is free');
    }

    // Check if already purchased
    const existingPurchase = await prisma.templatePurchase.findUnique({
      where: {
        templateId_purchaserId: {
          templateId,
          purchaserId: userId,
        },
      },
    });

    if (existingPurchase) {
      throw new Error('Template already purchased');
    }

    // Create purchase record
    const purchase = await prisma.templatePurchase.create({
      data: {
        templateId,
        purchaserId: userId,
        price: template.price,
        licenseType: template.licenseType,
        paymentMethod,
        paymentStatus: 'completed', // Would integrate with payment processor
        licenseKey: this.generateLicenseKey(),
      },
    });

    // Update template stats
    await this.updateTemplateStats(templateId, { purchaseCount: 1 });

    // Record creator revenue
    await this.recordCreatorRevenue(template.authorId, template.price, templateId);

    return purchase;
  }

  async downloadTemplate(templateId: string, userId: string) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Check if premium template is purchased
    if (template.licenseType !== 'free') {
      const purchase = await prisma.templatePurchase.findUnique({
        where: {
          templateId_purchaserId: {
            templateId,
            purchaserId: userId,
          },
        },
      });

      if (!purchase) {
        throw new Error('Purchase required');
      }
    }

    // Check if already downloaded
    const existingDownload = await prisma.templateDownload.findUnique({
      where: {
        templateId_downloaderId: {
          templateId,
          downloaderId: userId,
        },
      },
    });

    if (!existingDownload) {
      // Create download record
      await prisma.templateDownload.create({
        data: {
          templateId,
          downloaderId: userId,
        },
      });

      // Update template stats
      await this.updateTemplateStats(templateId, { downloadCount: 1 });
    }

    // Return template data
    return {
      ...template,
      templateData: JSON.parse(template.templateData),
      sections: JSON.parse(template.sections || '[]'),
      metadata: JSON.parse(template.metadata || '{}'),
    };
  }

  // REVIEWS AND RATINGS

  async getTemplateReviews(templateId: string, options: PaginationOptions) {
    const { page, limit, sortBy } = options;
    const skip = (page - 1) * limit;

    let orderBy: any = {};
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.templateReview.findMany({
        where: {
          templateId,
          isHidden: false,
        },
        orderBy,
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.templateReview.count({
        where: {
          templateId,
          isHidden: false,
        },
      }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async submitReview(templateId: string, userId: string, reviewData: ReviewData) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Check if already reviewed
    const existingReview = await prisma.templateReview.findUnique({
      where: {
        templateId_reviewerId: {
          templateId,
          reviewerId: userId,
        },
      },
    });

    if (existingReview) {
      throw new Error('Review already exists');
    }

    // Check if user has access to template (purchased or downloaded)
    const [purchase, download] = await Promise.all([
      prisma.templatePurchase.findUnique({
        where: {
          templateId_purchaserId: {
            templateId,
            purchaserId: userId,
          },
        },
      }),
      prisma.templateDownload.findUnique({
        where: {
          templateId_downloaderId: {
            templateId,
            downloaderId: userId,
          },
        },
      }),
    ]);

    if (!purchase && !download && template.licenseType !== 'free') {
      throw new Error('Purchase required for review');
    }

    // Create review
    const review = await prisma.templateReview.create({
      data: {
        templateId,
        reviewerId: userId,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        isRecommended: reviewData.isRecommended ?? true,
        usageRating: reviewData.usageRating,
        difficultyRating: reviewData.difficultyRating,
        valueRating: reviewData.valueRating,
        isVerifiedPurchase: !!purchase,
      },
    });

    // Update template average rating
    await this.updateTemplateRating(templateId);

    return review;
  }

  async updateReview(reviewId: string, userId: string, updateData: ReviewData) {
    const review = await prisma.templateReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.reviewerId !== userId) {
      throw new Error('Unauthorized');
    }

    const updatedReview = await prisma.templateReview.update({
      where: { id: reviewId },
      data: {
        rating: updateData.rating,
        title: updateData.title,
        content: updateData.content,
        isRecommended: updateData.isRecommended,
        usageRating: updateData.usageRating,
        difficultyRating: updateData.difficultyRating,
        valueRating: updateData.valueRating,
      },
    });

    // Update template average rating
    await this.updateTemplateRating(review.templateId);

    return updatedReview;
  }

  // LIKES AND FAVORITES

  async toggleTemplateLike(templateId: string, userId: string) {
    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const existingLike = await prisma.templateLike.findUnique({
      where: {
        templateId_userId: {
          templateId,
          userId,
        },
      },
    });

    let liked: boolean;

    if (existingLike) {
      // Unlike
      await prisma.templateLike.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      // Like
      await prisma.templateLike.create({
        data: {
          templateId,
          userId,
        },
      });
      liked = true;
    }

    // Update template like count
    const likeCount = await prisma.templateLike.count({
      where: { templateId },
    });

    await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: { likeCount },
    });

    return { liked, likeCount };
  }

  // CREATOR PROFILES

  async getCreatorProfile(creatorId: string) {
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!creator || !creator.publicProfile) {
      return null;
    }

    // Get template stats
    const templateStats = await prisma.marketplaceTemplate.aggregate({
      where: {
        authorId: creatorId,
        isPublic: true,
        processingStatus: 'published',
      },
      _count: { id: true },
      _avg: { averageRating: true },
      _sum: { downloadCount: true, purchaseCount: true },
    });

    return {
      ...creator,
      socialLinks: JSON.parse(creator.socialLinks || '{}'),
      stats: {
        ...creator._count,
        templates: templateStats._count.id,
        averageRating: templateStats._avg.averageRating || 0,
        totalDownloads: templateStats._sum.downloadCount || 0,
        totalPurchases: templateStats._sum.purchaseCount || 0,
      },
    };
  }

  async getCreatorTemplates(creatorId: string, options: PaginationOptions) {
    const { page, limit, sortBy } = options;
    const skip = (page - 1) * limit;

    let orderBy: any = {};
    switch (sortBy) {
      case 'recent':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'popular':
        orderBy = { downloadCount: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      default:
        orderBy = { publishedAt: 'desc' };
    }

    const [templates, total] = await Promise.all([
      prisma.marketplaceTemplate.findMany({
        where: {
          authorId: creatorId,
          isPublic: true,
          processingStatus: 'published',
        },
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              reviews: true,
              downloads: true,
              purchases: true,
              likes: true,
            },
          },
        },
      }),
      prisma.marketplaceTemplate.count({
        where: {
          authorId: creatorId,
          isPublic: true,
          processingStatus: 'published',
        },
      }),
    ]);

    return {
      templates: templates.map(template => ({
        ...template,
        genre: JSON.parse(template.genre || '[]'),
        tags: JSON.parse(template.tags || '[]'),
        stats: template._count,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async toggleCreatorFollow(creatorId: string, followerId: string) {
    if (creatorId === followerId) {
      throw new Error('Cannot follow yourself');
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!creator) {
      throw new Error('Creator not found');
    }

    const followerProfile = await prisma.creatorProfile.findUnique({
      where: { userId: followerId },
    });

    if (!followerProfile) {
      // Create follower profile if doesn't exist
      await this.createCreatorProfile(followerId);
    }

    const existingFollow = await prisma.creatorFollower.findUnique({
      where: {
        creatorId_followerId: {
          creatorId: creator.id,
          followerId: followerProfile?.id || (await this.createCreatorProfile(followerId)).id,
        },
      },
    });

    let following: boolean;

    if (existingFollow) {
      // Unfollow
      await prisma.creatorFollower.delete({
        where: { id: existingFollow.id },
      });
      following = false;
    } else {
      // Follow
      await prisma.creatorFollower.create({
        data: {
          creatorId: creator.id,
          followerId: followerProfile?.id || (await this.createCreatorProfile(followerId)).id,
        },
      });
      following = true;
    }

    // Update follower count
    const followerCount = await prisma.creatorFollower.count({
      where: { creatorId: creator.id },
    });

    await prisma.creatorProfile.update({
      where: { id: creator.id },
      data: { followerCount },
    });

    return { following, followerCount };
  }

  // COLLECTIONS

  async getCollections(filters: any, options: PaginationOptions) {
    const { page, limit, sortBy } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublic: true,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.featured) {
      where.isFeatured = true;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    let orderBy: any = {};
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { likeCount: 'desc' };
        break;
      case 'items':
        orderBy = { itemCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [collections, total] = await Promise.all([
      prisma.templateCollection.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              items: true,
              likes: true,
            },
          },
        },
      }),
      prisma.templateCollection.count({ where }),
    ]);

    return {
      collections: collections.map(collection => ({
        ...collection,
        tags: JSON.parse(collection.tags || '[]'),
        stats: collection._count,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCollectionById(collectionId: string) {
    const collection = await prisma.templateCollection.findUnique({
      where: {
        id: collectionId,
        isPublic: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            template: {
              include: {
                creator: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    reviews: true,
                    downloads: true,
                    purchases: true,
                    likes: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
            likes: true,
          },
        },
      },
    });

    if (!collection) return null;

    return {
      ...collection,
      tags: JSON.parse(collection.tags || '[]'),
      templates: collection.items.map(item => ({
        ...item.template,
        genre: JSON.parse(item.template.genre || '[]'),
        tags: JSON.parse(item.template.tags || '[]'),
        curatorNote: item.note,
        stats: item.template._count,
      })),
      stats: collection._count,
    };
  }

  async createCollection(userId: string, collectionData: CollectionData) {
    const collection = await prisma.templateCollection.create({
      data: {
        title: collectionData.title,
        description: collectionData.description,
        creatorId: userId,
        type: collectionData.type || 'user',
        isPublic: collectionData.isPublic || false,
        coverImage: collectionData.coverImage,
        tags: JSON.stringify(collectionData.tags || []),
        category: collectionData.category,
      },
    });

    return collection;
  }

  async addTemplateToCollection(collectionId: string, templateId: string, userId: string, note?: string) {
    const collection = await prisma.templateCollection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    if (collection.creatorId !== userId) {
      throw new Error('Unauthorized');
    }

    const template = await prisma.marketplaceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Check if already in collection
    const existing = await prisma.templateCollectionItem.findUnique({
      where: {
        collectionId_templateId: {
          collectionId,
          templateId,
        },
      },
    });

    if (existing) {
      throw new Error('Template already in collection');
    }

    // Get next order position
    const lastItem = await prisma.templateCollectionItem.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
    });

    const order = (lastItem?.order || 0) + 1;

    await prisma.templateCollectionItem.create({
      data: {
        collectionId,
        templateId,
        order,
        note,
      },
    });

    // Update collection item count
    const itemCount = await prisma.templateCollectionItem.count({
      where: { collectionId },
    });

    await prisma.templateCollection.update({
      where: { id: collectionId },
      data: { itemCount },
    });
  }

  // ANALYTICS AND INSIGHTS

  async getTrendingContent() {
    // Get trending templates (high engagement in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const trendingTemplates = await prisma.marketplaceTemplate.findMany({
      where: {
        isPublic: true,
        processingStatus: 'published',
        publishedAt: { gte: weekAgo },
      },
      orderBy: [
        { downloadCount: 'desc' },
        { likeCount: 'desc' },
        { averageRating: 'desc' },
      ],
      take: 10,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            downloads: true,
            purchases: true,
            likes: true,
          },
        },
      },
    });

    // Get trending creators
    const trendingCreators = await prisma.creatorProfile.findMany({
      where: {
        isVerified: true,
        publicProfile: true,
      },
      orderBy: [
        { followerCount: 'desc' },
        { totalDownloads: 'desc' },
        { averageRating: 'desc' },
      ],
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      templates: trendingTemplates.map(template => ({
        ...template,
        genre: JSON.parse(template.genre || '[]'),
        tags: JSON.parse(template.tags || '[]'),
        stats: template._count,
      })),
      creators: trendingCreators,
    };
  }

  async getMarketplaceStats() {
    const [
      totalTemplates,
      totalCreators,
      totalDownloads,
      totalRevenue,
      categoryCounts,
      genreCounts,
    ] = await Promise.all([
      prisma.marketplaceTemplate.count({
        where: { isPublic: true, processingStatus: 'published' },
      }),
      prisma.creatorProfile.count(),
      prisma.templateDownload.count(),
      prisma.templatePurchase.aggregate({
        _sum: { price: true },
      }),
      prisma.marketplaceTemplate.groupBy({
        by: ['category'],
        where: { isPublic: true, processingStatus: 'published' },
        _count: { category: true },
      }),
      // Would need custom query for genre counts since it's JSON
      Promise.resolve([]),
    ]);

    return {
      totalTemplates,
      totalCreators,
      totalDownloads,
      totalRevenue: totalRevenue._sum.price || 0,
      categoryBreakdown: categoryCounts,
      genreBreakdown: genreCounts,
    };
  }

  // USER LIBRARY FUNCTIONS

  async getUserPurchases(userId: string, options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.templatePurchase.findMany({
        where: { purchaserId: userId },
        orderBy: { purchasedAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      prisma.templatePurchase.count({ where: { purchaserId: userId } }),
    ]);

    return {
      purchases: purchases.map(purchase => ({
        ...purchase,
        template: {
          ...purchase.template,
          genre: JSON.parse(purchase.template.genre || '[]'),
          tags: JSON.parse(purchase.template.tags || '[]'),
        },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDownloads(userId: string, options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [downloads, total] = await Promise.all([
      prisma.templateDownload.findMany({
        where: { downloaderId: userId },
        orderBy: { downloadedAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      prisma.templateDownload.count({ where: { downloaderId: userId } }),
    ]);

    return {
      downloads: downloads.map(download => ({
        ...download,
        template: {
          ...download.template,
          genre: JSON.parse(download.template.genre || '[]'),
          tags: JSON.parse(download.template.tags || '[]'),
        },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserLikes(userId: string, options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      prisma.templateLike.findMany({
        where: { userId },
        orderBy: { likedAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  reviews: true,
                  downloads: true,
                  purchases: true,
                  likes: true,
                },
              },
            },
          },
        },
      }),
      prisma.templateLike.count({ where: { userId } }),
    ]);

    return {
      likes: likes.map(like => ({
        ...like,
        template: {
          ...like.template,
          genre: JSON.parse(like.template.genre || '[]'),
          tags: JSON.parse(like.template.tags || '[]'),
          stats: like.template._count,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserCollections(userId: string, options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.templateCollection.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              items: true,
              likes: true,
            },
          },
        },
      }),
      prisma.templateCollection.count({ where: { creatorId: userId } }),
    ]);

    return {
      collections: collections.map(collection => ({
        ...collection,
        tags: JSON.parse(collection.tags || '[]'),
        stats: collection._count,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // UTILITY METHODS

  private async trackTemplateView(templateId: string, userId?: string) {
    // Update view count
    await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: {
        viewCount: { increment: 1 },
      },
    });

    // Track analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.templateAnalytics.upsert({
      where: {
        templateId_date: {
          templateId,
          date: today,
        },
      },
      update: {
        views: { increment: 1 },
      },
      create: {
        templateId,
        date: today,
        views: 1,
      },
    });
  }

  private async updateTemplateStats(templateId: string, stats: any) {
    await prisma.marketplaceTemplate.update({
      where: { id: templateId },
      data: stats,
    });
  }

  private async updateTemplateRating(templateId: string) {
    const reviews = await prisma.templateReview.findMany({
      where: { templateId },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await prisma.marketplaceTemplate.update({
        where: { id: templateId },
        data: {
          averageRating,
          reviewCount: reviews.length,
        },
      });
    }
  }

  private async recordCreatorRevenue(creatorId: string, amount: number, templateId: string) {
    const feeAmount = amount * 0.3; // 30% platform fee
    const netAmount = amount - feeAmount;

    await prisma.creatorRevenue.create({
      data: {
        creatorId,
        amount: netAmount,
        source: 'template_sale',
        templateId,
        grossAmount: amount,
        feeAmount,
        netAmount,
      },
    });
  }

  private async createCreatorProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profile = await prisma.creatorProfile.create({
      data: {
        userId,
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      },
    });

    return profile;
  }

  private calculateQualityScore(submission: any): number {
    let score = 0;
    
    if (submission.hasPreview) score += 20;
    if (submission.hasDescription) score += 20;
    if (submission.hasMetadata) score += 20;
    if (submission.isFormatValid) score += 20;
    if (submission.isContentOriginal) score += 20;

    return score;
  }

  private async approveTemplate(submissionId: string) {
    const submission = await prisma.templateSubmission.findUnique({
      where: { id: submissionId },
      include: { submitter: true },
    });

    if (!submission) return;

    // Create marketplace template
    await prisma.marketplaceTemplate.create({
      data: {
        title: submission.title,
        description: submission.description,
        authorId: submission.submitterId,
        author: `${submission.submitter.firstName || ''} ${submission.submitter.lastName || ''}`.trim() || submission.submitter.username,
        templateData: submission.templateData,
        category: submission.category,
        licenseType: submission.licenseType,
        price: submission.requestedPrice,
        isPublic: true,
        processingStatus: 'published',
        publishedAt: new Date(),
      },
    });

    // Update submission status
    await prisma.templateSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
      },
    });
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private updateChangeLog(currentLog: string, change: string): string {
    const log = JSON.parse(currentLog || '[]');
    log.unshift({
      date: new Date().toISOString(),
      change,
    });
    return JSON.stringify(log.slice(0, 10)); // Keep last 10 changes
  }

  private generateLicenseKey(): string {
    return 'LICENSE-' + Math.random().toString(36).substring(2, 15).toUpperCase();
  }
}

export const marketplaceService = new MarketplaceService();