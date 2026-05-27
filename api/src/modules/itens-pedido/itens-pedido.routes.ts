import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil, addItensSchema, updateItemStatusSchema } from '@cafecontrol/shared';
import * as itensController from './itens-pedido.controller';

// mergeParams: true para acessar :pedidoId da rota pai
const router = Router({ mergeParams: true });

router.post('/', authorize(Perfil.GARCOM, Perfil.ADMIN, Perfil.GERENTE), validate(addItensSchema), asyncHandler(itensController.adicionar));
router.delete('/:id', authorize(Perfil.GARCOM, Perfil.GERENTE, Perfil.ADMIN), asyncHandler(itensController.remover));

export default router;
