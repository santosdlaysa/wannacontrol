import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { requireSuperAdmin } from '../../middlewares/super-admin';
import { asyncHandler } from '../../lib/async-handler';
import * as controller from './admin.controller';

const router = Router();

router.use(authMiddleware, requireSuperAdmin);

router.get('/modulos', asyncHandler(controller.listarModulos));
router.get('/restaurantes', asyncHandler(controller.listarRestaurantes));
router.post('/restaurantes', asyncHandler(controller.criarRestaurante));
router.put('/restaurantes/:id', asyncHandler(controller.atualizarRestaurante));
router.put('/restaurantes/:id/modulos', asyncHandler(controller.atualizarModulos));
router.get('/solicitacoes-pix', asyncHandler(controller.listarSolicitacoesPix));
router.patch('/solicitacoes-pix/:id/aprovar', asyncHandler(controller.aprovarSolicitacaoPix));
router.patch('/solicitacoes-pix/:id/rejeitar', asyncHandler(controller.rejeitarSolicitacaoPix));

export default router;
