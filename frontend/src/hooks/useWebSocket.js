import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for WebSocket connection
 * @param {string} url - WebSocket URL
 * @param {Object} options - Configuration options
 * @returns {Object} WebSocket state and methods
 */
export function useWebSocket(url, options = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const ws = useRef(null);
  const reconnectCount = useRef(0);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    try {
      // Get WebSocket URL from environment or construct from window location
      const wsUrl = url || (() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_WS_URL || window.location.host;
        return `${protocol}//${host}/ws`;
      })();

      console.log('[WebSocket] Connecting to:', wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = (event) => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectCount.current = 0;
        onOpen?.(event);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionError(error);
        onError?.(error);
      };

      ws.current.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        onClose?.(event);

        // Attempt to reconnect
        if (reconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current += 1;
          console.log(
            `[WebSocket] Reconnecting... (${reconnectCount.current}/${reconnectAttempts})`
          );

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectCount.current >= reconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
          setConnectionError(new Error('Max reconnection attempts reached'));
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setConnectionError(error);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
      return false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}

/**
 * Hook specifically for upload progress updates
 * @returns {Object} Upload progress state and WebSocket connection
 */
export function useUploadProgress() {
  const [uploadProgress, setUploadProgress] = useState({});

  const handleMessage = useCallback((message) => {
    if (message.uploadId) {
      setUploadProgress((prev) => ({
        ...prev,
        [message.uploadId]: message,
      }));
    }
  }, []);

  const ws = useWebSocket(null, {
    onMessage: handleMessage,
    reconnect: true,
  });

  const getProgress = useCallback(
    (uploadId) => uploadProgress[uploadId],
    [uploadProgress]
  );

  const clearProgress = useCallback((uploadId) => {
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[uploadId];
      return newProgress;
    });
  }, []);

  return {
    ...ws,
    uploadProgress,
    getProgress,
    clearProgress,
  };
}
