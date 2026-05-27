import prisma from '../../lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors';
import { StatusPedido, StatusMesa, SOCKET_EVENTS } from '@cafecontrol/shared';
import { getIO } from '../../lib/socket';

export async function listar(params: { status?: string; mesa_id?: string }) {
  const where: any = {};

  if (params.status) {
    where.statusPedido = params.status;
  }

  if (params.mesa_id) {
    where.mesaId = Number(params.mesa_id);
  }

  return prisma.pedido.findMany({
    where,
    include: {
      mesa: true,
      garcom: { select: { id: true, nome: true } },
      itens: {
        include: { produto: { select: { id: true, nome: true, categoria: true } } },
        orderBy: { criadoEm: 'asc' },
      },
    },
    orderBy: { dataCriacao: 'desc' },
  });
}

export async function buscarPorId(id: number) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      mesa: true,
      garcom: { select: { id: true, nome: true } },
      itens: {
        include: { produto: true },
        orderBy: { criadoEm: 'asc' },
      },
    },
  });

  if (!pedido) throw new NotFoundError('Pedido');
  return pedido;
}

export async function criar(mesaId: number, garcomId: number) {
  // Usar transacao para garantir atomicidade
  return prisma.$transaction(async (tx) => {
    const mesa = await tx.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa) throw new NotFoundError('Mesa');

    // Verificar se ja existe pedido aberto para esta mesa
    const pedidoExistente = await tx.pedido.findFirst({
      where: { mesaId, statusPedido: 'ABERTO' },
    });

    if (pedidoExistente) {
      throw new ConflictError('Já existe um pedido aberto para esta mesa');
    }

    // Criar pedido e atualizar status da mesa atomicamente
    const pedido = await tx.pedido.create({
      data: {
        mesaId,
        garcomId,
        statusPedido: 'ABERTO',
      },
      include: {
        mesa: true,
        garcom: { select: { id: true, nome: true } },
      },
    });

    await tx.mesa.update({
      where: { id: mesaId },
      data: { status: 'OCUPADA' },
    });

    // Emitir evento de mudanca de status da mesa
    try {
      const io = getIO();
      io.to('tables').emit(SOCKET_EVENTS.MESA_STATUS_CHANGED, {
        mesaId: mesa.id,
        mesaNumero: mesa.numero,
        novoStatus: StatusMesa.OCUPADA,
      });
    } catch {}

    return pedido;
  });
}

export async function fecharPedido(pedidoId: number) {
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: true,
        mesa: true,
      },
    });

    if (!pedido) throw new NotFoundError('Pedido');

    if (pedido.statusPedido !== 'ABERTO') {
      throw new ValidationError('Pedido não está aberto');
    }

    // Calcular total
    const total = pedido.itens.reduce((acc, item) => {
      return acc + Number(item.precoUnitario) * item.quantidade;
    }, 0);

    // Atualizar pedido para PAGO
    const pedidoAtualizado = await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        statusPedido: 'PAGO',
        total,
        version: { increment: 1 },
      },
      include: {
        mesa: true,
        garcom: { select: { id: true, nome: true } },
        itens: { include: { produto: true } },
      },
    });

    // Liberar a mesa
    await tx.mesa.update({
      where: { id: pedido.mesaId },
      data: { status: 'LIVRE' },
    });

    // Emitir eventos
    try {
      const io = getIO();
      io.to('tables').emit(SOCKET_EVENTS.MESA_STATUS_CHANGED, {
        mesaId: pedido.mesa.id,
        mesaNumero: pedido.mesa.numero,
        novoStatus: StatusMesa.LIVRE,
      });
      io.to('tables').emit(SOCKET_EVENTS.ORDER_CLOSED, {
        pedidoId: pedido.id,
        mesaId: pedido.mesa.id,
        mesaNumero: pedido.mesa.numero,
      });
    } catch {}

    return pedidoAtualizado;
  });
}

export async function cancelarPedido(pedidoId: number) {
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: pedidoId },
      include: { mesa: true },
    });

    if (!pedido) throw new NotFoundError('Pedido');

    if (pedido.statusPedido !== 'ABERTO') {
      throw new ValidationError('Pedido não está aberto');
    }

    const pedidoAtualizado = await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        statusPedido: 'CANCELADO',
        version: { increment: 1 },
      },
    });

    // Liberar a mesa
    await tx.mesa.update({
      where: { id: pedido.mesaId },
      data: { status: 'LIVRE' },
    });

    // Emitir eventos
    try {
      const io = getIO();
      io.to('tables').emit(SOCKET_EVENTS.MESA_STATUS_CHANGED, {
        mesaId: pedido.mesa.id,
        mesaNumero: pedido.mesa.numero,
        novoStatus: StatusMesa.LIVRE,
      });
    } catch {}

    return pedidoAtualizado;
  });
}
