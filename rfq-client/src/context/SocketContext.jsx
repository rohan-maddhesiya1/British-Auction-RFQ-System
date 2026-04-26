import { createContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { refreshServerSkew } from '../hooks/useServerTime';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const nextSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    nextSocket.on('connect', refreshServerSkew);
    nextSocket.on('reconnect', refreshServerSkew);
    setSocket(nextSocket);

    return () => {
      nextSocket.off('connect', refreshServerSkew);
      nextSocket.off('reconnect', refreshServerSkew);
      nextSocket.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
