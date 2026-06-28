import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '@chefflow/shared';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware de autenticacao JWT para WebSocket
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token não fornecido'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado');
  }
  return io;
}
