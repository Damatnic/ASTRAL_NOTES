import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (type: string, data?: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    protocols,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnect = useRef(true);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url, protocols);

      ws.onopen = (event) => {
        setSocket(ws);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0;
        clearReconnectTimeout();
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setSocket(null);
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.(event);

        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      setSocket(ws);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create WebSocket');
      setIsConnecting(false);
    }
  }, [url, protocols, onOpen, onClose, onError, onMessage, maxReconnectAttempts, reconnectInterval, clearReconnectTimeout, socket]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    clearReconnectTimeout();
    
    if (socket) {
      socket.close();
    }
    
    setSocket(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, [socket, clearReconnectTimeout]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnect.current = true;
    reconnectAttempts.current = 0;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const sendMessage = useCallback((type: string, data?: any) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected. Cannot send message.');
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now()
    };

    try {
      socket.send(JSON.stringify(message));
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [socket]);

  useEffect(() => {
    connect();

    return () => {
      shouldReconnect.current = false;
      clearReconnectTimeout();
      if (socket) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    lastMessage
  };
};