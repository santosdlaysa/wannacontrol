import { Router } from 'express';
import { Perfil } from '@chefflow/shared';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import * as controller from './assinaturas.controller';

const router = Router();

router.use(authMiddleware, authorize(Perfil.ADMIN, Perfil.GERENTE));

router.get('/planos', controller.listarPlanos);
router.post('/pix', asyncHandler(controller.criarPagamentoPix));
router.post('/cartao', asyncHandler(controller.criarCheckoutCartao));
router.get('/pagamentos/:id', asyncHandler(controller.consultarPagamento));

export default router;
