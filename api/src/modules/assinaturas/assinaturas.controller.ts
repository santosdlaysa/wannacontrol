import { Request, Response } from 'express';
import { ValidationError } from '../../lib/errors';
import * as service from './assinaturas.service';

function getRestauranteId(req: Request) {
  const restauranteId = req.user?.restauranteId;
  if (!restauranteId) throw new ValidationError('Restaurante nao identificado');
  return restauranteId;
}

export function listarPlanos(_req: Request, res: Response) {
  res.json(service.listarPlanos());
}

export async function criarPagamentoPix(req: Request, res: Response) {
  const result = await service.criarPagamentoPix(getRestauranteId(req), req.body?.planoId, req.body?.email);
  res.status(201).json(result);
}

export async function criarCheckoutCartao(req: Request, res: Response) {
  const result = await service.criarCheckoutCartao(getRestauranteId(req), req.body?.planoId, req.body?.email);
  res.status(201).json(result);
}

export async function consultarPagamento(req: Request, res: Response) {
  const result = await service.consultarPagamento(getRestauranteId(req), req.params.id);
  res.json(result);
}

export async function solicitarPix(req: Request, res: Response) {
  const result = await service.solicitarPix(getRestauranteId(req), req.body?.planoId);
  res.status(201).json(result);
}

export async function receberWebhook(req: Request, res: Response) {
  // Sempre retornar 200 imediatamente para o Mercado Pago não retentar
  res.json({ received: true });

  const tipo = req.body?.type || req.body?.action;
  if (!tipo?.includes('payment')) return;

  const paymentId =
    req.body?.data?.id ||
    req.body?.id ||
    req.query?.['data.id'] ||
    req.query?.id;

  if (!paymentId || paymentId === '123456') return;

  try {
    await service.processarWebhookPagamento(String(paymentId));
  } catch (err) {
    console.error('[Webhook MP] Erro ao processar pagamento:', paymentId, err);
  }
}
