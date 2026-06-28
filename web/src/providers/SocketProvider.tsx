'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, Perfil } from '@chefflow/shared';
import { getSocket, disconnectSocket } from '@/lib/socket-client';
import { useAuth } from './AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const s = getSocket();
    setSocket(s);

    function onConnect() {
      setIsConnected(true);

      // Join rooms based on role
      if (user?.perfil === Perfil.COZINHA || user?.perfil === Perfil.ADMIN || user?.perfil === Perfil.GERENTE) {
        s.emit(SOCKET_EVENTS.JOIN_KITCHEN);
      }
      if (user?.perfil === Perfil.GARCOM) {
        s.emit(SOCKET_EVENTS.JOIN_WAITER, { userId: user.id });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) {
      onConnect();
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
