import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

export async function listar(params: { busca?: string }) {
  const where: any = {};
  if (params.busca) {
    where.OR = [
      { nome: { contains: params.busca, mode: 'insensitive' } },
      { telefone: { contains: params.busca } },
    ];
  }
  return prisma.cliente.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { pedidos: true } },
    },
  });
}

export async function buscarPorId(id: number) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pedidos: {
        orderBy: { dataCriacao: 'desc' },
        take: 20,
        include: {
          itens: {
            include: { produto: { select: { id: true, nome: true } } },
          },
        },
      },
    },
  });
  if (!cliente) throw new NotFoundError('Cliente');
  return cliente;
}

export async function criar(data: {
  nome: string;
  telefone: string;
  endereco?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  observacao?: string;
}) {
  return prisma.cliente.create({ data });
}

export async function atualizar(
  id: number,
  data: {
    nome?: string;
    telefone?: string;
    endereco?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    observacao?: string;
  },
) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new NotFoundError('Cliente');
  return prisma.cliente.update({ where: { id }, data });
}

export async function remover(id: number) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) throw new NotFoundError('Cliente');
  return prisma.cliente.delete({ where: { id } });
}
