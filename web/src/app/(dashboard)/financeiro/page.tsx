'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const formatDateShort = (date: string | Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));

interface ResumoDiario {
  data: string;
  faturamento: number;
  totalPedidos: number;
  ticketMedio: number;
  topProdutos: Array<{ nome: string; categoria: string; quantidade: number; receita: number }>;
  vendasPorGarcom: Array<{ nome: string; pedidos: number; receita: number }>;
}

interface PedidoHistorico {
  id: number;
  dataCriacao: string;
  totalCalculado: number;
  mesa: { numero: number };
  garcom: { nome: string };
  itens: Array<{
    id: number;
    quantidade: number;
    precoUnitario: number;
    observacao: string | null;
    produto: { nome: string; categoria: string };
  }>;
}

interface Historico {
  pedidos: PedidoHistorico[];
  faturamentoTotal: number;
  totalPedidos: number;
  ticketMedio: number;
}

type Tab = 'resumo' | 'historico';

export default function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('resumo');
  const [resumo, setResumo] = useState<ResumoDiario | null>(null);
  const [historico, setHistorico] = useState<Historico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataResumo, setDataResumo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [expandedPedido, setExpandedPedido] = useState<number | null>(null);

  const fetchResumo = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<ResumoDiario>(`/financeiro/resumo-diario?data=${dataResumo}`);
      setResumo(data);
    } catch {
      toast.error('Erro ao carregar resumo');
    } finally {
      setIsLoading(false);
    }
  }, [dataResumo]);

  const fetchHistorico = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Historico>(`/financeiro/historico?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      setHistorico(data);
    } catch {
      toast.error('Erro ao carregar historico');
    } finally {
      setIsLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    if (tab === 'resumo') fetchResumo();
    else fetchHistorico();
  }, [tab, fetchResumo, fetchHistorico]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('resumo')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'resumo' ? 'bg-white text-cafe-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Resumo Diario
        </button>
        <button
          onClick={() => setTab('historico')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'historico' ? 'bg-white text-cafe-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Historico de Vendas
        </button>
      </div>

      {tab === 'resumo' && (
        <div>
          {/* Date picker */}
          <div className="flex items-center gap-3 mb-6">
            <input
              type="date"
              value={dataResumo}
              onChange={(e) => setDataResumo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
            />
            <Button variant="secondary" size="sm" onClick={fetchResumo}>
              Consultar
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : resumo ? (
            <div>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500 mb-1">Faturamento</p>
                  <p className="text-2xl font-bold text-green-600">{formatBRL(resumo.faturamento)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500 mb-1">Pedidos Fechados</p>
                  <p className="text-2xl font-bold text-gray-900">{resumo.totalPedidos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-500 mb-1">Ticket Medio</p>
                  <p className="text-2xl font-bold text-cafe-700">{formatBRL(resumo.ticketMedio)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Produtos */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Produtos Mais Vendidos</h3>
                  </div>
                  {resumo.topProdutos.length === 0 ? (
                    <div className="p-5 text-center text-gray-400 text-sm">Nenhuma venda neste dia</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {resumo.topProdutos.map((p, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-cafe-100 text-cafe-700 text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{p.nome}</p>
                              <p className="text-xs text-gray-400">{p.categoria}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">{formatBRL(p.receita)}</p>
                            <p className="text-xs text-gray-400">{p.quantidade} un.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vendas por Garçom */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Vendas por Garcom</h3>
                  </div>
                  {resumo.vendasPorGarcom.length === 0 ? (
                    <div className="p-5 text-center text-gray-400 text-sm">Nenhuma venda neste dia</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {resumo.vendasPorGarcom.map((g, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{g.nome}</p>
                            <p className="text-xs text-gray-400">{g.pedidos} pedido(s)</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{formatBRL(g.receita)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === 'historico' && (
        <div>
          {/* Date range picker */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">De:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ate:</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={fetchHistorico}>
              Filtrar
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : historico ? (
            <div>
              {/* KPI resumo do período */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Faturamento do Periodo</p>
                  <p className="text-xl font-bold text-green-600">{formatBRL(historico.faturamentoTotal)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Total de Pedidos</p>
                  <p className="text-xl font-bold text-gray-900">{historico.totalPedidos}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Ticket Medio</p>
                  <p className="text-xl font-bold text-cafe-700">{formatBRL(historico.ticketMedio)}</p>
                </div>
              </div>

              {/* Lista de pedidos */}
              {historico.pedidos.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                  Nenhum pedido encontrado neste periodo
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pedido</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mesa</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Garcom</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Itens</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historico.pedidos.map((pedido) => (
                        <PedidoHistoricoRow
                          key={pedido.id}
                          pedido={pedido}
                          isExpanded={expandedPedido === pedido.id}
                          onToggle={() => setExpandedPedido(expandedPedido === pedido.id ? null : pedido.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PedidoHistoricoRow({
  pedido,
  isExpanded,
  onToggle,
}: {
  pedido: PedidoHistorico;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{pedido.id}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(pedido.dataCriacao)}</td>
        <td className="px-4 py-3 text-sm text-gray-700">Mesa {pedido.mesa.numero}</td>
        <td className="px-4 py-3 text-sm text-gray-700">{pedido.garcom.nome}</td>
        <td className="px-4 py-3 text-sm text-gray-700">{pedido.itens.length}</td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
          {formatBRL(pedido.totalCalculado)}
        </td>
        <td className="px-4 py-3">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-6 py-3">
            <div className="space-y-1">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">
                    {item.quantidade}x {item.produto.nome}
                    {item.observacao && <span className="text-gray-400 italic ml-1">({item.observacao})</span>}
                  </span>
                  <span className="text-gray-600">{formatBRL(Number(item.precoUnitario) * item.quantidade)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
