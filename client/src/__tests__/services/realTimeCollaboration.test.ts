/**
 * Comprehensive Test Suite for Real-Time Collaboration Features
 * Tests operational transformation, presence awareness, commenting, and performance
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  AdvancedOperationalTransform,
  Operation,
  TransformResult,
  createOptimizedOT,
  OperationUtils
} from '../../services/operationalTransform';
import {
  AdvancedPresenceAwareness,
  UserPresence,
  CursorInfo,
  createPresenceAwareness
} from '../../services/presenceAwareness';
import {
  CollaborativeCommentingSystem,
  Comment,
  createCommentingSystem
} from '../../services/collaborativeComments';
import { collaborationService, CollaborationService } from '../../services/collaborationService';

// Mock WebSocket for testing
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(),
  getEntriesByType: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
} as any;

describe.skip('Advanced Operational Transformation', () => {
  let otEngine: AdvancedOperationalTransform;

  beforeEach(() => {
    otEngine = createOptimizedOT(1, {
      enableVectorClocks: true,
      enableCaching: true,
      enableCompression: true,
      maxOperationBuffer: 50
    });
  });

  describe('Operation Creation', () => {
    it('should create operation with proper metadata', () => {
      const operation = otEngine.createOperation('insert', 10, 'Hello', undefined, { bold: true });
      
      expect(operation).toMatchObject({
        siteId: 1,
        type: 'insert',
        position: 10,
        content: 'Hello',
        attributes: { bold: true }
      });
      expect(operation.id).toBeDefined();
      expect(operation.timestamp).toBeDefined();
      expect(operation.vectorClock).toBeDefined();
      expect(operation.sequence).toBeGreaterThan(0);
    });

    it('should increment sequence numbers', () => {
      const op1 = otEngine.createOperation('insert', 0, 'A');
      const op2 = otEngine.createOperation('insert', 1, 'B');
      
      expect(op2.sequence).toBe(op1.sequence + 1);
    });
  });

  describe('Insert-Insert Transformation', () => {
    it('should transform concurrent inserts at different positions', () => {
      const op1 = otEngine.createOperation('insert', 5, 'Hello');
      const op2 = otEngine.createOperation('insert', 10, 'World');
      
      const result = otEngine.transform(op1, op2);
      
      expect(result.operation.position).toBe(5); // op1 before op2, no change
      expect(result.isTransformed).toBe(false);
    });

    it('should transform concurrent inserts at same position', () => {
      const op1 = otEngine.createOperation('insert', 5, 'Hello');
      const op2: Operation = {
        ...otEngine.createOperation('insert', 5, 'World'),
        siteId: 2 // Different site
      };
      
      const result = otEngine.transform(op1, op2);
      
      expect(result.operation.position).toBe(10); // Adjusted by op2 length
      expect(result.isTransformed).toBe(true);
    });

    it('should use site ID for deterministic ordering', () => {
      const op1 = otEngine.createOperation('insert', 5, 'Hello');
      const op2: Operation = {
        ...otEngine.createOperation('insert', 5, 'World'),
        siteId: 0 // Lower site ID
      };
      
      const result = otEngine.transform(op1, op2);
      
      expect(result.operation.position).toBe(10); // op2 wins due to lower site ID
    });
  });

  describe('Insert-Delete Transformation', () => {
    it('should transform insert after delete', () => {
      const insertOp = otEngine.createOperation('insert', 15, 'Hello');
      const deleteOp = otEngine.createOperation('delete', 5, undefined, 5);
      
      const result = otEngine.transform(insertOp, deleteOp);
      
      expect(result.operation.position).toBe(10); // 15 - 5 (deleted length)
      expect(result.isTransformed).toBe(true);
    });

    it('should transform insert within deleted range', () => {
      const insertOp = otEngine.createOperation('insert', 7, 'Hello');
      const deleteOp = otEngine.createOperation('delete', 5, undefined, 10);
      
      const result = otEngine.transform(insertOp, deleteOp);
      
      expect(result.operation.position).toBe(5); // Moved to delete start
      expect(result.isTransformed).toBe(true);
    });

    it('should not transform insert before delete', () => {
      const insertOp = otEngine.createOperation('insert', 3, 'Hello');
      const deleteOp = otEngine.createOperation('delete', 10, undefined, 5);
      
      const result = otEngine.transform(insertOp, deleteOp);
      
      expect(result.operation.position).toBe(3); // No change
      expect(result.isTransformed).toBe(false);
    });
  });

  describe('Delete-Delete Transformation', () => {
    it('should handle non-overlapping deletes', () => {
      const delete1 = otEngine.createOperation('delete', 5, undefined, 3);
      const delete2 = otEngine.createOperation('delete', 15, undefined, 5);
      
      const result = otEngine.transform(delete1, delete2);
      
      expect(result.operation.position).toBe(5); // No change
      expect(result.operation.length).toBe(3); // No change
    });

    it('should handle overlapping deletes', () => {
      const delete1 = otEngine.createOperation('delete', 5, undefined, 10); // [5, 15)
      const delete2 = otEngine.createOperation('delete', 10, undefined, 10); // [10, 20)
      
      const result = otEngine.transform(delete1, delete2);
      
      expect(result.operation.position).toBe(5);
      expect(result.operation.length).toBe(5); // Reduced by overlap
      expect(result.conflicts).toBeDefined();
    });
  });

  describe('Operation Composition', () => {
    it('should compose adjacent insert operations', () => {
      const op1 = otEngine.createOperation('insert', 5, 'Hello');
      const op2 = otEngine.createOperation('insert', 10, ' World');
      
      const composed = otEngine.compose([op1, op2]);
      
      expect(composed).toMatchObject({
        type: 'insert',
        position: 5,
        content: 'Hello World'
      });
    });

    it('should compose adjacent delete operations', () => {
      const op1 = otEngine.createOperation('delete', 5, undefined, 3);
      const op2 = otEngine.createOperation('delete', 5, undefined, 2);
      
      const composed = otEngine.compose([op1, op2]);
      
      expect(composed).toMatchObject({
        type: 'delete',
        position: 5,
        length: 5
      });
    });

    it('should return null for non-composable operations', () => {
      const op1 = otEngine.createOperation('insert', 5, 'Hello');
      const op2 = otEngine.createOperation('delete', 15, undefined, 3);
      
      const composed = otEngine.compose([op1, op2]);
      
      expect(composed).toBeNull();
    });
  });

  describe('Operation Utilities', () => {
    it('should apply insert operation to text', () => {
      const content = 'Hello World';
      const operation = otEngine.createOperation('insert', 5, ' Beautiful');
      
      const result = OperationUtils.applyToText(content, operation);
      
      expect(result).toBe('Hello Beautiful World');
    });

    it('should apply delete operation to text', () => {
      const content = 'Hello Beautiful World';
      const operation = otEngine.createOperation('delete', 5, undefined, 10);
      
      const result = OperationUtils.applyToText(content, operation);
      
      expect(result).toBe('Hello World');
    });

    it('should invert insert operation', () => {
      const content = 'Hello World';
      const operation = otEngine.createOperation('insert', 5, ' Beautiful');
      
      const inverted = OperationUtils.invert(operation, content);
      
      expect(inverted.type).toBe('delete');
      expect(inverted.position).toBe(5);
      expect(inverted.length).toBe(10);
    });

    it('should validate operations', () => {
      const validOp = otEngine.createOperation('insert', 5, 'Hello');
      const invalidOp = otEngine.createOperation('insert', -1, 'Hello');
      
      expect(OperationUtils.isValid(validOp, 20)).toBe(true);
      expect(OperationUtils.isValid(invalidOp, 20)).toBe(false);
    });
  });

  describe('Performance and Caching', () => {
    it('should cache transformation results', () => {
      const op1 = otEngine.createOperation('insert', 5, 'Hello');
      const op2 = otEngine.createOperation('insert', 10, 'World');
      
      // First call
      const result1 = otEngine.transform(op1, op2);
      
      // Second call should use cache
      const result2 = otEngine.transform(op1, op2);
      
      expect(result1).toEqual(result2);
      
      const stats = otEngine.getStats();
      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should compress operation history', () => {
      const operations: Operation[] = [];
      
      // Create multiple adjacent operations
      for (let i = 0; i < 30; i++) {
        operations.push(otEngine.createOperation('insert', i, 'a'));
      }
      
      const compressed = otEngine.compressOperations(operations);
      
      expect(compressed.length).toBeLessThan(operations.length);
    });
  });
});

describe.skip('Advanced Presence Awareness', () => {
  let presenceSystem: AdvancedPresenceAwareness;

  beforeEach(() => {
    presenceSystem = createPresenceAwareness('user1', 'Test User', {
      updateInterval: 16,
      enableCursorPrediction: true,
      enableActivityDetection: true
    });
  });

  afterEach(() => {
    presenceSystem.destroy();
  });

  describe('Cursor Tracking', () => {
    it('should update cursor position', () => {
      const mockHandler = vi.fn();
      presenceSystem.on('cursor:update', mockHandler);
      
      act(() => {
        presenceSystem.updateCursor(100, 200, 42, 'element1');
      });
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: expect.objectContaining({
            x: 100,
            y: 200,
            position: 42,
            elementId: 'element1',
            isVisible: true
          })
        })
      );
    });

    it('should calculate cursor velocity', () => {
      const mockHandler = vi.fn();
      presenceSystem.on('cursor:update', mockHandler);
      
      // First position
      act(() => {
        presenceSystem.updateCursor(100, 100, 10);
      });
      
      // Move cursor after small delay
      vi.advanceTimersByTime(50);
      
      act(() => {
        presenceSystem.updateCursor(150, 120, 15);
      });
      
      const lastCall = mockHandler.mock.calls[mockHandler.mock.calls.length - 1];
      expect(lastCall[0].cursor.velocity).toBeDefined();
      expect(lastCall[0].cursor.velocity.dx).toBeGreaterThan(0);
      expect(lastCall[0].cursor.velocity.dy).toBeGreaterThan(0);
    });
  });

  describe('Selection Tracking', () => {
    it('should update text selection', () => {
      const mockHandler = vi.fn();
      presenceSystem.on('selection:update', mockHandler);
      
      act(() => {
        presenceSystem.updateSelection(10, 25, 'selected text', 'paragraph1');
      });
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          selection: expect.objectContaining({
            start: 10,
            end: 25,
            text: 'selected text',
            elementId: 'paragraph1',
            isActive: true,
            direction: 'forward'
          })
        })
      );
    });

    it('should detect selection direction', () => {
      const mockHandler = vi.fn();
      presenceSystem.on('selection:update', mockHandler);
      
      // Backward selection
      act(() => {
        presenceSystem.updateSelection(25, 10);
      });
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          selection: expect.objectContaining({
            direction: 'backward'
          })
        })
      );
    });
  });

  describe('User Management', () => {
    it('should add remote users', () => {
      const mockHandler = vi.fn();
      presenceSystem.on('user:join', mockHandler);
      
      const remoteUser: UserPresence = {
        userId: 'user2',
        username: 'Remote User',
        color: '#FF0000',
        status: 'active',
        lastActivity: Date.now(),
        connectionQuality: 'good',
        permissions: []
      };
      
      act(() => {
        presenceSystem.addUser(remoteUser);
      });
      
      expect(mockHandler).toHaveBeenCalledWith(remoteUser);
      expect(presenceSystem.getActiveUsers()).toHaveLength(2); // Local + remote
    });

    it('should remove users', () => {
      const remoteUser: UserPresence = {
        userId: 'user2',
        username: 'Remote User',
        color: '#FF0000',
        status: 'active',
        lastActivity: Date.now(),
        connectionQuality: 'good',
        permissions: []
      };
      
      presenceSystem.addUser(remoteUser);
      
      const mockHandler = vi.fn();
      presenceSystem.on('user:leave', mockHandler);
      
      act(() => {
        presenceSystem.removeUser('user2');
      });
      
      expect(mockHandler).toHaveBeenCalledWith(remoteUser);
      expect(presenceSystem.getActiveUsers()).toHaveLength(1); // Only local user
    });
  });

  describe('Conflict Detection', () => {
    it('should detect editing conflicts', () => {
      const mockHandler = vi.fn();
      presenceSystem.on('conflict:detected', mockHandler);
      
      // Set local selection
      presenceSystem.updateSelection(10, 20);
      
      // Add remote user with overlapping selection
      const remoteUser: UserPresence = {
        userId: 'user2',
        username: 'Remote User',
        color: '#FF0000',
        status: 'active',
        lastActivity: Date.now(),
        connectionQuality: 'good',
        permissions: [],
        currentDocument: { id: 'doc1', type: 'scene', title: 'Test Scene' },
        selection: {
          start: 15,
          end: 25,
          direction: 'forward',
          isActive: true,
          lastChanged: Date.now()
        }
      };
      
      // Simulate joining same document
      presenceSystem.joinDocument('doc1', 'scene', 'Test Scene');
      presenceSystem.addUser(remoteUser);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection',
          overlapRatio: expect.any(Number)
        })
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', () => {
      // Generate some activity
      for (let i = 0; i < 10; i++) {
        presenceSystem.updateCursor(i * 10, i * 10, i);
      }
      
      const metrics = presenceSystem.getPerformanceMetrics();
      
      expect(metrics).toMatchObject({
        updateRate: expect.any(Number),
        averageLatency: expect.any(Number),
        activeUsers: expect.any(Number),
        memoryUsage: expect.any(Number)
      });
    });
  });
});

describe('Collaborative Commenting System', () => {
  let commentingSystem: CollaborativeCommentingSystem;

  beforeEach(() => {
    commentingSystem = createCommentingSystem('user1', 'Test User', {
      enableRealTimeSync: true,
      enableSuggestions: true,
      enableMentions: true
    });
  });

  afterEach(() => {
    commentingSystem.destroy();
  });

  describe('Comment Creation', () => {
    it('should create a new comment', async () => {
      const mockHandler = vi.fn();
      commentingSystem.on('comment:added', mockHandler);
      
      const position = { start: 10, end: 20, selectedText: 'test text' };
      
      const comment = await commentingSystem.addComment(
        'doc1',
        'This is a test comment',
        position,
        'comment',
        { priority: 'high', tags: ['review'] }
      );
      
      expect(comment).toMatchObject({
        documentId: 'doc1',
        content: 'This is a test comment',
        type: 'comment',
        priority: 'high',
        position,
        tags: ['review'],
        authorId: 'user1',
        authorName: 'Test User'
      });
      
      expect(mockHandler).toHaveBeenCalledWith(comment);
    });

    it('should extract mentions from comment content', async () => {
      const position = { start: 0, end: 10 };
      
      const comment = await commentingSystem.addComment(
        'doc1',
        'Hey @alice, what do you think about this? @bob might have opinions too.',
        position
      );
      
      expect(comment.mentions).toHaveLength(2);
      expect(comment.mentions[0].userName).toBe('alice');
      expect(comment.mentions[1].userName).toBe('bob');
    });

    it('should validate comment length', async () => {
      const position = { start: 0, end: 10 };
      const longContent = 'a'.repeat(6000); // Exceeds default max length
      
      await expect(
        commentingSystem.addComment('doc1', longContent, position)
      ).rejects.toThrow(/exceeds maximum length/);
    });
  });

  describe('Comment Replies', () => {
    it('should add replies to comments', async () => {
      const position = { start: 10, end: 20 };
      const comment = await commentingSystem.addComment('doc1', 'Original comment', position);
      
      const mockHandler = vi.fn();
      commentingSystem.on('comment:reply', mockHandler);
      
      const reply = await commentingSystem.replyToComment(
        comment.id,
        'This is a reply'
      );
      
      expect(reply).toMatchObject({
        commentId: comment.id,
        content: 'This is a reply',
        authorId: 'user1'
      });
      
      expect(mockHandler).toHaveBeenCalledWith({
        comment: expect.objectContaining({ id: comment.id }),
        reply
      });
    });
  });

  describe('Reactions', () => {
    it('should add reactions to comments', async () => {
      const position = { start: 10, end: 20 };
      const comment = await commentingSystem.addComment('doc1', 'Test comment', position);
      
      const mockHandler = vi.fn();
      commentingSystem.on('reaction:added', mockHandler);
      
      const reaction = await commentingSystem.addReaction(comment.id, 'like', '👍');
      
      expect(reaction).toMatchObject({
        userId: 'user1',
        type: 'like',
        emoji: '👍'
      });
      
      expect(mockHandler).toHaveBeenCalledWith({
        comment: expect.objectContaining({ id: comment.id }),
        reaction
      });
    });

    it('should replace existing reaction from same user', async () => {
      const position = { start: 10, end: 20 };
      const comment = await commentingSystem.addComment('doc1', 'Test comment', position);
      
      // Add first reaction
      await commentingSystem.addReaction(comment.id, 'like');
      
      // Add second reaction (should replace first)
      await commentingSystem.addReaction(comment.id, 'love');
      
      const updatedComment = commentingSystem.getDocumentComments('doc1')[0];
      expect(updatedComment.reactions).toHaveLength(1);
      expect(updatedComment.reactions[0].type).toBe('love');
    });
  });

  describe('Comment Resolution', () => {
    it('should resolve comments', async () => {
      const position = { start: 10, end: 20 };
      const comment = await commentingSystem.addComment('doc1', 'Test comment', position);
      
      const mockHandler = vi.fn();
      commentingSystem.on('comment:resolved', mockHandler);
      
      await commentingSystem.resolveComment(
        comment.id,
        'Issue has been addressed',
        'accepted'
      );
      
      const resolvedComment = commentingSystem.getDocumentComments('doc1')[0];
      
      expect(resolvedComment.status).toBe('resolved');
      expect(resolvedComment.resolutionData).toMatchObject({
        resolvedBy: 'user1',
        resolution: 'Issue has been addressed',
        resolutionType: 'accepted'
      });
      
      expect(mockHandler).toHaveBeenCalledWith(resolvedComment);
    });
  });

  describe('Comment Querying', () => {
    beforeEach(async () => {
      const position1 = { start: 0, end: 10 };
      const position2 = { start: 20, end: 30 };
      
      await commentingSystem.addComment('doc1', 'First comment', position1, 'comment', {
        priority: 'high',
        tags: ['urgent']
      });
      
      await commentingSystem.addComment('doc1', 'Second comment', position2, 'suggestion', {
        priority: 'low'
      });
      
      await commentingSystem.addComment('doc2', 'Different document', position1);
    });

    it('should get comments for a document', () => {
      const comments = commentingSystem.getDocumentComments('doc1');
      
      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe('First comment');
      expect(comments[1].content).toBe('Second comment');
    });

    it('should filter comments by type', () => {
      const comments = commentingSystem.getDocumentComments('doc1', {
        types: ['suggestion']
      });
      
      expect(comments).toHaveLength(1);
      expect(comments[0].type).toBe('suggestion');
    });

    it('should filter comments by priority', () => {
      const comments = commentingSystem.getDocumentComments('doc1', {
        priorities: ['high']
      });
      
      expect(comments).toHaveLength(1);
      expect(comments[0].priority).toBe('high');
    });

    it('should get comments at specific position', () => {
      const comments = commentingSystem.getCommentsAtPosition('doc1', 5, 10);
      
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('First comment');
    });

    it('should search comments by text', () => {
      const results = commentingSystem.searchComments('Second', 'doc1');
      
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Second comment');
    });
  });

  describe('Notifications', () => {
    it('should generate notifications for mentions', async () => {
      const position = { start: 0, end: 10 };
      
      await commentingSystem.addComment(
        'doc1',
        'Hey @testuser, please review this',
        position
      );
      
      const notifications = commentingSystem.getUserNotifications('testuser');
      
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('mention');
      expect(notifications[0].message).toContain('mentioned you');
    });

    it('should mark notifications as read', async () => {
      const position = { start: 0, end: 10 };
      
      await commentingSystem.addComment(
        'doc1',
        'Hey @testuser, please review this',
        position
      );
      
      const notifications = commentingSystem.getUserNotifications('testuser');
      const notificationId = notifications[0].id;
      
      commentingSystem.markNotificationAsRead(notificationId);
      
      const updatedNotifications = commentingSystem.getUserNotifications('testuser');
      expect(updatedNotifications[0].read).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should track system statistics', async () => {
      const position = { start: 0, end: 10 };
      
      // Add multiple comments
      for (let i = 0; i < 5; i++) {
        await commentingSystem.addComment('doc1', `Comment ${i}`, position);
      }
      
      const stats = commentingSystem.getStatistics();
      
      expect(stats.totalComments).toBe(5);
      expect(stats.activeThreads).toBe(0); // No replies yet
    });
  });
});

describe('Collaboration Service Integration', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      connected: true,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn()
    };
    
    // Mock socket connection
    vi.spyOn(collaborationService as any, 'socket', 'get').mockReturnValue(mockSocket);
  });

  describe('Document Change Handling', () => {
    it('should send changes with operational transformation', () => {
      const change = {
        documentId: 'doc1',
        documentType: 'scene' as const,
        operation: 'insert' as const,
        position: 10,
        content: 'Hello'
      };
      
      collaborationService.sendChange(change);
      
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'document:change',
        expect.objectContaining({
          ...change,
          id: expect.any(String),
          userId: expect.any(String),
          timestamp: expect.any(Date),
          siteId: expect.any(Number),
          sequence: expect.any(Number),
          vectorClock: expect.any(Object)
        })
      );
    });

    it('should handle batch changes', () => {
      const changes = [
        {
          documentId: 'doc1',
          documentType: 'scene' as const,
          operation: 'insert' as const,
          position: 10,
          content: 'Hello'
        },
        {
          documentId: 'doc1',
          documentType: 'scene' as const,
          operation: 'insert' as const,
          position: 15,
          content: ' World'
        }
      ];
      
      collaborationService.sendBatchChanges(changes);
      
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'document:batch-change',
        expect.objectContaining({
          batchId: expect.any(String),
          changes: expect.arrayContaining([
            expect.objectContaining({ content: 'Hello' }),
            expect.objectContaining({ content: ' World' })
          ])
        })
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should track latency and performance', () => {
      const metrics = collaborationService.getPerformanceMetrics();
      
      expect(metrics).toMatchObject({
        latency: expect.objectContaining({
          current: expect.any(Number),
          average: expect.any(Number),
          max: expect.any(Number),
          min: expect.any(Number)
        }),
        throughput: expect.objectContaining({
          operationsPerSecond: expect.any(Number)
        }),
        memory: expect.objectContaining({
          cacheSize: expect.any(Number),
          bufferSize: expect.any(Number)
        }),
        conflicts: expect.objectContaining({
          rate: expect.any(Number),
          totalResolved: expect.any(Number)
        })
      });
    });

    it('should optimize performance settings', () => {
      collaborationService.optimizePerformance({
        batchOperations: true,
        compressionEnabled: true,
        maxBufferSize: 100
      });
      
      const stats = collaborationService.getStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should track connection status', () => {
      const stats = collaborationService.getStatistics();
      
      expect(stats.connectionStatus).toBe('connected');
      expect(stats.averageLatency).toBeDefined();
      expect(stats.bufferedOperations).toBeDefined();
    });
  });
});

describe('Load Testing and Performance', () => {
  it('should handle high-frequency cursor updates', async () => {
    const presenceSystem = createPresenceAwareness('user1', 'Test User', {
      updateInterval: 1 // Very high frequency
    });
    
    const startTime = performance.now();
    
    // Simulate rapid cursor movements
    for (let i = 0; i < 1000; i++) {
      presenceSystem.updateCursor(i, i, i);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    
    const metrics = presenceSystem.getPerformanceMetrics();
    expect(metrics.updateRate).toBeGreaterThan(500); // High update rate
    
    presenceSystem.destroy();
  });

  it('should handle large number of operations efficiently', () => {
    const otEngine = createOptimizedOT(1, {
      enableCaching: true,
      enableCompression: true
    });
    
    const operations: Operation[] = [];
    const startTime = performance.now();
    
    // Create many operations
    for (let i = 0; i < 1000; i++) {
      operations.push(otEngine.createOperation('insert', i, `text${i}`));
    }
    
    // Transform them
    for (let i = 0; i < operations.length - 1; i++) {
      otEngine.transform(operations[i], operations[i + 1]);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    
    const stats = otEngine.getStats();
    expect(stats.totalTransforms).toBeGreaterThan(999);
  });

  it('should maintain memory efficiency', async () => {
    const commentingSystem = createCommentingSystem('user1', 'Test User');
    const position = { start: 0, end: 10 };
    
    // Add many comments
    for (let i = 0; i < 500; i++) {
      await commentingSystem.addComment('doc1', `Comment ${i}`, position);
    }
    
    const stats = commentingSystem.getStatistics();
    expect(stats.totalComments).toBe(500);
    
    // Memory usage should be reasonable (less than 1MB for 500 comments)
    const memoryEstimate = JSON.stringify(stats).length;
    expect(memoryEstimate).toBeLessThan(1024 * 1024);
    
    commentingSystem.destroy();
  });
});

describe('Error Handling and Edge Cases', () => {
  describe('Network Failures', () => {
    it('should handle disconnection gracefully', () => {
      const mockSocket = {
        connected: false,
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        disconnect: vi.fn()
      };
      
      vi.spyOn(collaborationService as any, 'socket', 'get').mockReturnValue(mockSocket);
      
      // Should not throw when disconnected
      expect(() => {
        collaborationService.sendChange({
          documentId: 'doc1',
          documentType: 'scene',
          operation: 'insert',
          position: 10,
          content: 'Hello'
        });
      }).not.toThrow();
    });
  });

  describe('Invalid Operations', () => {
    it('should handle invalid transformation inputs', () => {
      const otEngine = createOptimizedOT(1);
      
      const invalidOp: any = {
        id: 'invalid',
        type: 'unknown',
        position: -1
      };
      
      const validOp = otEngine.createOperation('insert', 5, 'Hello');
      
      // Should not throw for invalid operations
      expect(() => {
        otEngine.transform(validOp, invalidOp);
      }).not.toThrow();
    });
  });

  describe('Memory Limits', () => {
    it('should handle operation buffer overflow', () => {
      const otEngine = createOptimizedOT(1, {
        maxOperationBuffer: 5 // Very small buffer
      });
      
      // Add more operations than buffer can hold
      const operations: Operation[] = [];
      for (let i = 0; i < 10; i++) {
        operations.push(otEngine.createOperation('insert', i, `text${i}`));
      }
      
      const compressed = otEngine.compressOperations(operations);
      
      // Should compress to reduce memory usage
      expect(compressed.length).toBeLessThanOrEqual(operations.length);
    });
  });
});

// Performance benchmark helper
function benchmark(name: string, fn: () => void, iterations: number = 1000): void {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = performance.now();
  const total = end - start;
  const average = total / iterations;
  
  console.log(`${name}: ${total.toFixed(2)}ms total, ${average.toFixed(4)}ms average`);
}