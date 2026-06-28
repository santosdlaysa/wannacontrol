import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';

export async function listar(restauranteId?: number) {
  const where: any = {};
  if (restauranteId) where.restauranteId = restauranteId;

  return prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
      pin: true,
      perfil: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: { nome: 'asc' },
  });
}

export async function buscarPorId(id: number, restauranteId?: number) {
  const where: any = { id };
  if (restauranteId) where.restauranteId = restauranteId;

  const usuario = await prisma.usuario.findFirst({
    where,
    select: {
      id: true,
      nome: true,
      email: true,
      pin: true,
      perfil: true,
      ativo: true,
      criadoEm: true,
    },
  });

  if (!usuario) throw new NotFoundError('Usuário');
  return usuario;
}

export async function criar(data: {
  nome: string;
  email: string;
  senha: string;
  pin?: string;
  perfil: string;
  restauranteId?: number;
}) {
  const existente = await prisma.usuario.findFirst({ where: { email: data.email } });
  if (existente) throw new ConflictError('E-mail já está em uso');

  if (data.pin) {
    const pinExistente = await prisma.usuario.findFirst({ where: { pin: data.pin } });
    if (pinExistente) throw new ConflictError('PIN já está em uso');
  }

  const senhaHash = await bcrypt.hash(data.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      senhaHash,
      pin: data.pin,
      perfil: data.perfil as any,
      restauranteId: data.restauranteId,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      pin: true,
      perfil: true,
      ativo: true,
      criadoEm: true,
    },
  });

  return usuario;
}

export async function atualizar(id: number, data: {
  nome?: string;
  email?: string;
  senha?: string;
  pin?: string | null;
  perfil?: string;
  ativo?: boolean;
}) {
  await buscarPorId(id);

  const updateData: any = { ...data };

  if (data.senha) {
    updateData.senhaHash = await bcrypt.hash(data.senha, 10);
    delete updateData.senha;
  }

  if (data.perfil) {
    updateData.perfil = data.perfil as any;
  }

  return prisma.usuario.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nome: true,
      email: true,
      pin: true,
      perfil: true,
      ativo: true,
      criadoEm: true,
    },
  });
}

export async function desativar(id: number) {
  await buscarPorId(id);

  return prisma.usuario.update({
    where: { id },
    data: { ativo: false },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
    },
  });
}
