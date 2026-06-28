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

export async function listarBairros(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  res.json(await service.listarBairros(restauranteId));
}

export async function criarBairro(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  const { bairro, taxa } = req.body;
  res.status(201).json(await service.criarBairro(restauranteId, bairro, Number(taxa)));
}

export async function atualizarBairro(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  const { bairro, taxa, ativo } = req.body;
  await service.atualizarBairro(Number(req.params.id), restauranteId, bairro, Number(taxa), ativo !== false);
  res.json({ ok: true });
}

export async function deletarBairro(req: Request, res: Response) {
  const restauranteId = req.user!.restauranteId!;
  await service.deletarBairro(Number(req.params.id), restauranteId);
  res.json({ ok: true });
}
