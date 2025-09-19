/**
 * Advanced Presence Awareness System
 * Provides rich real-time user presence indicators with sub-50ms updates
 * Supports multi-cursor tracking, activity indicators, and smart notifications
 */

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  color: string;
  status: 'active' | 'idle' | 'away' | 'focus' | 'typing';
  lastActivity: number;
  currentDocument?: {
    id: string;
    type: string;
    title: string;
    position?: number;
  };
  cursor?: CursorInfo;
  selection?: SelectionInfo;
  viewport?: ViewportInfo;
  device?: DeviceInfo;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unstable';
  permissions: PermissionLevel[];
}

export interface CursorInfo {
  x: number;
  y: number;
  position: number;
  elementId?: string;
  isVisible: boolean;
  lastMoved: number;
  velocity?: { dx: number; dy: number };
  pressure?: number; // For stylus/touch input
}

export interface SelectionInfo {
  start: number;
  end: number;
  direction: 'forward' | 'backward' | 'none';
  text?: string;
  elementId?: string;
  isActive: boolean;
  lastChanged: number;
}

export interface ViewportInfo {
  top: number;
  bottom: number;
  left: number;
  right: number;
  zoom: number;
  scrollPosition: { x: number; y: number };
  visibleElements: string[];
  lastUpdated: number;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile' | 'stylus';
  platform: string;
  screen: { width: number; height: number };
  inputMethods: ('mouse' | 'touch' | 'stylus' | 'keyboard')[];
  capabilities: {
    pressure: boolean;
    tilt: boolean;
    multiTouch: boolean;
  };
}

export interface PermissionLevel {
  action: 'read' | 'write' | 'comment' | 'suggest' | 'admin';
  scope: 'document' | 'section' | 'global';
  restrictions?: string[];
}

export interface PresenceUpdate {
  userId: string;
  documentId: string;
  timestamp: number;
  type: 'cursor' | 'selection' | 'viewport' | 'status' | 'activity';
  data: any;
  isOptimistic?: boolean;
}

export interface ActivityIndicator {
  type: 'typing' | 'selecting' | 'scrolling' | 'editing' | 'commenting' | 'idle';
  intensity: number; // 0-1 scale
  duration: number;
  location?: { x: number; y: number };
  elementId?: string;
}

export interface SmartNotification {
  id: string;
  userId: string;
  type: 'mention' | 'conflict' | 'suggestion' | 'join' | 'leave' | 'edit';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  timestamp: number;
  documentId?: string;
  position?: number;
  actionable?: boolean;
  actions?: NotificationAction[];
  autoHide?: boolean;
  hideAfter?: number;
}

export interface NotificationAction {
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
  handler: () => void;
}

export interface PresenceConfig {
  updateInterval: number;
  cursorSmoothingFactor: number;
  idleTimeout: number;
  awayTimeout: number;
  maxPresenceHistory: number;
  enableActivityDetection: boolean;
  enableSmartNotifications: boolean;
  enableCursorPrediction: boolean;
  enableViewportSharing: boolean;
  conflictDetectionSensitivity: number;
}

export class AdvancedPresenceAwareness {
  private presenceMap = new Map<string, UserPresence>();
  private localPresence: UserPresence | null = null;
  private updateQueue: PresenceUpdate[] = [];
  private activityDetector: ActivityDetector;
  private cursorPredictor: CursorPredictor;
  private notificationManager: NotificationManager;
  private config: PresenceConfig;
  private updateTimer: NodeJS.Timeout | null = null;
  private eventHandlers = new Map<string, Set<Function>>();
  private performanceTracker = {
    updateCount: 0,
    averageLatency: 0,
    lastUpdate: 0
  };

  constructor(
    private userId: string,
    private username: string,
    config: Partial<PresenceConfig> = {}
  ) {
    this.config = {
      updateInterval: 16, // ~60fps for smooth cursors
      cursorSmoothingFactor: 0.8,
      idleTimeout: 30000, // 30 seconds
      awayTimeout: 300000, // 5 minutes
      maxPresenceHistory: 100,
      enableActivityDetection: true,
      enableSmartNotifications: true,
      enableCursorPrediction: true,
      enableViewportSharing: true,
      conflictDetectionSensitivity: 0.5,
      ...config
    };

    this.activityDetector = new ActivityDetector(this.config);
    this.cursorPredictor = new CursorPredictor(this.config);
    this.notificationManager = new NotificationManager(this.config);
    
    this.initializeLocalPresence();
    this.startUpdateLoop();
    this.setupEventListeners();
  }

  /**
   * Initialize local user presence
   */
  private initializeLocalPresence(): void {
    this.localPresence = {
      userId: this.userId,
      username: this.username,
      color: this.generateUserColor(this.userId),
      status: 'active',
      lastActivity: Date.now(),
      connectionQuality: 'excellent',
      permissions: [
        { action: 'read', scope: 'global' },
        { action: 'write', scope: 'document' },
        { action: 'comment', scope: 'document' }
      ],
      cursor: {
        x: 0,
        y: 0,
        position: 0,
        isVisible: false,
        lastMoved: Date.now()
      },
      device: this.detectDevice()
    };

    this.presenceMap.set(this.userId, this.localPresence);
  }

  /**
   * Update cursor position with high-frequency tracking
   */
  public updateCursor(
    x: number, 
    y: number, 
    position: number, 
    elementId?: string
  ): void {
    if (!this.localPresence) return;

    const now = Date.now();
    const prevCursor = this.localPresence.cursor;
    
    // Calculate velocity for smooth interpolation
    let velocity = { dx: 0, dy: 0 };
    if (prevCursor && now - prevCursor.lastMoved < 100) {
      const dt = now - prevCursor.lastMoved;
      velocity = {
        dx: (x - prevCursor.x) / dt,
        dy: (y - prevCursor.y) / dt
      };
    }

    // Update cursor with prediction if enabled
    const predictedPosition = this.config.enableCursorPrediction
      ? this.cursorPredictor.predict(x, y, velocity, now)
      : { x, y };

    this.localPresence.cursor = {
      x: predictedPosition.x,
      y: predictedPosition.y,
      position,
      elementId,
      isVisible: true,
      lastMoved: now,
      velocity
    };

    this.localPresence.lastActivity = now;
    this.updateStatus('active');

    // Queue update
    this.queueUpdate('cursor', {
      cursor: this.localPresence.cursor,
      velocity
    });

    this.emit('cursor:update', this.localPresence);
  }

  /**
   * Update text selection
   */
  public updateSelection(
    start: number,
    end: number,
    text?: string,
    elementId?: string
  ): void {
    if (!this.localPresence) return;

    const now = Date.now();
    const isActive = start !== end;
    const direction = start < end ? 'forward' : start > end ? 'backward' : 'none';

    this.localPresence.selection = {
      start,
      end,
      direction,
      text,
      elementId,
      isActive,
      lastChanged: now
    };

    this.localPresence.lastActivity = now;
    this.updateStatus('active');

    this.queueUpdate('selection', {
      selection: this.localPresence.selection
    });

    this.emit('selection:update', this.localPresence);
  }

  /**
   * Update viewport information
   */
  public updateViewport(viewport: Partial<ViewportInfo>): void {
    if (!this.localPresence || !this.config.enableViewportSharing) return;

    const now = Date.now();
    this.localPresence.viewport = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zoom: 1,
      scrollPosition: { x: 0, y: 0 },
      visibleElements: [],
      lastUpdated: now,
      ...this.localPresence.viewport,
      ...viewport,
      lastUpdated: now
    };

    this.localPresence.lastActivity = now;

    this.queueUpdate('viewport', {
      viewport: this.localPresence.viewport
    });

    this.emit('viewport:update', this.localPresence);
  }

  /**
   * Update user status with activity detection
   */
  public updateStatus(status: UserPresence['status']): void {
    if (!this.localPresence || this.localPresence.status === status) return;

    const previousStatus = this.localPresence.status;
    this.localPresence.status = status;
    this.localPresence.lastActivity = Date.now();

    this.queueUpdate('status', {
      status,
      previousStatus
    });

    this.emit('status:change', {
      userId: this.userId,
      status,
      previousStatus
    });
  }

  /**
   * Join document collaboration
   */
  public joinDocument(
    documentId: string,
    documentType: string,
    documentTitle: string
  ): void {
    if (!this.localPresence) return;

    this.localPresence.currentDocument = {
      id: documentId,
      type: documentType,
      title: documentTitle
    };

    this.queueUpdate('activity', {
      action: 'join',
      documentId,
      documentType,
      documentTitle
    });

    this.emit('document:join', {
      userId: this.userId,
      documentId,
      documentType,
      documentTitle
    });
  }

  /**
   * Leave document collaboration
   */
  public leaveDocument(): void {
    if (!this.localPresence?.currentDocument) return;

    const documentId = this.localPresence.currentDocument.id;
    this.localPresence.currentDocument = undefined;
    this.localPresence.cursor = {
      ...this.localPresence.cursor!,
      isVisible: false
    };

    this.queueUpdate('activity', {
      action: 'leave',
      documentId
    });

    this.emit('document:leave', {
      userId: this.userId,
      documentId
    });
  }

  /**
   * Add remote user presence
   */
  public addUser(presence: UserPresence): void {
    const existingPresence = this.presenceMap.get(presence.userId);
    this.presenceMap.set(presence.userId, presence);

    if (!existingPresence) {
      this.emit('user:join', presence);
      
      if (this.config.enableSmartNotifications) {
        this.notificationManager.addNotification({
          id: `join-${presence.userId}-${Date.now()}`,
          userId: presence.userId,
          type: 'join',
          priority: 'low',
          message: `${presence.username} joined the session`,
          timestamp: Date.now(),
          autoHide: true,
          hideAfter: 3000
        });
      }
    } else {
      this.emit('user:update', presence);
    }
  }

  /**
   * Remove user presence
   */
  public removeUser(userId: string): void {
    const presence = this.presenceMap.get(userId);
    if (!presence) return;

    this.presenceMap.delete(userId);
    this.emit('user:leave', presence);

    if (this.config.enableSmartNotifications) {
      this.notificationManager.addNotification({
        id: `leave-${userId}-${Date.now()}`,
        userId,
        type: 'leave',
        priority: 'low',
        message: `${presence.username} left the session`,
        timestamp: Date.now(),
        autoHide: true,
        hideAfter: 3000
      });
    }
  }

  /**
   * Update remote user presence
   */
  public updateUser(update: PresenceUpdate): void {
    const presence = this.presenceMap.get(update.userId);
    if (!presence) return;

    const now = Date.now();
    
    switch (update.type) {
      case 'cursor':
        if (update.data.cursor) {
          presence.cursor = {
            ...presence.cursor,
            ...update.data.cursor,
            lastMoved: now
          };
        }
        break;

      case 'selection':
        if (update.data.selection) {
          presence.selection = update.data.selection;
        }
        break;

      case 'viewport':
        if (update.data.viewport) {
          presence.viewport = update.data.viewport;
        }
        break;

      case 'status':
        if (update.data.status) {
          presence.status = update.data.status;
        }
        break;

      case 'activity':
        presence.lastActivity = now;
        if (update.data.action) {
          this.handleRemoteActivity(presence, update.data);
        }
        break;
    }

    this.emit('user:update', presence);
    this.detectConflicts(presence);
  }

  /**
   * Get all active users
   */
  public getActiveUsers(): UserPresence[] {
    const now = Date.now();
    return Array.from(this.presenceMap.values()).filter(presence => {
      const timeSinceActivity = now - presence.lastActivity;
      return timeSinceActivity < this.config.awayTimeout && 
             presence.status !== 'away';
    });
  }

  /**
   * Get users in current document
   */
  public getUsersInDocument(documentId: string): UserPresence[] {
    return Array.from(this.presenceMap.values()).filter(presence =>
      presence.currentDocument?.id === documentId
    );
  }

  /**
   * Get user by ID
   */
  public getUser(userId: string): UserPresence | undefined {
    return this.presenceMap.get(userId);
  }

  /**
   * Check for edit conflicts
   */
  private detectConflicts(remotePresence: UserPresence): void {
    if (!this.localPresence?.selection?.isActive || 
        !remotePresence.selection?.isActive ||
        !this.localPresence.currentDocument ||
        this.localPresence.currentDocument.id !== remotePresence.currentDocument?.id) {
      return;
    }

    const localSel = this.localPresence.selection;
    const remoteSel = remotePresence.selection;
    
    // Check for overlapping selections
    const overlap = Math.max(0, 
      Math.min(localSel.end, remoteSel.end) - Math.max(localSel.start, remoteSel.start)
    );
    
    const totalSelection = Math.max(localSel.end, remoteSel.end) - Math.min(localSel.start, remoteSel.start);
    const overlapRatio = totalSelection > 0 ? overlap / totalSelection : 0;

    if (overlapRatio > this.config.conflictDetectionSensitivity) {
      this.emit('conflict:detected', {
        type: 'selection',
        severity: overlapRatio > 0.8 ? 'high' : 'medium',
        localUser: this.localPresence,
        remoteUser: remotePresence,
        overlapRatio
      });

      if (this.config.enableSmartNotifications) {
        this.notificationManager.addNotification({
          id: `conflict-${remotePresence.userId}-${Date.now()}`,
          userId: remotePresence.userId,
          type: 'conflict',
          priority: overlapRatio > 0.8 ? 'high' : 'medium',
          message: `Editing conflict with ${remotePresence.username}`,
          timestamp: Date.now(),
          documentId: this.localPresence.currentDocument.id,
          position: Math.min(localSel.start, remoteSel.start),
          actionable: true,
          actions: [
            {
              label: 'Resolve',
              action: 'resolve-conflict',
              style: 'primary',
              handler: () => this.resolveConflict(remotePresence.userId)
            }
          ]
        });
      }
    }
  }

  /**
   * Queue presence update for batching
   */
  private queueUpdate(type: PresenceUpdate['type'], data: any): void {
    const update: PresenceUpdate = {
      userId: this.userId,
      documentId: this.localPresence?.currentDocument?.id || '',
      timestamp: Date.now(),
      type,
      data
    };

    this.updateQueue.push(update);
    
    // Limit queue size
    if (this.updateQueue.length > 50) {
      this.updateQueue = this.updateQueue.slice(-25);
    }
  }

  /**
   * Start high-frequency update loop
   */
  private startUpdateLoop(): void {
    this.updateTimer = setInterval(() => {
      this.processUpdateQueue();
      this.updateActivityStatus();
      this.cleanupOldData();
    }, this.config.updateInterval);
  }

  /**
   * Process queued updates
   */
  private processUpdateQueue(): void {
    if (this.updateQueue.length === 0) return;

    const updates = [...this.updateQueue];
    this.updateQueue = [];

    // Batch updates by type for efficiency
    const batched = updates.reduce((acc, update) => {
      if (!acc[update.type]) acc[update.type] = [];
      acc[update.type].push(update);
      return acc;
    }, {} as Record<string, PresenceUpdate[]>);

    this.emit('updates:batch', batched);
    this.performanceTracker.updateCount += updates.length;
  }

  /**
   * Update activity status based on idle time
   */
  private updateActivityStatus(): void {
    if (!this.localPresence) return;

    const now = Date.now();
    const timeSinceActivity = now - this.localPresence.lastActivity;

    let newStatus: UserPresence['status'] = this.localPresence.status;

    if (timeSinceActivity > this.config.awayTimeout) {
      newStatus = 'away';
    } else if (timeSinceActivity > this.config.idleTimeout) {
      newStatus = 'idle';
    } else if (this.localPresence.status === 'idle' || this.localPresence.status === 'away') {
      newStatus = 'active';
    }

    if (newStatus !== this.localPresence.status) {
      this.updateStatus(newStatus);
    }
  }

  /**
   * Clean up old presence data
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const timeout = this.config.awayTimeout * 2; // Remove after 10 minutes of inactivity

    for (const [userId, presence] of this.presenceMap.entries()) {
      if (userId === this.userId) continue; // Don't remove self
      
      if (now - presence.lastActivity > timeout) {
        this.removeUser(userId);
      }
    }
  }

  /**
   * Setup DOM event listeners for activity detection
   */
  private setupEventListeners(): void {
    if (!this.config.enableActivityDetection) return;

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      this.activityDetector.recordActivity('cursor', {
        x: e.clientX,
        y: e.clientY
      });
    });

    // Keyboard activity
    document.addEventListener('keydown', () => {
      this.activityDetector.recordActivity('typing');
      this.updateStatus('typing');
    });

    // Scroll activity
    document.addEventListener('scroll', () => {
      this.activityDetector.recordActivity('scrolling');
    });

    // Focus/blur events
    window.addEventListener('focus', () => {
      this.updateStatus('focus');
    });

    window.addEventListener('blur', () => {
      this.updateStatus('away');
    });
  }

  /**
   * Generate consistent color for user
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Detect device information
   */
  private detectDevice(): DeviceInfo {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
    const isTablet = /iPad|Tablet/.test(ua);
    
    return {
      type: isMobile ? (isTablet ? 'tablet' : 'mobile') : 'desktop',
      platform: navigator.platform,
      screen: {
        width: screen.width,
        height: screen.height
      },
      inputMethods: ['mouse', 'keyboard'],
      capabilities: {
        pressure: 'ontouchstart' in window,
        tilt: false,
        multiTouch: 'ontouchstart' in window
      }
    };
  }

  /**
   * Handle remote user activity
   */
  private handleRemoteActivity(presence: UserPresence, activityData: any): void {
    // Update activity indicators, handle notifications, etc.
    this.emit('activity:remote', {
      user: presence,
      activity: activityData
    });
  }

  /**
   * Resolve editing conflict
   */
  private resolveConflict(remoteUserId: string): void {
    // Implement conflict resolution logic
    this.emit('conflict:resolve', { remoteUserId });
  }

  /**
   * Subscribe to events
   */
  public on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)!.add(handler);
    
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in presence event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): {
    updateRate: number;
    averageLatency: number;
    activeUsers: number;
    memoryUsage: number;
  } {
    return {
      updateRate: this.performanceTracker.updateCount / ((Date.now() - this.performanceTracker.lastUpdate) / 1000),
      averageLatency: this.performanceTracker.averageLatency,
      activeUsers: this.getActiveUsers().length,
      memoryUsage: JSON.stringify(Array.from(this.presenceMap.values())).length
    };
  }

  /**
   * Destroy presence awareness
   */
  public destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.presenceMap.clear();
    this.updateQueue = [];
    this.eventHandlers.clear();
    
    // Remove event listeners
    // (In a real implementation, you'd track and remove specific listeners)
  }
}

// Helper classes for advanced features
class ActivityDetector {
  private activityBuffer: { type: string; timestamp: number; data?: any }[] = [];
  
  constructor(private config: PresenceConfig) {}
  
  recordActivity(type: string, data?: any): void {
    this.activityBuffer.push({
      type,
      timestamp: Date.now(),
      data
    });
    
    // Keep buffer size manageable
    if (this.activityBuffer.length > 100) {
      this.activityBuffer = this.activityBuffer.slice(-50);
    }
  }
  
  getActivityIndicator(): ActivityIndicator | null {
    if (this.activityBuffer.length === 0) return null;
    
    const recent = this.activityBuffer.filter(
      activity => Date.now() - activity.timestamp < 1000
    );
    
    if (recent.length === 0) {
      return {
        type: 'idle',
        intensity: 0,
        duration: Date.now() - this.activityBuffer[this.activityBuffer.length - 1].timestamp
      };
    }
    
    const mostCommon = recent.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantType = Object.entries(mostCommon)
      .sort(([,a], [,b]) => b - a)[0][0] as ActivityIndicator['type'];
    
    return {
      type: dominantType,
      intensity: Math.min(recent.length / 10, 1),
      duration: recent[recent.length - 1].timestamp - recent[0].timestamp
    };
  }
}

class CursorPredictor {
  private positionHistory: { x: number; y: number; timestamp: number }[] = [];
  
  constructor(private config: PresenceConfig) {}
  
  predict(x: number, y: number, velocity: { dx: number; dy: number }, timestamp: number): { x: number; y: number } {
    if (!this.config.enableCursorPrediction) {
      return { x, y };
    }
    
    this.positionHistory.push({ x, y, timestamp });
    
    // Keep only recent history
    this.positionHistory = this.positionHistory.filter(
      pos => timestamp - pos.timestamp < 500
    );
    
    if (this.positionHistory.length < 3) {
      return { x, y };
    }
    
    // Simple linear prediction based on velocity
    const predictionTime = 16; // Predict 16ms ahead (one frame)
    return {
      x: x + velocity.dx * predictionTime,
      y: y + velocity.dy * predictionTime
    };
  }
}

class NotificationManager {
  private notifications = new Map<string, SmartNotification>();
  private notificationTimeout = new Map<string, NodeJS.Timeout>();
  
  constructor(private config: PresenceConfig) {}
  
  addNotification(notification: SmartNotification): void {
    this.notifications.set(notification.id, notification);
    
    if (notification.autoHide && notification.hideAfter) {
      const timeout = setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.hideAfter);
      
      this.notificationTimeout.set(notification.id, timeout);
    }
  }
  
  removeNotification(id: string): void {
    this.notifications.delete(id);
    
    const timeout = this.notificationTimeout.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.notificationTimeout.delete(id);
    }
  }
  
  getNotifications(): SmartNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Factory function
export function createPresenceAwareness(
  userId: string,
  username: string,
  config?: Partial<PresenceConfig>
): AdvancedPresenceAwareness {
  return new AdvancedPresenceAwareness(userId, username, config);
}