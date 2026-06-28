import prisma from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';

export async function criar(data: {
  nome: string; slug: string; cnpj?: string | null; telefone?: string | null;
  email?: string | null; endereco?: string | null;
}) {
  const existing = await prisma.restaurante.findUnique({ where: { slug: data.slug } });
  if (existing) throw new ConflictError('Slug ja esta em uso');
  return prisma.restaurante.create({ data });
}

export async function buscarPorId(id: number) {
  const r = await prisma.restaurante.findUnique({ where: { id } });
  if (!r) throw new NotFoundError('Restaurante');
  return r;
}

export async function buscarPorSlug(slug: string) {
  const r = await prisma.restaurante.findUnique({ where: { slug } });
  if (!r) throw new NotFoundError('Restaurante');
  return r;
}

export async function atualizar(id: number, data: Partial<{
  nome: string; cnpj: string | null; telefone: string | null;
  email: string | null; logoUrl: string | null; endereco: string | null;
}>) {
  const r = await prisma.restaurante.findUnique({ where: { id } });
  if (!r) throw new NotFoundError('Restaurante');
  return prisma.restaurante.update({ where: { id }, data });
}
