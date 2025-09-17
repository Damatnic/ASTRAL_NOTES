/**
 * Cross-Platform File Sync Service
 * Manages file synchronization across devices with conflict resolution and delta sync
 * Supports multiple cloud providers and local storage with encryption
 */

import { EventEmitter } from 'events';

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  checksum: string;
  version: number;
  lastModified: number;
  deviceId: string;
  userId: string;
  isDeleted: boolean;
  parentId?: string;
  tags: string[];
  permissions: FilePermissions;
}

export interface FilePermissions {
  owner: string;
  read: string[];
  write: string[];
  share: string[];
}

export interface SyncProvider {
  id: string;
  name: string;
  type: 'cloud' | 'local' | 'p2p';
  isAvailable: boolean;
  config: Record<string, any>;
}

export interface SyncConflict {
  fileId: string;
  localVersion: FileMetadata;
  remoteVersions: FileMetadata[];
  conflictType: 'version' | 'concurrent' | 'delete';
  autoResolvable: boolean;
  suggestedResolution: 'merge' | 'local' | 'remote' | 'manual';
}

export interface DeltaSync {
  fileId: string;
  patches: BinaryPatch[];
  baseVersion: number;
  targetVersion: number;
  compression: 'none' | 'gzip' | 'brotli';
}

export interface BinaryPatch {
  operation: 'insert' | 'delete' | 'replace';
  offset: number;
  length: number;
  data?: Uint8Array;
}

export interface SyncStatus {
  isActive: boolean;
  lastSync: number;
  provider: string;
  filesTotal: number;
  filesSynced: number;
  bytesTotal: number;
  bytesSynced: number;
  conflicts: number;
  errors: SyncError[];
}

export interface SyncError {
  fileId: string;
  fileName: string;
  error: string;
  timestamp: number;
  retryable: boolean;
  retryCount: number;
}

class CrossPlatformSyncService extends EventEmitter {
  private providers: Map<string, SyncProvider> = new Map();
  private activeProvider: string | null = null;
  private db!: IDBDatabase;
  private syncQueue: Set<string> = new Set();
  private conflictQueue: SyncConflict[] = [];
  private isInitialized = false;
  private syncInProgress = false;
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    super();
    this.initializeProviders();
    this.initializeDatabase();
    this.setupSyncInterval();
  }

  private async initializeProviders(): Promise<void> {
    // Cloud providers
    this.providers.set('icloud', {
      id: 'icloud',
      name: 'iCloud Drive',
      type: 'cloud',
      isAvailable: this.detectiCloudAvailability(),
      config: {}
    });

    this.providers.set('googledrive', {
      id: 'googledrive',
      name: 'Google Drive',
      type: 'cloud',
      isAvailable: await this.detectGoogleDriveAvailability(),
      config: {}
    });

    this.providers.set('dropbox', {
      id: 'dropbox',
      name: 'Dropbox',
      type: 'cloud',
      isAvailable: await this.detectDropboxAvailability(),
      config: {}
    });

    // Local storage provider
    this.providers.set('local', {
      id: 'local',
      name: 'Local Storage',
      type: 'local',
      isAvailable: true,
      config: { 
        useIndexedDB: true,
        maxSize: 100 * 1024 * 1024 // 100MB
      }
    });

    // P2P provider (for direct device sync)
    this.providers.set('p2p', {
      id: 'p2p',
      name: 'Direct Sync',
      type: 'p2p',
      isAvailable: 'RTCPeerConnection' in window,
      config: {
        stunServers: ['stun:stun.l.google.com:19302'],
        maxPeers: 3
      }
    });

    this.emit('providersInitialized', Array.from(this.providers.values()));
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CrossPlatformSyncDB', 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        this.emit('initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // File metadata store
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('path', 'path', { unique: false });
          fileStore.createIndex('checksum', 'checksum', { unique: false });
          fileStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // File content store (for local caching)
        if (!db.objectStoreNames.contains('content')) {
          const contentStore = db.createObjectStore('content', { keyPath: 'fileId' });
          contentStore.createIndex('size', 'size', { unique: false });
        }

        // Sync queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'fileId' });
        }

        // Conflicts
        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'fileId' });
        }

        // Delta patches
        if (!db.objectStoreNames.contains('deltas')) {
          const deltaStore = db.createObjectStore('deltas', { keyPath: 'id', autoIncrement: true });
          deltaStore.createIndex('fileId', 'fileId', { unique: false });
          deltaStore.createIndex('baseVersion', 'baseVersion', { unique: false });
        }
      };
    });
  }

  private setupSyncInterval(): void {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress && this.activeProvider) {
        this.performSync();
      }
    }, 30000);

    // Listen for online/offline events
    window.addEventListener('online', () => {
      if (this.activeProvider) {
        this.performSync();
      }
    });
  }

  public async setProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    if (!provider.isAvailable) {
      throw new Error(`Provider ${providerId} is not available`);
    }

    this.activeProvider = providerId;
    await this.authenticateProvider(provider);
    this.emit('providerChanged', provider);
  }

  public async uploadFile(file: File, path: string): Promise<FileMetadata> {
    if (!this.activeProvider) {
      throw new Error('No sync provider configured');
    }

    // Generate file metadata
    const checksum = await this.calculateChecksum(file);
    const metadata: FileMetadata = {
      id: this.generateFileId(),
      name: file.name,
      path,
      size: file.size,
      mimeType: file.type,
      checksum,
      version: 1,
      lastModified: Date.now(),
      deviceId: this.getDeviceId(),
      userId: this.getUserId(),
      isDeleted: false,
      tags: [],
      permissions: {
        owner: this.getUserId(),
        read: [this.getUserId()],
        write: [this.getUserId()],
        share: []
      }
    };

    // Encrypt content if encryption is enabled
    const content = await this.encryptContent(await file.arrayBuffer());

    // Store locally first
    await this.storeFileLocally(metadata, content);

    // Add to sync queue
    this.syncQueue.add(metadata.id);

    // Trigger immediate sync for high priority files
    if (this.shouldSyncImmediately(metadata)) {
      this.performSync();
    }

    this.emit('fileUploaded', metadata);
    return metadata;
  }

  public async downloadFile(fileId: string): Promise<File> {
    // Check local cache first
    const localContent = await this.getLocalContent(fileId);
    if (localContent) {
      const metadata = await this.getFileMetadata(fileId);
      return new File([localContent], metadata.name, { type: metadata.mimeType });
    }

    // Download from provider
    if (!this.activeProvider) {
      throw new Error('No sync provider configured');
    }

    const metadata = await this.getFileMetadata(fileId);
    const content = await this.downloadFromProvider(fileId);
    const decryptedContent = await this.decryptContent(content);

    // Cache locally
    await this.storeFileLocally(metadata, decryptedContent);

    return new File([decryptedContent], metadata.name, { type: metadata.mimeType });
  }

  public async syncFile(fileId: string): Promise<void> {
    this.syncQueue.add(fileId);
    
    if (!this.syncInProgress) {
      await this.performSync();
    }
  }

  private async performSync(): Promise<void> {
    if (this.syncInProgress || !this.activeProvider) return;

    this.syncInProgress = true;
    this.emit('syncStarted');

    try {
      // Get files to sync
      const filesToSync = Array.from(this.syncQueue);
      
      for (const fileId of filesToSync) {
        await this.syncSingleFile(fileId);
        this.syncQueue.delete(fileId);
      }

      // Check for remote changes
      await this.pullRemoteChanges();

      this.emit('syncCompleted');
    } catch (error) {
      this.emit('syncError', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncSingleFile(fileId: string): Promise<void> {
    const localMetadata = await this.getFileMetadata(fileId);
    const remoteMetadata = await this.getRemoteFileMetadata(fileId);

    if (!remoteMetadata) {
      // File doesn't exist remotely, upload it
      await this.uploadToProvider(fileId);
    } else if (localMetadata.version > remoteMetadata.version) {
      // Local version is newer, upload delta
      await this.uploadDelta(fileId, remoteMetadata.version, localMetadata.version);
    } else if (localMetadata.version < remoteMetadata.version) {
      // Remote version is newer, download delta
      await this.downloadDelta(fileId, localMetadata.version, remoteMetadata.version);
    } else if (localMetadata.checksum !== remoteMetadata.checksum) {
      // Same version but different content - conflict!
      await this.handleConflict(fileId, localMetadata, [remoteMetadata]);
    }
  }

  private async uploadDelta(fileId: string, baseVersion: number, targetVersion: number): Promise<void> {
    const localContent = await this.getLocalContent(fileId);
    const remoteContent = await this.downloadFromProvider(fileId);
    
    const patches = await this.generateBinaryPatches(remoteContent, localContent);
    const delta: DeltaSync = {
      fileId,
      patches,
      baseVersion,
      targetVersion,
      compression: 'gzip'
    };

    await this.uploadDeltaToProvider(delta);
  }

  private async downloadDelta(fileId: string, baseVersion: number, targetVersion: number): Promise<void> {
    const delta = await this.downloadDeltaFromProvider(fileId, baseVersion, targetVersion);
    const localContent = await this.getLocalContent(fileId);
    const patchedContent = await this.applyBinaryPatches(localContent, delta.patches);
    
    const metadata = await this.getFileMetadata(fileId);
    metadata.version = targetVersion;
    metadata.checksum = await this.calculateChecksum(new Blob([patchedContent]));
    
    await this.storeFileLocally(metadata, patchedContent);
  }

  private async handleConflict(fileId: string, localVersion: FileMetadata, remoteVersions: FileMetadata[]): Promise<void> {
    const conflict: SyncConflict = {
      fileId,
      localVersion,
      remoteVersions,
      conflictType: 'concurrent',
      autoResolvable: this.canAutoResolve(localVersion, remoteVersions),
      suggestedResolution: this.suggestResolution(localVersion, remoteVersions)
    };

    if (conflict.autoResolvable) {
      await this.autoResolveConflict(conflict);
    } else {
      this.conflictQueue.push(conflict);
      this.emit('conflictDetected', conflict);
    }
  }

  private canAutoResolve(local: FileMetadata, remote: FileMetadata[]): boolean {
    // Simple heuristics for auto-resolution
    const remoteMeta = remote[0];
    
    // If one version is significantly newer, prefer it
    const timeDiff = Math.abs(local.lastModified - remoteMeta.lastModified);
    if (timeDiff > 24 * 60 * 60 * 1000) { // 24 hours
      return true;
    }
    
    // If file types allow merging (text files)
    if (local.mimeType.startsWith('text/') || local.mimeType.includes('json')) {
      return true;
    }
    
    return false;
  }

  private suggestResolution(local: FileMetadata, remote: FileMetadata[]): 'merge' | 'local' | 'remote' | 'manual' {
    const remoteMeta = remote[0];
    
    // Prefer newer version
    if (local.lastModified > remoteMeta.lastModified) {
      return 'local';
    } else if (remoteMeta.lastModified > local.lastModified) {
      return 'remote';
    }
    
    // For text files, suggest merge
    if (local.mimeType.startsWith('text/')) {
      return 'merge';
    }
    
    return 'manual';
  }

  private async generateBinaryPatches(source: ArrayBuffer, target: ArrayBuffer): Promise<BinaryPatch[]> {
    // Simplified binary diff algorithm
    const patches: BinaryPatch[] = [];
    const sourceBytes = new Uint8Array(source);
    const targetBytes = new Uint8Array(target);
    
    let sourceIndex = 0;
    let targetIndex = 0;
    
    while (sourceIndex < sourceBytes.length || targetIndex < targetBytes.length) {
      if (sourceIndex >= sourceBytes.length) {
        // Insert remaining target bytes
        patches.push({
          operation: 'insert',
          offset: sourceIndex,
          length: targetBytes.length - targetIndex,
          data: targetBytes.slice(targetIndex)
        });
        break;
      } else if (targetIndex >= targetBytes.length) {
        // Delete remaining source bytes
        patches.push({
          operation: 'delete',
          offset: sourceIndex,
          length: sourceBytes.length - sourceIndex
        });
        break;
      } else if (sourceBytes[sourceIndex] === targetBytes[targetIndex]) {
        // Bytes match, continue
        sourceIndex++;
        targetIndex++;
      } else {
        // Find next matching sequence
        const matchLength = this.findMatchingSequence(sourceBytes, targetBytes, sourceIndex, targetIndex);
        
        if (matchLength > 0) {
          patches.push({
            operation: 'replace',
            offset: sourceIndex,
            length: matchLength,
            data: targetBytes.slice(targetIndex, targetIndex + matchLength)
          });
          sourceIndex += matchLength;
          targetIndex += matchLength;
        } else {
          // No match found, replace single byte
          patches.push({
            operation: 'replace',
            offset: sourceIndex,
            length: 1,
            data: new Uint8Array([targetBytes[targetIndex]])
          });
          sourceIndex++;
          targetIndex++;
        }
      }
    }
    
    return patches;
  }

  private findMatchingSequence(source: Uint8Array, target: Uint8Array, sourceStart: number, targetStart: number): number {
    let length = 0;
    const maxLength = Math.min(source.length - sourceStart, target.length - targetStart);
    
    for (let i = 0; i < maxLength; i++) {
      if (source[sourceStart + i] === target[targetStart + i]) {
        length++;
      } else {
        break;
      }
    }
    
    return length;
  }

  private async applyBinaryPatches(source: ArrayBuffer, patches: BinaryPatch[]): Promise<ArrayBuffer> {
    const sourceBytes = new Uint8Array(source);
    const result: number[] = [];
    let sourceIndex = 0;
    
    for (const patch of patches) {
      // Copy bytes before patch
      while (sourceIndex < patch.offset) {
        result.push(sourceBytes[sourceIndex]);
        sourceIndex++;
      }
      
      switch (patch.operation) {
        case 'insert':
          if (patch.data) {
            result.push(...Array.from(patch.data));
          }
          break;
        case 'delete':
          sourceIndex += patch.length;
          break;
        case 'replace':
          sourceIndex += patch.length;
          if (patch.data) {
            result.push(...Array.from(patch.data));
          }
          break;
      }
    }
    
    // Copy remaining bytes
    while (sourceIndex < sourceBytes.length) {
      result.push(sourceBytes[sourceIndex]);
      sourceIndex++;
    }
    
    return new Uint8Array(result).buffer;
  }

  private async calculateChecksum(file: Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async encryptContent(content: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      return content; // No encryption
    }
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      content
    );
    
    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return result.buffer;
  }

  private async decryptContent(encryptedContent: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      return encryptedContent; // No decryption needed
    }
    
    const encryptedArray = new Uint8Array(encryptedContent);
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);
    
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );
  }

  // Provider-specific implementations
  private detectiCloudAvailability(): boolean {
    return /iPad|iPhone|iPod|Mac/.test(navigator.userAgent) && 'serviceWorker' in navigator;
  }

  private async detectGoogleDriveAvailability(): Promise<boolean> {
    try {
      // Check if Google Drive API is accessible
      const response = await fetch('https://www.googleapis.com/drive/v3/about', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }

  private async detectDropboxAvailability(): Promise<boolean> {
    try {
      // Check if Dropbox API is accessible
      const response = await fetch('https://api.dropboxapi.com/2/check/user', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }

  // Utility methods
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceId(): string {
    return localStorage.getItem('device_id') || 'unknown';
  }

  private getUserId(): string {
    return localStorage.getItem('user_id') || 'anonymous';
  }

  private shouldSyncImmediately(metadata: FileMetadata): boolean {
    // Sync immediately for small files or important files
    return metadata.size < 1024 * 1024 || metadata.tags.includes('important');
  }

  // Abstract methods that would be implemented for each provider
  private async authenticateProvider(provider: SyncProvider): Promise<void> {
    // Implementation depends on provider
  }

  private async uploadToProvider(fileId: string): Promise<void> {
    // Implementation depends on provider
  }

  private async downloadFromProvider(fileId: string): Promise<ArrayBuffer> {
    // Implementation depends on provider
    return new ArrayBuffer(0);
  }

  private async getRemoteFileMetadata(fileId: string): Promise<FileMetadata | null> {
    // Implementation depends on provider
    return null;
  }

  private async uploadDeltaToProvider(delta: DeltaSync): Promise<void> {
    // Implementation depends on provider
  }

  private async downloadDeltaFromProvider(fileId: string, baseVersion: number, targetVersion: number): Promise<DeltaSync> {
    // Implementation depends on provider
    return {
      fileId,
      patches: [],
      baseVersion,
      targetVersion,
      compression: 'none'
    };
  }

  private async storeFileLocally(metadata: FileMetadata, content: ArrayBuffer): Promise<void> {
    const tx = this.db.transaction(['files', 'content'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('files').put(metadata),
      tx.objectStore('content').put({
        fileId: metadata.id,
        content,
        size: content.byteLength,
        timestamp: Date.now()
      })
    ]);
  }

  private async getLocalContent(fileId: string): Promise<ArrayBuffer | null> {
    const tx = this.db.transaction(['content'], 'readonly');
    const request = tx.objectStore('content').get(fileId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const tx = this.db.transaction(['files'], 'readonly');
    const request = tx.objectStore('files').get(fileId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async pullRemoteChanges(): Promise<void> {
    // Implementation depends on provider
  }

  private async autoResolveConflict(conflict: SyncConflict): Promise<void> {
    // Implementation depends on resolution strategy
  }

  public getSyncStatus(): SyncStatus {
    return {
      isActive: this.syncInProgress,
      lastSync: 0, // Would track actual last sync time
      provider: this.activeProvider || 'none',
      filesTotal: 0,
      filesSynced: 0,
      bytesTotal: 0,
      bytesSynced: 0,
      conflicts: this.conflictQueue.length,
      errors: []
    };
  }

  public getAvailableProviders(): SyncProvider[] {
    return Array.from(this.providers.values());
  }

  public getPendingConflicts(): SyncConflict[] {
    return [...this.conflictQueue];
  }
}

export default new CrossPlatformSyncService();