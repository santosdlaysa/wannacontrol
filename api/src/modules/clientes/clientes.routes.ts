import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { asyncHandler } from '../../lib/async-handler';
import * as controller from './clientes.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(controller.listar));
router.get('/:id', asyncHandler(controller.buscarPorId));
router.post('/', asyncHandler(controller.criar));
router.put('/:id', asyncHandler(controller.atualizar));
router.delete('/:id', asyncHandler(controller.remover));

export default router;
