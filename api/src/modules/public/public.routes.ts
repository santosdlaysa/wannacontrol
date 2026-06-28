import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import * as controller from './public.controller';

const router = Router();

// Rotas totalmente públicas — sem authMiddleware
router.get('/:slug/cardapio', asyncHandler(controller.getCardapio));
router.post('/:slug/pedidos', asyncHandler(controller.criarPedido));

export default router;
