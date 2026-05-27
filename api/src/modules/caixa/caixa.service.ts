import prisma from '../../lib/prisma';
import { ValidationError, NotFoundError, ConflictError } from '../../lib/errors';

export async function abrirCaixa(operadorId: number, valorInicial: number, observacao?: string) {
  // Verificar se já existe caixa aberto
  const caixaAberto = await prisma.caixa.findFirst({
    where: { aberto: true },
  });

  if (caixaAberto) {
    throw new ConflictError('Já existe um caixa aberto. Feche-o antes de abrir um novo.');
  }

  return prisma.caixa.create({
    data: {
      operadorId,
      valorInicial,
      observacao,
    },
    include: {
      operador: { select: { id: true, nome: true } },
    },
  });
}

export async function fecharCaixa(caixaId: number) {
  const caixa = await prisma.caixa.findUnique({
    where: { id: caixaId },
    include: { movimentacoes: true },
  });

  if (!caixa) throw new NotFoundError('Caixa');
  if (!caixa.aberto) throw new ValidationError('Este caixa já está fechado');

  // Calcular total de vendas no período do caixa
  const pedidosPagos = await prisma.pedido.findMany({
    where: {
      statusPedido: 'PAGO',
      dataCriacao: {
        gte: caixa.aberturaEm,
        lte: new Date(),
      },
    },
    include: { itens: true },
  });

  const totalVendas = pedidosPagos.reduce((sum, pedido) => {
    return sum + pedido.itens.reduce(
      (s, item) => s + Number(item.precoUnitario) * item.quantidade, 0
    );
  }, 0);

  // Calcular sangrias e suprimentos
  const totalSangrias = caixa.movimentacoes
    .filter((m) => m.tipo === 'SANGRIA')
    .reduce((sum, m) => sum + Number(m.valor), 0);

  const totalSuprimentos = caixa.movimentacoes
    .filter((m) => m.tipo === 'SUPRIMENTO')
    .reduce((sum, m) => sum + Number(m.valor), 0);

  const valorFinal = Number(caixa.valorInicial) + totalVendas + totalSuprimentos - totalSangrias;

  return prisma.caixa.update({
    where: { id: caixaId },
    data: {
      aberto: false,
      fechamentoEm: new Date(),
      totalVendas,
      valorFinal,
    },
    include: {
      operador: { select: { id: true, nome: true } },
      movimentacoes: { orderBy: { criadoEm: 'asc' } },
    },
  });
}

export async function getCaixaAtual() {
  return prisma.caixa.findFirst({
    where: { aberto: true },
    include: {
      operador: { select: { id: true, nome: true } },
      movimentacoes: { orderBy: { criadoEm: 'desc' } },
    },
  });
}

export async function getHistoricoCaixas() {
  return prisma.caixa.findMany({
    where: { aberto: false },
    include: {
      operador: { select: { id: true, nome: true } },
      movimentacoes: true,
    },
    orderBy: { aberturaEm: 'desc' },
    take: 30,
  });
}

export async function registrarMovimentacao(
  caixaId: number,
  tipo: 'SANGRIA' | 'SUPRIMENTO',
  valor: number,
  descricao: string
) {
  const caixa = await prisma.caixa.findUnique({ where: { id: caixaId } });

  if (!caixa) throw new NotFoundError('Caixa');
  if (!caixa.aberto) throw new ValidationError('Caixa está fechado');

  return prisma.movimentacaoCaixa.create({
    data: { caixaId, tipo, valor, descricao },
  });
}
