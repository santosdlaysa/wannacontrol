import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { normalizeModules, SYSTEM_MODULES } from './admin-modules';
import { sendTelegram } from '../../lib/telegram';

const PLANO_SISTEMA_MAP: Record<string, 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE'> = {
  INICIAL: 'BASICO',
  PROFISSIONAL: 'PROFISSIONAL',
  PREMIUM: 'ENTERPRISE',
};

type RestauranteModuloRow = {
  restaurante_id: number;
  modulo: string;
  ativo: boolean;
};

async function getModulosByRestaurante(restauranteIds: number[]) {
  if (restauranteIds.length === 0) return new Map<number, Record<string, boolean>>();

  const rows = await prisma.$queryRaw<RestauranteModuloRow[]>`
    SELECT restaurante_id, modulo, ativo
    FROM restaurante_modulos
    WHERE restaurante_id = ANY(${restauranteIds})
  `;

  const map = new Map<number, Record<string, boolean>>();
  for (const id of restauranteIds) {
    map.set(id, Object.fromEntries(SYSTEM_MODULES.map((modulo) => [modulo, true])));
  }

  for (const row of rows) {
    const current = map.get(row.restaurante_id) ?? {};
    current[row.modulo] = row.ativo;
    map.set(row.restaurante_id, current);
  }

  return map;
}

export async function listarRestaurantes() {
  const restaurantes = await prisma.restaurante.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      _count: {
        select: {
          usuarios: true,
          produtos: true,
          pedidos: true,
          clientes: true,
          mesas: true,
        },
      },
    },
  });

  const modulosMap = await getModulosByRestaurante(restaurantes.map((r) => r.id));

  return restaurantes.map((restaurante) => ({
    ...restaurante,
    modulos: modulosMap.get(restaurante.id) ?? {},
  }));
}

export async function criarRestaurante(data: {
  nome: string;
  slug: string;
  email?: string | null;
  telefone?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  plano?: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';
  ativo?: boolean;
  adminNome?: string;
  adminEmail?: string;
  adminSenha?: string;
  modulos?: string[];
}) {
  const existing = await prisma.restaurante.findUnique({ where: { slug: data.slug } });
  if (existing) throw new ConflictError('Slug ja esta em uso');

  const modulos = normalizeModules(data.modulos);

  return prisma.$transaction(async (tx) => {
    const restaurante = await tx.restaurante.create({
      data: {
        nome: data.nome,
        slug: data.slug,
        email: data.email || null,
        telefone: data.telefone || null,
        cnpj: data.cnpj || null,
        endereco: data.endereco || null,
        plano: data.plano || 'BASICO',
        ativo: data.ativo ?? true,
      },
    });

    if (data.adminNome && data.adminEmail && data.adminSenha) {
      const senhaHash = await bcrypt.hash(data.adminSenha, 10);
      await tx.usuario.create({
        data: {
          restauranteId: restaurante.id,
          nome: data.adminNome,
          email: data.adminEmail,
          senhaHash,
          perfil: 'ADMIN',
          ativo: true,
        },
      });
    }

    const enabledModules = modulos.length ? modulos : [...SYSTEM_MODULES];
    for (const modulo of SYSTEM_MODULES) {
      await tx.$executeRaw`
        INSERT INTO restaurante_modulos (restaurante_id, modulo, ativo)
        VALUES (${restaurante.id}, ${modulo}, ${enabledModules.includes(modulo)})
        ON CONFLICT (restaurante_id, modulo)
        DO UPDATE SET ativo = EXCLUDED.ativo, atualizado_em = CURRENT_TIMESTAMP
      `;
    }

    return restaurante;
  });
}

export async function atualizarRestaurante(id: number, data: {
  nome?: string;
  slug?: string;
  email?: string | null;
  telefone?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  plano?: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';
  ativo?: boolean;
}) {
  const restaurante = await prisma.restaurante.findUnique({ where: { id } });
  if (!restaurante) throw new NotFoundError('Restaurante');

  if (data.slug && data.slug !== restaurante.slug) {
    const existing = await prisma.restaurante.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError('Slug ja esta em uso');
  }

  return prisma.restaurante.update({ where: { id }, data });
}

export async function atualizarModulos(restauranteId: number, modulosInput: string[]) {
  const restaurante = await prisma.restaurante.findUnique({ where: { id: restauranteId } });
  if (!restaurante) throw new NotFoundError('Restaurante');

  const modulos = normalizeModules(modulosInput);

  await prisma.$transaction(
    SYSTEM_MODULES.map((modulo) =>
      prisma.$executeRaw`
        INSERT INTO restaurante_modulos (restaurante_id, modulo, ativo)
        VALUES (${restauranteId}, ${modulo}, ${modulos.includes(modulo)})
        ON CONFLICT (restaurante_id, modulo)
        DO UPDATE SET ativo = EXCLUDED.ativo, atualizado_em = CURRENT_TIMESTAMP
      `
    )
  );

  return {
    restauranteId,
    modulos: Object.fromEntries(SYSTEM_MODULES.map((m) => [m, modulos.includes(m)])),
  };
}

export async function listarSolicitacoesPix() {
  return prisma.solicitacaoPix.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      restaurante: {
        select: { id: true, nome: true, email: true, plano: true, ativo: true },
      },
    },
  });
}

export async function aprovarSolicitacaoPix(id: number) {
  const solicitacao = await prisma.solicitacaoPix.findUnique({
    where: { id },
    include: { restaurante: true },
  });
  if (!solicitacao) throw new NotFoundError('Solicitacao');

  const planoSistema = PLANO_SISTEMA_MAP[solicitacao.planoId] || 'BASICO';

  await prisma.$transaction([
    prisma.solicitacaoPix.update({ where: { id }, data: { status: 'APROVADO' } }),
    prisma.restaurante.update({
      where: { id: solicitacao.restauranteId },
      data: { plano: planoSistema, ativo: true },
    }),
  ]);

  await sendTelegram(
    `✅ <b>Pagamento confirmado!</b>\n\n` +
    `Restaurante: <b>${solicitacao.restaurante.nome}</b>\n` +
    `Plano <b>${solicitacao.planoNome}</b> ativado com sucesso.`
  );

  return { ok: true };
}

export async function rejeitarSolicitacaoPix(id: number) {
  const solicitacao = await prisma.solicitacaoPix.findUnique({ where: { id } });
  if (!solicitacao) throw new NotFoundError('Solicitacao');

  await prisma.solicitacaoPix.update({ where: { id }, data: { status: 'REJEITADO' } });

  return { ok: true };
}

export { SYSTEM_MODULES };
