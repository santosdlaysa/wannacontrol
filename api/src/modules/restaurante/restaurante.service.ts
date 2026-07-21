import prisma from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { aplicarVencimento } from '../../lib/assinatura';
import { SYSTEM_MODULES } from '../admin/admin-modules';

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
  return aplicarVencimento(r);
}

export async function buscarMe(id: number) {
  const restaurante = await buscarPorId(id);

  // Sem linha na tabela = módulo habilitado (compatível com restaurantes antigos)
  const modulos: Record<string, boolean> = Object.fromEntries(
    SYSTEM_MODULES.map((m) => [m, true]),
  );
  try {
    const rows = await prisma.restauranteModulo.findMany({ where: { restauranteId: id } });
    for (const row of rows) modulos[row.modulo] = row.ativo;
  } catch {
    // tabela pode não existir ainda — mantém defaults
  }

  return { ...restaurante, modulos };
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
