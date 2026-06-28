import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@cafecontrol/shared';
import * as controller from './restaurante.controller';

const router = Router();

// Publica: criar restaurante (onboarding)
router.post('/', asyncHandler(controller.criar));

// Protegidas
router.get('/me', authMiddleware, asyncHandler(controller.buscarMe));
router.put('/me', authMiddleware, authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizarMe));

export default router;
