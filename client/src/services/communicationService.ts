/**
 * Communication Service
 * Handles video conferencing, voice notes, screen sharing, chat channels, and notifications
 */

import type {
  CommunicationChannel,
  VideoConference,
  VoiceNote,
  ScreenShare,
  ChatMessage,
  TranslationRequest,
  CommunicationMetrics,
  CreateChannelData,
  CreateConferenceData,
  SendMessageData,
  VoiceNoteData,
  ScreenShareData,
  NotificationData
} from '@/types/collaboration';

class CommunicationService {
  private static instance: CommunicationService;
  private channels: CommunicationChannel[] = [];
  private conferences: VideoConference[] = [];
  private voiceNotes: VoiceNote[] = [];
  private screenShares: ScreenShare[] = [];
  private messages: ChatMessage[] = [];
  private notifications: NotificationData[] = [];
  private translationCache = new Map<string, string>();

  public static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
      CommunicationService.instance.initializeMockData();
    }
    return CommunicationService.instance;
  }

  private initializeMockData(): void {
    // Mock communication channels
    this.channels = [
      {
        id: 'channel-1',
        name: 'General Discussion',
        type: 'text',
        groupId: 'group-1',
        participantIds: ['user-1', 'user-2', 'user-3', 'user-4'],
        isActive: true,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        lastActivity: new Date('2024-01-20T15:30:00Z'),
        settings: {
          allowFileSharing: true,
          allowVoiceNotes: true,
          allowVideoCall: true,
          translationEnabled: true,
          notificationsEnabled: true,
          moderationLevel: 'standard'
        },
        metadata: {
          messageCount: 142,
          pinnedMessages: [],
          tags: ['general', 'discussion']
        }
      },
      {
        id: 'channel-2',
        name: 'Project Alpha Planning',
        type: 'voice',
        groupId: 'group-1',
        participantIds: ['user-1', 'user-3', 'user-5'],
        isActive: true,
        createdAt: new Date('2024-01-16T14:00:00Z'),
        lastActivity: new Date('2024-01-20T16:45:00Z'),
        settings: {
          allowFileSharing: true,
          allowVoiceNotes: true,
          allowVideoCall: true,
          translationEnabled: false,
          notificationsEnabled: true,
          moderationLevel: 'strict'
        },
        metadata: {
          messageCount: 67,
          pinnedMessages: ['msg-123'],
          tags: ['project', 'planning', 'alpha']
        }
      },
      {
        id: 'channel-3',
        name: 'Beta Feedback Central',
        type: 'video',
        groupId: 'group-2',
        participantIds: ['user-2', 'user-4', 'user-6', 'user-7'],
        isActive: true,
        createdAt: new Date('2024-01-18T09:00:00Z'),
        lastActivity: new Date('2024-01-20T11:20:00Z'),
        settings: {
          allowFileSharing: true,
          allowVoiceNotes: true,
          allowVideoCall: true,
          translationEnabled: true,
          notificationsEnabled: true,
          moderationLevel: 'relaxed'
        },
        metadata: {
          messageCount: 89,
          pinnedMessages: ['msg-456', 'msg-789'],
          tags: ['beta', 'feedback', 'review']
        }
      }
    ];

    // Mock video conferences
    this.conferences = [
      {
        id: 'conf-1',
        title: 'Weekly Writing Review',
        channelId: 'channel-1',
        hostId: 'user-1',
        participantIds: ['user-1', 'user-2', 'user-3'],
        status: 'active',
        startTime: new Date('2024-01-20T16:00:00Z'),
        endTime: new Date('2024-01-20T17:30:00Z'),
        settings: {
          maxParticipants: 10,
          allowScreenSharing: true,
          allowRecording: true,
          requireApproval: false,
          autoTranscription: true,
          backgroundBlur: true
        },
        recording: {
          isRecording: true,
          recordingId: 'rec-1',
          startTime: new Date('2024-01-20T16:05:00Z'),
          size: 156789432,
          transcriptionEnabled: true
        },
        metrics: {
          duration: 90,
          peakParticipants: 5,
          totalParticipants: 7,
          messagesCount: 23,
          screenShareTime: 45,
          participantEngagement: 0.87
        }
      },
      {
        id: 'conf-2',
        title: 'Character Development Session',
        channelId: 'channel-2',
        hostId: 'user-3',
        participantIds: ['user-3', 'user-5'],
        status: 'scheduled',
        startTime: new Date('2024-01-22T19:00:00Z'),
        endTime: new Date('2024-01-22T20:30:00Z'),
        settings: {
          maxParticipants: 5,
          allowScreenSharing: true,
          allowRecording: false,
          requireApproval: true,
          autoTranscription: false,
          backgroundBlur: false
        },
        metrics: {
          duration: 0,
          peakParticipants: 0,
          totalParticipants: 0,
          messagesCount: 0,
          screenShareTime: 0,
          participantEngagement: 0
        }
      }
    ];

    // Mock voice notes
    this.voiceNotes = [
      {
        id: 'voice-1',
        channelId: 'channel-1',
        senderId: 'user-2',
        duration: 45,
        fileSize: 2048576,
        transcription: 'Hey everyone, I just wanted to share my thoughts on the character arc we discussed yesterday. I think we should focus more on the emotional journey rather than the plot progression.',
        timestamp: new Date('2024-01-20T14:30:00Z'),
        isTranscribed: true,
        waveformData: [0.2, 0.5, 0.8, 0.3, 0.7, 0.4, 0.9, 0.1, 0.6, 0.5],
        metadata: {
          quality: 'high',
          format: 'opus',
          sampleRate: 48000,
          language: 'en-US'
        }
      },
      {
        id: 'voice-2',
        channelId: 'channel-2',
        senderId: 'user-5',
        duration: 23,
        fileSize: 1024000,
        transcription: 'Quick update on the world-building document. I\'ve added the new location descriptions and updated the timeline.',
        timestamp: new Date('2024-01-20T16:15:00Z'),
        isTranscribed: true,
        waveformData: [0.3, 0.4, 0.6, 0.2, 0.8, 0.5, 0.7, 0.3, 0.4, 0.6],
        metadata: {
          quality: 'medium',
          format: 'opus',
          sampleRate: 44100,
          language: 'en-US'
        }
      }
    ];

    // Mock screen shares
    this.screenShares = [
      {
        id: 'screen-1',
        conferenceId: 'conf-1',
        presenterId: 'user-1',
        title: 'Manuscript Review - Chapter 5',
        startTime: new Date('2024-01-20T16:15:00Z'),
        endTime: new Date('2024-01-20T16:45:00Z'),
        isActive: false,
        settings: {
          allowAnnotations: true,
          allowRemoteControl: false,
          quality: 'high',
          includeAudio: true,
          shareType: 'application'
        },
        metrics: {
          duration: 30,
          viewerCount: 4,
          annotationsCount: 7,
          recordingSize: 45678912
        },
        annotations: [
          {
            id: 'ann-1',
            authorId: 'user-2',
            x: 150,
            y: 200,
            text: 'Consider revising this paragraph',
            timestamp: new Date('2024-01-20T16:20:00Z'),
            type: 'comment'
          }
        ]
      }
    ];

    // Mock chat messages
    this.messages = [
      {
        id: 'msg-1',
        channelId: 'channel-1',
        senderId: 'user-1',
        content: 'Welcome everyone to our new collaboration channel! Feel free to share your thoughts and ideas here.',
        timestamp: new Date('2024-01-20T10:00:00Z'),
        type: 'text',
        isEdited: false,
        reactions: [
          { emoji: '👍', userIds: ['user-2', 'user-3'], count: 2 },
          { emoji: '🎉', userIds: ['user-4'], count: 1 }
        ],
        metadata: {
          language: 'en-US',
          sentiment: 'positive',
          wordCount: 17
        }
      },
      {
        id: 'msg-2',
        channelId: 'channel-1',
        senderId: 'user-2',
        content: 'Thanks for setting this up! I\'m excited to collaborate on our project.',
        timestamp: new Date('2024-01-20T10:15:00Z'),
        type: 'text',
        isEdited: false,
        reactions: [
          { emoji: '❤️', userIds: ['user-1', 'user-3'], count: 2 }
        ],
        replyTo: 'msg-1',
        metadata: {
          language: 'en-US',
          sentiment: 'positive',
          wordCount: 12
        }
      },
      {
        id: 'msg-3',
        channelId: 'channel-1',
        senderId: 'user-3',
        content: '',
        timestamp: new Date('2024-01-20T10:30:00Z'),
        type: 'voice',
        voiceNoteId: 'voice-1',
        isEdited: false,
        reactions: [],
        metadata: {
          language: 'en-US',
          sentiment: 'neutral',
          wordCount: 0
        }
      }
    ];

    // Mock notifications
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'message',
        title: 'New message in General Discussion',
        message: 'user-2: Thanks for setting this up!',
        timestamp: new Date('2024-01-20T10:15:00Z'),
        isRead: false,
        channelId: 'channel-1',
        senderId: 'user-2',
        priority: 'normal',
        actions: [
          { label: 'Reply', action: 'reply' },
          { label: 'Mark as Read', action: 'markRead' }
        ]
      },
      {
        id: 'notif-2',
        userId: 'user-2',
        type: 'conference',
        title: 'Video conference started',
        message: 'Weekly Writing Review has started',
        timestamp: new Date('2024-01-20T16:00:00Z'),
        isRead: true,
        conferenceId: 'conf-1',
        priority: 'high',
        actions: [
          { label: 'Join', action: 'join' },
          { label: 'Dismiss', action: 'dismiss' }
        ]
      }
    ];
  }

  // Channel Management
  public async getChannels(groupId?: string): Promise<CommunicationChannel[]> {
    await this.delay(300);
    if (groupId) {
      return this.channels.filter(channel => channel.groupId === groupId);
    }
    return [...this.channels];
  }

  public async createChannel(data: CreateChannelData): Promise<CommunicationChannel> {
    await this.delay(500);
    
    const newChannel: CommunicationChannel = {
      id: `channel-${Date.now()}`,
      name: data.name,
      type: data.type,
      groupId: data.groupId,
      participantIds: data.participantIds || [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      settings: {
        allowFileSharing: data.settings?.allowFileSharing ?? true,
        allowVoiceNotes: data.settings?.allowVoiceNotes ?? true,
        allowVideoCall: data.settings?.allowVideoCall ?? true,
        translationEnabled: data.settings?.translationEnabled ?? false,
        notificationsEnabled: data.settings?.notificationsEnabled ?? true,
        moderationLevel: data.settings?.moderationLevel ?? 'standard'
      },
      metadata: {
        messageCount: 0,
        pinnedMessages: [],
        tags: data.tags || []
      }
    };

    this.channels.push(newChannel);
    return newChannel;
  }

  public async updateChannel(channelId: string, updates: Partial<CommunicationChannel>): Promise<CommunicationChannel> {
    await this.delay(400);
    
    const channelIndex = this.channels.findIndex(c => c.id === channelId);
    if (channelIndex === -1) {
      throw new Error('Channel not found');
    }

    this.channels[channelIndex] = { ...this.channels[channelIndex], ...updates };
    return this.channels[channelIndex];
  }

  public async deleteChannel(channelId: string): Promise<void> {
    await this.delay(300);
    
    const channelIndex = this.channels.findIndex(c => c.id === channelId);
    if (channelIndex === -1) {
      throw new Error('Channel not found');
    }

    this.channels.splice(channelIndex, 1);
  }

  // Video Conferencing
  public async getConferences(channelId?: string): Promise<VideoConference[]> {
    await this.delay(200);
    if (channelId) {
      return this.conferences.filter(conf => conf.channelId === channelId);
    }
    return [...this.conferences];
  }

  public async createConference(data: CreateConferenceData): Promise<VideoConference> {
    await this.delay(600);
    
    const newConference: VideoConference = {
      id: `conf-${Date.now()}`,
      title: data.title,
      channelId: data.channelId,
      hostId: data.hostId,
      participantIds: [data.hostId],
      status: 'scheduled',
      startTime: data.startTime,
      endTime: data.endTime,
      settings: {
        maxParticipants: data.settings?.maxParticipants ?? 10,
        allowScreenSharing: data.settings?.allowScreenSharing ?? true,
        allowRecording: data.settings?.allowRecording ?? false,
        requireApproval: data.settings?.requireApproval ?? false,
        autoTranscription: data.settings?.autoTranscription ?? false,
        backgroundBlur: data.settings?.backgroundBlur ?? false
      },
      metrics: {
        duration: 0,
        peakParticipants: 0,
        totalParticipants: 0,
        messagesCount: 0,
        screenShareTime: 0,
        participantEngagement: 0
      }
    };

    this.conferences.push(newConference);
    return newConference;
  }

  public async joinConference(conferenceId: string, userId: string): Promise<VideoConference> {
    await this.delay(400);
    
    const conference = this.conferences.find(c => c.id === conferenceId);
    if (!conference) {
      throw new Error('Conference not found');
    }

    if (!conference.participantIds.includes(userId)) {
      conference.participantIds.push(userId);
      conference.status = 'active';
    }

    return conference;
  }

  public async leaveConference(conferenceId: string, userId: string): Promise<void> {
    await this.delay(300);
    
    const conference = this.conferences.find(c => c.id === conferenceId);
    if (!conference) {
      throw new Error('Conference not found');
    }

    conference.participantIds = conference.participantIds.filter(id => id !== userId);
    
    if (conference.participantIds.length === 0) {
      conference.status = 'ended';
      conference.endTime = new Date();
    }
  }

  // Voice Notes
  public async getVoiceNotes(channelId: string): Promise<VoiceNote[]> {
    await this.delay(200);
    return this.voiceNotes.filter(note => note.channelId === channelId);
  }

  public async createVoiceNote(data: VoiceNoteData): Promise<VoiceNote> {
    await this.delay(800);
    
    const newVoiceNote: VoiceNote = {
      id: `voice-${Date.now()}`,
      channelId: data.channelId,
      senderId: data.senderId,
      duration: data.duration,
      fileSize: data.fileSize,
      transcription: data.transcription || '',
      timestamp: new Date(),
      isTranscribed: !!data.transcription,
      waveformData: data.waveformData || [],
      metadata: {
        quality: data.metadata?.quality || 'medium',
        format: data.metadata?.format || 'opus',
        sampleRate: data.metadata?.sampleRate || 44100,
        language: data.metadata?.language || 'en-US'
      }
    };

    this.voiceNotes.push(newVoiceNote);
    return newVoiceNote;
  }

  // Screen Sharing
  public async getScreenShares(conferenceId: string): Promise<ScreenShare[]> {
    await this.delay(200);
    return this.screenShares.filter(share => share.conferenceId === conferenceId);
  }

  public async startScreenShare(data: ScreenShareData): Promise<ScreenShare> {
    await this.delay(500);
    
    const newScreenShare: ScreenShare = {
      id: `screen-${Date.now()}`,
      conferenceId: data.conferenceId,
      presenterId: data.presenterId,
      title: data.title || 'Screen Share',
      startTime: new Date(),
      isActive: true,
      settings: {
        allowAnnotations: data.settings?.allowAnnotations ?? true,
        allowRemoteControl: data.settings?.allowRemoteControl ?? false,
        quality: data.settings?.quality ?? 'medium',
        includeAudio: data.settings?.includeAudio ?? false,
        shareType: data.settings?.shareType ?? 'screen'
      },
      metrics: {
        duration: 0,
        viewerCount: 1,
        annotationsCount: 0,
        recordingSize: 0
      },
      annotations: []
    };

    this.screenShares.push(newScreenShare);
    return newScreenShare;
  }

  public async stopScreenShare(screenShareId: string): Promise<ScreenShare> {
    await this.delay(300);
    
    const screenShare = this.screenShares.find(s => s.id === screenShareId);
    if (!screenShare) {
      throw new Error('Screen share not found');
    }

    screenShare.isActive = false;
    screenShare.endTime = new Date();
    
    if (screenShare.startTime) {
      screenShare.metrics.duration = Math.round(
        (screenShare.endTime.getTime() - screenShare.startTime.getTime()) / 1000 / 60
      );
    }

    return screenShare;
  }

  // Chat Messages
  public async getMessages(channelId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    await this.delay(200);
    
    const channelMessages = this.messages
      .filter(msg => msg.channelId === channelId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
    
    return channelMessages;
  }

  public async sendMessage(data: SendMessageData): Promise<ChatMessage> {
    await this.delay(300);
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: data.channelId,
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date(),
      type: data.type || 'text',
      isEdited: false,
      reactions: [],
      replyTo: data.replyTo,
      voiceNoteId: data.voiceNoteId,
      metadata: {
        language: 'en-US',
        sentiment: 'neutral',
        wordCount: data.content.split(/\s+/).length
      }
    };

    this.messages.push(newMessage);
    
    // Update channel last activity
    const channel = this.channels.find(c => c.id === data.channelId);
    if (channel) {
      channel.lastActivity = new Date();
      channel.metadata.messageCount++;
    }

    return newMessage;
  }

  public async editMessage(messageId: string, newContent: string): Promise<ChatMessage> {
    await this.delay(300);
    
    const message = this.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    message.content = newContent;
    message.isEdited = true;
    message.metadata.wordCount = newContent.split(/\s+/).length;

    return message;
  }

  public async deleteMessage(messageId: string): Promise<void> {
    await this.delay(200);
    
    const messageIndex = this.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    this.messages.splice(messageIndex, 1);
  }

  public async addReaction(messageId: string, emoji: string, userId: string): Promise<ChatMessage> {
    await this.delay(200);
    
    const message = this.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      if (!existingReaction.userIds.includes(userId)) {
        existingReaction.userIds.push(userId);
        existingReaction.count++;
      }
    } else {
      message.reactions.push({
        emoji,
        userIds: [userId],
        count: 1
      });
    }

    return message;
  }

  // Notifications
  public async getNotifications(userId: string, unreadOnly = false): Promise<NotificationData[]> {
    await this.delay(200);
    
    let userNotifications = this.notifications.filter(notif => notif.userId === userId);
    
    if (unreadOnly) {
      userNotifications = userNotifications.filter(notif => !notif.isRead);
    }
    
    return userNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public async markNotificationRead(notificationId: string): Promise<void> {
    await this.delay(100);
    
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  public async markAllNotificationsRead(userId: string): Promise<void> {
    await this.delay(200);
    
    this.notifications
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => n.isRead = true);
  }

  // Translation
  public async translateMessage(messageId: string, targetLanguage: string): Promise<string> {
    await this.delay(800);
    
    const message = this.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const cacheKey = `${messageId}-${targetLanguage}`;
    
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    // Mock translation - in reality, this would call a translation API
    const translations: Record<string, string> = {
      'es': 'Traducción simulada del mensaje original',
      'fr': 'Traduction simulée du message original',
      'de': 'Simulierte Übersetzung der ursprünglichen Nachricht',
      'it': 'Traduzione simulata del messaggio originale',
      'pt': 'Tradução simulada da mensagem original',
      'ja': '元のメッセージのシミュレートされた翻訳',
      'ko': '원본 메시지의 시뮬레이션된 번역',
      'zh': '原始消息的模拟翻译'
    };

    const translatedText = translations[targetLanguage] || `Translated to ${targetLanguage}: ${message.content}`;
    this.translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  }

  // Analytics and Metrics
  public async getCommunicationMetrics(
    groupId: string,
    timeRange: '24h' | '7d' | '30d' | '90d' = '7d'
  ): Promise<CommunicationMetrics> {
    await this.delay(500);
    
    const groupChannels = this.channels.filter(c => c.groupId === groupId);
    const groupMessages = this.messages.filter(msg => 
      groupChannels.some(channel => channel.id === msg.channelId)
    );
    const groupConferences = this.conferences.filter(conf => 
      groupChannels.some(channel => channel.id === conf.channelId)
    );
    const groupVoiceNotes = this.voiceNotes.filter(note => 
      groupChannels.some(channel => channel.id === note.channelId)
    );

    return {
      totalMessages: groupMessages.length,
      totalVoiceNotes: groupVoiceNotes.length,
      totalConferences: groupConferences.length,
      activeUsers: [...new Set(groupMessages.map(m => m.senderId))].length,
      averageResponseTime: 45, // minutes
      peakActivityHour: 14, // 2 PM
      engagementScore: 0.78,
      translationUsage: 0.23,
      mostActiveChannel: groupChannels[0]?.id || '',
      timeRange,
      periodStats: {
        messagesPerDay: 12.5,
        voiceNotesPerDay: 2.3,
        averageConferenceLength: 67, // minutes
        participationRate: 0.85
      }
    };
  }

  // Utility method for simulating API delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const communicationService = CommunicationService.getInstance();
export default communicationService;