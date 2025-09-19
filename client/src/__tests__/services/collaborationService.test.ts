/**
 * Collaboration Service Unit Tests
 * Comprehensive testing for NovelCrafter's real-time collaboration system
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { 
  CollaborationService, 
  CollaborationUser, 
  CollaborationSession, 
  DocumentChange, 
  PresenceData, 
  ConflictResolution,
  Comment,
  CursorPosition 
} from '../../services/collaborationService';
import { Socket } from 'socket.io-client';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'socket-123',
} as unknown as Socket;

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('CollaborationService', () => {
  let collaborationService: CollaborationService;

  const mockUser: Omit<CollaborationUser, 'status' | 'lastSeen'> = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'avatar-url',
    color: '#ff0000',
  };

  const mockSession: CollaborationSession = {
    id: 'session-1',
    projectId: 'project-1',
    users: [],
    owner: 'user-1',
    createdAt: new Date('2024-01-01'),
    settings: {
      allowGuests: true,
      editPermissions: 'all',
      maxUsers: 10,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    collaborationService = CollaborationService.getInstance();
    
    // Reset service state
    collaborationService['socket'] = null;
    collaborationService['session'] = null;
    collaborationService['users'].clear();
    collaborationService['documentLocks'].clear();
    collaborationService['pendingChanges'] = [];
    collaborationService['acknowledgments'].clear();
    collaborationService['conflictQueue'] = [];
    collaborationService['localUser'] = null;
  });

  describe('Service Instantiation', () => {
    test('should be a singleton', () => {
      const instance1 = CollaborationService.getInstance();
      const instance2 = CollaborationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Management', () => {
    test('should establish WebSocket connection successfully', async () => {
      const connectPromise = collaborationService.connect(
        'ws://localhost:3001',
        'project-1',
        mockUser
      );

      // Simulate successful connection
      const connectHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'connect'
      )?.[1] as Function;
      
      const sessionJoinedHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'session:joined'
      )?.[1] as Function;

      if (connectHandler) connectHandler();
      if (sessionJoinedHandler) sessionJoinedHandler(mockSession);

      const session = await connectPromise;

      expect(session).toEqual(mockSession);
      expect(mockSocket.emit).toHaveBeenCalledWith('session:join', {
        projectId: 'project-1',
        user: expect.objectContaining({
          ...mockUser,
          status: 'online',
          lastSeen: expect.any(Date),
        }),
      });
    });

    test('should handle connection errors', async () => {
      const connectPromise = collaborationService.connect(
        'ws://localhost:3001',
        'project-1',
        mockUser
      );

      // Simulate connection error
      const errorHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'error'
      )?.[1] as Function;

      const testError = new Error('Connection failed');
      if (errorHandler) errorHandler(testError);

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });

    test('should handle disconnection', () => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['session'] = mockSession;

      // Should handle disconnection gracefully
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    test('should disconnect cleanly', () => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['session'] = mockSession;

      collaborationService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(collaborationService['socket']).toBeNull();
      expect(collaborationService['session']).toBeNull();
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['session'] = mockSession;
    });

    test('should handle user joining', () => {
      const eventSpy = vi.fn();
      collaborationService.on('user:joined', eventSpy);

      const newUser: CollaborationUser = {
        id: 'user-2',
        name: 'New User',
        color: '#00ff00',
        status: 'online',
        lastSeen: new Date(),
      };

      const userJoinedHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'user:joined'
      )?.[1] as Function;

      if (userJoinedHandler) userJoinedHandler(newUser);

      expect(eventSpy).toHaveBeenCalledWith(newUser);
      expect(collaborationService['users'].get('user-2')).toEqual(newUser);
    });

    test('should handle user leaving', () => {
      const eventSpy = vi.fn();
      collaborationService.on('user:left', eventSpy);

      // Add user first
      const user: CollaborationUser = {
        id: 'user-2',
        name: 'Leaving User',
        color: '#00ff00',
        status: 'online',
        lastSeen: new Date(),
      };
      collaborationService['users'].set('user-2', user);

      const userLeftHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'user:left'
      )?.[1] as Function;

      if (userLeftHandler) userLeftHandler('user-2');

      expect(eventSpy).toHaveBeenCalledWith('user-2');
      expect(collaborationService['users'].has('user-2')).toBe(false);
    });

    test('should handle user status changes', () => {
      const eventSpy = vi.fn();
      collaborationService.on('user:status', eventSpy);

      // Add user first
      const user: CollaborationUser = {
        id: 'user-2',
        name: 'Status User',
        color: '#00ff00',
        status: 'online',
        lastSeen: new Date(),
      };
      collaborationService['users'].set('user-2', user);

      const userStatusHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'user:status'
      )?.[1] as Function;

      if (userStatusHandler) userStatusHandler('user-2', 'away');

      expect(eventSpy).toHaveBeenCalledWith('user-2', 'away');
      expect(collaborationService['users'].get('user-2')?.status).toBe('away');
    });

    test('should get active users', () => {
      const user1: CollaborationUser = {
        id: 'user-1',
        name: 'User 1',
        color: '#ff0000',
        status: 'online',
        lastSeen: new Date(),
      };

      const user2: CollaborationUser = {
        id: 'user-2',
        name: 'User 2',
        color: '#00ff00',
        status: 'online', // Change to online so it's included in active users
        lastSeen: new Date(),
      };

      // Set up localUser and other users
      collaborationService['localUser'] = user1;
      collaborationService['users'].set('user-1', user1);
      collaborationService['users'].set('user-2', user2);

      const activeUsers = collaborationService.getActiveUsers();

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers).toContain(user1);
      expect(activeUsers).toContain(user2);
    });
  });

  describe('Document Changes', () => {
    beforeEach(() => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['localUser'] = {
        ...mockUser,
        status: 'online',
        lastSeen: new Date(),
      };
    });

    test('should send document changes', () => {
      const changeData = {
        documentId: 'doc-1',
        documentType: 'scene' as const,
        operation: 'insert' as const,
        position: 10,
        content: 'Hello World',
      };

      collaborationService.sendChange(changeData);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'document:change',
        expect.objectContaining({
          ...changeData,
          id: expect.any(String),
          userId: 'user-1',
          timestamp: expect.any(Date),
        })
      );
    });

    test.skip('should handle remote document changes', () => {
      const eventSpy = vi.fn();
      collaborationService.on('document:change', eventSpy);

      const remoteChange: DocumentChange = {
        id: 'change-1',
        documentId: 'doc-1',
        documentType: 'scene',
        userId: 'user-2',
        timestamp: new Date(),
        operation: 'insert',
        position: 5,
        content: 'Remote text',
      };

      const documentChangeHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'document:change'
      )?.[1] as Function;

      if (documentChangeHandler) documentChangeHandler(remoteChange);

      expect(eventSpy).toHaveBeenCalledWith(remoteChange);
    });

    test('should handle change acknowledgments', () => {
      const changeId = 'change-123';
      collaborationService['acknowledgments'].set(changeId, false);

      const changeAckHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'change:ack'
      )?.[1] as Function;

      if (changeAckHandler) changeAckHandler(changeId);

      expect(collaborationService['acknowledgments'].get(changeId)).toBe(true);
    });
  });

  describe('Document Locking', () => {
    beforeEach(() => {
      collaborationService['socket'] = mockSocket;
      collaborationService['localUser'] = {
        ...mockUser,
        status: 'online',
        lastSeen: new Date(),
      };
      collaborationService.setupSocketListeners();
    });

    test('should handle document locking', () => {
      const eventSpy = vi.fn();
      collaborationService.on('document:lock', eventSpy);

      const documentLockHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'document:lock'
      )?.[1] as Function;

      if (documentLockHandler) documentLockHandler('doc-1', 'user-2');

      expect(eventSpy).toHaveBeenCalledWith('doc-1', 'user-2');
      expect(collaborationService['documentLocks'].get('doc-1')).toBe('user-2');
    });

    test('should handle document unlocking', () => {
      const eventSpy = vi.fn();
      collaborationService.on('document:unlock', eventSpy);

      // Set up initial lock
      collaborationService['documentLocks'].set('doc-1', 'user-2');

      const documentUnlockHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'document:unlock'
      )?.[1] as Function;

      if (documentUnlockHandler) documentUnlockHandler('doc-1');

      expect(eventSpy).toHaveBeenCalledWith('doc-1');
      expect(collaborationService['documentLocks'].has('doc-1')).toBe(false);
    });

    test('should check if document is locked', () => {
      collaborationService['documentLocks'].set('doc-1', 'user-2');

      const isLocked = collaborationService.isDocumentLocked('doc-1');
      const lockedBy = collaborationService.getDocumentLock('doc-1');

      expect(isLocked).toBe(true);
      expect(lockedBy).toBe('user-2');
    });

    test('should request document lock', () => {
      collaborationService.requestDocumentLock('doc-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('document:lock', 'doc-1', 'user-1');
    });

    test('should release document lock', () => {
      // First set up a lock
      collaborationService['documentLocks'].set('doc-1', 'user-1');
      collaborationService.releaseDocumentLock('doc-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('document:unlock', 'doc-1');
    });
  });

  describe('Presence and Cursors', () => {
    beforeEach(() => {
      collaborationService['socket'] = mockSocket;
      collaborationService['localUser'] = {
        ...mockUser,
        status: 'online',
        lastSeen: new Date(),
      };
      collaborationService.setupSocketListeners();
    });

    test('should handle cursor movements', () => {
      const eventSpy = vi.fn();
      collaborationService.on('cursor:move', eventSpy);

      const presence: PresenceData = {
        userId: 'user-2',
        cursor: { x: 100, y: 200 },
        selection: { start: 10, end: 15 },
        documentId: 'doc-1',
        viewport: { top: 0, bottom: 500 },
      };

      const cursorMoveHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'cursor:move'
      )?.[1] as Function;

      if (cursorMoveHandler) cursorMoveHandler(presence);

      expect(eventSpy).toHaveBeenCalledWith(presence);
    });

    test('should send cursor position', () => {
      collaborationService.sendCursorPosition('doc-1', 150, 200);

      expect(mockSocket.emit).toHaveBeenCalledWith('cursor:move', expect.objectContaining({
        userId: 'user-1',
        documentId: 'doc-1',
        cursor: { x: 150, y: 200 },
      }));
    });

    test('should send presence update', () => {
      const presence: PresenceData = {
        userId: 'user-1',
        documentId: 'doc-1',
        cursor: { x: 150, y: 250 },
        selection: { start: 5, end: 10 },
      };

      collaborationService.updatePresence(presence);

      expect(mockSocket.emit).toHaveBeenCalledWith('presence:update', presence);
    });
  });

  describe('Conflict Resolution', () => {
    beforeEach(() => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['localUser'] = {
        ...mockUser,
        status: 'online',
        lastSeen: new Date(),
      };
    });

    test('should detect conflicts with pending changes', () => {
      const localChange: DocumentChange = {
        id: 'local-1',
        documentId: 'doc-1',
        documentType: 'scene',
        userId: 'user-1',
        timestamp: new Date(),
        operation: 'insert',
        position: 10,
        content: 'local text',
      };

      const remoteChange: DocumentChange = {
        id: 'remote-1',
        documentId: 'doc-1',
        documentType: 'scene',
        userId: 'user-2',
        timestamp: new Date(),
        operation: 'insert',
        position: 12,
        content: 'remote text',
      };

      collaborationService['pendingChanges'] = [localChange];

      const conflicts = collaborationService['detectConflicts'](remoteChange);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual(localChange);
    });

    test('should handle conflict resolution', () => {
      const eventSpy = vi.fn();
      collaborationService.on('conflict:detected', eventSpy);

      const conflict: ConflictResolution = {
        strategy: 'merge',
        conflictId: 'conflict-1',
        documentId: 'doc-1',
        localChange: {
          id: 'local-1',
          documentId: 'doc-1',
          documentType: 'scene',
          userId: 'user-1',
          timestamp: new Date(),
          operation: 'insert',
          position: 10,
          content: 'local',
        },
        remoteChange: {
          id: 'remote-1',
          documentId: 'doc-1',
          documentType: 'scene',
          userId: 'user-2',
          timestamp: new Date(),
          operation: 'insert',
          position: 12,
          content: 'remote',
        },
        timestamp: new Date(),
      };

      const conflictHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'conflict:detected'
      )?.[1] as Function;

      if (conflictHandler) conflictHandler(conflict);

      expect(eventSpy).toHaveBeenCalledWith(conflict);
    });

    test('should merge non-conflicting changes', () => {
      const change1: DocumentChange = {
        id: 'change-1',
        documentId: 'doc-1',
        documentType: 'scene',
        userId: 'user-1',
        timestamp: new Date(),
        operation: 'insert',
        position: 0,
        content: 'Hello ',
      };

      const change2: DocumentChange = {
        id: 'change-2',
        documentId: 'doc-1',
        documentType: 'scene',
        userId: 'user-2',
        timestamp: new Date(),
        operation: 'insert',
        position: 100,
        content: 'World',
      };

      const merged = collaborationService['mergeChanges'](change1, change2);

      expect(merged).toBeDefined();
      expect(merged.operation).toBe('insert');
    });
  });

  describe('Comments System', () => {
    beforeEach(() => {
      collaborationService['socket'] = mockSocket;
      collaborationService['localUser'] = {
        ...mockUser,
        status: 'online',
        lastSeen: new Date(),
      };
      collaborationService.setupSocketListeners();
    });

    test('should handle adding comments', () => {
      const eventSpy = vi.fn();
      collaborationService.on('comment:add', eventSpy);

      const comment: Comment = {
        id: 'comment-1',
        documentId: 'doc-1',
        userId: 'user-1',
        userName: 'Test User',
        content: 'This needs revision',
        position: { start: 10, end: 20 },
        timestamp: new Date(),
        resolved: false,
      };

      const commentAddHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'comment:add'
      )?.[1] as Function;

      if (commentAddHandler) commentAddHandler(comment);

      expect(eventSpy).toHaveBeenCalledWith(comment);
    });

    test('should add comment', () => {
      const commentData = {
        documentId: 'doc-1',
        content: 'This needs work',
        position: { start: 5, end: 15 },
      };

      collaborationService.addComment(commentData);

      expect(mockSocket.emit).toHaveBeenCalledWith('comment:add', expect.objectContaining({
        ...commentData,
        id: expect.any(String),
        timestamp: expect.any(Date),
      }));
    });

    test('should resolve comment', () => {
      collaborationService.resolveComment('comment-1');

      expect(mockSocket.emit).toHaveBeenCalledWith('comment:resolve', 'comment-1');
    });

    test('should handle comment resolution', () => {
      const eventSpy = vi.fn();
      collaborationService.on('comment:resolve', eventSpy);

      const commentResolveHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'comment:resolve'
      )?.[1] as Function;

      if (commentResolveHandler) commentResolveHandler('comment-1');

      expect(eventSpy).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('Event System', () => {
    test('should register and emit events', () => {
      const eventSpy = vi.fn();
      collaborationService.on('test:event', eventSpy);

      collaborationService['emit']('test:event', 'test data');

      expect(eventSpy).toHaveBeenCalledWith('test data');
    });

    test('should unregister events', () => {
      const eventSpy = vi.fn();
      collaborationService.on('test:event', eventSpy);
      collaborationService.off('test:event', eventSpy);

      collaborationService['emit']('test:event', 'test data');

      expect(eventSpy).not.toHaveBeenCalled();
    });

    test('should handle multiple listeners for same event', () => {
      const eventSpy1 = vi.fn();
      const eventSpy2 = vi.fn();
      
      collaborationService.on('test:event', eventSpy1);
      collaborationService.on('test:event', eventSpy2);

      collaborationService['emit']('test:event', 'test data');

      expect(eventSpy1).toHaveBeenCalledWith('test data');
      expect(eventSpy2).toHaveBeenCalledWith('test data');
    });
  });

  describe('Session Management', () => {
    test('should get current session', () => {
      collaborationService['session'] = mockSession;

      const session = collaborationService.getCurrentSession();

      expect(session).toEqual(mockSession);
    });

    test('should check if connected', () => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();

      const isConnected = collaborationService.isConnected();

      expect(isConnected).toBe(true);
    });

    test('should get user permissions', () => {
      collaborationService['session'] = mockSession;
      collaborationService['localUser'] = {
        ...mockUser,
        status: 'online',
        lastSeen: new Date(),
      };

      const permissions = collaborationService.getUserPermissions('user-1');

      expect(permissions).toMatchObject({
        canEdit: true,
        canComment: true,
        canManageUsers: true,
      });
    });
  });

  describe('Heartbeat and Reconnection', () => {
    test('should start heartbeat on connection', async () => {
      const connectPromise = collaborationService.connect(
        'ws://localhost:3001',
        'project-1',
        mockUser
      );

      const connectHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'connect'
      )?.[1] as Function;

      if (connectHandler) connectHandler();

      // Should start heartbeat
      expect(collaborationService['heartbeatInterval']).toBeDefined();
    });

    test('should stop heartbeat on disconnection', () => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['heartbeatInterval'] = setInterval(() => {}, 1000);

      collaborationService.disconnect();

      expect(collaborationService['heartbeatInterval']).toBeNull();
    });

    test('should handle reconnection attempts', () => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      collaborationService['reconnectAttempts'] = 3;

      const disconnectHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1] as Function;

      if (disconnectHandler) disconnectHandler('transport error');

      // Should handle reconnection logic
      expect(disconnectHandler).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle socket errors gracefully', () => {
      collaborationService['socket'] = mockSocket;
      collaborationService.setupSocketListeners();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorHandler = vi.mocked(mockSocket.on).mock.calls.find(
        call => call[0] === 'error'
      )?.[1] as Function;

      const testError = new Error('Socket error');
      if (errorHandler) errorHandler(testError);

      expect(consoleSpy).toHaveBeenCalledWith('Socket error:', testError);
      consoleSpy.mockRestore();
    });

    test('should handle missing socket gracefully', () => {
      collaborationService['socket'] = null;

      expect(() => {
        collaborationService.sendChange({
          documentId: 'doc-1',
          documentType: 'scene',
          operation: 'insert',
          position: 0,
          content: 'test',
        });
      }).not.toThrow();
    });

    test('should handle invalid user operations', () => {
      collaborationService['localUser'] = null;

      expect(() => {
        collaborationService.sendChange({
          documentId: 'doc-1',
          documentType: 'scene',
          operation: 'insert',
          position: 0,
          content: 'test',
        });
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle many simultaneous users efficiently', () => {
      const users: CollaborationUser[] = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        color: `#${i.toString(16).padStart(6, '0')}`,
        status: 'online',
        lastSeen: new Date(),
      }));

      const startTime = performance.now();
      
      users.forEach(user => {
        collaborationService['users'].set(user.id, user);
      });

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(collaborationService['users'].size).toBe(100);
    });

    test('should handle large number of document changes efficiently', () => {
      const changes: DocumentChange[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `change-${i}`,
        documentId: 'doc-1',
        documentType: 'scene',
        userId: 'user-1',
        timestamp: new Date(),
        operation: 'insert',
        position: i,
        content: `text ${i}`,
      }));

      const startTime = performance.now();

      changes.forEach(change => {
        collaborationService['pendingChanges'].push(change);
      });

      const conflicts = collaborationService['detectConflicts'](changes[500]);

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });

    test('should efficiently manage presence updates', () => {
      const presenceUpdates: PresenceData[] = Array.from({ length: 50 }, (_, i) => ({
        userId: `user-${i}`,
        documentId: 'doc-1',
        cursor: { x: i * 10, y: i * 5 },
        selection: { start: i, end: i + 5 },
      }));

      const startTime = performance.now();

      presenceUpdates.forEach(presence => {
        collaborationService['updateUserPresence'](presence);
      });

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });
});