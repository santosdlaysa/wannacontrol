import { Request, Response } from 'express';
import * as usuariosService from './usuarios.service';

export async function listar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const usuarios = await usuariosService.listar(restauranteId);
  res.json(usuarios);
}

export async function buscarPorId(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const usuario = await usuariosService.buscarPorId(Number(req.params.id), restauranteId);
  res.json(usuario);
}

export async function criar(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const usuario = await usuariosService.criar({ ...req.body, restauranteId });
  res.status(201).json(usuario);
}

export async function atualizar(req: Request, res: Response) {
  const usuario = await usuariosService.atualizar(Number(req.params.id), req.body);
  res.json(usuario);
}

export async function desativar(req: Request, res: Response) {
  const usuario = await usuariosService.desativar(Number(req.params.id));
  res.json(usuario);
}
