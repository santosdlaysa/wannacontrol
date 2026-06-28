import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@cafecontrol/shared';
import * as controller from './configuracoes.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(controller.listar));
router.put('/', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizar));
router.put('/:chave', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizarChave));

export default router;
