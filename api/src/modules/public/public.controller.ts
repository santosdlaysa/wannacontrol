import { Request, Response } from 'express';
import * as service from './public.service';

export async function getStats(req: Request, res: Response) {
  const data = await service.getStatsPublicos(req.params.slug);
  res.json(data);
}

export async function getCardapio(req: Request, res: Response) {
  const data = await service.getCardapio(req.params.slug);
  res.json(data);
}

export async function criarPedido(req: Request, res: Response) {
  const pedido = await service.criarPedidoPublico(req.params.slug, req.body);
  res.status(201).json(pedido);
}

export async function getCliente(req: Request, res: Response) {
  const data = await service.getClientePublico(
    req.params.slug,
    String(req.query.telefone || ''),
  );
  res.json(data);
}

export async function getStatusPedido(req: Request, res: Response) {
  const data = await service.getStatusPedidoPublico(
    req.params.slug,
    Number(req.params.id),
    String(req.query.telefone || ''),
  );
  res.json(data);
}

export async function getHistoricoPedidos(req: Request, res: Response) {
  const data = await service.getHistoricoPedidosPublico(
    req.params.slug,
    String(req.query.telefone || ''),
  );
  res.json(data);
}

export async function cadastrarRestaurante(req: Request, res: Response) {
  const data = await service.cadastrarRestaurante(req.body);
  res.status(201).json(data);
}
