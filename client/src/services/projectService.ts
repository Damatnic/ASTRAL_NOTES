/**
 * Project Service
 * Handles CRUD operations for projects using localStorage
 */

import type { Project, Note } from '@/types/global';
import { storageService } from './storageService';

export interface CreateProjectData {
  title: string;
  description?: string;
  tags?: string[];
  genre?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  tags?: string[];
  status?: Project['status'];
  genre?: string;
}

export interface ProjectStats {
  totalWords: number;
  totalNotes: number;
  lastActivity: string;
  progressPercentage: number;
}

class ProjectService {
  private static instance: ProjectService;

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  /**
   * Get all projects
   */
  public getAllProjects(): Project[] {
    return storageService.getProjects();
  }

  /**
   * Get project by ID
   */
  public getProjectById(id: string): Project | null {
    const projects = storageService.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Create a new project
   */
  public createProject(data: CreateProjectData): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: this.generateId(),
      title: data.title.trim(),
      description: data.description?.trim() || '',
      userId: 'local-user',
      status: 'active',
      isPublic: false,
      tags: data.tags || [],
      wordCount: 0,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const projects = storageService.getProjects();
    projects.unshift(project); // Add to beginning
    storageService.saveProjects(projects);

    return project;
  }

  /**
   * Update an existing project
   */
  public updateProject(id: string, data: UpdateProjectData): Project | null {
    const projects = storageService.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }

    const updated: Project = {
      ...projects[index],
      ...data,
      updatedAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    };

    // Recalculate word count if needed
    if (data.title || data.description) {
      updated.wordCount = this.calculateProjectWordCount(id);
    }

    projects[index] = updated;
    storageService.saveProjects(projects);

    return updated;
  }

  /**
   * Delete a project (soft delete by changing status)
   */
  public deleteProject(id: string): boolean {
    const projects = storageService.getProjects();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      return false;
    }

    // Soft delete - change status to deleted
    projects[index] = {
      ...projects[index],
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    };

    storageService.saveProjects(projects);
    return true;
  }

  /**
   * Permanently delete a project and all its notes
   */
  public permanentlyDeleteProject(id: string): boolean {
    const projects = storageService.getProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false; // Project not found
    }

    // Delete project notes
    const data = storageService.getData();
    delete data.notes[id];
    
    // Save updated data
    data.projects = filteredProjects;
    return storageService.saveData(data);
  }

  /**
   * Archive a project
   */
  public archiveProject(id: string): Project | null {
    return this.updateProject(id, { status: 'archived' });
  }

  /**
   * Restore an archived or deleted project
   */
  public restoreProject(id: string): Project | null {
    return this.updateProject(id, { status: 'active' });
  }

  /**
   * Get active projects only
   */
  public getActiveProjects(): Project[] {
    return storageService.getProjects().filter(p => p.status === 'active');
  }

  /**
   * Get archived projects
   */
  public getArchivedProjects(): Project[] {
    return storageService.getProjects().filter(p => p.status === 'archived');
  }

  /**
   * Search projects by title, description, or tags
   */
  public searchProjects(query: string): Project[] {
    const projects = storageService.getProjects();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return projects;
    }

    return projects.filter(project => 
      project.title.toLowerCase().includes(lowerQuery) ||
      project.description?.toLowerCase().includes(lowerQuery) ||
      project.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get projects by status
   */
  public getProjectsByStatus(status: Project['status']): Project[] {
    return storageService.getProjects().filter(p => p.status === status);
  }

  /**
   * Get projects by tags
   */
  public getProjectsByTags(tags: string[]): Project[] {
    const projects = storageService.getProjects();
    return projects.filter(project => 
      tags.some(tag => project.tags.includes(tag))
    );
  }

  /**
   * Get project statistics
   */
  public getProjectStats(id: string): ProjectStats | null {
    const project = this.getProjectById(id);
    if (!project) {
      return null;
    }

    const notes = storageService.getProjectNotes(id);
    const totalWords = notes.reduce((sum, note) => sum + note.wordCount, 0);
    
    return {
      totalWords,
      totalNotes: notes.length,
      lastActivity: project.lastEditedAt,
      progressPercentage: this.calculateProgressPercentage(totalWords),
    };
  }

  /**
   * Get overall user statistics
   */
  public getOverallStats(): {
    totalProjects: number;
    activeProjects: number;
    totalWords: number;
    totalNotes: number;
  } {
    const projects = storageService.getProjects();
    const allNotes = storageService.getAllNotes();
    
    return {
      totalProjects: projects.filter(p => p.status !== 'deleted').length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalWords: allNotes.reduce((sum, note) => sum + note.wordCount, 0),
      totalNotes: allNotes.length,
    };
  }

  /**
   * Get recent projects (last edited)
   */
  public getRecentProjects(limit: number = 5): Project[] {
    const projects = storageService.getProjects()
      .filter(p => p.status === 'active')
      .sort((a, b) => new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime());
    
    return projects.slice(0, limit);
  }

  /**
   * Update project word count
   */
  public updateProjectWordCount(id: string): number {
    const wordCount = this.calculateProjectWordCount(id);
    this.updateProject(id, { wordCount });
    return wordCount;
  }

  /**
   * Calculate total word count for a project
   */
  private calculateProjectWordCount(id: string): number {
    const notes = storageService.getProjectNotes(id);
    return notes.reduce((sum, note) => sum + note.wordCount, 0);
  }

  /**
   * Calculate progress percentage based on word count
   */
  private calculateProgressPercentage(wordCount: number): number {
    // Simple progress calculation - can be customized
    const targetWords = 50000; // Default novel target
    return Math.min(Math.round((wordCount / targetWords) * 100), 100);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Duplicate a project
   */
  public duplicateProject(id: string): Project | null {
    const original = this.getProjectById(id);
    if (!original) {
      return null;
    }

    const duplicated = this.createProject({
      title: `${original.title} (Copy)`,
      description: original.description,
      tags: [...original.tags],
    });

    // Copy notes
    const originalNotes = storageService.getProjectNotes(id);
    const duplicatedNotes = originalNotes.map(note => ({
      ...note,
      id: this.generateId(),
      projectId: duplicated.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    storageService.saveProjectNotes(duplicated.id, duplicatedNotes);
    this.updateProjectWordCount(duplicated.id);

    return duplicated;
  }
}

export const projectService = ProjectService.getInstance();