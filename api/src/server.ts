import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './lib/socket';
import { registerSocketHandlers } from './socket';

const httpServer = createServer(app);

// Inicializar Socket.IO
const io = initSocket(httpServer);
registerSocketHandlers(io);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 CaféControl API rodando na porta ${env.PORT}`);
  console.log(`📡 WebSocket pronto para conexões`);
  console.log(`🔗 http://localhost:${env.PORT}/health`);
});
