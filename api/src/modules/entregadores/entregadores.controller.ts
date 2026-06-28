import { Request, Response } from 'express';
import * as service from './entregadores.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  const apenasAtivos = req.query.ativo === 'true';
  res.json(await service.listar(restauranteId, apenasAtivos));
}

export async function criar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.status(201).json(await service.criar(restauranteId, req.body));
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
