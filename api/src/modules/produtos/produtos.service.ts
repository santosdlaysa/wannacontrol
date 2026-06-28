import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

interface ListarParams {
  categoria?: string;
  disponivel?: string;
  busca?: string;
}

export async function listar(params: ListarParams, restauranteId?: number) {
  const where: any = {};

  if (restauranteId) where.restauranteId = restauranteId;

  if (params.categoria) {
    where.categoria = params.categoria;
  }

  if (params.disponivel !== undefined) {
    where.disponivel = params.disponivel === 'true';
  }

  if (params.busca) {
    where.nome = { contains: params.busca, mode: 'insensitive' };
  }

  return prisma.produto.findMany({
    where,
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
  });
}

export async function buscarPorId(id: number, restauranteId?: number) {
  const where: any = { id };
  if (restauranteId) where.restauranteId = restauranteId;

  const produto = await prisma.produto.findFirst({ where });
  if (!produto) throw new NotFoundError('Produto');
  return produto;
}

export async function criar(data: {
  nome: string;
  descricao?: string | null;
  preco: number;
  categoria: string;
  disponivel?: boolean;
  urlImagem?: string | null;
  restauranteId?: number;
}) {
  return prisma.produto.create({ data });
}

export async function atualizar(id: number, data: {
  nome?: string;
  descricao?: string | null;
  preco?: number;
  categoria?: string;
  disponivel?: boolean;
  urlImagem?: string | null;
}) {
  await buscarPorId(id);
  return prisma.produto.update({ where: { id }, data });
}

export async function remover(id: number) {
  await buscarPorId(id);
  return prisma.produto.update({
    where: { id },
    data: { disponivel: false },
  });
}
