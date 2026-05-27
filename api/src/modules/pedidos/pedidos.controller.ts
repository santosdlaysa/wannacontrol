import { Request, Response } from 'express';
import * as pedidosService from './pedidos.service';

export async function listar(req: Request, res: Response) {
  const pedidos = await pedidosService.listar(req.query as any);
  res.json(pedidos);
}

export async function buscarPorId(req: Request, res: Response) {
  const pedido = await pedidosService.buscarPorId(Number(req.params.id));
  res.json(pedido);
}

export async function criar(req: Request, res: Response) {
  const pedido = await pedidosService.criar(req.body.mesaId, req.user!.userId, req.body.clienteNome, req.body.clienteTelefone);
  res.status(201).json(pedido);
}

export async function fechar(req: Request, res: Response) {
  const pedido = await pedidosService.fecharPedido(Number(req.params.id));
  res.json(pedido);
}

export async function cancelar(req: Request, res: Response) {
  const pedido = await pedidosService.cancelarPedido(Number(req.params.id));
  res.json(pedido);
}
