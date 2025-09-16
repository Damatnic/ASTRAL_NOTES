/**
 * Project-related type definitions
 */

import type { Project, Note } from './global';

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectContextValue extends ProjectState {
  fetchProjects: (page?: number, limit?: number) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  status?: Project['status'];
}

export interface ProjectWithNotes extends Project {
  notes: Note[];
  notesCount: number;
}

export interface ProjectStats {
  totalWords: number;
  totalNotes: number;
  lastActivity: string;
  progressPercentage: number;
}

export interface ProjectFilters {
  status?: Project['status'];
  isPublic?: boolean;
  tags?: string[];
  search?: string;
}

export interface ProjectSortOptions {
  field: 'title' | 'createdAt' | 'updatedAt' | 'wordCount';
  direction: 'asc' | 'desc';
}