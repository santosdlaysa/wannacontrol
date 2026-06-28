import { Perfil, StatusMesa, StatusPedido, StatusPreparo, TipoPedido, StatusEntrega, FormaPagamento } from './enums';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  pin: string | null;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: Date;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  disponivel: boolean;
  urlImagem: string | null;
  criadoEm: Date;
}

export interface Mesa {
  id: number;
  numero: number;
  status: StatusMesa;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  endereco: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  observacao: string | null;
  criadoEm: Date;
  pedidos?: Pedido[];
  _count?: { pedidos: number };
}

export interface Pedido {
  id: number;
  mesaId: number | null;
  garcomId: number;
  clienteId: number | null;
  tipoPedido: TipoPedido;
  statusPedido: StatusPedido;
  statusEntrega: StatusEntrega | null;
  formaPagamento: FormaPagamento | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  enderecoEntrega: string | null;
  taxaEntrega: number | null;
  observacao: string | null;
  dataCriacao: Date;
  total: number | null;
  version: number;
  mesa?: Mesa;
  garcom?: Usuario;
  cliente?: Cliente;
  itens?: ItemPedido[];
}

export interface ItemPedido {
  id: number;
  pedidoId: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  statusPreparo: StatusPreparo;
  criadoEm: Date;
  produto?: Produto;
  pedido?: Pedido;
}

export interface AuthPayload {
  userId: number;
  perfil: Perfil;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Omit<Usuario, 'pin'>;
}
