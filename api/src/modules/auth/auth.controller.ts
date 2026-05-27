import { Request, Response } from 'express';
import * as authService from './auth.service';

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  const result = await authService.loginEmail(email, senha);
  res.json(result);
}

export async function loginPin(req: Request, res: Response) {
  const { pin } = req.body;
  const result = await authService.loginPin(pin);
  res.json(result);
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAccessToken(refreshToken);
  res.json(tokens);
}
