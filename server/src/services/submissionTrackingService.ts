/**
 * Submission Tracking Service
 * Manages submissions to agents, publishers, and contests
 * Tracks responses, follow-ups, and success rates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SubmissionData {
  publishingProjectId: string;
  targetType: 'agent' | 'publisher' | 'contest';
  targetId?: string;
  targetName: string;
  targetEmail?: string;
  submissionType: 'query' | 'partial' | 'full_manuscript';
  queryLetter?: string;
  synopsis?: string;
  samplePages?: string;
  fullManuscript?: string;
  notes?: string;
  isExclusive?: boolean;
  followUpDate?: Date;
}

export interface SubmissionAnalytics {
  totalSubmissions: number;
  responseRate: number;
  requestRate: number;
  offerRate: number;
  averageResponseTime: number;
  statusBreakdown: Record<string, number>;
  topPerformingAgents: Array<{
    name: string;
    responseRate: number;
    requestRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    submissions: number;
    responses: number;
    requests: number;
  }>;
}

export interface MarketIntelligence {
  trendingGenres: string[];
  activeAgents: Array<{
    id: string;
    name: string;
    agency: string;
    acceptingQueries: boolean;
    responseRate: number;
    recentSales: string[];
  }>;
  publisherOpportunities: Array<{
    id: string;
    name: string;
    type: string;
    acceptingSubmissions: boolean;
    genres: string[];
  }>;
  marketTrends: {
    hotGenres: string[];
    emergingPublishers: string[];
    submissionTips: string[];
  };
}

export class SubmissionTrackingService {

  /**
   * Create a new submission
   */
  async createSubmission(data: SubmissionData) {
    // Calculate follow-up date if not provided
    if (!data.followUpDate) {
      const followUpDays = data.targetType === 'agent' ? 8 * 7 : 12 * 7; // 8 weeks for agents, 12 for publishers
      data.followUpDate = new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000);
    }

    const submission = await prisma.publishingSubmission.create({
      data: {
        publishingProjectId: data.publishingProjectId,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        targetEmail: data.targetEmail,
        submissionType: data.submissionType,
        queryLetter: data.queryLetter,
        synopsis: data.synopsis,
        samplePages: data.samplePages,
        fullManuscript: data.fullManuscript,
        notes: data.notes,
        isExclusive: data.isExclusive || false,
        followUpDate: data.followUpDate,
        status: 'submitted'
      },
      include: {
        agent: true,
        publisher: true,
        publishingProject: true
      }
    });

    // Update agent/publisher stats if applicable
    if (data.targetId) {
      await this.updateTargetStats(data.targetType, data.targetId, 'submission');
    }

    return submission;
  }

  /**
   * Update submission status and response
   */
  async updateSubmissionResponse(
    submissionId: string,
    status: 'responded' | 'rejected' | 'requested' | 'offered',
    response?: string
  ) {
    const submission = await prisma.publishingSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        response,
        responseDate: new Date()
      },
      include: {
        agent: true,
        publisher: true,
        publishingProject: true
      }
    });

    // Update target stats
    if (submission.targetId) {
      await this.updateTargetStats(submission.targetType, submission.targetId, 'response');
      
      if (status === 'requested') {
        await this.updateTargetStats(submission.targetType, submission.targetId, 'request');
      }
      
      if (status === 'offered') {
        await this.updateTargetStats(submission.targetType, submission.targetId, 'offer');
      }
    }

    return submission;
  }

  /**
   * Get submissions for a publishing project
   */
  async getProjectSubmissions(publishingProjectId: string) {
    return await prisma.publishingSubmission.findMany({
      where: { publishingProjectId },
      include: {
        agent: true,
        publisher: true
      },
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Get submissions requiring follow-up
   */
  async getSubmissionsForFollowUp(userId: string) {
    const today = new Date();
    
    return await prisma.publishingSubmission.findMany({
      where: {
        publishingProject: {
          authorId: userId
        },
        status: 'submitted',
        followUpDate: {
          lte: today
        }
      },
      include: {
        agent: true,
        publisher: true,
        publishingProject: true
      },
      orderBy: { followUpDate: 'asc' }
    });
  }

  /**
   * Get submission analytics for a user
   */
  async getUserSubmissionAnalytics(userId: string): Promise<SubmissionAnalytics> {
    const submissions = await prisma.publishingSubmission.findMany({
      where: {
        publishingProject: {
          authorId: userId
        }
      },
      include: {
        agent: true,
        publisher: true
      }
    });

    const totalSubmissions = submissions.length;
    const responses = submissions.filter(s => s.responseDate).length;
    const requests = submissions.filter(s => s.status === 'requested').length;
    const offers = submissions.filter(s => s.status === 'offered').length;

    const responseRate = totalSubmissions > 0 ? (responses / totalSubmissions) * 100 : 0;
    const requestRate = totalSubmissions > 0 ? (requests / totalSubmissions) * 100 : 0;
    const offerRate = totalSubmissions > 0 ? (offers / totalSubmissions) * 100 : 0;

    // Calculate average response time
    const responseTimes = submissions
      .filter(s => s.responseDate && s.submittedAt)
      .map(s => s.responseDate!.getTime() - s.submittedAt.getTime());
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Status breakdown
    const statusBreakdown = submissions.reduce((acc, submission) => {
      acc[submission.status] = (acc[submission.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top performing agents (with at least 3 submissions)
    const agentPerformance = submissions
      .filter(s => s.agent)
      .reduce((acc, submission) => {
        const agentId = submission.agent!.id;
        if (!acc[agentId]) {
          acc[agentId] = {
            name: submission.agent!.name,
            submissions: 0,
            responses: 0,
            requests: 0
          };
        }
        acc[agentId].submissions++;
        if (submission.responseDate) acc[agentId].responses++;
        if (submission.status === 'requested') acc[agentId].requests++;
        return acc;
      }, {} as Record<string, any>);

    const topPerformingAgents = Object.values(agentPerformance)
      .filter((agent: any) => agent.submissions >= 3)
      .map((agent: any) => ({
        name: agent.name,
        responseRate: (agent.responses / agent.submissions) * 100,
        requestRate: (agent.requests / agent.submissions) * 100
      }))
      .sort((a, b) => b.requestRate - a.requestRate)
      .slice(0, 5);

    // Monthly trends (last 12 months)
    const monthlyTrends = this.calculateMonthlyTrends(submissions);

    return {
      totalSubmissions,
      responseRate,
      requestRate,
      offerRate,
      averageResponseTime,
      statusBreakdown,
      topPerformingAgents,
      monthlyTrends
    };
  }

  /**
   * Get market intelligence data
   */
  async getMarketIntelligence(): Promise<MarketIntelligence> {
    // Get active agents
    const activeAgents = await prisma.literaryAgent.findMany({
      where: {
        isActive: true,
        acceptingQueries: true
      },
      orderBy: { responseRate: 'desc' },
      take: 20
    });

    // Get publisher opportunities
    const publisherOpportunities = await prisma.publisher.findMany({
      where: {
        isActive: true,
        acceptingSubmissions: true
      },
      orderBy: { booksPerYear: 'desc' },
      take: 15
    });

    // Analyze trending genres from recent submissions
    const recentSubmissions = await prisma.publishingSubmission.findMany({
      where: {
        submittedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      include: {
        publishingProject: true
      }
    });

    const genreCounts = recentSubmissions.reduce((acc, submission) => {
      const genres = JSON.parse(submission.publishingProject.genre);
      genres.forEach((genre: string) => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const trendingGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre]) => genre);

    return {
      trendingGenres,
      activeAgents: activeAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        agency: agent.agency,
        acceptingQueries: agent.acceptingQueries,
        responseRate: agent.responseRate,
        recentSales: JSON.parse(agent.recentSales)
      })),
      publisherOpportunities: publisherOpportunities.map(pub => ({
        id: pub.id,
        name: pub.name,
        type: pub.type,
        acceptingSubmissions: pub.acceptingSubmissions,
        genres: JSON.parse(pub.genres)
      })),
      marketTrends: {
        hotGenres: trendingGenres.slice(0, 5),
        emergingPublishers: ['Indie Publisher X', 'New House Books', 'Digital First Publishing'],
        submissionTips: [
          'Personalize query letters with recent agent sales',
          'Follow submission guidelines exactly',
          'Research comparable titles in your genre',
          'Keep query letters under 300 words',
          'Include compelling hook in first paragraph'
        ]
      }
    };
  }

  /**
   * Search for agents based on criteria
   */
  async searchAgents(criteria: {
    genres?: string[];
    clientTypes?: string[];
    acceptingQueries?: boolean;
    responseTimeMax?: number;
  }) {
    const where: any = {
      isActive: true
    };

    if (criteria.acceptingQueries !== undefined) {
      where.acceptingQueries = criteria.acceptingQueries;
    }

    let agents = await prisma.literaryAgent.findMany({
      where,
      orderBy: { responseRate: 'desc' }
    });

    // Filter by genres
    if (criteria.genres && criteria.genres.length > 0) {
      agents = agents.filter(agent => {
        const agentGenres = JSON.parse(agent.genres);
        return criteria.genres!.some(genre => agentGenres.includes(genre));
      });
    }

    // Filter by client types
    if (criteria.clientTypes && criteria.clientTypes.length > 0) {
      agents = agents.filter(agent => {
        const clientTypes = JSON.parse(agent.clientTypes);
        return criteria.clientTypes!.some(type => clientTypes.includes(type));
      });
    }

    return agents;
  }

  /**
   * Search for publishers based on criteria
   */
  async searchPublishers(criteria: {
    genres?: string[];
    type?: string;
    acceptsUnsolicited?: boolean;
    acceptingSubmissions?: boolean;
  }) {
    const where: any = {
      isActive: true
    };

    if (criteria.type) {
      where.type = criteria.type;
    }

    if (criteria.acceptsUnsolicited !== undefined) {
      where.acceptsUnsolicited = criteria.acceptsUnsolicited;
    }

    if (criteria.acceptingSubmissions !== undefined) {
      where.acceptingSubmissions = criteria.acceptingSubmissions;
    }

    let publishers = await prisma.publisher.findMany({
      where,
      orderBy: { booksPerYear: 'desc' }
    });

    // Filter by genres
    if (criteria.genres && criteria.genres.length > 0) {
      publishers = publishers.filter(publisher => {
        const publisherGenres = JSON.parse(publisher.genres);
        return criteria.genres!.some(genre => publisherGenres.includes(genre));
      });
    }

    return publishers;
  }

  /**
   * Generate submission templates
   */
  generateQueryLetterTemplate(genre: string, targetName: string): string {
    const templates = {
      fantasy: `Dear ${targetName},

I am seeking representation for my [WORD COUNT]-word fantasy novel, [TITLE].

[PROTAGONIST] lives in [SETTING] where [INCITING INCIDENT]. When [CONFLICT], they must [STAKES] or [CONSEQUENCES].

[TITLE] will appeal to readers of [COMP TITLE 1] and [COMP TITLE 2]. This is my first novel.

I have included [MATERIALS] below. Thank you for your time and consideration.

Sincerely,
[YOUR NAME]`,

      mystery: `Dear ${targetName},

I am writing to query you about my [WORD COUNT]-word mystery novel, [TITLE].

When [INCITING INCIDENT], [PROTAGONIST] must [INVESTIGATION]. But [COMPLICATION] threatens to [STAKES].

[TITLE] combines the [ELEMENT 1] of [COMP TITLE 1] with the [ELEMENT 2] of [COMP TITLE 2].

[BIO/CREDENTIALS if relevant]

I have included [MATERIALS] below. Thank you for your consideration.

Best regards,
[YOUR NAME]`,

      romance: `Dear ${targetName},

I am seeking representation for [TITLE], a [WORD COUNT]-word [SUBGENRE] romance.

[HEROINE] is [DESCRIPTION] when she meets [HERO], [HIS DESCRIPTION]. Despite [CONFLICT], [ATTRACTION]. But when [CRISIS], they must [CHOICE] to find their happily ever after.

[TITLE] will appeal to fans of [COMP TITLE 1] and [COMP TITLE 2].

[CREDENTIALS/BIO if relevant]

I have pasted [MATERIALS] below. Thank you for your time.

Warmly,
[YOUR NAME]`,

      literary: `Dear ${targetName},

I am writing to seek representation for my literary novel [TITLE], complete at [WORD COUNT] words.

[PROTAGONIST] is [CHARACTER DESCRIPTION] in [SETTING]. When [INCITING INCIDENT], [HE/SHE] must confront [CENTRAL CONFLICT] while [EMOTIONAL JOURNEY].

[TITLE] explores themes of [THEMES] and will resonate with readers of [COMP TITLE 1] and [COMP TITLE 2].

[CREDENTIALS/PUBLICATIONS if relevant]

I have included [MATERIALS] as requested. Thank you for your consideration.

Sincerely,
[YOUR NAME]`
    };

    return templates[genre as keyof typeof templates] || templates.literary;
  }

  /**
   * Update target statistics
   */
  private async updateTargetStats(
    targetType: string,
    targetId: string,
    eventType: 'submission' | 'response' | 'request' | 'offer'
  ) {
    if (targetType === 'agent') {
      const agent = await prisma.literaryAgent.findUnique({
        where: { id: targetId }
      });

      if (agent) {
        // Calculate new stats based on all submissions to this agent
        const submissions = await prisma.publishingSubmission.findMany({
          where: { targetId }
        });

        const totalSubmissions = submissions.length;
        const responses = submissions.filter(s => s.responseDate).length;
        const responseRate = totalSubmissions > 0 ? (responses / totalSubmissions) * 100 : 0;

        await prisma.literaryAgent.update({
          where: { id: targetId },
          data: { responseRate }
        });
      }
    }
  }

  /**
   * Calculate monthly trends from submissions
   */
  private calculateMonthlyTrends(submissions: any[]) {
    const trends = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthSubmissions = submissions.filter(s => 
        s.submittedAt >= monthStart && s.submittedAt <= monthEnd
      );

      const responses = monthSubmissions.filter(s => s.responseDate).length;
      const requests = monthSubmissions.filter(s => s.status === 'requested').length;

      trends.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        submissions: monthSubmissions.length,
        responses,
        requests
      });
    }

    return trends;
  }

  /**
   * Import agent/publisher database
   */
  async importAgentDatabase(agents: any[]) {
    for (const agentData of agents) {
      await prisma.literaryAgent.upsert({
        where: { 
          name: agentData.name,
          agency: agentData.agency 
        },
        update: agentData,
        create: agentData
      });
    }
  }

  async importPublisherDatabase(publishers: any[]) {
    for (const publisherData of publishers) {
      await prisma.publisher.upsert({
        where: { name: publisherData.name },
        update: publisherData,
        create: publisherData
      });
    }
  }
}

export default new SubmissionTrackingService();