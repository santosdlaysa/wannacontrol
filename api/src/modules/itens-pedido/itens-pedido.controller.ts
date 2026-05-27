import { Request, Response } from 'express';
import * as itensService from './itens-pedido.service';

export async function adicionar(req: Request, res: Response) {
  const pedidoId = Number(req.params.pedidoId);
  const itens = await itensService.adicionarItens(pedidoId, req.body.itens);
  res.status(201).json(itens);
}

export async function atualizarStatus(req: Request, res: Response) {
  const item = await itensService.atualizarStatus(
    Number(req.params.id),
    req.body.statusPreparo
  );
  res.json(item);
}

export async function remover(req: Request, res: Response) {
  const result = await itensService.removerItem(
    Number(req.params.pedidoId),
    Number(req.params.id)
  );
  res.json(result);
}
