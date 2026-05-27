import { Request, Response, NextFunction } from 'express';
import { Perfil } from '@cafecontrol/shared';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

export function authorize(...perfisPermitidos: Perfil[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!perfisPermitidos.includes(req.user.perfil)) {
      return next(new ForbiddenError('Você não tem permissão para acessar este recurso'));
    }

    next();
  };
}
