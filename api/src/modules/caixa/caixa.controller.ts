import { Request, Response } from 'express';
import * as caixaService from './caixa.service';

export async function abrir(req: Request, res: Response) {
  const { valorInicial, observacao } = req.body;
  const caixa = await caixaService.abrirCaixa(req.user!.userId, valorInicial, observacao);
  res.status(201).json(caixa);
}

export async function fechar(req: Request, res: Response) {
  const caixa = await caixaService.fecharCaixa(Number(req.params.id));
  res.json(caixa);
}

export async function atual(_req: Request, res: Response) {
  const caixa = await caixaService.getCaixaAtual();
  res.json(caixa);
}

export async function historico(_req: Request, res: Response) {
  const caixas = await caixaService.getHistoricoCaixas();
  res.json(caixas);
}

export async function movimentacao(req: Request, res: Response) {
  const { tipo, valor, descricao } = req.body;
  const mov = await caixaService.registrarMovimentacao(
    Number(req.params.id), tipo, valor, descricao
  );
  res.status(201).json(mov);
}
