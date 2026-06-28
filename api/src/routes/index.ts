import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usuariosRoutes from '../modules/usuarios/usuarios.routes';
import produtosRoutes from '../modules/produtos/produtos.routes';
import mesasRoutes from '../modules/mesas/mesas.routes';
import pedidosRoutes from '../modules/pedidos/pedidos.routes';
import financeiroRoutes from '../modules/financeiro/financeiro.routes';
import caixaRoutes from '../modules/caixa/caixa.routes';
import clientesRoutes from '../modules/clientes/clientes.routes';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../lib/async-handler';
import { Perfil, updateItemStatusSchema } from '@cafecontrol/shared';
import * as itensController from '../modules/itens-pedido/itens-pedido.controller';

export const router = Router();

// Rotas publicas
router.use('/auth', authRoutes);

// Rotas protegidas
router.use('/usuarios', usuariosRoutes);
router.use('/produtos', produtosRoutes);
router.use('/mesas', mesasRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/financeiro', financeiroRoutes);
router.use('/caixa', caixaRoutes);
router.use('/clientes', clientesRoutes);

// Rota direta para atualizar status de item (usada pela cozinha e garcom)
router.patch(
  '/itens-pedido/:id/status',
  authMiddleware,
  authorize(Perfil.COZINHA, Perfil.GARCOM, Perfil.GERENTE, Perfil.ADMIN),
  validate(updateItemStatusSchema),
  asyncHandler(itensController.atualizarStatus)
);
