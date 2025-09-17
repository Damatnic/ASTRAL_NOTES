/**
 * Live Cursors Component
 * Real-time cursor tracking and user presence visualization
 * Shows exactly where collaborators are working with smooth animations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Edit3, 
  Eye, 
  MessageCircle,
  MousePointer2,
  Typing,
  Crown,
  UserCheck
} from 'lucide-react';
import { 
  collaborationService, 
  type CollaborationUser, 
  type PresenceData,
  type CursorPosition 
} from '../../services/collaborationService';
import { Badge } from '../ui/Badge';

interface LiveCursorsProps {
  documentId: string;
  editorRef: React.RefObject<HTMLElement>;
  className?: string;
  showUserList?: boolean;
  onUserClick?: (user: CollaborationUser) => void;
}

interface AnimatedCursor {
  user: CollaborationUser;
  position: { x: number; y: number };
  isVisible: boolean;
  isTyping: boolean;
  lastUpdate: Date;
}

interface UserPresence {
  user: CollaborationUser;
  isActive: boolean;
  isTyping: boolean;
  lastSeen: Date;
  documentPosition?: string; // Which part of the document they're viewing
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  documentId,
  editorRef,
  className = '',
  showUserList = true,
  onUserClick
}) => {
  const [cursors, setCursors] = useState<Map<string, AnimatedCursor>>(new Map());
  const [presence, setPresence] = useState<Map<string, UserPresence>>(new Map());
  const [localCursor, setLocalCursor] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const cursorUpdateTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const localUser = collaborationService.getLocalUser();

  // Track mouse movement and cursor position
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isTracking || !editorRef.current) return;

    const editorRect = editorRef.current.getBoundingClientRect();
    const x = event.clientX - editorRect.left;
    const y = event.clientY - editorRect.top;

    // Only update if cursor is within editor bounds
    if (x >= 0 && x <= editorRect.width && y >= 0 && y <= editorRect.height) {
      setLocalCursor({ x, y });
      
      // Send cursor position to collaboration service
      collaborationService.updateCursor(documentId, x, y);
    }
  }, [documentId, isTracking, editorRef]);

  // Track text selection
  const handleSelectionChange = useCallback(() => {
    if (!isTracking) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      collaborationService.updateSelection(
        documentId,
        range.startOffset,
        range.endOffset
      );
    }
  }, [documentId, isTracking]);

  // Set up event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      editor.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleMouseMove, handleSelectionChange]);

  // Set up collaboration event listeners
  useEffect(() => {
    const handleUserPresence = (presenceData: PresenceData) => {
      if (presenceData.userId === localUser?.id) return;

      // Update cursor position
      if (presenceData.cursor) {
        setCursors(prev => {
          const newCursors = new Map(prev);
          const user = collaborationService.getActiveUsers().find(u => u.id === presenceData.userId);
          
          if (user) {
            // Clear existing timeout
            const existingTimeout = cursorUpdateTimeoutRef.current.get(presenceData.userId);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            // Update cursor
            newCursors.set(presenceData.userId, {
              user,
              position: { x: presenceData.cursor.position, y: 0 }, // Convert text position to screen coords
              isVisible: true,
              isTyping: presenceData.isTyping,
              lastUpdate: new Date()
            });

            // Hide cursor after inactivity
            const timeout = setTimeout(() => {
              setCursors(current => {
                const updated = new Map(current);
                const cursor = updated.get(presenceData.userId);
                if (cursor) {
                  updated.set(presenceData.userId, {
                    ...cursor,
                    isVisible: false
                  });
                }
                return updated;
              });
            }, 5000);

            cursorUpdateTimeoutRef.current.set(presenceData.userId, timeout);
          }

          return newCursors;
        });
      }

      // Update presence data
      setPresence(prev => {
        const newPresence = new Map(prev);
        const user = collaborationService.getActiveUsers().find(u => u.id === presenceData.userId);
        
        if (user) {
          newPresence.set(presenceData.userId, {
            user,
            isActive: true,
            isTyping: presenceData.isTyping,
            lastSeen: new Date(),
            documentPosition: presenceData.activeElement
          });
        }

        return newPresence;
      });

      // Handle typing indicator
      if (presenceData.isTyping) {
        setTypingUsers(prev => new Set(prev).add(presenceData.userId));
        
        // Clear typing indicator after timeout
        const existingTypingTimeout = typingTimeoutRef.current.get(presenceData.userId);
        if (existingTypingTimeout) {
          clearTimeout(existingTypingTimeout);
        }

        const typingTimeout = setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(presenceData.userId);
            return updated;
          });
        }, 3000);

        typingTimeoutRef.current.set(presenceData.userId, typingTimeout);
      } else {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(presenceData.userId);
          return updated;
        });
      }
    };

    const handleUserJoin = (user: CollaborationUser) => {
      setPresence(prev => {
        const newPresence = new Map(prev);
        newPresence.set(user.id, {
          user,
          isActive: true,
          isTyping: false,
          lastSeen: new Date()
        });
        return newPresence;
      });
    };

    const handleUserLeave = (userId: string) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });

      setPresence(prev => {
        const newPresence = new Map(prev);
        newPresence.delete(userId);
        return newPresence;
      });

      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });

      // Clear timeouts
      const cursorTimeout = cursorUpdateTimeoutRef.current.get(userId);
      if (cursorTimeout) {
        clearTimeout(cursorTimeout);
        cursorUpdateTimeoutRef.current.delete(userId);
      }

      const typingTimeout = typingTimeoutRef.current.get(userId);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeoutRef.current.delete(userId);
      }
    };

    // Subscribe to collaboration events
    const unsubscribePresence = collaborationService.on('user:presence', handleUserPresence);
    const unsubscribeJoin = collaborationService.on('user:join', handleUserJoin);
    const unsubscribeLeave = collaborationService.on('user:leave', handleUserLeave);

    return () => {
      unsubscribePresence();
      unsubscribeJoin();
      unsubscribeLeave();
      
      // Clear all timeouts
      cursorUpdateTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [localUser?.id]);

  // Convert text position to screen coordinates
  const getScreenPosition = useCallback((textPosition: number): { x: number; y: number } => {
    if (!editorRef.current) return { x: 0, y: 0 };

    try {
      // Create a range at the text position
      const range = document.createRange();
      const textNode = editorRef.current.firstChild;
      
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        range.setStart(textNode, Math.min(textPosition, textNode.textContent?.length || 0));
        range.collapse(true);
        
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        
        return {
          x: rect.left - editorRect.left,
          y: rect.top - editorRect.top
        };
      }
    } catch (error) {
      console.warn('Error converting text position to screen coordinates:', error);
    }

    return { x: 0, y: 0 };
  }, [editorRef]);

  // Generate user color based on user ID
  const getUserColor = useCallback((userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  const activeUsers = Array.from(presence.values()).filter(p => p.isActive);
  const session = collaborationService.getSession();

  return (
    <div className={`live-cursors relative ${className}`}>
      {/* Cursor Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <AnimatePresence>
          {Array.from(cursors.entries()).map(([userId, cursor]) => {
            if (!cursor.isVisible || userId === localUser?.id) return null;

            const color = getUserColor(userId);
            const position = getScreenPosition(cursor.position.x);

            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: position.x,
                  y: position.y
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute pointer-events-none"
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
              >
                {/* Cursor Pointer */}
                <motion.div
                  className="relative"
                  animate={{ 
                    rotate: cursor.isTyping ? [0, -5, 5, 0] : 0 
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: cursor.isTyping ? Infinity : 0 
                  }}
                >
                  <MousePointer2 
                    className="w-5 h-5" 
                    style={{ color }} 
                    fill={color}
                  />
                  
                  {/* User Label */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-6 left-0 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md whitespace-nowrap"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    <div className="flex items-center gap-1">
                      {cursor.user.name}
                      {cursor.isTyping && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Typing className="w-3 h-3" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Selection Highlight */}
                  {cursor.user.cursor?.selection && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      className="absolute top-0 left-0 h-5 rounded"
                      style={{ 
                        backgroundColor: color,
                        width: Math.abs(
                          cursor.user.cursor.selection.end - cursor.user.cursor.selection.start
                        ) * 8 // Approximate character width
                      }}
                    />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* User Presence List */}
      {showUserList && activeUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-20 bg-black/80 backdrop-blur-sm rounded-lg p-3 min-w-[200px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">
              Active Users ({activeUsers.length})
            </span>
          </div>

          <div className="space-y-2">
            {activeUsers.map(({ user, isTyping, lastSeen }) => {
              const color = getUserColor(user.id);
              const isOwner = session?.owner === user.id;
              const isCurrentUser = user.id === localUser?.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    isCurrentUser ? 'bg-blue-500/20' : 'hover:bg-white/10'
                  }`}
                  onClick={() => onUserClick?.(user)}
                >
                  {/* User Avatar/Indicator */}
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-white truncate">
                        {isCurrentUser ? 'You' : user.name}
                      </span>
                      {isOwner && (
                        <Crown className="w-3 h-3 text-yellow-400" />
                      )}
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="flex items-center gap-1 mt-1">
                      {user.status === 'editing' && (
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          <Edit3 className="w-2 h-2 mr-1" />
                          Editing
                        </Badge>
                      )}
                      
                      {isTyping && (
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="flex items-center"
                          >
                            <Typing className="w-2 h-2 mr-1" />
                            Typing
                          </motion.div>
                        </Badge>
                      )}
                      
                      {user.status === 'online' && !isTyping && (
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          <Eye className="w-2 h-2 mr-1" />
                          Viewing
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {!isCurrentUser && (
                      <button
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add comment or message functionality
                        }}
                      >
                        <MessageCircle className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Typing Indicators */}
          {typingUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/20"
            >
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Typing className="w-3 h-3" />
                </motion.div>
                <span>
                  {Array.from(typingUsers)
                    .map(userId => {
                      const user = activeUsers.find(p => p.user.id === userId)?.user;
                      return user?.name || 'Someone';
                    })
                    .join(', ')}{' '}
                  {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
            <button
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isTracking 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}
              onClick={() => setIsTracking(!isTracking)}
            >
              {isTracking ? 'Tracking On' : 'Tracking Off'}
            </button>

            <span className="text-xs text-gray-500">
              Live Collaboration
            </span>
          </div>
        </motion.div>
      )}

      {/* Local Cursor Indicator */}
      {localCursor && isTracking && (
        <motion.div
          className="absolute pointer-events-none z-5"
          style={{ 
            left: localCursor.x, 
            top: localCursor.y,
            transform: 'translate(-2px, -2px)' 
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-1 h-5 bg-blue-500 rounded-full shadow-lg" />
        </motion.div>
      )}
    </div>
  );
};