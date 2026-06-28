import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../lib/async-handler';
import { Perfil, createPedidoSchema } from '@cafecontrol/shared';
import * as pedidosController from './pedidos.controller';
import itensRoutes from '../itens-pedido/itens-pedido.routes';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(pedidosController.listar));
router.get('/:id', asyncHandler(pedidosController.buscarPorId));
router.post('/', authorize(Perfil.GARCOM, Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA), validate(createPedidoSchema), asyncHandler(pedidosController.criar));
router.patch('/:id/fechar', authorize(Perfil.GARCOM, Perfil.CAIXA, Perfil.GERENTE, Perfil.ADMIN), asyncHandler(pedidosController.fechar));
router.patch('/:id/cancelar', authorize(Perfil.GERENTE, Perfil.ADMIN, Perfil.CAIXA), asyncHandler(pedidosController.cancelar));
router.patch('/:id/status-entrega', authorize(Perfil.ADMIN, Perfil.GERENTE, Perfil.CAIXA, Perfil.GARCOM), asyncHandler(pedidosController.atualizarStatusEntrega));

// Sub-rota: /pedidos/:pedidoId/itens
router.use('/:pedidoId/itens', itensRoutes);

export default router;
