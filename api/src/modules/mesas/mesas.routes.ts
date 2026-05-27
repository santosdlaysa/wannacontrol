import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil, updateMesaStatusSchema } from '@cafecontrol/shared';
import * as mesasController from './mesas.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(mesasController.listar));
router.get('/:id', asyncHandler(mesasController.buscarPorId));
router.patch('/:id/status', authorize(Perfil.GARCOM, Perfil.CAIXA, Perfil.GERENTE, Perfil.ADMIN), validate(updateMesaStatusSchema), asyncHandler(mesasController.alterarStatus));

export default router;
