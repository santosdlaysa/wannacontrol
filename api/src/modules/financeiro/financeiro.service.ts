import prisma from '../../lib/prisma';

interface ResumoFiltros {
  dataInicio?: string;
  dataFim?: string;
}

export async function resumoDiario(data?: string) {
  // Usar a data string diretamente para evitar problemas de fuso
  const diaStr = data || new Date().toISOString().split('T')[0];
  const inicio = new Date(`${diaStr}T00:00:00.000Z`);
  const fim = new Date(`${diaStr}T23:59:59.999Z`);

  const pedidosPagos = await prisma.pedido.findMany({
    where: {
      statusPedido: 'PAGO',
      dataCriacao: { gte: inicio, lte: fim },
    },
    include: {
      mesa: true,
      garcom: { select: { id: true, nome: true } },
      itens: {
        include: { produto: { select: { id: true, nome: true, categoria: true } } },
      },
    },
    orderBy: { dataCriacao: 'desc' },
  });

  // Calcular totais
  let faturamento = 0;
  const produtosVendidos: Record<string, { nome: string; categoria: string; quantidade: number; receita: number }> = {};
  const garcomVendas: Record<number, { nome: string; pedidos: number; receita: number }> = {};

  for (const pedido of pedidosPagos) {
    let totalPedido = 0;

    for (const item of pedido.itens) {
      const subtotal = Number(item.precoUnitario) * item.quantidade;
      totalPedido += subtotal;

      const key = String(item.produtoId);
      if (!produtosVendidos[key]) {
        produtosVendidos[key] = {
          nome: item.produto.nome,
          categoria: item.produto.categoria,
          quantidade: 0,
          receita: 0,
        };
      }
      produtosVendidos[key].quantidade += item.quantidade;
      produtosVendidos[key].receita += subtotal;
    }

    faturamento += totalPedido;

    if (!garcomVendas[pedido.garcomId]) {
      garcomVendas[pedido.garcomId] = {
        nome: pedido.garcom.nome,
        pedidos: 0,
        receita: 0,
      };
    }
    garcomVendas[pedido.garcomId].pedidos += 1;
    garcomVendas[pedido.garcomId].receita += totalPedido;
  }

  const ticketMedio = pedidosPagos.length > 0 ? faturamento / pedidosPagos.length : 0;

  // Top produtos (curva ABC)
  const topProdutos = Object.values(produtosVendidos)
    .sort((a, b) => b.receita - a.receita);

  // Vendas por garçom
  const vendasPorGarcom = Object.values(garcomVendas)
    .sort((a, b) => b.receita - a.receita);

  return {
    data: diaStr,
    faturamento,
    totalPedidos: pedidosPagos.length,
    ticketMedio,
    topProdutos,
    vendasPorGarcom,
  };
}

export async function historico(filtros: ResumoFiltros) {
  const where: any = { statusPedido: 'PAGO' };

  if (filtros.dataInicio || filtros.dataFim) {
    where.dataCriacao = {};
    if (filtros.dataInicio) {
      where.dataCriacao.gte = new Date(`${filtros.dataInicio}T00:00:00.000Z`);
    }
    if (filtros.dataFim) {
      where.dataCriacao.lte = new Date(`${filtros.dataFim}T23:59:59.999Z`);
    }
  }

  const pedidos = await prisma.pedido.findMany({
    where,
    include: {
      mesa: true,
      garcom: { select: { id: true, nome: true } },
      itens: {
        include: { produto: { select: { id: true, nome: true, categoria: true } } },
      },
    },
    orderBy: { dataCriacao: 'desc' },
  });

  // Calcular total de cada pedido
  const pedidosComTotal = pedidos.map((pedido) => {
    const total = pedido.itens.reduce(
      (sum, item) => sum + Number(item.precoUnitario) * item.quantidade,
      0
    );
    return { ...pedido, totalCalculado: total };
  });

  const faturamentoTotal = pedidosComTotal.reduce((sum, p) => sum + p.totalCalculado, 0);
  const ticketMedio = pedidosComTotal.length > 0 ? faturamentoTotal / pedidosComTotal.length : 0;

  return {
    pedidos: pedidosComTotal,
    faturamentoTotal,
    totalPedidos: pedidosComTotal.length,
    ticketMedio,
  };
}
