/**
 * Export/Import Service
 * Handles data backup, export, and import functionality
 */

import { storageService } from './storageService';
import { projectService } from './projectService';
import { noteService } from './noteService';
import { quickNotesService } from './quickNotesService';
import type { Project, Note } from '@/types/global';

export interface ExportData {
  metadata: {
    exportedAt: string;
    version: string;
    appName: string;
  };
  projects: Project[];
  notes: Record<string, Note[]>;
  quickNotes: any[];
  preferences: any;
  exportedAt: string;
  version: string;
}

export interface ExportOptions {
  includeArchived?: boolean;
  includeDeleted?: boolean;
  projectIds?: string[];
  format?: 'json' | 'markdown' | 'txt';
}

class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export all data as JSON
   */
  public exportAllData(options: ExportOptions = {}): ExportData {
    const {
      includeArchived = true,
      includeDeleted = false,
      projectIds = [],
    } = options;

    let projects = projectService.getAllProjects();

    // Filter projects based on options
    if (!includeArchived) {
      projects = projects.filter(p => p.status !== 'archived');
    }
    if (!includeDeleted) {
      projects = projects.filter(p => p.status !== 'deleted');
    }
    if (projectIds.length > 0) {
      projects = projects.filter(p => projectIds.includes(p.id));
    }

    // Get notes for filtered projects
    const notes: Record<string, Note[]> = {};
    projects.forEach(project => {
      notes[project.id] = noteService.getProjectNotes(project.id);
    });

    const exportedAt = new Date().toISOString();
    const version = '1.0.0';

    return {
      metadata: {
        exportedAt,
        version,
        appName: 'Astral Notes',
      },
      projects,
      notes,
      quickNotes: quickNotesService.getAllQuickNotes(),
      preferences: storageService.getPreferences(),
      exportedAt,
      version,
    };
  }

  /**
   * Export data as downloadable JSON file
   */
  public downloadDataAsJson(options: ExportOptions = {}, filename?: string): void {
    const data = this.exportAllData(options);
    const jsonString = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `astral-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export a single note as Markdown
   */
  public exportNoteAsMarkdown(noteId: string): string {
    const note = noteService.getNoteById(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }

    let markdown = `# ${note.title}\n\n`;
    
    if (note.tags && note.tags.length > 0) {
      markdown += `**Tags:** ${note.tags.join(', ')}\n\n`;
    }
    
    markdown += `**Created:** ${new Date(note.createdAt).toLocaleDateString()}\n`;
    markdown += `**Last Updated:** ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
    markdown += `---\n\n`;
    markdown += note.content || '';
    
    return markdown;
  }

  /**
   * Export projects as CSV
   */
  public exportProjectsAsCSV(projects: Project[]): string {
    const headers = ['Title', 'Description', 'Status', 'Word Count', 'Note Count', 'Created At', 'Last Edited At'];
    const rows = projects.map(project => {
      // Get note count from project stats or default to 0
      const stats = projectService.getProjectStats(project.id);
      const noteCount = stats ? stats.noteCount || 0 : 0;
      
      return [
        `"${project.title.replace(/"/g, '""')}"`,
        `"${(project.description || '').replace(/"/g, '""')}"`,
        project.status,
        project.wordCount.toString(),
        noteCount.toString(),
        new Date(project.createdAt).toLocaleDateString(),
        new Date(project.lastEditedAt).toLocaleDateString()
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Get supported export formats
   */
  public getSupportedFormats(): string[] {
    return ['json', 'markdown', 'csv', 'txt', 'pdf'];
  }

  /**
   * Export a single project with all its data
   */
  public exportProject(projectId: string): { project: any; notes: any[]; exportedAt: string } {
    const project = projectService.getProjectById(projectId);
    if (!project) {
      return {
        project: { id: projectId, title: 'Project Not Found', description: '', status: 'unknown', wordCount: 0, noteCount: 0, createdAt: new Date().toISOString(), lastEditedAt: new Date().toISOString() },
        notes: [],
        exportedAt: new Date().toISOString()
      };
    }

    const notes = noteService.getNotesByProject(projectId);
    
    return {
      project,
      notes,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Export single project as markdown
   */
  public exportProjectAsMarkdown(projectId: string): string {
    const project = projectService.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const notes = noteService.getProjectNotes(projectId);
    
    let markdown = `# ${project.title}\n\n`;
    
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }

    markdown += `**Status:** ${project.status}\n`;
    markdown += `**Genre:** ${project.genre || 'Not specified'}\n`;
    markdown += `**Word Count:** ${project.wordCount.toLocaleString()}\n`;
    markdown += `**Created:** ${new Date(project.createdAt).toLocaleDateString()}\n`;
    markdown += `**Last Updated:** ${new Date(project.updatedAt).toLocaleDateString()}\n\n`;

    if (project.tags.length > 0) {
      markdown += `**Tags:** ${project.tags.join(', ')}\n\n`;
    }

    markdown += '---\n\n';

    // Group notes by type
    const notesByType = notes.reduce((acc, note) => {
      if (!acc[note.type]) {
        acc[note.type] = [];
      }
      acc[note.type].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    // Export notes by type
    Object.entries(notesByType).forEach(([type, typeNotes]) => {
      markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
      
      typeNotes.forEach(note => {
        markdown += `### ${note.title}\n\n`;
        
        if (note.tags.length > 0) {
          markdown += `*Tags: ${note.tags.join(', ')}*\n\n`;
        }
        
        markdown += `${note.content}\n\n`;
        markdown += `*Word count: ${note.wordCount} | Created: ${new Date(note.createdAt).toLocaleDateString()}*\n\n`;
        markdown += '---\n\n';
      });
    });

    return markdown;
  }

  /**
   * Download project as markdown file
   */
  public downloadProjectAsMarkdown(projectId: string): void {
    const project = projectService.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const markdown = this.exportProjectAsMarkdown(projectId);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export project as plain text
   */
  public exportProjectAsText(projectId: string): string {
    const project = projectService.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const notes = noteService.getProjectNotes(projectId);
    
    let text = `${project.title}\n`;
    text += '='.repeat(project.title.length) + '\n\n';
    
    if (project.description) {
      text += `${project.description}\n\n`;
    }

    text += `Status: ${project.status}\n`;
    text += `Genre: ${project.genre || 'Not specified'}\n`;
    text += `Word Count: ${project.wordCount.toLocaleString()}\n`;
    text += `Created: ${new Date(project.createdAt).toLocaleDateString()}\n`;
    text += `Last Updated: ${new Date(project.updatedAt).toLocaleDateString()}\n\n`;

    if (project.tags.length > 0) {
      text += `Tags: ${project.tags.join(', ')}\n\n`;
    }

    text += '-'.repeat(50) + '\n\n';

    // Export notes
    notes.forEach(note => {
      text += `${note.title}\n`;
      text += '-'.repeat(note.title.length) + '\n\n';
      
      if (note.tags.length > 0) {
        text += `Tags: ${note.tags.join(', ')}\n\n`;
      }
      
      text += `${note.content}\n\n`;
      text += `Word count: ${note.wordCount} | Created: ${new Date(note.createdAt).toLocaleDateString()}\n\n`;
    });

    return text;
  }

  /**
   * Import data from JSON
   */
  public async importData(jsonData: string): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      const data = JSON.parse(jsonData) as ExportData;
      
      // Validate data structure
      if (!data.metadata || !data.projects || !data.notes) {
        throw new Error('Invalid data format');
      }

      // Create backup before import
      const backupData = storageService.exportData();
      localStorage.setItem('astral_notes_pre_import_backup', backupData);

      let importedProjects = 0;
      let importedNotes = 0;
      const existingProjects = projectService.getAllProjects();

      // Import projects
      for (const project of data.projects) {
        // Check if project already exists
        const existing = existingProjects.find(p => p.id === project.id);
        if (existing) {
          // Update existing project
          projectService.updateProject(project.id, project);
        } else {
          // Create new project with preserved ID
          const projects = storageService.getProjects();
          projects.push(project);
          storageService.saveProjects(projects);
        }
        importedProjects++;

        // Import notes for this project
        if (data.notes[project.id]) {
          storageService.saveProjectNotes(project.id, data.notes[project.id]);
          importedNotes += data.notes[project.id].length;
        }
      }

      // Import preferences (merge with existing)
      if (data.preferences) {
        const currentPreferences = storageService.getPreferences();
        const mergedPreferences = { ...currentPreferences, ...data.preferences };
        storageService.savePreferences(mergedPreferences);
      }

      return {
        success: true,
        message: 'Data imported successfully',
        stats: {
          projectsImported: importedProjects,
          notesImported: importedNotes,
          importedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        stats: null,
      };
    }
  }

  /**
   * Import data from file
   */
  public importFromFile(file: File): Promise<{ success: boolean; message: string; stats: any }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const result = await this.importData(content);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            message: 'Failed to read file',
            stats: null,
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'File reading error',
          stats: null,
        });
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Create automatic backup
   */
  public createAutoBackup(): boolean {
    try {
      const data = this.exportAllData();
      const backupKey = `astral_notes_auto_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(data));

      // Keep only the last 5 auto backups
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('astral_notes_auto_backup_'))
        .sort();

      if (backupKeys.length > 5) {
        backupKeys.slice(0, -5).forEach(key => {
          localStorage.removeItem(key);
        });
      }

      return true;
    } catch (error) {
      console.error('Auto backup failed:', error);
      return false;
    }
  }

  /**
   * Get available backups
   */
  public getAvailableBackups(): Array<{ key: string; date: Date; size: string }> {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('astral_notes_auto_backup_') || key.startsWith('astral_notes_backup'));

    return backupKeys.map(key => {
      const data = localStorage.getItem(key) || '';
      const size = new Blob([data]).size;
      const timestamp = key.includes('auto_backup_') 
        ? parseInt(key.split('_').pop() || '0')
        : Date.now();

      return {
        key,
        date: new Date(timestamp),
        size: this.formatFileSize(size),
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Restore from backup
   */
  public restoreFromBackup(backupKey: string): boolean {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        return false;
      }

      const data = JSON.parse(backupData);
      return storageService.importData(JSON.stringify(data));
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const exportService = ExportService.getInstance();