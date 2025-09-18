import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  token: string;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export interface CollaborationEvents {
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: any) => void;
  
  // Project events
  'project-joined': (data: any) => void;
  'project-left': (data: any) => void;
  
  // Document events
  'document-joined': (data: any) => void;
  'document-left': (data: any) => void;
  'document-state': (data: any) => void;
  
  // Collaboration events
  'participant-joined': (data: any) => void;
  'participant-left': (data: any) => void;
  'participant-disconnected': (data: any) => void;
  'cursor-updated': (data: any) => void;
  'text-operation-applied': (data: any) => void;
  'version-conflict': (data: any) => void;
  
  // Notification events
  'new-notification': (notification: any) => void;
  'notifications-update': (notifications: any[]) => void;
  'notifications-marked-read': (notificationIds: string[]) => void;
  'activity-feed-item': (item: any) => void;
  'activity-feed-update': (items: any[]) => void;
  
  // Conflict events
  'conflict-detected': (conflict: any) => void;
  'conflict-resolved': (resolution: any) => void;
  
  // General events
  'collaboration-error': (error: any) => void;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private eventListeners = new Map<string, Function[]>();
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentProject: string | null = null;
  private currentDocument: { id: string; type: string } | null = null;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  // Connection Management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        resolve();
        return;
      }

      this.socket = io(this.config.url, {
        auth: {
          token: this.config.token
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.clearReconnectTimer();
        this.emit('connect');
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.emit('disconnect', reason);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.scheduleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        this.emit('error', error);
        reject(error);
      });

      // Set up event listeners
      this.setupEventListeners();

      // Timeout if connection takes too long
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.clearReconnectTimer();
  }

  // Project Management
  async joinProject(projectId: string): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.currentProject = projectId;
    this.socket.emit('join-project', projectId);
  }

  async leaveProject(): Promise<void> {
    if (!this.socket || !this.currentProject) {
      return;
    }

    this.socket.emit('leave-project', this.currentProject);
    this.currentProject = null;
  }

  // Document Collaboration
  async joinDocument(
    projectId: string,
    documentId: string,
    documentType: 'scene' | 'note' | 'character' | 'location'
  ): Promise<void> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.currentDocument = { id: documentId, type: documentType };
    this.socket.emit('join-document', {
      projectId,
      documentId,
      documentType
    });
  }

  async leaveDocument(): Promise<void> {
    if (!this.socket || !this.currentDocument) {
      return;
    }

    this.socket.emit('leave-document', {
      documentId: this.currentDocument.id
    });
    this.currentDocument = null;
  }

  // Real-time Editing
  sendCursorUpdate(position: number, selection?: { start: number; end: number }): void {
    if (!this.socket || !this.currentDocument) {
      return;
    }

    this.socket.emit('cursor-update', {
      documentId: this.currentDocument.id,
      position,
      selection
    });
  }

  sendTextOperation(operation: {
    operation: 'insert' | 'delete' | 'retain';
    position: number;
    content?: string;
    length?: number;
    version: number;
  }): void {
    if (!this.socket || !this.currentDocument) {
      return;
    }

    this.socket.emit('text-operation', {
      documentId: this.currentDocument.id,
      operation: {
        ...operation,
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'current-user', // Would get from auth context
        documentId: this.currentDocument.id,
        timestamp: new Date()
      }
    });
  }

  requestDocumentState(): void {
    if (!this.socket || !this.currentDocument) {
      return;
    }

    this.socket.emit('request-document-state', {
      documentId: this.currentDocument.id
    });
  }

  // Notifications
  requestNotifications(): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('request-notifications');
  }

  markNotificationsAsRead(notificationIds: string[]): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('mark-notifications-read', notificationIds);
  }

  updateNotificationPreferences(preferences: any): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('update-notification-preferences', preferences);
  }

  requestActivityFeed(projectId?: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('request-activity-feed', projectId);
  }

  // Event Handling
  on<K extends keyof CollaborationEvents>(event: K, listener: CollaborationEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof CollaborationEvents>(event: K, listener?: CollaborationEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    if (listener) {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    } else {
      listeners.length = 0;
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Document collaboration events
    this.socket.on('document-joined', (data) => this.emit('document-joined', data));
    this.socket.on('document-state', (data) => this.emit('document-state', data));
    this.socket.on('participant-joined', (data) => this.emit('participant-joined', data));
    this.socket.on('participant-left', (data) => this.emit('participant-left', data));
    this.socket.on('participant-disconnected', (data) => this.emit('participant-disconnected', data));
    this.socket.on('cursor-updated', (data) => this.emit('cursor-updated', data));
    this.socket.on('text-operation-applied', (data) => this.emit('text-operation-applied', data));
    this.socket.on('version-conflict', (data) => this.emit('version-conflict', data));

    // Notification events
    this.socket.on('new-notification', (notification) => this.emit('new-notification', notification));
    this.socket.on('notifications-update', (notifications) => this.emit('notifications-update', notifications));
    this.socket.on('notifications-marked-read', (ids) => this.emit('notifications-marked-read', ids));
    this.socket.on('activity-feed-item', (item) => this.emit('activity-feed-item', item));
    this.socket.on('activity-feed-update', (items) => this.emit('activity-feed-update', items));

    // Conflict events
    this.socket.on('conflict-detected', (conflict) => this.emit('conflict-detected', conflict));
    this.socket.on('conflict-resolved', (resolution) => this.emit('conflict-resolved', resolution));

    // Error events
    this.socket.on('collaboration-error', (error) => this.emit('collaboration-error', error));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      });
    }, this.config.reconnectDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Utility Methods
  isReady(): boolean {
    return this.isConnected && this.socket !== null;
  }

  getCurrentProject(): string | null {
    return this.currentProject;
  }

  getCurrentDocument(): { id: string; type: string } | null {
    return this.currentDocument;
  }

  getConnectionState(): {
    connected: boolean;
    project: string | null;
    document: { id: string; type: string } | null;
  } {
    return {
      connected: this.isConnected,
      project: this.currentProject,
      document: this.currentDocument
    };
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient | null => {
  return wsClient;
};

export const initializeWebSocketClient = (config: WebSocketConfig): WebSocketClient => {
  if (wsClient) {
    wsClient.disconnect();
  }

  wsClient = new WebSocketClient(config);
  return wsClient;
};

export const disconnectWebSocketClient = (): void => {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
};

// React Hook for WebSocket
export const useWebSocket = () => {
  const client = getWebSocketClient();
  
  return {
    client,
    isConnected: client?.isReady() || false,
    connect: (config: WebSocketConfig) => {
      if (!client) {
        return initializeWebSocketClient(config).connect();
      }
      return client.connect();
    },
    disconnect: () => {
      disconnectWebSocketClient();
    }
  };
};