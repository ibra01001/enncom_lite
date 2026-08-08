import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

/**
 * Generate a random 6-char alphanumeric string.
 * Used as a persistent client token stored in sessionStorage.
 */
function generateToken() {
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
function getClientToken() {
    let token = sessionStorage.getItem('enncom_client_token');
    if (!token) {
        token = generateToken();
        sessionStorage.setItem('enncom_client_token', token);
    }
    return token;
}

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [myId, setMyId] = useState(null);

    useEffect(() => {
        const clientToken = getClientToken();

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            query: { client_token: clientToken },   // send token in handshake
        });

        // Server is the single source of truth for our identity
        newSocket.on('session_info', (data) => {
            setMyId(data.myId);
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, myId }}>
            {children}
        </SocketContext.Provider>
    );
};
