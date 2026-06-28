import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';

// ─── Grupos ──────────────────────────────────────────────────────────────────

export async function listarGrupos(restauranteId: number) {
  return prisma.grupoComplemento.findMany({
    where: { restauranteId },
    include: { itens: { where: { disponivel: true }, orderBy: { nome: 'asc' } } },
    orderBy: { nome: 'asc' },
  });
}

export async function buscarGrupoPorId(id: number, restauranteId: number) {
  const grupo = await prisma.grupoComplemento.findFirst({
    where: { id, restauranteId },
    include: { itens: { orderBy: { nome: 'asc' } } },
  });
  if (!grupo) throw new NotFoundError('Grupo de complemento');
  return grupo;
}

export async function criarGrupo(restauranteId: number, data: {
  nome: string;
  descricao?: string | null;
  obrigatorio?: boolean;
  minimo?: number;
  maximo?: number;
  ativo?: boolean;
}) {
  return prisma.grupoComplemento.create({ data: { ...data, restauranteId } });
}

export async function atualizarGrupo(id: number, restauranteId: number, data: Partial<{
  nome: string;
  descricao: string | null;
  obrigatorio: boolean;
  minimo: number;
  maximo: number;
  ativo: boolean;
}>) {
  const grupo = await prisma.grupoComplemento.findFirst({ where: { id, restauranteId } });
  if (!grupo) throw new NotFoundError('Grupo de complemento');
  return prisma.grupoComplemento.update({ where: { id }, data });
}

export async function removerGrupo(id: number, restauranteId: number) {
  const grupo = await prisma.grupoComplemento.findFirst({ where: { id, restauranteId } });
  if (!grupo) throw new NotFoundError('Grupo de complemento');
  return prisma.grupoComplemento.delete({ where: { id } });
}

// ─── Itens ───────────────────────────────────────────────────────────────────

export async function criarItem(grupoId: number, restauranteId: number, data: {
  nome: string;
  preco: number;
  disponivel?: boolean;
}) {
  const grupo = await prisma.grupoComplemento.findFirst({ where: { id: grupoId, restauranteId } });
  if (!grupo) throw new NotFoundError('Grupo de complemento');
  return prisma.itemComplemento.create({ data: { ...data, grupoId } });
}

export async function atualizarItem(itemId: number, grupoId: number, restauranteId: number, data: Partial<{
  nome: string;
  preco: number;
  disponivel: boolean;
}>) {
  const grupo = await prisma.grupoComplemento.findFirst({ where: { id: grupoId, restauranteId } });
  if (!grupo) throw new NotFoundError('Grupo de complemento');
  const item = await prisma.itemComplemento.findFirst({ where: { id: itemId, grupoId } });
  if (!item) throw new NotFoundError('Item de complemento');
  return prisma.itemComplemento.update({ where: { id: itemId }, data });
}

export async function removerItem(itemId: number, grupoId: number, restauranteId: number) {
  const grupo = await prisma.grupoComplemento.findFirst({ where: { id: grupoId, restauranteId } });
  if (!grupo) throw new NotFoundError('Grupo de complemento');
  const item = await prisma.itemComplemento.findFirst({ where: { id: itemId, grupoId } });
  if (!item) throw new NotFoundError('Item de complemento');
  return prisma.itemComplemento.delete({ where: { id: itemId } });
}

// ─── Vinculo Produto-Grupo ────────────────────────────────────────────────────

export async function vincularGruposProduto(produtoId: number, restauranteId: number, grupoIds: number[]) {
  // Verificar produto pertence ao restaurante
  const produto = await prisma.produto.findFirst({ where: { id: produtoId, restauranteId } });
  if (!produto) throw new NotFoundError('Produto');

  // Remover vinculos existentes e recriar
  await prisma.produtoGrupo.deleteMany({ where: { produtoId } });

  if (grupoIds.length > 0) {
    await prisma.produtoGrupo.createMany({
      data: grupoIds.map((grupoId, ordem) => ({ produtoId, grupoId, ordem })),
    });
  }

  return prisma.produto.findUnique({
    where: { id: produtoId },
    include: { grupos: { include: { grupo: { include: { itens: true } } } } },
  });
}
