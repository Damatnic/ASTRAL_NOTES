import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

export interface Notification {
  id: string;
  type: 'collaboration' | 'comment' | 'mention' | 'access' | 'conflict' | 'system';
  category: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  recipientId: string;
  senderId?: string;
  projectId?: string;
  entityId?: string;
  entityType?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isActionable: boolean;
  actions?: NotificationAction[];
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'api_call';
  action: string;
  style: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  collaborationUpdates: boolean;
  commentNotifications: boolean;
  mentionNotifications: boolean;
  accessRequestNotifications: boolean;
  conflictAlerts: boolean;
  systemNotifications: boolean;
  digestFrequency: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
  };
}

export interface ActivityFeedItem {
  id: string;
  type: 'document_edit' | 'comment_added' | 'user_joined' | 'user_left' | 'conflict_resolved' | 'entity_shared';
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  projectId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export class NotificationService {
  private notifications = new Map<string, Notification[]>();
  private preferences = new Map<string, NotificationPreferences>();
  private activityFeed = new Map<string, ActivityFeedItem[]>();

  constructor(
    private io: Server,
    private prisma: PrismaClient
  ) {
    this.setupNotificationHandlers();
    this.startNotificationProcessor();
  }

  private setupNotificationHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId!;

      // Send pending notifications to newly connected user
      socket.on('request-notifications', async () => {
        const userNotifications = await this.getUserNotifications(userId);
        socket.emit('notifications-update', userNotifications);
      });

      // Mark notifications as read
      socket.on('mark-notifications-read', async (notificationIds: string[]) => {
        await this.markNotificationsAsRead(userId, notificationIds);
      });

      // Update notification preferences
      socket.on('update-notification-preferences', async (preferences: Partial<NotificationPreferences>) => {
        await this.updateNotificationPreferences(userId, preferences);
      });

      // Request activity feed
      socket.on('request-activity-feed', async (projectId?: string) => {
        const activityItems = await this.getActivityFeed(userId, projectId);
        socket.emit('activity-feed-update', activityItems);
      });
    });
  }

  // Core Notification Methods
  async createNotification(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<Notification> {
    try {
      const fullNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isRead: false,
        createdAt: new Date(),
        ...notification
      };

      // Store notification
      if (!this.notifications.has(notification.recipientId)) {
        this.notifications.set(notification.recipientId, []);
      }
      this.notifications.get(notification.recipientId)!.push(fullNotification);

      // Check user preferences before sending
      const preferences = await this.getUserPreferences(notification.recipientId);
      if (this.shouldSendNotification(fullNotification, preferences)) {
        // Send real-time notification
        this.io.to(`user-${notification.recipientId}`).emit('new-notification', fullNotification);

        // Send email if enabled
        if (preferences.emailNotifications && this.shouldSendEmail(fullNotification, preferences)) {
          await this.sendEmailNotification(fullNotification);
        }
      }

      logger.info(`Created notification ${fullNotification.id} for user ${notification.recipientId}`);
      return fullNotification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
  }): Promise<Notification[]> {
    try {
      let userNotifications = this.notifications.get(userId) || [];

      // Apply filters
      if (options?.unreadOnly) {
        userNotifications = userNotifications.filter(n => !n.isRead);
      }

      if (options?.category) {
        userNotifications = userNotifications.filter(n => n.category === options.category);
      }

      // Remove expired notifications
      const now = new Date();
      userNotifications = userNotifications.filter(n => !n.expiresAt || n.expiresAt > now);

      // Sort by creation date (newest first)
      userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 50;
      
      return userNotifications.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      const userNotifications = this.notifications.get(userId);
      if (!userNotifications) return;

      for (const notification of userNotifications) {
        if (notificationIds.includes(notification.id)) {
          notification.isRead = true;
          notification.readAt = new Date();
        }
      }

      // Emit update to user
      this.io.to(`user-${userId}`).emit('notifications-marked-read', notificationIds);

      logger.info(`Marked ${notificationIds.length} notifications as read for user ${userId}`);
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
    }
  }

  // Collaboration Notifications
  async notifyDocumentEdit(data: {
    documentId: string;
    documentType: 'scene' | 'note' | 'character' | 'location';
    documentTitle: string;
    editorId: string;
    editorName: string;
    projectId: string;
    changeType: 'created' | 'updated' | 'deleted';
    changeDescription?: string;
  }): Promise<void> {
    try {
      // Get project collaborators
      const collaborators = await this.getProjectCollaborators(data.projectId);
      
      // Notify all collaborators except the editor
      for (const collaborator of collaborators) {
        if (collaborator.userId === data.editorId) continue;

        await this.createNotification({
          type: 'collaboration',
          category: 'document_edit',
          title: `Document ${data.changeType}`,
          message: `${data.editorName} ${data.changeType} "${data.documentTitle}"`,
          metadata: {
            documentId: data.documentId,
            documentType: data.documentType,
            editorId: data.editorId,
            changeType: data.changeType,
            changeDescription: data.changeDescription
          },
          recipientId: collaborator.userId,
          senderId: data.editorId,
          projectId: data.projectId,
          entityId: data.documentId,
          entityType: data.documentType,
          priority: 'low',
          isActionable: true,
          actions: [{
            id: 'view-document',
            label: 'View Document',
            type: 'link',
            action: `/projects/${data.projectId}/${data.documentType}s/${data.documentId}`,
            style: 'primary'
          }]
        });

        // Add to activity feed
        await this.addActivityFeedItem({
          type: 'document_edit',
          actorId: data.editorId,
          actorName: data.editorName,
          action: data.changeType,
          targetType: data.documentType,
          targetId: data.documentId,
          targetName: data.documentTitle,
          projectId: data.projectId,
          metadata: {
            changeDescription: data.changeDescription
          }
        });
      }
    } catch (error) {
      logger.error('Error notifying document edit:', error);
    }
  }

  async notifyUserJoined(data: {
    userId: string;
    username: string;
    projectId: string;
    documentId?: string;
    documentType?: string;
    joinType: 'project' | 'document' | 'session';
  }): Promise<void> {
    try {
      const collaborators = await this.getProjectCollaborators(data.projectId);
      
      for (const collaborator of collaborators) {
        if (collaborator.userId === data.userId) continue;

        let message = '';
        let actionLabel = '';
        let actionLink = '';

        switch (data.joinType) {
          case 'project':
            message = `${data.username} joined the project`;
            actionLabel = 'View Project';
            actionLink = `/projects/${data.projectId}`;
            break;
          case 'document':
            message = `${data.username} is editing a document`;
            actionLabel = 'View Document';
            actionLink = `/projects/${data.projectId}/${data.documentType}s/${data.documentId}`;
            break;
          case 'session':
            message = `${data.username} joined a collaboration session`;
            actionLabel = 'Join Session';
            actionLink = `/projects/${data.projectId}/collaborate`;
            break;
        }

        await this.createNotification({
          type: 'collaboration',
          category: 'user_activity',
          title: 'User Activity',
          message,
          metadata: {
            joinType: data.joinType,
            documentId: data.documentId,
            documentType: data.documentType
          },
          recipientId: collaborator.userId,
          senderId: data.userId,
          projectId: data.projectId,
          priority: 'low',
          isActionable: true,
          actions: [{
            id: 'view-activity',
            label: actionLabel,
            type: 'link',
            action: actionLink,
            style: 'secondary'
          }]
        });
      }

      // Add to activity feed
      await this.addActivityFeedItem({
        type: 'user_joined',
        actorId: data.userId,
        actorName: data.username,
        action: 'joined',
        targetType: data.joinType,
        targetId: data.documentId || data.projectId,
        targetName: data.joinType,
        projectId: data.projectId,
        metadata: {
          joinType: data.joinType
        }
      });
    } catch (error) {
      logger.error('Error notifying user joined:', error);
    }
  }

  async notifyComment(data: {
    commentId: string;
    content: string;
    authorId: string;
    authorName: string;
    entityId: string;
    entityType: string;
    entityTitle: string;
    projectId: string;
    mentions?: string[];
  }): Promise<void> {
    try {
      // Notify mentioned users
      if (data.mentions && data.mentions.length > 0) {
        for (const mentionedUserId of data.mentions) {
          await this.createNotification({
            type: 'mention',
            category: 'comment_mention',
            title: 'You were mentioned',
            message: `${data.authorName} mentioned you in a comment on "${data.entityTitle}"`,
            metadata: {
              commentId: data.commentId,
              content: data.content.substring(0, 200),
              entityId: data.entityId,
              entityType: data.entityType
            },
            recipientId: mentionedUserId,
            senderId: data.authorId,
            projectId: data.projectId,
            entityId: data.entityId,
            entityType: data.entityType,
            priority: 'medium',
            isActionable: true,
            actions: [{
              id: 'view-comment',
              label: 'View Comment',
              type: 'link',
              action: `/projects/${data.projectId}/${data.entityType}s/${data.entityId}#comment-${data.commentId}`,
              style: 'primary'
            }]
          });
        }
      }

      // Notify project collaborators about new comment
      const collaborators = await this.getProjectCollaborators(data.projectId);
      
      for (const collaborator of collaborators) {
        if (collaborator.userId === data.authorId || data.mentions?.includes(collaborator.userId)) {
          continue; // Skip author and mentioned users (already notified)
        }

        await this.createNotification({
          type: 'comment',
          category: 'new_comment',
          title: 'New Comment',
          message: `${data.authorName} commented on "${data.entityTitle}"`,
          metadata: {
            commentId: data.commentId,
            content: data.content.substring(0, 200),
            entityId: data.entityId,
            entityType: data.entityType
          },
          recipientId: collaborator.userId,
          senderId: data.authorId,
          projectId: data.projectId,
          entityId: data.entityId,
          entityType: data.entityType,
          priority: 'low',
          isActionable: true,
          actions: [{
            id: 'view-comment',
            label: 'View Comment',
            type: 'link',
            action: `/projects/${data.projectId}/${data.entityType}s/${data.entityId}#comment-${data.commentId}`,
            style: 'secondary'
          }]
        });
      }

      // Add to activity feed
      await this.addActivityFeedItem({
        type: 'comment_added',
        actorId: data.authorId,
        actorName: data.authorName,
        action: 'commented on',
        targetType: data.entityType,
        targetId: data.entityId,
        targetName: data.entityTitle,
        projectId: data.projectId,
        metadata: {
          commentId: data.commentId,
          content: data.content.substring(0, 100)
        }
      });
    } catch (error) {
      logger.error('Error notifying comment:', error);
    }
  }

  async notifyConflictDetected(data: {
    conflictId: string;
    documentId: string;
    documentTitle: string;
    documentType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    participants: Array<{ userId: string; username: string }>;
    projectId: string;
  }): Promise<void> {
    try {
      const priority = data.severity === 'critical' ? 'urgent' : 
                     data.severity === 'high' ? 'high' : 'medium';

      for (const participant of data.participants) {
        await this.createNotification({
          type: 'conflict',
          category: 'conflict_detected',
          title: 'Editing Conflict Detected',
          message: `A ${data.severity} conflict was detected in "${data.documentTitle}"`,
          metadata: {
            conflictId: data.conflictId,
            documentId: data.documentId,
            documentType: data.documentType,
            severity: data.severity,
            participants: data.participants.map(p => p.username)
          },
          recipientId: participant.userId,
          projectId: data.projectId,
          entityId: data.documentId,
          entityType: data.documentType,
          priority,
          isActionable: true,
          actions: [
            {
              id: 'resolve-conflict',
              label: 'Resolve Conflict',
              type: 'link',
              action: `/projects/${data.projectId}/conflicts/${data.conflictId}`,
              style: 'warning'
            },
            {
              id: 'view-document',
              label: 'View Document',
              type: 'link',
              action: `/projects/${data.projectId}/${data.documentType}s/${data.documentId}`,
              style: 'secondary'
            }
          ]
        });
      }
    } catch (error) {
      logger.error('Error notifying conflict detected:', error);
    }
  }

  async notifyConflictResolved(data: {
    conflictId: string;
    documentId: string;
    documentTitle: string;
    documentType: string;
    resolvedBy: string;
    resolverName: string;
    resolutionType: string;
    participants: Array<{ userId: string; username: string }>;
    projectId: string;
  }): Promise<void> {
    try {
      for (const participant of data.participants) {
        if (participant.userId === data.resolvedBy) continue; // Skip resolver

        await this.createNotification({
          type: 'conflict',
          category: 'conflict_resolved',
          title: 'Conflict Resolved',
          message: `${data.resolverName} resolved the conflict in "${data.documentTitle}" using ${data.resolutionType}`,
          metadata: {
            conflictId: data.conflictId,
            documentId: data.documentId,
            documentType: data.documentType,
            resolvedBy: data.resolvedBy,
            resolutionType: data.resolutionType
          },
          recipientId: participant.userId,
          senderId: data.resolvedBy,
          projectId: data.projectId,
          entityId: data.documentId,
          entityType: data.documentType,
          priority: 'medium',
          isActionable: true,
          actions: [{
            id: 'view-document',
            label: 'View Updated Document',
            type: 'link',
            action: `/projects/${data.projectId}/${data.documentType}s/${data.documentId}`,
            style: 'primary'
          }]
        });
      }

      // Add to activity feed
      await this.addActivityFeedItem({
        type: 'conflict_resolved',
        actorId: data.resolvedBy,
        actorName: data.resolverName,
        action: 'resolved conflict in',
        targetType: data.documentType,
        targetId: data.documentId,
        targetName: data.documentTitle,
        projectId: data.projectId,
        metadata: {
          conflictId: data.conflictId,
          resolutionType: data.resolutionType
        }
      });
    } catch (error) {
      logger.error('Error notifying conflict resolved:', error);
    }
  }

  // Activity Feed
  async addActivityFeedItem(item: Omit<ActivityFeedItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const activityItem: ActivityFeedItem = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...item
      };

      // Add to project activity feed
      if (item.projectId) {
        if (!this.activityFeed.has(item.projectId)) {
          this.activityFeed.set(item.projectId, []);
        }
        const projectFeed = this.activityFeed.get(item.projectId)!;
        projectFeed.unshift(activityItem);
        
        // Keep only last 1000 items
        if (projectFeed.length > 1000) {
          projectFeed.splice(1000);
        }

        // Emit to project participants
        this.io.to(`project-${item.projectId}`).emit('activity-feed-item', activityItem);
      }
    } catch (error) {
      logger.error('Error adding activity feed item:', error);
    }
  }

  async getActivityFeed(userId: string, projectId?: string, limit: number = 50): Promise<ActivityFeedItem[]> {
    try {
      if (projectId) {
        // Get project-specific activity feed
        const projectFeed = this.activityFeed.get(projectId) || [];
        return projectFeed.slice(0, limit);
      } else {
        // Get activity from all user's projects
        const userProjects = await this.getUserProjects(userId);
        const allActivity: ActivityFeedItem[] = [];

        for (const project of userProjects) {
          const projectFeed = this.activityFeed.get(project.id) || [];
          allActivity.push(...projectFeed);
        }

        // Sort by timestamp and limit
        allActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return allActivity.slice(0, limit);
      }
    } catch (error) {
      logger.error('Error getting activity feed:', error);
      return [];
    }
  }

  // Notification Preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      this.preferences.set(userId, updatedPreferences);
      
      // In production, this would be stored in the database
      logger.info(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
    }
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences: NotificationPreferences = {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      collaborationUpdates: true,
      commentNotifications: true,
      mentionNotifications: true,
      accessRequestNotifications: true,
      conflictAlerts: true,
      systemNotifications: true,
      digestFrequency: 'instant',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      }
    };

    return this.preferences.get(userId) || defaultPreferences;
  }

  // Utility Methods
  private shouldSendNotification(notification: Notification, preferences: NotificationPreferences): boolean {
    // Check if notifications are enabled for this type
    switch (notification.type) {
      case 'collaboration':
        return preferences.collaborationUpdates;
      case 'comment':
        return preferences.commentNotifications;
      case 'mention':
        return preferences.mentionNotifications;
      case 'access':
        return preferences.accessRequestNotifications;
      case 'conflict':
        return preferences.conflictAlerts;
      case 'system':
        return preferences.systemNotifications;
      default:
        return true;
    }
  }

  private shouldSendEmail(notification: Notification, preferences: NotificationPreferences): boolean {
    // Check digest frequency and quiet hours
    if (preferences.digestFrequency === 'never') return false;
    
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().substr(0, 5);
      
      if (currentTime >= preferences.quietHours.startTime || 
          currentTime <= preferences.quietHours.endTime) {
        return false;
      }
    }

    return preferences.digestFrequency === 'instant' || notification.priority === 'urgent';
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Email sending logic would go here
    logger.info(`Would send email notification ${notification.id} to user ${notification.recipientId}`);
  }

  private async getProjectCollaborators(projectId: string): Promise<Array<{ userId: string; role: string }>> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          collaborators: {
            include: {
              user: {
                select: { id: true }
              }
            }
          },
          owner: {
            select: { id: true }
          }
        }
      });

      if (!project) return [];

      const collaborators = [
        { userId: project.owner.id, role: 'owner' },
        ...project.collaborators.map(c => ({ userId: c.user.id, role: c.role }))
      ];

      return collaborators;
    } catch (error) {
      logger.error('Error getting project collaborators:', error);
      return [];
    }
  }

  private async getUserProjects(userId: string): Promise<Array<{ id: string; title: string }>> {
    try {
      const ownedProjects = await this.prisma.project.findMany({
        where: { ownerId: userId },
        select: { id: true, title: true }
      });

      const collaboratedProjects = await this.prisma.projectCollaborator.findMany({
        where: { userId },
        include: {
          project: {
            select: { id: true, title: true }
          }
        }
      });

      return [
        ...ownedProjects,
        ...collaboratedProjects.map(c => c.project)
      ];
    } catch (error) {
      logger.error('Error getting user projects:', error);
      return [];
    }
  }

  private startNotificationProcessor(): void {
    // Background processor for digest notifications, cleanup, etc.
    setInterval(() => {
      this.processDigestNotifications();
      this.cleanupExpiredNotifications();
    }, 60000); // Run every minute
  }

  private async processDigestNotifications(): Promise<void> {
    // Process digest notifications based on user preferences
    // This would batch notifications for users who prefer daily/weekly digests
  }

  private cleanupExpiredNotifications(): void {
    const now = new Date();
    
    for (const [userId, notifications] of this.notifications.entries()) {
      const validNotifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
      this.notifications.set(userId, validNotifications);
    }
  }

  // Public API
  public getNotificationStats(): any {
    const totalNotifications = Array.from(this.notifications.values())
      .reduce((total, userNotifs) => total + userNotifs.length, 0);
    
    const unreadNotifications = Array.from(this.notifications.values())
      .reduce((total, userNotifs) => total + userNotifs.filter(n => !n.isRead).length, 0);

    return {
      totalNotifications,
      unreadNotifications,
      activeUsers: this.notifications.size,
      activityFeedItems: Array.from(this.activityFeed.values())
        .reduce((total, feed) => total + feed.length, 0)
    };
  }
}