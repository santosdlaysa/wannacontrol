import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@cafecontrol/shared';
import { useAuth } from './AuthProvider';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket-client';

interface SocketContextData {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const s = await connectSocket();

        if (!mounted) return;

        setSocket(s);

        s.on('connect', () => {
          if (!mounted) return;
          setIsConnected(true);
          // Auto-join waiter room
          s.emit(SOCKET_EVENTS.JOIN_WAITER);
        });

        s.on('disconnect', () => {
          if (!mounted) return;
          setIsConnected(false);
        });

        if (s.connected) {
          setIsConnected(true);
          s.emit(SOCKET_EVENTS.JOIN_WAITER);
        }
      } catch {
        // Socket connection failed, will retry via reconnection
      }
    })();

    return () => {
      mounted = false;
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.emit(SOCKET_EVENTS.LEAVE_WAITER);
      }
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextData {
  return useContext(SocketContext);
}
