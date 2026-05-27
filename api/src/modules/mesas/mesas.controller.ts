import { Request, Response } from 'express';
import * as mesasService from './mesas.service';

export async function listar(_req: Request, res: Response) {
  const mesas = await mesasService.listar();
  res.json(mesas);
}

export async function buscarPorId(req: Request, res: Response) {
  const mesa = await mesasService.buscarPorId(Number(req.params.id));
  res.json(mesa);
}

export async function alterarStatus(req: Request, res: Response) {
  const mesa = await mesasService.alterarStatus(Number(req.params.id), req.body.status);
  res.json(mesa);
}
