// Offline Service for ASTRAL_NOTES
// Handles offline data storage, sync queue, and conflict resolution

import { Project, Story, Scene, Character, Location, Item, PlotThread, Timeline, ResearchNote, WorldBuilding, DialogueSnippet, ThematicElement } from '../types';

interface SyncQueueItem {
  id?: number;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'story' | 'scene' | 'character' | 'location' | 'item' | 'plotThread' | 'timeline' | 'researchNote' | 'worldBuilding' | 'dialogueSnippet' | 'thematicElement';
  entityId: string;
  data?: any;
  timestamp: number;
  retries: number;
  lastAttempt?: number;
}

interface OfflineChange {
  id: string;
  type: 'pending' | 'syncing' | 'synced' | 'conflict';
  change: SyncQueueItem;
  localVersion?: any;
  serverVersion?: any;
  resolution?: 'local' | 'server' | 'merge';
}

interface BackupConfig {
  enabled: boolean;
  interval: number; // minutes
  providers: {
    google?: {
      enabled: boolean;
      folderId?: string;
    };
    dropbox?: {
      enabled: boolean;
      path?: string;
    };
    github?: {
      enabled: boolean;
      repo?: string;
      branch?: string;
    };
    local?: {
      enabled: boolean;
      path?: string;
    };
  };
  retention: {
    days: number;
    maxBackups: number;
  };
}

export class OfflineService {
  private static instance: OfflineService;
  private db: IDBDatabase | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private serviceWorker: ServiceWorker | null = null;
  private backupConfig: BackupConfig | null = null;
  private backupTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.initialize();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private async initialize(): Promise<void> {
    // Initialize IndexedDB
    await this.initializeDB();

    // Register service worker
    await this.registerServiceWorker();

    // Set up online/offline listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Load sync queue from IndexedDB
    await this.loadSyncQueue();

    // Start periodic sync
    this.startPeriodicSync();

    // Load backup configuration
    await this.loadBackupConfig();

    // Start auto-backup if enabled
    if (this.backupConfig?.enabled) {
      this.startAutoBackup();
    }
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AstralNotesDB', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('userId', 'userId', { unique: false });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Stories store
        if (!db.objectStoreNames.contains('stories')) {
          const storyStore = db.createObjectStore('stories', { keyPath: 'id' });
          storyStore.createIndex('projectId', 'projectId', { unique: false });
          storyStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Scenes store
        if (!db.objectStoreNames.contains('scenes')) {
          const sceneStore = db.createObjectStore('scenes', { keyPath: 'id' });
          sceneStore.createIndex('storyId', 'storyId', { unique: false });
          sceneStore.createIndex('chapterId', 'chapterId', { unique: false });
          sceneStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Characters store
        if (!db.objectStoreNames.contains('characters')) {
          const characterStore = db.createObjectStore('characters', { keyPath: 'id' });
          characterStore.createIndex('projectId', 'projectId', { unique: false });
          characterStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Locations store
        if (!db.objectStoreNames.contains('locations')) {
          const locationStore = db.createObjectStore('locations', { keyPath: 'id' });
          locationStore.createIndex('projectId', 'projectId', { unique: false });
          locationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('entity', 'entity', { unique: false });
        }

        // Backups store
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
          backupStore.createIndex('timestamp', 'timestamp', { unique: false });
          backupStore.createIndex('type', 'type', { unique: false });
        }

        // Conflict store
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Cache metadata store
        if (!db.objectStoreNames.contains('cache_metadata')) {
          const cacheStore = db.createObjectStore('cache_metadata', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);

        // Get active service worker
        this.serviceWorker = registration.active || registration.installing || registration.waiting;

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.emit('update-available', { registration });
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, ...data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        this.handleSyncComplete(data);
        break;
      case 'CACHE_UPDATED':
        this.emit('cache-updated', data);
        break;
      case 'OFFLINE_READY':
        this.emit('offline-ready', data);
        break;
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.emit('connection-changed', { online: true });
    this.syncPendingChanges();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.emit('connection-changed', { online: false });
  }

  // Data Storage Methods
  public async saveProject(project: Project, skipSync: boolean = false): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['projects'], 'readwrite');
    const store = tx.objectStore('projects');
    
    await store.put(project);

    if (!skipSync && this.isOnline) {
      await this.syncProject(project);
    } else if (!skipSync) {
      await this.queueChange('update', 'project', project.id, project);
    }
  }

  public async saveStory(story: Story, skipSync: boolean = false): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['stories'], 'readwrite');
    const store = tx.objectStore('stories');
    
    await store.put(story);

    if (!skipSync && this.isOnline) {
      await this.syncStory(story);
    } else if (!skipSync) {
      await this.queueChange('update', 'story', story.id, story);
    }
  }

  public async saveScene(scene: Scene, skipSync: boolean = false): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['scenes'], 'readwrite');
    const store = tx.objectStore('scenes');
    
    await store.put(scene);

    if (!skipSync && this.isOnline) {
      await this.syncScene(scene);
    } else if (!skipSync) {
      await this.queueChange('update', 'scene', scene.id, scene);
    }
  }

  // Sync Queue Management
  private async queueChange(
    type: 'create' | 'update' | 'delete',
    entity: SyncQueueItem['entity'],
    entityId: string,
    data?: any
  ): Promise<void> {
    if (!this.db) return;

    const item: SyncQueueItem = {
      type,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    const tx = this.db.transaction(['sync_queue'], 'readwrite');
    const store = tx.objectStore('sync_queue');
    await store.add(item);

    this.syncQueue.push(item);
    this.emit('sync-queue-updated', { queue: this.syncQueue });
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['sync_queue'], 'readonly');
    const store = tx.objectStore('sync_queue');
    const items = await store.getAll();
    
    this.syncQueue = Array.isArray(items) ? items : [];
  }

  private async syncPendingChanges(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.emit('sync-started', { queue: this.syncQueue });

    try {
      for (const item of this.syncQueue) {
        await this.processSyncItem(item);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('sync-error', { error });
    } finally {
      this.syncInProgress = false;
      this.emit('sync-completed', { queue: this.syncQueue });
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    try {
      // Send to server
      const response = await fetch(`/api/${item.entity}/${item.entityId}`, {
        method: item.type === 'delete' ? 'DELETE' : item.type === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: item.data ? JSON.stringify(item.data) : undefined
      });

      if (response.ok) {
        // Remove from queue
        await this.removeSyncItem(item);
      } else if (response.status === 409) {
        // Conflict detected
        await this.handleConflict(item, await response.json());
      } else {
        // Retry logic
        item.retries++;
        item.lastAttempt = Date.now();
        
        if (item.retries >= 3) {
          await this.moveToDLQ(item);
        }
      }
    } catch (error) {
      console.error('Error processing sync item:', error);
      item.retries++;
      item.lastAttempt = Date.now();
    }
  }

  private async removeSyncItem(item: SyncQueueItem): Promise<void> {
    if (!this.db || !item.id) return;

    const tx = this.db.transaction(['sync_queue'], 'readwrite');
    const store = tx.objectStore('sync_queue');
    await store.delete(item.id);

    this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
  }

  private async handleConflict(item: SyncQueueItem, serverData: any): Promise<void> {
    if (!this.db) return;

    const conflict: OfflineChange = {
      id: `conflict-${Date.now()}`,
      type: 'conflict',
      change: item,
      localVersion: item.data,
      serverVersion: serverData
    };

    const tx = this.db.transaction(['conflicts'], 'readwrite');
    const store = tx.objectStore('conflicts');
    await store.add({
      ...conflict,
      timestamp: Date.now(),
      resolved: false
    });

    this.emit('conflict-detected', conflict);
  }

  private async moveToDLQ(item: SyncQueueItem): Promise<void> {
    console.error('Moving item to dead letter queue:', item);
    await this.removeSyncItem(item);
    this.emit('sync-failed', { item });
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingChanges();
      }
    }, 30000); // Every 30 seconds
  }

  // Backup Methods
  private async loadBackupConfig(): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['settings'], 'readonly');
    const store = tx.objectStore('settings');
    const config = await store.get('backup_config');
    
    if (config) {
      this.backupConfig = config.value;
    } else {
      // Default config
      this.backupConfig = {
        enabled: true,
        interval: 30, // 30 minutes
        providers: {
          local: {
            enabled: true
          }
        },
        retention: {
          days: 30,
          maxBackups: 50
        }
      };
    }
  }

  public async updateBackupConfig(config: Partial<BackupConfig>): Promise<void> {
    if (!this.db) return;

    this.backupConfig = { ...this.backupConfig!, ...config };

    const tx = this.db.transaction(['settings'], 'readwrite');
    const store = tx.objectStore('settings');
    await store.put({
      key: 'backup_config',
      value: this.backupConfig
    });

    // Restart auto-backup with new config
    if (this.backupConfig.enabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }
  }

  private startAutoBackup(): void {
    this.stopAutoBackup();

    if (!this.backupConfig?.enabled) return;

    const interval = this.backupConfig.interval * 60 * 1000; // Convert to milliseconds
    
    this.backupTimer = setInterval(() => {
      this.createBackup('auto');
    }, interval);

    // Initial backup
    this.createBackup('auto');
  }

  private stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  public async createBackup(type: 'manual' | 'auto' = 'manual'): Promise<string> {
    if (!this.db) return '';

    const backupId = `backup-${Date.now()}`;
    const timestamp = Date.now();

    try {
      // Collect all data
      const data = await this.collectAllData();

      // Create backup object
      const backup = {
        id: backupId,
        timestamp,
        type,
        version: '1.0.0',
        data
      };

      // Save locally
      if (this.backupConfig?.providers.local?.enabled) {
        await this.saveLocalBackup(backup);
      }

      // Save to cloud providers
      if (this.backupConfig?.providers.google?.enabled) {
        await this.saveToGoogleDrive(backup);
      }
      
      if (this.backupConfig?.providers.dropbox?.enabled) {
        await this.saveToDropbox(backup);
      }
      
      if (this.backupConfig?.providers.github?.enabled) {
        await this.saveToGitHub(backup);
      }

      // Clean old backups
      await this.cleanOldBackups();

      this.emit('backup-created', { backupId, type });
      
      return backupId;
    } catch (error) {
      console.error('Backup failed:', error);
      this.emit('backup-failed', { error });
      throw error;
    }
  }

  private async collectAllData(): Promise<any> {
    if (!this.db) return {};

    const data: any = {};
    const stores = ['projects', 'stories', 'scenes', 'characters', 'locations'];

    for (const storeName of stores) {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const result = await store.getAll();
      data[storeName] = Array.isArray(result) ? result : [];
    }

    return data;
  }

  private async saveLocalBackup(backup: any): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['backups'], 'readwrite');
    const store = tx.objectStore('backups');
    await store.put(backup);

    // Also save to localStorage for redundancy
    const backups = JSON.parse(localStorage.getItem('astral_backups') || '[]');
    backups.push({
      id: backup.id,
      timestamp: backup.timestamp,
      type: backup.type
    });
    
    // Keep only metadata in localStorage
    localStorage.setItem('astral_backups', JSON.stringify(backups.slice(-10)));
  }

  private async saveToGoogleDrive(backup: any): Promise<void> {
    // Implementation would require Google Drive API integration
    console.log('Google Drive backup would be saved here');
  }

  private async saveToDropbox(backup: any): Promise<void> {
    // Implementation would require Dropbox API integration
    console.log('Dropbox backup would be saved here');
  }

  private async saveToGitHub(backup: any): Promise<void> {
    // Implementation would require GitHub API integration
    console.log('GitHub backup would be saved here');
  }

  private async cleanOldBackups(): Promise<void> {
    if (!this.db || !this.backupConfig) return;

    const tx = this.db.transaction(['backups'], 'readwrite');
    const store = tx.objectStore('backups');
    const index = store.index('timestamp');
    
    const cutoffDate = Date.now() - (this.backupConfig.retention.days * 24 * 60 * 60 * 1000);
    const oldBackupsResult = await index.getAllKeys(IDBKeyRange.upperBound(cutoffDate));
    const oldBackups = Array.isArray(oldBackupsResult) ? oldBackupsResult : [];
    
    for (const key of oldBackups) {
      await store.delete(key);
    }

    // Also limit by max backups
    const allBackupsResult = await store.getAllKeys();
    const allBackups = Array.isArray(allBackupsResult) ? allBackupsResult : [];
    if (allBackups.length > this.backupConfig.retention.maxBackups) {
      const toDelete = allBackups.slice(0, allBackups.length - this.backupConfig.retention.maxBackups);
      for (const key of toDelete) {
        await store.delete(key);
      }
    }
  }

  public async restoreBackup(backupId: string): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['backups'], 'readonly');
    const store = tx.objectStore('backups');
    const backup = await store.get(backupId);

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Restore data
    for (const [storeName, items] of Object.entries(backup.data)) {
      const writeTx = this.db.transaction([storeName], 'readwrite');
      const writeStore = writeTx.objectStore(storeName);
      
      // Clear existing data
      await writeStore.clear();
      
      // Add backup data
      for (const item of items as any[]) {
        await writeStore.add(item);
      }
    }

    this.emit('backup-restored', { backupId });
  }

  // Utility Methods
  private async syncProject(project: Project): Promise<void> {
    // Server sync implementation
    console.log('Syncing project:', project.id);
  }

  private async syncStory(story: Story): Promise<void> {
    // Server sync implementation
    console.log('Syncing story:', story.id);
  }

  private async syncScene(scene: Scene): Promise<void> {
    // Server sync implementation
    console.log('Syncing scene:', scene.id);
  }

  private handleSyncComplete(data: any): void {
    this.emit('sync-complete', data);
    this.loadSyncQueue(); // Reload queue to ensure consistency
  }

  // Event Emitter Methods
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Public API
  public isOfflineReady(): boolean {
    return this.db !== null && this.serviceWorker !== null;
  }

  public getConnectionStatus(): boolean {
    return this.isOnline;
  }

  public getSyncQueueSize(): number {
    return this.syncQueue.length;
  }

  public async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    const stores = ['projects', 'stories', 'scenes', 'characters', 'locations', 'sync_queue', 'conflicts'];
    
    for (const storeName of stores) {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
    }

    this.syncQueue = [];
    this.emit('offline-data-cleared');
  }

  public async getConflicts(): Promise<OfflineChange[]> {
    if (!this.db) return [];

    const tx = this.db.transaction(['conflicts'], 'readonly');
    const store = tx.objectStore('conflicts');
    const index = store.index('resolved');
    
    const conflicts = await index.getAll(false);
    return Array.isArray(conflicts) ? conflicts : [];
  }

  public async resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merge', mergedData?: any): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['conflicts'], 'readwrite');
    const store = tx.objectStore('conflicts');
    const conflict = await store.get(conflictId);

    if (!conflict) return;

    conflict.resolved = true;
    conflict.resolution = resolution;
    
    if (resolution === 'merge' && mergedData) {
      conflict.mergedData = mergedData;
    }

    await store.put(conflict);

    // Apply resolution
    switch (resolution) {
      case 'local':
        // Queue local version for sync
        await this.queueChange(conflict.change.type, conflict.change.entity, conflict.change.entityId, conflict.localVersion);
        break;
      case 'server':
        // Accept server version (no action needed)
        break;
      case 'merge':
        // Queue merged version for sync
        if (mergedData) {
          await this.queueChange('update', conflict.change.entity, conflict.change.entityId, mergedData);
        }
        break;
    }

    this.emit('conflict-resolved', { conflictId, resolution });
  }

  public async getBackups(): Promise<any[]> {
    if (!this.db) return [];

    const tx = this.db.transaction(['backups'], 'readonly');
    const store = tx.objectStore('backups');
    const index = store.index('timestamp');
    
    // Get backups in descending order
    const backups = await index.getAll(null);
    return Array.isArray(backups) ? backups.reverse() : [];
  }

  public async deleteBackup(backupId: string): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction(['backups'], 'readwrite');
    const store = tx.objectStore('backups');
    await store.delete(backupId);

    this.emit('backup-deleted', { backupId });
  }

  public async exportBackup(backupId: string): Promise<Blob> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(['backups'], 'readonly');
    const store = tx.objectStore('backups');
    const backup = await store.get(backupId);

    if (!backup) {
      throw new Error('Backup not found');
    }

    const json = JSON.stringify(backup, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  public async importBackup(file: File): Promise<string> {
    const text = await file.text();
    const backup = JSON.parse(text);

    // Validate backup structure
    if (!backup.id || !backup.timestamp || !backup.data) {
      throw new Error('Invalid backup file');
    }

    // Save backup
    await this.saveLocalBackup(backup);

    this.emit('backup-imported', { backupId: backup.id });
    
    return backup.id;
  }
}

export default OfflineService.getInstance();