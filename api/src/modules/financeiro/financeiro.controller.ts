import { Request, Response } from 'express';
import * as financeiroService from './financeiro.service';

export async function resumoDiario(req: Request, res: Response) {
  const data = req.query.data as string | undefined;
  const restauranteId = req.user?.restauranteId;
  const resumo = await financeiroService.resumoDiario(data, restauranteId);
  res.json(resumo);
}

export async function historico(req: Request, res: Response) {
  const { dataInicio, dataFim } = req.query as { dataInicio?: string; dataFim?: string };
  const restauranteId = req.user?.restauranteId;
  const resultado = await financeiroService.historico({ dataInicio, dataFim }, restauranteId);
  res.json(resultado);
}

export async function dashboard(req: Request, res: Response) {
  const data = req.query.data as string | undefined;
  const restauranteId = req.user?.restauranteId;
  const resultado = await financeiroService.dashboard(data, restauranteId);
  res.json(resultado);
}
