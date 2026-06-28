import { Request, Response } from 'express';
import * as service from './categorias.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  res.json(await service.listar(restauranteId));
}

export async function buscarPorId(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  res.json(await service.buscarPorId(Number(req.params.id), restauranteId));
}

export async function criar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  const pedido = await service.criar(restauranteId, req.body);
  res.status(201).json(pedido);
}

export async function atualizar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.atualizar(Number(req.params.id), restauranteId, req.body));
}

export async function remover(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  await service.remover(Number(req.params.id), restauranteId);
  res.status(204).send();
}

export async function reordenar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.reordenar(restauranteId, req.body.ordens));
}
