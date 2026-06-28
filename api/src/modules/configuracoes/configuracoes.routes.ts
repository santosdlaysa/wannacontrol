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

// Bairros
router.get('/bairros', asyncHandler(controller.listarBairros));
router.get('/bairros/cep/:cep', asyncHandler(controller.buscarBairroPorCep));
router.post('/bairros', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.criarBairro));
router.put('/bairros/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizarBairro));
router.delete('/bairros/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.deletarBairro));

router.put('/:chave', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizarChave));

export default router;
