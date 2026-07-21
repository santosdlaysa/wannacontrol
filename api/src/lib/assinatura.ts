import prisma from './prisma';

const DIAS_CICLO = 30;

// Renovação antes do vencimento estende a partir do vencimento atual, não de hoje
export function calcularNovoVencimento(vencimentoAtual?: Date | null): Date {
  const agora = new Date();
  const base = vencimentoAtual && vencimentoAtual > agora ? vencimentoAtual : agora;
  return new Date(base.getTime() + DIAS_CICLO * 24 * 60 * 60 * 1000);
}

export async function ativarAssinatura(
  restauranteId: number,
  planoSistema: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE',
) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { dataVencimento: true },
  });

  return prisma.restaurante.update({
    where: { id: restauranteId },
    data: {
      plano: planoSistema,
      ativo: true,
      dataVencimento: calcularNovoVencimento(restaurante?.dataVencimento),
    },
  });
}

// Expiração lazy: desativa no momento da consulta, sem depender de cron.
// dataVencimento null = sem vencimento (nunca expira) para não quebrar restaurantes antigos.
export async function aplicarVencimento<
  T extends { id: number; ativo: boolean; dataVencimento: Date | null },
>(restaurante: T): Promise<T> {
  if (
    restaurante.ativo &&
    restaurante.dataVencimento &&
    restaurante.dataVencimento.getTime() < Date.now()
  ) {
    await prisma.restaurante.update({
      where: { id: restaurante.id },
      data: { ativo: false },
    });
    return { ...restaurante, ativo: false };
  }
  return restaurante;
}
