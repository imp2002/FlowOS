import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 自定义WebSocket Hook
 * @param {string} url - WebSocket连接地址
 * @param {Object} options - 配置选项
 * @returns {Object} WebSocket状态和方法
 */
export const useWebSocket = (url, options = {}) => {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoConnect = true
  } = options;

  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // 连接WebSocket
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;
      setSocket(ws);
      setReadyState(WebSocket.CONNECTING);

      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        setConnectionAttempts(0);
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        onMessage?.(message);
      };

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        onClose?.(event);
        
        // 自动重连逻辑
        if (connectionAttempts < reconnectAttempts && !event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setReadyState(WebSocket.CLOSED);
        onError?.(event);
      };

    } catch (error) {
      console.error('WebSocket连接失败:', error);
      onError?.(error);
    }
  }, [url, onOpen, onMessage, onClose, onError, connectionAttempts, reconnectAttempts, reconnectInterval]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback((message) => {
    if (socketRef.current && readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }, [readyState]);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    lastMessage,
    readyState,
    connectionAttempts,
    connect,
    disconnect,
    sendMessage,
    // WebSocket状态常量
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED
  };
};

export default useWebSocket;