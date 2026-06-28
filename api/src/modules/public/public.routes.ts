import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import * as controller from './public.controller';

const router = Router();

// Rotas totalmente públicas — sem authMiddleware
router.get('/:slug/cardapio', asyncHandler(controller.getCardapio));
router.get('/:slug/pedidos/historico', asyncHandler(controller.getHistoricoPedidos));
router.get('/:slug/pedidos/:id/status', asyncHandler(controller.getStatusPedido));
router.post('/:slug/pedidos', asyncHandler(controller.criarPedido));

export default router;
