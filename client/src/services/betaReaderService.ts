/**
 * Beta Reader Management Service
 * Handles beta reader matching, assignments, and feedback management
 */

import { 
  BetaReader, 
  BetaAssignment, 
  BetaFeedback, 
  BetaAgreement,
  BetaReaderProfile,
  BetaReaderStats,
  AssignmentProgress,
  BetaReaderRating,
  SmartMatching,
  BetaReaderMatch
} from '@/types/collaboration';

export interface BetaReaderSearch {
  genres?: string[];
  experience?: string;
  readingSpeed?: string;
  feedbackStyle?: string;
  availability?: 'immediate' | 'within-week' | 'within-month' | 'flexible';
  minRating?: number;
  maxTurnaroundDays?: number;
  languages?: string[];
  priceRange?: { min: number; max: number };
  sortBy?: 'rating' | 'experience' | 'turnaround' | 'availability' | 'match-score';
  limit?: number;
}

export interface CreateAssignmentData {
  projectId: string;
  authorId: string;
  betaReaderId: string;
  sections: {
    title: string;
    wordCount: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: Date;
    specialInstructions?: string;
  }[];
  agreementTerms: {
    scope: string;
    deadline: Date;
    feedbackType: string[];
    confidentialityRequired: boolean;
    compensation?: any;
  };
}

export interface FeedbackSubmission {
  assignmentId: string;
  sectionId?: string;
  feedback: Omit<BetaFeedback, 'id' | 'timestamp' | 'replies'>[];
  generalComments?: string;
  completionNotes?: string;
}

class BetaReaderService {
  private static instance: BetaReaderService;
  private betaReaders: Map<string, BetaReader> = new Map();
  private assignments: Map<string, BetaAssignment> = new Map();
  private agreements: Map<string, BetaAgreement> = new Map();
  private feedback: Map<string, BetaFeedback[]> = new Map(); // assignmentId -> feedback

  private constructor() {
    this.initializeWithMockData();
  }

  public static getInstance(): BetaReaderService {
    if (!BetaReaderService.instance) {
      BetaReaderService.instance = new BetaReaderService();
    }
    return BetaReaderService.instance;
  }

  /**
   * Search for beta readers with filters
   */
  public async searchBetaReaders(criteria: BetaReaderSearch): Promise<BetaReader[]> {
    let readers = Array.from(this.betaReaders.values());

    // Apply filters
    if (criteria.genres && criteria.genres.length > 0) {
      readers = readers.filter(reader =>
        criteria.genres!.some(genre => reader.profile.genres.includes(genre))
      );
    }

    if (criteria.experience) {
      readers = readers.filter(reader => reader.profile.experience === criteria.experience);
    }

    if (criteria.feedbackStyle) {
      readers = readers.filter(reader => reader.profile.feedbackStyle === criteria.feedbackStyle);
    }

    if (criteria.minRating) {
      readers = readers.filter(reader => reader.statistics.averageRating >= criteria.minRating);
    }

    if (criteria.maxTurnaroundDays) {
      readers = readers.filter(reader => reader.statistics.averageTurnaroundDays <= criteria.maxTurnaroundDays);
    }

    if (criteria.languages && criteria.languages.length > 0) {
      readers = readers.filter(reader =>
        criteria.languages!.some(lang => 
          reader.profile.languageSkills.some(skill => skill.language === lang)
        )
      );
    }

    if (criteria.availability) {
      readers = readers.filter(reader => reader.availability.isAvailable);
      
      if (criteria.availability === 'immediate') {
        readers = readers.filter(reader => reader.availability.responseTime <= 24);
      } else if (criteria.availability === 'within-week') {
        readers = readers.filter(reader => reader.availability.responseTime <= 168);
      }
    }

    // Sort results
    const sortBy = criteria.sortBy || 'rating';
    readers.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.statistics.averageRating - a.statistics.averageRating;
        case 'experience':
          const expOrder = { 'professional': 4, 'advanced': 3, 'intermediate': 2, 'beginner': 1 };
          return expOrder[b.profile.experience as keyof typeof expOrder] - expOrder[a.profile.experience as keyof typeof expOrder];
        case 'turnaround':
          return a.statistics.averageTurnaroundDays - b.statistics.averageTurnaroundDays;
        case 'availability':
          if (a.availability.isAvailable && !b.availability.isAvailable) return -1;
          if (!a.availability.isAvailable && b.availability.isAvailable) return 1;
          return a.availability.currentLoad - b.availability.currentLoad;
        default:
          return b.statistics.averageRating - a.statistics.averageRating;
      }
    });

    return readers.slice(0, criteria.limit || 20);
  }

  /**
   * Get smart beta reader matches for a project
   */
  public async getSmartMatches(
    projectId: string,
    authorId: string,
    projectGenres: string[],
    projectLength: number,
    deadline: Date
  ): Promise<BetaReaderMatch[]> {
    const availableReaders = Array.from(this.betaReaders.values())
      .filter(reader => reader.availability.isAvailable);

    const matches: BetaReaderMatch[] = [];

    for (const reader of availableReaders) {
      const match = this.calculateMatchScore(reader, {
        genres: projectGenres,
        length: projectLength,
        deadline,
        authorId
      });

      if (match.score >= 60) { // Minimum threshold
        matches.push(match);
      }
    }

    // Sort by score (descending)
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, 10); // Return top 10 matches
  }

  /**
   * Create a beta reading assignment
   */
  public async createAssignment(data: CreateAssignmentData): Promise<BetaAssignment> {
    const assignmentId = this.generateId();
    const now = new Date();

    // Create agreement first
    const agreement: BetaAgreement = {
      id: this.generateId(),
      projectId: data.projectId,
      betaReaderId: data.betaReaderId,
      authorId: data.authorId,
      terms: {
        scope: data.agreementTerms.scope,
        deadline: data.agreementTerms.deadline,
        feedbackType: data.agreementTerms.feedbackType,
        confidentialityRequired: data.agreementTerms.confidentialityRequired,
        attributionAllowed: false,
        revisionRights: false,
        cancellationTerms: 'Either party may cancel with 48 hours notice',
        qualityStandards: 'Professional quality feedback expected'
      },
      signedAt: now,
      status: 'signed',
      deliverables: data.sections.map(section => ({
        id: this.generateId(),
        name: `Feedback for: ${section.title}`,
        description: `Beta reading feedback for section "${section.title}"`,
        dueDate: section.dueDate,
        status: 'pending',
        files: []
      })),
      compensation: data.agreementTerms.compensation
    };

    // Create assignment
    const assignment: BetaAssignment = {
      id: assignmentId,
      projectId: data.projectId,
      betaReaderId: data.betaReaderId,
      authorId: data.authorId,
      sections: data.sections.map(section => ({
        id: this.generateId(),
        title: section.title,
        wordCount: section.wordCount,
        priority: section.priority,
        dueDate: section.dueDate,
        status: 'pending',
        estimatedReadTime: Math.ceil(section.wordCount / 250), // 250 words per minute
        specialInstructions: section.specialInstructions
      })),
      status: 'assigned',
      assignedAt: now,
      progress: {
        sectionsCompleted: 0,
        totalSections: data.sections.length,
        wordsRead: 0,
        totalWords: data.sections.reduce((sum, section) => sum + section.wordCount, 0),
        timeSpent: 0,
        lastActivity: now,
        completionEstimate: data.agreementTerms.deadline
      },
      feedback: [],
      ratings: {
        qualityScore: 0,
        timelinessScore: 0,
        communicationScore: 0,
        helpfulnessScore: 0,
        overallScore: 0
      }
    };

    // Update beta reader availability
    const betaReader = this.betaReaders.get(data.betaReaderId);
    if (betaReader) {
      betaReader.availability.currentLoad++;
      betaReader.assignments.push(assignment);
    }

    this.assignments.set(assignmentId, assignment);
    this.agreements.set(agreement.id, agreement);

    return assignment;
  }

  /**
   * Submit feedback for an assignment
   */
  public async submitFeedback(submission: FeedbackSubmission): Promise<void> {
    const assignment = this.assignments.get(submission.assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const now = new Date();
    const feedbackItems: BetaFeedback[] = submission.feedback.map(feedback => ({
      ...feedback,
      id: this.generateId(),
      timestamp: now,
      replies: []
    }));

    // Store feedback
    const existingFeedback = this.feedback.get(submission.assignmentId) || [];
    this.feedback.set(submission.assignmentId, [...existingFeedback, ...feedbackItems]);

    // Update assignment progress
    if (submission.sectionId) {
      const section = assignment.sections.find(s => s.id === submission.sectionId);
      if (section) {
        section.status = 'completed';
        assignment.progress.sectionsCompleted++;
        assignment.progress.wordsRead += section.wordCount;
      }
    }

    assignment.progress.lastActivity = now;
    assignment.feedback = [...assignment.feedback, ...feedbackItems];

    // Check if assignment is complete
    if (assignment.progress.sectionsCompleted >= assignment.progress.totalSections) {
      assignment.status = 'completed';
      assignment.completedAt = now;

      // Update beta reader stats
      const betaReader = this.betaReaders.get(assignment.betaReaderId);
      if (betaReader) {
        betaReader.availability.currentLoad--;
        betaReader.statistics.projectsCompleted++;
        betaReader.statistics.wordsRead += assignment.progress.totalWords;
        
        // Calculate turnaround time
        const turnaroundDays = Math.ceil(
          (now.getTime() - assignment.assignedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Update average turnaround (simple moving average)
        const totalProjects = betaReader.statistics.projectsCompleted;
        betaReader.statistics.averageTurnaroundDays = 
          ((betaReader.statistics.averageTurnaroundDays * (totalProjects - 1)) + turnaroundDays) / totalProjects;
        
        // Check if completed on time
        if (now <= assignment.progress.completionEstimate) {
          betaReader.statistics.onTimeCompletions++;
        }
      }
    }
  }

  /**
   * Get assignments for a beta reader
   */
  public async getBetaReaderAssignments(betaReaderId: string): Promise<BetaAssignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.betaReaderId === betaReaderId)
      .sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  }

  /**
   * Get assignments for an author
   */
  public async getAuthorAssignments(authorId: string): Promise<BetaAssignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.authorId === authorId)
      .sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
  }

  /**
   * Get assignment by ID
   */
  public async getAssignment(assignmentId: string): Promise<BetaAssignment | null> {
    return this.assignments.get(assignmentId) || null;
  }

  /**
   * Get feedback for an assignment
   */
  public async getAssignmentFeedback(assignmentId: string): Promise<BetaFeedback[]> {
    return this.feedback.get(assignmentId) || [];
  }

  /**
   * Rate a beta reader
   */
  public async rateBetaReader(
    assignmentId: string,
    authorId: string,
    rating: {
      qualityScore: number;
      timelinessScore: number;
      communicationScore: number;
      helpfulnessScore: number;
      authorFeedback?: string;
      wouldRecommend: boolean;
      wouldWorkAgain: boolean;
    }
  ): Promise<void> {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment || assignment.authorId !== authorId) {
      throw new Error('Assignment not found or unauthorized');
    }

    const overallScore = (
      rating.qualityScore +
      rating.timelinessScore +
      rating.communicationScore +
      rating.helpfulnessScore
    ) / 4;

    assignment.ratings = {
      ...rating,
      overallScore,
      ratedAt: new Date()
    };

    // Update beta reader's overall rating
    const betaReader = this.betaReaders.get(assignment.betaReaderId);
    if (betaReader) {
      const newRating: BetaReaderRating = {
        projectId: assignment.projectId,
        authorId,
        rating: assignment.ratings,
        publicFeedback: rating.authorFeedback,
        wouldRecommend: rating.wouldRecommend,
        wouldWorkAgain: rating.wouldWorkAgain,
        ratedAt: new Date()
      };

      betaReader.ratings.push(newRating);

      // Recalculate average rating
      const totalRatings = betaReader.ratings.length;
      const sumRatings = betaReader.ratings.reduce((sum, r) => sum + r.rating.overallScore, 0);
      betaReader.statistics.averageRating = sumRatings / totalRatings;

      // Update author satisfaction score
      const recommendationRate = betaReader.ratings.filter(r => r.wouldRecommend).length / totalRatings;
      betaReader.statistics.authorSatisfactionScore = recommendationRate * 100;
    }
  }

  /**
   * Get beta reader by ID
   */
  public async getBetaReader(readerId: string): Promise<BetaReader | null> {
    return this.betaReaders.get(readerId) || null;
  }

  /**
   * Update beta reader availability
   */
  public async updateAvailability(
    readerId: string,
    availability: Partial<BetaReader['availability']>
  ): Promise<void> {
    const reader = this.betaReaders.get(readerId);
    if (!reader) {
      throw new Error('Beta reader not found');
    }

    reader.availability = { ...reader.availability, ...availability };
  }

  /**
   * Calculate match score between beta reader and project
   */
  private calculateMatchScore(
    reader: BetaReader,
    project: {
      genres: string[];
      length: number;
      deadline: Date;
      authorId: string;
    }
  ): BetaReaderMatch {
    let score = 0;
    const factors: any[] = [];
    const reasoning: string[] = [];
    const potentialIssues: string[] = [];

    // Genre matching (30% weight)
    const genreMatches = project.genres.filter(genre => reader.profile.genres.includes(genre));
    const genreScore = (genreMatches.length / Math.max(project.genres.length, 1)) * 100;
    score += genreScore * 0.3;
    
    factors.push({
      name: 'Genre Match',
      score: genreScore,
      weight: 0.3,
      description: `Matches ${genreMatches.length}/${project.genres.length} genres`,
      evidence: genreMatches
    });

    if (genreScore >= 70) {
      reasoning.push(`Strong genre expertise in ${genreMatches.join(', ')}`);
    } else if (genreScore < 30) {
      potentialIssues.push('Limited experience with these genres');
    }

    // Experience level (20% weight)
    const experienceScores = { 'professional': 100, 'advanced': 80, 'intermediate': 60, 'beginner': 40 };
    const experienceScore = experienceScores[reader.profile.experience as keyof typeof experienceScores] || 50;
    score += experienceScore * 0.2;
    
    factors.push({
      name: 'Experience Level',
      score: experienceScore,
      weight: 0.2,
      description: `${reader.profile.experience} level`,
      evidence: [reader.profile.experience]
    });

    // Availability (15% weight)
    let availabilityScore = 0;
    if (reader.availability.isAvailable) {
      const loadRatio = reader.availability.currentLoad / reader.availability.maxLoad;
      availabilityScore = Math.max(0, (1 - loadRatio) * 100);
    }
    score += availabilityScore * 0.15;
    
    factors.push({
      name: 'Availability',
      score: availabilityScore,
      weight: 0.15,
      description: `${reader.availability.currentLoad}/${reader.availability.maxLoad} current load`,
      evidence: [reader.availability.isAvailable ? 'Available' : 'Not available']
    });

    if (!reader.availability.isAvailable) {
      potentialIssues.push('Currently not available for new projects');
    }

    // Rating/Quality (20% weight)
    const ratingScore = (reader.statistics.averageRating / 5) * 100;
    score += ratingScore * 0.2;
    
    factors.push({
      name: 'Quality Rating',
      score: ratingScore,
      weight: 0.2,
      description: `${reader.statistics.averageRating.toFixed(1)}/5.0 average rating`,
      evidence: [`${reader.statistics.projectsCompleted} completed projects`]
    });

    // Turnaround time (15% weight)
    const daysToDeadline = Math.ceil((project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const turnaroundScore = Math.max(0, Math.min(100, 
      ((daysToDeadline - reader.statistics.averageTurnaroundDays) / daysToDeadline) * 100
    ));
    score += turnaroundScore * 0.15;
    
    factors.push({
      name: 'Turnaround Time',
      score: turnaroundScore,
      weight: 0.15,
      description: `${reader.statistics.averageTurnaroundDays} days average turnaround`,
      evidence: [`${daysToDeadline} days until deadline`]
    });

    if (reader.statistics.averageTurnaroundDays > daysToDeadline) {
      potentialIssues.push('May not meet deadline based on average turnaround time');
    }

    // Final recommendation
    let recommendation: 'strong' | 'good' | 'moderate' | 'weak';
    if (score >= 85) {
      recommendation = 'strong';
      reasoning.push('Excellent overall match with high compatibility');
    } else if (score >= 70) {
      recommendation = 'good';
      reasoning.push('Good match with strong compatibility factors');
    } else if (score >= 55) {
      recommendation = 'moderate';
      reasoning.push('Moderate match with some compatibility concerns');
    } else {
      recommendation = 'weak';
      reasoning.push('Limited compatibility with project requirements');
    }

    return {
      authorId: project.authorId,
      betaReaderId: reader.id,
      score: Math.round(score),
      confidence: Math.min(100, score + (reader.statistics.projectsCompleted * 2)), // Confidence increases with experience
      factors,
      recommendation,
      reasoning,
      potentialIssues
    };
  }

  /**
   * Initialize with mock data
   */
  private initializeWithMockData(): void {
    const now = new Date();

    // Sample beta readers
    const reader1: BetaReader = {
      id: 'beta-1',
      userId: 'user-beta-1',
      username: 'sarah_reads',
      displayName: 'Sarah Martinez',
      email: 'sarah@example.com',
      profile: {
        bio: 'Professional editor with 8 years of experience in fantasy and science fiction. Specializing in developmental feedback and plot structure analysis.',
        specialties: ['plot-development', 'character-development', 'world-building', 'pacing'],
        genres: ['fantasy', 'science-fiction', 'urban-fantasy', 'dystopian'],
        experience: 'professional',
        readingSpeed: 300, // words per hour
        feedbackStyle: 'developmental',
        languageSkills: [
          { language: 'English', proficiency: 'native', isPreferred: true },
          { language: 'Spanish', proficiency: 'fluent', isPreferred: false }
        ],
        credentials: ['Professional Editors Guild Member', 'MA in Literature'],
        portfolio: [
          {
            title: 'Sample Developmental Edit',
            description: 'Example of my developmental feedback approach',
            type: 'sample-feedback',
            addedAt: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
          }
        ]
      },
      statistics: {
        projectsCompleted: 45,
        averageRating: 4.8,
        averageTurnaroundDays: 7,
        wordsRead: 1500000,
        feedbackPoints: 2890,
        onTimeCompletions: 42,
        authorSatisfactionScore: 96,
        responseRate: 98
      },
      preferences: {
        maxSimultaneousProjects: 3,
        preferredProjectLength: 'long',
        preferredGenres: ['fantasy', 'science-fiction'],
        contentRestrictions: ['explicit-violence', 'graphic-content'],
        communicationStyle: 'detailed',
        feedbackFormat: 'document',
        availableHours: [
          { day: 'monday', startTime: '09:00', endTime: '17:00', timezone: 'EST' },
          { day: 'wednesday', startTime: '09:00', endTime: '17:00', timezone: 'EST' },
          { day: 'friday', startTime: '09:00', endTime: '17:00', timezone: 'EST' }
        ],
        reminders: true
      },
      availability: {
        isAvailable: true,
        currentLoad: 2,
        maxLoad: 3,
        timeSlots: [
          { day: 'monday', startTime: '09:00', endTime: '17:00', timezone: 'EST' }
        ],
        blackoutDates: [],
        responseTime: 24,
        timezone: 'EST'
      },
      agreements: [],
      assignments: [],
      ratings: []
    };

    const reader2: BetaReader = {
      id: 'beta-2',
      userId: 'user-beta-2',
      username: 'mike_feedback',
      displayName: 'Michael Chen',
      email: 'mike@example.com',
      profile: {
        bio: 'Avid reader and writing enthusiast with a focus on contemporary fiction and thrillers. Provides thoughtful line-by-line feedback.',
        specialties: ['line-editing', 'grammar', 'style', 'dialogue'],
        genres: ['mystery', 'thriller', 'contemporary-fiction', 'literary-fiction'],
        experience: 'advanced',
        readingSpeed: 250,
        feedbackStyle: 'line-editing',
        languageSkills: [
          { language: 'English', proficiency: 'native', isPreferred: true }
        ],
        credentials: ['Beta Reader Certification'],
        portfolio: []
      },
      statistics: {
        projectsCompleted: 28,
        averageRating: 4.5,
        averageTurnaroundDays: 10,
        wordsRead: 800000,
        feedbackPoints: 1450,
        onTimeCompletions: 25,
        authorSatisfactionScore: 89,
        responseRate: 94
      },
      preferences: {
        maxSimultaneousProjects: 2,
        preferredProjectLength: 'medium',
        preferredGenres: ['mystery', 'thriller'],
        contentRestrictions: [],
        communicationStyle: 'moderate',
        feedbackFormat: 'comments',
        availableHours: [
          { day: 'saturday', startTime: '10:00', endTime: '16:00', timezone: 'PST' },
          { day: 'sunday', startTime: '10:00', endTime: '16:00', timezone: 'PST' }
        ],
        reminders: true
      },
      availability: {
        isAvailable: true,
        currentLoad: 1,
        maxLoad: 2,
        timeSlots: [
          { day: 'saturday', startTime: '10:00', endTime: '16:00', timezone: 'PST' }
        ],
        blackoutDates: [],
        responseTime: 48,
        timezone: 'PST'
      },
      agreements: [],
      assignments: [],
      ratings: []
    };

    this.betaReaders.set(reader1.id, reader1);
    this.betaReaders.set(reader2.id, reader2);

    // Sample assignment
    const assignment: BetaAssignment = {
      id: 'assignment-1',
      projectId: 'project-1',
      betaReaderId: 'beta-1',
      authorId: 'author-1',
      sections: [
        {
          id: 'section-1',
          title: 'Chapter 1: The Beginning',
          wordCount: 3500,
          priority: 'high',
          dueDate: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)),
          status: 'in-progress',
          estimatedReadTime: 14
        },
        {
          id: 'section-2',
          title: 'Chapter 2: The Journey',
          wordCount: 4200,
          priority: 'medium',
          dueDate: new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)),
          status: 'pending',
          estimatedReadTime: 17
        }
      ],
      status: 'in-progress',
      assignedAt: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)),
      startedAt: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)),
      progress: {
        sectionsCompleted: 1,
        totalSections: 2,
        wordsRead: 3500,
        totalWords: 7700,
        timeSpent: 180, // 3 hours
        lastActivity: new Date(now.getTime() - (1 * 60 * 60 * 1000)),
        completionEstimate: new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000))
      },
      feedback: [],
      ratings: {
        qualityScore: 0,
        timelinessScore: 0,
        communicationScore: 0,
        helpfulnessScore: 0,
        overallScore: 0
      }
    };

    this.assignments.set(assignment.id, assignment);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const betaReaderService = BetaReaderService.getInstance();