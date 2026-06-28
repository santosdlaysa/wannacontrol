import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import { NotFoundError, ValidationError } from '../../lib/errors';

type PlanoId = 'INICIAL' | 'PROFISSIONAL' | 'PREMIUM';

const PLANOS: Record<PlanoId, {
  id: PlanoId;
  nome: string;
  descricao: string;
  valor: number;
  planoSistema: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';
  recursos: string[];
}> = {
  INICIAL: {
    id: 'INICIAL',
    nome: 'Inicial',
    descricao: 'Receba pedidos online, confirme e controle entregas no basico.',
    valor: 75,00,
    planoSistema: 'BASICO',
    recursos: ['Cardapio digital publico', 'Delivery e retirada', 'Confirmar e entregar pedidos', 'Cadastro de clientes e produtos', 'Relatorio basico do dia', 'Painel de pedidos simples'],
  },
  PROFISSIONAL: {
    id: 'PROFISSIONAL',
    nome: 'Profissional',
    descricao: 'Tudo do Inicial mais mesas, cozinha em tempo real, caixa e financeiro.',
    valor: 200,
    planoSistema: 'PROFISSIONAL',
    recursos: ['Tudo do Inicial', 'Mesas e pedidos presenciais', 'Cozinha em tempo real', 'Caixa e sangria', 'Relatorio financeiro completo', 'Multiplos usuarios e perfis'],
  },
  PREMIUM: {
    id: 'PREMIUM',
    nome: 'Premium',
    descricao: 'Operacao completa com suporte prioritario e implantacao acompanhada.',
    valor: 597,
    planoSistema: 'ENTERPRISE',
    recursos: ['Tudo do Profissional', 'Entregadores cadastrados', 'Complementos por produto', 'Suporte prioritario', 'Implantacao acompanhada', 'Personalizacoes leves'],
  },
};

interface MercadoPagoPaymentResponse {
  id: number;
  status: string;
  status_detail?: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  metadata?: Record<string, unknown>;
}

interface MercadoPagoPreferenceResponse {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

function getPlano(id: string) {
  const plano = PLANOS[id as PlanoId];
  if (!plano) throw new ValidationError('Plano invalido');
  return plano;
}

function assertMercadoPagoConfigured() {
  if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new ValidationError('Configure MERCADO_PAGO_ACCESS_TOKEN para receber pagamentos');
  }
}

async function mercadoPagoRequest<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  assertMercadoPagoConfigured();

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = data?.message || data?.error || 'Erro ao criar pagamento no Mercado Pago';
    throw new ValidationError(String(message));
  }

  return data as T;
}

async function getRestaurante(restauranteId: number) {
  const restaurante = await prisma.restaurante.findUnique({
    where: { id: restauranteId },
    select: { id: true, nome: true, email: true, plano: true },
  });
  if (!restaurante) throw new NotFoundError('Restaurante');
  return restaurante;
}

export function listarPlanos() {
  return Object.values(PLANOS);
}

export async function criarPagamentoPix(restauranteId: number, planoId: string, payerEmail?: string | null) {
  const [restaurante, plano] = await Promise.all([
    getRestaurante(restauranteId),
    Promise.resolve(getPlano(planoId)),
  ]);

  const email = payerEmail || restaurante.email;
  if (!email) throw new ValidationError('Informe um e-mail para gerar o pagamento');

  const payment = await mercadoPagoRequest<MercadoPagoPaymentResponse>('/v1/payments', {
    transaction_amount: plano.valor,
    description: `Assinatura ChefFlow - Plano ${plano.nome}`,
    payment_method_id: 'pix',
    external_reference: `assinatura:${restaurante.id}:${plano.id}`,
    notification_url: env.MERCADO_PAGO_WEBHOOK_URL || undefined,
    payer: {
      email,
      first_name: restaurante.nome,
    },
    metadata: {
      restaurante_id: restaurante.id,
      plano_id: plano.id,
      plano_sistema: plano.planoSistema,
    },
  });

  const transactionData = payment.point_of_interaction?.transaction_data;
  if (!transactionData?.qr_code || !transactionData.qr_code_base64) {
    throw new ValidationError('Mercado Pago nao retornou o QR Code Pix');
  }

  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    expiresAt: payment.date_of_expiration,
    qrCode: transactionData.qr_code,
    qrCodeBase64: transactionData.qr_code_base64,
    ticketUrl: transactionData.ticket_url,
    plano,
  };
}

export async function criarCheckoutCartao(restauranteId: number, planoId: string, payerEmail?: string | null) {
  const [restaurante, plano] = await Promise.all([
    getRestaurante(restauranteId),
    Promise.resolve(getPlano(planoId)),
  ]);

  const email = payerEmail || restaurante.email || undefined;
  const preference = await mercadoPagoRequest<MercadoPagoPreferenceResponse>('/checkout/preferences', {
    items: [
      {
        title: `Assinatura ChefFlow - Plano ${plano.nome}`,
        description: plano.descricao,
        quantity: 1,
        unit_price: plano.valor,
        currency_id: 'BRL',
      },
    ],
    payer: email ? { email } : undefined,
    external_reference: `assinatura:${restaurante.id}:${plano.id}`,
    notification_url: env.MERCADO_PAGO_WEBHOOK_URL || undefined,
    back_urls: {
      success: `${env.APP_URL}/assinatura?status=approved`,
      pending: `${env.APP_URL}/assinatura?status=pending`,
      failure: `${env.APP_URL}/assinatura?status=failure`,
    },
    auto_return: 'approved',
    payment_methods: {
      excluded_payment_types: [
        { id: 'ticket' },
        { id: 'bank_transfer' },
        { id: 'debit_card' },
      ],
      installments: 12,
    },
    metadata: {
      restaurante_id: restaurante.id,
      plano_id: plano.id,
      plano_sistema: plano.planoSistema,
    },
  });

  return {
    id: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    plano,
  };
}

export async function consultarPagamento(restauranteId: number, paymentId: string) {
  const payment = await mercadoPagoRequest<MercadoPagoPaymentResponse>(`/v1/payments/${paymentId}`, undefined, 'GET');
  const metadata = payment.metadata || {};
  const paymentRestauranteId = Number(metadata.restaurante_id);
  const planoId = String(metadata.plano_id || '');
  const plano = getPlano(planoId);

  if (paymentRestauranteId !== restauranteId) {
    throw new NotFoundError('Pagamento');
  }

  if (payment.status === 'approved') {
    await prisma.restaurante.update({
      where: { id: restauranteId },
      data: { plano: plano.planoSistema, ativo: true },
    });
  }

  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    plano,
  };
}

export async function processarWebhookPagamento(paymentId: string) {
  if (!paymentId || !env.MERCADO_PAGO_ACCESS_TOKEN) return { received: true };

  const payment = await mercadoPagoRequest<MercadoPagoPaymentResponse>(`/v1/payments/${paymentId}`, undefined, 'GET');
  const metadata = payment.metadata || {};
  const restauranteId = Number(metadata.restaurante_id);
  const planoId = String(metadata.plano_id || '');
  const plano = getPlano(planoId);

  if (!restauranteId) return { received: true };

  if (payment.status === 'approved') {
    await prisma.restaurante.update({
      where: { id: restauranteId },
      data: { plano: plano.planoSistema, ativo: true },
    });
  }

  return {
    received: true,
    status: payment.status,
    restauranteId,
    plano: plano.id,
  };
}
