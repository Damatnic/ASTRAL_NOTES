import { useState, useEffect, useCallback } from 'react';
import { offlineStorageService } from '../services/offlineStorage';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncError: string | null;
}

export const useOfflineSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncError: null
  });

  const updateOnlineStatus = useCallback(() => {
    setSyncState(prev => ({ ...prev, isOnline: navigator.onLine }));
  }, []);

  const forcSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncState(prev => ({ ...prev, syncError: 'No internet connection' }));
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));
    
    try {
      await offlineStorageService.processSync();
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingChanges: 0
      }));
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, []);

  const saveOffline = useCallback(async (type: 'note' | 'project' | 'quickNote', data: any) => {
    try {
      switch (type) {
        case 'note':
          await offlineStorageService.saveNote(data);
          break;
        case 'project':
          await offlineStorageService.saveProject(data);
          break;
        case 'quickNote':
          await offlineStorageService.saveQuickNote(data);
          break;
      }
      
      setSyncState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
      
      if (navigator.onLine) {
        setTimeout(forcSync, 1000); // Auto-sync after 1 second if online
      }
    } catch (error) {
      console.error('Failed to save offline:', error);
      throw error;
    }
  }, [forcSync]);

  const loadOffline = useCallback(async (type: 'note' | 'project' | 'quickNote', id?: string) => {
    try {
      switch (type) {
        case 'note':
          return id ? await offlineStorageService.getNote(id) : await offlineStorageService.getAllNotes();
        case 'project':
          return id ? await offlineStorageService.getProject(id) : await offlineStorageService.getAllProjects();
        case 'quickNote':
          return id ? await offlineStorageService.getQuickNote(id) : await offlineStorageService.getAllQuickNotes();
      }
    } catch (error) {
      console.error('Failed to load offline:', error);
      throw error;
    }
  }, []);

  const deleteOffline = useCallback(async (type: 'note' | 'project' | 'quickNote', id: string) => {
    try {
      switch (type) {
        case 'note':
          await offlineStorageService.deleteNote(id);
          break;
        case 'project':
          await offlineStorageService.deleteProject(id);
          break;
        case 'quickNote':
          await offlineStorageService.deleteQuickNote(id);
          break;
      }
      
      setSyncState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
      
      if (navigator.onLine) {
        setTimeout(forcSync, 1000);
      }
    } catch (error) {
      console.error('Failed to delete offline:', error);
      throw error;
    }
  }, [forcSync]);

  const getStorageInfo = useCallback(async () => {
    return await offlineStorageService.getStorageStats();
  }, []);

  const exportData = useCallback(async () => {
    return await offlineStorageService.exportOfflineData();
  }, []);

  const importData = useCallback(async (jsonData: string) => {
    await offlineStorageService.importOfflineData(jsonData);
  }, []);

  const clearAllData = useCallback(async () => {
    await offlineStorageService.clearOfflineData();
    setSyncState(prev => ({ ...prev, pendingChanges: 0 }));
  }, []);

  useEffect(() => {
    const initializeOfflineStorage = async () => {
      try {
        await offlineStorageService.initialize();
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
      }
    };

    initializeOfflineStorage();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Auto-sync when coming back online
    const handleOnline = () => {
      updateOnlineStatus();
      setTimeout(forcSync, 2000); // Give a moment for connection to stabilize
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('online', handleOnline);
      offlineStorageService.destroy();
    };
  }, [updateOnlineStatus, forcSync]);

  return {
    ...syncState,
    forcSync,
    saveOffline,
    loadOffline,
    deleteOffline,
    getStorageInfo,
    exportData,
    importData,
    clearAllData
  };
};