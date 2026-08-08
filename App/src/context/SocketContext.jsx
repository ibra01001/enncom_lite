import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [myId, setMyId] = useState(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

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
