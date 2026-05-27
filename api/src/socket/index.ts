import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@cafecontrol/shared';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`Socket conectado: userId=${user?.userId}, perfil=${user?.perfil}`);

    // Todos os usuarios autenticados entram na sala de mesas
    socket.join('tables');

    // Cozinha entra na sala kitchen
    socket.on(SOCKET_EVENTS.JOIN_KITCHEN, () => {
      socket.join('kitchen');
      console.log(`Socket ${socket.id} entrou na sala kitchen`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_KITCHEN, () => {
      socket.leave('kitchen');
    });

    // Garcom entra na sua sala individual
    socket.on(SOCKET_EVENTS.JOIN_WAITER, () => {
      if (user?.userId) {
        const room = `waiter:${user.userId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} entrou na sala ${room}`);
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_WAITER, () => {
      if (user?.userId) {
        socket.leave(`waiter:${user.userId}`);
      }
    });

    // Auto-join baseado no perfil
    if (user?.perfil === 'COZINHA') {
      socket.join('kitchen');
    }

    if (user?.perfil === 'GARCOM') {
      socket.join(`waiter:${user.userId}`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: userId=${user?.userId}`);
    });
  });
}
