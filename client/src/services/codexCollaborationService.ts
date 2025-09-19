/**
 * Codex Collaboration Service - Phase 1C Enhancement
 * Real-time collaborative editing for Codex entities with conflict resolution
 * Integrates with existing collaboration infrastructure
 */

import { collaborationService } from './collaborationService';
import { advancedCodexService } from './advancedCodexService';
import { universeManagementService } from './universeManagementService';
import type {
  AdvancedCodexEntity,
  CodexCollaborationEvent,
  CodexPresence,
  CollaborativeNote,
  ConsistencyFlag
} from '@/types/codex';

// Enhanced collaboration interfaces
export interface CodexCollaborationState {
  activeCollaborators: Map<string, CodexCollaborator>;
  entityLocks: Map<string, EntityLock>;
  realtimeChanges: Map<string, RealtimeChange[]>;
  conflictResolutions: Map<string, ConflictResolution>;
  collaborationHistory: CollaborationHistoryEntry[];
}

export interface CodexCollaborator {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  permissions: CodexPermission[];
  currentEntity?: string;
  lastActivity: string;
  isOnline: boolean;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  viewportEntity?: string;
}

export type CodexPermission = 
  | 'create_entities' | 'edit_entities' | 'delete_entities'
  | 'create_relationships' | 'edit_relationships' | 'delete_relationships'
  | 'comment' | 'suggest_changes' | 'approve_changes'
  | 'manage_timeline' | 'export_data' | 'manage_collaborators';

export interface EntityLock {
  entityId: string;
  lockedBy: string;
  lockedAt: string;
  lockType: 'exclusive' | 'shared' | 'suggestion';
  expiresAt: string;
  reason?: string;
}

export interface RealtimeChange {
  id: string;
  entityId: string;
  userId: string;
  userName: string;
  changeType: 'create' | 'update' | 'delete' | 'relationship_add' | 'relationship_remove';
  field?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  isApplied: boolean;
  requiresApproval: boolean;
  approvedBy?: string;
  rejectedBy?: string;
  conflictsWith?: string[]; // Other change IDs
}

export interface ConflictResolution {
  id: string;
  entityId: string;
  conflictingChanges: string[]; // Change IDs
  resolutionStrategy: 'accept_all' | 'reject_all' | 'manual_merge' | 'latest_wins' | 'priority_user';
  resolvedBy: string;
  resolvedAt: string;
  finalValue: any;
  reasoning?: string;
}

export interface CollaborationHistoryEntry {
  id: string;
  type: 'entity_created' | 'entity_updated' | 'entity_deleted' | 'relationship_created' | 'relationship_deleted' | 'comment_added' | 'suggestion_made' | 'conflict_resolved';
  entityId: string;
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface CursorPosition {
  entityId: string;
  field?: string;
  position?: number;
  x?: number;
  y?: number;
}

export interface SelectionRange {
  entityId: string;
  field?: string;
  start: number;
  end: number;
}

export interface CollaborationSettings {
  enableRealtimeSync: boolean;
  enablePresenceAwareness: boolean;
  enableConflictDetection: boolean;
  autoResolveConflicts: boolean;
  requireApprovalForMajorChanges: boolean;
  lockDuration: number; // minutes
  maxConcurrentEditors: number;
  enableComments: boolean;
  enableSuggestions: boolean;
}

export interface ChangeApproval {
  changeId: string;
  approvalType: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  suggestedModifications?: any;
}

export interface CollaborationMetrics {
  totalCollaborators: number;
  activeCollaborators: number;
  entitiesBeingEdited: number;
  pendingChanges: number;
  resolvedConflicts: number;
  averageResolutionTime: number;
  collaborationScore: number;
}

class CodexCollaborationService {
  private state: CodexCollaborationState;
  private settings: CollaborationSettings;
  private websocket: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private changeBuffer: Map<string, RealtimeChange[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.state = {
      activeCollaborators: new Map(),
      entityLocks: new Map(),
      realtimeChanges: new Map(),
      conflictResolutions: new Map(),
      collaborationHistory: []
    };

    this.settings = this.getDefaultSettings();
    this.loadSettings();
    this.initializeWebSocket();
  }

  // INITIALIZATION AND CONNECTION

  private initializeWebSocket(): void {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/codex-collaboration`;
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('Codex collaboration WebSocket connected');
      this.startHeartbeat();
      this.syncInitialState();
    };

    this.websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onclose = () => {
      console.log('Codex collaboration WebSocket disconnected');
      this.stopHeartbeat();
      // Attempt reconnection after delay
      setTimeout(() => this.initializeWebSocket(), 5000);
    };

    this.websocket.onerror = (error) => {
      console.error('Codex collaboration WebSocket error:', error);
    };
  }

  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'collaborator_joined':
        this.handleCollaboratorJoined(message.data);
        break;
      case 'collaborator_left':
        this.handleCollaboratorLeft(message.data);
        break;
      case 'entity_locked':
        this.handleEntityLocked(message.data);
        break;
      case 'entity_unlocked':
        this.handleEntityUnlocked(message.data);
        break;
      case 'realtime_change':
        this.handleRealtimeChange(message.data);
        break;
      case 'presence_update':
        this.handlePresenceUpdate(message.data);
        break;
      case 'conflict_detected':
        this.handleConflictDetected(message.data);
        break;
      case 'conflict_resolved':
        this.handleConflictResolved(message.data);
        break;
      case 'comment_added':
        this.handleCommentAdded(message.data);
        break;
      case 'approval_request':
        this.handleApprovalRequest(message.data);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  // PRESENCE AND AWARENESS

  async joinCollaboration(projectId: string, entityId?: string): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'join_collaboration',
        projectId,
        entityId,
        timestamp: new Date().toISOString()
      }));
    }

    // Update local presence
    await this.updatePresence(projectId, entityId);
  }

  async leaveCollaboration(projectId: string): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'leave_collaboration',
        projectId,
        timestamp: new Date().toISOString()
      }));
    }

    // Clear local state
    this.state.activeCollaborators.clear();
    this.state.entityLocks.clear();
  }

  async updatePresence(projectId: string, entityId?: string, cursor?: CursorPosition): Promise<void> {
    const presence = {
      projectId,
      entityId,
      cursor,
      timestamp: new Date().toISOString()
    };

    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'presence_update',
        data: presence
      }));
    }

    // Update with advanced codex service
    await advancedCodexService.updatePresence(projectId, entityId);
  }

  getActiveCollaborators(): CodexCollaborator[] {
    return Array.from(this.state.activeCollaborators.values());
  }

  getCollaboratorsOnEntity(entityId: string): CodexCollaborator[] {
    return Array.from(this.state.activeCollaborators.values())
      .filter(collaborator => collaborator.currentEntity === entityId);
  }

  // ENTITY LOCKING

  async requestEntityLock(
    entityId: string,
    lockType: EntityLock['lockType'] = 'exclusive',
    duration: number = this.settings.lockDuration
  ): Promise<boolean> {
    try {
      const response = await advancedCodexService.requestEntityLock?.(entityId, lockType, duration);
      
      if (response?.success) {
        const lock: EntityLock = {
          entityId,
          lockedBy: response.userId,
          lockedAt: new Date().toISOString(),
          lockType,
          expiresAt: new Date(Date.now() + duration * 60000).toISOString()
        };
        
        this.state.entityLocks.set(entityId, lock);
        this.emitEvent('entity_locked', lock);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request entity lock:', error);
      return false;
    }
  }

  async releaseEntityLock(entityId: string): Promise<void> {
    try {
      await advancedCodexService.releaseEntityLock?.(entityId);
      
      this.state.entityLocks.delete(entityId);
      this.emitEvent('entity_unlocked', { entityId });
    } catch (error) {
      console.error('Failed to release entity lock:', error);
    }
  }

  isEntityLocked(entityId: string): boolean {
    const lock = this.state.entityLocks.get(entityId);
    if (!lock) return false;
    
    // Check if lock has expired
    if (new Date(lock.expiresAt) < new Date()) {
      this.state.entityLocks.delete(entityId);
      return false;
    }
    
    return true;
  }

  getEntityLock(entityId: string): EntityLock | null {
    return this.state.entityLocks.get(entityId) || null;
  }

  // REALTIME CHANGES

  async submitChange(
    entityId: string,
    changeType: RealtimeChange['changeType'],
    field: string,
    newValue: any,
    oldValue?: any
  ): Promise<RealtimeChange> {
    const change: RealtimeChange = {
      id: this.generateChangeId(),
      entityId,
      userId: 'current-user', // Would come from auth context
      userName: 'Current User', // Would come from auth context
      changeType,
      field,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      isApplied: false,
      requiresApproval: this.doesChangeRequireApproval(changeType, field, newValue)
    };

    // Add to buffer for batching
    if (!this.changeBuffer.has(entityId)) {
      this.changeBuffer.set(entityId, []);
    }
    this.changeBuffer.get(entityId)!.push(change);

    // Send immediately for certain types or batch for others
    if (this.shouldSendImmediately(changeType)) {
      await this.flushChanges(entityId);
    } else {
      // Batch changes and send after delay
      this.scheduleChangeFlush(entityId);
    }

    return change;
  }

  private async flushChanges(entityId: string): Promise<void> {
    const changes = this.changeBuffer.get(entityId);
    if (!changes || changes.length === 0) return;

    try {
      // Check for conflicts before applying
      const conflicts = await this.detectConflicts(changes);
      
      if (conflicts.length > 0 && this.settings.enableConflictDetection) {
        await this.handleConflicts(conflicts);
      } else {
        // Apply changes
        for (const change of changes) {
          await this.applyChange(change);
        }
      }
      
      // Clear buffer
      this.changeBuffer.delete(entityId);
      
      // Send to other collaborators
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'changes_batch',
          entityId,
          changes,
          timestamp: new Date().toISOString()
        }));
      }
      
    } catch (error) {
      console.error('Failed to flush changes:', error);
    }
  }

  private async applyChange(change: RealtimeChange): Promise<void> {
    try {
      // Apply the change to the entity
      const entity = await advancedCodexService.getEntity(change.entityId);
      const updatedEntity = this.applyChangeToEntity(entity, change);
      
      // Update the entity
      await advancedCodexService.updateEntity(change.entityId, updatedEntity, {
        skipAutoLink: true, // Avoid triggering auto-link during collaboration
        skipConsistencyCheck: false
      });
      
      change.isApplied = true;
      
      // Add to realtime changes
      if (!this.state.realtimeChanges.has(change.entityId)) {
        this.state.realtimeChanges.set(change.entityId, []);
      }
      this.state.realtimeChanges.get(change.entityId)!.push(change);
      
      this.emitEvent('change_applied', change);
    } catch (error) {
      console.error('Failed to apply change:', error);
      this.emitEvent('change_failed', { change, error: error.message });
    }
  }

  private applyChangeToEntity(entity: AdvancedCodexEntity, change: RealtimeChange): Partial<AdvancedCodexEntity> {
    const updates: any = {};
    
    if (change.field) {
      // Handle nested field updates
      const fieldParts = change.field.split('.');
      let target = updates;
      
      for (let i = 0; i < fieldParts.length - 1; i++) {
        const part = fieldParts[i];
        if (!target[part]) {
          target[part] = { ...entity[part as keyof AdvancedCodexEntity] };
        }
        target = target[part];
      }
      
      target[fieldParts[fieldParts.length - 1]] = change.newValue;
    }
    
    return updates;
  }

  // CONFLICT DETECTION AND RESOLUTION

  private async detectConflicts(changes: RealtimeChange[]): Promise<RealtimeChange[]> {
    const conflicts: RealtimeChange[] = [];
    
    for (const change of changes) {
      // Check for concurrent changes to the same field
      const entityChanges = this.state.realtimeChanges.get(change.entityId) || [];
      const concurrentChanges = entityChanges.filter(
        existing => 
          existing.field === change.field && 
          !existing.isApplied &&
          existing.userId !== change.userId &&
          Math.abs(new Date(existing.timestamp).getTime() - new Date(change.timestamp).getTime()) < 30000 // 30 seconds
      );
      
      if (concurrentChanges.length > 0) {
        change.conflictsWith = concurrentChanges.map(c => c.id);
        conflicts.push(change);
      }
    }
    
    return conflicts;
  }

  private async handleConflicts(conflicts: RealtimeChange[]): Promise<void> {
    if (this.settings.autoResolveConflicts) {
      // Auto-resolve using latest wins strategy
      for (const conflict of conflicts) {
        const resolution: ConflictResolution = {
          id: this.generateResolutionId(),
          entityId: conflict.entityId,
          conflictingChanges: [conflict.id, ...(conflict.conflictsWith || [])],
          resolutionStrategy: 'latest_wins',
          resolvedBy: 'system',
          resolvedAt: new Date().toISOString(),
          finalValue: conflict.newValue
        };
        
        this.state.conflictResolutions.set(resolution.id, resolution);
        await this.applyChange(conflict);
        
        this.emitEvent('conflict_auto_resolved', resolution);
      }
    } else {
      // Request manual resolution
      for (const conflict of conflicts) {
        this.emitEvent('conflict_detected', conflict);
      }
    }
  }

  async resolveConflict(
    conflictId: string,
    resolution: Omit<ConflictResolution, 'id' | 'resolvedAt'>
  ): Promise<void> {
    const fullResolution: ConflictResolution = {
      ...resolution,
      id: conflictId,
      resolvedAt: new Date().toISOString()
    };
    
    this.state.conflictResolutions.set(conflictId, fullResolution);
    
    // Apply the resolved change
    const changeToApply = this.findChangeById(fullResolution.conflictingChanges[0]);
    if (changeToApply) {
      changeToApply.newValue = fullResolution.finalValue;
      await this.applyChange(changeToApply);
    }
    
    this.emitEvent('conflict_resolved', fullResolution);
  }

  // COMMENTS AND SUGGESTIONS

  async addComment(
    entityId: string,
    content: string,
    field?: string,
    parentCommentId?: string
  ): Promise<CollaborativeNote> {
    const comment: CollaborativeNote = {
      id: this.generateCommentId(),
      authorId: 'current-user',
      authorName: 'Current User',
      content,
      type: 'comment',
      resolved: false,
      replies: [],
      createdAt: new Date().toISOString()
    };
    
    try {
      await advancedCodexService.addCollaborativeNote(entityId, content, 'comment');
      
      this.emitEvent('comment_added', { entityId, comment, field });
      
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'comment_added',
          entityId,
          comment,
          field,
          parentCommentId
        }));
      }
      
      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  async addSuggestion(
    entityId: string,
    field: string,
    suggestedValue: any,
    reasoning?: string
  ): Promise<CollaborativeNote> {
    const suggestion: CollaborativeNote = {
      id: this.generateCommentId(),
      authorId: 'current-user',
      authorName: 'Current User',
      content: reasoning || 'Suggested change',
      type: 'suggestion',
      resolved: false,
      replies: [],
      createdAt: new Date().toISOString()
    };
    
    try {
      await advancedCodexService.addCollaborativeNote(entityId, suggestion.content, 'suggestion');
      
      this.emitEvent('suggestion_added', { entityId, suggestion, field, suggestedValue });
      
      return suggestion;
    } catch (error) {
      console.error('Failed to add suggestion:', error);
      throw error;
    }
  }

  // APPROVAL WORKFLOW

  async requestApproval(changeId: string, approvers: string[]): Promise<void> {
    const change = this.findChangeById(changeId);
    if (!change) return;
    
    change.requiresApproval = true;
    
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'approval_request',
        changeId,
        approvers,
        change
      }));
    }
    
    this.emitEvent('approval_requested', { changeId, approvers, change });
  }

  async approveChange(changeId: string, approval: ChangeApproval): Promise<void> {
    const change = this.findChangeById(changeId);
    if (!change) return;
    
    if (approval.approvalType === 'approve') {
      change.approvedBy = 'current-user';
      await this.applyChange(change);
    } else if (approval.approvalType === 'reject') {
      change.rejectedBy = 'current-user';
    }
    
    this.emitEvent('change_approval_given', { changeId, approval });
  }

  // METRICS AND ANALYTICS

  getCollaborationMetrics(): CollaborationMetrics {
    const totalCollaborators = this.state.activeCollaborators.size;
    const activeCollaborators = Array.from(this.state.activeCollaborators.values())
      .filter(c => c.isOnline).length;
    
    const entitiesBeingEdited = new Set(
      Array.from(this.state.activeCollaborators.values())
        .map(c => c.currentEntity)
        .filter(Boolean)
    ).size;
    
    const pendingChanges = Array.from(this.state.realtimeChanges.values())
      .flat()
      .filter(c => !c.isApplied).length;
    
    const resolvedConflicts = this.state.conflictResolutions.size;
    
    // Calculate average resolution time
    const resolutions = Array.from(this.state.conflictResolutions.values());
    const averageResolutionTime = resolutions.length > 0
      ? resolutions.reduce((sum, r) => {
          const conflictTime = new Date(r.resolvedAt).getTime();
          return sum + conflictTime;
        }, 0) / resolutions.length
      : 0;
    
    // Calculate collaboration score based on activity and conflict resolution
    const collaborationScore = Math.min(100, 
      (activeCollaborators * 20) + 
      (resolvedConflicts * 10) + 
      (entitiesBeingEdited * 5) - 
      (pendingChanges * 2)
    );
    
    return {
      totalCollaborators,
      activeCollaborators,
      entitiesBeingEdited,
      pendingChanges,
      resolvedConflicts,
      averageResolutionTime,
      collaborationScore
    };
  }

  // EVENT HANDLING

  private handleCollaboratorJoined(collaborator: CodexCollaborator): void {
    this.state.activeCollaborators.set(collaborator.userId, collaborator);
    this.emitEvent('collaborator_joined', collaborator);
  }

  private handleCollaboratorLeft(data: { userId: string }): void {
    this.state.activeCollaborators.delete(data.userId);
    this.emitEvent('collaborator_left', data);
  }

  private handleEntityLocked(lock: EntityLock): void {
    this.state.entityLocks.set(lock.entityId, lock);
    this.emitEvent('entity_locked', lock);
  }

  private handleEntityUnlocked(data: { entityId: string }): void {
    this.state.entityLocks.delete(data.entityId);
    this.emitEvent('entity_unlocked', data);
  }

  private handleRealtimeChange(change: RealtimeChange): void {
    if (!this.state.realtimeChanges.has(change.entityId)) {
      this.state.realtimeChanges.set(change.entityId, []);
    }
    this.state.realtimeChanges.get(change.entityId)!.push(change);
    this.emitEvent('realtime_change', change);
  }

  private handlePresenceUpdate(presence: any): void {
    const collaborator = this.state.activeCollaborators.get(presence.userId);
    if (collaborator) {
      collaborator.currentEntity = presence.entityId;
      collaborator.cursor = presence.cursor;
      collaborator.lastActivity = presence.timestamp;
      this.emitEvent('presence_updated', presence);
    }
  }

  private handleConflictDetected(conflict: any): void {
    this.emitEvent('conflict_detected', conflict);
  }

  private handleConflictResolved(resolution: ConflictResolution): void {
    this.state.conflictResolutions.set(resolution.id, resolution);
    this.emitEvent('conflict_resolved', resolution);
  }

  private handleCommentAdded(data: any): void {
    this.emitEvent('comment_added', data);
  }

  private handleApprovalRequest(data: any): void {
    this.emitEvent('approval_requested', data);
  }

  // UTILITY METHODS

  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResolutionId(): string {
    return `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private findChangeById(changeId: string): RealtimeChange | null {
    for (const changes of this.state.realtimeChanges.values()) {
      const change = changes.find(c => c.id === changeId);
      if (change) return change;
    }
    return null;
  }

  private doesChangeRequireApproval(
    changeType: RealtimeChange['changeType'],
    field: string,
    newValue: any
  ): boolean {
    if (!this.settings.requireApprovalForMajorChanges) return false;
    
    // Define which changes require approval
    const majorFields = ['name', 'type', 'importance', 'status'];
    const majorChangeTypes = ['delete', 'create'];
    
    return majorChangeTypes.includes(changeType) || majorFields.includes(field);
  }

  private shouldSendImmediately(changeType: RealtimeChange['changeType']): boolean {
    const immediateTypes = ['delete', 'create'];
    return immediateTypes.includes(changeType);
  }

  private scheduleChangeFlush(entityId: string): void {
    // Debounce change flushing
    setTimeout(() => {
      this.flushChanges(entityId);
    }, 1000); // 1 second delay for batching
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async syncInitialState(): Promise<void> {
    try {
      // Sync with server state
      // This would typically fetch current collaborators, locks, etc.
    } catch (error) {
      console.error('Failed to sync initial collaboration state:', error);
    }
  }

  private getDefaultSettings(): CollaborationSettings {
    return {
      enableRealtimeSync: true,
      enablePresenceAwareness: true,
      enableConflictDetection: true,
      autoResolveConflicts: false,
      requireApprovalForMajorChanges: true,
      lockDuration: 30, // minutes
      maxConcurrentEditors: 10,
      enableComments: true,
      enableSuggestions: true
    };
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('codex_collaboration_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load collaboration settings:', error);
    }
  }

  // PUBLIC API

  updateSettings(updates: Partial<CollaborationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    
    try {
      localStorage.setItem('codex_collaboration_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save collaboration settings:', error);
    }
    
    this.emitEvent('settings_updated', this.settings);
  }

  getSettings(): CollaborationSettings {
    return { ...this.settings };
  }

  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in collaboration event listener for ${eventType}:`, error);
      }
    });
  }

  // CLEANUP

  dispose(): void {
    this.stopHeartbeat();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.changeBuffer.clear();
    this.eventListeners.clear();
    
    // Clear state
    this.state.activeCollaborators.clear();
    this.state.entityLocks.clear();
    this.state.realtimeChanges.clear();
    this.state.conflictResolutions.clear();
    this.state.collaborationHistory = [];
  }
}

// Export singleton instance
export const codexCollaborationService = new CodexCollaborationService();
export default codexCollaborationService;