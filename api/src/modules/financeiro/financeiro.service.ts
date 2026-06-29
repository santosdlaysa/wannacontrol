import prisma from '../../lib/prisma';

interface ResumoFiltros {
  dataInicio?: string;
  dataFim?: string;
}

export async function resumoDiario(data?: string, restauranteId?: number) {
  // Usar a data string diretamente para evitar problemas de fuso
  const diaStr = data || new Date().toISOString().split('T')[0];
  const inicio = new Date(`${diaStr}T00:00:00.000Z`);
  const fim = new Date(`${diaStr}T23:59:59.999Z`);

  const pedidosPagos = await prisma.pedido.findMany({
    where: {
      ...(restauranteId ? { restauranteId } : {}),
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

export async function dashboard(data?: string, restauranteId?: number) {
  const diaStr = data || new Date().toISOString().split('T')[0];
  const inicio = new Date(`${diaStr}T00:00:00.000Z`);
  const fim = new Date(`${diaStr}T23:59:59.999Z`);
  const rFilter = restauranteId ? { restauranteId } : {};

  const [pedidosHoje, pedidosAbertos] = await Promise.all([
    prisma.pedido.findMany({
      where: { ...rFilter, dataCriacao: { gte: inicio, lte: fim } },
      include: { itens: true },
    }),
    prisma.pedido.findMany({
      where: { ...rFilter, statusPedido: 'ABERTO' },
      include: {
        itens: true,
        mesa: true,
      },
    }),
  ]);

  // Faturamento do dia (apenas pagos)
  const faturamento = pedidosHoje
    .filter((p) => p.statusPedido === 'PAGO')
    .reduce((sum, p) => sum + p.itens.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0), 0);

  // Contagens de itens em preparo / prontos
  let emPreparo = 0;
  let prontos = 0;
  for (const pedido of pedidosAbertos) {
    for (const item of pedido.itens) {
      if (item.statusPreparo === 'PREPARANDO') emPreparo++;
      if (item.statusPreparo === 'PRONTO') prontos++;
    }
  }

  // Total do mes
  const inicioMes = new Date(`${diaStr.slice(0, 7)}-01T00:00:00.000Z`);
  const [pedidosMes, caixaAberto] = await Promise.all([
    prisma.pedido.findMany({
      where: { ...rFilter, statusPedido: 'PAGO', dataCriacao: { gte: inicioMes } },
      include: { itens: true },
    }),
    prisma.caixa.findFirst({
      where: { ...rFilter, aberto: true },
      orderBy: { abertoEm: 'desc' },
    }),
  ]);
  const totalMes = pedidosMes.reduce(
    (sum, p) => sum + p.itens.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0),
    0,
  );

  return {
    data: diaStr,
    pedidosHoje: pedidosHoje.length,
    pedidosPagosHoje: pedidosHoje.filter((p) => p.statusPedido === 'PAGO').length,
    pedidosAbertos: pedidosAbertos.length,
    emPreparo,
    prontos,
    faturamento,
    totalMes,
    valorInicialCaixa: caixaAberto ? Number(caixaAberto.valorInicial) : null,
  };
}

export async function historico(filtros: ResumoFiltros, restauranteId?: number) {
  const where: any = { statusPedido: 'PAGO', ...(restauranteId ? { restauranteId } : {}) };

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
