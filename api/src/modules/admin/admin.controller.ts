import { Request, Response } from 'express';
import * as service from './admin.service';

export async function listarRestaurantes(_req: Request, res: Response) {
  res.json(await service.listarRestaurantes());
}

export async function criarRestaurante(req: Request, res: Response) {
  const restaurante = await service.criarRestaurante(req.body);
  res.status(201).json(restaurante);
}

export async function atualizarRestaurante(req: Request, res: Response) {
  const restaurante = await service.atualizarRestaurante(Number(req.params.id), req.body);
  res.json(restaurante);
}

export async function atualizarModulos(req: Request, res: Response) {
  const result = await service.atualizarModulos(Number(req.params.id), req.body?.modulos || []);
  res.json(result);
}

export async function listarModulos(_req: Request, res: Response) {
  res.json(service.SYSTEM_MODULES);
}
