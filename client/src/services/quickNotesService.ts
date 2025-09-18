/**
 * Quick Notes Service
 * Handles CRUD operations for standalone quick notes using localStorage
 */

import type { Note, NoteType } from '@/types/global';
import { storageService } from './storageService';
import { projectService } from './projectService';

// Quick Note interface - extends Note but allows projectId to be null
export interface QuickNote extends Omit<Note, 'projectId' | 'storyId' | 'wikiLinks' | 'backlinks' | 'linkedElements' | 'templateData' | 'comments' | 'lastEditedBy' | 'version' | 'versionHistory' | 'aiSuggestions'> {
  projectId: string | null; // Can be null for standalone notes
  storyId?: never; // Quick notes don't belong to stories
  isQuickNote: true; // Flag to identify quick notes
  attachedToProject?: string; // Optional project attachment for later organization
}

export interface CreateQuickNoteData {
  title: string;
  content?: string;
  type?: NoteType;
  tags?: string[];
  projectId?: string | null; // Optional project assignment
}

export interface UpdateQuickNoteData {
  title?: string;
  content?: string;
  type?: NoteType;
  tags?: string[];
  status?: QuickNote['status'];
  priority?: QuickNote['priority'];
  attachedToProject?: string | null;
}

export interface QuickNoteSearchOptions {
  query?: string;
  tags?: string[];
  type?: NoteType;
  status?: QuickNote['status'];
  priority?: QuickNote['priority'];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

class QuickNotesService {
  private static instance: QuickNotesService;
  private readonly STORAGE_KEY = 'astral_quick_notes';
  private readonly AUTO_SAVE_DELAY = 1000; // ms
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  public static getInstance(): QuickNotesService {
    if (!QuickNotesService.instance) {
      QuickNotesService.instance = new QuickNotesService();
    }
    return QuickNotesService.instance;
  }

  /**
   * Get all quick notes
   */
  public getAllQuickNotes(): QuickNote[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const notes = JSON.parse(stored) as QuickNote[];
      return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Error loading quick notes:', error);
      return [];
    }
  }

  /**
   * Get quick note by ID
   */
  public getQuickNoteById(noteId: string): QuickNote | null {
    const notes = this.getAllQuickNotes();
    return notes.find(n => n.id === noteId) || null;
  }

  /**
   * Create a new quick note
   */
  public createQuickNote(data: CreateQuickNoteData): QuickNote {
    const now = new Date().toISOString();
    const existingNotes = this.getAllQuickNotes();
    const maxPosition = Math.max(...existingNotes.map(n => n.position), 0);

    const quickNote: QuickNote = {
      id: this.generateId(),
      projectId: data.projectId || null,
      title: data.title.trim() || 'Untitled Quick Note',
      content: data.content?.trim() || '',
      type: data.type || 'note',
      tags: data.tags || [],
      folder: undefined,
      position: maxPosition + 1,
      wordCount: this.calculateWordCount(data.content || ''),
      readTime: this.calculateReadTime(data.content || ''),
      status: 'draft',
      priority: 'medium',
      isQuickNote: true,
      createdAt: now,
      updatedAt: now,
      archivedAt: undefined,
      attachedToProject: data.projectId || undefined,
    };

    const notes = [quickNote, ...existingNotes];
    this.saveQuickNotes(notes);

    return quickNote;
  }

  /**
   * Update an existing quick note
   */
  public updateQuickNote(noteId: string, data: UpdateQuickNoteData): QuickNote | null {
    const notes = this.getAllQuickNotes();
    const index = notes.findIndex(n => n.id === noteId);
    
    if (index === -1) {
      return null;
    }

    const updated: QuickNote = {
      ...notes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate word count and read time if content changed
    if (data.content !== undefined) {
      updated.wordCount = this.calculateWordCount(data.content);
      updated.readTime = this.calculateReadTime(data.content);
    }

    // Update title if provided
    if (data.title !== undefined) {
      updated.title = data.title.trim() || 'Untitled Quick Note';
    }

    notes[index] = updated;
    this.saveQuickNotes(notes);

    return updated;
  }

  /**
   * Delete a quick note
   */
  public deleteQuickNote(noteId: string): boolean {
    const notes = this.getAllQuickNotes();
    const filteredNotes = notes.filter(n => n.id !== noteId);
    
    if (filteredNotes.length === notes.length) {
      return false; // Note not found
    }

    this.saveQuickNotes(filteredNotes);
    return true;
  }

  /**
   * Archive a quick note
   */
  public archiveQuickNote(noteId: string): boolean {
    const note = this.getQuickNoteById(noteId);
    if (!note) return false;

    return !!this.updateQuickNote(noteId, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });
  }

  /**
   * Restore an archived quick note
   */
  public restoreQuickNote(noteId: string): boolean {
    const note = this.getQuickNoteById(noteId);
    if (!note) return false;

    return !!this.updateQuickNote(noteId, {
      status: 'draft',
      archivedAt: undefined,
    });
  }

  /**
   * Duplicate a quick note
   */
  public duplicateQuickNote(noteId: string): QuickNote | null {
    const original = this.getQuickNoteById(noteId);
    if (!original) {
      return null;
    }

    return this.createQuickNote({
      title: `${original.title} (Copy)`,
      content: original.content,
      type: original.type,
      tags: [...original.tags],
      projectId: original.projectId,
    });
  }

  /**
   * Attach quick note to project
   */
  public attachToProject(noteId: string, projectId: string): QuickNote | null {
    const note = this.getQuickNoteById(noteId);
    if (!note) return null;

    // Verify project exists
    const project = projectService.getProjectById(projectId);
    if (!project) return null;

    return this.updateQuickNote(noteId, {
      projectId,
      attachedToProject: projectId,
    });
  }

  /**
   * Detach quick note from project
   */
  public detachFromProject(noteId: string): QuickNote | null {
    const note = this.getQuickNoteById(noteId);
    if (!note) return null;

    return this.updateQuickNote(noteId, {
      projectId: null,
      attachedToProject: undefined,
    });
  }

  /**
   * Move quick note to project (converts to regular project note)
   */
  public moveToProject(noteId: string, projectId: string): Note | null {
    const quickNote = this.getQuickNoteById(noteId);
    if (!quickNote) return null;

    // Verify project exists
    const project = projectService.getProjectById(projectId);
    if (!project) return null;

    // Create regular note in project
    const regularNote = {
      id: quickNote.id,
      projectId,
      title: quickNote.title,
      content: quickNote.content,
      type: quickNote.type,
      tags: quickNote.tags,
      wordCount: quickNote.wordCount,
      position: quickNote.position,
      createdAt: quickNote.createdAt,
      updatedAt: new Date().toISOString(),
      // Add required Note properties
      wikiLinks: [],
      backlinks: [],
      linkedElements: [],
      templateData: undefined,
      readTime: quickNote.readTime,
      status: quickNote.status,
      priority: quickNote.priority,
      comments: [],
      lastEditedBy: undefined,
      version: 1,
      versionHistory: [],
      aiSuggestions: [],
      archivedAt: undefined,
    } as Note;

    // Use noteService to create the note in the project
    const projectNotes = storageService.getProjectNotes(projectId);
    projectNotes.push(regularNote);
    storageService.saveProjectNotes(projectId, projectNotes);

    // Remove from quick notes
    this.deleteQuickNote(noteId);

    // Update project word count
    projectService.updateProjectWordCount(projectId);

    return regularNote;
  }

  /**
   * Search quick notes
   */
  public searchQuickNotes(options: QuickNoteSearchOptions = {}): QuickNote[] {
    let notes = this.getAllQuickNotes();

    // Filter by query
    if (options.query) {
      const lowerQuery = options.query.toLowerCase().trim();
      notes = notes.filter(note => 
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      notes = notes.filter(note =>
        options.tags!.some(tag => note.tags.includes(tag))
      );
    }

    // Filter by type
    if (options.type) {
      notes = notes.filter(note => note.type === options.type);
    }

    // Filter by status
    if (options.status) {
      notes = notes.filter(note => note.status === options.status);
    }

    // Filter by priority
    if (options.priority) {
      notes = notes.filter(note => note.priority === options.priority);
    }

    // Filter by date range
    if (options.dateRange) {
      const start = new Date(options.dateRange.start);
      const end = new Date(options.dateRange.end);
      notes = notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= start && noteDate <= end;
      });
    }

    // Sort results
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'desc';
    
    notes.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    return notes;
  }

  /**
   * Get recent quick notes
   */
  public getRecentQuickNotes(limit: number = 10): QuickNote[] {
    const notes = this.getAllQuickNotes();
    return notes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get quick notes by tags
   */
  public getQuickNotesByTags(tags: string[]): QuickNote[] {
    const notes = this.getAllQuickNotes();
    return notes.filter(note =>
      tags.some(tag => note.tags.includes(tag))
    );
  }

  /**
   * Get quick notes statistics
   */
  public getQuickNotesStats(): {
    totalNotes: number;
    notesByType: Record<NoteType, number>;
    notesByStatus: Record<QuickNote['status'], number>;
    notesByPriority: Record<QuickNote['priority'], number>;
    totalWords: number;
    averageWordsPerNote: number;
    attachedNotes: number;
    unattachedNotes: number;
  } {
    const notes = this.getAllQuickNotes();
    const totalWords = notes.reduce((sum, note) => sum + note.wordCount, 0);

    const notesByType = notes.reduce((acc, note) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    }, {} as Record<NoteType, number>);

    const notesByStatus = notes.reduce((acc, note) => {
      acc[note.status] = (acc[note.status] || 0) + 1;
      return acc;
    }, {} as Record<QuickNote['status'], number>);

    const notesByPriority = notes.reduce((acc, note) => {
      acc[note.priority] = (acc[note.priority] || 0) + 1;
      return acc;
    }, {} as Record<QuickNote['priority'], number>);

    const attachedNotes = notes.filter(note => note.projectId).length;

    return {
      totalNotes: notes.length,
      notesByType,
      notesByStatus,
      notesByPriority,
      totalWords,
      averageWordsPerNote: notes.length > 0 ? Math.round(totalWords / notes.length) : 0,
      attachedNotes,
      unattachedNotes: notes.length - attachedNotes,
    };
  }

  /**
   * Export quick notes
   */
  public exportQuickNotes(format: 'txt' | 'md' | 'json' = 'md'): string {
    const notes = this.getAllQuickNotes();
    
    if (format === 'json') {
      return JSON.stringify(notes, null, 2);
    }

    let content = '';
    
    if (format === 'md') {
      content += '# Quick Notes\n\n';
      
      notes.forEach(note => {
        content += `## ${note.title}\n\n`;
        if (note.tags.length > 0) {
          content += `*Tags: ${note.tags.join(', ')}*\n\n`;
        }
        if (note.projectId) {
          const project = projectService.getProjectById(note.projectId);
          content += `*Project: ${project?.title || 'Unknown'}*\n\n`;
        }
        content += `${note.content}\n\n---\n\n`;
      });
    } else {
      content += 'Quick Notes\n';
      content += '===========\n\n';
      
      notes.forEach(note => {
        content += `${note.title}\n`;
        content += '-'.repeat(note.title.length) + '\n\n';
        if (note.tags.length > 0) {
          content += `Tags: ${note.tags.join(', ')}\n\n`;
        }
        if (note.projectId) {
          const project = projectService.getProjectById(note.projectId);
          content += `Project: ${project?.title || 'Unknown'}\n\n`;
        }
        content += `${note.content}\n\n`;
      });
    }
    
    return content;
  }

  /**
   * Import quick notes from JSON
   */
  public importQuickNotes(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    const result = { success: false, imported: 0, errors: [] as string[] };
    
    try {
      const importedNotes = JSON.parse(jsonData) as QuickNote[];
      const existingNotes = this.getAllQuickNotes();
      const existingIds = new Set(existingNotes.map(n => n.id));
      
      const validNotes = importedNotes.filter(note => {
        if (!note.id || !note.title) {
          result.errors.push(`Invalid note structure: ${JSON.stringify(note)}`);
          return false;
        }
        if (existingIds.has(note.id)) {
          result.errors.push(`Duplicate note ID: ${note.id}`);
          return false;
        }
        return true;
      });

      // Add isQuickNote flag and clean up properties
      const cleanedNotes = validNotes.map(note => ({
        ...note,
        isQuickNote: true as const,
        updatedAt: new Date().toISOString(),
      }));

      const allNotes = [...cleanedNotes, ...existingNotes];
      this.saveQuickNotes(allNotes);

      result.success = true;
      result.imported = cleanedNotes.length;
    } catch (error) {
      result.errors.push(`JSON parsing error: ${error}`);
    }

    return result;
  }

  /**
   * Auto-save a quick note with debouncing
   */
  public autoSaveQuickNote(noteId: string, data: UpdateQuickNoteData): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.updateQuickNote(noteId, data);
      this.autoSaveTimeout = null;
    }, this.AUTO_SAVE_DELAY);
  }

  /**
   * Bulk operations
   */
  public bulkDeleteQuickNotes(noteIds: string[]): number {
    const notes = this.getAllQuickNotes();
    const remainingNotes = notes.filter(note => !noteIds.includes(note.id));
    const deletedCount = notes.length - remainingNotes.length;
    
    this.saveQuickNotes(remainingNotes);
    return deletedCount;
  }

  public bulkUpdateQuickNotes(noteIds: string[], data: UpdateQuickNoteData): number {
    const notes = this.getAllQuickNotes();
    let updatedCount = 0;
    
    const updatedNotes = notes.map(note => {
      if (noteIds.includes(note.id)) {
        updatedCount++;
        return {
          ...note,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    });
    
    this.saveQuickNotes(updatedNotes);
    return updatedCount;
  }

  public bulkAttachToProject(noteIds: string[], projectId: string): number {
    const project = projectService.getProjectById(projectId);
    if (!project) return 0;

    return this.bulkUpdateQuickNotes(noteIds, {
      projectId,
      attachedToProject: projectId,
    });
  }

  /**
   * Get all available tags from quick notes
   */
  public getAllTags(): string[] {
    const notes = this.getAllQuickNotes();
    const tagSet = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    
    return Array.from(tagSet).sort();
  }

  /**
   * Save quick notes to localStorage
   */
  private saveQuickNotes(notes: QuickNote[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving quick notes:', error);
    }
  }

  /**
   * Calculate word count for text content
   */
  private calculateWordCount(content: string): number {
    if (!content.trim()) return 0;
    
    // Remove HTML tags and extra whitespace
    const cleanText = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanText) return 0;
    
    return cleanText.split(' ').length;
  }

  /**
   * Calculate estimated read time
   */
  private calculateReadTime(content: string): number {
    const wordCount = this.calculateWordCount(content);
    // Average reading speed: 200 words per minute
    return Math.ceil(wordCount / 200);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `quick_note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const quickNotesService = QuickNotesService.getInstance();