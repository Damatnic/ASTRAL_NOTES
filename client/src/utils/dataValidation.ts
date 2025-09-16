/**
 * Data Validation Utilities
 * Validates data structures and provides error handling
 */

import type { Project, Note, UserPreferences } from '@/types/global';
import { WRITING_GENRES, PROJECT_STATUS_OPTIONS, NOTE_TYPES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DataValidator {
  /**
   * Validate project data
   */
  static validateProject(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Project title is required');
    } else if (data.title.length > 200) {
      errors.push('Project title must be less than 200 characters');
    }

    // Optional but validated fields
    if (data.description && data.description.length > 1000) {
      warnings.push('Project description is quite long (over 1000 characters)');
    }

    if (data.status && !PROJECT_STATUS_OPTIONS.find(s => s.value === data.status)) {
      errors.push('Invalid project status');
    }

    if (data.genre && !WRITING_GENRES.includes(data.genre)) {
      warnings.push('Unknown genre specified');
    }

    if (data.tags && !Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else if (data.tags && data.tags.length > 20) {
      warnings.push('Too many tags (consider limiting to 20 or fewer)');
    }

    if (data.wordCount && (typeof data.wordCount !== 'number' || data.wordCount < 0)) {
      errors.push('Word count must be a non-negative number');
    }

    if (data.targetWordCount && (typeof data.targetWordCount !== 'number' || data.targetWordCount <= 0)) {
      errors.push('Target word count must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate note data
   */
  static validateNote(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Note title is required');
    } else if (data.title.length > 200) {
      errors.push('Note title must be less than 200 characters');
    }

    if (!data.projectId || typeof data.projectId !== 'string') {
      errors.push('Project ID is required');
    }

    // Content validation
    if (data.content && data.content.length > 100000) {
      warnings.push('Note content is very large (over 100,000 characters)');
    }

    // Type validation
    if (data.type && !NOTE_TYPES.find(t => t.value === data.type)) {
      errors.push('Invalid note type');
    }

    // Tags validation
    if (data.tags && !Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else if (data.tags && data.tags.length > 10) {
      warnings.push('Too many tags for a note (consider limiting to 10 or fewer)');
    }

    // Position validation
    if (data.position && (typeof data.position !== 'number' || data.position < 0)) {
      errors.push('Position must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate user preferences
   */
  static validatePreferences(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Theme validation
    if (data.theme && !['light', 'dark', 'system'].includes(data.theme)) {
      errors.push('Invalid theme value');
    }

    // Boolean validations
    if (data.sidebarCollapsed !== undefined && typeof data.sidebarCollapsed !== 'boolean') {
      errors.push('sidebarCollapsed must be a boolean');
    }

    if (data.autoSave !== undefined && typeof data.autoSave !== 'boolean') {
      errors.push('autoSave must be a boolean');
    }

    if (data.notifications !== undefined && typeof data.notifications !== 'boolean') {
      errors.push('notifications must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize and clean project data
   */
  static sanitizeProject(data: any): Partial<Project> {
    return {
      title: typeof data.title === 'string' ? data.title.trim().slice(0, 200) : '',
      description: typeof data.description === 'string' ? data.description.trim().slice(0, 1000) : '',
      status: PROJECT_STATUS_OPTIONS.find(s => s.value === data.status)?.value || 'planning',
      genre: WRITING_GENRES.includes(data.genre) ? data.genre : undefined,
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 20).filter((tag: any) => typeof tag === 'string') : [],
      wordCount: typeof data.wordCount === 'number' && data.wordCount >= 0 ? data.wordCount : 0,
      targetWordCount: typeof data.targetWordCount === 'number' && data.targetWordCount > 0 ? data.targetWordCount : undefined,
    };
  }

  /**
   * Sanitize and clean note data
   */
  static sanitizeNote(data: any): Partial<Note> {
    return {
      title: typeof data.title === 'string' ? data.title.trim().slice(0, 200) : '',
      content: typeof data.content === 'string' ? data.content.slice(0, 100000) : '',
      type: NOTE_TYPES.find(t => t.value === data.type)?.value || 'note',
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 10).filter((tag: any) => typeof tag === 'string') : [],
      position: typeof data.position === 'number' && data.position >= 0 ? data.position : 0,
    };
  }

  /**
   * Validate storage quota
   */
  static checkStorageQuota(): { available: boolean; usage: number; total: number } {
    try {
      // Test localStorage availability and quota
      const testKey = '__storage_test__';
      const testValue = 'x'.repeat(1024); // 1KB test

      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);

      // Estimate current usage
      let usage = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usage += localStorage[key].length + key.length;
        }
      }

      const total = 5 * 1024 * 1024; // 5MB typical limit
      
      return {
        available: usage < total * 0.9, // Consider 90% as warning threshold
        usage,
        total,
      };
    } catch (error) {
      return {
        available: false,
        usage: 0,
        total: 0,
      };
    }
  }

  /**
   * Validate export data structure
   */
  static validateExportData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required structure
    if (!data.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.exportedAt) {
        errors.push('Missing export timestamp');
      }
      if (!data.metadata.version) {
        warnings.push('Missing version information');
      }
    }

    if (!data.projects || !Array.isArray(data.projects)) {
      errors.push('Missing or invalid projects data');
    } else {
      // Validate each project
      data.projects.forEach((project: any, index: number) => {
        const projectValidation = this.validateProject(project);
        if (!projectValidation.isValid) {
          errors.push(`Project ${index + 1}: ${projectValidation.errors.join(', ')}`);
        }
      });
    }

    if (!data.notes || typeof data.notes !== 'object') {
      errors.push('Missing or invalid notes data');
    } else {
      // Validate notes structure
      Object.entries(data.notes).forEach(([projectId, notes]: [string, any]) => {
        if (!Array.isArray(notes)) {
          errors.push(`Notes for project ${projectId} must be an array`);
        } else {
          notes.forEach((note: any, index: number) => {
            const noteValidation = this.validateNote(note);
            if (!noteValidation.isValid) {
              errors.push(`Note ${index + 1} in project ${projectId}: ${noteValidation.errors.join(', ')}`);
            }
          });
        }
      });
    }

    if (data.preferences) {
      const prefsValidation = this.validatePreferences(data.preferences);
      if (!prefsValidation.isValid) {
        errors.push(`Preferences: ${prefsValidation.errors.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clean and validate text input
   */
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Validate file for import
   */
  static validateImportFile(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File type validation
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      errors.push('File must be a JSON file');
    }

    // File size validation (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File is too large (maximum 50MB)');
    }

    // File size warning (over 10MB)
    const warningSize = 10 * 1024 * 1024;
    if (file.size > warningSize && file.size <= maxSize) {
      warnings.push('Large file detected - import may take some time');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Error handler for localStorage operations
 */
export class StorageErrorHandler {
  static handle(error: Error, operation: string): string {
    console.error(`Storage error during ${operation}:`, error);

    if (error.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Please free up space or export your data.';
    }

    if (error.name === 'SecurityError') {
      return 'Storage access denied. Please check your browser settings.';
    }

    if (error.message.includes('localStorage')) {
      return 'Local storage is not available. Please enable storage in your browser.';
    }

    return `An error occurred during ${operation}. Please try again.`;
  }
}

/**
 * Utility functions for common validations
 */
export const ValidationUtils = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidDate: (date: string): boolean => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  },

  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
  },

  generateSafeId: (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};