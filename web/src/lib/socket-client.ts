import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  socket = io('http://localhost:3333', {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
