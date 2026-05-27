import { Request, Response } from 'express';
import * as produtosService from './produtos.service';

export async function listar(req: Request, res: Response) {
  const produtos = await produtosService.listar(req.query as any);
  res.json(produtos);
}

export async function buscarPorId(req: Request, res: Response) {
  const produto = await produtosService.buscarPorId(Number(req.params.id));
  res.json(produto);
}

export async function criar(req: Request, res: Response) {
  const produto = await produtosService.criar(req.body);
  res.status(201).json(produto);
}

export async function atualizar(req: Request, res: Response) {
  const produto = await produtosService.atualizar(Number(req.params.id), req.body);
  res.json(produto);
}

export async function remover(req: Request, res: Response) {
  const produto = await produtosService.remover(Number(req.params.id));
  res.json(produto);
}

export async function uploadImagem(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ message: 'Nenhuma imagem enviada' });
    return;
  }

  const urlImagem = `/uploads/${req.file.filename}`;
  const produto = await produtosService.atualizar(Number(req.params.id), { urlImagem });
  res.json(produto);
}
