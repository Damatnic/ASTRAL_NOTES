/**
 * Auto-Save Indicator Component
 * Visual feedback for save status, draft recovery, and conflict resolution
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  Check, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  History,
  Zap,
  Cloud,
  CloudOff,
  Timer,
  Pause,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';

interface AutoSaveIndicatorProps {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  isOnline: boolean;
  autoSaveEnabled: boolean;
  onToggleAutoSave?: () => void;
  onManualSave?: () => void;
  onRecoverDraft?: () => void;
  onResolveConflict?: () => void;
  conflictCount?: number;
  draftCount?: number;
  saveProgress?: number; // 0-100 for large saves
  className?: string;
}

interface SaveQueueItem {
  id: string;
  timestamp: Date;
  size: number;
  status: 'pending' | 'saving' | 'completed' | 'failed';
}

export function AutoSaveIndicator({
  saveStatus,
  lastSaved,
  hasUnsavedChanges,
  isOnline,
  autoSaveEnabled,
  onToggleAutoSave,
  onManualSave,
  onRecoverDraft,
  onResolveConflict,
  conflictCount = 0,
  draftCount = 0,
  saveProgress,
  className
}: AutoSaveIndicatorProps) {
  const toast = useToast();
  const [saveQueue, setSaveQueue] = useState<SaveQueueItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextAutoSave, setNextAutoSave] = useState<Date | null>(null);

  // Auto-save countdown timer
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || saveStatus === 'saving') {
      setNextAutoSave(null);
      return;
    }

    const autoSaveDelay = 3000; // 3 seconds
    const targetTime = new Date(Date.now() + autoSaveDelay);
    setNextAutoSave(targetTime);

    const interval = setInterval(() => {
      const now = new Date();
      if (now >= targetTime) {
        setNextAutoSave(null);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [autoSaveEnabled, hasUnsavedChanges, saveStatus]);

  // Format time ago
  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffSecs < 5) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }, []);

  // Get countdown to next auto-save
  const getAutoSaveCountdown = useCallback(() => {
    if (!nextAutoSave) return null;
    
    const now = new Date();
    const remaining = Math.max(0, nextAutoSave.getTime() - now.getTime());
    const seconds = Math.ceil(remaining / 1000);
    
    return seconds;
  }, [nextAutoSave]);

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        };
      case 'saved':
        return {
          icon: <Check className="h-4 w-4" />,
          text: `Saved ${lastSaved ? formatTimeAgo(lastSaved) : ''}`,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Save failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
        };
      case 'offline':
        return {
          icon: <CloudOff className="h-4 w-4" />,
          text: 'Offline',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        };
      default:
        if (hasUnsavedChanges) {
          const countdown = getAutoSaveCountdown();
          return {
            icon: <Clock className="h-4 w-4" />,
            text: countdown ? `Auto-save in ${countdown}s` : 'Unsaved changes',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          };
        }
        return {
          icon: <Check className="h-4 w-4" />,
          text: 'All changes saved',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={cn("auto-save-indicator", className)}>
      {/* Main Status Indicator */}
      <Card 
        className={cn(
          "p-2 cursor-pointer transition-all duration-200 hover:shadow-md",
          statusDisplay.bgColor
        )}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          {/* Status Icon */}
          <div className={statusDisplay.color}>
            {statusDisplay.icon}
          </div>
          
          {/* Status Text */}
          <span className={cn("text-sm font-medium", statusDisplay.color)}>
            {statusDisplay.text}
          </span>
          
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-1">
            {conflictCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1">
                {conflictCount}
              </Badge>
            )}
            {draftCount > 0 && (
              <Badge variant="outline" className="text-xs px-1">
                {draftCount}
              </Badge>
            )}
          </div>
          
          {/* Auto-save indicator */}
          <div className={cn(
            "flex items-center gap-1",
            autoSaveEnabled ? "text-green-600" : "text-gray-400"
          )}>
            <Zap className="h-3 w-3" />
            <span className="text-xs">Auto</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        {saveProgress !== undefined && saveProgress < 100 && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${saveProgress}%` }}
            />
          </div>
        )}
      </Card>
      
      {/* Detailed Status Panel */}
      {showDetails && (
        <Card className="mt-2 p-3 space-y-3 border-cosmic-200">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Save Status</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between text-sm">
            <span>Connection:</span>
            <div className="flex items-center gap-1">
              {isOnline ? (
                <>
                  <Cloud className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>
          
          {/* Auto-save Settings */}
          <div className="flex items-center justify-between text-sm">
            <span>Auto-save:</span>
            <Button
              size="sm"
              variant={autoSaveEnabled ? "default" : "outline"}
              onClick={onToggleAutoSave}
              className="h-6 px-2 text-xs flex items-center gap-1"
            >
              {autoSaveEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {autoSaveEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          {/* Last Saved */}
          {lastSaved && (
            <div className="flex items-center justify-between text-sm">
              <span>Last saved:</span>
              <span className="text-muted-foreground">
                {lastSaved.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {/* Save Queue */}
          {saveQueue.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Save Queue:</span>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {saveQueue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span>{item.timestamp.toLocaleTimeString()}</span>
                    <Badge 
                      variant={
                        item.status === 'completed' ? 'default' : 
                        item.status === 'failed' ? 'destructive' : 'outline'
                      }
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="space-y-2 pt-2 border-t">
            {/* Manual Save */}
            <Button
              size="sm"
              onClick={onManualSave}
              disabled={saveStatus === 'saving' || !hasUnsavedChanges}
              className="w-full flex items-center gap-2"
            >
              <Save className="h-3 w-3" />
              Save Now
            </Button>
            
            {/* Draft Recovery */}
            {draftCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRecoverDraft}
                className="w-full flex items-center gap-2"
              >
                <History className="h-3 w-3" />
                Recover Drafts ({draftCount})
              </Button>
            )}
            
            {/* Conflict Resolution */}
            {conflictCount > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onResolveConflict}
                className="w-full flex items-center gap-2"
              >
                <AlertTriangle className="h-3 w-3" />
                Resolve Conflicts ({conflictCount})
              </Button>
            )}
            
            {/* Retry Failed Saves */}
            {saveStatus === 'error' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  onManualSave?.();
                }}
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Retry Save {retryCount > 0 && `(${retryCount})`}
              </Button>
            )}
          </div>
          
          {/* Save Statistics */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span>Status: </span>
                <span className={statusDisplay.color}>
                  {saveStatus}
                </span>
              </div>
              <div>
                <span>Mode: </span>
                <span>{autoSaveEnabled ? 'Auto' : 'Manual'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Floating Notifications */}
      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="p-3 border-red-200 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="font-medium text-sm text-red-900 dark:text-red-100">
                  Save Failed
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Your changes couldn't be saved. Try again?
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onManualSave}
                className="ml-2"
              >
                Retry
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {draftCount > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <Card className="p-3 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  Drafts Available
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {draftCount} unsaved draft{draftCount > 1 ? 's' : ''} found
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onRecoverDraft}
                className="ml-2"
              >
                Recover
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AutoSaveIndicator;