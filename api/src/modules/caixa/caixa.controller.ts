import { Request, Response } from 'express';
import * as caixaService from './caixa.service';

export async function abrir(req: Request, res: Response) {
  const { valorInicial, observacao } = req.body;
  const restauranteId = req.user?.restauranteId;
  const caixa = await caixaService.abrirCaixa(req.user!.userId, valorInicial, observacao, restauranteId);
  res.status(201).json(caixa);
}

export async function fechar(req: Request, res: Response) {
  const caixa = await caixaService.fecharCaixa(Number(req.params.id));
  res.json(caixa);
}

export async function atual(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const caixa = await caixaService.getCaixaAtual(restauranteId);
  res.json(caixa);
}

export async function historico(req: Request, res: Response) {
  const restauranteId = req.user?.restauranteId;
  const caixas = await caixaService.getHistoricoCaixas(restauranteId);
  res.json(caixas);
}

export async function movimentacao(req: Request, res: Response) {
  const { tipo, valor, descricao } = req.body;
  const mov = await caixaService.registrarMovimentacao(
    Number(req.params.id), tipo, valor, descricao
  );
  res.status(201).json(mov);
}
