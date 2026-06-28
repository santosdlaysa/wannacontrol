import { Request, Response } from 'express';
import * as financeiroService from './financeiro.service';

export async function resumoDiario(req: Request, res: Response) {
  const data = req.query.data as string | undefined;
  const resumo = await financeiroService.resumoDiario(data);
  res.json(resumo);
}

export async function historico(req: Request, res: Response) {
  const { dataInicio, dataFim } = req.query as { dataInicio?: string; dataFim?: string };
  const resultado = await financeiroService.historico({ dataInicio, dataFim });
  res.json(resultado);
}

export async function dashboard(req: Request, res: Response) {
  const data = req.query.data as string | undefined;
  const resultado = await financeiroService.dashboard(data);
  res.json(resultado);
}
