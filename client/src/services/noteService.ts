/**
 * Note Service
 * Handles CRUD operations for notes using localStorage
 */

import type { Note } from '@/types/global';
import { storageService } from './storageService';
import { projectService } from './projectService';

export interface CreateNoteData {
  projectId: string;
  title: string;
  content?: string;
  type?: Note['type'];
  tags?: string[];
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  type?: Note['type'];
  tags?: string[];
  position?: number;
}

class NoteService {
  private static instance: NoteService;

  public static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  /**
   * Get all notes for a project
   */
  public getProjectNotes(projectId: string): Note[] {
    return storageService.getProjectNotes(projectId)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get note by ID
   */
  public getNoteById(projectId: string, noteId: string): Note | null {
    const notes = storageService.getProjectNotes(projectId);
    return notes.find(n => n.id === noteId) || null;
  }

  /**
   * Create a new note
   */
  public createNote(data: CreateNoteData): Note {
    const now = new Date().toISOString();
    const existingNotes = storageService.getProjectNotes(data.projectId);
    const maxPosition = Math.max(...existingNotes.map(n => n.position), 0);

    const note: Note = {
      id: this.generateId(),
      projectId: data.projectId,
      title: data.title.trim(),
      content: data.content?.trim() || '',
      type: data.type || 'note',
      tags: data.tags || [],
      wordCount: this.calculateWordCount(data.content || ''),
      position: maxPosition + 1,
      createdAt: now,
      updatedAt: now,
    };

    const notes = [...existingNotes, note];
    storageService.saveProjectNotes(data.projectId, notes);

    // Update project word count and last edited time
    projectService.updateProjectWordCount(data.projectId);

    return note;
  }

  /**
   * Update an existing note
   */
  public updateNote(projectId: string, noteId: string, data: UpdateNoteData): Note | null {
    const notes = storageService.getProjectNotes(projectId);
    const index = notes.findIndex(n => n.id === noteId);
    
    if (index === -1) {
      return null;
    }

    const updated: Note = {
      ...notes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate word count if content changed
    if (data.content !== undefined) {
      updated.wordCount = this.calculateWordCount(data.content);
    }

    notes[index] = updated;
    storageService.saveProjectNotes(projectId, notes);

    // Update project word count and last edited time
    projectService.updateProjectWordCount(projectId);

    return updated;
  }

  /**
   * Delete a note
   */
  public deleteNote(projectId: string, noteId: string): boolean {
    const notes = storageService.getProjectNotes(projectId);
    const filteredNotes = notes.filter(n => n.id !== noteId);
    
    if (filteredNotes.length === notes.length) {
      return false; // Note not found
    }

    storageService.saveProjectNotes(projectId, filteredNotes);

    // Update project word count
    projectService.updateProjectWordCount(projectId);

    return true;
  }

  /**
   * Reorder notes
   */
  public reorderNotes(projectId: string, noteIds: string[]): boolean {
    const notes = storageService.getProjectNotes(projectId);
    
    // Update positions based on the new order
    const reorderedNotes = noteIds.map((id, index) => {
      const note = notes.find(n => n.id === id);
      if (!note) return null;
      
      return {
        ...note,
        position: index + 1,
        updatedAt: new Date().toISOString(),
      };
    }).filter(Boolean) as Note[];

    // Add any notes that weren't in the reorder list
    const remainingNotes = notes.filter(n => !noteIds.includes(n.id));
    const allNotes = [...reorderedNotes, ...remainingNotes];

    return storageService.saveProjectNotes(projectId, allNotes);
  }

  /**
   * Search notes within a project
   */
  public searchProjectNotes(projectId: string, query: string): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return notes;
    }

    return notes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Search notes across all projects
   */
  public searchAllNotes(query: string): Note[] {
    const allNotes = storageService.getAllNotes();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return allNotes;
    }

    return allNotes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get notes by type
   */
  public getNotesByType(projectId: string, type: Note['type']): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.filter(n => n.type === type);
  }

  /**
   * Get notes by tags
   */
  public getNotesByTags(projectId: string, tags: string[]): Note[] {
    const notes = storageService.getProjectNotes(projectId);
    return notes.filter(note => 
      tags.some(tag => note.tags.includes(tag))
    );
  }

  /**
   * Get recent notes across all projects
   */
  public getRecentNotes(limit: number = 10): Note[] {
    const allNotes = storageService.getAllNotes();
    return allNotes
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Duplicate a note
   */
  public duplicateNote(projectId: string, noteId: string): Note | null {
    const original = this.getNoteById(projectId, noteId);
    if (!original) {
      return null;
    }

    return this.createNote({
      projectId,
      title: `${original.title} (Copy)`,
      content: original.content,
      type: original.type,
      tags: [...original.tags],
    });
  }

  /**
   * Move note to different project
   */
  public moveNote(fromProjectId: string, toProjectId: string, noteId: string): Note | null {
    const note = this.getNoteById(fromProjectId, noteId);
    if (!note) {
      return null;
    }

    // Create note in new project
    const newNote = this.createNote({
      projectId: toProjectId,
      title: note.title,
      content: note.content,
      type: note.type,
      tags: [...note.tags],
    });

    // Delete from old project
    this.deleteNote(fromProjectId, noteId);

    return newNote;
  }

  /**
   * Get note statistics for a project
   */
  public getProjectNoteStats(projectId: string): {
    totalNotes: number;
    notesByType: Record<Note['type'], number>;
    totalWords: number;
    averageWordsPerNote: number;
  } {
    const notes = storageService.getProjectNotes(projectId);
    const totalWords = notes.reduce((sum, note) => sum + note.wordCount, 0);

    const notesByType = notes.reduce((acc, note) => {
      acc[note.type] = (acc[note.type] || 0) + 1;
      return acc;
    }, {} as Record<Note['type'], number>);

    return {
      totalNotes: notes.length,
      notesByType,
      totalWords,
      averageWordsPerNote: notes.length > 0 ? Math.round(totalWords / notes.length) : 0,
    };
  }

  /**
   * Export notes as text/markdown
   */
  public exportProjectNotes(projectId: string, format: 'txt' | 'md' = 'md'): string {
    const notes = this.getProjectNotes(projectId);
    const project = projectService.getProjectById(projectId);
    
    let content = '';
    
    if (format === 'md') {
      content += `# ${project?.title || 'Untitled Project'}\n\n`;
      if (project?.description) {
        content += `${project.description}\n\n`;
      }
      
      notes.forEach(note => {
        content += `## ${note.title}\n\n`;
        if (note.tags.length > 0) {
          content += `*Tags: ${note.tags.join(', ')}*\n\n`;
        }
        content += `${note.content}\n\n---\n\n`;
      });
    } else {
      content += `${project?.title || 'Untitled Project'}\n`;
      content += '='.repeat(project?.title?.length || 16) + '\n\n';
      
      if (project?.description) {
        content += `${project.description}\n\n`;
      }
      
      notes.forEach(note => {
        content += `${note.title}\n`;
        content += '-'.repeat(note.title.length) + '\n\n';
        if (note.tags.length > 0) {
          content += `Tags: ${note.tags.join(', ')}\n\n`;
        }
        content += `${note.content}\n\n`;
      });
    }
    
    return content;
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
   * Generate a unique ID
   */
  private generateId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const noteService = NoteService.getInstance();