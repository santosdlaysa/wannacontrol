import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler';
import { router } from './routes';

const app = express();

// Middlewares globais
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Servir arquivos de upload
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Rotas
app.use('/api/v1', router);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (deve ser o ultimo middleware)
app.use(errorHandler);

export default app;
