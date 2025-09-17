/**
 * Local Storage Service
 * Handles all localStorage operations for the personal writing app
 */

import type { Project, Note, UserPreferences } from '@/types/global';

export interface StorageData {
  projects: Project[];
  notes: Record<string, Note[]>; // projectId -> notes array
  preferences: UserPreferences;
  appData: {
    lastBackup: string | null;
    dataVersion: string;
  };
}

const STORAGE_KEY = 'astral_notes_data';
const BACKUP_KEY = 'astral_notes_backup';
const DATA_VERSION = '1.0.0';

class StorageService {
  private static instance: StorageService;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private constructor() {
    this.migrateData();
  }

  /**
   * Get all data from localStorage
   */
  public getData(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return this.getDefaultData();
      }

      const parsed = JSON.parse(data) as StorageData;
      return this.validateAndMigrateData(parsed);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return this.getDefaultData();
    }
  }

  /**
   * Save all data to localStorage
   */
  public saveData(data: StorageData): boolean {
    try {
      // Create backup before saving
      this.createBackup();
      
      const dataToSave = {
        ...data,
        appData: {
          ...data.appData,
          dataVersion: DATA_VERSION,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Get projects from localStorage
   */
  public getProjects(): Project[] {
    const data = this.getData();
    return data.projects || [];
  }

  /**
   * Save projects to localStorage
   */
  public saveProjects(projects: Project[]): boolean {
    const data = this.getData();
    data.projects = projects;
    return this.saveData(data);
  }

  /**
   * Get notes for a specific project
   */
  public getProjectNotes(projectId: string): Note[] {
    const data = this.getData();
    return data.notes[projectId] || [];
  }

  /**
   * Save notes for a specific project
   */
  public saveProjectNotes(projectId: string, notes: Note[]): boolean {
    const data = this.getData();
    data.notes[projectId] = notes;
    return this.saveData(data);
  }

  /**
   * Get all notes across all projects
   */
  public getAllNotes(): Note[] {
    const data = this.getData();
    return Object.values(data.notes).flat();
  }

  /**
   * Get user preferences
   */
  public getPreferences(): UserPreferences {
    const data = this.getData();
    return data.preferences;
  }

  /**
   * Save user preferences
   */
  public savePreferences(preferences: UserPreferences): boolean {
    const data = this.getData();
    data.preferences = preferences;
    return this.saveData(data);
  }

  /**
   * Export all data as JSON
   */
  public exportData(): string {
    const data = this.getData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON string
   */
  public importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData) as StorageData;
      const validated = this.validateAndMigrateData(imported);
      return this.saveData(validated);
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Create a backup of current data
   */
  private createBackup(): void {
    try {
      const currentData = localStorage.getItem(STORAGE_KEY);
      if (currentData) {
        const backup = {
          data: currentData,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Restore data from backup
   */
  public restoreFromBackup(): boolean {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) {
        return false;
      }

      const { data } = JSON.parse(backup);
      localStorage.setItem(STORAGE_KEY, data);
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  /**
   * Clear all data (with confirmation)
   */
  public clearAllData(): boolean {
    try {
      this.createBackup();
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  public getStorageInfo(): { used: number; total: number; percentage: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
      
      return {
        used,
        total,
        percentage: Math.round((used / total) * 100),
      };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Get default data structure
   */
  private getDefaultData(): StorageData {
    return {
      projects: [],
      notes: {},
      preferences: {
        theme: 'system',
        sidebarCollapsed: false,
        autoSave: true,
        notifications: true,
        defaultView: 'cards',
        editorMode: 'rich',
        wordCountDisplay: true,
        realTimeCollaboration: false,
        aiAssistance: true,
        keyboardShortcuts: true,
        language: 'en',
        timezone: 'UTC'
      },
      appData: {
        lastBackup: null,
        dataVersion: DATA_VERSION,
      },
    };
  }

  /**
   * Validate and migrate data from older versions
   */
  private validateAndMigrateData(data: any): StorageData {
    const defaultData = this.getDefaultData();

    // Ensure required fields exist
    const migrated: StorageData = {
      projects: Array.isArray(data.projects) ? data.projects : defaultData.projects,
      notes: typeof data.notes === 'object' && data.notes ? data.notes : defaultData.notes,
      preferences: { ...defaultData.preferences, ...data.preferences },
      appData: { ...defaultData.appData, ...data.appData },
    };

    // Validate projects structure - use type assertion for migration
    migrated.projects = migrated.projects.map(project => ({
      id: project.id || this.generateId(),
      title: project.title || 'Untitled Project',
      description: project.description || '',
      userId: 'local-user',
      status: project.status || 'planning',
      isPublic: false,
      tags: Array.isArray(project.tags) ? project.tags : [],
      wordCount: typeof project.wordCount === 'number' ? project.wordCount : 0,
      lastEditedAt: project.lastEditedAt || new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
      // Add missing properties with defaults for legacy projects
      stories: project.stories || [],
      projectNotes: project.projectNotes || [],
      plotboard: project.plotboard || this.createDefaultPlotboard(),
      settings: project.settings || this.createDefaultSettings(),
      collaborators: project.collaborators || [],
      isCollaborative: project.isCollaborative || false,
      genre: project.genre,
      targetWordCount: project.targetWordCount
    } as any));

    return migrated;
  }

  /**
   * Create default plotboard structure
   */
  private createDefaultPlotboard() {
    const now = new Date().toISOString();
    return {
      id: this.generateId(),
      projectId: '',
      stories: [],
      threads: [],
      connections: [],
      timeline: [],
      settings: {
        viewMode: 'grid' as const,
        showConnections: true,
        autoLayout: true,
        gridSize: 20,
        theme: 'light' as const
      },
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Create default project settings
   */
  private createDefaultSettings() {
    return {
      defaultPOV: undefined,
      defaultLocation: undefined,
      timeFormat: '12h' as const,
      dateFormat: 'MDY' as const,
      autoSave: true,
      versionHistory: true,
      linkPreview: true,
      wordCountTarget: undefined,
      dailyGoal: undefined,
      theme: 'light' as const,
      distractionFree: false
    };
  }

  /**
   * Handle data migration from older versions
   */
  private migrateData(): void {
    // Future migration logic goes here
    // For now, just ensure data structure is valid
    const data = this.getData();
    this.saveData(data);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const storageService = StorageService.getInstance();