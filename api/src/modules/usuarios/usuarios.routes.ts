import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil, createUsuarioSchema, updateUsuarioSchema } from '@cafecontrol/shared';
import * as usuariosController from './usuarios.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(usuariosController.listar));
router.get('/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), asyncHandler(usuariosController.buscarPorId));
router.post('/', authorize(Perfil.ADMIN), validate(createUsuarioSchema), asyncHandler(usuariosController.criar));
router.put('/:id', authorize(Perfil.ADMIN), validate(updateUsuarioSchema), asyncHandler(usuariosController.atualizar));
router.delete('/:id', authorize(Perfil.ADMIN), asyncHandler(usuariosController.desativar));

export default router;
