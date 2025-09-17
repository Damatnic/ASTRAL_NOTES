/**
 * Real-time Collaboration Service
 * Handles WebSocket connections, presence, and collaborative editing
 */

import { io, Socket } from 'socket.io-client';
import type { Project, Story, Scene, Note } from '@/types/story';

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  activeDocument?: string;
  status: 'online' | 'away' | 'editing';
  lastSeen: Date;
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  users: CollaborationUser[];
  owner: string;
  createdAt: Date;
  settings: {
    allowGuests: boolean;
    editPermissions: 'all' | 'owner' | 'specific';
    maxUsers: number;
  };
}

export interface DocumentChange {
  id: string;
  documentId: string;
  documentType: 'scene' | 'note' | 'character' | 'location';
  userId: string;
  timestamp: Date;
  operation: 'insert' | 'delete' | 'format' | 'move';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
}

export interface ConflictResolution {
  strategy: 'last-write' | 'merge' | 'manual';
  conflictId: string;
  documentId: string;
  localChange: DocumentChange;
  remoteChange: DocumentChange;
  resolution?: DocumentChange;
  resolvedBy?: string;
  timestamp: Date;
}

export interface PresenceData {
  userId: string;
  documentId: string;
  cursor: { x: number; y: number };
  selection?: { start: number; end: number };
  viewport?: { top: number; bottom: number };
}

export interface CollaborationEvents {
  'user:joined': (user: CollaborationUser) => void;
  'user:left': (userId: string) => void;
  'user:status': (userId: string, status: CollaborationUser['status']) => void;
  'document:change': (change: DocumentChange) => void;
  'document:lock': (documentId: string, userId: string) => void;
  'document:unlock': (documentId: string) => void;
  'cursor:move': (presence: PresenceData) => void;
  'selection:change': (presence: PresenceData) => void;
  'conflict:detected': (conflict: ConflictResolution) => void;
  'session:sync': (session: CollaborationSession) => void;
  'comment:add': (comment: Comment) => void;
  'comment:resolve': (commentId: string) => void;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  content: string;
  position: { start: number; end: number };
  timestamp: Date;
  resolved: boolean;
  replies?: Comment[];
}

interface OperationalTransform {
  transformOperation(op1: DocumentChange, op2: DocumentChange): DocumentChange;
  compose(op1: DocumentChange, op2: DocumentChange): DocumentChange;
  invert(op: DocumentChange): DocumentChange;
}

class CollaborationService {
  private static instance: CollaborationService;
  private socket: Socket | null = null;
  private session: CollaborationSession | null = null;
  private users: Map<string, CollaborationUser> = new Map();
  private documentLocks: Map<string, string> = new Map();
  private pendingChanges: DocumentChange[] = [];
  private acknowledgments: Map<string, boolean> = new Map();
  private conflictQueue: ConflictResolution[] = [];
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private localUser: CollaborationUser | null = null;

  private constructor() {
    this.initializeEventHandlers();
  }

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Initialize WebSocket connection
   */
  public async connect(
    serverUrl: string,
    projectId: string,
    user: Omit<CollaborationUser, 'status' | 'lastSeen'>
  ): Promise<CollaborationSession> {
    return new Promise((resolve, reject) => {
      try {
        // Create socket connection
        this.socket = io(serverUrl, {
          transports: ['websocket'],
          query: {
            projectId,
            userId: user.id,
            userName: user.name
          },
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionAttempts: this.maxReconnectAttempts
        });

        // Set local user
        this.localUser = {
          ...user,
          status: 'online',
          lastSeen: new Date()
        };

        // Socket event handlers
        this.socket.on('connect', () => {
          console.log('Connected to collaboration server');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          // Join project session
          this.socket!.emit('session:join', {
            projectId,
            user: this.localUser
          });
        });

        this.socket.on('session:joined', (session: CollaborationSession) => {
          this.session = session;
          this.syncUsers(session.users);
          resolve(session);
          this.emit('session:sync', session);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from collaboration server:', reason);
          this.stopHeartbeat();
          this.handleDisconnect();
        });

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
          reject(error);
        });

        // Collaboration events
        this.setupSocketListeners();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from collaboration session
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.stopHeartbeat();
    this.session = null;
    this.users.clear();
    this.documentLocks.clear();
    this.pendingChanges = [];
    this.acknowledgments.clear();
    this.conflictQueue = [];
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // User events
    this.socket.on('user:joined', (user: CollaborationUser) => {
      this.users.set(user.id, user);
      this.emit('user:joined', user);
    });

    this.socket.on('user:left', (userId: string) => {
      this.users.delete(userId);
      this.emit('user:left', userId);
    });

    this.socket.on('user:status', (userId: string, status: CollaborationUser['status']) => {
      const user = this.users.get(userId);
      if (user) {
        user.status = status;
        user.lastSeen = new Date();
      }
      this.emit('user:status', userId, status);
    });

    // Document events
    this.socket.on('document:change', (change: DocumentChange) => {
      this.handleRemoteChange(change);
    });

    this.socket.on('document:lock', (documentId: string, userId: string) => {
      this.documentLocks.set(documentId, userId);
      this.emit('document:lock', documentId, userId);
    });

    this.socket.on('document:unlock', (documentId: string) => {
      this.documentLocks.delete(documentId);
      this.emit('document:unlock', documentId);
    });

    // Presence events
    this.socket.on('cursor:move', (presence: PresenceData) => {
      this.updateUserPresence(presence);
      this.emit('cursor:move', presence);
    });

    this.socket.on('selection:change', (presence: PresenceData) => {
      this.updateUserPresence(presence);
      this.emit('selection:change', presence);
    });

    // Conflict handling
    this.socket.on('conflict:detected', (conflict: ConflictResolution) => {
      this.handleConflict(conflict);
    });

    // Comments
    this.socket.on('comment:add', (comment: Comment) => {
      this.emit('comment:add', comment);
    });

    this.socket.on('comment:resolve', (commentId: string) => {
      this.emit('comment:resolve', commentId);
    });

    // Acknowledgments
    this.socket.on('change:ack', (changeId: string) => {
      this.acknowledgments.set(changeId, true);
      this.processPendingChanges();
    });
  }

  /**
   * Send document change
   */
  public sendChange(change: Omit<DocumentChange, 'id' | 'timestamp' | 'userId'>): void {
    if (!this.socket || !this.localUser) return;

    const fullChange: DocumentChange = {
      ...change,
      id: this.generateId(),
      userId: this.localUser.id,
      timestamp: new Date()
    };

    // Add to pending changes
    this.pendingChanges.push(fullChange);
    this.acknowledgments.set(fullChange.id, false);

    // Send to server
    this.socket.emit('document:change', fullChange);

    // Emit locally for immediate feedback
    this.emit('document:change', fullChange);
  }

  /**
   * Handle remote document change
   */
  private handleRemoteChange(change: DocumentChange): void {
    // Check for conflicts with pending local changes
    const conflicts = this.detectConflicts(change);
    
    if (conflicts.length > 0) {
      conflicts.forEach(conflict => {
        this.handleConflict({
          strategy: 'merge',
          conflictId: this.generateId(),
          documentId: change.documentId,
          localChange: conflict,
          remoteChange: change,
          timestamp: new Date()
        });
      });
    } else {
      // Apply change
      this.emit('document:change', change);
    }
  }

  /**
   * Detect conflicts with pending changes
   */
  private detectConflicts(remoteChange: DocumentChange): DocumentChange[] {
    return this.pendingChanges.filter(localChange => {
      // Same document
      if (localChange.documentId !== remoteChange.documentId) return false;
      
      // Overlapping positions
      const localStart = localChange.position;
      const localEnd = localChange.position + (localChange.length || localChange.content?.length || 0);
      const remoteStart = remoteChange.position;
      const remoteEnd = remoteChange.position + (remoteChange.length || remoteChange.content?.length || 0);
      
      return (localStart <= remoteEnd && localEnd >= remoteStart);
    });
  }

  /**
   * Handle conflict resolution
   */
  private handleConflict(conflict: ConflictResolution): void {
    this.conflictQueue.push(conflict);

    switch (conflict.strategy) {
      case 'last-write':
        // Remote change wins
        conflict.resolution = conflict.remoteChange;
        break;
        
      case 'merge':
        // Try to merge changes
        conflict.resolution = this.mergeChanges(conflict.localChange, conflict.remoteChange);
        break;
        
      case 'manual':
        // Emit for manual resolution
        this.emit('conflict:detected', conflict);
        return;
    }

    // Apply resolution
    if (conflict.resolution) {
      this.emit('document:change', conflict.resolution);
      
      // Remove resolved local change from pending
      this.pendingChanges = this.pendingChanges.filter(
        c => c.id !== conflict.localChange.id
      );
    }
  }

  /**
   * Merge two changes using operational transformation
   */
  private mergeChanges(local: DocumentChange, remote: DocumentChange): DocumentChange {
    // Simple merge strategy - for production, use proper OT library
    if (local.position < remote.position) {
      // Local change is before remote - adjust remote position
      const adjustment = local.operation === 'insert' ? 
        (local.content?.length || 0) : 
        -(local.length || 0);
      
      return {
        ...remote,
        position: remote.position + adjustment
      };
    } else if (local.position > remote.position) {
      // Remote change is before local - adjust local position
      const adjustment = remote.operation === 'insert' ? 
        (remote.content?.length || 0) : 
        -(remote.length || 0);
      
      return {
        ...local,
        position: local.position + adjustment
      };
    } else {
      // Same position - concatenate insertions or choose one deletion
      if (local.operation === 'insert' && remote.operation === 'insert') {
        return {
          ...local,
          content: (local.content || '') + (remote.content || '')
        };
      }
      
      // Default to remote change
      return remote;
    }
  }

  /**
   * Lock document for editing
   */
  public async lockDocument(documentId: string): Promise<boolean> {
    if (!this.socket || !this.localUser) return false;

    return new Promise((resolve) => {
      const existingLock = this.documentLocks.get(documentId);
      
      if (existingLock && existingLock !== this.localUser.id) {
        // Document already locked by another user
        resolve(false);
      } else {
        this.socket!.emit('document:lock', documentId, this.localUser!.id);
        
        // Wait for acknowledgment
        this.socket!.once('document:lock:ack', (success: boolean) => {
          if (success) {
            this.documentLocks.set(documentId, this.localUser!.id);
          }
          resolve(success);
        });
      }
    });
  }

  /**
   * Unlock document
   */
  public unlockDocument(documentId: string): void {
    if (!this.socket || !this.localUser) return;

    const lock = this.documentLocks.get(documentId);
    
    if (lock === this.localUser.id) {
      this.socket.emit('document:unlock', documentId);
      this.documentLocks.delete(documentId);
    }
  }

  /**
   * Update cursor position
   */
  public updateCursor(documentId: string, x: number, y: number): void {
    if (!this.socket || !this.localUser) return;

    const presence: PresenceData = {
      userId: this.localUser.id,
      documentId,
      cursor: { x, y }
    };

    this.socket.emit('cursor:move', presence);
  }

  /**
   * Update text selection
   */
  public updateSelection(
    documentId: string,
    start: number,
    end: number
  ): void {
    if (!this.socket || !this.localUser) return;

    const presence: PresenceData = {
      userId: this.localUser.id,
      documentId,
      cursor: { x: 0, y: 0 },
      selection: { start, end }
    };

    this.socket.emit('selection:change', presence);
  }

  /**
   * Add comment to document
   */
  public addComment(
    documentId: string,
    content: string,
    position: { start: number; end: number }
  ): void {
    if (!this.socket || !this.localUser) return;

    const comment: Comment = {
      id: this.generateId(),
      documentId,
      userId: this.localUser.id,
      userName: this.localUser.name,
      content,
      position,
      timestamp: new Date(),
      resolved: false
    };

    this.socket.emit('comment:add', comment);
    this.emit('comment:add', comment);
  }

  /**
   * Resolve comment
   */
  public resolveComment(commentId: string): void {
    if (!this.socket) return;

    this.socket.emit('comment:resolve', commentId);
    this.emit('comment:resolve', commentId);
  }

  /**
   * Get active users
   */
  public getActiveUsers(): CollaborationUser[] {
    return Array.from(this.users.values()).filter(
      user => user.status === 'online' || user.status === 'editing'
    );
  }

  /**
   * Get users in document
   */
  public getUsersInDocument(documentId: string): CollaborationUser[] {
    return Array.from(this.users.values()).filter(
      user => user.activeDocument === documentId
    );
  }

  /**
   * Check if document is locked
   */
  public isDocumentLocked(documentId: string): boolean {
    return this.documentLocks.has(documentId);
  }

  /**
   * Get document lock owner
   */
  public getDocumentLockOwner(documentId: string): string | undefined {
    return this.documentLocks.get(documentId);
  }

  /**
   * Subscribe to event
   */
  public on<K extends keyof CollaborationEvents>(
    event: K,
    handler: CollaborationEvents[K]
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(handler as Function);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as Function);
    };
  }

  /**
   * Emit event
   */
  private emit<K extends keyof CollaborationEvents>(
    event: K,
    ...args: Parameters<CollaborationEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    // Set up internal event handling
  }

  /**
   * Sync users from session
   */
  private syncUsers(users: CollaborationUser[]): void {
    this.users.clear();
    users.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  /**
   * Update user presence data
   */
  private updateUserPresence(presence: PresenceData): void {
    const user = this.users.get(presence.userId);
    
    if (user) {
      user.cursor = presence.cursor;
      if (presence.selection) {
        user.cursor!.selection = presence.selection;
      }
      user.activeDocument = presence.documentId;
      user.lastSeen = new Date();
    }
  }

  /**
   * Process pending changes queue
   */
  private processPendingChanges(): void {
    // Remove acknowledged changes
    this.pendingChanges = this.pendingChanges.filter(
      change => !this.acknowledgments.get(change.id)
    );
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    // Update local user status
    if (this.localUser) {
      this.localUser.status = 'away';
    }

    // Clear locks owned by this user
    const userLocks = Array.from(this.documentLocks.entries())
      .filter(([_, userId]) => userId === this.localUser?.id)
      .map(([docId]) => docId);
    
    userLocks.forEach(docId => {
      this.documentLocks.delete(docId);
    });

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat', {
          userId: this.localUser?.id,
          timestamp: new Date()
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get session info
   */
  public getSession(): CollaborationSession | null {
    return this.session;
  }

  /**
   * Get local user
   */
  public getLocalUser(): CollaborationUser | null {
    return this.localUser;
  }

  /**
   * Set user status
   */
  public setUserStatus(status: CollaborationUser['status']): void {
    if (!this.socket || !this.localUser) return;

    this.localUser.status = status;
    this.socket.emit('user:status', this.localUser.id, status);
  }

  /**
   * Get conflict queue
   */
  public getConflictQueue(): ConflictResolution[] {
    return this.conflictQueue;
  }

  /**
   * Resolve conflict manually
   */
  public resolveConflict(
    conflictId: string,
    resolution: DocumentChange
  ): void {
    const conflict = this.conflictQueue.find(c => c.conflictId === conflictId);
    
    if (conflict) {
      conflict.resolution = resolution;
      conflict.resolvedBy = this.localUser?.id;
      
      // Apply resolution
      this.emit('document:change', resolution);
      
      // Remove from queue
      this.conflictQueue = this.conflictQueue.filter(
        c => c.conflictId !== conflictId
      );
      
      // Send resolution to server
      if (this.socket) {
        this.socket.emit('conflict:resolved', conflict);
      }
    }
  }

  /**
   * Broadcast typing indicator
   */
  public sendTypingIndicator(documentId: string, isTyping: boolean): void {
    if (!this.socket || !this.localUser) return;

    this.socket.emit('user:typing', {
      userId: this.localUser.id,
      documentId,
      isTyping
    });
  }

  /**
   * Request document sync
   */
  public requestDocumentSync(documentId: string): void {
    if (!this.socket) return;

    this.socket.emit('document:sync:request', documentId);
  }

  /**
   * Get collaboration statistics
   */
  public getStatistics(): {
    activeUsers: number;
    lockedDocuments: number;
    pendingChanges: number;
    conflicts: number;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  } {
    return {
      activeUsers: this.getActiveUsers().length,
      lockedDocuments: this.documentLocks.size,
      pendingChanges: this.pendingChanges.length,
      conflicts: this.conflictQueue.length,
      connectionStatus: this.socket?.connected ? 'connected' : 
                       this.reconnectAttempts > 0 ? 'reconnecting' : 'disconnected'
    };
  }
}

// Export singleton instance
export const collaborationService = CollaborationService.getInstance();