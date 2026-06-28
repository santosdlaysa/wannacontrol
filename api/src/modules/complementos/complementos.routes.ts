import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil } from '@cafecontrol/shared';
import * as controller from './complementos.controller';

const router = Router();
router.use(authMiddleware);

// Grupos
router.get('/grupos', asyncHandler(controller.listarGrupos));
router.get('/grupos/:grupoId', asyncHandler(controller.buscarGrupo));
router.post('/grupos', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.criarGrupo));
router.put('/grupos/:grupoId', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizarGrupo));
router.delete('/grupos/:grupoId', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.removerGrupo));

// Itens dentro de um grupo
router.post('/grupos/:grupoId/itens', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.criarItem));
router.put('/grupos/:grupoId/itens/:itemId', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.atualizarItem));
router.delete('/grupos/:grupoId/itens/:itemId', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.removerItem));

// Vincular grupos a produto
router.post('/produtos/:produtoId/grupos', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(controller.vincularGruposProduto));

export default router;
