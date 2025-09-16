/**
 * API-related type definitions
 */

import type { User, Project, Note, ApiResponse, PaginationParams, SearchParams } from './global';

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Project API types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  status?: Project['status'];
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Note API types
export interface CreateNoteRequest {
  projectId: string;
  title: string;
  content?: string;
  type?: Note['type'];
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  type?: Note['type'];
  tags?: string[];
  position?: number;
}

export interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search API types
export interface SearchRequest extends SearchParams {
  projectId?: string;
  type?: Note['type'];
}

export interface SearchResponse {
  results: (Project | Note)[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  highlights?: Record<string, string[]>;
}

// Generic API response wrappers
export type AuthApiResponse<T> = ApiResponse<T>;
export type ProjectApiResponse<T> = ApiResponse<T>;
export type NoteApiResponse<T> = ApiResponse<T>;
export type SearchApiResponse<T> = ApiResponse<T>;

// Error response types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: 'validation_error';
  validationErrors: ValidationError[];
}