import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@cafecontrol/shared';
import * as caixaController from './caixa.controller';

const router = Router();

router.use(authMiddleware);

router.get('/atual', authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA), asyncHandler(caixaController.atual));
router.get('/historico', authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA), asyncHandler(caixaController.historico));
router.post('/abrir', authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA), asyncHandler(caixaController.abrir));
router.patch('/:id/fechar', authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA), asyncHandler(caixaController.fechar));
router.post('/:id/movimentacao', authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA), asyncHandler(caixaController.movimentacao));

export default router;
