import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { SocketContextType, SessionInfoPayload } from '../types/chat';

const SocketContext = createContext<SocketContextType>({
  socket: null,
  myId: null,
  
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = (): SocketContextType => {
  return useContext(SocketContext);
};

/**
 * Get or create a persistent client token from sessionStorage.
 * Uses crypto.randomUUID() for 128-bit entropy (no collision risk).
 * Survives page refreshes but clears when the tab is closed.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, (c) => {
      const n = Number(c);
      return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
    });
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getClientToken(): string {
  let token = sessionStorage.getItem('enncom_client_token');
  if (!token) {
    token = generateUUID();
    sessionStorage.setItem('enncom_client_token', token);
  }
  return token;
}

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myId, setMyId] = useState<string | null>(null);


  useEffect(() => {
    const clientToken = getClientToken();

    const envUrl = import.meta.env.VITE_API_URL;
    // When VITE_API_URL is empty, io() defaults to window.location.origin (routed via Vite proxy).
    const socketUrl = envUrl && envUrl.trim() !== '' ? envUrl.trim() : undefined;

    const newSocket: Socket = io(socketUrl, {
      query: { client_token: clientToken }, // send token in handshake
      transports: ['polling', 'websocket'], // allow polling then upgrade to websocket
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected with sid:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Server is the single source of truth for our identity
    newSocket.on('session_info', (data: SessionInfoPayload) => {
      setMyId(data.myId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, myId }}>
      {children}
    </SocketContext.Provider>
  );
};
