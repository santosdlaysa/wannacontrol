'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { useSocket } from '@/providers/SocketProvider';
import type { Pedido } from '@cafecontrol/shared';
import { SOCKET_EVENTS, TipoPedido, StatusPedido } from '@cafecontrol/shared';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const STATUS_ENTREGA_FLOW = [
  'CONFIRMADO',
  'EM_PREPARO',
  'SAIU_ENTREGA',
] as const;

const STATUS_ENTREGA_LABELS: Record<string, string> = {
  RECEBIDO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em Produção',
  PRONTO: 'Pronto',
  SAIU_ENTREGA: 'Saiu para Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_ENTREGA_VARIANT: Record<string, 'gray' | 'blue' | 'orange' | 'yellow' | 'green' | 'red' | 'purple'> = {
  RECEBIDO: 'gray',
  CONFIRMADO: 'blue',
  EM_PREPARO: 'orange',
  PRONTO: 'yellow',
  SAIU_ENTREGA: 'purple',
  ENTREGUE: 'green',
  CANCELADO: 'red',
};

const TIPO_VARIANT: Record<string, 'blue' | 'orange'> = {
  DELIVERY: 'blue',
  RETIRADA: 'orange',
};

const TIPO_LABEL: Record<string, string> = {
  DELIVERY: 'Delivery',
  RETIRADA: 'Retirada',
};

const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartao de Credito',
  CARTAO_DEBITO: 'Cartao de Debito',
  PIX: 'PIX',
};

type StatusFilter = 'ABERTOS' | 'CONCLUIDOS';

export default function DeliveryPage() {
  const searchParams = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ABERTOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [advancingId, setAdvancingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [fechandoId, setFechandoId] = useState<number | null>(null);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const payPedidoRef = useRef<Pedido | null>(null);

  const { socket } = useSocket();

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await api.get<Pedido[]>('/pedidos');
      // Filter out MESA orders
      const deliveryOrders = data.filter(
        (p) => p.tipoPedido === TipoPedido.DELIVERY || p.tipoPedido === TipoPedido.RETIRADA
      );
      setPedidos(deliveryOrders);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Auto-abrir pedido específico vindo da notificação (?pedido=ID)
  useEffect(() => {
    const pedidoId = searchParams.get('pedido');
    if (!pedidoId || isLoading) return;

    const encontrado = pedidos.find((p) => p.id === Number(pedidoId));
    if (encontrado) {
      openDetail(encontrado);
    } else {
      // Pedido pode estar em outro status, buscar diretamente
      api.get<Pedido>(`/pedidos/${pedidoId}`)
        .then((p) => {
          if (p.tipoPedido !== TipoPedido.MESA) openDetail(p);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, searchParams]);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => fetchPedidos();

    socket.on(SOCKET_EVENTS.ORDER_CLOSED, refresh);
    socket.on(SOCKET_EVENTS.NEW_ORDER_ITEMS, refresh);

    return () => {
      socket.off(SOCKET_EVENTS.ORDER_CLOSED, refresh);
      socket.off(SOCKET_EVENTS.NEW_ORDER_ITEMS, refresh);
    };
  }, [socket, fetchPedidos]);

  const filtered = pedidos.filter((p) => {
    const matchStatus =
      statusFilter === 'ABERTOS'
        ? p.statusPedido === 'ABERTO'
        : ['PAGO', 'CANCELADO'].includes(p.statusPedido);
    const matchTipo = tipoFilter === 'TODOS' || p.tipoPedido === (tipoFilter as TipoPedido);
    return matchStatus && matchTipo;
  });

  function openDetail(pedido: Pedido) {
    setSelectedPedido(pedido);
    setDetailOpen(true);
  }

  function getNextStatus(current: string): string | null {
    if (current === 'RECEBIDO') return 'CONFIRMADO';

    const idx = STATUS_ENTREGA_FLOW.indexOf(current as typeof STATUS_ENTREGA_FLOW[number]);
    if (idx < 0 || idx >= STATUS_ENTREGA_FLOW.length - 1) return null;
    return STATUS_ENTREGA_FLOW[idx + 1];
  }

  async function advanceStatus(pedido: Pedido) {
    const next = getNextStatus(pedido.statusEntrega || '');
    if (!next) return;

    if (next === 'ENTREGUE') {
      payPedidoRef.current = pedido;
      setFormaPagamento(pedido.formaPagamento || 'PIX');
      setPayModalOpen(true);
      return;
    }

    setAdvancingId(pedido.id);
    try {
      const updated = await api.patch<Pedido>(`/pedidos/${pedido.id}/status-entrega`, {
        statusEntrega: next,
      });
      setPedidos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPedido?.id === updated.id) setSelectedPedido(updated);
      toast.success(`Status: ${STATUS_ENTREGA_LABELS[next]}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status');
    } finally {
      setAdvancingId(null);
    }
  }

  async function confirmarEntrega() {
    const pedido = payPedidoRef.current;
    if (!pedido) return;

    setFechandoId(pedido.id);
    setPayModalOpen(false);
    try {
      const updated = await api.patch<Pedido>(`/pedidos/${pedido.id}/fechar`, { formaPagamento });
      setPedidos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPedido?.id === updated.id) {
        setSelectedPedido(updated);
        setDetailOpen(false);
      }
      toast.success('Pedido concluido!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fechar pedido');
    } finally {
      setFechandoId(null);
      payPedidoRef.current = null;
    }
  }

  async function cancelarPedido(pedido: Pedido) {
    if (!confirm(`Cancelar pedido #${pedido.id}?`)) return;
    setCancellingId(pedido.id);
    try {
      await api.patch(`/pedidos/${pedido.id}/cancelar`);
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id ? { ...p, statusPedido: StatusPedido.CANCELADO } : p
        )
      );
      if (selectedPedido?.id === pedido.id) setDetailOpen(false);
      toast.success('Pedido cancelado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar');
    } finally {
      setCancellingId(null);
    }
  }

  function calcTotal(pedido: Pedido): number {
    const subtotal = (pedido.itens || []).reduce(
      (acc, item) => acc + Number(item.precoUnitario) * item.quantidade,
      0
    );
    return subtotal + Number(pedido.taxaEntrega ?? 0);
  }

  const badgeVariant = (v: string) => (STATUS_ENTREGA_VARIANT[v] || 'gray') as any;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Delivery & Retirada</h1>
        <Button onClick={fetchPedidos} variant="secondary" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['ABERTOS', 'CONCLUIDOS'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-cafe-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'ABERTOS' ? 'Em andamento' : 'Concluidos'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {['TODOS', 'DELIVERY', 'RETIRADA'].map((t) => (
            <button
              key={t}
              onClick={() => setTipoFilter(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tipoFilter === t
                  ? 'bg-cafe-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'TODOS' ? 'Todos' : TIPO_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhum pedido encontrado</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pedido) => {
            const nextStatus = getNextStatus(pedido.statusEntrega || '');
            const isAdvancing = advancingId === pedido.id;
            const isFechando = fechandoId === pedido.id;
            const isCancelling = cancellingId === pedido.id;
            const total = pedido.total != null ? Number(pedido.total) : calcTotal(pedido);

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">#{pedido.id}</span>
                      <Badge variant={TIPO_VARIANT[pedido.tipoPedido] || 'blue'}>
                        {TIPO_LABEL[pedido.tipoPedido] || pedido.tipoPedido}
                      </Badge>
                      {pedido.statusEntrega && (
                        <Badge variant={badgeVariant(pedido.statusEntrega)}>
                          {STATUS_ENTREGA_LABELS[pedido.statusEntrega] || pedido.statusEntrega}
                        </Badge>
                      )}
                      {pedido.statusPedido === 'CANCELADO' && (
                        <Badge variant="red">Cancelado</Badge>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(String(pedido.dataCriacao))}</span>
                    </div>

                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">
                        {pedido.clienteNome || pedido.cliente?.nome || 'Cliente nao informado'}
                      </span>
                      {pedido.clienteTelefone && (
                        <span className="text-gray-400 ml-2">{pedido.clienteTelefone}</span>
                      )}
                    </div>

                    {pedido.enderecoEntrega && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{pedido.enderecoEntrega}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-bold text-cafe-700">{formatBRL(total)}</span>
                      {pedido.itens && (
                        <span className="text-xs text-gray-400">
                          {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(pedido)}>
                      Detalhe
                    </Button>
                    {pedido.statusPedido === 'ABERTO' && nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => advanceStatus(pedido)}
                        loading={isAdvancing || isFechando}
                      >
                        {nextStatus === 'ENTREGUE' ? 'Finalizar' : `→ ${STATUS_ENTREGA_LABELS[nextStatus]}`}
                      </Button>
                    )}
                    {pedido.statusPedido === 'ABERTO' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => cancelarPedido(pedido)}
                        loading={isCancelling}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedPedido ? `Pedido #${selectedPedido.id}` : 'Detalhe do Pedido'}
      >
        {selectedPedido && (
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Tipo</p>
                <p className="text-gray-800">{TIPO_LABEL[selectedPedido.tipoPedido] || selectedPedido.tipoPedido}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Status</p>
                <p className="text-gray-800">{STATUS_ENTREGA_LABELS[selectedPedido.statusEntrega || ''] || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Cliente</p>
                <p className="text-gray-800">
                  {selectedPedido.clienteNome || selectedPedido.cliente?.nome || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Telefone</p>
                <p className="text-gray-800">{selectedPedido.clienteTelefone || '—'}</p>
              </div>
              {selectedPedido.enderecoEntrega && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Endereco</p>
                  <p className="text-gray-800">{selectedPedido.enderecoEntrega}</p>
                </div>
              )}
              {selectedPedido.observacao && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Observacao</p>
                  <p className="text-gray-800">{selectedPedido.observacao}</p>
                </div>
              )}
            </div>

            {/* Status flow */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Progresso</p>
              <div className="flex items-center gap-1 flex-wrap">
                {STATUS_ENTREGA_FLOW.map((s, i) => {
                  const current = STATUS_ENTREGA_FLOW.indexOf(
                    (selectedPedido.statusEntrega || '') as typeof STATUS_ENTREGA_FLOW[number]
                  );
                  const done = i <= current;
                  return (
                    <div key={s} className="flex items-center gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          done ? 'bg-cafe-100 text-cafe-700' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {STATUS_ENTREGA_LABELS[s]}
                      </span>
                      {i < STATUS_ENTREGA_FLOW.length - 1 && (
                        <span className="text-gray-300 text-xs">›</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Itens</p>
              <div className="space-y-2">
                {(selectedPedido.itens || []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantidade}x {item.produto?.nome || `Produto #${item.produtoId}`}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatBRL(Number(item.precoUnitario) * item.quantidade)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t space-y-1">
                {Number(selectedPedido.taxaEntrega ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Taxa de entrega</span>
                    <span>{formatBRL(Number(selectedPedido.taxaEntrega))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-cafe-700">
                    {formatBRL(
                      selectedPedido.total != null
                        ? Number(selectedPedido.total)
                        : calcTotal(selectedPedido)
                    )}
                  </span>
                </div>
                {selectedPedido.formaPagamento && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Pagamento</span>
                    <span>{FORMA_PAGAMENTO_LABELS[selectedPedido.formaPagamento] || selectedPedido.formaPagamento}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedPedido.statusPedido === 'ABERTO' && (
              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button
                  variant="danger"
                  onClick={() => { cancelarPedido(selectedPedido); }}
                  loading={cancellingId === selectedPedido.id}
                >
                  Cancelar
                </Button>
                {getNextStatus(selectedPedido.statusEntrega || '') && (
                  <Button
                    onClick={() => advanceStatus(selectedPedido)}
                    loading={advancingId === selectedPedido.id || fechandoId === selectedPedido.id}
                  >
                    {(() => {
                      const next = getNextStatus(selectedPedido.statusEntrega || '');
                      return next === 'ENTREGUE'
                        ? 'Finalizar & Cobrar'
                        : `Avançar → ${STATUS_ENTREGA_LABELS[next || ''] || next}`;
                    })()}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Finalizar Pedido"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Selecione a forma de pagamento para concluir o pedido.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setPayModalOpen(false)}>Cancelar</Button>
            <Button onClick={confirmarEntrega} loading={fechandoId !== null}>
              Confirmar Entrega
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
