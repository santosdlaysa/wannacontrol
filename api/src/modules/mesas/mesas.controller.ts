import { Request, Response } from 'express';
import * as mesasService from './mesas.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const mesas = await mesasService.listar(restauranteId);
  res.json(mesas);
}

export async function buscarPorId(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const mesa = await mesasService.buscarPorId(Number(req.params.id), restauranteId);
  res.json(mesa);
}

export async function alterarStatus(req: Request, res: Response) {
  const mesa = await mesasService.alterarStatus(Number(req.params.id), req.body.status);
  res.json(mesa);
}
