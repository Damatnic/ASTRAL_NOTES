/**
 * Writing Groups & Communities Service
 * Manages writing groups, member interactions, and group projects
 */

import { 
  WritingGroup, 
  GroupMember, 
  GroupProject, 
  GroupEvent,
  GroupPermissions,
  GroupRole,
  ProjectContributor,
  NotificationType
} from '@/types/collaboration';

export interface CreateGroupData {
  name: string;
  description: string;
  type: 'public' | 'private' | 'invite-only';
  category: 'fiction' | 'non-fiction' | 'poetry' | 'screenwriting' | 'academic' | 'mixed';
  tags: string[];
  coverImage?: File;
  settings: Partial<WritingGroup['settings']>;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: GroupRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface GroupSearch {
  query?: string;
  category?: string;
  type?: string;
  tags?: string[];
  memberCount?: { min?: number; max?: number };
  hasActiveProjects?: boolean;
  sortBy?: 'relevance' | 'name' | 'members' | 'activity' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface GroupActivity {
  id: string;
  groupId: string;
  type: 'member-joined' | 'member-left' | 'project-created' | 'project-completed' | 'event-scheduled' | 'achievement-unlocked';
  actorId: string;
  actorName: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  isPublic: boolean;
}

export interface GroupAchievement {
  id: string;
  groupId: string;
  type: 'milestone' | 'collaboration' | 'quality' | 'activity' | 'growth';
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  criteria: Record<string, any>;
  celebrationMessage: string;
}

class WritingGroupService {
  private static instance: WritingGroupService;
  private groups: Map<string, WritingGroup> = new Map();
  private memberships: Map<string, GroupMember[]> = new Map(); // userId -> memberships
  private invitations: Map<string, GroupInvitation[]> = new Map(); // groupId -> invitations
  private activities: Map<string, GroupActivity[]> = new Map(); // groupId -> activities
  private achievements: Map<string, GroupAchievement[]> = new Map(); // groupId -> achievements

  private constructor() {
    this.initializeWithMockData();
  }

  public static getInstance(): WritingGroupService {
    if (!WritingGroupService.instance) {
      WritingGroupService.instance = new WritingGroupService();
    }
    return WritingGroupService.instance;
  }

  /**
   * Create a new writing group
   */
  public async createGroup(data: CreateGroupData, creatorId: string): Promise<WritingGroup> {
    const groupId = this.generateId();
    const now = new Date();

    const group: WritingGroup = {
      id: groupId,
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      tags: data.tags,
      coverImage: data.coverImage ? URL.createObjectURL(data.coverImage) : undefined,
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
      memberCount: 1,
      projectCount: 0,
      isVerified: false,
      settings: {
        canMembersInvite: true,
        canMembersCreateProjects: true,
        canMembersStartSessions: true,
        requireApprovalForPosts: false,
        allowGuestReaders: data.type !== 'private',
        autoModeration: true,
        wordFilter: [],
        maxProjectsPerMember: 10,
        maxMembersCount: 1000,
        allowVideoChat: true,
        allowVoiceNotes: true,
        enableNotifications: true,
        quietHours: { start: '22:00', end: '08:00' },
        allowedFileTypes: ['txt', 'doc', 'docx', 'pdf', 'md'],
        maxFileSize: 10485760, // 10MB
        requireContentWarnings: false,
        ...data.settings
      },
      statistics: {
        totalWords: 0,
        totalProjects: 0,
        totalSessions: 0,
        averageSessionLength: 0,
        mostActiveHour: 14,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        topGenres: [],
        collaborationScore: 0
      }
    };

    // Create founding member record
    const foundingMember: GroupMember = {
      userId: creatorId,
      groupId: groupId,
      username: 'Group Creator', // Would come from user service
      displayName: 'Group Creator',
      role: 'admin',
      permissions: this.getDefaultPermissions('admin'),
      joinedAt: now,
      lastActive: now,
      status: 'active',
      contributions: {
        wordsContributed: 0,
        projectsCreated: 0,
        projectsContributed: 0,
        feedbackGiven: 0,
        feedbackReceived: 0,
        sessionsHosted: 0,
        sessionsAttended: 0,
        helpfulVotes: 0,
        mentorshipHours: 0
      },
      badges: [{
        id: 'founder',
        name: 'Founder',
        description: 'Founded this writing group',
        icon: '👑',
        color: 'gold',
        earnedAt: now
      }],
      specialties: [],
      timezone: 'UTC',
      preferences: {
        notificationTypes: ['new-projects', 'project-updates', 'group-announcements'],
        availableHours: [],
        preferredGenres: [],
        readingSpeed: 'normal',
        feedbackStyle: 'balanced',
        expertiseAreas: [],
        mentorshipOffered: false,
        mentorshipSought: false
      }
    };

    this.groups.set(groupId, group);
    this.addMemberToGroup(foundingMember);
    this.recordActivity(groupId, {
      type: 'member-joined',
      actorId: creatorId,
      actorName: foundingMember.displayName,
      description: `${foundingMember.displayName} created the group`,
      isPublic: true
    });

    return group;
  }

  /**
   * Search for writing groups
   */
  public async searchGroups(criteria: GroupSearch): Promise<{ groups: WritingGroup[]; total: number; page: number }> {
    let filteredGroups = Array.from(this.groups.values());

    // Apply filters
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      filteredGroups = filteredGroups.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query) ||
        group.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (criteria.category) {
      filteredGroups = filteredGroups.filter(group => group.category === criteria.category);
    }

    if (criteria.type) {
      filteredGroups = filteredGroups.filter(group => group.type === criteria.type);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filteredGroups = filteredGroups.filter(group =>
        criteria.tags!.some(tag => group.tags.includes(tag))
      );
    }

    if (criteria.memberCount) {
      if (criteria.memberCount.min) {
        filteredGroups = filteredGroups.filter(group => group.memberCount >= criteria.memberCount!.min!);
      }
      if (criteria.memberCount.max) {
        filteredGroups = filteredGroups.filter(group => group.memberCount <= criteria.memberCount!.max!);
      }
    }

    if (criteria.hasActiveProjects) {
      filteredGroups = filteredGroups.filter(group => group.projectCount > 0);
    }

    // Sort results
    const sortBy = criteria.sortBy || 'relevance';
    const sortOrder = criteria.sortOrder || 'desc';

    filteredGroups.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'members':
          comparison = a.memberCount - b.memberCount;
          break;
        case 'activity':
          comparison = a.statistics.collaborationScore - b.statistics.collaborationScore;
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        default: // relevance
          comparison = (a.isVerified ? 1 : 0) - (b.isVerified ? 1 : 0) ||
                      a.memberCount - b.memberCount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const page = criteria.page || 1;
    const limit = criteria.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      groups: filteredGroups.slice(startIndex, endIndex),
      total: filteredGroups.length,
      page
    };
  }

  /**
   * Get group by ID
   */
  public async getGroup(groupId: string): Promise<WritingGroup | null> {
    return this.groups.get(groupId) || null;
  }

  /**
   * Get user's group memberships
   */
  public async getUserMemberships(userId: string): Promise<GroupMember[]> {
    return this.memberships.get(userId) || [];
  }

  /**
   * Get group members
   */
  public async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const allMemberships = Array.from(this.memberships.values()).flat();
    return allMemberships.filter(member => member.groupId === groupId);
  }

  /**
   * Join a group
   */
  public async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    if (group.type === 'private' || group.type === 'invite-only') {
      throw new Error('Group requires invitation');
    }

    if (group.memberCount >= group.settings.maxMembersCount) {
      throw new Error('Group is at maximum capacity');
    }

    const existingMember = await this.getGroupMember(groupId, userId);
    if (existingMember) {
      throw new Error('Already a member of this group');
    }

    const now = new Date();
    const newMember: GroupMember = {
      userId,
      groupId,
      username: `User ${userId}`, // Would come from user service
      displayName: `User ${userId}`,
      role: 'member',
      permissions: this.getDefaultPermissions('member'),
      joinedAt: now,
      lastActive: now,
      status: 'active',
      contributions: {
        wordsContributed: 0,
        projectsCreated: 0,
        projectsContributed: 0,
        feedbackGiven: 0,
        feedbackReceived: 0,
        sessionsHosted: 0,
        sessionsAttended: 0,
        helpfulVotes: 0,
        mentorshipHours: 0
      },
      badges: [{
        id: 'new-member',
        name: 'New Member',
        description: 'Joined the group',
        icon: '🌟',
        color: 'blue',
        earnedAt: now
      }],
      specialties: [],
      timezone: 'UTC',
      preferences: {
        notificationTypes: ['new-projects', 'group-announcements'],
        availableHours: [],
        preferredGenres: [],
        readingSpeed: 'normal',
        feedbackStyle: 'balanced',
        expertiseAreas: [],
        mentorshipOffered: false,
        mentorshipSought: false
      }
    };

    // Update group member count
    group.memberCount++;
    group.updatedAt = now;

    this.addMemberToGroup(newMember);
    this.recordActivity(groupId, {
      type: 'member-joined',
      actorId: userId,
      actorName: newMember.displayName,
      description: `${newMember.displayName} joined the group`,
      isPublic: true
    });

    return newMember;
  }

  /**
   * Invite users to group
   */
  public async inviteToGroup(
    groupId: string, 
    inviterId: string, 
    inviteeEmails: string[], 
    role: GroupRole = 'member',
    message?: string
  ): Promise<GroupInvitation[]> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const inviter = await this.getGroupMember(groupId, inviterId);
    if (!inviter || !inviter.permissions.canInviteMembers) {
      throw new Error('Not authorized to invite members');
    }

    const invitations: GroupInvitation[] = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    for (const email of inviteeEmails) {
      const invitation: GroupInvitation = {
        id: this.generateId(),
        groupId,
        groupName: group.name,
        inviterId,
        inviterName: inviter.displayName,
        inviteeEmail: email,
        role,
        message,
        status: 'pending',
        createdAt: now,
        expiresAt
      };

      invitations.push(invitation);
    }

    // Store invitations
    const existingInvitations = this.invitations.get(groupId) || [];
    this.invitations.set(groupId, [...existingInvitations, ...invitations]);

    this.recordActivity(groupId, {
      type: 'member-joined',
      actorId: inviterId,
      actorName: inviter.displayName,
      description: `${inviter.displayName} sent ${invitations.length} invitation(s)`,
      isPublic: false
    });

    return invitations;
  }

  /**
   * Accept group invitation
   */
  public async acceptInvitation(invitationId: string, userId: string): Promise<GroupMember> {
    const invitation = this.findInvitation(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      throw new Error('Invitation has expired');
    }

    const group = this.groups.get(invitation.groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Create member
    const now = new Date();
    const newMember: GroupMember = {
      userId,
      groupId: invitation.groupId,
      username: `User ${userId}`,
      displayName: `User ${userId}`,
      role: invitation.role,
      permissions: this.getDefaultPermissions(invitation.role),
      joinedAt: now,
      lastActive: now,
      status: 'active',
      contributions: {
        wordsContributed: 0,
        projectsCreated: 0,
        projectsContributed: 0,
        feedbackGiven: 0,
        feedbackReceived: 0,
        sessionsHosted: 0,
        sessionsAttended: 0,
        helpfulVotes: 0,
        mentorshipHours: 0
      },
      badges: [{
        id: 'invited-member',
        name: 'Invited Member',
        description: 'Joined by invitation',
        icon: '📨',
        color: 'green',
        earnedAt: now
      }],
      specialties: [],
      timezone: 'UTC',
      preferences: {
        notificationTypes: ['new-projects', 'group-announcements'],
        availableHours: [],
        preferredGenres: [],
        readingSpeed: 'normal',
        feedbackStyle: 'balanced',
        expertiseAreas: [],
        mentorshipOffered: false,
        mentorshipSought: false
      }
    };

    // Update invitation status
    invitation.status = 'accepted';

    // Update group member count
    group.memberCount++;
    group.updatedAt = now;

    this.addMemberToGroup(newMember);
    this.recordActivity(invitation.groupId, {
      type: 'member-joined',
      actorId: userId,
      actorName: newMember.displayName,
      description: `${newMember.displayName} accepted an invitation and joined`,
      isPublic: true
    });

    return newMember;
  }

  /**
   * Leave a group
   */
  public async leaveGroup(groupId: string, userId: string): Promise<void> {
    const member = await this.getGroupMember(groupId, userId);
    if (!member) {
      throw new Error('Not a member of this group');
    }

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user is the only admin
    const members = await this.getGroupMembers(groupId);
    const admins = members.filter(m => m.role === 'admin');
    
    if (member.role === 'admin' && admins.length === 1) {
      throw new Error('Cannot leave group as the only admin. Transfer ownership first.');
    }

    // Remove member
    const userMemberships = this.memberships.get(userId) || [];
    this.memberships.set(
      userId,
      userMemberships.filter(m => m.groupId !== groupId)
    );

    // Update group member count
    group.memberCount--;
    group.updatedAt = new Date();

    this.recordActivity(groupId, {
      type: 'member-left',
      actorId: userId,
      actorName: member.displayName,
      description: `${member.displayName} left the group`,
      isPublic: true
    });
  }

  /**
   * Update member role and permissions
   */
  public async updateMemberRole(
    groupId: string, 
    memberId: string, 
    newRole: GroupRole, 
    updatedBy: string
  ): Promise<GroupMember> {
    const updater = await this.getGroupMember(groupId, updatedBy);
    if (!updater || !updater.permissions.canManageMembers) {
      throw new Error('Not authorized to manage members');
    }

    const member = await this.getGroupMember(groupId, memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const oldRole = member.role;
    member.role = newRole;
    member.permissions = this.getDefaultPermissions(newRole);

    this.recordActivity(groupId, {
      type: 'member-joined', // Using existing type for role changes
      actorId: updatedBy,
      actorName: updater.displayName,
      description: `${updater.displayName} changed ${member.displayName}'s role from ${oldRole} to ${newRole}`,
      isPublic: false
    });

    return member;
  }

  /**
   * Get group activities
   */
  public async getGroupActivities(groupId: string, limit = 50): Promise<GroupActivity[]> {
    const activities = this.activities.get(groupId) || [];
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get group achievements
   */
  public async getGroupAchievements(groupId: string): Promise<GroupAchievement[]> {
    return this.achievements.get(groupId) || [];
  }

  /**
   * Create group project
   */
  public async createGroupProject(
    groupId: string,
    creatorId: string,
    projectData: Partial<GroupProject>
  ): Promise<GroupProject> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const creator = await this.getGroupMember(groupId, creatorId);
    if (!creator || !creator.permissions.canCreateProjects) {
      throw new Error('Not authorized to create projects');
    }

    const now = new Date();
    const project: GroupProject = {
      id: this.generateId(),
      groupId,
      title: projectData.title || 'Untitled Project',
      description: projectData.description || '',
      type: projectData.type || 'collaborative-novel',
      genre: projectData.genre || [],
      tags: projectData.tags || [],
      status: 'planning',
      visibility: projectData.visibility || 'group-only',
      createdBy: creatorId,
      createdAt: now,
      updatedAt: now,
      currentWordCount: 0,
      contributors: [{
        userId: creatorId,
        username: creator.username,
        role: 'lead-author',
        permissions: {
          canEdit: true,
          canComment: true,
          canSuggestChanges: true,
          canApproveChanges: true,
          canInviteReaders: true,
          canManageWorkflow: true,
          canViewAnalytics: true
        },
        assignedSections: [],
        wordCount: 0,
        lastContribution: now,
        contributionHistory: []
      }],
      betaReaders: [],
      editors: [],
      settings: {
        allowPublicReading: false,
        requireBetaAgreement: true,
        trackVersions: true,
        enableComments: true,
        enableSuggestions: true,
        autoSave: true,
        conflictResolution: 'manual',
        deadlineReminders: true,
        progressSharing: 'group'
      },
      workflow: {
        id: this.generateId(),
        projectId: '',
        name: 'Standard Editorial Workflow',
        description: 'Standard workflow for collaborative projects',
        stages: [],
        currentStage: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        settings: {
          autoAssignment: false,
          deadlineReminders: true,
          escalationRules: [],
          qualityGates: [],
          integrations: [],
          notifications: {
            stageStart: true,
            stageComplete: true,
            approvalRequired: true,
            deadlineApproaching: true,
            workflowComplete: true,
            escalations: true,
            customRules: []
          }
        },
        analytics: {
          totalDuration: 0,
          averageStageTime: 0,
          bottleneckStages: [],
          approvalTimes: {},
          reworkCycles: 0,
          qualityScores: {},
          participantContributions: {},
          deadlineAdherence: 100
        }
      },
      analytics: {
        overview: {
          status: 'planning',
          completion: 0,
          wordsWritten: 0,
          targetWords: projectData.targetWordCount || 50000,
          contributors: 1,
          healthScore: 100
        },
        progress: {
          daily: [],
          weekly: [],
          velocity: {
            current: 0,
            average: 0,
            trend: 'stable',
            predictedCompletion: new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)),
            confidence: 50
          },
          milestones: [],
          bottlenecks: []
        },
        collaboration: {
          teamSize: 1,
          activeContributors: 1,
          contributionBalance: 100,
          communicationScore: 100,
          conflictRate: 0,
          satisfactionScore: 100
        },
        quality: {
          overallScore: 0,
          readabilityScore: 0,
          consistencyScore: 0,
          completenessScore: 0,
          feedbackScore: 0,
          improvementTrend: 'stable'
        },
        timeline: {
          plannedDuration: 90,
          estimatedCompletion: new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)),
          bufferTime: 14,
          riskFactors: [],
          contingencies: []
        },
        predictions: {
          completion: {
            mostLikely: new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)),
            best: {
              case: new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)),
              probability: 20
            },
            worst: {
              case: new Date(now.getTime() + (120 * 24 * 60 * 60 * 1000)),
              probability: 30
            },
            confidence: 70,
            factors: ['team-size', 'complexity', 'experience']
          },
          quality: {
            finalScore: 85,
            confidence: 60,
            improvementAreas: ['pacing', 'character-development'],
            requiredInterventions: ['beta-reader-feedback', 'professional-editing']
          },
          resources: {
            additionalHours: 100,
            additionalContributors: 0,
            skillGaps: [],
            trainingNeeds: []
          },
          risks: []
        }
      },
      chapters: [],
      resources: [],
      discussions: [],
      milestones: []
    };

    // Update project reference
    project.workflow.projectId = project.id;

    // Update group stats
    group.projectCount++;
    group.statistics.totalProjects++;
    group.updatedAt = now;

    // Update creator contributions
    creator.contributions.projectsCreated++;

    this.recordActivity(groupId, {
      type: 'project-created',
      actorId: creatorId,
      actorName: creator.displayName,
      description: `${creator.displayName} created project "${project.title}"`,
      metadata: { projectId: project.id, projectTitle: project.title },
      isPublic: true
    });

    return project;
  }

  /**
   * Get member by user ID and group ID
   */
  private async getGroupMember(groupId: string, userId: string): Promise<GroupMember | null> {
    const userMemberships = this.memberships.get(userId) || [];
    return userMemberships.find(member => member.groupId === groupId) || null;
  }

  /**
   * Add member to group
   */
  private addMemberToGroup(member: GroupMember): void {
    const userMemberships = this.memberships.get(member.userId) || [];
    userMemberships.push(member);
    this.memberships.set(member.userId, userMemberships);
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: GroupRole): GroupPermissions {
    const permissions: Record<GroupRole, GroupPermissions> = {
      admin: {
        canEditGroup: true,
        canManageMembers: true,
        canModerateContent: true,
        canCreateProjects: true,
        canInviteMembers: true,
        canStartSessions: true,
        canAccessAnalytics: true,
        canManageEvents: true,
        canUseAdvancedFeatures: true
      },
      moderator: {
        canEditGroup: false,
        canManageMembers: true,
        canModerateContent: true,
        canCreateProjects: true,
        canInviteMembers: true,
        canStartSessions: true,
        canAccessAnalytics: true,
        canManageEvents: true,
        canUseAdvancedFeatures: true
      },
      member: {
        canEditGroup: false,
        canManageMembers: false,
        canModerateContent: false,
        canCreateProjects: true,
        canInviteMembers: true,
        canStartSessions: true,
        canAccessAnalytics: false,
        canManageEvents: false,
        canUseAdvancedFeatures: false
      },
      'beta-reader': {
        canEditGroup: false,
        canManageMembers: false,
        canModerateContent: false,
        canCreateProjects: false,
        canInviteMembers: false,
        canStartSessions: false,
        canAccessAnalytics: false,
        canManageEvents: false,
        canUseAdvancedFeatures: false
      },
      editor: {
        canEditGroup: false,
        canManageMembers: false,
        canModerateContent: false,
        canCreateProjects: true,
        canInviteMembers: false,
        canStartSessions: true,
        canAccessAnalytics: false,
        canManageEvents: false,
        canUseAdvancedFeatures: true
      },
      guest: {
        canEditGroup: false,
        canManageMembers: false,
        canModerateContent: false,
        canCreateProjects: false,
        canInviteMembers: false,
        canStartSessions: false,
        canAccessAnalytics: false,
        canManageEvents: false,
        canUseAdvancedFeatures: false
      }
    };

    return permissions[role];
  }

  /**
   * Record group activity
   */
  private recordActivity(groupId: string, activity: Omit<GroupActivity, 'id' | 'groupId' | 'timestamp'>): void {
    const fullActivity: GroupActivity = {
      id: this.generateId(),
      groupId,
      timestamp: new Date(),
      ...activity
    };

    const groupActivities = this.activities.get(groupId) || [];
    groupActivities.push(fullActivity);
    
    // Keep only last 1000 activities
    if (groupActivities.length > 1000) {
      groupActivities.splice(0, groupActivities.length - 1000);
    }
    
    this.activities.set(groupId, groupActivities);
  }

  /**
   * Find invitation by ID
   */
  private findInvitation(invitationId: string): GroupInvitation | null {
    for (const invitations of this.invitations.values()) {
      const found = invitations.find(inv => inv.id === invitationId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Initialize with mock data
   */
  private initializeWithMockData(): void {
    // Sample groups for demonstration
    const now = new Date();
    
    const fantasyWritersGroup: WritingGroup = {
      id: 'group-1',
      name: 'Fantasy Writers United',
      description: 'A community for fantasy writers to collaborate, share feedback, and create epic stories together.',
      type: 'public',
      category: 'fiction',
      tags: ['fantasy', 'world-building', 'collaboration', 'feedback'],
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      createdBy: 'user-1',
      createdAt: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
      updatedAt: now,
      memberCount: 15,
      projectCount: 3,
      isVerified: true,
      settings: {
        canMembersInvite: true,
        canMembersCreateProjects: true,
        canMembersStartSessions: true,
        requireApprovalForPosts: false,
        allowGuestReaders: true,
        autoModeration: true,
        wordFilter: [],
        maxProjectsPerMember: 5,
        maxMembersCount: 100,
        allowVideoChat: true,
        allowVoiceNotes: true,
        enableNotifications: true,
        quietHours: { start: '22:00', end: '08:00' },
        allowedFileTypes: ['txt', 'doc', 'docx', 'pdf', 'md'],
        maxFileSize: 10485760,
        requireContentWarnings: true,
      },
      statistics: {
        totalWords: 150000,
        totalProjects: 5,
        totalSessions: 25,
        averageSessionLength: 90,
        mostActiveHour: 19,
        weeklyActivity: [5, 8, 12, 15, 18, 10, 6],
        topGenres: ['fantasy', 'epic-fantasy', 'urban-fantasy'],
        collaborationScore: 92
      }
    };

    const sciFiGroup: WritingGroup = {
      id: 'group-2',
      name: 'Science Fiction Collective',
      description: 'Exploring the future through collaborative storytelling and scientific speculation.',
      type: 'invite-only',
      category: 'fiction',
      tags: ['science-fiction', 'hard-sf', 'cyberpunk', 'space-opera'],
      createdBy: 'user-2',
      createdAt: new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000)),
      updatedAt: now,
      memberCount: 8,
      projectCount: 2,
      isVerified: true,
      settings: {
        canMembersInvite: false,
        canMembersCreateProjects: true,
        canMembersStartSessions: true,
        requireApprovalForPosts: true,
        allowGuestReaders: false,
        autoModeration: true,
        wordFilter: [],
        maxProjectsPerMember: 3,
        maxMembersCount: 25,
        allowVideoChat: true,
        allowVoiceNotes: true,
        enableNotifications: true,
        quietHours: { start: '23:00', end: '07:00' },
        allowedFileTypes: ['txt', 'doc', 'docx', 'pdf', 'md'],
        maxFileSize: 10485760,
        requireContentWarnings: false,
      },
      statistics: {
        totalWords: 75000,
        totalProjects: 3,
        totalSessions: 15,
        averageSessionLength: 120,
        mostActiveHour: 20,
        weeklyActivity: [3, 5, 8, 10, 12, 7, 4],
        topGenres: ['science-fiction', 'hard-sf', 'cyberpunk'],
        collaborationScore: 88
      }
    };

    this.groups.set(fantasyWritersGroup.id, fantasyWritersGroup);
    this.groups.set(sciFiGroup.id, sciFiGroup);

    // Add some sample activities
    this.recordActivity('group-1', {
      type: 'project-created',
      actorId: 'user-1',
      actorName: 'Alice Writer',
      description: 'Alice Writer created project "The Dragon\'s Alliance"',
      metadata: { projectId: 'project-1' },
      isPublic: true
    });

    this.recordActivity('group-1', {
      type: 'member-joined',
      actorId: 'user-3',
      actorName: 'Bob Fantasy',
      description: 'Bob Fantasy joined the group',
      isPublic: true
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const writingGroupService = WritingGroupService.getInstance();