import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

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

  const configs: Record<string, string | null> = {};
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

  return { restaurante, configuracoes: configs, categorias, semCategoria };
}

export async function criarPedidoPublico(slug: string, data: {
  clienteNome: string;
  clienteTelefone: string;
  tipoPedido: 'DELIVERY' | 'RETIRADA';
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

  // Buscar taxa de entrega das configs
  const taxaConfig = await prisma.configuracao.findUnique({
    where: { restauranteId_chave: { restauranteId: restaurante.id, chave: 'taxa_entrega' } },
  });
  const taxaEntrega = data.tipoPedido === 'DELIVERY' ? Number(taxaConfig?.valor ?? 0) : 0;

  const pedido = await prisma.pedido.create({
    data: {
      restauranteId: restaurante.id,
      garcomId: operadorId,
      tipoPedido: data.tipoPedido,
      statusPedido: 'ABERTO',
      statusEntrega: 'RECEBIDO',
      clienteNome: data.clienteNome,
      clienteTelefone: data.clienteTelefone,
      enderecoEntrega: data.enderecoEntrega ?? null,
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
      itens: { include: { produto: { select: { nome: true } } } },
    },
  });

  return pedido;
}
