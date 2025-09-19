/**
 * Real-time Collaboration Service
 * Handles WebSocket connections, presence, and collaborative editing
 * Enhanced with advanced operational transformation and sub-50ms latency optimization
 */

import { io, Socket } from 'socket.io-client';
import type { Project, Story, Scene, Note } from '@/types/story';
import { 
  AdvancedOperationalTransform, 
  Operation, 
  TransformResult, 
  VectorClock,
  createOptimizedOT,
  OperationUtils
} from './operationalTransform';

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
  operation: 'insert' | 'delete' | 'format' | 'move' | 'retain';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  revision?: number;
  baseRevision?: number;
  siteId?: number;
  sequence?: number;
  vectorClock?: VectorClock;
  transformResult?: TransformResult;
}

export interface LegacyOperation {
  type: 'retain' | 'insert' | 'delete';
  count?: number;
  text?: string;
  attributes?: Record<string, any>;
}

export interface CursorPosition {
  userId: string;
  documentId: string;
  position: number;
  selection?: { start: number; end: number };
  timestamp: Date;
}

export interface PresenceData {
  userId: string;
  cursor?: CursorPosition;
  isTyping: boolean;
  activeElement?: string;
  viewportPosition?: { x: number; y: number };
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
  
  // Enhanced OT and performance optimization
  private otEngine: AdvancedOperationalTransform | null = null;
  private siteId: number = Math.floor(Math.random() * 1000000);
  private documentStates: Map<string, { content: string; version: number; vectorClock: VectorClock }> = new Map();
  private operationBuffer: Map<string, Operation[]> = new Map();
  private latencyTracker: { timestamps: number[]; average: number } = { timestamps: [], average: 0 };
  private performanceOptimizations = {
    batchOperations: true,
    compressionEnabled: true,
    cacheEnabled: true,
    maxBufferSize: 50
  };

  private constructor() {
    this.initializeEventHandlers();
    this.initializeOTEngine();
  }

  /**
   * Initialize the advanced operational transformation engine
   */
  private initializeOTEngine(): void {
    this.otEngine = createOptimizedOT(this.siteId, {
      maxOperationBuffer: this.performanceOptimizations.maxBufferSize,
      compressionThreshold: 25,
      conflictResolutionStrategy: 'merge',
      enableVectorClocks: true,
      enableCompression: this.performanceOptimizations.compressionEnabled,
      enableCaching: this.performanceOptimizations.cacheEnabled
    });
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
  public setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from collaboration server:', reason);
      this.stopHeartbeat();
      this.handleDisconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

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
      this.emit('conflict:detected', conflict);
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
   * Send document change with advanced operational transformation
   */
  public sendChange(change: Omit<DocumentChange, 'id' | 'timestamp' | 'userId'>): void {
    if (!this.socket || !this.localUser || !this.otEngine) return;

    const startTime = performance.now();

    // Create operation using OT engine
    const operation = this.otEngine.createOperation(
      change.operation as any,
      change.position,
      change.content,
      change.length,
      change.attributes
    );

    const fullChange: DocumentChange = {
      ...change,
      id: operation.id,
      userId: this.localUser.id,
      timestamp: new Date(),
      siteId: operation.siteId,
      sequence: operation.sequence,
      vectorClock: operation.vectorClock
    };

    // Buffer operation for batching if enabled
    if (this.performanceOptimizations.batchOperations) {
      this.bufferOperation(change.documentId, operation);
    }

    // Add to pending changes
    this.pendingChanges.push(fullChange);
    this.acknowledgments.set(fullChange.id, false);

    // Update local document state optimistically
    this.updateDocumentStateOptimistically(change.documentId, operation);

    // Send to server with latency tracking
    this.socket.emit('document:change', fullChange);
    this.trackLatency(startTime);

    // Emit locally for immediate feedback
    this.emit('document:change', fullChange);
  }

  /**
   * Send multiple changes as a batch for better performance
   */
  public sendBatchChanges(changes: Omit<DocumentChange, 'id' | 'timestamp' | 'userId'>[]): void {
    if (!this.socket || !this.localUser || !this.otEngine) return;

    const batchId = this.generateId();
    const operations: Operation[] = [];

    const batchChanges = changes.map(change => {
      const operation = this.otEngine!.createOperation(
        change.operation as any,
        change.position,
        change.content,
        change.length,
        change.attributes
      );
      operations.push(operation);

      return {
        ...change,
        id: operation.id,
        userId: this.localUser!.id,
        timestamp: new Date(),
        siteId: operation.siteId,
        sequence: operation.sequence,
        vectorClock: operation.vectorClock
      };
    });

    // Add all to pending changes
    batchChanges.forEach(change => {
      this.pendingChanges.push(change);
      this.acknowledgments.set(change.id, false);
    });

    // Send batch to server
    this.socket.emit('document:batch-change', {
      batchId,
      changes: batchChanges,
      operations
    });

    // Emit locally
    batchChanges.forEach(change => {
      this.emit('document:change', change);
    });
  }

  /**
   * Handle remote document change with advanced transformation
   */
  private handleRemoteChange(change: DocumentChange): void {
    if (!this.otEngine) return;

    const startTime = performance.now();

    // Convert to Operation for OT processing
    const remoteOperation: Operation = {
      id: change.id,
      userId: change.userId,
      timestamp: change.timestamp.getTime(),
      siteId: change.siteId || 0,
      sequence: change.sequence || 0,
      type: change.operation as any,
      position: change.position,
      content: change.content,
      length: change.length,
      attributes: change.attributes,
      vectorClock: change.vectorClock
    };

    // Update vector clock
    if (change.vectorClock) {
      this.otEngine.updateVectorClock(change.vectorClock);
    }

    // Transform against pending local operations
    const transformedOperations = this.transformAgainstPending(remoteOperation);
    
    // Apply transformed operation to document state
    const documentState = this.documentStates.get(change.documentId);
    if (documentState) {
      documentState.content = OperationUtils.applyToText(documentState.content, remoteOperation);
      documentState.version++;
      if (change.vectorClock) {
        documentState.vectorClock = { ...change.vectorClock };
      }
    }

    // Check for conflicts
    const conflicts = this.detectAdvancedConflicts(remoteOperation, transformedOperations);
    
    if (conflicts.length > 0) {
      this.handleAdvancedConflicts(conflicts, change);
    }

    this.trackLatency(startTime);
    
    // Emit transformed change
    this.emit('document:change', {
      ...change,
      transformResult: {
        operation: remoteOperation,
        isTransformed: transformedOperations.length > 0,
        conflicts
      }
    });
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
  public addComment(commentDataOrDocumentId: {
    documentId: string;
    content: string;
    position: { start: number; end: number };
  } | string, content?: string, position?: { start: number; end: number }): void {
    if (!this.socket || !this.localUser) return;

    let commentData: {
      documentId: string;
      content: string;
      position: { start: number; end: number };
    };

    // Handle both parameter formats
    if (typeof commentDataOrDocumentId === 'string') {
      commentData = {
        documentId: commentDataOrDocumentId,
        content: content!,
        position: position!
      };
    } else {
      commentData = commentDataOrDocumentId;
    }

    const comment: Comment = {
      id: this.generateId(),
      documentId: commentData.documentId,
      userId: this.localUser.id,
      userName: this.localUser.name,
      content: commentData.content,
      position: commentData.position,
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
   * Get document lock (alias for getDocumentLockOwner)
   */
  public getDocumentLock(documentId: string): string | undefined {
    return this.getDocumentLockOwner(documentId);
  }

  /**
   * Request document lock
   */
  public requestDocumentLock(documentId: string): Promise<boolean> {
    return this.lockDocument(documentId);
  }

  /**
   * Release document lock
   */
  public releaseDocumentLock(documentId: string): void {
    this.unlockDocument(documentId);
  }

  /**
   * Send cursor position
   */
  public sendCursorPosition(documentId: string, x: number, y: number): void {
    this.updateCursor(documentId, x, y);
  }

  /**
   * Update presence
   */
  public updatePresence(presenceData: PresenceData): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('presence:update', presenceData);
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): CollaborationSession | null {
    return this.session;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get user permissions (placeholder implementation)
   */
  public getUserPermissions(userId: string): any {
    if (!this.session || !this.localUser) {
      return {
        canEdit: false,
        canComment: false,
        canManageUsers: false
      };
    }

    const isOwner = this.session.owner === userId;
    const isCurrentUser = this.localUser.id === userId;
    
    return {
      canEdit: true,
      canComment: true,
      canManageUsers: isOwner || isCurrentUser,
      canLock: true,
    };
  }

  /**
   * Remove event listener (off method)
   */
  public off<K extends keyof CollaborationEvents>(
    event: K,
    handler?: CollaborationEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (handler) {
        handlers.delete(handler as Function);
      } else {
        handlers.clear();
      }
    }
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
   * Buffer operation for batching
   */
  private bufferOperation(documentId: string, operation: Operation): void {
    if (!this.operationBuffer.has(documentId)) {
      this.operationBuffer.set(documentId, []);
    }
    
    const buffer = this.operationBuffer.get(documentId)!;
    buffer.push(operation);
    
    // Flush buffer if it exceeds max size
    if (buffer.length >= this.performanceOptimizations.maxBufferSize) {
      this.flushOperationBuffer(documentId);
    }
  }

  /**
   * Flush operation buffer for a document
   */
  private flushOperationBuffer(documentId: string): void {
    const buffer = this.operationBuffer.get(documentId);
    if (!buffer || buffer.length === 0) return;

    if (this.otEngine && this.performanceOptimizations.compressionEnabled) {
      const compressed = this.otEngine.compressOperations(buffer);
      // Process compressed operations
    }
    
    this.operationBuffer.set(documentId, []);
  }

  /**
   * Update document state optimistically
   */
  private updateDocumentStateOptimistically(documentId: string, operation: Operation): void {
    let state = this.documentStates.get(documentId);
    if (!state) {
      state = { content: '', version: 0, vectorClock: {} };
      this.documentStates.set(documentId, state);
    }
    
    state.content = OperationUtils.applyToText(state.content, operation);
    state.version++;
    
    if (operation.vectorClock) {
      state.vectorClock = { ...operation.vectorClock };
    }
  }

  /**
   * Track latency for performance monitoring
   */
  private trackLatency(startTime: number): void {
    const latency = performance.now() - startTime;
    this.latencyTracker.timestamps.push(latency);
    
    // Keep only recent measurements
    if (this.latencyTracker.timestamps.length > 100) {
      this.latencyTracker.timestamps = this.latencyTracker.timestamps.slice(-50);
    }
    
    // Calculate average
    this.latencyTracker.average = this.latencyTracker.timestamps.reduce((a, b) => a + b, 0) / this.latencyTracker.timestamps.length;
  }

  /**
   * Transform operation against pending operations
   */
  private transformAgainstPending(remoteOperation: Operation): Operation[] {
    if (!this.otEngine) return [];

    const pendingOps = this.pendingChanges
      .filter(change => change.documentId === remoteOperation.userId) // Filter by document
      .map(change => ({
        id: change.id,
        userId: change.userId,
        timestamp: change.timestamp.getTime(),
        siteId: change.siteId || 0,
        sequence: change.sequence || 0,
        type: change.operation as any,
        position: change.position,
        content: change.content,
        length: change.length,
        attributes: change.attributes,
        vectorClock: change.vectorClock
      }));

    return this.otEngine.transformSequence([remoteOperation], pendingOps);
  }

  /**
   * Detect advanced conflicts using OT engine
   */
  private detectAdvancedConflicts(remoteOp: Operation, transformedOps: Operation[]): any[] {
    if (!this.otEngine) return [];

    const conflicts: any[] = [];
    
    for (const localOp of transformedOps) {
      const result = this.otEngine.transform(localOp, remoteOp);
      if (result.conflicts && result.conflicts.length > 0) {
        conflicts.push(...result.conflicts);
      }
    }
    
    return conflicts;
  }

  /**
   * Handle advanced conflicts with resolution strategies
   */
  private handleAdvancedConflicts(conflicts: any[], change: DocumentChange): void {
    conflicts.forEach(conflict => {
      const resolution: ConflictResolution = {
        strategy: 'merge',
        conflictId: this.generateId(),
        documentId: change.documentId,
        localChange: change,
        remoteChange: change,
        timestamp: new Date()
      };

      this.emit('conflict:detected', resolution);
      
      // Auto-resolve if strategy allows
      if (conflict.resolution === 'automatic') {
        this.resolveConflict(resolution.conflictId, change);
      }
    });
  }

  /**
   * Get enhanced collaboration statistics
   */
  public getStatistics(): {
    activeUsers: number;
    lockedDocuments: number;
    pendingChanges: number;
    conflicts: number;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    averageLatency: number;
    otStats?: any;
    bufferedOperations: number;
  } {
    const baseStats = {
      activeUsers: this.getActiveUsers().length,
      lockedDocuments: this.documentLocks.size,
      pendingChanges: this.pendingChanges.length,
      conflicts: this.conflictQueue.length,
      connectionStatus: this.socket?.connected ? 'connected' as const : 
                       this.reconnectAttempts > 0 ? 'reconnecting' as const : 'disconnected' as const,
      averageLatency: this.latencyTracker.average,
      bufferedOperations: Array.from(this.operationBuffer.values()).reduce((sum, buffer) => sum + buffer.length, 0)
    };

    if (this.otEngine) {
      return {
        ...baseStats,
        otStats: this.otEngine.getStats()
      };
    }

    return baseStats;
  }

  /**
   * Optimize performance settings
   */
  public optimizePerformance(settings: Partial<typeof this.performanceOptimizations>): void {
    this.performanceOptimizations = { ...this.performanceOptimizations, ...settings };
    
    // Reinitialize OT engine if caching settings changed
    if (settings.cacheEnabled !== undefined || settings.compressionEnabled !== undefined) {
      this.initializeOTEngine();
    }
  }

  /**
   * Get real-time performance metrics
   */
  public getPerformanceMetrics(): {
    latency: { current: number; average: number; max: number; min: number };
    throughput: { operationsPerSecond: number };
    memory: { cacheSize: number; bufferSize: number };
    conflicts: { rate: number; totalResolved: number };
  } {
    const latencies = this.latencyTracker.timestamps;
    
    return {
      latency: {
        current: latencies[latencies.length - 1] || 0,
        average: this.latencyTracker.average,
        max: Math.max(...latencies),
        min: Math.min(...latencies)
      },
      throughput: {
        operationsPerSecond: this.otEngine?.getStats()?.totalTransforms || 0
      },
      memory: {
        cacheSize: this.otEngine?.getStats()?.cacheHits || 0,
        bufferSize: Array.from(this.operationBuffer.values()).reduce((sum, buffer) => sum + buffer.length, 0)
      },
      conflicts: {
        rate: this.otEngine?.getStats()?.conflictRate || 0,
        totalResolved: this.conflictQueue.length
      }
    };
  }
}

// Export singleton instance and class for testing
export const collaborationService = CollaborationService.getInstance();
export { CollaborationService };