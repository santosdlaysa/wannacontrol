import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  console.error('Erro não tratado:', err);

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
  });
}
