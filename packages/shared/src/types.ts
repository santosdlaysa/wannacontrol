import { Perfil, Plano, StatusMesa, StatusPedido, StatusPreparo, TipoPedido, StatusEntrega, FormaPagamento } from './enums';

export interface Restaurante {
  id: number;
  nome: string;
  slug: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  logoUrl: string | null;
  endereco: string | null;
  plano: Plano;
  ativo: boolean;
  criadoEm: Date;
}

export interface Usuario {
  id: number;
  restauranteId: number | null;
  nome: string;
  email: string;
  pin: string | null;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: Date;
}

export interface Categoria {
  id: number;
  restauranteId: number;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  ativo: boolean;
  ordem: number;
  criadoEm: Date;
  _count?: { produtos: number };
}

export interface Produto {
  id: number;
  restauranteId: number | null;
  categoriaId: number | null;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  disponivel: boolean;
  urlImagem: string | null;
  criadoEm: Date;
  categoriaObj?: Categoria;
  grupos?: ProdutoGrupo[];
}

export interface GrupoComplemento {
  id: number;
  restauranteId: number;
  nome: string;
  descricao: string | null;
  obrigatorio: boolean;
  minimo: number;
  maximo: number;
  ativo: boolean;
  criadoEm: Date;
  itens?: ItemComplemento[];
}

export interface ItemComplemento {
  id: number;
  grupoId: number;
  nome: string;
  preco: number;
  disponivel: boolean;
  criadoEm: Date;
  grupo?: GrupoComplemento;
}

export interface ProdutoGrupo {
  produtoId: number;
  grupoId: number;
  ordem: number;
  grupo?: GrupoComplemento;
}

export interface Mesa {
  id: number;
  restauranteId: number | null;
  numero: number;
  status: StatusMesa;
  clienteNome?: string | null;
}

export interface Cliente {
  id: number;
  restauranteId: number | null;
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

export interface Entregador {
  id: number;
  restauranteId: number;
  nome: string;
  telefone: string | null;
  veiculo: string | null;
  placa: string | null;
  ativo: boolean;
  criadoEm: Date;
}

export interface Configuracao {
  id: number;
  restauranteId: number;
  chave: string;
  valor: string | null;
}

export interface Pedido {
  id: number;
  restauranteId: number | null;
  mesaId: number | null;
  garcomId: number;
  clienteId: number | null;
  entregadorId: number | null;
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
  entregador?: Entregador;
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
  complementos?: ItemPedidoComplemento[];
}

export interface ItemPedidoComplemento {
  id: number;
  itemPedidoId: number;
  itemComplementoId: number;
  quantidade: number;
  itemComplemento?: ItemComplemento;
}

export interface AuthPayload {
  userId: number;
  perfil: Perfil;
  restauranteId?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Omit<Usuario, 'pin'>;
  restaurante?: Omit<Restaurante, 'criadoEm'>;
}
