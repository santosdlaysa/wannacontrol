import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

export async function listar(restauranteId: number, apenasAtivos = false) {
  return prisma.entregador.findMany({
    where: { restauranteId, ...(apenasAtivos ? { ativo: true } : {}) },
    orderBy: { nome: 'asc' },
  });
}

export async function criar(restauranteId: number, data: {
  nome: string; telefone?: string | null; veiculo?: string | null; placa?: string | null; ativo?: boolean;
}) {
  return prisma.entregador.create({ data: { ...data, restauranteId } });
}

export async function atualizar(id: number, restauranteId: number, data: Partial<{
  nome: string; telefone: string | null; veiculo: string | null; placa: string | null; ativo: boolean;
}>) {
  const entregador = await prisma.entregador.findFirst({ where: { id, restauranteId } });
  if (!entregador) throw new NotFoundError('Entregador');
  return prisma.entregador.update({ where: { id }, data });
}

export async function remover(id: number, restauranteId: number) {
  const entregador = await prisma.entregador.findFirst({ where: { id, restauranteId } });
  if (!entregador) throw new NotFoundError('Entregador');
  return prisma.entregador.delete({ where: { id } });
}
