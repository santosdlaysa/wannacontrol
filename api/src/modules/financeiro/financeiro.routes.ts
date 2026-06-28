import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@chefflow/shared';
import * as financeiroController from './financeiro.controller';

const router = Router();

router.use(authMiddleware);

// Dashboard acessivel a todos os perfis autenticados
router.get('/dashboard', asyncHandler(financeiroController.dashboard));

router.get(
  '/resumo-diario',
  authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA),
  asyncHandler(financeiroController.resumoDiario)
);

router.get(
  '/historico',
  authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA),
  asyncHandler(financeiroController.historico)
);

export default router;
