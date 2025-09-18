/**
 * Version Control Service
 * Document versioning, change tracking, and branching system for writing projects
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface DocumentVersion {
  id: string;
  documentId: string;
  projectId: string;
  versionNumber: number;
  title: string;
  content: string;
  summary: string;
  author: string;
  createdAt: Date;
  parentVersionId?: string;
  branchName: string;
  tags: string[];
  metadata: {
    wordCount: number;
    characterCount: number;
    changeDescription: string;
    isAutosave: boolean;
    isMajorVersion: boolean;
    conflictResolved?: boolean;
    mergeSourceIds?: string[];
  };
  diff?: DocumentDiff;
}

export interface DocumentDiff {
  additions: DiffChunk[];
  deletions: DiffChunk[];
  modifications: DiffChunk[];
  lineChanges: LineChange[];
  statistics: {
    linesAdded: number;
    linesDeleted: number;
    linesModified: number;
    wordsAdded: number;
    wordsDeleted: number;
    charactersAdded: number;
    charactersDeleted: number;
  };
}

export interface DiffChunk {
  startLine: number;
  endLine: number;
  content: string;
  type: 'addition' | 'deletion' | 'modification';
}

export interface LineChange {
  lineNumber: number;
  oldContent: string;
  newContent: string;
  changeType: 'added' | 'deleted' | 'modified';
}

export interface DocumentBranch {
  id: string;
  name: string;
  description: string;
  documentId: string;
  projectId: string;
  parentBranchId?: string;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
  headVersionId: string;
  author: string;
  mergedAt?: Date;
  mergedBy?: string;
  mergeCommitId?: string;
}

export interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranchId: string;
  targetBranchId: string;
  sourceVersionId: string;
  targetVersionId: string;
  status: 'open' | 'merged' | 'closed' | 'draft';
  author: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  mergedBy?: string;
  conflicts?: MergeConflict[];
  reviewComments: ReviewComment[];
  approvals: string[];
}

export interface MergeConflict {
  id: string;
  type: 'content' | 'structure' | 'metadata';
  location: {
    line: number;
    column: number;
    section?: string;
  };
  conflictDescription: string;
  sourceContent: string;
  targetContent: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface ReviewComment {
  id: string;
  author: string;
  content: string;
  line?: number;
  section?: string;
  type: 'suggestion' | 'question' | 'approval' | 'concern';
  createdAt: Date;
  updatedAt?: Date;
  isResolved: boolean;
  resolvedBy?: string;
  replies: ReviewCommentReply[];
}

export interface ReviewCommentReply {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface VersionHistory {
  documentId: string;
  projectId: string;
  branches: DocumentBranch[];
  versions: DocumentVersion[];
  mergeRequests: MergeRequest[];
  currentBranchId: string;
  currentVersionId: string;
}

export interface CommitInfo {
  message: string;
  description?: string;
  tags?: string[];
  isMajorVersion?: boolean;
  author: string;
}

export interface VersionComparison {
  sourceVersion: DocumentVersion;
  targetVersion: DocumentVersion;
  diff: DocumentDiff;
  similarity: number;
  conflictCount: number;
  isCompatible: boolean;
}

export interface VersionStatistics {
  totalVersions: number;
  totalBranches: number;
  activeBranches: number;
  mergeRequests: {
    open: number;
    merged: number;
    closed: number;
  };
  recentActivity: Array<{
    type: 'version' | 'branch' | 'merge';
    description: string;
    timestamp: Date;
    author: string;
  }>;
  topContributors: Array<{
    author: string;
    versionCount: number;
    lastActivity: Date;
  }>;
}

class VersionControlService extends BrowserEventEmitter {
  private versions: Map<string, DocumentVersion> = new Map();
  private branches: Map<string, DocumentBranch> = new Map();
  private mergeRequests: Map<string, MergeRequest> = new Map();
  private storageKey = 'astral_notes_version_control';

  constructor() {
    super();
    this.loadData();
  }

  // Version Management
  createVersion(documentId: string, projectId: string, content: string, commitInfo: CommitInfo): DocumentVersion {
    const currentBranch = this.getCurrentBranch(documentId) || this.createMainBranch(documentId, projectId);
    const lastVersion = this.getLatestVersion(documentId, currentBranch.id);
    
    const version: DocumentVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      projectId,
      versionNumber: lastVersion ? lastVersion.versionNumber + 1 : 1,
      title: commitInfo.message,
      content,
      summary: commitInfo.description || '',
      author: commitInfo.author,
      createdAt: new Date(),
      parentVersionId: lastVersion?.id,
      branchName: currentBranch.name,
      tags: commitInfo.tags || [],
      metadata: {
        wordCount: this.countWords(content),
        characterCount: content.length,
        changeDescription: commitInfo.message,
        isAutosave: false,
        isMajorVersion: commitInfo.isMajorVersion || false
      }
    };

    // Calculate diff if there's a previous version
    if (lastVersion) {
      version.diff = this.calculateDiff(lastVersion.content, content);
    }

    this.versions.set(version.id, version);
    
    // Update branch head
    currentBranch.headVersionId = version.id;
    currentBranch.lastModified = new Date();
    this.branches.set(currentBranch.id, currentBranch);

    this.saveData();
    this.emit('versionCreated', { version, branch: currentBranch });
    
    return version;
  }

  createAutosaveVersion(documentId: string, projectId: string, content: string, author: string): DocumentVersion {
    const currentBranch = this.getCurrentBranch(documentId) || this.createMainBranch(documentId, projectId);
    const lastVersion = this.getLatestVersion(documentId, currentBranch.id);
    
    // Don't create autosave if content hasn't changed significantly
    if (lastVersion && this.calculateSimilarity(lastVersion.content, content) > 0.98) {
      return lastVersion;
    }

    // Calculate the next autosave version number
    let nextVersionNumber = 1;
    if (lastVersion) {
      const baseVersion = Math.floor(lastVersion.versionNumber);
      const allVersions = Array.from(this.versions.values())
        .filter(v => v.documentId === documentId && v.branchName === currentBranch.name)
        .map(v => v.versionNumber)
        .filter(num => Math.floor(num) === baseVersion)
        .sort((a, b) => b - a);
      
      if (allVersions.length > 0) {
        const latestInSeries = allVersions[0];
        if (latestInSeries === baseVersion) {
          nextVersionNumber = baseVersion + 0.1;
        } else {
          const minorPart = Math.round((latestInSeries - baseVersion) * 10);
          nextVersionNumber = Math.round((baseVersion + (minorPart + 1) * 0.1) * 10) / 10;
        }
      } else {
        nextVersionNumber = baseVersion + 0.1;
      }
    }

    const version: DocumentVersion = {
      id: `autosave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      projectId,
      versionNumber: nextVersionNumber,
      title: 'Autosave',
      content,
      summary: 'Automatic save',
      author,
      createdAt: new Date(),
      parentVersionId: lastVersion?.id,
      branchName: currentBranch.name,
      tags: ['autosave'],
      metadata: {
        wordCount: this.countWords(content),
        characterCount: content.length,
        changeDescription: 'Automatic save',
        isAutosave: true,
        isMajorVersion: false
      }
    };

    if (lastVersion) {
      version.diff = this.calculateDiff(lastVersion.content, content);
    }

    this.versions.set(version.id, version);
    this.saveData();
    
    return version;
  }

  getVersion(versionId: string): DocumentVersion | null {
    return this.versions.get(versionId) || null;
  }

  getVersionHistory(documentId: string): VersionHistory {
    const documentVersions = Array.from(this.versions.values())
      .filter(v => v.documentId === documentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const documentBranches = Array.from(this.branches.values())
      .filter(b => b.documentId === documentId);

    const documentMergeRequests = Array.from(this.mergeRequests.values())
      .filter(mr => {
        const sourceBranch = this.branches.get(mr.sourceBranchId);
        return sourceBranch && sourceBranch.documentId === documentId;
      });

    const currentBranch = this.getCurrentBranch(documentId);
    const currentVersion = currentBranch ? this.getLatestVersion(documentId, currentBranch.id) : null;

    return {
      documentId,
      projectId: documentVersions[0]?.projectId || '',
      branches: documentBranches,
      versions: documentVersions,
      mergeRequests: documentMergeRequests,
      currentBranchId: currentBranch?.id || '',
      currentVersionId: currentVersion?.id || ''
    };
  }

  getLatestVersion(documentId: string, branchId?: string): DocumentVersion | null {
    const versions = Array.from(this.versions.values())
      .filter(v => {
        if (v.documentId !== documentId) return false;
        if (branchId) {
          const branch = this.branches.get(branchId);
          return branch && v.branchName === branch.name;
        }
        return true;
      })
      .sort((a, b) => {
        // First sort by version number (higher version is more recent)
        const versionDiff = b.versionNumber - a.versionNumber;
        if (versionDiff !== 0) return versionDiff;
        // If version numbers are equal, sort by creation time
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    return versions[0] || null;
  }

  revertToVersion(versionId: string, commitInfo: CommitInfo): DocumentVersion | null {
    const targetVersion = this.versions.get(versionId);
    if (!targetVersion) return null;

    const newVersion = this.createVersion(
      targetVersion.documentId,
      targetVersion.projectId,
      targetVersion.content,
      {
        ...commitInfo,
        message: `Revert to version ${targetVersion.versionNumber}: ${commitInfo.message}`
      }
    );

    this.emit('versionReverted', { originalVersion: targetVersion, newVersion });
    return newVersion;
  }

  // Branch Management
  createBranch(documentId: string, projectId: string, name: string, description: string, author: string): DocumentBranch {
    const parentBranch = this.getCurrentBranch(documentId);
    const parentVersion = parentBranch ? this.getLatestVersion(documentId, parentBranch.id) : null;

    const branch: DocumentBranch = {
      id: `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      documentId,
      projectId,
      parentBranchId: parentBranch?.id,
      isMainBranch: false,
      isActive: false,
      createdAt: new Date(),
      lastModified: new Date(),
      headVersionId: parentVersion?.id || '',
      author
    };

    this.branches.set(branch.id, branch);
    this.saveData();
    this.emit('branchCreated', branch);
    
    return branch;
  }

  private createMainBranch(documentId: string, projectId: string): DocumentBranch {
    const branch: DocumentBranch = {
      id: `main-${documentId}`,
      name: 'main',
      description: 'Main branch',
      documentId,
      projectId,
      isMainBranch: true,
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date(),
      headVersionId: '',
      author: 'system'
    };

    this.branches.set(branch.id, branch);
    return branch;
  }

  switchBranch(documentId: string, branchId: string): boolean {
    const targetBranch = this.branches.get(branchId);
    if (!targetBranch || targetBranch.documentId !== documentId) return false;

    // Deactivate all branches for this document
    Array.from(this.branches.values())
      .filter(b => b.documentId === documentId)
      .forEach(b => {
        b.isActive = false;
        this.branches.set(b.id, b);
      });

    // Activate target branch
    targetBranch.isActive = true;
    this.branches.set(branchId, targetBranch);

    this.saveData();
    this.emit('branchSwitched', { documentId, branchId, branch: targetBranch });
    
    return true;
  }

  getCurrentBranch(documentId: string): DocumentBranch | null {
    return Array.from(this.branches.values())
      .find(b => b.documentId === documentId && b.isActive) || null;
  }

  getBranches(documentId: string): DocumentBranch[] {
    return Array.from(this.branches.values())
      .filter(b => b.documentId === documentId)
      .sort((a, b) => {
        if (a.isMainBranch && !b.isMainBranch) return -1;
        if (!a.isMainBranch && b.isMainBranch) return 1;
        return b.lastModified.getTime() - a.lastModified.getTime();
      });
  }

  deleteBranch(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch || branch.isMainBranch || branch.isActive) return false;

    this.branches.delete(branchId);
    this.saveData();
    this.emit('branchDeleted', { branchId, branch });
    
    return true;
  }

  // Merge Operations
  createMergeRequest(
    sourceBranchId: string,
    targetBranchId: string,
    title: string,
    description: string,
    author: string
  ): MergeRequest {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    
    if (!sourceBranch || !targetBranch) {
      throw new Error('Invalid branch IDs');
    }

    const sourceVersion = this.getLatestVersion(sourceBranch.documentId, sourceBranchId);
    const targetVersion = this.getLatestVersion(targetBranch.documentId, targetBranchId);

    if (!sourceVersion || !targetVersion) {
      throw new Error('No versions found for merge');
    }

    const conflicts = this.detectMergeConflicts(sourceVersion, targetVersion);

    const mergeRequest: MergeRequest = {
      id: `merge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      sourceBranchId,
      targetBranchId,
      sourceVersionId: sourceVersion.id,
      targetVersionId: targetVersion.id,
      status: conflicts.length > 0 ? 'open' : 'open',
      author,
      createdAt: new Date(),
      updatedAt: new Date(),
      conflicts,
      reviewComments: [],
      approvals: []
    };

    this.mergeRequests.set(mergeRequest.id, mergeRequest);
    this.saveData();
    this.emit('mergeRequestCreated', mergeRequest);
    
    return mergeRequest;
  }

  mergeBranches(mergeRequestId: string, author: string): DocumentVersion | null {
    const mergeRequest = this.mergeRequests.get(mergeRequestId);
    if (!mergeRequest || mergeRequest.status !== 'open') return null;

    const sourceVersion = this.versions.get(mergeRequest.sourceVersionId);
    const targetVersion = this.versions.get(mergeRequest.targetVersionId);
    
    if (!sourceVersion || !targetVersion) return null;

    // Check for unresolved conflicts
    const unresolvedConflicts = mergeRequest.conflicts?.filter(c => !c.resolution) || [];
    if (unresolvedConflicts.length > 0) {
      throw new Error('Cannot merge with unresolved conflicts');
    }

    // Create merged content
    const mergedContent = this.mergeContent(sourceVersion, targetVersion, mergeRequest.conflicts || []);

    // Create merge commit
    const mergeVersion = this.createVersion(
      targetVersion.documentId,
      targetVersion.projectId,
      mergedContent,
      {
        message: `Merge ${mergeRequest.title}`,
        description: `Merged branch ${sourceVersion.branchName} into ${targetVersion.branchName}`,
        author,
        isMajorVersion: true
      }
    );

    mergeVersion.metadata.mergeSourceIds = [sourceVersion.id, targetVersion.id];

    // Update merge request
    mergeRequest.status = 'merged';
    mergeRequest.mergedAt = new Date();
    mergeRequest.mergedBy = author;
    mergeRequest.mergeCommitId = mergeVersion.id;
    this.mergeRequests.set(mergeRequestId, mergeRequest);

    this.saveData();
    this.emit('branchMerged', { mergeRequest, mergeVersion });
    
    return mergeVersion;
  }

  private detectMergeConflicts(sourceVersion: DocumentVersion, targetVersion: DocumentVersion): MergeConflict[] {
    const conflicts: MergeConflict[] = [];
    const diff = this.calculateDiff(targetVersion.content, sourceVersion.content);

    // Simple conflict detection based on overlapping changes
    const sourceLines = sourceVersion.content.split('\n');
    const targetLines = targetVersion.content.split('\n');

    for (let i = 0; i < Math.min(sourceLines.length, targetLines.length); i++) {
      if (sourceLines[i] !== targetLines[i] && 
          sourceLines[i].trim() !== '' && 
          targetLines[i].trim() !== '') {
        
        conflicts.push({
          id: `conflict-${Date.now()}-${i}`,
          type: 'content',
          location: { line: i + 1, column: 1 },
          conflictDescription: `Content differs at line ${i + 1}`,
          sourceContent: sourceLines[i],
          targetContent: targetLines[i]
        });
      }
    }

    return conflicts;
  }

  private mergeContent(sourceVersion: DocumentVersion, targetVersion: DocumentVersion, conflicts: MergeConflict[]): string {
    let mergedContent = targetVersion.content;

    // Apply conflict resolutions
    conflicts.forEach(conflict => {
      if (conflict.resolution) {
        mergedContent = mergedContent.replace(conflict.targetContent, conflict.resolution);
      }
    });

    return mergedContent;
  }

  // Comparison and Diff
  compareVersions(sourceVersionId: string, targetVersionId: string): VersionComparison | null {
    const sourceVersion = this.versions.get(sourceVersionId);
    const targetVersion = this.versions.get(targetVersionId);
    
    if (!sourceVersion || !targetVersion) return null;

    const diff = this.calculateDiff(sourceVersion.content, targetVersion.content);
    const similarity = this.calculateSimilarity(sourceVersion.content, targetVersion.content);
    const conflictCount = this.detectMergeConflicts(sourceVersion, targetVersion).length;

    return {
      sourceVersion,
      targetVersion,
      diff,
      similarity,
      conflictCount,
      isCompatible: conflictCount === 0
    };
  }

  private calculateDiff(oldContent: string, newContent: string): DocumentDiff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const additions: DiffChunk[] = [];
    const deletions: DiffChunk[] = [];
    const modifications: DiffChunk[] = [];
    const lineChanges: LineChange[] = [];

    let wordsAdded = 0, wordsDeleted = 0;
    let charactersAdded = 0, charactersDeleted = 0;

    // Simple line-by-line diff
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (i >= oldLines.length) {
        // Addition
        additions.push({
          startLine: i + 1,
          endLine: i + 1,
          content: newLine,
          type: 'addition'
        });
        lineChanges.push({
          lineNumber: i + 1,
          oldContent: '',
          newContent: newLine,
          changeType: 'added'
        });
        wordsAdded += this.countWords(newLine);
        charactersAdded += newLine.length;
      } else if (i >= newLines.length) {
        // Deletion
        deletions.push({
          startLine: i + 1,
          endLine: i + 1,
          content: oldLine,
          type: 'deletion'
        });
        lineChanges.push({
          lineNumber: i + 1,
          oldContent: oldLine,
          newContent: '',
          changeType: 'deleted'
        });
        wordsDeleted += this.countWords(oldLine);
        charactersDeleted += oldLine.length;
      } else if (oldLine !== newLine) {
        // Modification
        modifications.push({
          startLine: i + 1,
          endLine: i + 1,
          content: newLine,
          type: 'modification'
        });
        lineChanges.push({
          lineNumber: i + 1,
          oldContent: oldLine,
          newContent: newLine,
          changeType: 'modified'
        });
        
        const oldWords = this.countWords(oldLine);
        const newWords = this.countWords(newLine);
        if (newWords > oldWords) {
          wordsAdded += newWords - oldWords;
        } else {
          wordsDeleted += oldWords - newWords;
        }
        
        charactersAdded += Math.max(0, newLine.length - oldLine.length);
        charactersDeleted += Math.max(0, oldLine.length - newLine.length);
      }
    }

    return {
      additions,
      deletions,
      modifications,
      lineChanges,
      statistics: {
        linesAdded: additions.length,
        linesDeleted: deletions.length,
        linesModified: modifications.length,
        wordsAdded,
        wordsDeleted,
        charactersAdded,
        charactersDeleted
      }
    };
  }

  private calculateSimilarity(content1: string, content2: string): number {
    const words1 = content1.toLowerCase().split(/\s+/);
    const words2 = content2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 1;
  }

  // Review and Comments
  addReviewComment(
    mergeRequestId: string,
    content: string,
    author: string,
    type: ReviewComment['type'] = 'suggestion',
    line?: number,
    section?: string
  ): ReviewComment {
    const mergeRequest = this.mergeRequests.get(mergeRequestId);
    if (!mergeRequest) throw new Error('Merge request not found');

    const comment: ReviewComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author,
      content,
      line,
      section,
      type,
      createdAt: new Date(),
      isResolved: false,
      replies: []
    };

    mergeRequest.reviewComments.push(comment);
    mergeRequest.updatedAt = new Date();
    this.mergeRequests.set(mergeRequestId, mergeRequest);

    this.saveData();
    this.emit('reviewCommentAdded', { mergeRequest, comment });
    
    return comment;
  }

  // Statistics and Analytics
  getVersionStatistics(projectId?: string): VersionStatistics {
    let versions = Array.from(this.versions.values());
    let branches = Array.from(this.branches.values());
    let mergeRequests = Array.from(this.mergeRequests.values());

    if (projectId) {
      versions = versions.filter(v => v.projectId === projectId);
      branches = branches.filter(b => b.projectId === projectId);
      mergeRequests = mergeRequests.filter(mr => {
        const sourceBranch = this.branches.get(mr.sourceBranchId);
        return sourceBranch && sourceBranch.projectId === projectId;
      });
    }

    const activeBranches = branches.filter(b => b.isActive).length;
    const openMergeRequests = mergeRequests.filter(mr => mr.status === 'open').length;
    const mergedMergeRequests = mergeRequests.filter(mr => mr.status === 'merged').length;
    const closedMergeRequests = mergeRequests.filter(mr => mr.status === 'closed').length;

    // Recent activity
    const recentActivity = [
      ...versions.map(v => ({
        type: 'version' as const,
        description: `Created version ${v.versionNumber}: ${v.title}`,
        timestamp: v.createdAt,
        author: v.author
      })),
      ...branches.map(b => ({
        type: 'branch' as const,
        description: `Created branch: ${b.name}`,
        timestamp: b.createdAt,
        author: b.author
      })),
      ...mergeRequests.map(mr => ({
        type: 'merge' as const,
        description: `${mr.status === 'merged' ? 'Merged' : 'Created merge request'}: ${mr.title}`,
        timestamp: mr.status === 'merged' ? (mr.mergedAt || mr.createdAt) : mr.createdAt,
        author: mr.status === 'merged' ? (mr.mergedBy || mr.author) : mr.author
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);

    // Top contributors
    const contributorMap = new Map<string, { count: number; lastActivity: Date }>();
    
    versions.forEach(v => {
      const current = contributorMap.get(v.author) || { count: 0, lastActivity: new Date(0) };
      contributorMap.set(v.author, {
        count: current.count + 1,
        lastActivity: v.createdAt > current.lastActivity ? v.createdAt : current.lastActivity
      });
    });

    const topContributors = Array.from(contributorMap.entries())
      .map(([author, data]) => ({
        author,
        versionCount: data.count,
        lastActivity: data.lastActivity
      }))
      .sort((a, b) => b.versionCount - a.versionCount)
      .slice(0, 10);

    return {
      totalVersions: versions.length,
      totalBranches: branches.length,
      activeBranches,
      mergeRequests: {
        open: openMergeRequests,
        merged: mergedMergeRequests,
        closed: closedMergeRequests
      },
      recentActivity,
      topContributors
    };
  }

  // Utility Methods
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Data Persistence
  private saveData(): void {
    try {
      const data = {
        versions: Array.from(this.versions.entries()),
        branches: Array.from(this.branches.entries()),
        mergeRequests: Array.from(this.mergeRequests.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save version control data:', error);
    }
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.versions = new Map(data.versions?.map(([id, version]: [string, any]) => [
          id,
          {
            ...version,
            createdAt: new Date(version.createdAt)
          }
        ]) || []);
        
        this.branches = new Map(data.branches?.map(([id, branch]: [string, any]) => [
          id,
          {
            ...branch,
            createdAt: new Date(branch.createdAt),
            lastModified: new Date(branch.lastModified),
            mergedAt: branch.mergedAt ? new Date(branch.mergedAt) : undefined
          }
        ]) || []);
        
        this.mergeRequests = new Map(data.mergeRequests?.map(([id, mr]: [string, any]) => [
          id,
          {
            ...mr,
            createdAt: new Date(mr.createdAt),
            updatedAt: new Date(mr.updatedAt),
            mergedAt: mr.mergedAt ? new Date(mr.mergedAt) : undefined
          }
        ]) || []);
      }
    } catch (error) {
      console.error('Failed to load version control data:', error);
    }
  }

  // Clear all data for a specific project
  clearProject(projectId: string): void {
    // Clear versions for this project
    const versionsToDelete: string[] = [];
    this.versions.forEach((version, id) => {
      if (version.documentId.includes(projectId)) {
        versionsToDelete.push(id);
      }
    });
    versionsToDelete.forEach(id => this.versions.delete(id));

    // Clear branches for this project
    const branchesToDelete: string[] = [];
    this.branches.forEach((branch, id) => {
      if (branch.documentId.includes(projectId)) {
        branchesToDelete.push(id);
      }
    });
    branchesToDelete.forEach(id => this.branches.delete(id));

    // Clear merge requests for this project
    const mergeRequestsToDelete: string[] = [];
    this.mergeRequests.forEach((mr, id) => {
      if (id.includes(projectId)) {
        mergeRequestsToDelete.push(id);
      }
    });
    mergeRequestsToDelete.forEach(id => this.mergeRequests.delete(id));

    this.saveData();
  }

  // Get statistics for analytics
  getStatistics(): { totalVersions: number; totalBranches: number; totalCommits: number } {
    const totalVersions = this.versions.size;
    const totalBranches = this.branches.size;
    let totalCommits = 0;

    // Count all commits across all branches
    this.branches.forEach(branch => {
      totalCommits += branch.commits.length;
    });

    return {
      totalVersions,
      totalBranches,
      totalCommits
    };
  }
}

export const versionControlService = new VersionControlService();
export default versionControlService;