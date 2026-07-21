import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usuariosRoutes from '../modules/usuarios/usuarios.routes';
import produtosRoutes from '../modules/produtos/produtos.routes';
import mesasRoutes from '../modules/mesas/mesas.routes';
import pedidosRoutes from '../modules/pedidos/pedidos.routes';
import financeiroRoutes from '../modules/financeiro/financeiro.routes';
import caixaRoutes from '../modules/caixa/caixa.routes';
import clientesRoutes from '../modules/clientes/clientes.routes';
import categoriasRoutes from '../modules/categorias/categorias.routes';
import complementosRoutes from '../modules/complementos/complementos.routes';
import entregadoresRoutes from '../modules/entregadores/entregadores.routes';
import configuracoesRoutes from '../modules/configuracoes/configuracoes.routes';
import restauranteRoutes from '../modules/restaurante/restaurante.routes';
import adminRoutes from '../modules/admin/admin.routes';
import publicRoutes from '../modules/public/public.routes';
import assinaturasRoutes from '../modules/assinaturas/assinaturas.routes';
import * as assinaturasController from '../modules/assinaturas/assinaturas.controller';
import { authMiddleware } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { requireModulo } from '../middlewares/require-modulo';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../lib/async-handler';
import { Perfil, updateItemStatusSchema } from '@chefflow/shared';
import * as itensController from '../modules/itens-pedido/itens-pedido.controller';

export const router = Router();

// Rotas publicas
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.post('/assinaturas/webhook', asyncHandler(assinaturasController.receberWebhook));

// Rotas protegidas (módulos desativados no super-admin bloqueiam o acesso)
router.use('/usuarios', authMiddleware, requireModulo('USUARIOS'), usuariosRoutes);
router.use('/produtos', authMiddleware, requireModulo('PRODUTOS'), produtosRoutes);
router.use('/mesas', authMiddleware, requireModulo('MESAS'), mesasRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/financeiro', authMiddleware, requireModulo('FINANCEIRO'), financeiroRoutes);
router.use('/caixa', authMiddleware, requireModulo('CAIXA'), caixaRoutes);
router.use('/clientes', authMiddleware, requireModulo('CLIENTES'), clientesRoutes);
router.use('/restaurante', restauranteRoutes);
router.use('/categorias', authMiddleware, requireModulo('PRODUTOS'), categoriasRoutes);
router.use('/complementos', authMiddleware, requireModulo('COMPLEMENTOS'), complementosRoutes);
router.use('/entregadores', authMiddleware, requireModulo('ENTREGADORES'), entregadoresRoutes);
router.use('/configuracoes', configuracoesRoutes);
router.use('/assinaturas', assinaturasRoutes);

// Rota direta para atualizar status de item (usada pela cozinha e garcom)
router.patch(
  '/itens-pedido/:id/status',
  authMiddleware,
  authorize(Perfil.COZINHA, Perfil.GARCOM, Perfil.GERENTE, Perfil.ADMIN),
  validate(updateItemStatusSchema),
  asyncHandler(itensController.atualizarStatus)
);
