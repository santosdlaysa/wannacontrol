import { Request, Response } from 'express';
import * as service from './restaurante.service';

export async function criar(req: Request, res: Response) {
  res.status(201).json(await service.criar(req.body));
}

export async function buscarMe(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.buscarPorId(restauranteId));
}

export async function atualizarMe(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.atualizar(restauranteId, req.body));
}
