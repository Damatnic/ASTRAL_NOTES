/**
 * Main types export file for ASTRAL_NOTES
 * Centralizes all type definitions for easy importing
 */

// Re-export all global types
export * from './global.d';

// Re-export specific type modules
export * from './story';
export * from './project';
export * from './api';

// Common utility types
export type ID = string;
export type Timestamp = string;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;
export type ClickHandler<T = HTMLButtonElement> = (event: React.MouseEvent<T>) => void;

// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

// Editor types
export interface EditorState {
  content: string;
  wordCount: number;
  characterCount: number;
  isModified: boolean;
  lastSaved?: string;
}

export interface EditorAction {
  type: 'BOLD' | 'ITALIC' | 'UNDERLINE' | 'STRIKETHROUGH' | 'HEADING' | 'LINK' | 'IMAGE' | 'LIST' | 'QUOTE' | 'CODE';
  payload?: any;
}

// Search types
export interface SearchResult {
  id: string;
  type: 'project' | 'note' | 'character' | 'scene';
  title: string;
  content: string;
  matches: SearchMatch[];
  relevance: number;
}

export interface SearchMatch {
  field: string;
  text: string;
  start: number;
  end: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary';
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface WritingStats {
  totalWords: number;
  totalCharacters: number;
  averageWordsPerDay: number;
  writingStreak: number;
  mostProductiveHour: number;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
}

// AI Assistant types
export interface AIRequest {
  type: 'completion' | 'suggestion' | 'analysis' | 'generation';
  prompt: string;
  context?: string;
  parameters?: Record<string, any>;
}

export interface AIResponse {
  id: string;
  type: AIRequest['type'];
  content: string;
  confidence: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

// Collaboration types
export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: string[];
  lastSeen?: string;
  isOnline: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  position?: {
    start: number;
    end: number;
  };
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
}

// Export/Import types
export interface ExportOptions {
  format: 'docx' | 'pdf' | 'txt' | 'markdown' | 'html' | 'epub';
  includeNotes: boolean;
  includeCharacters: boolean;
  includeTimeline: boolean;
  includeMetadata: boolean;
  template?: string;
}

export interface ImportResult {
  success: boolean;
  projectId?: string;
  errors?: string[];
  warnings?: string[];
  imported: {
    projects: number;
    notes: number;
    characters: number;
    scenes: number;
  };
}

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  memoryUsage: number;
  bundleSize: number;
}

// Accessibility types
export interface AccessibilityOptions {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

// Mobile/responsive types
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

// Error types
export interface AppError extends Error {
  code?: string;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
  url?: string;
  userAgent?: string;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  websocketUrl: string;
  maxFileSize: number;
  supportedFormats: string[];
  features: {
    aiAssistant: boolean;
    collaboration: boolean;
    export: boolean;
    analytics: boolean;
    offline: boolean;
  };
}