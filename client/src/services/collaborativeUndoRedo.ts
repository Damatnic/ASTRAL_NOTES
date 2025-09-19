/**
 * Collaborative Undo/Redo System with Branch Tracking
 * Implements advanced version control for collaborative editing
 * Supports branching, merging, and conflict-free undo/redo operations
 */

import { Operation, VectorClock } from './operationalTransform';

export interface HistoryEntry {
  id: string;
  operation: Operation;
  inverseOperation: Operation;
  timestamp: number;
  userId: string;
  userName: string;
  documentId: string;
  branchId: string;
  parentEntryId?: string;
  vectorClock: VectorClock;
  metadata: {
    description: string;
    operationType: 'user' | 'system' | 'merge' | 'revert';
    contextBefore: string;
    contextAfter: string;
    confidence: number; // 0-1 for system operations
    tags: string[];
  };
  status: 'applied' | 'reverted' | 'merged' | 'conflicted';
  conflictInfo?: ConflictInfo;
}

export interface Branch {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  parentBranchId?: string;
  branchPoint: string; // History entry ID where branch diverged
  headEntryId?: string; // Latest entry in this branch
  status: 'active' | 'merged' | 'abandoned' | 'archived';
  mergeInfo?: MergeInfo;
  collaborators: string[];
  permissions: BranchPermissions;
}

export interface MergeInfo {
  targetBranchId: string;
  mergedAt: number;
  mergedBy: string;
  strategy: 'fast-forward' | 'three-way' | 'manual';
  conflicts: ConflictInfo[];
  resolution?: MergeResolution;
}

export interface MergeResolution {
  resolvedBy: string;
  resolvedAt: number;
  strategy: 'accept-source' | 'accept-target' | 'custom';
  customResolution?: Operation[];
  description: string;
}

export interface ConflictInfo {
  id: string;
  type: 'content' | 'structure' | 'metadata' | 'permission';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceOperation: Operation;
  targetOperation: Operation;
  position: { start: number; end: number };
  suggestedResolution?: Operation[];
  manualResolutionRequired: boolean;
}

export interface BranchPermissions {
  read: string[];
  write: string[];
  merge: string[];
  admin: string[];
  public: boolean;
}

export interface UndoRedoState {
  currentBranchId: string;
  currentPosition: number; // Position in current branch history
  maxUndoDepth: number;
  enableBranching: boolean;
  autoMergeEnabled: boolean;
  conflictResolutionStrategy: 'auto' | 'manual' | 'prompt';
}

export interface VersionSnapshot {
  id: string;
  documentId: string;
  branchId: string;
  entryId: string;
  timestamp: number;
  content: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    createdBy: string;
    isAutoSnapshot: boolean;
  };
  checksum: string;
}

export interface UndoRedoOptions {
  createBranch?: boolean;
  branchName?: string;
  preserveConflicts?: boolean;
  mergeStrategy?: MergeInfo['strategy'];
  description?: string;
  tags?: string[];
}

export class CollaborativeUndoRedoSystem {
  private history: Map<string, HistoryEntry> = new Map();
  private branches: Map<string, Branch> = new Map();
  private snapshots: Map<string, VersionSnapshot> = new Map();
  private state: UndoRedoState;
  private eventHandlers = new Map<string, Set<Function>>();
  
  // Branch-specific history tracking
  private branchHistories: Map<string, string[]> = new Map(); // branchId -> entryIds[]
  private pendingOperations: Map<string, Operation[]> = new Map();
  private mergeQueue: MergeInfo[] = [];
  
  // Performance optimization
  private historyCache: Map<string, HistoryEntry[]> = new Map();
  private snapshotInterval: NodeJS.Timeout | null = null;
  private compressionTimer: NodeJS.Timeout | null = null;

  constructor(
    private documentId: string,
    private userId: string,
    private userName: string,
    config: Partial<UndoRedoState> = {}
  ) {
    this.state = {
      currentBranchId: 'main',
      currentPosition: 0,
      maxUndoDepth: 1000,
      enableBranching: true,
      autoMergeEnabled: false,
      conflictResolutionStrategy: 'prompt',
      ...config
    };

    this.initializeSystem();
  }

  /**
   * Initialize the undo/redo system
   */
  private initializeSystem(): void {
    // Create main branch
    const mainBranch: Branch = {
      id: 'main',
      name: 'Main',
      description: 'Primary development branch',
      createdBy: this.userId,
      createdAt: Date.now(),
      status: 'active',
      collaborators: [this.userId],
      permissions: {
        read: ['*'],
        write: [this.userId],
        merge: [this.userId],
        admin: [this.userId],
        public: true
      }
    };

    this.branches.set('main', mainBranch);
    this.branchHistories.set('main', []);

    // Start automatic snapshots
    this.startAutoSnapshots();
    
    // Start history compression
    this.startHistoryCompression();
  }

  /**
   * Record a new operation in history
   */
  public recordOperation(
    operation: Operation,
    inverseOperation: Operation,
    description: string = '',
    options: { branchId?: string; tags?: string[] } = {}
  ): HistoryEntry {
    const branchId = options.branchId || this.state.currentBranchId;
    const branch = this.branches.get(branchId);
    
    if (!branch) {
      throw new Error(`Branch ${branchId} not found`);
    }

    // Check permissions
    if (!this.hasWritePermission(branchId)) {
      throw new Error(`No write permission for branch ${branchId}`);
    }

    const entry: HistoryEntry = {
      id: this.generateId(),
      operation,
      inverseOperation,
      timestamp: Date.now(),
      userId: this.userId,
      userName: this.userName,
      documentId: this.documentId,
      branchId,
      vectorClock: operation.vectorClock || {},
      metadata: {
        description: description || this.generateDescription(operation),
        operationType: 'user',
        contextBefore: '', // Would capture surrounding text
        contextAfter: '',  // Would capture resulting text
        confidence: 1.0,
        tags: options.tags || []
      },
      status: 'applied'
    };

    // Set parent entry
    const branchHistory = this.branchHistories.get(branchId)!;
    if (branchHistory.length > 0) {
      entry.parentEntryId = branchHistory[branchHistory.length - 1];
    }

    // Store entry
    this.history.set(entry.id, entry);
    branchHistory.push(entry.id);

    // Update branch head
    branch.headEntryId = entry.id;

    // Update current position if this is the current branch
    if (branchId === this.state.currentBranchId) {
      this.state.currentPosition = branchHistory.length - 1;
    }

    // Clear cache for this branch
    this.historyCache.delete(branchId);

    // Emit event
    this.emit('operation:recorded', entry);

    // Check for auto-merge opportunities
    if (this.state.autoMergeEnabled) {
      this.checkAutoMerge(branchId);
    }

    return entry;
  }

  /**
   * Undo operation with collaborative awareness
   */
  public async undo(options: UndoRedoOptions = {}): Promise<Operation | null> {
    const branchId = this.state.currentBranchId;
    const branchHistory = this.branchHistories.get(branchId)!;
    
    if (this.state.currentPosition < 0) {
      return null; // Nothing to undo
    }

    const entryId = branchHistory[this.state.currentPosition];
    const entry = this.history.get(entryId);
    
    if (!entry || entry.status === 'reverted') {
      return null;
    }

    // Check for conflicts with other users' operations
    const conflicts = await this.checkUndoConflicts(entry);
    
    if (conflicts.length > 0) {
      if (options.createBranch) {
        return this.undoWithBranch(entry, options);
      } else {
        throw new UndoConflictError('Undo operation conflicts with recent changes', conflicts);
      }
    }

    // Perform undo
    entry.status = 'reverted';
    this.state.currentPosition--;

    // Emit events
    this.emit('operation:undone', entry);
    this.emit('state:changed', this.getState());

    return entry.inverseOperation;
  }

  /**
   * Redo operation with collaborative awareness
   */
  public async redo(options: UndoRedoOptions = {}): Promise<Operation | null> {
    const branchId = this.state.currentBranchId;
    const branchHistory = this.branchHistories.get(branchId)!;
    
    if (this.state.currentPosition >= branchHistory.length - 1) {
      return null; // Nothing to redo
    }

    const nextPosition = this.state.currentPosition + 1;
    const entryId = branchHistory[nextPosition];
    const entry = this.history.get(entryId);
    
    if (!entry || entry.status !== 'reverted') {
      return null;
    }

    // Check for conflicts
    const conflicts = await this.checkRedoConflicts(entry);
    
    if (conflicts.length > 0) {
      if (options.createBranch) {
        return this.redoWithBranch(entry, options);
      } else {
        throw new UndoConflictError('Redo operation conflicts with recent changes', conflicts);
      }
    }

    // Perform redo
    entry.status = 'applied';
    this.state.currentPosition++;

    // Emit events
    this.emit('operation:redone', entry);
    this.emit('state:changed', this.getState());

    return entry.operation;
  }

  /**
   * Create a new branch
   */
  public createBranch(
    name: string,
    description: string = '',
    options: {
      parentBranchId?: string;
      branchPoint?: string;
      permissions?: Partial<BranchPermissions>;
    } = {}
  ): Branch {
    const parentBranchId = options.parentBranchId || this.state.currentBranchId;
    const parentBranch = this.branches.get(parentBranchId);
    
    if (!parentBranch) {
      throw new Error(`Parent branch ${parentBranchId} not found`);
    }

    // Determine branch point
    let branchPoint = options.branchPoint;
    if (!branchPoint) {
      const parentHistory = this.branchHistories.get(parentBranchId)!;
      branchPoint = parentHistory[parentHistory.length - 1] || '';
    }

    const branch: Branch = {
      id: this.generateId(),
      name,
      description,
      createdBy: this.userId,
      createdAt: Date.now(),
      parentBranchId,
      branchPoint,
      status: 'active',
      collaborators: [this.userId],
      permissions: {
        read: [this.userId],
        write: [this.userId],
        merge: [this.userId],
        admin: [this.userId],
        public: false,
        ...options.permissions
      }
    };

    this.branches.set(branch.id, branch);
    this.branchHistories.set(branch.id, []);

    // Copy history up to branch point
    if (branchPoint) {
      const parentHistory = this.branchHistories.get(parentBranchId)!;
      const branchPointIndex = parentHistory.findIndex(id => id === branchPoint);
      
      if (branchPointIndex >= 0) {
        const branchHistory = parentHistory.slice(0, branchPointIndex + 1);
        this.branchHistories.set(branch.id, [...branchHistory]);
      }
    }

    this.emit('branch:created', branch);
    return branch;
  }

  /**
   * Switch to a different branch
   */
  public switchBranch(branchId: string): void {
    const branch = this.branches.get(branchId);
    if (!branch) {
      throw new Error(`Branch ${branchId} not found`);
    }

    if (!this.hasReadPermission(branchId)) {
      throw new Error(`No read permission for branch ${branchId}`);
    }

    const previousBranchId = this.state.currentBranchId;
    this.state.currentBranchId = branchId;
    
    // Update current position to end of new branch
    const branchHistory = this.branchHistories.get(branchId)!;
    this.state.currentPosition = branchHistory.length - 1;

    this.emit('branch:switched', {
      from: previousBranchId,
      to: branchId,
      position: this.state.currentPosition
    });
  }

  /**
   * Merge one branch into another
   */
  public async mergeBranch(
    sourceBranchId: string,
    targetBranchId: string,
    strategy: MergeInfo['strategy'] = 'three-way',
    options: {
      description?: string;
      autoResolve?: boolean;
    } = {}
  ): Promise<MergeInfo> {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    
    if (!sourceBranch || !targetBranch) {
      throw new Error('Source or target branch not found');
    }

    if (!this.hasMergePermission(targetBranchId)) {
      throw new Error(`No merge permission for target branch ${targetBranchId}`);
    }

    // Calculate merge base
    const mergeBase = this.findMergeBase(sourceBranchId, targetBranchId);
    
    // Detect conflicts
    const conflicts = await this.detectMergeConflicts(sourceBranchId, targetBranchId, mergeBase);
    
    const mergeInfo: MergeInfo = {
      targetBranchId,
      mergedAt: Date.now(),
      mergedBy: this.userId,
      strategy,
      conflicts
    };

    if (conflicts.length === 0 || (options.autoResolve && conflicts.every(c => !c.manualResolutionRequired))) {
      // Auto-merge possible
      await this.performMerge(sourceBranchId, targetBranchId, mergeInfo);
      sourceBranch.status = 'merged';
      sourceBranch.mergeInfo = mergeInfo;
    } else {
      // Manual resolution required
      this.mergeQueue.push(mergeInfo);
      this.emit('merge:conflicts', { mergeInfo, conflicts });
    }

    return mergeInfo;
  }

  /**
   * Resolve merge conflicts manually
   */
  public async resolveMergeConflicts(
    mergeInfo: MergeInfo,
    resolutions: Map<string, MergeResolution>
  ): Promise<void> {
    for (const conflict of mergeInfo.conflicts) {
      const resolution = resolutions.get(conflict.id);
      if (resolution) {
        // Apply resolution
        if (resolution.customResolution) {
          for (const operation of resolution.customResolution) {
            this.recordOperation(
              operation,
              this.invertOperation(operation),
              `Merge conflict resolution: ${resolution.description}`,
              { branchId: mergeInfo.targetBranchId, tags: ['merge-resolution'] }
            );
          }
        }
      }
    }

    // Complete the merge
    const sourceIndex = this.mergeQueue.findIndex(m => m === mergeInfo);
    if (sourceIndex >= 0) {
      this.mergeQueue.splice(sourceIndex, 1);
    }

    this.emit('merge:resolved', mergeInfo);
  }

  /**
   * Create a snapshot of current state
   */
  public createSnapshot(
    title: string,
    description: string = '',
    tags: string[] = []
  ): VersionSnapshot {
    const currentBranch = this.branches.get(this.state.currentBranchId)!;
    const content = this.reconstructContent(this.state.currentBranchId, this.state.currentPosition);
    
    const snapshot: VersionSnapshot = {
      id: this.generateId(),
      documentId: this.documentId,
      branchId: this.state.currentBranchId,
      entryId: currentBranch.headEntryId || '',
      timestamp: Date.now(),
      content,
      metadata: {
        title,
        description,
        tags,
        createdBy: this.userId,
        isAutoSnapshot: false
      },
      checksum: this.calculateChecksum(content)
    };

    this.snapshots.set(snapshot.id, snapshot);
    this.emit('snapshot:created', snapshot);
    
    return snapshot;
  }

  /**
   * Restore from a snapshot
   */
  public restoreFromSnapshot(
    snapshotId: string,
    options: { createBranch?: boolean; branchName?: string } = {}
  ): void {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    if (options.createBranch) {
      const branchName = options.branchName || `restore-${Date.now()}`;
      const branch = this.createBranch(branchName, `Restored from snapshot: ${snapshot.metadata.title}`);
      this.switchBranch(branch.id);
    }

    // Create restore operation
    const restoreOp = this.createRestoreOperation(snapshot);
    const inverseOp = this.invertOperation(restoreOp);
    
    this.recordOperation(
      restoreOp,
      inverseOp,
      `Restored from snapshot: ${snapshot.metadata.title}`,
      { tags: ['restore', 'snapshot'] }
    );

    this.emit('snapshot:restored', { snapshot, branch: options.createBranch });
  }

  /**
   * Get history for a branch
   */
  public getBranchHistory(branchId: string, limit?: number): HistoryEntry[] {
    if (!this.hasReadPermission(branchId)) {
      throw new Error(`No read permission for branch ${branchId}`);
    }

    // Check cache first
    const cacheKey = `${branchId}-${limit || 'all'}`;
    if (this.historyCache.has(cacheKey)) {
      return this.historyCache.get(cacheKey)!;
    }

    const entryIds = this.branchHistories.get(branchId) || [];
    const entries = entryIds
      .map(id => this.history.get(id))
      .filter((entry): entry is HistoryEntry => entry !== undefined)
      .slice(limit ? -limit : 0);

    // Cache result
    this.historyCache.set(cacheKey, entries);
    
    return entries;
  }

  /**
   * Get all branches
   */
  public getBranches(): Branch[] {
    return Array.from(this.branches.values()).filter(branch =>
      this.hasReadPermission(branch.id)
    );
  }

  /**
   * Get current state
   */
  public getState(): UndoRedoState & {
    canUndo: boolean;
    canRedo: boolean;
    currentBranch: Branch | null;
    historyLength: number;
  } {
    const branchHistory = this.branchHistories.get(this.state.currentBranchId) || [];
    
    return {
      ...this.state,
      canUndo: this.state.currentPosition >= 0,
      canRedo: this.state.currentPosition < branchHistory.length - 1,
      currentBranch: this.branches.get(this.state.currentBranchId) || null,
      historyLength: branchHistory.length
    };
  }

  /**
   * Get snapshots
   */
  public getSnapshots(branchId?: string): VersionSnapshot[] {
    const snapshots = Array.from(this.snapshots.values());
    
    if (branchId) {
      return snapshots.filter(s => s.branchId === branchId);
    }
    
    return snapshots.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Performance and utility methods
   */
  private async checkUndoConflicts(entry: HistoryEntry): Promise<ConflictInfo[]> {
    // Check if any operations after this entry would conflict with undoing it
    const conflicts: ConflictInfo[] = [];
    const branchHistory = this.branchHistories.get(entry.branchId)!;
    const entryIndex = branchHistory.findIndex(id => id === entry.id);
    
    if (entryIndex >= 0) {
      const subsequentEntries = branchHistory
        .slice(entryIndex + 1)
        .map(id => this.history.get(id))
        .filter((e): e is HistoryEntry => e !== undefined && e.status === 'applied');

      for (const subsequentEntry of subsequentEntries) {
        if (this.operationsConflict(entry.inverseOperation, subsequentEntry.operation)) {
          conflicts.push({
            id: this.generateId(),
            type: 'content',
            severity: 'medium',
            description: `Undo conflicts with ${subsequentEntry.metadata.description}`,
            sourceOperation: entry.inverseOperation,
            targetOperation: subsequentEntry.operation,
            position: {
              start: Math.min(entry.operation.position, subsequentEntry.operation.position),
              end: Math.max(
                entry.operation.position + (entry.operation.length || 0),
                subsequentEntry.operation.position + (subsequentEntry.operation.length || 0)
              )
            },
            manualResolutionRequired: true
          });
        }
      }
    }
    
    return conflicts;
  }

  private async checkRedoConflicts(entry: HistoryEntry): Promise<ConflictInfo[]> {
    // Similar to undo conflicts but checking redo operation
    return this.checkUndoConflicts(entry); // Simplified for example
  }

  private operationsConflict(op1: Operation, op2: Operation): boolean {
    // Simplified conflict detection - check position overlap
    const op1End = op1.position + (op1.length || op1.content?.length || 0);
    const op2End = op2.position + (op2.length || op2.content?.length || 0);
    
    return (op1.position < op2End && op2.position < op1End);
  }

  private async undoWithBranch(entry: HistoryEntry, options: UndoRedoOptions): Promise<Operation> {
    const branchName = options.branchName || `undo-${Date.now()}`;
    const branch = this.createBranch(branchName, `Undo branch for: ${entry.metadata.description}`);
    
    this.switchBranch(branch.id);
    
    // Record the undo operation in the new branch
    const undoEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      branchId: branch.id,
      timestamp: Date.now(),
      metadata: {
        ...entry.metadata,
        description: `Undo: ${entry.metadata.description}`,
        operationType: 'user',
        tags: [...entry.metadata.tags, 'undo-branch']
      }
    };
    
    this.history.set(undoEntry.id, undoEntry);
    this.branchHistories.get(branch.id)!.push(undoEntry.id);
    
    return entry.inverseOperation;
  }

  private async redoWithBranch(entry: HistoryEntry, options: UndoRedoOptions): Promise<Operation> {
    // Similar to undoWithBranch
    return this.undoWithBranch(entry, options);
  }

  private findMergeBase(branchId1: string, branchId2: string): string | null {
    // Find common ancestor of two branches
    const history1 = new Set(this.branchHistories.get(branchId1) || []);
    const history2 = this.branchHistories.get(branchId2) || [];
    
    // Find most recent common entry
    for (let i = history2.length - 1; i >= 0; i--) {
      if (history1.has(history2[i])) {
        return history2[i];
      }
    }
    
    return null;
  }

  private async detectMergeConflicts(
    sourceBranchId: string,
    targetBranchId: string,
    mergeBase: string | null
  ): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];
    
    // Get operations that differ between branches
    const sourceOps = this.getOperationsSince(sourceBranchId, mergeBase);
    const targetOps = this.getOperationsSince(targetBranchId, mergeBase);
    
    // Check for conflicts between operations
    for (const sourceOp of sourceOps) {
      for (const targetOp of targetOps) {
        if (this.operationsConflict(sourceOp.operation, targetOp.operation)) {
          conflicts.push({
            id: this.generateId(),
            type: 'content',
            severity: 'medium',
            description: `Merge conflict between "${sourceOp.metadata.description}" and "${targetOp.metadata.description}"`,
            sourceOperation: sourceOp.operation,
            targetOperation: targetOp.operation,
            position: {
              start: Math.min(sourceOp.operation.position, targetOp.operation.position),
              end: Math.max(
                sourceOp.operation.position + (sourceOp.operation.length || 0),
                targetOp.operation.position + (targetOp.operation.length || 0)
              )
            },
            manualResolutionRequired: true
          });
        }
      }
    }
    
    return conflicts;
  }

  private getOperationsSince(branchId: string, sinceEntryId: string | null): HistoryEntry[] {
    const branchHistory = this.branchHistories.get(branchId) || [];
    
    if (!sinceEntryId) {
      return branchHistory.map(id => this.history.get(id)).filter((e): e is HistoryEntry => e !== undefined);
    }
    
    const sinceIndex = branchHistory.findIndex(id => id === sinceEntryId);
    if (sinceIndex < 0) {
      return [];
    }
    
    return branchHistory
      .slice(sinceIndex + 1)
      .map(id => this.history.get(id))
      .filter((e): e is HistoryEntry => e !== undefined);
  }

  private async performMerge(sourceBranchId: string, targetBranchId: string, mergeInfo: MergeInfo): Promise<void> {
    const sourceOps = this.getOperationsSince(sourceBranchId, mergeInfo.targetBranchId);
    
    // Apply source operations to target branch
    for (const entry of sourceOps) {
      const mergeEntry: HistoryEntry = {
        ...entry,
        id: this.generateId(),
        branchId: targetBranchId,
        timestamp: Date.now(),
        metadata: {
          ...entry.metadata,
          operationType: 'merge',
          description: `Merged: ${entry.metadata.description}`,
          tags: [...entry.metadata.tags, 'merged']
        }
      };
      
      this.history.set(mergeEntry.id, mergeEntry);
      this.branchHistories.get(targetBranchId)!.push(mergeEntry.id);
    }
  }

  private reconstructContent(branchId: string, position: number): string {
    // Reconstruct document content by applying operations up to position
    let content = '';
    const branchHistory = this.branchHistories.get(branchId) || [];
    
    for (let i = 0; i <= position && i < branchHistory.length; i++) {
      const entry = this.history.get(branchHistory[i]);
      if (entry && entry.status === 'applied') {
        content = this.applyOperation(content, entry.operation);
      }
    }
    
    return content;
  }

  private applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
      default:
        return content;
    }
  }

  private invertOperation(operation: Operation): Operation {
    switch (operation.type) {
      case 'insert':
        return {
          ...operation,
          type: 'delete',
          length: operation.content?.length || 0,
          content: undefined
        };
      case 'delete':
        return {
          ...operation,
          type: 'insert',
          content: '', // Would need to capture deleted content
          length: undefined
        };
      default:
        return operation;
    }
  }

  private createRestoreOperation(snapshot: VersionSnapshot): Operation {
    // Create operation to restore to snapshot content
    return {
      id: this.generateId(),
      userId: this.userId,
      timestamp: Date.now(),
      siteId: 0,
      sequence: 0,
      type: 'insert',
      position: 0,
      content: snapshot.content
    };
  }

  private generateDescription(operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return `Insert "${operation.content?.slice(0, 20)}${operation.content && operation.content.length > 20 ? '...' : ''}"`;
      case 'delete':
        return `Delete ${operation.length} characters`;
      default:
        return `${operation.type} operation`;
    }
  }

  private calculateChecksum(content: string): string {
    // Simple checksum - in production use proper hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private startAutoSnapshots(): void {
    this.snapshotInterval = setInterval(() => {
      const currentBranch = this.branches.get(this.state.currentBranchId);
      if (currentBranch && currentBranch.headEntryId) {
        this.createAutoSnapshot();
      }
    }, 300000); // Every 5 minutes
  }

  private createAutoSnapshot(): void {
    const content = this.reconstructContent(this.state.currentBranchId, this.state.currentPosition);
    const snapshot: VersionSnapshot = {
      id: this.generateId(),
      documentId: this.documentId,
      branchId: this.state.currentBranchId,
      entryId: this.branches.get(this.state.currentBranchId)?.headEntryId || '',
      timestamp: Date.now(),
      content,
      metadata: {
        title: `Auto-snapshot ${new Date().toISOString()}`,
        description: 'Automatic periodic snapshot',
        tags: ['auto-snapshot'],
        createdBy: 'system',
        isAutoSnapshot: true
      },
      checksum: this.calculateChecksum(content)
    };

    this.snapshots.set(snapshot.id, snapshot);
  }

  private startHistoryCompression(): void {
    this.compressionTimer = setInterval(() => {
      this.compressHistory();
    }, 600000); // Every 10 minutes
  }

  private compressHistory(): void {
    // Remove old entries beyond max depth
    for (const [branchId, history] of this.branchHistories.entries()) {
      if (history.length > this.state.maxUndoDepth) {
        const toRemove = history.splice(0, history.length - this.state.maxUndoDepth);
        toRemove.forEach(entryId => this.history.delete(entryId));
      }
    }

    // Clear history cache
    this.historyCache.clear();
  }

  private checkAutoMerge(branchId: string): void {
    // Check if this branch can be auto-merged with its parent
    const branch = this.branches.get(branchId);
    if (!branch || !branch.parentBranchId) return;

    // Simple auto-merge conditions
    const branchHistory = this.branchHistories.get(branchId)!;
    if (branchHistory.length === 1) { // Only one operation
      this.mergeBranch(branchId, branch.parentBranchId, 'fast-forward', { autoResolve: true })
        .catch(error => {
          console.warn('Auto-merge failed:', error);
        });
    }
  }

  private hasReadPermission(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) return false;
    
    return branch.permissions.public || 
           branch.permissions.read.includes('*') ||
           branch.permissions.read.includes(this.userId);
  }

  private hasWritePermission(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) return false;
    
    return branch.permissions.write.includes('*') ||
           branch.permissions.write.includes(this.userId);
  }

  private hasMergePermission(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) return false;
    
    return branch.permissions.merge.includes('*') ||
           branch.permissions.merge.includes(this.userId);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event system
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

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in undo/redo event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    
    if (this.compressionTimer) {
      clearInterval(this.compressionTimer);
    }
    
    this.history.clear();
    this.branches.clear();
    this.snapshots.clear();
    this.branchHistories.clear();
    this.historyCache.clear();
    this.eventHandlers.clear();
  }
}

// Custom error class
export class UndoConflictError extends Error {
  constructor(message: string, public conflicts: ConflictInfo[]) {
    super(message);
    this.name = 'UndoConflictError';
  }
}

// Factory function
export function createCollaborativeUndoRedo(
  documentId: string,
  userId: string,
  userName: string,
  config?: Partial<UndoRedoState>
): CollaborativeUndoRedoSystem {
  return new CollaborativeUndoRedoSystem(documentId, userId, userName, config);
}