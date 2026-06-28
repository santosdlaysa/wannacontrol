import { Request, Response } from 'express';
import * as service from './clientes.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const clientes = await service.listar({ busca: req.query.busca as string | undefined }, restauranteId);
  res.json(clientes);
}

export async function buscarPorId(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const cliente = await service.buscarPorId(Number(req.params.id), restauranteId);
  res.json(cliente);
}

export async function criar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const cliente = await service.criar({ ...req.body, restauranteId });
  res.status(201).json(cliente);
}

export async function atualizar(req: Request, res: Response) {
  const cliente = await service.atualizar(Number(req.params.id), req.body);
  res.json(cliente);
}

export async function remover(req: Request, res: Response) {
  await service.remover(Number(req.params.id));
  res.status(204).send();
}
