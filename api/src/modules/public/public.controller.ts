import { Request, Response } from 'express';
import * as service from './public.service';

export async function getCardapio(req: Request, res: Response) {
  const data = await service.getCardapio(req.params.slug);
  res.json(data);
}

export async function criarPedido(req: Request, res: Response) {
  const pedido = await service.criarPedidoPublico(req.params.slug, req.body);
  res.status(201).json(pedido);
}
