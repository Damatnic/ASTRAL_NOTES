/**
 * Notes Hook
 * Manages note state and operations using localStorage service
 */

import { useState, useEffect, useCallback } from 'react';
import { noteService } from '@/services/noteService';
import type { Note } from '@/types/global';

interface CreateNoteData {
  title: string;
  content: string;
  type: Note['type'];
  tags: string[];
  projectId: string;
}

interface UpdateNoteData {
  title?: string;
  content?: string;
  type?: Note['type'];
  tags?: string[];
}

export function useNotes(projectId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notes
  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let loadedNotes: Note[];
      
      if (projectId) {
        loadedNotes = noteService.getNotesByProject(projectId);
      } else {
        loadedNotes = noteService.getAllNotes();
      }
      
      setNotes(loadedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load notes on mount and when projectId changes
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Create note
  const createNote = useCallback(async (noteData: CreateNoteData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newNote = noteService.createNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update note
  const updateNote = useCallback(async (id: string, noteData: UpdateNoteData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNote = noteService.updateNote(id, noteData);
      if (updatedNote) {
        setNotes(prev => prev.map(note => 
          note.id === id ? updatedNote : note
        ));
        return updatedNote;
      } else {
        throw new Error('Note not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete note
  const deleteNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = noteService.deleteNote(id);
      if (success) {
        setNotes(prev => prev.filter(note => note.id !== id));
        return true;
      } else {
        throw new Error('Note not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Archive note
  const archiveNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = noteService.archiveNote(id);
      if (success) {
        await loadNotes(); // Reload to update the list
        return true;
      } else {
        throw new Error('Note not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadNotes]);

  // Restore note
  const restoreNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = noteService.restoreNote(id);
      if (success) {
        await loadNotes(); // Reload to update the list
        return true;
      } else {
        throw new Error('Note not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadNotes]);

  // Duplicate note
  const duplicateNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const duplicatedNote = noteService.duplicateNote(id);
      if (duplicatedNote) {
        setNotes(prev => [duplicatedNote, ...prev]);
        return duplicatedNote;
      } else {
        throw new Error('Note not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate note';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get note by ID
  const getNoteById = useCallback((id: string) => {
    return notes.find(note => note.id === id);
  }, [notes]);

  // Get notes by type
  const getNotesByType = useCallback((type: Note['type']) => {
    return notes.filter(note => note.type === type);
  }, [notes]);

  // Get notes by tag
  const getNotesByTag = useCallback((tag: string) => {
    return notes.filter(note => note.tags.includes(tag));
  }, [notes]);

  // Search notes
  const searchNotes = useCallback((query: string) => {
    if (!query.trim()) return notes;
    
    const searchTerm = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }, [notes]);

  // Get all tags
  const getAllTags = useCallback(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Note statistics
  const noteStats = {
    total: notes.length,
    byType: {
      note: notes.filter(n => n.type === 'note').length,
      chapter: notes.filter(n => n.type === 'chapter').length,
      scene: notes.filter(n => n.type === 'scene').length,
      character: notes.filter(n => n.type === 'character').length,
      plot: notes.filter(n => n.type === 'plot').length,
      setting: notes.filter(n => n.type === 'setting').length,
      outline: notes.filter(n => n.type === 'outline').length,
      research: notes.filter(n => n.type === 'research').length,
    },
    totalWords: notes.reduce((sum, note) => sum + note.wordCount, 0),
  };

  return {
    // Data
    notes,
    isLoading,
    error,
    noteStats,

    // Operations
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    restoreNote,
    duplicateNote,

    // Utilities
    refreshNotes: loadNotes,
    clearError,
    getNoteById,
    getNotesByType,
    getNotesByTag,
    searchNotes,
    getAllTags,
  };
}