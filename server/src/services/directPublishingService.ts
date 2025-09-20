/**
 * Direct Publishing Service
 * Handles one-click publishing to major platforms like Amazon KDP,
 * IngramSpark, Apple Books, and other distribution channels
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PublishingPlatformConfig {
  name: string;
  type: 'ebook' | 'print' | 'audio' | 'distribution';
  apiBaseUrl?: string;
  authType?: 'oauth' | 'api_key' | 'basic';
  regions: string[];
  formats: string[];
  royaltyRates: Record<string, number>;
  requirements: {
    minWordCount?: number;
    maxWordCount?: number;
    requiredFormats: string[];
    coverRequirements: {
      minWidth: number;
      minHeight: number;
      maxFileSize: number;
      acceptedFormats: string[];
    };
    contentGuidelines: string[];
  };
}

export interface PublicationData {
  publishingProjectId: string;
  platformId: string;
  title: string;
  description: string;
  price: number;
  categories: string[];
  keywords: string[];
  manuscriptUrl?: string;
  coverUrl?: string;
  preOrderDate?: Date;
  publishDate?: Date;
}

export interface PublishingStatus {
  platformId: string;
  platformName: string;
  status: 'draft' | 'submitted' | 'under_review' | 'published' | 'rejected';
  platformBookId?: string;
  publishedAt?: Date;
  lastSyncAt?: Date;
  salesUrl?: string;
  dashboardUrl?: string;
  errorMessage?: string;
}

export interface SalesReport {
  platform: string;
  period: string;
  unitsSold: number;
  grossRevenue: number;
  royaltiesEarned: number;
  returns: number;
  pageReads?: number; // For KDP Unlimited
  averageRating?: number;
  newReviews: number;
}

export class DirectPublishingService {

  /**
   * Initialize platform configurations
   */
  async initializePlatforms() {
    const platforms: PublishingPlatformConfig[] = [
      {
        name: 'Amazon KDP',
        type: 'ebook',
        apiBaseUrl: 'https://kdp.amazon.com/api/v1',
        authType: 'oauth',
        regions: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'JP', 'BR', 'MX', 'IN'],
        formats: ['MOBI', 'EPUB', 'PDF'],
        royaltyRates: {
          '35%': 0.35,
          '70%': 0.70
        },
        requirements: {
          minWordCount: 2500,
          requiredFormats: ['MOBI', 'EPUB'],
          coverRequirements: {
            minWidth: 1600,
            minHeight: 2560,
            maxFileSize: 50 * 1024 * 1024, // 50MB
            acceptedFormats: ['JPEG', 'PNG', 'TIFF']
          },
          contentGuidelines: [
            'No copyrighted material without permission',
            'Must meet community guidelines',
            'Professional quality expected',
            'Complete and properly formatted'
          ]
        }
      },
      {
        name: 'IngramSpark',
        type: 'print',
        apiBaseUrl: 'https://api.ingramspark.com/v1',
        authType: 'api_key',
        regions: ['Worldwide'],
        formats: ['PDF'],
        royaltyRates: {
          'standard': 0.55
        },
        requirements: {
          minWordCount: 24, // pages, not words
          requiredFormats: ['PDF'],
          coverRequirements: {
            minWidth: 2100,
            minHeight: 2700,
            maxFileSize: 100 * 1024 * 1024, // 100MB
            acceptedFormats: ['PDF']
          },
          contentGuidelines: [
            'Print-ready PDF with bleeds',
            'Minimum 24 pages',
            'Professional formatting required',
            'Spine calculation must be accurate'
          ]
        }
      },
      {
        name: 'Apple Books',
        type: 'ebook',
        apiBaseUrl: 'https://itunesconnect.apple.com/WebObjects/iTunesConnect.woa/ra/apps/version/deliverable/upload',
        authType: 'oauth',
        regions: ['US', 'UK', 'CA', 'AU', 'EU', 'JP'],
        formats: ['EPUB'],
        royaltyRates: {
          'standard': 0.70
        },
        requirements: {
          requiredFormats: ['EPUB'],
          coverRequirements: {
            minWidth: 1400,
            minHeight: 1400,
            maxFileSize: 20 * 1024 * 1024, // 20MB
            acceptedFormats: ['JPEG', 'PNG']
          },
          contentGuidelines: [
            'EPUB must validate against Apple standards',
            'No DRM restrictions',
            'Professional quality required'
          ]
        }
      },
      {
        name: 'Kobo',
        type: 'ebook',
        regions: ['Worldwide'],
        formats: ['EPUB'],
        royaltyRates: {
          'standard': 0.70
        },
        requirements: {
          requiredFormats: ['EPUB'],
          coverRequirements: {
            minWidth: 1600,
            minHeight: 2400,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            acceptedFormats: ['JPEG', 'PNG']
          },
          contentGuidelines: [
            'EPUB 2.0 or 3.0 compatible',
            'Professional editing expected'
          ]
        }
      },
      {
        name: 'Draft2Digital',
        type: 'distribution',
        regions: ['Worldwide'],
        formats: ['DOCX', 'EPUB'],
        royaltyRates: {
          'standard': 0.60 // After D2D's cut
        },
        requirements: {
          requiredFormats: ['DOCX', 'EPUB'],
          coverRequirements: {
            minWidth: 1600,
            minHeight: 2400,
            maxFileSize: 10 * 1024 * 1024,
            acceptedFormats: ['JPEG', 'PNG']
          },
          contentGuidelines: [
            'Distributes to multiple retailers',
            'Professional formatting recommended'
          ]
        }
      }
    ];

    // Upsert platform configurations
    for (const platform of platforms) {
      await prisma.publishingPlatform.upsert({
        where: { name: platform.name },
        update: {
          type: platform.type,
          hasApi: !!platform.apiBaseUrl,
          apiBaseUrl: platform.apiBaseUrl,
          authType: platform.authType,
          regions: JSON.stringify(platform.regions),
          formats: JSON.stringify(platform.formats),
          royaltyRates: JSON.stringify(platform.royaltyRates),
          requirements: JSON.stringify(platform.requirements)
        },
        create: {
          name: platform.name,
          type: platform.type,
          hasApi: !!platform.apiBaseUrl,
          apiBaseUrl: platform.apiBaseUrl,
          authType: platform.authType,
          regions: JSON.stringify(platform.regions),
          formats: JSON.stringify(platform.formats),
          royaltyRates: JSON.stringify(platform.royaltyRates),
          requirements: JSON.stringify(platform.requirements),
          isActive: true
        }
      });
    }

    return platforms;
  }

  /**
   * Publish to a specific platform
   */
  async publishToPlatform(data: PublicationData) {
    const platform = await prisma.publishingPlatform.findUnique({
      where: { id: data.platformId }
    });

    if (!platform) {
      throw new Error('Platform not found');
    }

    const project = await prisma.publishingProject.findUnique({
      where: { id: data.publishingProjectId },
      include: {
        manuscripts: {
          where: { isFinalized: true },
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!project) {
      throw new Error('Publishing project not found');
    }

    if (!project.manuscripts.length) {
      throw new Error('No finalized manuscript found');
    }

    // Validate publication data against platform requirements
    const validation = await this.validateForPlatform(data, platform, project);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Create direct publication record
    const publication = await prisma.directPublication.create({
      data: {
        publishingProjectId: data.publishingProjectId,
        platformId: data.platformId,
        title: data.title,
        description: data.description,
        price: data.price,
        categories: JSON.stringify(data.categories),
        keywords: JSON.stringify(data.keywords),
        manuscriptUrl: data.manuscriptUrl,
        coverUrl: data.coverUrl,
        status: 'draft'
      }
    });

    // Submit to platform (in real implementation, this would use actual APIs)
    const submissionResult = await this.submitToPlatform(publication, platform, project);

    // Update publication with submission result
    await prisma.directPublication.update({
      where: { id: publication.id },
      data: {
        status: submissionResult.status,
        platformBookId: submissionResult.platformBookId,
        platformResponse: JSON.stringify(submissionResult.response),
        errorMessage: submissionResult.error,
        lastSyncAt: new Date()
      }
    });

    return {
      publicationId: publication.id,
      status: submissionResult.status,
      platformBookId: submissionResult.platformBookId,
      estimatedReviewTime: submissionResult.estimatedReviewTime,
      nextSteps: submissionResult.nextSteps
    };
  }

  /**
   * Bulk publish to multiple platforms
   */
  async bulkPublish(
    publishingProjectId: string,
    platformIds: string[],
    commonData: Omit<PublicationData, 'publishingProjectId' | 'platformId'>
  ) {
    const results = [];

    for (const platformId of platformIds) {
      try {
        const result = await this.publishToPlatform({
          ...commonData,
          publishingProjectId,
          platformId
        });
        results.push({ platformId, success: true, result });
      } catch (error) {
        results.push({ 
          platformId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  /**
   * Get publishing status across all platforms
   */
  async getPublishingStatus(publishingProjectId: string): Promise<PublishingStatus[]> {
    const publications = await prisma.directPublication.findMany({
      where: { publishingProjectId },
      include: { platform: true }
    });

    return publications.map(pub => ({
      platformId: pub.platformId,
      platformName: pub.platform.name,
      status: pub.status as PublishingStatus['status'],
      platformBookId: pub.platformBookId || undefined,
      publishedAt: pub.publishedAt || undefined,
      lastSyncAt: pub.lastSyncAt || undefined,
      salesUrl: this.generateSalesUrl(pub.platform.name, pub.platformBookId),
      dashboardUrl: this.generateDashboardUrl(pub.platform.name),
      errorMessage: pub.errorMessage || undefined
    }));
  }

  /**
   * Sync sales data from platforms
   */
  async syncSalesData(publishingProjectId: string) {
    const publications = await prisma.directPublication.findMany({
      where: { 
        publishingProjectId,
        status: 'published'
      },
      include: { platform: true }
    });

    const salesReports: SalesReport[] = [];

    for (const publication of publications) {
      try {
        // In real implementation, this would call actual platform APIs
        const salesData = await this.fetchSalesDataFromPlatform(publication);
        
        if (salesData) {
          // Store in database
          await prisma.salesData.create({
            data: {
              publishingProjectId,
              date: new Date(),
              platform: publication.platform.name,
              format: 'ebook', // Would be determined by platform type
              unitsSold: salesData.unitsSold,
              grossRevenue: salesData.grossRevenue,
              netRevenue: salesData.grossRevenue * 0.7, // Example calculation
              royaltiesEarned: salesData.royaltiesEarned,
              rank: salesData.rank,
              reviews: salesData.newReviews,
              averageRating: salesData.averageRating || 0
            }
          });

          salesReports.push({
            platform: publication.platform.name,
            period: 'last_30_days',
            unitsSold: salesData.unitsSold,
            grossRevenue: salesData.grossRevenue,
            royaltiesEarned: salesData.royaltiesEarned,
            returns: salesData.returns || 0,
            pageReads: salesData.pageReads,
            averageRating: salesData.averageRating,
            newReviews: salesData.newReviews
          });
        }
      } catch (error) {
        console.error(`Failed to sync sales data for ${publication.platform.name}:`, error);
      }
    }

    return salesReports;
  }

  /**
   * Generate platform-optimized metadata
   */
  generatePlatformMetadata(platform: string, project: any) {
    const baseMetadata = {
      title: project.title,
      description: project.description,
      keywords: JSON.parse(project.keywords || '[]'),
      categories: JSON.parse(project.genre || '[]')
    };

    switch (platform) {
      case 'Amazon KDP':
        return {
          ...baseMetadata,
          description: this.optimizeForKDP(baseMetadata.description),
          keywords: baseMetadata.keywords.slice(0, 7), // KDP limit
          categories: this.mapToKDPCategories(baseMetadata.categories),
          bisac: this.generateBISACCodes(baseMetadata.categories)
        };
      
      case 'Apple Books':
        return {
          ...baseMetadata,
          description: this.optimizeForApple(baseMetadata.description),
          categories: this.mapToAppleCategories(baseMetadata.categories)
        };
      
      case 'IngramSpark':
        return {
          ...baseMetadata,
          bisac: this.generateBISACCodes(baseMetadata.categories),
          spine: this.calculateSpineWidth(project.pageCount),
          printSpecifications: this.generatePrintSpecs(project)
        };
      
      default:
        return baseMetadata;
    }
  }

  /**
   * Get platform-specific pricing recommendations
   */
  getPricingRecommendations(genre: string[], wordCount: number, platform: string) {
    const basePrice = this.calculateBasePrice(genre, wordCount);
    
    const platformMultipliers = {
      'Amazon KDP': 1.0,
      'Apple Books': 1.1,
      'Kobo': 0.95,
      'Draft2Digital': 1.0,
      'IngramSpark': 2.5 // Print books
    };

    const multiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0;
    const recommendedPrice = Math.round(basePrice * multiplier * 100) / 100;

    return {
      recommendedPrice,
      range: {
        min: Math.round(recommendedPrice * 0.8 * 100) / 100,
        max: Math.round(recommendedPrice * 1.2 * 100) / 100
      },
      reasoning: this.getPricingReasoning(genre, wordCount, platform)
    };
  }

  /**
   * Validate publication data against platform requirements
   */
  private async validateForPlatform(
    data: PublicationData,
    platform: any,
    project: any
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requirements = JSON.parse(platform.requirements || '{}');

    // Validate word count
    if (requirements.minWordCount && project.wordCount < requirements.minWordCount) {
      errors.push(`Word count ${project.wordCount} below minimum ${requirements.minWordCount}`);
    }
    if (requirements.maxWordCount && project.wordCount > requirements.maxWordCount) {
      errors.push(`Word count ${project.wordCount} exceeds maximum ${requirements.maxWordCount}`);
    }

    // Validate title
    if (!data.title || data.title.length < 1) {
      errors.push('Title is required');
    }
    if (data.title && data.title.length > 200) {
      warnings.push('Title may be too long for some platforms');
    }

    // Validate description
    if (!data.description || data.description.length < 50) {
      warnings.push('Description should be at least 50 characters for better discoverability');
    }
    if (data.description && data.description.length > 4000) {
      warnings.push('Description may be truncated on some platforms');
    }

    // Validate price
    if (data.price < 0.99) {
      warnings.push('Price below $0.99 may not be eligible for 70% royalty rate on some platforms');
    }

    // Validate categories
    if (!data.categories || data.categories.length === 0) {
      errors.push('At least one category is required');
    }

    // Validate keywords
    if (!data.keywords || data.keywords.length === 0) {
      warnings.push('Keywords help with discoverability');
    }

    // Validate cover image
    if (!data.coverUrl) {
      errors.push('Cover image is required');
    }

    // Validate manuscript
    if (!data.manuscriptUrl) {
      errors.push('Manuscript file is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Submit to platform (simulated)
   */
  private async submitToPlatform(publication: any, platform: any, project: any) {
    // In real implementation, this would make actual API calls
    
    const simulatedResponse = {
      status: 'submitted' as const,
      platformBookId: this.generatePlatformBookId(platform.name),
      response: {
        submissionId: Math.random().toString(36).substr(2, 9),
        estimatedReviewTime: this.getEstimatedReviewTime(platform.name),
        submittedAt: new Date().toISOString()
      },
      estimatedReviewTime: this.getEstimatedReviewTime(platform.name),
      nextSteps: this.getNextSteps(platform.name)
    };

    // Simulate random approval/rejection for demo
    if (Math.random() > 0.8) {
      return {
        ...simulatedResponse,
        status: 'rejected' as const,
        error: 'Content does not meet platform guidelines'
      };
    }

    return simulatedResponse;
  }

  /**
   * Fetch sales data from platform (simulated)
   */
  private async fetchSalesDataFromPlatform(publication: any) {
    // In real implementation, this would call platform APIs
    return {
      unitsSold: Math.floor(Math.random() * 100),
      grossRevenue: Math.floor(Math.random() * 1000),
      royaltiesEarned: Math.floor(Math.random() * 700),
      returns: Math.floor(Math.random() * 5),
      pageReads: Math.floor(Math.random() * 10000),
      averageRating: 3.5 + Math.random() * 1.5,
      newReviews: Math.floor(Math.random() * 10),
      rank: Math.floor(Math.random() * 100000) + 1000
    };
  }

  /**
   * Helper methods for platform-specific optimizations
   */
  private optimizeForKDP(description: string): string {
    // Optimize description for Amazon's algorithm
    return description.length > 4000 ? description.substring(0, 3997) + '...' : description;
  }

  private optimizeForApple(description: string): string {
    // Apple Books optimization
    return description;
  }

  private mapToKDPCategories(genres: string[]): string[] {
    const kdpMapping: Record<string, string> = {
      'fantasy': 'Fiction > Fantasy > Epic',
      'romance': 'Fiction > Romance > Contemporary',
      'mystery': 'Fiction > Mystery > Cozy Mystery',
      'thriller': 'Fiction > Thrillers > Psychological',
      'science fiction': 'Fiction > Science Fiction > Space Opera',
      'literary': 'Fiction > Literary Fiction'
    };

    return genres.map(genre => kdpMapping[genre.toLowerCase()] || `Fiction > ${genre}`);
  }

  private mapToAppleCategories(genres: string[]): string[] {
    // Similar mapping for Apple Books
    return genres;
  }

  private generateBISACCodes(genres: string[]): string[] {
    const bisacMapping: Record<string, string> = {
      'fantasy': 'FIC009000',
      'romance': 'FIC027000',
      'mystery': 'FIC022000',
      'thriller': 'FIC031000',
      'science fiction': 'FIC028000',
      'literary': 'FIC019000'
    };

    return genres.map(genre => bisacMapping[genre.toLowerCase()] || 'FIC000000');
  }

  private calculateSpineWidth(pageCount: number): number {
    // Standard calculation: pages * paper thickness + cover
    return pageCount * 0.002252 + 0.06; // inches
  }

  private generatePrintSpecs(project: any) {
    return {
      trimSize: '6x9',
      paperType: 'white',
      binding: 'perfectbound',
      lamination: 'matte'
    };
  }

  private calculateBasePrice(genres: string[], wordCount: number): number {
    let basePrice = 2.99; // Starting price

    // Genre adjustments
    if (genres.includes('literary')) basePrice += 2.00;
    if (genres.includes('fantasy') || genres.includes('science fiction')) basePrice += 1.00;
    
    // Length adjustments
    if (wordCount > 100000) basePrice += 1.00;
    if (wordCount > 150000) basePrice += 1.00;

    return Math.min(basePrice, 9.99); // Cap at reasonable price
  }

  private getPricingReasoning(genres: string[], wordCount: number, platform: string): string {
    return `Based on ${genres.join(', ')} genre(s), ${wordCount.toLocaleString()} words, and ${platform} market standards.`;
  }

  private generatePlatformBookId(platformName: string): string {
    const prefixes: Record<string, string> = {
      'Amazon KDP': 'B0',
      'Apple Books': 'id',
      'Kobo': 'kobo.',
      'IngramSpark': 'IS'
    };

    const prefix = prefixes[platformName] || 'PUB';
    const id = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${prefix}${id}`;
  }

  private getEstimatedReviewTime(platformName: string): string {
    const times: Record<string, string> = {
      'Amazon KDP': '24-72 hours',
      'Apple Books': '1-7 days',
      'Kobo': '1-3 days',
      'IngramSpark': '3-5 business days',
      'Draft2Digital': '24-48 hours'
    };

    return times[platformName] || '1-3 days';
  }

  private getNextSteps(platformName: string): string[] {
    const steps: Record<string, string[]> = {
      'Amazon KDP': [
        'Monitor your KDP dashboard for review status',
        'Prepare marketing materials for launch',
        'Set up advertising campaigns if desired'
      ],
      'Apple Books': [
        'Check iTunes Connect for status updates',
        'Prepare for potential metadata requests',
        'Plan promotional activities'
      ],
      'IngramSpark': [
        'Review proof copy when available',
        'Approve for distribution',
        'Set up retail availability'
      ]
    };

    return steps[platformName] || [
      'Monitor platform dashboard',
      'Prepare marketing materials',
      'Plan launch activities'
    ];
  }

  private generateSalesUrl(platformName: string, bookId?: string): string | undefined {
    if (!bookId) return undefined;

    const urlTemplates: Record<string, string> = {
      'Amazon KDP': `https://amazon.com/dp/${bookId}`,
      'Apple Books': `https://books.apple.com/book/${bookId}`,
      'Kobo': `https://kobo.com/ebook/${bookId}`
    };

    return urlTemplates[platformName];
  }

  private generateDashboardUrl(platformName: string): string | undefined {
    const dashboardUrls: Record<string, string> = {
      'Amazon KDP': 'https://kdp.amazon.com',
      'Apple Books': 'https://itunesconnect.apple.com',
      'Kobo': 'https://kobo.com/writinglife',
      'IngramSpark': 'https://portal.ingramspark.com',
      'Draft2Digital': 'https://draft2digital.com'
    };

    return dashboardUrls[platformName];
  }
}

export default new DirectPublishingService();