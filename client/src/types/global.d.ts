/**
 * Global type definitions for Astral Notes
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  autoSave: boolean;
  notifications: boolean;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  userId: string;
  status: 'planning' | 'writing' | 'editing' | 'complete' | 'archived' | 'deleted';
  isPublic: boolean;
  tags: string[];
  genre?: string;
  wordCount: number;
  targetWordCount?: number;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: 'note' | 'character' | 'plot' | 'setting' | 'research' | 'chapter' | 'scene' | 'outline';
  tags: string[];
  wordCount: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  traits: string[];
  backstory?: string;
  relationships?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  date?: string;
  chapter?: string;
  importance: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, unknown>;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Socket event types
export interface SocketEvents {
  'project:updated': Project;
  'note:updated': Note;
  'user:status': { userId: string; online: boolean };
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};