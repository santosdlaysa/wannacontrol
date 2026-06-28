import { Request, Response } from 'express';
import * as service from './configuracoes.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.listar(restauranteId));
}

export async function atualizar(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.upsertMany(restauranteId, req.body));
}

export async function atualizarChave(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.upsert(restauranteId, req.params.chave, req.body.valor));
}
