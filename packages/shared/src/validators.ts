import { z } from 'zod';
import { Perfil, StatusMesa, StatusPreparo } from './enums';

// Auth
export const loginEmailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const loginPinSchema = z.object({
  pin: z.string().length(6, 'PIN deve ter 6 dígitos').regex(/^\d+$/, 'PIN deve conter apenas números'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// Usuarios
export const createUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  pin: z.string().length(6).regex(/^\d+$/).optional(),
  perfil: z.nativeEnum(Perfil),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  pin: z.string().length(6).regex(/^\d+$/).optional().nullable(),
  perfil: z.nativeEnum(Perfil).optional(),
  ativo: z.boolean().optional(),
});

// Produtos
export const createProdutoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  descricao: z.string().max(500).optional().nullable(),
  preco: z.number().positive('Preço deve ser positivo'),
  categoria: z.string().min(1, 'Categoria é obrigatória').max(50),
  disponivel: z.boolean().optional().default(true),
  urlImagem: z.string().max(255).optional().nullable(),
});

export const updateProdutoSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().max(500).optional().nullable(),
  preco: z.number().positive().optional(),
  categoria: z.string().min(1).max(50).optional(),
  disponivel: z.boolean().optional(),
  urlImagem: z.string().max(255).optional().nullable(),
});

// Mesas
export const updateMesaStatusSchema = z.object({
  status: z.nativeEnum(StatusMesa),
});

// Pedidos
export const createPedidoSchema = z.object({
  mesaId: z.number().int().positive(),
  clienteNome: z.string().max(100).optional().nullable(),
  clienteTelefone: z.string().max(20).optional().nullable(),
});

// Itens Pedido
export const addItensSchema = z.object({
  itens: z.array(z.object({
    produtoId: z.number().int().positive(),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
    observacao: z.string().max(200).optional().nullable(),
  })).min(1, 'Pelo menos um item é obrigatório'),
});

export const updateItemStatusSchema = z.object({
  statusPreparo: z.nativeEnum(StatusPreparo),
});

// Query params
export const produtoQuerySchema = z.object({
  categoria: z.string().optional(),
  disponivel: z.enum(['true', 'false']).optional(),
  busca: z.string().optional(),
});

export const pedidoQuerySchema = z.object({
  status: z.string().optional(),
  mesa_id: z.string().optional(),
});
