import prisma from '../../lib/prisma';
import { ValidationError } from '../../lib/errors';

const DEFAULTS: Record<string, string> = {
  restaurante_aberto: 'true',
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

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export async function buscarBairroPorCep(cep: string) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    throw new ValidationError('Informe um CEP valido com 8 digitos');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  if (!response.ok) {
    throw new ValidationError('Nao foi possivel consultar o CEP agora');
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) {
    throw new ValidationError('CEP nao encontrado');
  }

  const bairro = data.bairro?.trim();
  if (!bairro) {
    throw new ValidationError('Este CEP nao retornou bairro');
  }

  return {
    cep: data.cep,
    bairro,
    cidade: data.localidade,
    uf: data.uf,
    logradouro: data.logradouro,
  };
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
