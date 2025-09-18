/**
 * Auto-save hook for content
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { storageService } from '@/services/storageService';
import { APP_CONFIG } from '@/utils/constants';
import type { RootState } from '@/store/store';

interface UseAutoSaveOptions {
  data: any;
  saveFunction: (data: any) => boolean;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({
  data,
  saveFunction,
  delay = APP_CONFIG.AUTO_SAVE_INTERVAL,
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<any>(null);
  const isSavingRef = useRef(false);

  // Get auto-save preference from user settings
  const preferences = storageService.getPreferences();
  const autoSaveEnabled = enabled && preferences.autoSave;

  const save = useCallback(async () => {
    if (isSavingRef.current || !autoSaveEnabled || !data) return;

    try {
      isSavingRef.current = true;
      const success = saveFunction(data);
      
      if (success) {
        lastSavedRef.current = JSON.stringify(data);
        console.log('Auto-saved successfully');
      } else {
        console.warn('Auto-save failed');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, autoSaveEnabled]);

  const scheduleAutoSave = useCallback(() => {
    if (!autoSaveEnabled || !data) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if data has changed
    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedRef.current) {
      return; // No changes to save
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);
  }, [data, save, delay, autoSaveEnabled]);

  // Effect to schedule auto-save when data changes
  useEffect(() => {
    scheduleAutoSave();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleAutoSave]);

  // Manual save function
  const forceSave = useCallback(() => {
    if (!data) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save, data]);

  return {
    forceSave,
    isAutoSaveEnabled: autoSaveEnabled,
  };
}

/**
 * Auto-save hook specifically for projects
 */
export function useProjectAutoSave(project: any, enabled: boolean = true) {
  const { projectService } = require('@/services/projectService');

  return useAutoSave({
    data: project,
    saveFunction: (projectData) => {
      if (!projectData?.id) return false;
      const updated = projectService.updateProject(projectData.id, projectData);
      return !!updated;
    },
    enabled,
  });
}

/**
 * Auto-save hook specifically for notes
 */
export function useNoteAutoSave(note: any, enabled: boolean = true) {
  const { noteService } = require('@/services/noteService');

  return useAutoSave({
    data: note,
    saveFunction: (noteData) => {
      if (!noteData?.id || !noteData?.projectId) return false;
      const updated = noteService.updateNote(noteData.projectId, noteData.id, noteData);
      return !!updated;
    },
    enabled,
  });
}

/**
 * Auto-save hook for user preferences
 */
export function usePreferencesAutoSave(preferences: any, enabled: boolean = true) {
  return useAutoSave({
    data: preferences,
    saveFunction: (preferencesData) => {
      return storageService.savePreferences(preferencesData);
    },
    delay: 1000, // Save preferences faster
    enabled,
  });
}