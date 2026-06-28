'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { StatusPedido, StatusPreparo } from '@cafecontrol/shared';
import type { Pedido } from '@cafecontrol/shared';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

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

const statusBadgeVariant: Record<string, 'green' | 'blue' | 'red' | 'yellow' | 'gray'> = {
  [StatusPedido.ABERTO]: 'blue',
  [StatusPedido.PAGO]: 'green',
  [StatusPedido.CANCELADO]: 'red',
};

const preparoBadgeVariant: Record<string, 'red' | 'yellow' | 'green' | 'gray'> = {
  [StatusPreparo.PENDENTE]: 'red',
  [StatusPreparo.PREPARANDO]: 'yellow',
  [StatusPreparo.PRONTO]: 'green',
  [StatusPreparo.ENTREGUE]: 'gray',
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtroStatus) params.set('status', filtroStatus);
      const query = params.toString();
      const data = await api.get<Pedido[]>(`/pedidos${query ? `?${query}` : ''}`);
      setPedidos(data);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  function calcTotal(pedido: Pedido): number {
    if (pedido.total != null) return Number(pedido.total);
    if (!pedido.itens) return 0;
    return pedido.itens.reduce(
      (sum, item) => sum + Number(item.precoUnitario) * item.quantidade,
      0
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <Button variant="secondary" onClick={fetchPedidos}>
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroStatus('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === ''
                ? 'bg-cafe-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {Object.values(StatusPedido).map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroStatus === status
                  ? 'bg-cafe-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Totais */}
      {!isLoading && pedidos.length > 0 && (() => {
        const totalGeral = pedidos.reduce((s, p) => s + calcTotal(p), 0);
        const totalPagos = pedidos.filter((p) => p.statusPedido === StatusPedido.PAGO).reduce((s, p) => s + calcTotal(p), 0);
        const totalAberto = pedidos.filter((p) => p.statusPedido === StatusPedido.ABERTO).reduce((s, p) => s + calcTotal(p), 0);
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-400 font-medium">Pedidos</p>
              <p className="text-xl font-bold text-gray-900">{pedidos.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-400 font-medium">Total Geral</p>
              <p className="text-xl font-bold text-gray-900">{formatBRL(totalGeral)}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 px-4 py-3">
              <p className="text-xs text-green-600 font-medium">Pagos</p>
              <p className="text-xl font-bold text-green-700">{formatBRL(totalPagos)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">Em Aberto</p>
              <p className="text-xl font-bold text-blue-700">{formatBRL(totalAberto)}</p>
            </div>
          </div>
        );
      })()}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum pedido encontrado
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Mesa
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Garcom
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Itens
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.map((pedido) => (
                <PedidoRow
                  key={pedido.id}
                  pedido={pedido}
                  isExpanded={expandedId === pedido.id}
                  onToggle={() => toggleExpand(pedido.id)}
                  total={calcTotal(pedido)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PedidoRow({
  pedido,
  isExpanded,
  onToggle,
  total,
}: {
  pedido: Pedido;
  isExpanded: boolean;
  onToggle: () => void;
  total: number;
}) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {pedido.id}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          Mesa {pedido.mesa?.numero ?? pedido.mesaId}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          {pedido.garcom?.nome ?? '-'}
        </td>
        <td className="px-4 py-3">
          <Badge variant={statusBadgeVariant[pedido.statusPedido] ?? 'gray'}>
            {pedido.statusPedido}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          {pedido.itens?.length ?? 0}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {formatBRL(total)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {formatDate(pedido.dataCriacao)}
        </td>
        <td className="px-4 py-3">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {isExpanded && pedido.itens && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-8 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Itens do Pedido
              </h4>
              {pedido.itens.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantidade}x {item.produto?.nome ?? `Produto #${item.produtoId}`}
                    </span>
                    {item.observacao && (
                      <span className="text-xs text-gray-500 italic">
                        ({item.observacao})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={preparoBadgeVariant[item.statusPreparo] ?? 'gray'}>
                      {item.statusPreparo}
                    </Badge>
                    <span className="text-sm font-medium text-gray-700">
                      {formatBRL(item.precoUnitario * item.quantidade)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
