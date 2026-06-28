import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import { UnauthorizedError, NotFoundError } from '../../lib/errors';
import { AuthPayload } from '@chefflow/shared';

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
  const usuario = await prisma.usuario.findFirst({
    where: { email },
    orderBy: [{ restauranteId: 'asc' }, { id: 'asc' }],
  });

  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    throw new UnauthorizedError('E-mail ou senha inválidos');
  }

  const payload: AuthPayload = {
    userId: usuario.id,
    perfil: usuario.perfil as any,
    restauranteId: usuario.restauranteId ?? undefined,
  };
  const tokens = generateTokens(payload);

  const { senhaHash, ...usuarioSemSenha } = usuario;

  const restaurante = usuario.restauranteId
    ? await prisma.restaurante.findUnique({ where: { id: usuario.restauranteId } })
    : null;

  return { ...tokens, usuario: usuarioSemSenha, restaurante: restaurante ?? undefined };
}

export async function loginPin(pin: string) {
  const usuario = await prisma.usuario.findFirst({ where: { pin } });

  if (!usuario || !usuario.ativo) {
    throw new UnauthorizedError('PIN inválido');
  }

  const payload: AuthPayload = {
    userId: usuario.id,
    perfil: usuario.perfil as any,
    restauranteId: usuario.restauranteId ?? undefined,
  };
  const tokens = generateTokens(payload);

  const { senhaHash, ...usuarioSemSenha } = usuario;

  const restaurante = usuario.restauranteId
    ? await prisma.restaurante.findUnique({ where: { id: usuario.restauranteId } })
    : null;

  return { ...tokens, usuario: usuarioSemSenha, restaurante: restaurante ?? undefined };
}

export async function getDemoToken() {
  const usuario = await prisma.usuario.findFirst({
    where: { email: 'demo@chefflow.com' },
  });

  if (!usuario || !usuario.ativo) {
    throw new NotFoundError('Usuário demo não encontrado');
  }

  const payload: AuthPayload = {
    userId: usuario.id,
    perfil: usuario.perfil as any,
    restauranteId: usuario.restauranteId ?? undefined,
  };
  const tokens = generateTokens(payload);

  const { senhaHash, ...usuarioSemSenha } = usuario;
  const restaurante = usuario.restauranteId
    ? await prisma.restaurante.findUnique({ where: { id: usuario.restauranteId } })
    : null;

  return { ...tokens, usuario: usuarioSemSenha, restaurante: restaurante ?? undefined };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as AuthPayload;

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.userId } });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    const payload: AuthPayload = {
      userId: usuario.id,
      perfil: usuario.perfil as any,
      restauranteId: usuario.restauranteId ?? undefined,
    };
    const tokens = generateTokens(payload);
    const { senhaHash, ...usuarioSemSenha } = usuario;
    const restaurante = usuario.restauranteId
      ? await prisma.restaurante.findUnique({ where: { id: usuario.restauranteId } })
      : null;

    return { ...tokens, usuario: usuarioSemSenha, restaurante: restaurante ?? undefined };
  } catch {
    throw new UnauthorizedError('Refresh token inválido ou expirado');
  }
}
