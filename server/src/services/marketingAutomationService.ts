/**
 * Marketing Automation Service
 * Handles book launch campaigns, social media scheduling,
 * email marketing, and promotional analytics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CampaignData {
  publishingProjectId: string;
  name: string;
  description?: string;
  campaignType: 'pre_launch' | 'launch' | 'ongoing' | 'seasonal';
  startDate: Date;
  endDate?: Date;
  channels: string[];
  budget: number;
  targetReach: number;
  targetSales: number;
}

export interface ActivityData {
  campaignId: string;
  title: string;
  description?: string;
  type: 'social_post' | 'email_blast' | 'ad_campaign' | 'interview' | 'event' | 'blog_post' | 'review_outreach';
  platform?: string;
  scheduledAt: Date;
  content?: string;
  mediaUrls?: string[];
  cost?: number;
}

export interface LaunchCampaignTemplate {
  name: string;
  duration: number; // days
  activities: Array<{
    day: number;
    type: string;
    title: string;
    description: string;
    platform?: string;
  }>;
}

export interface MarketingAnalytics {
  campaignPerformance: Array<{
    campaignId: string;
    name: string;
    reach: number;
    engagement: number;
    conversions: number;
    roi: number;
    status: string;
  }>;
  channelPerformance: Record<string, {
    reach: number;
    engagement: number;
    conversions: number;
    cost: number;
  }>;
  contentPerformance: Array<{
    activityId: string;
    title: string;
    type: string;
    platform: string;
    reach: number;
    engagement: number;
    engagementRate: number;
  }>;
  audienceInsights: {
    demographics: Record<string, number>;
    interests: string[];
    bestPostingTimes: string[];
    topPerformingContent: string[];
  };
}

export class MarketingAutomationService {

  /**
   * Create a new marketing campaign
   */
  async createCampaign(data: CampaignData) {
    const campaign = await prisma.marketingCampaign.create({
      data: {
        publishingProjectId: data.publishingProjectId,
        name: data.name,
        description: data.description,
        campaignType: data.campaignType,
        startDate: data.startDate,
        endDate: data.endDate,
        channels: JSON.stringify(data.channels),
        budget: data.budget,
        targetReach: data.targetReach,
        targetSales: data.targetSales,
        status: 'planning'
      },
      include: {
        publishingProject: true
      }
    });

    return campaign;
  }

  /**
   * Create campaign from template
   */
  async createCampaignFromTemplate(
    publishingProjectId: string,
    templateName: string,
    launchDate: Date
  ) {
    const template = this.getLaunchCampaignTemplate(templateName);
    
    const campaign = await this.createCampaign({
      publishingProjectId,
      name: `${template.name} - Book Launch`,
      description: `Automated ${template.name.toLowerCase()} campaign`,
      campaignType: 'launch',
      startDate: new Date(launchDate.getTime() - (template.duration * 24 * 60 * 60 * 1000)), // Start before launch
      endDate: new Date(launchDate.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days post-launch
      channels: ['social_media', 'email', 'blog'],
      budget: 1000,
      targetReach: 10000,
      targetSales: 100
    });

    // Create activities from template
    for (const activity of template.activities) {
      const scheduledDate = new Date(launchDate.getTime() + (activity.day * 24 * 60 * 60 * 1000));
      
      await this.createActivity({
        campaignId: campaign.id,
        title: activity.title,
        description: activity.description,
        type: activity.type as any,
        platform: activity.platform,
        scheduledAt: scheduledDate,
        cost: 0
      });
    }

    return campaign;
  }

  /**
   * Create a marketing activity
   */
  async createActivity(data: ActivityData) {
    const activity = await prisma.marketingActivity.create({
      data: {
        campaignId: data.campaignId,
        title: data.title,
        description: data.description,
        type: data.type,
        platform: data.platform,
        scheduledAt: data.scheduledAt,
        content: data.content,
        mediaUrls: JSON.stringify(data.mediaUrls || []),
        cost: data.cost || 0,
        status: 'scheduled'
      }
    });

    return activity;
  }

  /**
   * Schedule social media posts
   */
  async scheduleSocialMediaPost(
    campaignId: string,
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok',
    content: string,
    scheduledAt: Date,
    mediaUrls?: string[]
  ) {
    const optimizedContent = this.optimizeContentForPlatform(content, platform);
    
    return await this.createActivity({
      campaignId,
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
      type: 'social_post',
      platform,
      scheduledAt,
      content: optimizedContent,
      mediaUrls
    });
  }

  /**
   * Create email marketing campaign
   */
  async createEmailCampaign(
    campaignId: string,
    subject: string,
    content: string,
    recipientList: string,
    scheduledAt: Date
  ) {
    return await this.createActivity({
      campaignId,
      title: `Email: ${subject}`,
      description: `Email to ${recipientList}`,
      type: 'email_blast',
      scheduledAt,
      content: JSON.stringify({
        subject,
        body: content,
        recipientList
      })
    });
  }

  /**
   * Generate press kit
   */
  async generatePressKit(publishingProjectId: string): Promise<{
    url: string;
    contents: string[];
  }> {
    const project = await prisma.publishingProject.findUnique({
      where: { id: publishingProjectId },
      include: {
        author: true,
        manuscripts: true
      }
    });

    if (!project) {
      throw new Error('Publishing project not found');
    }

    const pressKitContents = [
      'Author Biography',
      'Book Summary',
      'Author Photos (High Resolution)',
      'Book Cover (High Resolution)',
      'Excerpt/Sample Chapter',
      'Interview Questions',
      'Review Quotes',
      'Fact Sheet',
      'Contact Information'
    ];

    // In a real implementation, this would generate actual files
    const pressKitUrl = `/press-kits/${publishingProjectId}/press-kit.zip`;

    // Update campaign with press kit URL
    const activeCampaigns = await prisma.marketingCampaign.findMany({
      where: {
        publishingProjectId,
        status: { in: ['planning', 'active'] }
      }
    });

    for (const campaign of activeCampaigns) {
      await prisma.marketingCampaign.update({
        where: { id: campaign.id },
        data: { pressKit: pressKitUrl }
      });
    }

    return {
      url: pressKitUrl,
      contents: pressKitContents
    };
  }

  /**
   * Track review outreach
   */
  async trackReviewOutreach(
    campaignId: string,
    reviewers: Array<{
      name: string;
      publication: string;
      email: string;
      genre: string;
      circulation?: number;
    }>
  ) {
    const activities = [];

    for (const reviewer of reviewers) {
      const activity = await this.createActivity({
        campaignId,
        title: `Review Request: ${reviewer.publication}`,
        description: `ARC request to ${reviewer.name} at ${reviewer.publication}`,
        type: 'review_outreach',
        platform: reviewer.publication,
        scheduledAt: new Date(),
        content: JSON.stringify({
          reviewerName: reviewer.name,
          publication: reviewer.publication,
          email: reviewer.email,
          genre: reviewer.genre,
          circulation: reviewer.circulation
        })
      });

      activities.push(activity);
    }

    return activities;
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        activities: true,
        publishingProject: {
          include: {
            salesData: true
          }
        }
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const totalReach = campaign.activities.reduce((sum, activity) => sum + activity.reach, 0);
    const totalEngagement = campaign.activities.reduce((sum, activity) => sum + activity.engagement, 0);
    const totalConversions = campaign.activities.reduce((sum, activity) => sum + activity.conversions, 0);
    const totalCost = campaign.activities.reduce((sum, activity) => sum + activity.cost, 0);

    const roi = totalCost > 0 ? ((totalConversions * 10) - totalCost) / totalCost * 100 : 0; // Assuming $10 per conversion

    return {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      performance: {
        reach: totalReach,
        engagement: totalEngagement,
        conversions: totalConversions,
        cost: totalCost,
        roi,
        engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0,
        conversionRate: totalReach > 0 ? (totalConversions / totalReach) * 100 : 0
      },
      activities: campaign.activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        type: activity.type,
        platform: activity.platform,
        scheduledAt: activity.scheduledAt,
        completedAt: activity.completedAt,
        status: activity.status,
        reach: activity.reach,
        engagement: activity.engagement,
        conversions: activity.conversions,
        cost: activity.cost,
        engagementRate: activity.reach > 0 ? (activity.engagement / activity.reach) * 100 : 0
      })),
      timeline: this.generateCampaignTimeline(campaign.activities)
    };
  }

  /**
   * Get marketing analytics overview
   */
  async getMarketingAnalytics(authorId: string): Promise<MarketingAnalytics> {
    const campaigns = await prisma.marketingCampaign.findMany({
      where: {
        publishingProject: {
          authorId
        }
      },
      include: {
        activities: true
      }
    });

    const campaignPerformance = campaigns.map(campaign => {
      const totalReach = campaign.activities.reduce((sum, activity) => sum + activity.reach, 0);
      const totalEngagement = campaign.activities.reduce((sum, activity) => sum + activity.engagement, 0);
      const totalConversions = campaign.activities.reduce((sum, activity) => sum + activity.conversions, 0);
      const totalCost = campaign.activities.reduce((sum, activity) => sum + activity.cost, 0);
      const roi = totalCost > 0 ? ((totalConversions * 10) - totalCost) / totalCost * 100 : 0;

      return {
        campaignId: campaign.id,
        name: campaign.name,
        reach: totalReach,
        engagement: totalEngagement,
        conversions: totalConversions,
        roi,
        status: campaign.status
      };
    });

    // Channel performance
    const channelPerformance = this.calculateChannelPerformance(campaigns);

    // Content performance
    const allActivities = campaigns.flatMap(c => c.activities);
    const contentPerformance = allActivities
      .filter(activity => activity.reach > 0)
      .map(activity => ({
        activityId: activity.id,
        title: activity.title,
        type: activity.type,
        platform: activity.platform || 'unknown',
        reach: activity.reach,
        engagement: activity.engagement,
        engagementRate: activity.reach > 0 ? (activity.engagement / activity.reach) * 100 : 0
      }))
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 20);

    return {
      campaignPerformance,
      channelPerformance,
      contentPerformance,
      audienceInsights: {
        demographics: {
          '18-24': 15,
          '25-34': 35,
          '35-44': 30,
          '45-54': 15,
          '55+': 5
        },
        interests: ['Reading', 'Writing', 'Books', 'Literature', 'Fiction'],
        bestPostingTimes: ['9:00 AM', '12:00 PM', '6:00 PM', '8:00 PM'],
        topPerformingContent: ['Behind the scenes', 'Book quotes', 'Author insights', 'Reading recommendations']
      }
    };
  }

  /**
   * Auto-generate marketing content
   */
  generateMarketingContent(type: string, bookInfo: any): string {
    const templates = {
      'social_announcement': [
        `🚨 BIG NEWS! My new book "${bookInfo.title}" is now available! ${bookInfo.genre} lovers, this one's for you! 📚✨ #NewBookAlert #${bookInfo.genre}`,
        `The wait is over! "${bookInfo.title}" is officially here! Thank you to everyone who has supported this journey. Available now! 🎉📖`,
        `Dreams do come true! My book "${bookInfo.title}" is live and ready for readers. Who's excited to dive in? 🌟 #AuthorLife #BookLaunch`
      ],
      'countdown_post': [
        `Only ${bookInfo.daysUntilLaunch} days until "${bookInfo.title}" hits the shelves! Who's counting down with me? 📅✨`,
        `T-minus ${bookInfo.daysUntilLaunch} days! The anticipation is real. "${bookInfo.title}" is almost here! 🚀`,
        `${bookInfo.daysUntilLaunch} more sleeps until "${bookInfo.title}" is in your hands! The excitement is building! 😍📚`
      ],
      'behind_scenes': [
        `Writing "${bookInfo.title}" was a journey of ${bookInfo.timeToWrite}. Here's what inspired this story... [Add personal anecdote]`,
        `Fun fact about "${bookInfo.title}": [Share interesting detail about the writing process or inspiration]`,
        `The real story behind "${bookInfo.title}" started when... [Share origin story]`
      ],
      'review_request': [
        `If you've read "${bookInfo.title}", I'd be incredibly grateful for an honest review! Every review helps other readers discover the book. 🙏`,
        `Calling all readers! If "${bookInfo.title}" touched your heart, would you consider leaving a review? It means the world to authors! ❤️`,
        `Your voice matters! If you enjoyed "${bookInfo.title}", sharing a review helps other book lovers find their next great read! 📝`
      ],
      'quote_post': [
        `"${bookInfo.favoriteQuote}" - From my new book "${bookInfo.title}" 📖✨`,
        `This line from "${bookInfo.title}" gives me chills every time: "${bookInfo.favoriteQuote}"`,
        `Words from "${bookInfo.title}" that I hope resonate with you: "${bookInfo.favoriteQuote}"`
      ]
    };

    const options = templates[type as keyof typeof templates] || [];
    return options[Math.floor(Math.random() * options.length)] || 'Check out my new book!';
  }

  /**
   * Get launch campaign templates
   */
  getLaunchCampaignTemplate(templateName: string): LaunchCampaignTemplate {
    const templates = {
      '30_day_launch': {
        name: '30-Day Book Launch',
        duration: 60, // 30 days pre + 30 days post
        activities: [
          { day: -30, type: 'social_post', title: 'Announce Book Launch Date', description: 'Build anticipation with launch date announcement', platform: 'all' },
          { day: -25, type: 'blog_post', title: 'Behind the Scenes Blog Post', description: 'Share writing journey and inspiration' },
          { day: -20, type: 'email_blast', title: 'Pre-order Announcement', description: 'Email subscribers about pre-order availability' },
          { day: -15, type: 'social_post', title: 'Cover Reveal', description: 'Reveal book cover with excitement', platform: 'all' },
          { day: -10, type: 'interview', title: 'Podcast Interview', description: 'Schedule author interview on relevant podcast' },
          { day: -7, type: 'social_post', title: '1 Week Countdown', description: 'Build excitement with countdown posts', platform: 'all' },
          { day: -3, type: 'review_outreach', title: 'Send Review Copies', description: 'Send ARCs to reviewers and influencers' },
          { day: -1, type: 'social_post', title: 'Final Countdown', description: 'Last chance to build excitement', platform: 'all' },
          { day: 0, type: 'social_post', title: 'LAUNCH DAY!', description: 'Celebrate the big day', platform: 'all' },
          { day: 1, type: 'email_blast', title: 'Launch Day Thank You', description: 'Thank supporters and share purchase links' },
          { day: 7, type: 'social_post', title: 'Week 1 Celebration', description: 'Share early reception and reviews', platform: 'all' },
          { day: 14, type: 'blog_post', title: 'Launch Week Reflections', description: 'Share launch experience' },
          { day: 21, type: 'social_post', title: 'Review Request', description: 'Ask readers for honest reviews', platform: 'all' },
          { day: 30, type: 'social_post', title: 'Month 1 Thank You', description: 'Appreciate readers and share milestones', platform: 'all' }
        ]
      },
      'indie_author_blitz': {
        name: 'Indie Author Marketing Blitz',
        duration: 45,
        activities: [
          { day: -21, type: 'social_post', title: 'Author Introduction', description: 'Introduce yourself and your writing', platform: 'all' },
          { day: -18, type: 'blog_post', title: 'Genre Deep Dive', description: 'Discuss your genre and influences' },
          { day: -15, type: 'social_post', title: 'Character Spotlight', description: 'Introduce main characters', platform: 'all' },
          { day: -12, type: 'email_blast', title: 'Exclusive Excerpt', description: 'Share exclusive content with subscribers' },
          { day: -9, type: 'social_post', title: 'Writing Process', description: 'Share your writing routine and tips', platform: 'all' },
          { day: -6, type: 'review_outreach', title: 'Blogger Outreach', description: 'Contact book bloggers for reviews' },
          { day: -3, type: 'social_post', title: 'Final Preparations', description: 'Share launch countdown', platform: 'all' },
          { day: 0, type: 'social_post', title: 'Launch Celebration', description: 'Celebrate your achievement', platform: 'all' },
          { day: 3, type: 'blog_post', title: 'Launch Lessons', description: 'Share what you learned' },
          { day: 7, type: 'social_post', title: 'Reader Appreciation', description: 'Thank early readers', platform: 'all' },
          { day: 14, type: 'email_blast', title: 'Two Week Update', description: 'Share progress with subscribers' },
          { day: 21, type: 'social_post', title: 'Community Building', description: 'Engage with reader community', platform: 'all' }
        ]
      }
    };

    return templates[templateName as keyof typeof templates] || templates['30_day_launch'];
  }

  /**
   * Optimize content for specific platforms
   */
  private optimizeContentForPlatform(content: string, platform: string): string {
    const optimizations = {
      twitter: (text: string) => {
        if (text.length > 280) {
          return text.substring(0, 277) + '...';
        }
        return text + ' #BookLaunch #NewBook';
      },
      facebook: (text: string) => {
        return text + '\n\n📚 Available now! Link in bio.';
      },
      instagram: (text: string) => {
        return text + '\n\n#BookLaunch #NewBook #AuthorLife #Reading #Books';
      },
      linkedin: (text: string) => {
        return `Professional update: ${text}\n\nExcited to share this milestone in my writing career.`;
      },
      tiktok: (text: string) => {
        return text + ' #BookTok #NewBook #Author #Reading';
      }
    };

    const optimizer = optimizations[platform as keyof typeof optimizations];
    return optimizer ? optimizer(content) : content;
  }

  /**
   * Calculate channel performance across campaigns
   */
  private calculateChannelPerformance(campaigns: any[]) {
    const channelStats: Record<string, any> = {};

    campaigns.forEach(campaign => {
      const channels = JSON.parse(campaign.channels || '[]');
      
      channels.forEach((channel: string) => {
        if (!channelStats[channel]) {
          channelStats[channel] = {
            reach: 0,
            engagement: 0,
            conversions: 0,
            cost: 0
          };
        }

        const channelActivities = campaign.activities.filter(
          (activity: any) => activity.platform === channel || 
          (channel === 'social_media' && ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'].includes(activity.platform))
        );

        channelActivities.forEach((activity: any) => {
          channelStats[channel].reach += activity.reach;
          channelStats[channel].engagement += activity.engagement;
          channelStats[channel].conversions += activity.conversions;
          channelStats[channel].cost += activity.cost;
        });
      });
    });

    return channelStats;
  }

  /**
   * Generate campaign timeline
   */
  private generateCampaignTimeline(activities: any[]) {
    return activities
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .map(activity => ({
        date: activity.scheduledAt,
        title: activity.title,
        type: activity.type,
        status: activity.status,
        performance: {
          reach: activity.reach,
          engagement: activity.engagement,
          conversions: activity.conversions
        }
      }));
  }

  /**
   * Update activity performance (would be called by external integrations)
   */
  async updateActivityPerformance(
    activityId: string,
    performance: {
      reach?: number;
      engagement?: number;
      conversions?: number;
    }
  ) {
    return await prisma.marketingActivity.update({
      where: { id: activityId },
      data: {
        reach: performance.reach,
        engagement: performance.engagement,
        conversions: performance.conversions,
        completedAt: new Date(),
        status: 'completed'
      }
    });
  }

  /**
   * Generate author website content
   */
  async generateAuthorWebsite(authorId: string) {
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      include: {
        publishingProjects: {
          include: {
            manuscripts: true
          }
        }
      }
    });

    if (!author) {
      throw new Error('Author not found');
    }

    const websiteContent = {
      home: {
        headline: `Welcome to ${author.firstName} ${author.lastName}'s Literary World`,
        bio: `${author.firstName} ${author.lastName} is an author of ${author.publishingProjects.map(p => JSON.parse(p.genre)).flat().join(', ')} fiction.`,
        featuredBook: author.publishingProjects[0] || null,
        recentNews: 'Stay tuned for updates on upcoming releases and events.'
      },
      about: {
        fullBio: `[Author Bio - To be customized]`,
        writingJourney: 'My journey as a writer began...',
        influences: 'I draw inspiration from...',
        personalLife: 'When not writing, I enjoy...'
      },
      books: author.publishingProjects.map(project => ({
        title: project.title,
        description: project.description,
        genre: JSON.parse(project.genre),
        status: project.status,
        wordCount: project.wordCount
      })),
      blog: [
        {
          title: 'Welcome to My Writing Journey',
          content: 'This is the beginning of sharing my author journey with you...',
          date: new Date().toISOString()
        }
      ],
      contact: {
        email: author.email,
        social: {
          twitter: '',
          facebook: '',
          instagram: '',
          goodreads: ''
        },
        bookingInfo: 'Available for interviews, readings, and speaking engagements.'
      }
    };

    return websiteContent;
  }
}

export default new MarketingAutomationService();