import { Request, Response, NextFunction } from 'express';
import { Perfil } from '@cafecontrol/shared';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.perfil !== Perfil.ADMIN || req.user.restauranteId) {
    return next(new ForbiddenError('Acesso exclusivo do administrador da plataforma'));
  }

  next();
}
