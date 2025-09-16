/**
 * Application constants
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3001';

// Storage Keys
export const STORAGE_KEYS = {
  PROJECTS_DATA: 'astral_notes_data',
  PREFERENCES: 'astral_preferences',
  THEME: 'astral_theme',
  SIDEBAR_COLLAPSED: 'astral_sidebar_collapsed',
  AUTO_SAVE: 'astral_auto_save',
  BACKUP_DATA: 'astral_notes_backup',
} as const;

// Application Settings
export const APP_CONFIG = {
  NAME: 'Astral Notes',
  VERSION: '2.0.0',
  DESCRIPTION: 'Advanced writing and project management platform',
  AUTO_SAVE_INTERVAL: 5000, // 5 seconds
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['.txt', '.md', '.docx', '.pdf'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// UI Constants
export const UI = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  SEARCH_MIN_LENGTH: 2,
} as const;

// Note Types
export const NOTE_TYPES = [
  { value: 'note', label: 'Note', icon: 'FileText' },
  { value: 'chapter', label: 'Chapter', icon: 'BookOpen' },
  { value: 'scene', label: 'Scene', icon: 'Film' },
  { value: 'character', label: 'Character', icon: 'User' },
  { value: 'plot', label: 'Plot', icon: 'Map' },
  { value: 'setting', label: 'Setting', icon: 'MapPin' },
  { value: 'outline', label: 'Outline', icon: 'List' },
  { value: 'research', label: 'Research', icon: 'Search' },
] as const;

// Project Status Options
export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: 'blue' },
  { value: 'writing', label: 'Writing', color: 'green' },
  { value: 'editing', label: 'Editing', color: 'yellow' },
  { value: 'complete', label: 'Complete', color: 'purple' },
  { value: 'archived', label: 'Archived', color: 'gray' },
  { value: 'deleted', label: 'Deleted', color: 'red' },
] as const;

// Writing Genres
export const WRITING_GENRES = [
  'Fiction',
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Thriller',
  'Horror',
  'Historical Fiction',
  'Contemporary',
  'Young Adult',
  'Non-Fiction',
  'Biography',
  'Memoir',
  'Self-Help',
  'Poetry',
  'Screenplay',
  'Short Stories',
  'Other',
] as const;

// Theme Options
export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  SEARCH: 'mod+k',
  NEW_PROJECT: 'mod+n',
  NEW_NOTE: 'mod+shift+n',
  SAVE: 'mod+s',
  TOGGLE_SIDEBAR: 'mod+b',
  TOGGLE_THEME: 'mod+shift+t',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  NOTE_CREATED: 'Note created successfully',
  NOTE_UPDATED: 'Note updated successfully',
  NOTE_DELETED: 'Note deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
} as const;