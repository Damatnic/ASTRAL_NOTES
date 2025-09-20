import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  isTyping: boolean;
  lastActivity: number;
}

interface CollaborationOperation {
  id: string;
  type: 'insert' | 'delete' | 'format' | 'move';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  metadata?: any;
}

interface UseCollaborationOptions {
  documentId: string;
  userId: string;
  userName: string;
  wsUrl?: string;
  onUserJoin?: (user: CollaborationUser) => void;
  onUserLeave?: (userId: string) => void;
  onOperationReceived?: (operation: CollaborationOperation) => void;
  onCursorUpdate?: (userId: string, cursor: { x: number; y: number }) => void;
}

interface UseCollaborationReturn {
  users: CollaborationUser[];
  isConnected: boolean;
  sendOperation: (operation: Omit<CollaborationOperation, 'id' | 'userId' | 'timestamp'>) => void;
  sendCursorUpdate: (x: number, y: number) => void;
  sendTypingStatus: (isTyping: boolean) => void;
  applyOperation: (operation: CollaborationOperation) => boolean;
  transformOperation: (operation: CollaborationOperation, against: CollaborationOperation) => CollaborationOperation;
  getActiveUsers: () => CollaborationUser[];
  disconnect: () => void;
}

export const useCollaboration = (options: UseCollaborationOptions): UseCollaborationReturn => {
  const {
    documentId,
    userId,
    userName,
    wsUrl = 'ws://localhost:3001/collaboration',
    onUserJoin,
    onUserLeave,
    onOperationReceived,
    onCursorUpdate
  } = options;

  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const operationQueue = useRef<CollaborationOperation[]>([]);
  const appliedOperations = useRef<Set<string>>(new Set());

  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      handleWebSocketMessage(message);
    },
    onOpen: () => {
      // Join the collaboration session
      sendMessage('join', {
        documentId,
        userId,
        userName
      });
    },
    onClose: () => {
      setUsers([]);
    }
  });

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'user_joined':
        const newUser: CollaborationUser = {
          id: message.data.userId,
          name: message.data.userName,
          avatar: message.data.avatar,
          isTyping: false,
          lastActivity: Date.now()
        };
        setUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);
        onUserJoin?.(newUser);
        break;

      case 'user_left':
        setUsers(prev => prev.filter(u => u.id !== message.data.userId));
        onUserLeave?.(message.data.userId);
        break;

      case 'operation':
        const operation: CollaborationOperation = message.data;
        if (!appliedOperations.current.has(operation.id)) {
          applyOperation(operation);
          onOperationReceived?.(operation);
        }
        break;

      case 'cursor_update':
        const { userId: cursorUserId, cursor } = message.data;
        setUsers(prev => prev.map(user =>
          user.id === cursorUserId
            ? { ...user, cursor, lastActivity: Date.now() }
            : user
        ));
        onCursorUpdate?.(cursorUserId, cursor);
        break;

      case 'typing_status':
        const { userId: typingUserId, isTyping } = message.data;
        setUsers(prev => prev.map(user =>
          user.id === typingUserId
            ? { ...user, isTyping, lastActivity: Date.now() }
            : user
        ));
        break;

      case 'users_list':
        setUsers(message.data.users || []);
        break;
    }
  }, [onUserJoin, onUserLeave, onOperationReceived, onCursorUpdate]);

  const sendOperation = useCallback((operation: Omit<CollaborationOperation, 'id' | 'userId' | 'timestamp'>) => {
    if (!isConnected) return;

    const fullOperation: CollaborationOperation = {
      ...operation,
      id: `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: Date.now()
    };

    // Apply locally first
    applyOperation(fullOperation);

    // Send to other users
    sendMessage('operation', fullOperation);
  }, [isConnected, userId, sendMessage]);

  const sendCursorUpdate = useCallback((x: number, y: number) => {
    if (!isConnected) return;

    sendMessage('cursor_update', {
      documentId,
      cursor: { x, y }
    });
  }, [isConnected, documentId, sendMessage]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!isConnected) return;

    sendMessage('typing_status', {
      documentId,
      isTyping
    });
  }, [isConnected, documentId, sendMessage]);

  const applyOperation = useCallback((operation: CollaborationOperation): boolean => {
    if (appliedOperations.current.has(operation.id)) {
      return false; // Already applied
    }

    // Transform operation against pending operations
    let transformedOperation = operation;
    for (const pendingOp of operationQueue.current) {
      if (pendingOp.timestamp < operation.timestamp) {
        transformedOperation = transformOperation(transformedOperation, pendingOp);
      }
    }

    // Apply the operation (this would integrate with your document model)
    // For now, we just mark it as applied
    appliedOperations.current.add(operation.id);

    // Add to operation queue for future transformations
    operationQueue.current.push(transformedOperation);

    // Clean up old operations (keep last 100)
    if (operationQueue.current.length > 100) {
      const removedOp = operationQueue.current.shift();
      if (removedOp) {
        appliedOperations.current.delete(removedOp.id);
      }
    }

    return true;
  }, []);

  const transformOperation = useCallback((operation: CollaborationOperation, against: CollaborationOperation): CollaborationOperation => {
    // Basic operational transformation for text operations
    // This is a simplified version - real OT is more complex
    
    if (operation.type === 'insert' && against.type === 'insert') {
      if (operation.position >= against.position) {
        return {
          ...operation,
          position: operation.position + (against.content?.length || 0)
        };
      }
    } else if (operation.type === 'insert' && against.type === 'delete') {
      if (operation.position > against.position) {
        return {
          ...operation,
          position: operation.position - (against.length || 0)
        };
      }
    } else if (operation.type === 'delete' && against.type === 'insert') {
      if (operation.position >= against.position) {
        return {
          ...operation,
          position: operation.position + (against.content?.length || 0)
        };
      }
    } else if (operation.type === 'delete' && against.type === 'delete') {
      if (operation.position > against.position) {
        return {
          ...operation,
          position: operation.position - (against.length || 0)
        };
      } else if (operation.position === against.position) {
        // Concurrent delete at same position - keep one
        return operation.timestamp > against.timestamp ? operation : against;
      }
    }

    return operation;
  }, []);

  const getActiveUsers = useCallback((): CollaborationUser[] => {
    const now = Date.now();
    const threshold = 30000; // 30 seconds
    return users.filter(user => now - user.lastActivity < threshold);
  }, [users]);

  const disconnect = useCallback(() => {
    if (isConnected) {
      sendMessage('leave', { documentId, userId });
    }
  }, [isConnected, sendMessage, documentId, userId]);

  // Clean up inactive users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const threshold = 60000; // 1 minute
      setUsers(prev => prev.filter(user => now - user.lastActivity < threshold));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    users,
    isConnected,
    sendOperation,
    sendCursorUpdate,
    sendTypingStatus,
    applyOperation,
    transformOperation,
    getActiveUsers,
    disconnect
  };
};