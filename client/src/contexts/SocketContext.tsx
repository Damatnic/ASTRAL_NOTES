/**
 * Socket Context Provider
 * Manages WebSocket connections with automatic reconnection
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '@/types/global';
import { WS_BASE_URL } from '@/utils/constants';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: <K extends keyof SocketEvents>(event: K, data: SocketEvents[K]) => void;
  on: <K extends keyof SocketEvents>(event: K, handler: (data: SocketEvents[K]) => void) => void;
  off: <K extends keyof SocketEvents>(event: K, handler?: (data: SocketEvents[K]) => void) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export function SocketProvider({ children, autoConnect = false }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  const connect = useCallback(() => {
    if (socket?.connected || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const token = localStorage.getItem('astral_auth_token');
    
    const newSocket = io(WS_BASE_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      console.log('Socket connected');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      setSocket(null);
      console.log('Socket disconnected:', reason);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Don't auto-reconnect for manual disconnections
        return;
      }
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      } else {
        setError('Failed to reconnect to server. Please refresh the page.');
      }
    });

    newSocket.on('connect_error', (err) => {
      setIsConnecting(false);
      setError(`Connection failed: ${err.message}`);
      console.error('Socket connection error:', err);
    });

    setSocket(newSocket);
  }, [socket, isConnecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, [socket]);

  const emit = useCallback(<K extends keyof SocketEvents>(
    event: K,
    data: SocketEvents[K]
  ) => {
    if (socket?.connected) {
      socket.emit(event as string, data);
    }
  }, [socket]);

  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    handler: (data: SocketEvents[K]) => void
  ) => {
    if (socket) {
      socket.on(event as string, handler);
    }
  }, [socket]);

  const off = useCallback(<K extends keyof SocketEvents>(
    event: K,
    handler?: (data: SocketEvents[K]) => void
  ) => {
    if (socket) {
      if (handler) {
        socket.off(event as string, handler);
      } else {
        socket.off(event as string);
      }
    }
  }, [socket]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}