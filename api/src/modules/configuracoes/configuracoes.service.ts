import prisma from '../../lib/prisma';

const DEFAULTS: Record<string, string> = {
  taxa_entrega: '5.00',
  tempo_preparo_medio: '30',
  aceita_delivery: 'true',
  aceita_retirada: 'true',
  horario_abertura: '08:00',
  horario_fechamento: '22:00',
  mensagem_boas_vindas: '',
  percentual_servico: '0',
};

export async function listar(restauranteId: number) {
  const configs = await prisma.configuracao.findMany({ where: { restauranteId } });
  // Merge with defaults
  const result: Record<string, string | null> = { ...DEFAULTS };
  for (const c of configs) {
    result[c.chave] = c.valor;
  }
  return result;
}

export async function upsert(restauranteId: number, chave: string, valor: string | null) {
  return prisma.configuracao.upsert({
    where: { restauranteId_chave: { restauranteId, chave } },
    create: { restauranteId, chave, valor },
    update: { valor },
  });
}

export async function upsertMany(restauranteId: number, configs: Record<string, string | null>) {
  return prisma.$transaction(
    Object.entries(configs).map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where: { restauranteId_chave: { restauranteId, chave } },
        create: { restauranteId, chave, valor },
        update: { valor },
      })
    )
  );
}

// ─── Taxas por Bairro ────────────────────────────────────────────────────────

export async function listarBairros(restauranteId: number) {
  return prisma.taxaEntregaBairro.findMany({
    where: { restauranteId },
    orderBy: { bairro: 'asc' },
  });
}

export async function criarBairro(restauranteId: number, bairro: string, taxa: number) {
  return prisma.taxaEntregaBairro.create({
    data: { restauranteId, bairro: bairro.trim(), taxa },
  });
}

export async function atualizarBairro(id: number, restauranteId: number, bairro: string, taxa: number, ativo: boolean) {
  return prisma.taxaEntregaBairro.updateMany({
    where: { id, restauranteId },
    data: { bairro: bairro.trim(), taxa, ativo },
  });
}

export async function deletarBairro(id: number, restauranteId: number) {
  return prisma.taxaEntregaBairro.deleteMany({
    where: { id, restauranteId },
  });
}
