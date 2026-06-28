import { Request, Response } from 'express';
import * as service from './complementos.service';

export async function listarGrupos(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.listarGrupos(restauranteId));
}

export async function buscarGrupo(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.buscarGrupoPorId(Number(req.params.grupoId), restauranteId));
}

export async function criarGrupo(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.status(201).json(await service.criarGrupo(restauranteId, req.body));
}

export async function atualizarGrupo(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.atualizarGrupo(Number(req.params.grupoId), restauranteId, req.body));
}

export async function removerGrupo(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  await service.removerGrupo(Number(req.params.grupoId), restauranteId);
  res.status(204).send();
}

export async function criarItem(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.status(201).json(await service.criarItem(Number(req.params.grupoId), restauranteId, req.body));
}

export async function atualizarItem(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.atualizarItem(Number(req.params.itemId), Number(req.params.grupoId), restauranteId, req.body));
}

export async function removerItem(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  await service.removerItem(Number(req.params.itemId), Number(req.params.grupoId), restauranteId);
  res.status(204).send();
}

export async function vincularGruposProduto(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.vincularGruposProduto(Number(req.params.produtoId), restauranteId, req.body.grupoIds));
}
