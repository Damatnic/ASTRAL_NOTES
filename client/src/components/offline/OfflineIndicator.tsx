// Offline Indicator Component
// Shows connection status and sync progress

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiIcon,
  WifiOffIcon,
  CloudIcon,
  Upload,
  CloudOffIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadCloudIcon,
  DatabaseIcon,
  XIcon,
  ShieldIcon,
  ClockIcon,
  ServerIcon
} from 'lucide-react';
import offlineService from '../../services/offlineService';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatus {
  inProgress: boolean;
  queueSize: number;
  lastSync?: Date;
  conflicts: number;
  errors: number;
}

interface BackupStatus {
  enabled: boolean;
  lastBackup?: Date;
  nextBackup?: Date;
  backupCount: number;
}

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    inProgress: false,
    queueSize: 0,
    conflicts: 0,
    errors: 0
  });
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    enabled: false,
    backupCount: 0
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    // Connection status listeners
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Connection restored', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification('Working offline', 'info');
    };

    // Offline service listeners
    const handleConnectionChanged = ({ online }: any) => {
      setIsOnline(online);
    };

    const handleSyncStarted = ({ queue }: any) => {
      setSyncStatus(prev => ({
        ...prev,
        inProgress: true,
        queueSize: queue.length
      }));
    };

    const handleSyncCompleted = () => {
      setSyncStatus(prev => ({
        ...prev,
        inProgress: false,
        queueSize: 0,
        lastSync: new Date()
      }));
      showNotification('Changes synced', 'success');
    };

    const handleSyncError = () => {
      setSyncStatus(prev => ({
        ...prev,
        errors: prev.errors + 1
      }));
    };

    const handleConflictDetected = () => {
      setSyncStatus(prev => ({
        ...prev,
        conflicts: prev.conflicts + 1
      }));
      showNotification('Sync conflict detected', 'warning');
    };

    const handleBackupCreated = ({ type }: any) => {
      setBackupStatus(prev => ({
        ...prev,
        lastBackup: new Date(),
        backupCount: prev.backupCount + 1
      }));
      if (type === 'manual') {
        showNotification('Backup created successfully', 'success');
      }
    };

    const handleOfflineReady = () => {
      setIsServiceWorkerReady(true);
      showNotification('Offline mode ready', 'success');
    };

    // Register listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    offlineService.on('connection-changed', handleConnectionChanged);
    offlineService.on('sync-started', handleSyncStarted);
    offlineService.on('sync-completed', handleSyncCompleted);
    offlineService.on('sync-error', handleSyncError);
    offlineService.on('conflict-detected', handleConflictDetected);
    offlineService.on('backup-created', handleBackupCreated);
    offlineService.on('offline-ready', handleOfflineReady);

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }

    // Initial sync status
    setSyncStatus(prev => ({
      ...prev,
      queueSize: offlineService.getSyncQueueSize()
    }));

    // Load backup status
    loadBackupStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      offlineService.off('connection-changed', handleConnectionChanged);
      offlineService.off('sync-started', handleSyncStarted);
      offlineService.off('sync-completed', handleSyncCompleted);
      offlineService.off('sync-error', handleSyncError);
      offlineService.off('conflict-detected', handleConflictDetected);
      offlineService.off('backup-created', handleBackupCreated);
      offlineService.off('offline-ready', handleOfflineReady);
    };
  }, []);

  const loadBackupStatus = async () => {
    const backups = await offlineService.getBackups();
    setBackupStatus(prev => ({
      ...prev,
      backupCount: backups.length,
      lastBackup: backups[0]?.timestamp ? new Date(backups[0].timestamp) : undefined
    }));
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    // Notification implementation would go here
    console.log(`[${type}] ${message}`);
  };

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, inProgress: true }));
    // Trigger manual sync
    window.dispatchEvent(new Event('online'));
  };

  const handleCreateBackup = async () => {
    try {
      await offlineService.createBackup('manual');
    } catch (error) {
      showNotification('Backup failed', 'error');
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-orange-500';
    if (syncStatus.inProgress) return 'bg-blue-500';
    if (syncStatus.conflicts > 0 || syncStatus.errors > 0) return 'bg-yellow-500';
    if (!isServiceWorkerReady) return 'bg-gray-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOffIcon className="w-4 h-4" />;
    if (syncStatus.inProgress) return <RefreshCwIcon className="w-4 h-4 animate-spin" />;
    if (syncStatus.conflicts > 0) return <AlertCircleIcon className="w-4 h-4" />;
    if (syncStatus.errors > 0) return <AlertCircleIcon className="w-4 h-4" />;
    return <WifiIcon className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.inProgress) return `Syncing (${syncStatus.queueSize})`;
    if (syncStatus.conflicts > 0) return `${syncStatus.conflicts} Conflicts`;
    if (syncStatus.errors > 0) return `${syncStatus.errors} Errors`;
    if (syncStatus.queueSize > 0) return `${syncStatus.queueSize} Pending`;
    return 'Online';
  };

  return (
    <>
      {/* Compact Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              ${getStatusColor()} text-white
              shadow-lg hover:shadow-xl transition-all
              backdrop-blur-sm bg-opacity-90
            `}
          >
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
            {(syncStatus.queueSize > 0 || syncStatus.conflicts > 0) && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
          </button>

          {/* Status Dot */}
          <div className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full
            ${isOnline ? 'bg-green-400' : 'bg-orange-400'}
            border-2 border-white
          `} />
        </motion.div>
      </div>

      {/* Detailed Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-4 bottom-20 z-50 w-80"
          >
            <div className="bg-gray-900 rounded-xl shadow-2xl border border-purple-500/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Sync Status</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <WifiIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <WifiOffIcon className="w-5 h-5 text-orange-400" />
                    )}
                    <span className="text-gray-300 font-medium">
                      {isOnline ? 'Connected' : 'Offline Mode'}
                    </span>
                  </div>
                  {isServiceWorkerReady && (
                    <ShieldIcon className="w-5 h-5 text-blue-400" />
                  )}
                </div>

                {!isOnline && (
                  <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-2">
                    <p className="text-orange-300 text-xs">
                      Changes will be saved locally and synced when online
                    </p>
                  </div>
                )}
              </div>

              {/* Sync Queue */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300 font-medium">Sync Queue</span>
                  </div>
                  {syncStatus.queueSize > 0 && (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                      {syncStatus.queueSize} pending
                    </span>
                  )}
                </div>

                {syncStatus.inProgress && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCwIcon className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-gray-400 text-sm">Syncing changes...</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                )}

                {syncStatus.lastSync && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    <span>Last synced {formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })}</span>
                  </div>
                )}

                {(syncStatus.conflicts > 0 || syncStatus.errors > 0) && (
                  <div className="mt-3 space-y-2">
                    {syncStatus.conflicts > 0 && (
                      <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-2 flex items-center gap-2">
                        <AlertCircleIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 text-xs">
                          {syncStatus.conflicts} conflict{syncStatus.conflicts > 1 ? 's' : ''} need resolution
                        </span>
                      </div>
                    )}
                    {syncStatus.errors > 0 && (
                      <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-2 flex items-center gap-2">
                        <AlertCircleIcon className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-xs">
                          {syncStatus.errors} sync error{syncStatus.errors > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isOnline && syncStatus.queueSize > 0 && !syncStatus.inProgress && (
                  <button
                    onClick={handleManualSync}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                  >
                    Sync Now
                  </button>
                )}
              </div>

              {/* Backup Status */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300 font-medium">Backups</span>
                  </div>
                  {backupStatus.backupCount > 0 && (
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                      {backupStatus.backupCount} saved
                    </span>
                  )}
                </div>

                {backupStatus.lastBackup && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <DownloadCloudIcon className="w-4 h-4" />
                    <span>Last backup {formatDistanceToNow(backupStatus.lastBackup, { addSuffix: true })}</span>
                  </div>
                )}

                <button
                  onClick={handleCreateBackup}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Create Backup Now
                </button>
              </div>

              {/* Storage Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ServerIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 font-medium">Local Storage</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Offline cache</span>
                    <span className="text-gray-300">Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Service worker</span>
                    <span className={`${isServiceWorkerReady ? 'text-green-400' : 'text-gray-500'}`}>
                      {isServiceWorkerReady ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">IndexedDB</span>
                    <span className="text-gray-300">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};