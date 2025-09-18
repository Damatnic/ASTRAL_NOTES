/**
 * Advanced Offline Sync Manager
 * Handles cross-platform synchronization, conflict resolution, and data integrity
 * Supports progressive sync, real-time updates, and seamless offline-to-online transitions
 */

import { EventEmitter } from 'events';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'scene' | 'character' | 'location' | 'note' | 'moodboard';
  entityId: string;
  data: any;
  timestamp: number;
  deviceId: string;
  userId: string;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

export interface ConflictResolution {
  strategy: 'merge' | 'overwrite' | 'manual' | 'defer';
  winningVersion: 'local' | 'remote' | 'merged';
  mergedData?: any;
  reason: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingOperations: number;
  inProgress: boolean;
  errors: SyncError[];
  devicesSynced: string[];
  conflictsResolved: number;
  bytesTransferred: number;
}

export interface SyncError {
  id: string;
  operation: SyncOperation;
  error: string;
  timestamp: number;
  retryable: boolean;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'tablet' | 'mobile' | 'web';
  platform: string;
  lastSeen: number;
  version: string;
}

class OfflineSyncManager extends EventEmitter {
  private db!: IDBDatabase;
  private isInitialized = false;
  private syncInProgress = false;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private deviceId: string;
  private userId: string;
  private apiEndpoint: string;
  private syncInterval: number = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;

  constructor(userId: string, apiEndpoint: string) {
    super();
    this.userId = userId;
    this.apiEndpoint = apiEndpoint;
    this.deviceId = this.generateDeviceId();
    this.initializeDB();
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private generateDeviceId(): string {
    const stored = localStorage.getItem('astral_device_id');
    if (stored) return stored;
    
    const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('astral_device_id', id);
    return id;
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AstralSyncDB', 3);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.emit('initialized');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Operations queue for offline changes
        if (!db.objectStoreNames.contains('sync_operations')) {
          const store = db.createObjectStore('sync_operations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('priority', 'priority');
          store.createIndex('entity', 'entity');
        }
        
        // Conflict resolution store
        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'id' });
        }
        
        // Device registry
        if (!db.objectStoreNames.contains('devices')) {
          const deviceStore = db.createObjectStore('devices', { keyPath: 'id' });
          deviceStore.createIndex('lastSeen', 'lastSeen');
        }
        
        // Sync metadata
        if (!db.objectStoreNames.contains('sync_metadata')) {
          db.createObjectStore('sync_metadata', { keyPath: 'key' });
        }
        
        // Entity snapshots for conflict detection
        if (!db.objectStoreNames.contains('entity_snapshots')) {
          const snapshotStore = db.createObjectStore('entity_snapshots', { keyPath: 'id' });
          snapshotStore.createIndex('entityId', 'entityId');
          snapshotStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.emit('online');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.emit('offline');
    });

    // Page visibility for mobile battery optimization
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.triggerSync();
      }
    });
  }

  private startPeriodicSync(): void {
    this.intervalId = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.triggerSync();
      }
    }, this.syncInterval);
  }

  public async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'deviceId' | 'userId' | 'retryCount'>): Promise<void> {
    if (!this.isInitialized) {
      await new Promise((resolve) => this.once('initialized', resolve));
    }

    const fullOperation: SyncOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      userId: this.userId,
      retryCount: 0
    };

    const tx = this.db.transaction(['sync_operations'], 'readwrite');
    await tx.objectStore('sync_operations').add(fullOperation);

    this.emit('operationQueued', fullOperation);

    // Trigger immediate sync for high priority operations
    if (operation.priority === 'high' && navigator.onLine) {
      this.triggerSync();
    }
  }

  public async triggerSync(force = false): Promise<void> {
    if (this.syncInProgress && !force) return;
    if (!navigator.onLine) return;

    this.syncInProgress = true;
    this.emit('syncStarted');

    try {
      await this.performSync();
      this.emit('syncCompleted');
    } catch (error) {
      this.emit('syncError', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async performSync(): Promise<void> {
    // Step 1: Get pending operations
    const operations = await this.getPendingOperations();
    
    // Step 2: Group operations by dependency order
    const orderedOps = this.sortOperationsByDependencies(operations);
    
    // Step 3: Send operations in batches
    for (const batch of this.createBatches(orderedOps)) {
      await this.syncBatch(batch);
    }
    
    // Step 4: Pull remote changes
    await this.pullRemoteChanges();
    
    // Step 5: Update sync metadata
    await this.updateSyncMetadata();
  }

  private async getPendingOperations(): Promise<SyncOperation[]> {
    const tx = this.db.transaction(['sync_operations'], 'readonly');
    const store = tx.objectStore('sync_operations');
    const index = store.index('priority');
    
    const operations: SyncOperation[] = [];
    
    // Get high priority first, then medium, then low
    for (const priority of ['high', 'medium', 'low']) {
      const request = index.getAll(priority);
      const result = await new Promise<SyncOperation[]>((resolve, reject) => {
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(request.error);
      });
      operations.push(...result);
    }
    
    return operations;
  }

  private sortOperationsByDependencies(operations: SyncOperation[]): SyncOperation[] {
    const sorted: SyncOperation[] = [];
    const remaining = [...operations];
    
    while (remaining.length > 0) {
      const readyOps = remaining.filter(op => 
        !op.dependencies || 
        op.dependencies.every(depId => 
          sorted.some(sortedOp => sortedOp.id === depId)
        )
      );
      
      if (readyOps.length === 0) {
        // Circular dependency or missing dependency - add remaining ops
        sorted.push(...remaining);
        break;
      }
      
      sorted.push(...readyOps);
      readyOps.forEach(op => {
        const index = remaining.indexOf(op);
        remaining.splice(index, 1);
      });
    }
    
    return sorted;
  }

  private createBatches(operations: SyncOperation[]): SyncOperation[][] {
    const batches: SyncOperation[][] = [];
    const batchSize = 10;
    
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private async syncBatch(operations: SyncOperation[]): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/sync/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          operations,
          deviceId: this.deviceId
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle successful operations
      for (const successId of result.successful) {
        await this.removeOperation(successId);
      }
      
      // Handle conflicts
      for (const conflict of result.conflicts) {
        await this.handleConflict(conflict);
      }
      
      // Handle errors
      for (const error of result.errors) {
        await this.handleSyncError(error);
      }

    } catch (error) {
      // Network error - keep operations in queue for retry
      this.emit('syncError', error);
    }
  }

  private async pullRemoteChanges(): Promise<void> {
    const lastSync = await this.getLastSyncTimestamp();
    
    try {
      const response = await fetch(`${this.apiEndpoint}/sync/changes?since=${lastSync}&deviceId=${this.deviceId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to pull changes: ${response.statusText}`);
      }

      const changes = await response.json();
      
      for (const change of changes) {
        await this.applyRemoteChange(change);
      }

    } catch (error) {
      this.emit('pullError', error);
    }
  }

  private async handleConflict(conflict: any): Promise<void> {
    const resolution = await this.resolveConflict(conflict);
    
    // Store conflict resolution
    const tx = this.db.transaction(['conflicts'], 'readwrite');
    await tx.objectStore('conflicts').add({
      id: conflict.id,
      conflict,
      resolution,
      timestamp: Date.now()
    });

    this.emit('conflictResolved', { conflict, resolution });
  }

  private async resolveConflict(conflict: any): Promise<ConflictResolution> {
    // Implement smart conflict resolution strategies
    const { local, remote, entity } = conflict;
    
    // Strategy 1: Last-write-wins for simple properties
    if (local.updatedAt && remote.updatedAt) {
      if (local.updatedAt > remote.updatedAt) {
        return {
          strategy: 'overwrite',
          winningVersion: 'local',
          reason: 'Local version is newer'
        };
      } else {
        return {
          strategy: 'overwrite',
          winningVersion: 'remote',
          reason: 'Remote version is newer'
        };
      }
    }
    
    // Strategy 2: Merge strategy for text content
    if (entity === 'scene' && local.content && remote.content) {
      const merged = await this.mergeTextContent(local.content, remote.content);
      return {
        strategy: 'merge',
        winningVersion: 'merged',
        mergedData: { ...remote, content: merged },
        reason: 'Text content merged automatically'
      };
    }
    
    // Strategy 3: Defer to manual resolution
    return {
      strategy: 'manual',
      winningVersion: 'local', // Temporary - keep local until user decides
      reason: 'Requires manual resolution'
    };
  }

  private async mergeTextContent(local: string, remote: string): Promise<string> {
    // Simple merge strategy - in production, use diff3 or operational transforms
    if (local === remote) return local;
    
    const localLines = local.split('\n');
    const remoteLines = remote.split('\n');
    
    // If one is a superset of the other, use the longer one
    if (localLines.length > remoteLines.length && local.includes(remote)) {
      return local;
    }
    if (remoteLines.length > localLines.length && remote.includes(local)) {
      return remote;
    }
    
    // Otherwise, combine both with conflict markers
    return `${local}\n\n<<<<<<< CONFLICT: Local version\n=======\n${remote}\n>>>>>>> Remote version`;
  }

  private async applyRemoteChange(change: any): Promise<void> {
    // Apply remote change to local data
    this.emit('remoteChange', change);
    
    // Create snapshot for future conflict detection
    const snapshot = {
      id: `snapshot_${change.entityId}_${Date.now()}`,
      entityId: change.entityId,
      entityType: change.entityType,
      data: change.data,
      timestamp: Date.now(),
      source: 'remote'
    };
    
    const tx = this.db.transaction(['entity_snapshots'], 'readwrite');
    await tx.objectStore('entity_snapshots').add(snapshot);
  }

  private async handleSyncError(error: any): Promise<void> {
    const operation = await this.getOperation(error.operationId);
    if (!operation) return;

    operation.retryCount++;
    
    if (operation.retryCount >= 3) {
      // Move to permanent error state
      this.emit('permanentError', { operation, error });
      await this.removeOperation(operation.id);
    } else {
      // Schedule retry with exponential backoff
      const delay = Math.pow(2, operation.retryCount) * 1000;
      
      this.retryTimeouts.set(operation.id, setTimeout(() => {
        this.triggerSync();
        this.retryTimeouts.delete(operation.id);
      }, delay));
      
      // Update retry count in database
      const tx = this.db.transaction(['sync_operations'], 'readwrite');
      await tx.objectStore('sync_operations').put(operation);
    }
  }

  private async getOperation(id: string): Promise<SyncOperation | null> {
    const tx = this.db.transaction(['sync_operations'], 'readonly');
    const request = tx.objectStore('sync_operations').get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async removeOperation(id: string): Promise<void> {
    const tx = this.db.transaction(['sync_operations'], 'readwrite');
    await tx.objectStore('sync_operations').delete(id);
    
    // Clear any pending retry
    if (this.retryTimeouts.has(id)) {
      clearTimeout(this.retryTimeouts.get(id)!);
      this.retryTimeouts.delete(id);
    }
  }

  private async getLastSyncTimestamp(): Promise<number> {
    const tx = this.db.transaction(['sync_metadata'], 'readonly');
    const request = tx.objectStore('sync_metadata').get('lastSync');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : 0);
      };
      request.onerror = () => resolve(0);
    });
  }

  private async updateSyncMetadata(): Promise<void> {
    const tx = this.db.transaction(['sync_metadata'], 'readwrite');
    const store = tx.objectStore('sync_metadata');
    
    await store.put({
      key: 'lastSync',
      value: Date.now()
    });
    
    await store.put({
      key: 'deviceInfo',
      value: {
        id: this.deviceId,
        name: this.getDeviceName(),
        type: this.getDeviceType(),
        platform: navigator.platform,
        lastSeen: Date.now(),
        version: '2.0'
      }
    });
  }

  private getDeviceName(): string {
    // Try to get a friendly device name
    if (typeof window !== 'undefined') {
      return `${navigator.platform} Browser`;
    }
    return 'Unknown Device';
  }

  private getDeviceType(): 'desktop' | 'tablet' | 'mobile' | 'web' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private async getAuthToken(): Promise<string> {
    // In production, get from secure storage or refresh if needed
    return localStorage.getItem('auth_token') || '';
  }

  public async getSyncStatus(): Promise<SyncStatus> {
    const pendingOps = await this.getPendingOperations();
    const lastSync = await this.getLastSyncTimestamp();
    
    return {
      isOnline: navigator.onLine,
      lastSync,
      pendingOperations: pendingOps.length,
      inProgress: this.syncInProgress,
      errors: [], // TODO: Get from error store
      devicesSynced: [], // TODO: Get from device registry
      conflictsResolved: 0, // TODO: Count from conflicts store
      bytesTransferred: 0 // TODO: Track data transfer
    };
  }

  public async clearAllData(): Promise<void> {
    const tx = this.db.transaction(['sync_operations', 'conflicts', 'entity_snapshots'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('sync_operations').clear(),
      tx.objectStore('conflicts').clear(),
      tx.objectStore('entity_snapshots').clear()
    ]);
    
    this.emit('dataCleared');
  }

  public async pauseSync(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.emit('syncPaused');
  }

  public async resumeSync(): Promise<void> {
    if (!this.intervalId) {
      this.startPeriodicSync();
      this.emit('syncResumed');
      
      if (navigator.onLine) {
        this.triggerSync();
      }
    }
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
    
    if (this.db) {
      this.db.close();
    }
    
    this.removeAllListeners();
  }
}

export default OfflineSyncManager;