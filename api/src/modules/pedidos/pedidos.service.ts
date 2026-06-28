import prisma from '../../lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors';
import { StatusPedido, StatusMesa, SOCKET_EVENTS } from '@chefflow/shared';
import { getIO } from '../../lib/socket';

export async function listar(params: { status?: string; mesa_id?: string }, restauranteId?: number) {
  const where: any = {};

  if (restauranteId) where.restauranteId = restauranteId;

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

export async function criar(
  garcomId: number,
  data: {
    mesaId?: number | null;
    clienteId?: number | null;
    tipoPedido?: string;
    clienteNome?: string | null;
    clienteTelefone?: string | null;
    enderecoEntrega?: string | null;
    taxaEntrega?: number | null;
    formaPagamento?: string | null;
    observacao?: string | null;
  },
) {
  const tipoPedido = (data.tipoPedido as any) || (data.mesaId ? 'MESA' : 'DELIVERY');

  return prisma.$transaction(async (tx) => {
    let mesa = null;

    if (data.mesaId) {
      mesa = await tx.mesa.findUnique({ where: { id: data.mesaId } });
      if (!mesa) throw new NotFoundError('Mesa');

      // Verificar se ja existe pedido aberto para esta mesa
      const pedidoExistente = await tx.pedido.findFirst({
        where: { mesaId: data.mesaId, statusPedido: 'ABERTO' },
      });
      if (pedidoExistente) {
        throw new ConflictError('Já existe um pedido aberto para esta mesa');
      }
    }

    const pedido = await tx.pedido.create({
      data: {
        mesaId: data.mesaId || null,
        garcomId,
        clienteId: data.clienteId || null,
        tipoPedido,
        statusPedido: 'ABERTO',
        statusEntrega: tipoPedido !== 'MESA' ? 'CONFIRMADO' : null,
        clienteNome: data.clienteNome || null,
        clienteTelefone: data.clienteTelefone || null,
        enderecoEntrega: data.enderecoEntrega || null,
        taxaEntrega: data.taxaEntrega ?? null,
        formaPagamento: (data.formaPagamento as any) || null,
        observacao: data.observacao || null,
      },
      include: {
        mesa: true,
        garcom: { select: { id: true, nome: true } },
        cliente: true,
      },
    });

    if (mesa) {
      await tx.mesa.update({
        where: { id: mesa.id },
        data: { status: 'OCUPADA' },
      });

      try {
        const io = getIO();
        io.to('tables').emit(SOCKET_EVENTS.MESA_STATUS_CHANGED, {
          mesaId: mesa.id,
          mesaNumero: mesa.numero,
          novoStatus: StatusMesa.OCUPADA,
        });
      } catch {}
    }

    return pedido;
  });
}

export async function fecharPedido(pedidoId: number, formaPagamento?: string | null) {
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

    // Calcular total (soma itens + taxa de entrega)
    const subtotal = pedido.itens.reduce((acc, item) => {
      return acc + Number(item.precoUnitario) * item.quantidade;
    }, 0);
    const total = subtotal + Number(pedido.taxaEntrega ?? 0);

    // Atualizar pedido para PAGO
    const pedidoAtualizado = await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        statusPedido: 'PAGO',
        statusEntrega: pedido.tipoPedido !== 'MESA' ? 'ENTREGUE' : null,
        total,
        formaPagamento: (formaPagamento as any) ?? pedido.formaPagamento,
        version: { increment: 1 },
      },
      include: {
        mesa: true,
        garcom: { select: { id: true, nome: true } },
        itens: { include: { produto: true } },
      },
    });

    // Liberar a mesa (se houver)
    if (pedido.mesaId && pedido.mesa) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { status: 'LIVRE' },
      });

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
    }

    return pedidoAtualizado;
  });
}

export async function atualizarStatusEntrega(pedidoId: number, statusEntrega: string) {
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) throw new NotFoundError('Pedido');
  if (pedido.statusPedido !== 'ABERTO') throw new ValidationError('Pedido não está aberto');

  return prisma.pedido.update({
    where: { id: pedidoId },
    data: { statusEntrega: statusEntrega as any, version: { increment: 1 } },
    include: {
      mesa: true,
      garcom: { select: { id: true, nome: true } },
      cliente: true,
      itens: { include: { produto: true } },
    },
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

    // Liberar a mesa (se houver)
    if (pedido.mesaId && pedido.mesa) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { status: 'LIVRE' },
      });

      try {
        const io = getIO();
        io.to('tables').emit(SOCKET_EVENTS.MESA_STATUS_CHANGED, {
          mesaId: pedido.mesa.id,
          mesaNumero: pedido.mesa.numero,
          novoStatus: StatusMesa.LIVRE,
        });
      } catch {}
    }

    return pedidoAtualizado;
  });
}
