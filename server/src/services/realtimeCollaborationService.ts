import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

export interface CursorPosition {
  userId: string;
  username: string;
  documentId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
  timestamp: Date;
}

export interface OperationalTransform {
  id: string;
  userId: string;
  documentId: string;
  operation: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
  version: number;
}

export interface CollaborationSession {
  sessionId: string;
  projectId: string;
  documentId: string;
  documentType: 'scene' | 'note' | 'character' | 'location';
  participants: Array<{
    userId: string;
    username: string;
    joinedAt: Date;
    lastActivity: Date;
    isActive: boolean;
  }>;
  cursors: Map<string, CursorPosition>;
  operations: OperationalTransform[];
  version: number;
  lastModified: Date;
}

export class RealtimeCollaborationService {
  private sessions = new Map<string, CollaborationSession>();
  private userSessions = new Map<string, Set<string>>();

  constructor(
    private io: Server,
    private prisma: PrismaClient
  ) {
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId!;
      const user = socket.user!;

      // Document editing events
      socket.on('join-document', async (data: {
        projectId: string;
        documentId: string;
        documentType: 'scene' | 'note' | 'character' | 'location';
      }) => {
        await this.handleJoinDocument(socket, data);
      });

      socket.on('leave-document', (data: {
        documentId: string;
      }) => {
        this.handleLeaveDocument(socket, data);
      });

      socket.on('cursor-update', (data: {
        documentId: string;
        position: number;
        selection?: { start: number; end: number };
      }) => {
        this.handleCursorUpdate(socket, data);
      });

      socket.on('text-operation', async (data: {
        documentId: string;
        operation: OperationalTransform;
      }) => {
        await this.handleTextOperation(socket, data);
      });

      socket.on('request-document-state', (data: {
        documentId: string;
      }) => {
        this.handleDocumentStateRequest(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });
    });
  }

  private async handleJoinDocument(socket: any, data: {
    projectId: string;
    documentId: string;
    documentType: 'scene' | 'note' | 'character' | 'location';
  }) {
    try {
      const userId = socket.userId;
      const user = socket.user;

      // Verify user has access to the project
      const hasAccess = await this.verifyProjectAccess(userId, data.projectId);
      if (!hasAccess) {
        socket.emit('collaboration-error', { 
          message: 'Access denied to project',
          code: 'ACCESS_DENIED'
        });
        return;
      }

      // Get or create collaboration session
      const sessionId = `${data.projectId}-${data.documentId}`;
      let session = this.sessions.get(sessionId);

      if (!session) {
        // Create new session
        session = {
          sessionId,
          projectId: data.projectId,
          documentId: data.documentId,
          documentType: data.documentType,
          participants: [],
          cursors: new Map(),
          operations: [],
          version: 0,
          lastModified: new Date()
        };
        this.sessions.set(sessionId, session);
      }

      // Add user to session
      const existingParticipant = session.participants.find(p => p.userId === userId);
      if (!existingParticipant) {
        session.participants.push({
          userId,
          username: user.username,
          joinedAt: new Date(),
          lastActivity: new Date(),
          isActive: true
        });
      } else {
        existingParticipant.isActive = true;
        existingParticipant.lastActivity = new Date();
      }

      // Track user sessions
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(sessionId);

      // Join socket room
      socket.join(`doc-${data.documentId}`);

      // Send current state to new participant
      socket.emit('document-joined', {
        sessionId,
        participants: session.participants,
        cursors: Array.from(session.cursors.values()),
        version: session.version
      });

      // Notify other participants
      socket.to(`doc-${data.documentId}`).emit('participant-joined', {
        userId,
        username: user.username,
        joinedAt: new Date()
      });

      logger.info(`User ${userId} joined document ${data.documentId} in project ${data.projectId}`);
    } catch (error) {
      logger.error('Error handling join document:', error);
      socket.emit('collaboration-error', { 
        message: 'Failed to join document',
        code: 'JOIN_FAILED'
      });
    }
  }

  private handleLeaveDocument(socket: any, data: { documentId: string }) {
    try {
      const userId = socket.userId;
      const sessionId = this.findSessionByDocument(data.documentId);

      if (sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          // Mark participant as inactive
          const participant = session.participants.find(p => p.userId === userId);
          if (participant) {
            participant.isActive = false;
            participant.lastActivity = new Date();
          }

          // Remove cursor
          session.cursors.delete(userId);

          // Leave socket room
          socket.leave(`doc-${data.documentId}`);

          // Notify other participants
          socket.to(`doc-${data.documentId}`).emit('participant-left', {
            userId
          });

          // Update user sessions
          const userSessions = this.userSessions.get(userId);
          if (userSessions) {
            userSessions.delete(sessionId);
          }

          // Clean up session if no active participants
          const hasActiveParticipants = session.participants.some(p => p.isActive);
          if (!hasActiveParticipants) {
            this.sessions.delete(sessionId);
          }
        }
      }

      logger.info(`User ${userId} left document ${data.documentId}`);
    } catch (error) {
      logger.error('Error handling leave document:', error);
    }
  }

  private handleCursorUpdate(socket: any, data: {
    documentId: string;
    position: number;
    selection?: { start: number; end: number };
  }) {
    try {
      const userId = socket.userId;
      const user = socket.user;
      const sessionId = this.findSessionByDocument(data.documentId);

      if (sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          const cursor: CursorPosition = {
            userId,
            username: user.username,
            documentId: data.documentId,
            position: data.position,
            selection: data.selection,
            timestamp: new Date()
          };

          session.cursors.set(userId, cursor);

          // Broadcast cursor update to other participants
          socket.to(`doc-${data.documentId}`).emit('cursor-updated', cursor);

          // Update participant activity
          const participant = session.participants.find(p => p.userId === userId);
          if (participant) {
            participant.lastActivity = new Date();
          }
        }
      }
    } catch (error) {
      logger.error('Error handling cursor update:', error);
    }
  }

  private async handleTextOperation(socket: any, data: {
    documentId: string;
    operation: OperationalTransform;
  }) {
    try {
      const userId = socket.userId;
      const sessionId = this.findSessionByDocument(data.documentId);

      if (sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          // Validate operation
          if (data.operation.version !== session.version) {
            // Version conflict - request document state refresh
            socket.emit('version-conflict', {
              expectedVersion: session.version,
              receivedVersion: data.operation.version
            });
            return;
          }

          // Apply operational transformation
          const transformedOperation = await this.applyOperationalTransform(
            data.operation,
            session.operations
          );

          // Add operation to session
          session.operations.push(transformedOperation);
          session.version++;
          session.lastModified = new Date();

          // Update document in database
          await this.updateDocumentContent(
            data.documentId,
            session.documentType,
            transformedOperation
          );

          // Broadcast operation to other participants
          socket.to(`doc-${data.documentId}`).emit('text-operation-applied', {
            operation: transformedOperation,
            version: session.version
          });

          // Update participant activity
          const participant = session.participants.find(p => p.userId === userId);
          if (participant) {
            participant.lastActivity = new Date();
          }

          logger.debug(`Applied operation for document ${data.documentId}, version ${session.version}`);
        }
      }
    } catch (error) {
      logger.error('Error handling text operation:', error);
      socket.emit('collaboration-error', { 
        message: 'Failed to apply text operation',
        code: 'OPERATION_FAILED'
      });
    }
  }

  private handleDocumentStateRequest(socket: any, data: { documentId: string }) {
    try {
      const sessionId = this.findSessionByDocument(data.documentId);

      if (sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          socket.emit('document-state', {
            version: session.version,
            participants: session.participants.filter(p => p.isActive),
            cursors: Array.from(session.cursors.values()),
            operations: session.operations.slice(-50) // Last 50 operations
          });
        }
      }
    } catch (error) {
      logger.error('Error handling document state request:', error);
    }
  }

  private handleUserDisconnect(socket: any) {
    try {
      const userId = socket.userId;
      const userSessions = this.userSessions.get(userId);

      if (userSessions) {
        userSessions.forEach(sessionId => {
          const session = this.sessions.get(sessionId);
          if (session) {
            // Mark participant as inactive
            const participant = session.participants.find(p => p.userId === userId);
            if (participant) {
              participant.isActive = false;
              participant.lastActivity = new Date();
            }

            // Remove cursor
            session.cursors.delete(userId);

            // Notify other participants
            this.io.to(`doc-${session.documentId}`).emit('participant-disconnected', {
              userId
            });
          }
        });

        this.userSessions.delete(userId);
      }

      logger.info(`User ${userId} disconnected from all collaboration sessions`);
    } catch (error) {
      logger.error('Error handling user disconnect:', error);
    }
  }

  private async verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              collaborators: {
                some: { userId }
              }
            }
          ]
        }
      });

      return !!project;
    } catch (error) {
      logger.error('Error verifying project access:', error);
      return false;
    }
  }

  private findSessionByDocument(documentId: string): string | null {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.documentId === documentId) {
        return sessionId;
      }
    }
    return null;
  }

  private async applyOperationalTransform(
    operation: OperationalTransform,
    existingOperations: OperationalTransform[]
  ): Promise<OperationalTransform> {
    // Simple operational transform implementation
    // This can be enhanced with more sophisticated algorithms
    let transformedOperation = { ...operation };

    // Transform against concurrent operations
    for (const existingOp of existingOperations.slice(-10)) { // Last 10 operations
      if (existingOp.timestamp > operation.timestamp) {
        continue; // Skip operations that came after this one
      }

      if (existingOp.operation === 'insert' && operation.operation === 'insert') {
        if (existingOp.position <= transformedOperation.position) {
          transformedOperation.position += existingOp.content?.length || 0;
        }
      } else if (existingOp.operation === 'delete' && operation.operation === 'insert') {
        if (existingOp.position < transformedOperation.position) {
          transformedOperation.position -= existingOp.length || 0;
        }
      }
    }

    return {
      ...transformedOperation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
  }

  private async updateDocumentContent(
    documentId: string,
    documentType: 'scene' | 'note' | 'character' | 'location',
    operation: OperationalTransform
  ): Promise<void> {
    try {
      // This would update the actual document content in the database
      // Implementation depends on the specific document type and operation
      switch (documentType) {
        case 'scene':
          await this.updateSceneContent(documentId, operation);
          break;
        case 'note':
          await this.updateNoteContent(documentId, operation);
          break;
        case 'character':
          await this.updateCharacterContent(documentId, operation);
          break;
        case 'location':
          await this.updateLocationContent(documentId, operation);
          break;
      }
    } catch (error) {
      logger.error('Error updating document content:', error);
      throw error;
    }
  }

  private async updateSceneContent(documentId: string, operation: OperationalTransform): Promise<void> {
    // Update scene content based on operation
    const scene = await this.prisma.scene.findUnique({
      where: { id: documentId }
    });

    if (scene) {
      let content = scene.content;
      
      switch (operation.operation) {
        case 'insert':
          content = content.slice(0, operation.position) + 
                   (operation.content || '') + 
                   content.slice(operation.position);
          break;
        case 'delete':
          content = content.slice(0, operation.position) + 
                   content.slice(operation.position + (operation.length || 0));
          break;
      }

      await this.prisma.scene.update({
        where: { id: documentId },
        data: { 
          content,
          updatedAt: new Date()
        }
      });
    }
  }

  private async updateNoteContent(documentId: string, operation: OperationalTransform): Promise<void> {
    // Similar implementation for notes
    // This is a simplified version - in production, you'd want more robust content handling
  }

  private async updateCharacterContent(documentId: string, operation: OperationalTransform): Promise<void> {
    // Similar implementation for characters
  }

  private async updateLocationContent(documentId: string, operation: OperationalTransform): Promise<void> {
    // Similar implementation for locations
  }

  // Public methods for external use
  public getActiveCollaborators(documentId: string): Array<any> {
    const sessionId = this.findSessionByDocument(documentId);
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      return session?.participants.filter(p => p.isActive) || [];
    }
    return [];
  }

  public getSessionStats(): any {
    return {
      activeSessions: this.sessions.size,
      totalUsers: this.userSessions.size,
      sessionsDetails: Array.from(this.sessions.values()).map(session => ({
        sessionId: session.sessionId,
        projectId: session.projectId,
        documentId: session.documentId,
        participantCount: session.participants.filter(p => p.isActive).length,
        version: session.version,
        lastModified: session.lastModified
      }))
    };
  }
}