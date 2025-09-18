import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, MessageSquare, Settings, Activity, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface CollaborationPanelProps {
  projectId: string;
  documentId?: string;
  documentType?: 'scene' | 'note' | 'character' | 'location';
  onJoinSession?: () => void;
  onLeaveSession?: () => void;
}

interface Collaborator {
  userId: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastActivity: Date;
  isActive: boolean;
  currentDocument?: {
    id: string;
    type: string;
    title: string;
  };
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
}

interface ActiveSession {
  sessionId: string;
  documentId: string;
  documentType: string;
  documentTitle: string;
  participants: Collaborator[];
  startTime: Date;
  lastActivity: Date;
}

interface ConflictAlert {
  conflictId: string;
  documentId: string;
  documentTitle: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  participants: string[];
  detectedAt: Date;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId,
  documentId,
  documentType,
  onJoinSession,
  onLeaveSession
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [conflicts, setConflicts] = useState<ConflictAlert[]>([]);
  const [isInSession, setIsInSession] = useState(false);
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Real-time collaboration state
  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`ws://localhost:8001`);
    
    ws.onopen = () => {
      // Join project collaboration room
      ws.send(JSON.stringify({
        type: 'join-project',
        projectId
      }));

      if (documentId) {
        // Join document collaboration session
        ws.send(JSON.stringify({
          type: 'join-document',
          projectId,
          documentId,
          documentType
        }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'collaborators-update':
          setCollaborators(data.collaborators);
          break;
        case 'session-started':
          setActiveSessions(prev => [...prev, data.session]);
          break;
        case 'session-ended':
          setActiveSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
          break;
        case 'participant-joined':
          handleParticipantJoined(data);
          break;
        case 'participant-left':
          handleParticipantLeft(data);
          break;
        case 'conflict-detected':
          setConflicts(prev => [...prev, data.conflict]);
          break;
        case 'conflict-resolved':
          setConflicts(prev => prev.filter(c => c.conflictId !== data.conflictId));
          break;
        case 'cursor-updated':
          updateCollaboratorCursor(data);
          break;
      }
    };

    return () => {
      if (documentId) {
        ws.send(JSON.stringify({
          type: 'leave-document',
          documentId
        }));
      }
      ws.close();
    };
  }, [projectId, documentId, documentType]);

  const handleParticipantJoined = useCallback((data: any) => {
    setCollaborators(prev => {
      const existingIndex = prev.findIndex(c => c.userId === data.userId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], isActive: true, status: 'online' };
        return updated;
      } else {
        return [...prev, {
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          role: data.role || 'viewer',
          status: 'online',
          lastActivity: new Date(),
          isActive: true
        }];
      }
    });
  }, []);

  const handleParticipantLeft = useCallback((data: any) => {
    setCollaborators(prev => 
      prev.map(c => 
        c.userId === data.userId 
          ? { ...c, isActive: false, status: 'offline' }
          : c
      )
    );
  }, []);

  const updateCollaboratorCursor = useCallback((data: any) => {
    setCollaborators(prev =>
      prev.map(c =>
        c.userId === data.userId
          ? { ...c, cursor: data.cursor, lastActivity: new Date() }
          : c
      )
    );
  }, []);

  const handleJoinSession = () => {
    if (onJoinSession) {
      onJoinSession();
    }
    setIsInSession(true);
  };

  const handleLeaveSession = () => {
    if (onLeaveSession) {
      onLeaveSession();
    }
    setIsInSession(false);
    setCurrentSession(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'reviewer': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCollaborators = collaborators.filter(c => c.isActive);
  const totalCollaborators = collaborators.length;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Collaboration</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
          <span>{activeCollaborators.length} online</span>
          <span>{totalCollaborators} total</span>
          <span>{activeSessions.length} sessions</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Conflict Alerts */}
        {conflicts.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-medium text-gray-900">Conflicts</span>
              <Badge variant="destructive" size="sm">{conflicts.length}</Badge>
            </div>
            
            <div className="space-y-2">
              {conflicts.map(conflict => (
                <Card key={conflict.conflictId} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {conflict.documentTitle}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          className={getSeverityColor(conflict.severity)}
                          size="sm"
                        >
                          {conflict.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {conflict.participants.length} users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                    <Button size="sm" variant="destructive">
                      Resolve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-900">Active Sessions</span>
            </div>
            
            <div className="space-y-2">
              {activeSessions.map(session => (
                <Card key={session.sessionId} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {session.documentTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.participants.length} participants
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {session.participants.slice(0, 3).map(participant => (
                        <Avatar
                          key={participant.userId}
                          src={participant.avatar}
                          alt={participant.username}
                          size="sm"
                        />
                      ))}
                      {session.participants.length > 3 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{session.participants.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {session.sessionId !== currentSession?.sessionId ? (
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => setCurrentSession(session)}
                    >
                      Join Session
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => setCurrentSession(null)}
                    >
                      Leave Session
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Collaborators List */}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">Team Members</span>
          </div>
          
          <div className="space-y-2">
            {collaborators.map(collaborator => (
              <div 
                key={collaborator.userId}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="relative">
                  <Avatar
                    src={collaborator.avatar}
                    alt={collaborator.username}
                    size="sm"
                  />
                  <div 
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {collaborator.username}
                    </p>
                    <Badge 
                      className={getRoleColor(collaborator.role)}
                      size="sm"
                    >
                      {collaborator.role}
                    </Badge>
                  </div>
                  
                  {collaborator.currentDocument && (
                    <p className="text-xs text-gray-500 truncate">
                      Editing: {collaborator.currentDocument.title}
                    </p>
                  )}
                  
                  {collaborator.isActive && (
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600">Active now</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Session Controls */}
          {documentId && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {!isInSession ? (
                <Button 
                  className="w-full"
                  onClick={handleJoinSession}
                >
                  Start Collaboration Session
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>In collaboration session</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleLeaveSession}
                  >
                    Leave Session
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Collaboration Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Show cursor positions</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Real-time notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Auto-resolve conflicts</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm text-gray-700">Show activity indicators</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};