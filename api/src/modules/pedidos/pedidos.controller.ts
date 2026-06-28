import { Request, Response } from 'express';
import * as pedidosService from './pedidos.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const pedidos = await pedidosService.listar(req.query as any, restauranteId);
  res.json(pedidos);
}

export async function buscarPorId(req: Request, res: Response) {
  const pedido = await pedidosService.buscarPorId(Number(req.params.id));
  res.json(pedido);
}

export async function criar(req: Request, res: Response) {
  const { mesaId, clienteId, tipoPedido, clienteNome, clienteTelefone, enderecoEntrega, taxaEntrega, formaPagamento, observacao } = req.body;
  const pedido = await pedidosService.criar(req.user!.userId, {
    mesaId,
    clienteId,
    tipoPedido,
    clienteNome,
    clienteTelefone,
    enderecoEntrega,
    taxaEntrega,
    formaPagamento,
    observacao,
  });
  res.status(201).json(pedido);
}

export async function fechar(req: Request, res: Response) {
  const pedido = await pedidosService.fecharPedido(Number(req.params.id), req.body?.formaPagamento);
  res.json(pedido);
}

export async function cancelar(req: Request, res: Response) {
  const pedido = await pedidosService.cancelarPedido(Number(req.params.id));
  res.json(pedido);
}

export async function atualizarStatusEntrega(req: Request, res: Response) {
  const pedido = await pedidosService.atualizarStatusEntrega(Number(req.params.id), req.body.statusEntrega);
  res.json(pedido);
}
