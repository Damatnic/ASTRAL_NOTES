/**
 * Project Attachment Service
 * Comprehensive system for managing note-project relationships with advanced features
 */

import type { Project, Note } from '@/types/global';
import type { QuickNote } from './quickNotesService';
import { quickNotesService } from './quickNotesService';
import { projectService } from './projectService';
import { storageService } from './storageService';

// Attachment relationship interface
export interface AttachmentRelationship {
  id: string;
  noteId: string;
  projectId: string;
  attachedAt: string;
  attachedBy?: string;
  attachmentType: 'manual' | 'auto' | 'suggested' | 'migrated';
  confidence?: number; // For AI-suggested attachments
  tags: string[];
  metadata?: Record<string, any>;
}

// Smart suggestion interface
export interface AttachmentSuggestion {
  noteId: string;
  projectId: string;
  confidence: number;
  reasons: string[];
  suggestedTags?: string[];
  autoAttach?: boolean;
}

// Attachment rule interface
export interface AttachmentRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: AttachmentCondition[];
  actions: AttachmentAction[];
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentCondition {
  type: 'tag' | 'keyword' | 'content' | 'title' | 'dateRange';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'between';
  value: string | string[] | { start: string; end: string };
  caseSensitive?: boolean;
}

export interface AttachmentAction {
  type: 'attach' | 'suggest' | 'tag' | 'notify';
  projectId?: string;
  tags?: string[];
  confidence?: number;
}

// Bulk operation interfaces
export interface BulkAttachmentOperation {
  id: string;
  type: 'attach' | 'detach' | 'migrate' | 'organize';
  noteIds: string[];
  projectId?: string;
  targetProjectId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  errors: string[];
  results: {
    successful: number;
    failed: number;
    skipped: number;
  };
}

// Migration wizard configuration
export interface MigrationConfig {
  source: 'unattached' | 'project' | 'all';
  strategy: 'smart' | 'manual' | 'rules';
  confidenceThreshold: number;
  autoApply: boolean;
  preserveOriginal: boolean;
  targetProjects: string[];
  excludeProjects: string[];
  tagMappings: Record<string, string[]>;
}

// Analytics and insights
export interface AttachmentAnalytics {
  totalAttachments: number;
  unattachedNotes: number;
  projectDistribution: Record<string, number>;
  attachmentsByType: Record<string, number>;
  averageConfidence: number;
  recentActivity: AttachmentActivity[];
  suggestions: {
    pending: number;
    accepted: number;
    rejected: number;
  };
}

export interface AttachmentActivity {
  id: string;
  type: 'attached' | 'detached' | 'suggested' | 'migrated';
  noteId: string;
  projectId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class ProjectAttachmentService {
  private static instance: ProjectAttachmentService;
  private readonly STORAGE_KEY = 'astral_attachment_relationships';
  private readonly RULES_STORAGE_KEY = 'astral_attachment_rules';
  private readonly ANALYTICS_STORAGE_KEY = 'astral_attachment_analytics';
  private readonly SUGGESTIONS_STORAGE_KEY = 'astral_attachment_suggestions';

  public static getInstance(): ProjectAttachmentService {
    if (!ProjectAttachmentService.instance) {
      ProjectAttachmentService.instance = new ProjectAttachmentService();
    }
    return ProjectAttachmentService.instance;
  }

  // ==================== CORE ATTACHMENT OPERATIONS ====================

  /**
   * Attach a quick note to a project with comprehensive tracking
   */
  public attachNoteToProject(
    noteId: string, 
    projectId: string, 
    type: AttachmentRelationship['attachmentType'] = 'manual',
    metadata?: Record<string, any>
  ): AttachmentRelationship | null {
    const note = quickNotesService.getQuickNoteById(noteId);
    const project = projectService.getProjectById(projectId);
    
    if (!note || !project) {
      return null;
    }

    // Create relationship record
    const relationship: AttachmentRelationship = {
      id: this.generateId(),
      noteId,
      projectId,
      attachedAt: new Date().toISOString(),
      attachmentType: type,
      tags: [...note.tags],
      metadata: metadata || {}
    };

    // Update the quick note
    quickNotesService.attachToProject(noteId, projectId);

    // Save relationship
    this.saveAttachmentRelationship(relationship);

    // Record activity
    this.recordActivity({
      id: this.generateId(),
      type: 'attached',
      noteId,
      projectId,
      timestamp: new Date().toISOString(),
      metadata: { attachmentType: type }
    });

    // Update analytics
    this.updateAnalytics();

    return relationship;
  }

  /**
   * Detach a note from a project
   */
  public detachNoteFromProject(noteId: string): boolean {
    const relationship = this.getAttachmentByNoteId(noteId);
    if (!relationship) {
      return false;
    }

    // Update the quick note
    const success = quickNotesService.detachFromProject(noteId);
    if (!success) {
      return false;
    }

    // Remove relationship
    this.removeAttachmentRelationship(relationship.id);

    // Record activity
    this.recordActivity({
      id: this.generateId(),
      type: 'detached',
      noteId,
      projectId: relationship.projectId,
      timestamp: new Date().toISOString()
    });

    // Update analytics
    this.updateAnalytics();

    return true;
  }

  /**
   * Move note from one project to another
   */
  public moveNoteBetweenProjects(noteId: string, fromProjectId: string, toProjectId: string): boolean {
    const note = quickNotesService.getQuickNoteById(noteId);
    const fromProject = projectService.getProjectById(fromProjectId);
    const toProject = projectService.getProjectById(toProjectId);

    if (!note || !fromProject || !toProject) {
      return false;
    }

    // Detach from current project
    this.detachNoteFromProject(noteId);

    // Attach to new project
    const relationship = this.attachNoteToProject(noteId, toProjectId, 'migrated', {
      previousProjectId: fromProjectId,
      migrationDate: new Date().toISOString()
    });

    return !!relationship;
  }

  // ==================== SMART SUGGESTIONS ====================

  /**
   * Generate smart attachment suggestions for unattached notes
   */
  public generateAttachmentSuggestions(noteId?: string): AttachmentSuggestion[] {
    const notes = noteId 
      ? [quickNotesService.getQuickNoteById(noteId)].filter(Boolean) as QuickNote[]
      : quickNotesService.getAllQuickNotes().filter(note => !note.projectId);
    
    const projects = projectService.getAllProjects().filter(p => p.status !== 'deleted');
    const suggestions: AttachmentSuggestion[] = [];

    for (const note of notes) {
      for (const project of projects) {
        const suggestion = this.analyzePotentialAttachment(note, project);
        if (suggestion.confidence >= 0.3) { // Minimum confidence threshold
          suggestions.push(suggestion);
        }
      }
    }

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, noteId ? 5 : 50); // Show more suggestions when analyzing all notes
  }

  /**
   * Analyze potential attachment between a note and project
   */
  private analyzePotentialAttachment(note: QuickNote, project: Project): AttachmentSuggestion {
    const reasons: string[] = [];
    let confidence = 0;

    // Tag matching
    const commonTags = note.tags.filter(tag => project.tags.includes(tag));
    if (commonTags.length > 0) {
      confidence += commonTags.length * 0.2;
      reasons.push(`Shares ${commonTags.length} tag(s): ${commonTags.join(', ')}`);
    }

    // Keyword analysis
    const projectKeywords = this.extractKeywords(project.title + ' ' + project.description);
    const noteKeywords = this.extractKeywords(note.title + ' ' + note.content);
    const commonKeywords = projectKeywords.filter(kw => noteKeywords.includes(kw));
    
    if (commonKeywords.length > 0) {
      confidence += commonKeywords.length * 0.15;
      reasons.push(`Contains relevant keywords: ${commonKeywords.slice(0, 3).join(', ')}`);
    }

    // Genre matching
    if (project.genre) {
      const genreWords = project.genre.toLowerCase().split(' ');
      const noteText = (note.title + ' ' + note.content).toLowerCase();
      const genreMatches = genreWords.filter(word => noteText.includes(word));
      
      if (genreMatches.length > 0) {
        confidence += 0.1;
        reasons.push(`Matches project genre: ${project.genre}`);
      }
    }

    // Title similarity
    const titleSimilarity = this.calculateStringSimilarity(note.title, project.title);
    if (titleSimilarity > 0.3) {
      confidence += titleSimilarity * 0.2;
      reasons.push(`Similar title to project`);
    }

    // Content relevance (simple keyword density)
    const projectContent = project.description || '';
    if (projectContent) {
      const contentSimilarity = this.calculateContentSimilarity(note.content, projectContent);
      if (contentSimilarity > 0.2) {
        confidence += contentSimilarity * 0.1;
        reasons.push(`Content appears relevant to project`);
      }
    }

    // Recent activity correlation
    const projectNotes = storageService.getProjectNotes(project.id);
    if (projectNotes.length > 0) {
      const recentProjectActivity = new Date(project.lastEditedAt);
      const noteCreated = new Date(note.createdAt);
      const timeDiff = Math.abs(recentProjectActivity.getTime() - noteCreated.getTime());
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) { // Created within a week of project activity
        confidence += 0.1;
        reasons.push('Created around the same time as recent project activity');
      }
    }

    // Normalize confidence to 0-1 range
    confidence = Math.min(confidence, 1);

    return {
      noteId: note.id,
      projectId: project.id,
      confidence,
      reasons,
      autoAttach: confidence >= 0.8 // Auto-attach only for very high confidence
    };
  }

  /**
   * Apply a suggestion (accept or reject)
   */
  public applySuggestion(suggestion: AttachmentSuggestion, accept: boolean): boolean {
    if (accept) {
      const relationship = this.attachNoteToProject(
        suggestion.noteId, 
        suggestion.projectId, 
        'suggested',
        { confidence: suggestion.confidence, reasons: suggestion.reasons }
      );
      return !!relationship;
    } else {
      // Record rejection for learning
      this.recordSuggestionFeedback(suggestion, false);
      return true;
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Perform bulk attachment operations
   */
  public async performBulkOperation(operation: Omit<BulkAttachmentOperation, 'id' | 'status' | 'progress' | 'startedAt' | 'results' | 'errors'>): Promise<BulkAttachmentOperation> {
    const bulkOp: BulkAttachmentOperation = {
      ...operation,
      id: this.generateId(),
      status: 'processing',
      progress: 0,
      startedAt: new Date().toISOString(),
      results: { successful: 0, failed: 0, skipped: 0 },
      errors: []
    };

    try {
      const totalNotes = operation.noteIds.length;
      
      for (let i = 0; i < operation.noteIds.length; i++) {
        const noteId = operation.noteIds[i];
        
        try {
          switch (operation.type) {
            case 'attach':
              if (operation.projectId) {
                const result = this.attachNoteToProject(noteId, operation.projectId, 'manual');
                if (result) {
                  bulkOp.results.successful++;
                } else {
                  bulkOp.results.failed++;
                  bulkOp.errors.push(`Failed to attach note ${noteId}`);
                }
              }
              break;
              
            case 'detach':
              const success = this.detachNoteFromProject(noteId);
              if (success) {
                bulkOp.results.successful++;
              } else {
                bulkOp.results.failed++;
                bulkOp.errors.push(`Failed to detach note ${noteId}`);
              }
              break;
              
            case 'migrate':
              if (operation.projectId && operation.targetProjectId) {
                const success = this.moveNoteBetweenProjects(noteId, operation.projectId, operation.targetProjectId);
                if (success) {
                  bulkOp.results.successful++;
                } else {
                  bulkOp.results.failed++;
                  bulkOp.errors.push(`Failed to migrate note ${noteId}`);
                }
              }
              break;
              
            case 'organize':
              // Apply smart suggestions
              const suggestions = this.generateAttachmentSuggestions(noteId);
              const bestSuggestion = suggestions[0];
              
              if (bestSuggestion && bestSuggestion.confidence >= 0.6) {
                const result = this.attachNoteToProject(noteId, bestSuggestion.projectId, 'auto');
                if (result) {
                  bulkOp.results.successful++;
                } else {
                  bulkOp.results.skipped++;
                }
              } else {
                bulkOp.results.skipped++;
              }
              break;
          }
        } catch (error) {
          bulkOp.results.failed++;
          bulkOp.errors.push(`Error processing note ${noteId}: ${error}`);
        }
        
        // Update progress
        bulkOp.progress = Math.round(((i + 1) / totalNotes) * 100);
      }
      
      bulkOp.status = 'completed';
      bulkOp.completedAt = new Date().toISOString();
      
    } catch (error) {
      bulkOp.status = 'failed';
      bulkOp.errors.push(`Bulk operation failed: ${error}`);
    }

    return bulkOp;
  }

  // ==================== ATTACHMENT RULES ====================

  /**
   * Create a new attachment rule
   */
  public createAttachmentRule(rule: Omit<AttachmentRule, 'id' | 'createdAt' | 'updatedAt'>): AttachmentRule {
    const newRule: AttachmentRule = {
      ...rule,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const rules = this.getAttachmentRules();
    rules.push(newRule);
    this.saveAttachmentRules(rules);

    return newRule;
  }

  /**
   * Apply attachment rules to notes
   */
  public applyAttachmentRules(noteIds?: string[]): number {
    const rules = this.getAttachmentRules().filter(rule => rule.enabled);
    const notes = noteIds 
      ? noteIds.map(id => quickNotesService.getQuickNoteById(id)).filter(Boolean) as QuickNote[]
      : quickNotesService.getAllQuickNotes();

    let appliedCount = 0;

    for (const note of notes) {
      for (const rule of rules) {
        if (this.evaluateRuleConditions(note, rule.conditions)) {
          this.executeRuleActions(note, rule.actions);
          appliedCount++;
          break; // Apply only the first matching rule per note
        }
      }
    }

    return appliedCount;
  }

  /**
   * Evaluate rule conditions against a note
   */
  private evaluateRuleConditions(note: QuickNote, conditions: AttachmentCondition[]): boolean {
    return conditions.every(condition => {
      const noteText = (note.title + ' ' + note.content).toLowerCase();
      const value = Array.isArray(condition.value) ? condition.value : [condition.value];

      switch (condition.type) {
        case 'tag':
          return value.some(v => note.tags.includes(v as string));
          
        case 'keyword':
        case 'content':
          return value.some(v => {
            const searchText = condition.caseSensitive ? noteText : (v as string).toLowerCase();
            switch (condition.operator) {
              case 'contains': return noteText.includes(searchText);
              case 'equals': return noteText === searchText;
              case 'startsWith': return noteText.startsWith(searchText);
              case 'endsWith': return noteText.endsWith(searchText);
              case 'regex': return new RegExp(v as string, condition.caseSensitive ? '' : 'i').test(noteText);
              default: return false;
            }
          });
          
        case 'title':
          return value.some(v => {
            const titleText = condition.caseSensitive ? note.title : note.title.toLowerCase();
            const searchText = condition.caseSensitive ? v as string : (v as string).toLowerCase();
            switch (condition.operator) {
              case 'contains': return titleText.includes(searchText);
              case 'equals': return titleText === searchText;
              case 'startsWith': return titleText.startsWith(searchText);
              case 'endsWith': return titleText.endsWith(searchText);
              case 'regex': return new RegExp(v as string, condition.caseSensitive ? '' : 'i').test(titleText);
              default: return false;
            }
          });
          
        case 'dateRange':
          if (typeof condition.value === 'object' && 'start' in condition.value && 'end' in condition.value) {
            const noteDate = new Date(note.createdAt);
            const startDate = new Date(condition.value.start);
            const endDate = new Date(condition.value.end);
            return noteDate >= startDate && noteDate <= endDate;
          }
          return false;
          
        default:
          return false;
      }
    });
  }

  /**
   * Execute rule actions on a note
   */
  private executeRuleActions(note: QuickNote, actions: AttachmentAction[]): void {
    for (const action of actions) {
      switch (action.type) {
        case 'attach':
          if (action.projectId && !note.projectId) {
            this.attachNoteToProject(note.id, action.projectId, 'auto');
          }
          break;
          
        case 'suggest':
          if (action.projectId) {
            // Create suggestion record
            this.recordSuggestionFeedback({
              noteId: note.id,
              projectId: action.projectId,
              confidence: action.confidence || 0.5,
              reasons: ['Matches attachment rule']
            }, null);
          }
          break;
          
        case 'tag':
          if (action.tags && action.tags.length > 0) {
            const updatedTags = [...new Set([...note.tags, ...action.tags])];
            quickNotesService.updateQuickNote(note.id, { tags: updatedTags });
          }
          break;
      }
    }
  }

  // ==================== MIGRATION WIZARD ====================

  /**
   * Run migration wizard with configuration
   */
  public async runMigrationWizard(config: MigrationConfig): Promise<BulkAttachmentOperation> {
    let noteIds: string[] = [];

    // Determine source notes
    switch (config.source) {
      case 'unattached':
        noteIds = quickNotesService.getAllQuickNotes()
          .filter(note => !note.projectId)
          .map(note => note.id);
        break;
        
      case 'project':
        // Get notes from specific projects (would need project filter in config)
        noteIds = quickNotesService.getAllQuickNotes()
          .filter(note => note.projectId && config.targetProjects.includes(note.projectId))
          .map(note => note.id);
        break;
        
      case 'all':
        noteIds = quickNotesService.getAllQuickNotes().map(note => note.id);
        break;
    }

    // Apply strategy
    if (config.strategy === 'smart') {
      return this.performBulkOperation({
        type: 'organize',
        noteIds
      });
    } else if (config.strategy === 'rules') {
      // Apply rules first
      this.applyAttachmentRules(noteIds);
      
      // Then organize remaining unattached notes
      const remainingUnattached = noteIds.filter(id => {
        const note = quickNotesService.getQuickNoteById(id);
        return note && !note.projectId;
      });
      
      return this.performBulkOperation({
        type: 'organize',
        noteIds: remainingUnattached
      });
    }

    // Manual strategy - just return empty operation
    return {
      id: this.generateId(),
      type: 'organize',
      noteIds: [],
      status: 'completed',
      progress: 100,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      results: { successful: 0, failed: 0, skipped: 0 },
      errors: []
    };
  }

  // ==================== ANALYTICS AND INSIGHTS ====================

  /**
   * Get comprehensive attachment analytics
   */
  public getAttachmentAnalytics(): AttachmentAnalytics {
    const relationships = this.getAttachmentRelationships();
    const allNotes = quickNotesService.getAllQuickNotes();
    const unattachedNotes = allNotes.filter(note => !note.projectId);
    
    const projectDistribution = relationships.reduce((acc, rel) => {
      acc[rel.projectId] = (acc[rel.projectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const attachmentsByType = relationships.reduce((acc, rel) => {
      acc[rel.attachmentType] = (acc[rel.attachmentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageConfidence = relationships
      .filter(rel => rel.confidence !== undefined)
      .reduce((sum, rel) => sum + (rel.confidence || 0), 0) / 
      relationships.filter(rel => rel.confidence !== undefined).length || 0;

    const recentActivity = this.getRecentActivity(50);
    const suggestions = this.getSuggestionStats();

    return {
      totalAttachments: relationships.length,
      unattachedNotes: unattachedNotes.length,
      projectDistribution,
      attachmentsByType,
      averageConfidence,
      recentActivity,
      suggestions
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLen = Math.max(str1.length, str2.length);
    return maxLen === 0 ? 1 : (maxLen - matrix[str2.length][str1.length]) / maxLen;
  }

  /**
   * Calculate content similarity based on common words
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = this.extractKeywords(content1);
    const words2 = this.extractKeywords(content2);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // ==================== STORAGE METHODS ====================

  private getAttachmentRelationships(): AttachmentRelationship[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading attachment relationships:', error);
      return [];
    }
  }

  private saveAttachmentRelationships(relationships: AttachmentRelationship[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(relationships));
    } catch (error) {
      console.error('Error saving attachment relationships:', error);
    }
  }

  private saveAttachmentRelationship(relationship: AttachmentRelationship): void {
    const relationships = this.getAttachmentRelationships();
    relationships.push(relationship);
    this.saveAttachmentRelationships(relationships);
  }

  private removeAttachmentRelationship(relationshipId: string): void {
    const relationships = this.getAttachmentRelationships();
    const filtered = relationships.filter(rel => rel.id !== relationshipId);
    this.saveAttachmentRelationships(filtered);
  }

  private getAttachmentByNoteId(noteId: string): AttachmentRelationship | null {
    const relationships = this.getAttachmentRelationships();
    return relationships.find(rel => rel.noteId === noteId) || null;
  }

  private getAttachmentRules(): AttachmentRule[] {
    try {
      const stored = localStorage.getItem(this.RULES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading attachment rules:', error);
      return [];
    }
  }

  private saveAttachmentRules(rules: AttachmentRule[]): void {
    try {
      localStorage.setItem(this.RULES_STORAGE_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('Error saving attachment rules:', error);
    }
  }

  private recordActivity(activity: AttachmentActivity): void {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_STORAGE_KEY);
      const analytics = stored ? JSON.parse(stored) : { activities: [] };
      
      analytics.activities = analytics.activities || [];
      analytics.activities.unshift(activity);
      
      // Keep only last 1000 activities
      if (analytics.activities.length > 1000) {
        analytics.activities = analytics.activities.slice(0, 1000);
      }
      
      localStorage.setItem(this.ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }

  private getRecentActivity(limit: number = 50): AttachmentActivity[] {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_STORAGE_KEY);
      const analytics = stored ? JSON.parse(stored) : { activities: [] };
      return (analytics.activities || []).slice(0, limit);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      return [];
    }
  }

  private recordSuggestionFeedback(suggestion: AttachmentSuggestion, accepted: boolean | null): void {
    try {
      const stored = localStorage.getItem(this.SUGGESTIONS_STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { pending: [], accepted: [], rejected: [] };
      
      if (accepted === true) {
        data.accepted.push({ ...suggestion, timestamp: new Date().toISOString() });
      } else if (accepted === false) {
        data.rejected.push({ ...suggestion, timestamp: new Date().toISOString() });
      } else {
        data.pending.push({ ...suggestion, timestamp: new Date().toISOString() });
      }
      
      localStorage.setItem(this.SUGGESTIONS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error recording suggestion feedback:', error);
    }
  }

  private getSuggestionStats(): { pending: number; accepted: number; rejected: number } {
    try {
      const stored = localStorage.getItem(this.SUGGESTIONS_STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : { pending: [], accepted: [], rejected: [] };
      
      return {
        pending: data.pending?.length || 0,
        accepted: data.accepted?.length || 0,
        rejected: data.rejected?.length || 0
      };
    } catch (error) {
      console.error('Error loading suggestion stats:', error);
      return { pending: 0, accepted: 0, rejected: 0 };
    }
  }

  private updateAnalytics(): void {
    // Update analytics counters - this could be expanded with more sophisticated tracking
    const analytics = this.getAttachmentAnalytics();
    // Analytics are calculated on-demand, so this is mainly for triggering recalculation
  }

  private generateId(): string {
    return `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const projectAttachmentService = ProjectAttachmentService.getInstance();