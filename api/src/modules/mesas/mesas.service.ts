import prisma from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { StatusMesa } from '@cafecontrol/shared';
import { getIO } from '../../lib/socket';
import { SOCKET_EVENTS } from '@cafecontrol/shared';

export async function listar(restauranteId?: number) {
  const where: any = {};
  if (restauranteId) where.restauranteId = restauranteId;

  return prisma.mesa.findMany({
    where,
    orderBy: { numero: 'asc' },
    include: {
      pedidos: {
        where: { statusPedido: 'ABERTO' },
        include: {
          garcom: {
            select: { id: true, nome: true },
          },
          itens: {
            include: { produto: { select: { nome: true } } },
          },
        },
        take: 1,
      },
    },
  });
}

export async function buscarPorId(id: number, restauranteId?: number) {
  const where: any = { id };
  if (restauranteId) where.restauranteId = restauranteId;

  const mesa = await prisma.mesa.findFirst({
    where,
    include: {
      pedidos: {
        where: { statusPedido: 'ABERTO' },
        include: {
          garcom: {
            select: { id: true, nome: true },
          },
          itens: {
            include: { produto: true },
            orderBy: { criadoEm: 'desc' },
          },
        },
        take: 1,
      },
    },
  });

  if (!mesa) throw new NotFoundError('Mesa');
  return mesa;
}

export async function alterarStatus(id: number, novoStatus: StatusMesa) {
  const mesa = await prisma.mesa.findUnique({ where: { id } });
  if (!mesa) throw new NotFoundError('Mesa');

  // Regra: mesa so pode ficar LIVRE se nao tiver pedido ABERTO
  if (novoStatus === StatusMesa.LIVRE) {
    const pedidoAberto = await prisma.pedido.findFirst({
      where: { mesaId: id, statusPedido: 'ABERTO' },
    });

    if (pedidoAberto) {
      throw new ValidationError(
        'Mesa possui pedido em aberto. Feche o pedido antes de liberar a mesa.'
      );
    }
  }

  const mesaAtualizada = await prisma.mesa.update({
    where: { id },
    data: { status: novoStatus as any },
  });

  // Emitir evento de mudanca de status via WebSocket
  try {
    const io = getIO();
    io.to('tables').emit(SOCKET_EVENTS.MESA_STATUS_CHANGED, {
      mesaId: mesaAtualizada.id,
      mesaNumero: mesaAtualizada.numero,
      novoStatus: mesaAtualizada.status,
    });
  } catch {
    // Socket pode nao estar inicializado em testes
  }

  return mesaAtualizada;
}
