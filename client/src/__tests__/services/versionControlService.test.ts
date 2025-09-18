import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { versionControlService } from '../../services/versionControlService';
import type { DocumentVersion, DocumentBranch, MergeRequest, CommitInfo } from '../../services/versionControlService';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('VersionControlService', () => {
  const testDocumentId = 'test-doc-1';
  const testProjectId = 'test-project-1';
  const testAuthor = 'Test Author';

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Clear all internal state
    versionControlService['versions'].clear();
    versionControlService['branches'].clear();
    versionControlService['mergeRequests'].clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Version Management', () => {
    it('should create first version with main branch', () => {
      const content = 'This is the first version of the document.';
      const commitInfo: CommitInfo = {
        message: 'Initial commit',
        description: 'First version of the document',
        author: testAuthor,
        isMajorVersion: true,
        tags: ['initial']
      };

      const version = versionControlService.createVersion(testDocumentId, testProjectId, content, commitInfo);

      expect(version.id).toBeTruthy();
      expect(version.documentId).toBe(testDocumentId);
      expect(version.projectId).toBe(testProjectId);
      expect(version.versionNumber).toBe(1);
      expect(version.title).toBe('Initial commit');
      expect(version.content).toBe(content);
      expect(version.author).toBe(testAuthor);
      expect(version.branchName).toBe('main');
      expect(version.tags).toEqual(['initial']);
      expect(version.metadata.isMajorVersion).toBe(true);
      expect(version.metadata.wordCount).toBe(8);
      expect(version.metadata.characterCount).toBe(content.length);
      expect(version.parentVersionId).toBeUndefined();
      expect(version.diff).toBeUndefined();
    });

    it('should create subsequent version with diff', () => {
      const firstContent = 'This is the first version.';
      const secondContent = 'This is the second version with more content.';

      // Create first version
      const firstCommit: CommitInfo = {
        message: 'First commit',
        author: testAuthor
      };
      const firstVersion = versionControlService.createVersion(testDocumentId, testProjectId, firstContent, firstCommit);

      // Create second version
      const secondCommit: CommitInfo = {
        message: 'Second commit',
        description: 'Added more content',
        author: testAuthor
      };
      const secondVersion = versionControlService.createVersion(testDocumentId, testProjectId, secondContent, secondCommit);

      expect(secondVersion.versionNumber).toBe(2);
      expect(secondVersion.parentVersionId).toBe(firstVersion.id);
      expect(secondVersion.diff).toBeDefined();
      expect(secondVersion.diff!.statistics.linesModified).toBeGreaterThan(0);
    });

    it('should create autosave version', () => {
      const content = 'Original content';
      const modifiedContent = 'Original content with small change';

      // Create initial version
      const commitInfo: CommitInfo = {
        message: 'Initial commit',
        author: testAuthor
      };
      versionControlService.createVersion(testDocumentId, testProjectId, content, commitInfo);

      // Create autosave
      const autosaveVersion = versionControlService.createAutosaveVersion(
        testDocumentId,
        testProjectId,
        modifiedContent,
        testAuthor
      );

      expect(autosaveVersion.versionNumber).toBe(1.1);
      expect(autosaveVersion.metadata.isAutosave).toBe(true);
      expect(autosaveVersion.tags).toContain('autosave');
      expect(autosaveVersion.title).toBe('Autosave');
    });

    it('should not create autosave for very similar content', () => {
      const content = 'This is some content that will not change much.';
      const nearlyIdenticalContent = 'This is some content that will not change much.'; // Identical content

      // Create initial version
      const commitInfo: CommitInfo = {
        message: 'Initial commit',
        author: testAuthor
      };
      const initialVersion = versionControlService.createVersion(testDocumentId, testProjectId, content, commitInfo);

      // Try to create autosave with nearly identical content
      const autosaveVersion = versionControlService.createAutosaveVersion(
        testDocumentId,
        testProjectId,
        nearlyIdenticalContent,
        testAuthor
      );

      expect(autosaveVersion.id).toBe(initialVersion.id); // Should return existing version
    });

    it('should get version by ID', () => {
      const content = 'Test content';
      const commitInfo: CommitInfo = {
        message: 'Test commit',
        author: testAuthor
      };

      const version = versionControlService.createVersion(testDocumentId, testProjectId, content, commitInfo);
      const retrievedVersion = versionControlService.getVersion(version.id);

      expect(retrievedVersion).toEqual(version);
    });

    it('should return null for non-existent version', () => {
      const retrievedVersion = versionControlService.getVersion('non-existent-id');
      expect(retrievedVersion).toBeNull();
    });

    it('should get latest version', () => {
      const firstContent = 'First version';
      const secondContent = 'Second version';

      const firstCommit: CommitInfo = { message: 'First', author: testAuthor };
      const secondCommit: CommitInfo = { message: 'Second', author: testAuthor };

      versionControlService.createVersion(testDocumentId, testProjectId, firstContent, firstCommit);
      const secondVersion = versionControlService.createVersion(testDocumentId, testProjectId, secondContent, secondCommit);

      const latestVersion = versionControlService.getLatestVersion(testDocumentId);
      expect(latestVersion?.content).toBe(secondContent);
      expect(latestVersion?.versionNumber).toBe(2);
    });

    it('should revert to previous version', () => {
      const firstContent = 'Original content';
      const secondContent = 'Modified content';

      const firstCommit: CommitInfo = { message: 'Original', author: testAuthor };
      const secondCommit: CommitInfo = { message: 'Modified', author: testAuthor };

      const firstVersion = versionControlService.createVersion(testDocumentId, testProjectId, firstContent, firstCommit);
      versionControlService.createVersion(testDocumentId, testProjectId, secondContent, secondCommit);

      // Revert to first version
      const revertCommit: CommitInfo = {
        message: 'Revert changes',
        author: testAuthor
      };
      const revertedVersion = versionControlService.revertToVersion(firstVersion.id, revertCommit);

      expect(revertedVersion).toBeTruthy();
      expect(revertedVersion!.content).toBe(firstContent);
      expect(revertedVersion!.title).toContain('Revert to version 1');
      expect(revertedVersion!.versionNumber).toBe(3);
    });

    it('should return null when reverting to non-existent version', () => {
      const revertCommit: CommitInfo = {
        message: 'Revert',
        author: testAuthor
      };
      const result = versionControlService.revertToVersion('non-existent', revertCommit);
      expect(result).toBeNull();
    });
  });

  describe('Branch Management', () => {
    beforeEach(() => {
      // Create initial version to work with
      const commitInfo: CommitInfo = {
        message: 'Initial commit',
        author: testAuthor
      };
      versionControlService.createVersion(testDocumentId, testProjectId, 'Initial content', commitInfo);
    });

    it('should create new branch', () => {
      const branch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'feature-branch',
        'Feature development branch',
        testAuthor
      );

      expect(branch.id).toBeTruthy();
      expect(branch.name).toBe('feature-branch');
      expect(branch.description).toBe('Feature development branch');
      expect(branch.documentId).toBe(testDocumentId);
      expect(branch.projectId).toBe(testProjectId);
      expect(branch.author).toBe(testAuthor);
      expect(branch.isMainBranch).toBe(false);
      expect(branch.isActive).toBe(false);
      expect(branch.parentBranchId).toBeTruthy(); // Should have main branch as parent
    });

    it('should switch to different branch', () => {
      const featureBranch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'feature',
        'Feature branch',
        testAuthor
      );

      const switched = versionControlService.switchBranch(testDocumentId, featureBranch.id);
      expect(switched).toBe(true);

      const currentBranch = versionControlService.getCurrentBranch(testDocumentId);
      expect(currentBranch?.id).toBe(featureBranch.id);
      expect(currentBranch?.isActive).toBe(true);

      // Main branch should no longer be active
      const branches = versionControlService.getBranches(testDocumentId);
      const mainBranch = branches.find(b => b.isMainBranch);
      expect(mainBranch?.isActive).toBe(false);
    });

    it('should return false when switching to non-existent branch', () => {
      const switched = versionControlService.switchBranch(testDocumentId, 'non-existent');
      expect(switched).toBe(false);
    });

    it('should get all branches for document', () => {
      versionControlService.createBranch(testDocumentId, testProjectId, 'feature1', 'Feature 1', testAuthor);
      versionControlService.createBranch(testDocumentId, testProjectId, 'feature2', 'Feature 2', testAuthor);

      const branches = versionControlService.getBranches(testDocumentId);
      
      expect(branches.length).toBe(3); // main + 2 feature branches
      expect(branches[0].isMainBranch).toBe(true); // Main branch should be first
      expect(branches.some(b => b.name === 'feature1')).toBe(true);
      expect(branches.some(b => b.name === 'feature2')).toBe(true);
    });

    it('should delete non-main, non-active branch', () => {
      const featureBranch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'deletable',
        'Deletable branch',
        testAuthor
      );

      const deleted = versionControlService.deleteBranch(featureBranch.id);
      expect(deleted).toBe(true);

      const branches = versionControlService.getBranches(testDocumentId);
      expect(branches.some(b => b.id === featureBranch.id)).toBe(false);
    });

    it('should not delete main branch', () => {
      const branches = versionControlService.getBranches(testDocumentId);
      const mainBranch = branches.find(b => b.isMainBranch);
      
      const deleted = versionControlService.deleteBranch(mainBranch!.id);
      expect(deleted).toBe(false);
    });

    it('should not delete active branch', () => {
      const featureBranch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'active-branch',
        'Active branch',
        testAuthor
      );

      // Switch to feature branch (make it active)
      versionControlService.switchBranch(testDocumentId, featureBranch.id);

      const deleted = versionControlService.deleteBranch(featureBranch.id);
      expect(deleted).toBe(false);
    });
  });

  describe('Version History', () => {
    it('should get complete version history', () => {
      // Create multiple versions and branches
      const firstCommit: CommitInfo = { message: 'First', author: testAuthor };
      const secondCommit: CommitInfo = { message: 'Second', author: testAuthor };

      versionControlService.createVersion(testDocumentId, testProjectId, 'First content', firstCommit);
      versionControlService.createVersion(testDocumentId, testProjectId, 'Second content', secondCommit);

      const featureBranch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'feature',
        'Feature branch',
        testAuthor
      );

      const history = versionControlService.getVersionHistory(testDocumentId);

      expect(history.documentId).toBe(testDocumentId);
      expect(history.projectId).toBe(testProjectId);
      expect(history.versions.length).toBe(2);
      expect(history.branches.length).toBe(2); // main + feature
      expect(history.currentBranchId).toBeTruthy();
      expect(history.currentVersionId).toBeTruthy();
    });
  });

  describe('Diff and Comparison', () => {
    it('should calculate diff between versions', () => {
      const firstContent = 'Line 1\nLine 2\nLine 3';
      const secondContent = 'Line 1\nLine 2 modified\nLine 3\nLine 4';

      const firstCommit: CommitInfo = { message: 'First', author: testAuthor };
      const secondCommit: CommitInfo = { message: 'Second', author: testAuthor };

      const firstVersion = versionControlService.createVersion(testDocumentId, testProjectId, firstContent, firstCommit);
      const secondVersion = versionControlService.createVersion(testDocumentId, testProjectId, secondContent, secondCommit);

      const comparison = versionControlService.compareVersions(firstVersion.id, secondVersion.id);

      expect(comparison).toBeTruthy();
      expect(comparison!.diff.additions.length).toBeGreaterThan(0);
      expect(comparison!.diff.modifications.length).toBeGreaterThan(0);
      expect(comparison!.diff.statistics.linesAdded).toBe(1);
      expect(comparison!.diff.statistics.linesModified).toBe(1);
      expect(comparison!.similarity).toBeGreaterThan(0);
      expect(comparison!.similarity).toBeLessThan(1);
    });

    it('should return null for comparison with non-existent versions', () => {
      const firstContent = 'Some content';
      const firstCommit: CommitInfo = { message: 'First', author: testAuthor };
      const firstVersion = versionControlService.createVersion(testDocumentId, testProjectId, firstContent, firstCommit);

      const comparison = versionControlService.compareVersions(firstVersion.id, 'non-existent');
      expect(comparison).toBeNull();
    });
  });

  describe('Merge Operations', () => {
    let mainBranch: DocumentBranch;
    let featureBranch: DocumentBranch;
    let mainVersion: DocumentVersion;
    let featureVersion: DocumentVersion;

    beforeEach(() => {
      // Set up branches with different content
      const mainCommit: CommitInfo = { message: 'Main content', author: testAuthor };
      mainVersion = versionControlService.createVersion(
        testDocumentId,
        testProjectId,
        'Main branch content',
        mainCommit
      );

      featureBranch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'feature',
        'Feature branch',
        testAuthor
      );

      // Switch to feature branch and create different content
      versionControlService.switchBranch(testDocumentId, featureBranch.id);
      const featureCommit: CommitInfo = { message: 'Feature content', author: testAuthor };
      featureVersion = versionControlService.createVersion(
        testDocumentId,
        testProjectId,
        'Feature branch content',
        featureCommit
      );

      // Switch back to main
      const branches = versionControlService.getBranches(testDocumentId);
      mainBranch = branches.find(b => b.isMainBranch)!;
      versionControlService.switchBranch(testDocumentId, mainBranch.id);
    });

    it('should create merge request', () => {
      const mergeRequest = versionControlService.createMergeRequest(
        featureBranch.id,
        mainBranch.id,
        'Merge feature into main',
        'This merges the feature branch back into main',
        testAuthor
      );

      expect(mergeRequest.id).toBeTruthy();
      expect(mergeRequest.title).toBe('Merge feature into main');
      expect(mergeRequest.sourceBranchId).toBe(featureBranch.id);
      expect(mergeRequest.targetBranchId).toBe(mainBranch.id);
      expect(mergeRequest.author).toBe(testAuthor);
      expect(mergeRequest.status).toBe('open');
      expect(mergeRequest.reviewComments).toEqual([]);
      expect(mergeRequest.approvals).toEqual([]);
    });

    it('should detect conflicts in merge request', () => {
      // Create conflicting content
      const conflictingCommit: CommitInfo = { message: 'Conflicting main', author: testAuthor };
      versionControlService.createVersion(
        testDocumentId,
        testProjectId,
        'Conflicting main content',
        conflictingCommit
      );

      const mergeRequest = versionControlService.createMergeRequest(
        featureBranch.id,
        mainBranch.id,
        'Conflicting merge',
        'This should have conflicts',
        testAuthor
      );

      expect(mergeRequest.conflicts).toBeDefined();
      expect(mergeRequest.conflicts!.length).toBeGreaterThan(0);
    });

    it('should merge branches successfully', () => {
      const mergeRequest = versionControlService.createMergeRequest(
        featureBranch.id,
        mainBranch.id,
        'Clean merge',
        'This should merge cleanly',
        testAuthor
      );

      // Resolve any conflicts if they exist
      if (mergeRequest.conflicts && mergeRequest.conflicts.length > 0) {
        mergeRequest.conflicts.forEach(conflict => {
          conflict.resolution = conflict.sourceContent; // Prefer source content
          conflict.resolvedBy = testAuthor;
          conflict.resolvedAt = new Date();
        });
      }

      const mergedVersion = versionControlService.mergeBranches(mergeRequest.id, testAuthor);

      expect(mergedVersion).toBeTruthy();
      expect(mergedVersion!.metadata.mergeSourceIds).toHaveLength(2);
      expect(mergedVersion!.title).toContain('Merge');
      expect(mergedVersion!.metadata.isMajorVersion).toBe(true);

      // Merge request should be marked as merged
      const updatedMergeRequest = versionControlService['mergeRequests'].get(mergeRequest.id);
      expect(updatedMergeRequest?.status).toBe('merged');
      expect(updatedMergeRequest?.mergedBy).toBe(testAuthor);
      expect(updatedMergeRequest?.mergeCommitId).toBe(mergedVersion!.id);
    });

    it('should throw error when merging with unresolved conflicts', () => {
      const mergeRequest = versionControlService.createMergeRequest(
        featureBranch.id,
        mainBranch.id,
        'Conflicted merge',
        'This has unresolved conflicts',
        testAuthor
      );

      // Add unresolved conflict
      if (!mergeRequest.conflicts) {
        mergeRequest.conflicts = [];
      }
      mergeRequest.conflicts.push({
        id: 'test-conflict',
        type: 'content',
        location: { line: 1, column: 1 },
        conflictDescription: 'Test conflict',
        sourceContent: 'Source content',
        targetContent: 'Target content'
        // No resolution provided
      });

      expect(() => {
        versionControlService.mergeBranches(mergeRequest.id, testAuthor);
      }).toThrow('Cannot merge with unresolved conflicts');
    });

    it('should add review comments to merge request', () => {
      const mergeRequest = versionControlService.createMergeRequest(
        featureBranch.id,
        mainBranch.id,
        'Review test',
        'Testing review comments',
        testAuthor
      );

      const comment = versionControlService.addReviewComment(
        mergeRequest.id,
        'This looks good but consider changing line 5',
        'Reviewer',
        'suggestion',
        5
      );

      expect(comment.id).toBeTruthy();
      expect(comment.content).toBe('This looks good but consider changing line 5');
      expect(comment.author).toBe('Reviewer');
      expect(comment.type).toBe('suggestion');
      expect(comment.line).toBe(5);
      expect(comment.isResolved).toBe(false);

      // Check that comment was added to merge request
      const updatedMergeRequest = versionControlService['mergeRequests'].get(mergeRequest.id);
      expect(updatedMergeRequest?.reviewComments).toHaveLength(1);
    });

    it('should throw error when adding comment to non-existent merge request', () => {
      expect(() => {
        versionControlService.addReviewComment(
          'non-existent',
          'Comment',
          'Author'
        );
      }).toThrow('Merge request not found');
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get version statistics', () => {
      // Create some test data
      const firstCommit: CommitInfo = { message: 'First', author: 'Author1' };
      const secondCommit: CommitInfo = { message: 'Second', author: 'Author2' };

      versionControlService.createVersion(testDocumentId, testProjectId, 'Content 1', firstCommit);
      versionControlService.createVersion(testDocumentId, testProjectId, 'Content 2', secondCommit);

      const featureBranch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'feature',
        'Feature branch',
        'Author1'
      );

      const stats = versionControlService.getVersionStatistics();

      expect(stats.totalVersions).toBe(2);
      expect(stats.totalBranches).toBe(2); // main + feature
      expect(stats.activeBranches).toBe(1); // only main is active
      expect(stats.mergeRequests.open).toBe(0);
      expect(stats.mergeRequests.merged).toBe(0);
      expect(stats.mergeRequests.closed).toBe(0);
      expect(stats.recentActivity.length).toBeGreaterThan(0);
      expect(stats.topContributors.length).toBeGreaterThan(0);
    });

    it('should filter statistics by project', () => {
      const otherProjectId = 'other-project';
      const otherDocumentId = 'other-doc';

      // Create data for test project
      const testCommit: CommitInfo = { message: 'Test', author: testAuthor };
      versionControlService.createVersion(testDocumentId, testProjectId, 'Test content', testCommit);

      // Create data for other project
      const otherCommit: CommitInfo = { message: 'Other', author: testAuthor };
      versionControlService.createVersion(otherDocumentId, otherProjectId, 'Other content', otherCommit);

      // Get stats filtered by test project
      const testProjectStats = versionControlService.getVersionStatistics(testProjectId);
      const allProjectsStats = versionControlService.getVersionStatistics();

      expect(testProjectStats.totalVersions).toBe(1);
      expect(allProjectsStats.totalVersions).toBe(2);
    });
  });

  describe('Event Handling', () => {
    it('should emit version created event', () => {
      const versionCreatedSpy = vi.fn();
      versionControlService.on('versionCreated', versionCreatedSpy);

      const commitInfo: CommitInfo = { message: 'Test', author: testAuthor };
      const version = versionControlService.createVersion(testDocumentId, testProjectId, 'Content', commitInfo);

      expect(versionCreatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          version,
          branch: expect.any(Object)
        })
      );
    });

    it('should emit branch created event', () => {
      const branchCreatedSpy = vi.fn();
      versionControlService.on('branchCreated', branchCreatedSpy);

      // Create initial version first
      const commitInfo: CommitInfo = { message: 'Initial', author: testAuthor };
      versionControlService.createVersion(testDocumentId, testProjectId, 'Content', commitInfo);

      const branch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'test-branch',
        'Test branch',
        testAuthor
      );

      expect(branchCreatedSpy).toHaveBeenCalledWith(branch);
    });

    it('should emit branch switched event', () => {
      const branchSwitchedSpy = vi.fn();
      versionControlService.on('branchSwitched', branchSwitchedSpy);

      // Create initial version and branch
      const commitInfo: CommitInfo = { message: 'Initial', author: testAuthor };
      versionControlService.createVersion(testDocumentId, testProjectId, 'Content', commitInfo);

      const branch = versionControlService.createBranch(
        testDocumentId,
        testProjectId,
        'test-branch',
        'Test branch',
        testAuthor
      );

      versionControlService.switchBranch(testDocumentId, branch.id);

      expect(branchSwitchedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: testDocumentId,
          branchId: branch.id,
          branch
        })
      );
    });
  });

  describe('Data Persistence', () => {
    it('should persist version control data to localStorage', () => {
      const commitInfo: CommitInfo = { message: 'Persistence test', author: testAuthor };
      versionControlService.createVersion(testDocumentId, testProjectId, 'Test content', commitInfo);

      const stored = localStorage.getItem('astral_notes_version_control');
      expect(stored).toBeTruthy();

      const parsedData = JSON.parse(stored!);
      expect(parsedData).toHaveProperty('versions');
      expect(parsedData).toHaveProperty('branches');
      expect(parsedData).toHaveProperty('mergeRequests');
      expect(Array.isArray(parsedData.versions)).toBe(true);
      expect(parsedData.versions.length).toBeGreaterThan(0);
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('astral_notes_version_control', 'invalid json');

      // Should not throw error and should continue working
      expect(() => {
        const commitInfo: CommitInfo = { message: 'Test after corruption', author: testAuthor };
        versionControlService.createVersion(testDocumentId, testProjectId, 'Test content', commitInfo);
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty content', () => {
      const commitInfo: CommitInfo = { message: 'Empty content', author: testAuthor };
      const version = versionControlService.createVersion(testDocumentId, testProjectId, '', commitInfo);

      expect(version.content).toBe('');
      expect(version.metadata.wordCount).toBe(0);
      expect(version.metadata.characterCount).toBe(0);
    });

    it('should handle very large content efficiently', () => {
      const largeContent = 'word '.repeat(10000); // 10k words
      const commitInfo: CommitInfo = { message: 'Large content', author: testAuthor };

      const startTime = Date.now();
      const version = versionControlService.createVersion(testDocumentId, testProjectId, largeContent, commitInfo);
      const endTime = Date.now();

      expect(version.metadata.wordCount).toBe(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should be reasonably fast
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Content with special chars: 中文 العربية 🚀 ∆∑∞ @#$%^&*()';
      const commitInfo: CommitInfo = { message: 'Special chars', author: testAuthor };
      
      const version = versionControlService.createVersion(testDocumentId, testProjectId, specialContent, commitInfo);
      
      expect(version.content).toBe(specialContent);
      expect(version.metadata.characterCount).toBe(specialContent.length);
    });

    it('should handle multiple documents independently', () => {
      const doc1 = 'document-1';
      const doc2 = 'document-2';
      const commitInfo: CommitInfo = { message: 'Test', author: testAuthor };

      const version1 = versionControlService.createVersion(doc1, testProjectId, 'Doc 1 content', commitInfo);
      const version2 = versionControlService.createVersion(doc2, testProjectId, 'Doc 2 content', commitInfo);

      expect(version1.documentId).toBe(doc1);
      expect(version2.documentId).toBe(doc2);

      const history1 = versionControlService.getVersionHistory(doc1);
      const history2 = versionControlService.getVersionHistory(doc2);

      expect(history1.versions.length).toBe(1);
      expect(history2.versions.length).toBe(1);
      expect(history1.versions[0].id).toBe(version1.id);
      expect(history2.versions[0].id).toBe(version2.id);
    });

    it('should handle concurrent autosaves correctly', () => {
      const baseContent = 'Base content';
      const change1 = 'Base content with change 1';
      const change2 = 'Base content with change 2';

      // Create base version
      const commitInfo: CommitInfo = { message: 'Base', author: testAuthor };
      versionControlService.createVersion(testDocumentId, testProjectId, baseContent, commitInfo);

      // Create multiple autosaves
      const autosave1 = versionControlService.createAutosaveVersion(testDocumentId, testProjectId, change1, testAuthor);
      const autosave2 = versionControlService.createAutosaveVersion(testDocumentId, testProjectId, change2, testAuthor);

      expect(autosave1.versionNumber).toBe(1.1);
      expect(autosave2.versionNumber).toBe(1.2);
      expect(autosave1.content).toBe(change1);
      expect(autosave2.content).toBe(change2);
    });
  });
});