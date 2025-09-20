import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AstralNotesDB extends DBSchema {
  notes: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      tags: string[];
      projectId?: string;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
      version: number;
    };
    indexes: { 'by-project': string; 'by-sync-status': string; };
  };
  projects: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      settings: any;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
      version: number;
    };
  };
  quickNotes: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
      version: number;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: 'note' | 'project' | 'quickNote';
      entityId: string;
      data: any;
      timestamp: number;
      retryCount: number;
    };
  };
}

class OfflineStorageService {
  private db: IDBPDatabase<AstralNotesDB> | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<AstralNotesDB>('AstralNotesDB', 3, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('by-project', 'projectId');
          notesStore.createIndex('by-sync-status', 'syncStatus');

          db.createObjectStore('projects', { keyPath: 'id' });
          db.createObjectStore('quickNotes', { keyPath: 'id' });
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      },
    });

    this.startSyncInterval();
  }

  async saveNote(note: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const noteData = {
      ...note,
      lastModified: Date.now(),
      syncStatus: 'pending' as const,
      version: (note.version || 0) + 1
    };

    await this.db.put('notes', noteData);
    await this.queueSync('update', 'note', note.id, noteData);
  }

  async getNote(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('notes', id) || null;
  }

  async getAllNotes(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('notes');
  }

  async getNotesByProject(projectId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('notes', 'by-project', projectId);
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('notes', id);
    await this.queueSync('delete', 'note', id, null);
  }

  async saveProject(project: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const projectData = {
      ...project,
      lastModified: Date.now(),
      syncStatus: 'pending' as const,
      version: (project.version || 0) + 1
    };

    await this.db.put('projects', projectData);
    await this.queueSync('update', 'project', project.id, projectData);
  }

  async getProject(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('projects', id) || null;
  }

  async getAllProjects(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('projects');
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('projects', id);
    await this.queueSync('delete', 'project', id, null);
  }

  async saveQuickNote(quickNote: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const quickNoteData = {
      ...quickNote,
      lastModified: Date.now(),
      syncStatus: 'pending' as const,
      version: (quickNote.version || 0) + 1
    };

    await this.db.put('quickNotes', quickNoteData);
    await this.queueSync('update', 'quickNote', quickNote.id, quickNoteData);
  }

  async getQuickNote(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('quickNotes', id) || null;
  }

  async getAllQuickNotes(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('quickNotes');
  }

  async deleteQuickNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('quickNotes', id);
    await this.queueSync('delete', 'quickNote', id, null);
  }

  private async queueSync(type: 'create' | 'update' | 'delete', entity: 'note' | 'project' | 'quickNote', entityId: string, data: any): Promise<void> {
    if (!this.db) return;

    const syncItem = {
      id: `${entity}-${entityId}-${Date.now()}`,
      type,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    await this.db.put('syncQueue', syncItem);
  }

  async processSync(): Promise<void> {
    if (!this.db || !navigator.onLine) return;

    const pendingItems = await this.db.getAll('syncQueue');
    
    for (const item of pendingItems) {
      try {
        await this.syncItem(item);
        await this.db.delete('syncQueue', item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        
        if (item.retryCount < 3) {
          item.retryCount++;
          await this.db.put('syncQueue', item);
        } else {
          console.error('Max retries exceeded for sync item:', item.id);
          await this.db.delete('syncQueue', item.id);
        }
      }
    }
  }

  private async syncItem(item: any): Promise<void> {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('authToken');
    
    if (!token) throw new Error('No auth token available');

    const url = `${baseUrl}/${item.entity}s${item.type === 'delete' ? `/${item.entityId}` : ''}`;
    const method = item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    if (item.type !== 'delete') {
      const updatedData = await response.json();
      updatedData.syncStatus = 'synced';
      
      if (item.entity === 'note') {
        await this.db!.put('notes', updatedData);
      } else if (item.entity === 'project') {
        await this.db!.put('projects', updatedData);
      } else if (item.entity === 'quickNote') {
        await this.db!.put('quickNotes', updatedData);
      }
    }
  }

  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      this.processSync().catch(console.error);
    }, 30000); // Sync every 30 seconds
  }

  async getStorageStats(): Promise<{ used: number; quota: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    }
    return { used: 0, quota: 0, available: 0 };
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) return;
    
    const tx = this.db.transaction(['notes', 'projects', 'quickNotes', 'syncQueue'], 'readwrite');
    await Promise.all([
      tx.objectStore('notes').clear(),
      tx.objectStore('projects').clear(),
      tx.objectStore('quickNotes').clear(),
      tx.objectStore('syncQueue').clear()
    ]);
    await tx.done;
  }

  async exportOfflineData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [notes, projects, quickNotes] = await Promise.all([
      this.db.getAll('notes'),
      this.db.getAll('projects'),
      this.db.getAll('quickNotes')
    ]);

    return JSON.stringify({
      notes,
      projects,
      quickNotes,
      exportedAt: Date.now()
    }, null, 2);
  }

  async importOfflineData(jsonData: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const data = JSON.parse(jsonData);
    const tx = this.db.transaction(['notes', 'projects', 'quickNotes'], 'readwrite');
    
    await Promise.all([
      ...data.notes.map((note: any) => tx.objectStore('notes').put(note)),
      ...data.projects.map((project: any) => tx.objectStore('projects').put(project)),
      ...data.quickNotes.map((quickNote: any) => tx.objectStore('quickNotes').put(quickNote))
    ]);
    
    await tx.done;
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const offlineStorageService = new OfflineStorageService();