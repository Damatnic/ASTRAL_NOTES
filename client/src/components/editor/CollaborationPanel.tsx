/**
 * Collaboration Panel Component
 * Handles comments, annotations, sharing, and real-time collaboration features
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Users, 
  Share2, 
  Eye, 
  Edit, 
  Plus, 
  Send,
  Reply,
  Trash2,
  Pin,
  Check,
  Clock,
  Globe,
  Lock,
  UserPlus,
  Settings,
  Highlighter,
  MousePointer,
  Wifi,
  WifiOff,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import type { Editor } from '@tiptap/core';

interface CollaborationPanelProps {
  editor: Editor | null;
  content: string;
  noteId: string;
  currentUser: User;
  onShare?: (shareSettings: ShareSettings) => void;
  onCommentAdd?: (comment: Comment) => void;
  onAnnotationAdd?: (annotation: Annotation) => void;
  className?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen?: Date;
  cursor?: { position: number; color: string };
}

interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt?: Date;
  position?: { from: number; to: number };
  selectedText?: string;
  replies?: Comment[];
  isResolved: boolean;
  isPinned: boolean;
  mentions?: string[];
}

interface Annotation {
  id: string;
  type: 'highlight' | 'note' | 'bookmark';
  content?: string;
  author: User;
  createdAt: Date;
  position: { from: number; to: number };
  selectedText: string;
  color: string;
  isPublic: boolean;
}

interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowEditing: boolean;
  expiresAt?: Date;
  invitedUsers: Array<{ email: string; role: 'editor' | 'viewer' }>;
  shareLink?: string;
}

interface CollaborationActivity {
  id: string;
  type: 'comment' | 'edit' | 'annotation' | 'share' | 'join' | 'leave';
  user: User;
  timestamp: Date;
  details: string;
}

export function CollaborationPanel({
  editor,
  content,
  noteId,
  currentUser,
  onShare,
  onCommentAdd,
  onAnnotationAdd,
  className
}: CollaborationPanelProps) {
  const toast = useToast();
  
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [collaborators, setCollaborators] = useState<User[]>([currentUser]);
  const [isOnline, setIsOnline] = useState(true);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: true,
    allowEditing: false,
    invitedUsers: [],
  });
  const [activity, setActivity] = useState<CollaborationActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ from: number; to: number } | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [annotationColor, setAnnotationColor] = useState('#fbbf24');

  // Mock data for demonstration
  useEffect(() => {
    // Initialize with sample data
    const sampleComments: Comment[] = [
      {
        id: 'comment-1',
        content: 'This section could use more detail about the implementation approach.',
        author: {
          id: 'user-2',
          name: 'Sarah Chen',
          email: 'sarah@example.com',
          role: 'editor',
          isOnline: true,
          avatar: '/avatars/sarah.jpg',
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isResolved: false,
        isPinned: false,
        position: { from: 100, to: 150 },
        selectedText: 'implementation approach',
        replies: [
          {
            id: 'reply-1',
            content: 'I agree. I can add some code examples to clarify this.',
            author: currentUser,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            isResolved: false,
            isPinned: false,
          }
        ],
      },
    ];

    const sampleAnnotations: Annotation[] = [
      {
        id: 'annotation-1',
        type: 'highlight',
        content: 'Important concept',
        author: currentUser,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        position: { from: 200, to: 250 },
        selectedText: 'core functionality',
        color: '#fbbf24',
        isPublic: true,
      },
    ];

    setComments(sampleComments);
    setAnnotations(sampleAnnotations);
  }, [currentUser]);

  // Handle text selection
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to);
        setSelectedText(selectedText);
        setSelectionPosition({ from, to });
      } else {
        setSelectedText('');
        setSelectionPosition(null);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => editor.off('selectionUpdate', handleSelectionUpdate);
  }, [editor]);

  // Add comment
  const addComment = useCallback(() => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      author: currentUser,
      createdAt: new Date(),
      isResolved: false,
      isPinned: false,
      position: selectionPosition || undefined,
      selectedText: selectedText || undefined,
      replies: [],
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    onCommentAdd?.(comment);
    
    toast.success('Comment added');
  }, [newComment, currentUser, selectionPosition, selectedText, onCommentAdd, toast]);

  // Add annotation
  const addAnnotation = useCallback((type: Annotation['type'] = 'highlight') => {
    if (!selectionPosition || !selectedText) {
      toast.error('Please select text to annotate');
      return;
    }

    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type,
      author: currentUser,
      createdAt: new Date(),
      position: selectionPosition,
      selectedText,
      color: annotationColor,
      isPublic: true,
    };

    setAnnotations(prev => [...prev, annotation]);
    onAnnotationAdd?.(annotation);
    setShowAnnotationDialog(false);
    
    toast.success('Annotation added');
  }, [selectionPosition, selectedText, currentUser, annotationColor, onAnnotationAdd, toast]);

  // Resolve comment
  const resolveComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isResolved: !comment.isResolved }
        : comment
    ));
  }, []);

  // Delete comment
  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    toast.success('Comment deleted');
  }, [toast]);

  // Add reply to comment
  const addReply = useCallback((commentId: string, replyContent: string) => {
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      content: replyContent,
      author: currentUser,
      createdAt: new Date(),
      isResolved: false,
      isPinned: false,
    };

    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...(comment.replies || []), reply] }
        : comment
    ));
  }, [currentUser]);

  // Share note
  const shareNote = useCallback((settings: ShareSettings) => {
    setShareSettings(settings);
    onShare?.(settings);
    setShowShareDialog(false);
    toast.success('Share settings updated');
  }, [onShare, toast]);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const tabs: TabItem[] = [
    {
      id: 'comments',
      label: 'Comments',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: comments.filter(c => !c.isResolved).length.toString(),
      content: (
        <div className="space-y-4">
          {/* Add Comment */}
          <Card className="p-3">
            <div className="space-y-3">
              {selectedText && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <Highlighter className="h-3 w-3 inline mr-1" />
                  Selected: "{selectedText.substring(0, 50)}..."
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 border rounded text-sm resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {selectedText ? 'Comment on selection' : 'General comment'}
                </div>
                <Button
                  size="sm"
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  Comment
                </Button>
              </div>
            </div>
          </Card>

          {/* Comments List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                <p>No comments yet</p>
                <p className="text-sm">Start a conversation by adding a comment</p>
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className={cn("p-3", comment.isResolved && "opacity-60")}>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Avatar
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                          {comment.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                        </div>
                        
                        {comment.selectedText && (
                          <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded mb-2">
                            "{comment.selectedText}"
                          </div>
                        )}
                        
                        <p className="text-sm">{comment.content}</p>
                        
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveComment(comment.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {comment.isResolved ? 'Unresolve' : 'Resolve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteComment(comment.id)}
                            className="h-6 px-2 text-xs text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-4 mt-3 space-y-2 border-l pl-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={reply.author.avatar}
                                    alt={reply.author.name}
                                    size="xs"
                                  />
                                  <span className="font-medium text-xs">{reply.author.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs ml-6">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'annotations',
      label: 'Annotations',
      icon: <Highlighter className="h-4 w-4" />,
      badge: annotations.length.toString(),
      content: (
        <div className="space-y-4">
          {/* Add Annotation */}
          {selectedText && (
            <Card className="p-3">
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  Selected: "{selectedText.substring(0, 50)}..."
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => addAnnotation('highlight')}
                    className="flex items-center gap-1"
                  >
                    <Highlighter className="h-3 w-3" />
                    Highlight
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAnnotationDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Note
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Annotations List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {annotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Highlighter className="h-12 w-12 mx-auto mb-2" />
                <p>No annotations yet</p>
                <p className="text-sm">Select text to add highlights and notes</p>
              </div>
            ) : (
              annotations.map((annotation) => (
                <Card key={annotation.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div 
                        className="w-3 h-3 rounded-full mt-1" 
                        style={{ backgroundColor: annotation.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {annotation.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {annotation.author.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(annotation.createdAt)}
                          </span>
                        </div>
                        
                        <div className="text-xs bg-muted p-2 rounded mb-2">
                          "{annotation.selectedText}"
                        </div>
                        
                        {annotation.content && (
                          <p className="text-sm">{annotation.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'collaborators',
      label: 'People',
      icon: <Users className="h-4 w-4" />,
      badge: collaborators.length.toString(),
      content: (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 p-2 rounded bg-muted">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>

          {/* Collaborators List */}
          <div className="space-y-2">
            {collaborators.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                <div className="relative">
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    size="sm"
                  />
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{user.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.isOnline ? 'Online' : `Last seen ${user.lastSeen ? formatTimeAgo(user.lastSeen) : 'Unknown'}`}
                  </p>
                </div>
                {user.cursor && (
                  <Circle 
                    className="h-2 w-2" 
                    style={{ color: user.cursor.color }}
                    fill="currentColor"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Share Button */}
          <Button
            onClick={() => setShowShareDialog(true)}
            className="w-full flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite People
          </Button>
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Clock className="h-4 w-4" />,
      content: (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2" />
              <p>No recent activity</p>
            </div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2">
                <Avatar
                  src={item.user.avatar}
                  alt={item.user.name}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.user.name}</span>{' '}
                    {item.details}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className={cn("collaboration-panel w-80", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs tabs={tabs} variant="underline" />
      </CardContent>
    </Card>
  );
}

export default CollaborationPanel;