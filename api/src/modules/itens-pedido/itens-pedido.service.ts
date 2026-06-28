import prisma from '../../lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '../../lib/errors';
import { StatusPreparo, VALID_STATUS_TRANSITIONS, SOCKET_EVENTS } from '@chefflow/shared';
import { getIO } from '../../lib/socket';

interface ItemInput {
  produtoId: number;
  quantidade: number;
  observacao?: string | null;
}

export async function adicionarItens(pedidoId: number, itens: ItemInput[]) {
  return prisma.$transaction(async (tx) => {
    // Verificar pedido existe e esta aberto
    const pedido = await tx.pedido.findUnique({
      where: { id: pedidoId },
      include: { mesa: true },
    });

    if (!pedido) throw new NotFoundError('Pedido');
    if (pedido.statusPedido !== 'ABERTO') {
      throw new ValidationError('Pedido não está aberto para novos itens');
    }

    // Verificar se todos os produtos existem e estao disponiveis
    const produtoIds = itens.map((i) => i.produtoId);
    const produtos = await tx.produto.findMany({
      where: { id: { in: produtoIds } },
    });

    if (produtos.length !== produtoIds.length) {
      throw new NotFoundError('Um ou mais produtos');
    }

    const indisponiveis = produtos.filter((p) => !p.disponivel);
    if (indisponiveis.length > 0) {
      throw new ValidationError(
        `Produto(s) indisponível(eis): ${indisponiveis.map((p) => p.nome).join(', ')}`
      );
    }

    // Mapear precos dos produtos
    const precosMap = new Map(produtos.map((p) => [p.id, p.preco]));
    const nomesMap = new Map(produtos.map((p) => [p.id, p.nome]));

    // Criar itens com preco snapshot
    const itensData = itens.map((item) => ({
      pedidoId,
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario: precosMap.get(item.produtoId)!,
      observacao: item.observacao || null,
      statusPreparo: 'PENDENTE' as const,
    }));

    await tx.itemPedido.createMany({ data: itensData });

    // Incrementar version do pedido
    await tx.pedido.update({
      where: { id: pedidoId },
      data: { version: { increment: 1 } },
    });

    // Buscar itens recem-criados para retorno
    const itensCriados = await tx.itemPedido.findMany({
      where: {
        pedidoId,
        statusPreparo: 'PENDENTE',
      },
      include: { produto: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: itens.length,
    });

    // Emitir evento para a cozinha
    try {
      const io = getIO();
      io.to('kitchen').emit(SOCKET_EVENTS.NEW_ORDER_ITEMS, {
        pedidoId,
        mesaNumero: pedido.mesa?.numero,
        itens: itensCriados.map((item) => ({
          id: item.id,
          produtoNome: item.produto.nome,
          quantidade: item.quantidade,
          observacao: item.observacao,
        })),
      });
    } catch {}

    return itensCriados;
  });
}

export async function atualizarStatus(itemId: number, novoStatus: StatusPreparo) {
  const item = await prisma.itemPedido.findUnique({
    where: { id: itemId },
    include: {
      pedido: { include: { mesa: true } },
      produto: { select: { nome: true } },
    },
  });

  if (!item) throw new NotFoundError('Item do pedido');

  // Validar transicao de status
  const statusAtual = item.statusPreparo as StatusPreparo;
  const transicoesValidas = VALID_STATUS_TRANSITIONS[statusAtual];

  if (!transicoesValidas.includes(novoStatus)) {
    throw new ValidationError(
      `Transição inválida: ${statusAtual} → ${novoStatus}. Transições permitidas: ${transicoesValidas.join(', ') || 'nenhuma'}`
    );
  }

  const itemAtualizado = await prisma.itemPedido.update({
    where: { id: itemId },
    data: { statusPreparo: novoStatus as any },
    include: {
      pedido: { include: { mesa: true } },
      produto: { select: { nome: true } },
    },
  });

  // Emitir eventos via WebSocket
  try {
    const io = getIO();

    // Notificar a cozinha sobre mudanca de status
    io.to('kitchen').emit(SOCKET_EVENTS.ITEM_STATUS_CHANGED, {
      itemId: item.id,
      pedidoId: item.pedidoId,
      mesaNumero: item.pedido.mesa?.numero,
      produtoNome: item.produto.nome,
      novoStatus,
    });

    // Se ficou PRONTO, notificar o garcom responsavel
    if (novoStatus === StatusPreparo.PRONTO) {
      io.to(`waiter:${item.pedido.garcomId}`).emit(SOCKET_EVENTS.ITEM_READY, {
        itemId: item.id,
        pedidoId: item.pedidoId,
        mesaNumero: item.pedido.mesa?.numero,
        produtoNome: item.produto.nome,
        garcomId: item.pedido.garcomId,
      });
    }
  } catch {}

  return itemAtualizado;
}

export async function removerItem(pedidoId: number, itemId: number) {
  const item = await prisma.itemPedido.findFirst({
    where: { id: itemId, pedidoId },
  });

  if (!item) throw new NotFoundError('Item do pedido');

  if (item.statusPreparo !== 'PENDENTE') {
    throw new ValidationError('Só é possível remover itens com status PENDENTE');
  }

  await prisma.itemPedido.delete({ where: { id: itemId } });

  return { message: 'Item removido com sucesso' };
}
