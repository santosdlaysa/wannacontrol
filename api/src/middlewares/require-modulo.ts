import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ForbiddenError } from '../lib/errors';
import { SystemModule } from '../modules/admin/admin-modules';

// Bloqueia a rota quando o módulo foi desativado no super-admin.
// Sem linha na tabela = habilitado (compatível com restaurantes antigos).
export function requireModulo(modulo: SystemModule) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const restauranteId = req.user?.restauranteId;
    if (!restauranteId) return next(); // super admin não tem restaurante

    try {
      const row = await prisma.restauranteModulo.findUnique({
        where: { restauranteId_modulo: { restauranteId, modulo } },
        select: { ativo: true },
      });
      if (row && !row.ativo) {
        return next(new ForbiddenError('Este módulo não está habilitado para o seu restaurante'));
      }
    } catch {
      // tabela pode não existir ainda — libera acesso
    }

    next();
  };
}
