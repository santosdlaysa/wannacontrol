import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@cafecontrol/shared';
import * as controller from './categorias.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.criar));
router.put('/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizar));
router.delete('/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.remover));
router.post('/reordenar', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.reordenar));

export default router;
