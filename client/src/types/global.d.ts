/**
 * Global type definitions for Astral Notes
 * Re-exports comprehensive story types and adds core application types
 */

// Re-export all story management types
export * from './story';
import type { 
  Project as StoryProject, 
  Note as StoryNote, 
  Character as StoryCharacter,
  TimelineEvent as StoryTimelineEvent 
} from './story';

// Core user and application types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription?: UserSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  autoSave: boolean;
  notifications: boolean;
  defaultView: 'cards' | 'list' | 'timeline';
  editorMode: 'rich' | 'markdown' | 'distraction-free';
  wordCountDisplay: boolean;
  realTimeCollaboration: boolean;
  aiAssistance: boolean;
  keyboardShortcuts: boolean;
  language: string;
  timezone: string;
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  expiresAt?: string;
  features: string[];
  limits: {
    projects: number;
    collaborators: number;
    storage: number; // in MB
    aiRequests: number; // per month
  };
}

// Legacy type aliases for backward compatibility
export type Project = StoryProject;
export type Note = StoryNote;
export type Character = StoryCharacter;
export type TimelineEvent = StoryTimelineEvent;

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