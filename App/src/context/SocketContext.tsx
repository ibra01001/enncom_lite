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
 * Generate a random 6-char alphanumeric string.
 * Used as a persistent client token stored in sessionStorage.
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get or create a persistent client token from sessionStorage.
 * Survives page refreshes but clears when the tab is closed.
 */
function getClientToken(): string {
  let token = sessionStorage.getItem('enncom_client_token');
  if (!token) {
    token = generateToken();
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

    const newSocket: Socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { client_token: clientToken }, // send token in handshake
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
