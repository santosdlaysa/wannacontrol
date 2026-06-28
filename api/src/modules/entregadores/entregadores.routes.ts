import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@chefflow/shared';
import * as controller from './entregadores.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(controller.listar));
router.post('/', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.criar));
router.put('/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizar));
router.delete('/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.remover));

export default router;
