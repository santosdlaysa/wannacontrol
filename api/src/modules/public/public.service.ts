import prisma from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { getIO } from '../../lib/socket';

const NEW_DELIVERY_ORDER_EVENT = 'order:newDelivery';
const DEFAULT_CONFIGS: Record<string, string> = {
  restaurante_aberto: 'true',
  horario_abertura: '08:00',
  horario_fechamento: '22:00',
};

function parseHorarioToMinutes(value?: string | null) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function isRestauranteAberto(configs: Record<string, string | null>, now = new Date()) {
  if (configs.restaurante_aberto === 'false') return false;

  const abertura = parseHorarioToMinutes(configs.horario_abertura);
  const fechamento = parseHorarioToMinutes(configs.horario_fechamento);
  if (abertura == null || fechamento == null) return true;
  if (abertura === fechamento) return true;

  const minutoAtual = now.getHours() * 60 + now.getMinutes();
  if (abertura < fechamento) {
    return minutoAtual >= abertura && minutoAtual < fechamento;
  }

  return minutoAtual >= abertura || minutoAtual < fechamento;
}

async function getConfiguracoesOperacao(restauranteId: number) {
  const configuracoes = await prisma.configuracao.findMany({
    where: {
      restauranteId,
      chave: { in: ['restaurante_aberto', 'horario_abertura', 'horario_fechamento'] },
    },
  });

  const configs: Record<string, string | null> = { ...DEFAULT_CONFIGS };
  for (const c of configuracoes) configs[c.chave] = c.valor;

  return configs;
}

export async function getStatsPublicos(slug: string) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: { id: true, nome: true, ativo: true },
  });

  if (!restaurante || !restaurante.ativo) throw new NotFoundError('Restaurante');

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [pedidosHoje, pedidosAbertos, pedidosPagos, produtosDisponiveis, clientesTotal] =
    await Promise.all([
      prisma.pedido.count({ where: { restauranteId: restaurante.id, dataCriacao: { gte: hoje } } }),
      prisma.pedido.count({ where: { restauranteId: restaurante.id, statusPedido: 'ABERTO' } }),
      prisma.pedido.count({ where: { restauranteId: restaurante.id, statusPedido: 'PAGO', dataCriacao: { gte: hoje } } }),
      prisma.produto.count({ where: { restauranteId: restaurante.id, disponivel: true } }),
      prisma.cliente.count({ where: { restauranteId: restaurante.id } }),
    ]);

  return { pedidosHoje, pedidosAbertos, pedidosPagos, produtosDisponiveis, clientesTotal };
}

export async function getCardapio(slug: string) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: {
      id: true,
      nome: true,
      slug: true,
      telefone: true,
      logoUrl: true,
      ativo: true,
    },
  });

  if (!restaurante || !restaurante.ativo) throw new NotFoundError('Restaurante');

  const configuracoes = await prisma.configuracao.findMany({
    where: { restauranteId: restaurante.id },
  });

  const configs: Record<string, string | null> = { restaurante_aberto: 'true' };
  for (const c of configuracoes) configs[c.chave] = c.valor;

  const categorias = await prisma.categoria.findMany({
    where: { restauranteId: restaurante.id, ativo: true },
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    include: {
      produtos: {
        where: { disponivel: true },
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          descricao: true,
          preco: true,
          urlImagem: true,
          disponivel: true,
        },
      },
    },
  });

  // Produtos sem categoria
  const semCategoria = await prisma.produto.findMany({
    where: { restauranteId: restaurante.id, disponivel: true, categoriaId: null },
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      descricao: true,
      preco: true,
      categoria: true,
      urlImagem: true,
      disponivel: true,
    },
  });

  const bairros = await prisma.taxaEntregaBairro.findMany({
    where: { restauranteId: restaurante.id, ativo: true },
    orderBy: { bairro: 'asc' },
    select: { id: true, bairro: true, taxa: true },
  });

  return { restaurante, configuracoes: configs, categorias, semCategoria, bairros };
}

export async function criarPedidoPublico(slug: string, data: {
  clienteNome: string;
  clienteTelefone: string;
  tipoPedido: 'DELIVERY' | 'RETIRADA';
  bairroId?: number | null;
  enderecoEntrega?: string | null;
  observacao?: string | null;
  itens: { produtoId: number; quantidade: number; observacao?: string | null }[];
}) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    include: {
      usuarios: {
        where: { ativo: true, perfil: { in: ['ADMIN', 'GARCOM'] } },
        take: 1,
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!restaurante || !restaurante.ativo) throw new NotFoundError('Restaurante');
  if (!restaurante.usuarios.length) throw new NotFoundError('Operador do restaurante');

  const configsOperacao = await getConfiguracoesOperacao(restaurante.id);
  if (!isRestauranteAberto(configsOperacao)) {
    throw new ValidationError('Restaurante fechado no momento');
  }

  const operadorId = restaurante.usuarios[0].id;

  // Buscar preços dos produtos (validação server-side)
  const produtoIds = data.itens.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, restauranteId: restaurante.id, disponivel: true },
  });

  if (produtos.length !== produtoIds.length) {
    throw new Error('Um ou mais produtos não estão disponíveis');
  }

  const precoMap = new Map(produtos.map((p) => [p.id, Number(p.preco)]));

  // Buscar taxa de entrega: por bairro (prioritário) ou config geral
  let taxaEntrega = 0;
  if (data.tipoPedido === 'DELIVERY') {
    if (data.bairroId) {
      const bairroTaxa = await prisma.taxaEntregaBairro.findFirst({
        where: { id: data.bairroId, restauranteId: restaurante.id, ativo: true },
      });
      taxaEntrega = bairroTaxa ? Number(bairroTaxa.taxa) : 0;
    } else {
      const taxaConfig = await prisma.configuracao.findUnique({
        where: { restauranteId_chave: { restauranteId: restaurante.id, chave: 'taxa_entrega' } },
      });
      taxaEntrega = Number(taxaConfig?.valor ?? 0);
    }
  }
  const clienteNome = data.clienteNome.trim();
  const clienteTelefone = data.clienteTelefone.replace(/\D/g, '');
  const enderecoEntrega = data.tipoPedido === 'DELIVERY'
    ? data.enderecoEntrega?.trim() || null
    : null;

  // Buscar nome do bairro para salvar no cliente
  let bairroNome: string | null = null;
  if (data.bairroId) {
    const bairroObj = await prisma.taxaEntregaBairro.findFirst({
      where: { id: data.bairroId, restauranteId: restaurante.id },
      select: { bairro: true },
    });
    bairroNome = bairroObj?.bairro ?? null;
  }

  const clienteExistente = await prisma.cliente.findFirst({
    where: { restauranteId: restaurante.id, telefone: clienteTelefone },
  });

  const cliente = clienteExistente
    ? await prisma.cliente.update({
        where: { id: clienteExistente.id },
        data: {
          nome: clienteNome,
          endereco: enderecoEntrega ?? clienteExistente.endereco,
          bairro: bairroNome ?? clienteExistente.bairro,
        },
      })
    : await prisma.cliente.create({
        data: {
          restauranteId: restaurante.id,
          nome: clienteNome,
          telefone: clienteTelefone,
          endereco: enderecoEntrega,
          bairro: bairroNome,
        },
      });

  const pedido = await prisma.pedido.create({
    data: {
      restauranteId: restaurante.id,
      garcomId: operadorId,
      clienteId: cliente.id,
      tipoPedido: data.tipoPedido,
      statusPedido: 'ABERTO',
      statusEntrega: 'RECEBIDO',
      clienteNome,
      clienteTelefone,
      enderecoEntrega,
      taxaEntrega,
      observacao: data.observacao ?? null,
      itens: {
        create: data.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: precoMap.get(item.produtoId)!,
          observacao: item.observacao ?? null,
          statusPreparo: 'PENDENTE',
        })),
      },
    },
    include: {
      cliente: true,
      itens: { include: { produto: { select: { nome: true } } } },
    },
  });

  const total = pedido.itens.reduce(
    (acc, item) => acc + Number(item.precoUnitario) * item.quantidade,
    0,
  ) + taxaEntrega;

  try {
    const io = getIO();
    io.to('tables').emit(NEW_DELIVERY_ORDER_EVENT, {
      pedidoId: pedido.id,
      clienteNome,
      clienteTelefone,
      tipoPedido: data.tipoPedido,
      total,
      itensCount: pedido.itens.length,
      restauranteId: restaurante.id,
    });
  } catch {}

  return pedido;
}

export async function getClientePublico(slug: string, telefone: string) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: { id: true, ativo: true },
  });

  if (!restaurante || !restaurante.ativo) throw new NotFoundError('Restaurante');

  const telefoneNormalizado = telefone.replace(/\D/g, '');
  if (!telefoneNormalizado) return null;

  const cliente = await prisma.cliente.findFirst({
    where: { restauranteId: restaurante.id, telefone: telefoneNormalizado },
    select: { nome: true, telefone: true, endereco: true, bairro: true },
  });

  return cliente;
}

export async function getStatusPedidoPublico(slug: string, pedidoId: number, telefone: string) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: { id: true, ativo: true },
  });

  if (!restaurante || !restaurante.ativo) throw new NotFoundError('Restaurante');

  const telefoneNormalizado = telefone.replace(/\D/g, '');
  if (!telefoneNormalizado) throw new NotFoundError('Pedido');

  const pedido = await prisma.pedido.findFirst({
    where: {
      id: pedidoId,
      restauranteId: restaurante.id,
      clienteTelefone: telefoneNormalizado,
    },
    select: {
      id: true,
      tipoPedido: true,
      statusPedido: true,
      statusEntrega: true,
      clienteNome: true,
      clienteTelefone: true,
      dataCriacao: true,
      total: true,
      taxaEntrega: true,
      itens: {
        select: {
          id: true,
          quantidade: true,
          precoUnitario: true,
          statusPreparo: true,
          produto: { select: { nome: true } },
        },
      },
    },
  });

  if (!pedido) throw new NotFoundError('Pedido');

  const subtotal = pedido.itens.reduce(
    (sum, item) => sum + Number(item.precoUnitario) * item.quantidade,
    0,
  );

  return {
    ...pedido,
    subtotal,
    total: pedido.total != null ? Number(pedido.total) : subtotal + Number(pedido.taxaEntrega ?? 0),
  };
}

export async function getHistoricoPedidosPublico(slug: string, telefone: string) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { slug },
    select: { id: true, ativo: true },
  });

  if (!restaurante || !restaurante.ativo) throw new NotFoundError('Restaurante');

  const telefoneNormalizado = telefone.replace(/\D/g, '');
  if (!telefoneNormalizado) return [];

  const pedidos = await prisma.pedido.findMany({
    where: {
      restauranteId: restaurante.id,
      clienteTelefone: telefoneNormalizado,
    },
    orderBy: { dataCriacao: 'desc' },
    take: 20,
    select: {
      id: true,
      tipoPedido: true,
      statusPedido: true,
      statusEntrega: true,
      dataCriacao: true,
      total: true,
      taxaEntrega: true,
      itens: {
        select: {
          id: true,
          quantidade: true,
          precoUnitario: true,
          produto: { select: { nome: true } },
        },
      },
    },
  });

  return pedidos.map((pedido) => {
    const subtotal = pedido.itens.reduce(
      (sum, item) => sum + Number(item.precoUnitario) * item.quantidade,
      0,
    );

    return {
      ...pedido,
      subtotal,
      total: pedido.total != null ? Number(pedido.total) : subtotal + Number(pedido.taxaEntrega ?? 0),
    };
  });
}
