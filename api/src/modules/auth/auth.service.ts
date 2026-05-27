import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import { UnauthorizedError, NotFoundError } from '../../lib/errors';
import { AuthPayload } from '@cafecontrol/shared';

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(
    payload as unknown as object,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    payload as unknown as object,
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}

export async function loginEmail(email: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const payload: AuthPayload = { userId: usuario.id, perfil: usuario.perfil as any };
  const tokens = generateTokens(payload);

  const { senhaHash, ...usuarioSemSenha } = usuario;

  return { ...tokens, usuario: usuarioSemSenha };
}

export async function loginPin(pin: string) {
  const usuario = await prisma.usuario.findUnique({ where: { pin } });

  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError('PIN inválido');
  }

  const payload: AuthPayload = { userId: usuario.id, perfil: usuario.perfil as any };
  const tokens = generateTokens(payload);

  const { senhaHash, ...usuarioSemSenha } = usuario;

  return { ...tokens, usuario: usuarioSemSenha };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as AuthPayload;

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    const payload: AuthPayload = { userId: usuario.id, perfil: usuario.perfil as any };
    return generateTokens(payload);
  } catch {
    throw new UnauthorizedError('Refresh token inválido ou expirado');
  }
}
