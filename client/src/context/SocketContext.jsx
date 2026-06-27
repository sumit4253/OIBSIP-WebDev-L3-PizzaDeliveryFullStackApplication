import { createContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket,      setSocket]      = useState(null);
  const [connected,   setConnected]   = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') ||
                  localStorage.getItem('adminToken');

    const newSocket = io(SOCKET_URL, {
      auth:              { token },
      transports:        ['websocket', 'polling'],
      reconnection:      true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Re-authenticate socket when token changes
  const reconnectWithToken = (token) => {
    if (socketRef.current) {
      socketRef.current.auth = { token };
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, reconnectWithToken }}>
      {children}
    </SocketContext.Provider>
  );
};