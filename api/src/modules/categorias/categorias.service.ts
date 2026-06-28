import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

export async function listar(restauranteId?: number) {
  return prisma.categoria.findMany({
    where: restauranteId ? { restauranteId } : {},
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    include: { _count: { select: { produtos: true } } },
  });
}

export async function buscarPorId(id: number, restauranteId?: number) {
  const categoria = await prisma.categoria.findFirst({
    where: { id, ...(restauranteId ? { restauranteId } : {}) },
    include: { produtos: { where: { disponivel: true }, orderBy: { nome: 'asc' } } },
  });
  if (!categoria) throw new NotFoundError('Categoria');
  return categoria;
}

export async function criar(restauranteId: number, data: {
  nome: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  ativo?: boolean;
  ordem?: number;
}) {
  return prisma.categoria.create({ data: { ...data, restauranteId } });
}

export async function atualizar(id: number, restauranteId: number, data: {
  nome?: string;
  descricao?: string | null;
  imagemUrl?: string | null;
  ativo?: boolean;
  ordem?: number;
}) {
  const categoria = await prisma.categoria.findFirst({ where: { id, restauranteId } });
  if (!categoria) throw new NotFoundError('Categoria');
  return prisma.categoria.update({ where: { id }, data });
}

export async function remover(id: number, restauranteId: number) {
  const categoria = await prisma.categoria.findFirst({ where: { id, restauranteId } });
  if (!categoria) throw new NotFoundError('Categoria');
  return prisma.categoria.delete({ where: { id } });
}

export async function reordenar(restauranteId: number, ordens: { id: number; ordem: number }[]) {
  return prisma.$transaction(
    ordens.map(({ id, ordem }) =>
      prisma.categoria.update({ where: { id, restauranteId }, data: { ordem } })
    )
  );
}
