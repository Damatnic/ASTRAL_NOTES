/**
 * Revision Mode Service
 * Track changes, suggestions, and collaborative editing
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface RevisionChange {
  id: string;
  type: 'addition' | 'deletion' | 'modification' | 'comment' | 'suggestion';
  originalText?: string;
  newText?: string;
  position: {
    start: number;
    end: number;
    paragraph?: number;
    line?: number;
  };
  author: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
  comment?: string;
  replies?: RevisionComment[];
  metadata?: {
    reason?: string;
    category?: 'grammar' | 'style' | 'clarity' | 'fact-check' | 'consistency' | 'other';
    confidence?: number; // AI suggestion confidence
  };
}

export interface RevisionComment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  resolved: boolean;
}

export interface RevisionSession {
  id: string;
  documentId: string;
  documentTitle: string;
  startTime: Date;
  endTime?: Date;
  participants: RevisionParticipant[];
  changes: RevisionChange[];
  statistics: RevisionStats;
  mode: 'track-changes' | 'suggest' | 'comment-only';
  version: number;
}

export interface RevisionParticipant {
  id: string;
  name: string;
  role: 'author' | 'editor' | 'reviewer' | 'proofreader';
  color: string;
  avatar?: string;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canApproveChanges: boolean;
  };
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface RevisionStats {
  totalChanges: number;
  acceptedChanges: number;
  rejectedChanges: number;
  pendingChanges: number;
  totalComments: number;
  resolvedComments: number;
  wordsBefore: number;
  wordsAfter: number;
  changeDensity: number; // changes per 1000 words
}

export interface ComparisonView {
  mode: 'side-by-side' | 'inline' | 'unified';
  showOriginal: boolean;
  showFinal: boolean;
  highlightChanges: boolean;
  showComments: boolean;
  showLineNumbers: boolean;
}

export interface RevisionFilter {
  types: Array<RevisionChange['type']>;
  authors: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status: Array<'pending' | 'accepted' | 'rejected'>;
  searchText?: string;
}

class RevisionModeService {
  private static instance: RevisionModeService;
  private eventEmitter: BrowserEventEmitter;
  
  private currentSession: RevisionSession | null = null;
  private sessions: Map<string, RevisionSession> = new Map();
  private activeFilters: RevisionFilter = {
    types: ['addition', 'deletion', 'modification', 'comment', 'suggestion'],
    authors: [],
    status: ['pending', 'accepted', 'rejected']
  };
  private comparisonView: ComparisonView = {
    mode: 'inline',
    showOriginal: true,
    showFinal: true,
    highlightChanges: true,
    showComments: true,
    showLineNumbers: false
  };

  private constructor() {
    this.eventEmitter = BrowserEventEmitter.getInstance();
    this.loadData();
    this.setupEventListeners();
  }

  static getInstance(): RevisionModeService {
    if (!RevisionModeService.instance) {
      RevisionModeService.instance = new RevisionModeService();
    }
    return RevisionModeService.instance;
  }

  // Session Management
  startRevisionSession(
    documentId: string,
    documentTitle: string,
    mode: RevisionSession['mode'] = 'track-changes'
  ): RevisionSession {
    const session: RevisionSession = {
      id: this.generateId(),
      documentId,
      documentTitle,
      startTime: new Date(),
      participants: [this.getCurrentUser()],
      changes: [],
      statistics: this.initializeStats(),
      mode,
      version: 1
    };

    this.currentSession = session;
    this.sessions.set(session.id, session);
    this.saveData();
    
    this.eventEmitter.emit('revision:session-started', session);
    return session;
  }

  endRevisionSession(): void {
    if (!this.currentSession) return;
    
    this.currentSession.endTime = new Date();
    this.saveData();
    
    this.eventEmitter.emit('revision:session-ended', this.currentSession);
    this.currentSession = null;
  }

  // Change Tracking
  trackChange(change: Omit<RevisionChange, 'id' | 'timestamp'>): RevisionChange {
    if (!this.currentSession) {
      throw new Error('No active revision session');
    }

    const newChange: RevisionChange = {
      ...change,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.currentSession.changes.push(newChange);
    this.updateStatistics();
    this.saveData();
    
    this.eventEmitter.emit('revision:change-tracked', newChange);
    return newChange;
  }

  acceptChange(changeId: string): void {
    if (!this.currentSession) return;
    
    const change = this.currentSession.changes.find(c => c.id === changeId);
    if (!change) return;
    
    change.status = 'accepted';
    this.updateStatistics();
    this.saveData();
    
    this.eventEmitter.emit('revision:change-accepted', change);
  }

  rejectChange(changeId: string): void {
    if (!this.currentSession) return;
    
    const change = this.currentSession.changes.find(c => c.id === changeId);
    if (!change) return;
    
    change.status = 'rejected';
    this.updateStatistics();
    this.saveData();
    
    this.eventEmitter.emit('revision:change-rejected', change);
  }

  acceptAllChanges(): void {
    if (!this.currentSession) return;
    
    this.currentSession.changes.forEach(change => {
      if (change.status === 'pending') {
        change.status = 'accepted';
      }
    });
    
    this.updateStatistics();
    this.saveData();
    this.eventEmitter.emit('revision:all-changes-accepted');
  }

  rejectAllChanges(): void {
    if (!this.currentSession) return;
    
    this.currentSession.changes.forEach(change => {
      if (change.status === 'pending') {
        change.status = 'rejected';
      }
    });
    
    this.updateStatistics();
    this.saveData();
    this.eventEmitter.emit('revision:all-changes-rejected');
  }

  // Comments and Suggestions
  addComment(
    position: RevisionChange['position'],
    text: string,
    category?: RevisionChange['metadata']['category']
  ): RevisionChange {
    return this.trackChange({
      type: 'comment',
      position,
      comment: text,
      author: this.getCurrentUser().author,
      status: 'pending',
      metadata: category ? { category } : undefined,
      replies: []
    });
  }

  addSuggestion(
    position: RevisionChange['position'],
    originalText: string,
    suggestionText: string,
    reason?: string,
    confidence?: number
  ): RevisionChange {
    return this.trackChange({
      type: 'suggestion',
      originalText,
      newText: suggestionText,
      position,
      author: this.getCurrentUser().author,
      status: 'pending',
      metadata: {
        reason,
        confidence
      }
    });
  }

  replyToComment(changeId: string, replyText: string): void {
    if (!this.currentSession) return;
    
    const change = this.currentSession.changes.find(c => c.id === changeId);
    if (!change || change.type !== 'comment') return;
    
    const reply: RevisionComment = {
      id: this.generateId(),
      text: replyText,
      author: this.getCurrentUser().author,
      timestamp: new Date(),
      resolved: false
    };
    
    if (!change.replies) {
      change.replies = [];
    }
    change.replies.push(reply);
    
    this.saveData();
    this.eventEmitter.emit('revision:comment-reply', { change, reply });
  }

  resolveComment(changeId: string): void {
    if (!this.currentSession) return;
    
    const change = this.currentSession.changes.find(c => c.id === changeId);
    if (!change || change.type !== 'comment') return;
    
    change.status = 'accepted'; // Mark as resolved
    
    if (change.replies) {
      change.replies.forEach(reply => {
        reply.resolved = true;
      });
    }
    
    this.updateStatistics();
    this.saveData();
    this.eventEmitter.emit('revision:comment-resolved', change);
  }

  // Comparison and Diff
  generateDiff(originalText: string, revisedText: string): string {
    // Simple diff implementation - in production, use a proper diff library
    const original = originalText.split('\n');
    const revised = revisedText.split('\n');
    const diff: string[] = [];
    
    const maxLines = Math.max(original.length, revised.length);
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = original[i] || '';
      const revLine = revised[i] || '';
      
      if (origLine === revLine) {
        diff.push(`  ${origLine}`);
      } else if (origLine && !revLine) {
        diff.push(`- ${origLine}`);
      } else if (!origLine && revLine) {
        diff.push(`+ ${revLine}`);
      } else {
        diff.push(`- ${origLine}`);
        diff.push(`+ ${revLine}`);
      }
    }
    
    return diff.join('\n');
  }

  applyChanges(text: string): string {
    if (!this.currentSession) return text;
    
    // Sort changes by position (reverse order to maintain positions)
    const acceptedChanges = this.currentSession.changes
      .filter(c => c.status === 'accepted')
      .sort((a, b) => b.position.start - a.position.start);
    
    let result = text;
    
    for (const change of acceptedChanges) {
      switch (change.type) {
        case 'deletion':
          result = result.slice(0, change.position.start) + 
                  result.slice(change.position.end);
          break;
        case 'addition':
          result = result.slice(0, change.position.start) + 
                  change.newText + 
                  result.slice(change.position.start);
          break;
        case 'modification':
          result = result.slice(0, change.position.start) + 
                  change.newText + 
                  result.slice(change.position.end);
          break;
      }
    }
    
    return result;
  }

  // Filtering and Search
  setFilter(filter: Partial<RevisionFilter>): void {
    this.activeFilters = { ...this.activeFilters, ...filter };
    this.eventEmitter.emit('revision:filter-changed', this.activeFilters);
  }

  getFilteredChanges(): RevisionChange[] {
    if (!this.currentSession) return [];
    
    return this.currentSession.changes.filter(change => {
      if (!this.activeFilters.types.includes(change.type)) return false;
      
      if (this.activeFilters.authors.length > 0 && 
          !this.activeFilters.authors.includes(change.author.id)) {
        return false;
      }
      
      if (!this.activeFilters.status.includes(change.status)) return false;
      
      if (this.activeFilters.dateRange) {
        const changeDate = new Date(change.timestamp);
        if (changeDate < this.activeFilters.dateRange.start ||
            changeDate > this.activeFilters.dateRange.end) {
          return false;
        }
      }
      
      if (this.activeFilters.searchText) {
        const searchLower = this.activeFilters.searchText.toLowerCase();
        const searchableText = [
          change.originalText,
          change.newText,
          change.comment,
          change.metadata?.reason
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) return false;
      }
      
      return true;
    });
  }

  // View Management
  setComparisonView(view: Partial<ComparisonView>): void {
    this.comparisonView = { ...this.comparisonView, ...view };
    this.eventEmitter.emit('revision:view-changed', this.comparisonView);
  }

  getComparisonView(): ComparisonView {
    return this.comparisonView;
  }

  // Export and Import
  exportRevisions(format: 'json' | 'html' | 'pdf' = 'json'): string {
    if (!this.currentSession) return '';
    
    switch (format) {
      case 'json':
        return JSON.stringify(this.currentSession, null, 2);
      
      case 'html':
        return this.generateHTMLExport();
      
      case 'pdf':
        // In production, use a PDF generation library
        return this.generateHTMLExport();
      
      default:
        return '';
    }
  }

  private generateHTMLExport(): string {
    if (!this.currentSession) return '';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revision Report - ${this.currentSession.documentTitle}</title>
        <style>
          .addition { background-color: #d4f4dd; color: #0d6832; }
          .deletion { background-color: #ffd4d4; color: #b30000; text-decoration: line-through; }
          .modification { background-color: #fff3cd; color: #664d03; }
          .comment { background-color: #d1ecf1; color: #0c5460; }
        </style>
      </head>
      <body>
        <h1>Revision Report: ${this.currentSession.documentTitle}</h1>
        <p>Session: ${this.currentSession.startTime.toLocaleString()} - ${this.currentSession.endTime?.toLocaleString() || 'Ongoing'}</p>
        <h2>Statistics</h2>
        <ul>
          <li>Total Changes: ${this.currentSession.statistics.totalChanges}</li>
          <li>Accepted: ${this.currentSession.statistics.acceptedChanges}</li>
          <li>Rejected: ${this.currentSession.statistics.rejectedChanges}</li>
          <li>Pending: ${this.currentSession.statistics.pendingChanges}</li>
        </ul>
        <h2>Changes</h2>
        ${this.currentSession.changes.map(change => `
          <div class="${change.type}">
            <strong>${change.type}</strong> by ${change.author.name} at ${new Date(change.timestamp).toLocaleString()}
            ${change.originalText ? `<br>Original: ${change.originalText}` : ''}
            ${change.newText ? `<br>New: ${change.newText}` : ''}
            ${change.comment ? `<br>Comment: ${change.comment}` : ''}
            <br>Status: ${change.status}
          </div>
        `).join('<hr>')}
      </body>
      </html>
    `;
    
    return html;
  }

  // Statistics
  private updateStatistics(): void {
    if (!this.currentSession) return;
    
    const stats = this.currentSession.statistics;
    const changes = this.currentSession.changes;
    
    stats.totalChanges = changes.length;
    stats.acceptedChanges = changes.filter(c => c.status === 'accepted').length;
    stats.rejectedChanges = changes.filter(c => c.status === 'rejected').length;
    stats.pendingChanges = changes.filter(c => c.status === 'pending').length;
    stats.totalComments = changes.filter(c => c.type === 'comment').length;
    stats.resolvedComments = changes.filter(c => c.type === 'comment' && c.status === 'accepted').length;
    
    // Calculate change density
    if (stats.wordsAfter > 0) {
      stats.changeDensity = (stats.totalChanges / stats.wordsAfter) * 1000;
    }
  }

  private initializeStats(): RevisionStats {
    return {
      totalChanges: 0,
      acceptedChanges: 0,
      rejectedChanges: 0,
      pendingChanges: 0,
      totalComments: 0,
      resolvedComments: 0,
      wordsBefore: 0,
      wordsAfter: 0,
      changeDensity: 0
    };
  }

  // Helper Methods
  private getCurrentUser(): RevisionParticipant {
    // In production, get from authentication service
    return {
      id: 'current-user',
      name: 'Current User',
      role: 'author',
      color: '#3b82f6',
      author: {
        id: 'current-user',
        name: 'Current User',
        color: '#3b82f6'
      },
      permissions: {
        canEdit: true,
        canComment: true,
        canApproveChanges: true
      },
      joinedAt: new Date(),
      lastActiveAt: new Date()
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Data Persistence
  private saveData(): void {
    const data = {
      currentSessionId: this.currentSession?.id,
      sessions: Array.from(this.sessions.entries()),
      filters: this.activeFilters,
      view: this.comparisonView
    };
    localStorage.setItem('revisionMode', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('revisionMode');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.sessions) {
          this.sessions = new Map(data.sessions);
        }
        if (data.currentSessionId && this.sessions.has(data.currentSessionId)) {
          this.currentSession = this.sessions.get(data.currentSessionId) || null;
        }
        if (data.filters) {
          this.activeFilters = data.filters;
        }
        if (data.view) {
          this.comparisonView = data.view;
        }
      } catch (error) {
        console.error('Failed to load revision mode data:', error);
      }
    }
  }

  private setupEventListeners(): void {
    // Listen for text changes from editor
    this.eventEmitter.on('editor:text-change', ({ original, modified, position }) => {
      if (!this.currentSession || this.currentSession.mode === 'comment-only') return;
      
      // Auto-track changes
      if (original && !modified) {
        this.trackChange({
          type: 'deletion',
          originalText: original,
          position,
          author: this.getCurrentUser().author,
          status: 'pending'
        });
      } else if (!original && modified) {
        this.trackChange({
          type: 'addition',
          newText: modified,
          position,
          author: this.getCurrentUser().author,
          status: 'pending'
        });
      } else if (original && modified && original !== modified) {
        this.trackChange({
          type: 'modification',
          originalText: original,
          newText: modified,
          position,
          author: this.getCurrentUser().author,
          status: 'pending'
        });
      }
    });
  }

  // Public API
  getCurrentSession(): RevisionSession | null {
    return this.currentSession;
  }

  getSession(sessionId: string): RevisionSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): RevisionSession[] {
    return Array.from(this.sessions.values());
  }

  getStatistics(): RevisionStats | null {
    return this.currentSession?.statistics || null;
  }

  getParticipants(): RevisionParticipant[] {
    return this.currentSession?.participants || [];
  }

  cleanup(): void {
    if (this.currentSession) {
      this.endRevisionSession();
    }
  }
}

export const revisionModeService = RevisionModeService.getInstance();