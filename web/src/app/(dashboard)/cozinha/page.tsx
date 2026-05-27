'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { useSocket } from '@/providers/SocketProvider';
import {
  SOCKET_EVENTS,
  StatusPreparo,
} from '@cafecontrol/shared';
import type {
  Pedido,
  ItemPedido,
  NewOrderItemsPayload,
  ItemStatusChangedPayload,
} from '@cafecontrol/shared';
import Button from '@/components/ui/Button';

interface KitchenItem {
  id: number;
  pedidoId: number;
  mesaNumero: number;
  produtoNome: string;
  quantidade: number;
  observacao: string | null;
  statusPreparo: StatusPreparo;
  criadoEm: string;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}

function ElapsedTimer({ criadoEm }: { criadoEm: string }) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(criadoEm).getTime();
      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setElapsed(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [criadoEm]);

  return <span>{elapsed}</span>;
}

export default function CozinhaPage() {
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const { socket } = useSocket();
  const initialLoadDone = useRef(false);

  const fetchItems = useCallback(async () => {
    try {
      // Fetch open orders and extract their items
      const pedidos = await api.get<Pedido[]>('/pedidos?status=ABERTO');
      const kitchenItems: KitchenItem[] = [];

      for (const pedido of pedidos) {
        if (pedido.itens) {
          for (const item of pedido.itens) {
            if (item.statusPreparo !== StatusPreparo.ENTREGUE) {
              kitchenItems.push({
                id: item.id,
                pedidoId: pedido.id,
                mesaNumero: pedido.mesa?.numero ?? 0,
                produtoNome: item.produto?.nome ?? `Produto #${item.produtoId}`,
                quantidade: item.quantidade,
                observacao: item.observacao,
                statusPreparo: item.statusPreparo,
                criadoEm: String(item.criadoEm),
              });
            }
          }
        }
      }

      setItems(kitchenItems);
      initialLoadDone.current = true;
    } catch {
      toast.error('Erro ao carregar itens da cozinha');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    function handleNewItems(payload: NewOrderItemsPayload) {
      const newItems: KitchenItem[] = payload.itens.map((item) => ({
        id: item.id,
        pedidoId: payload.pedidoId,
        mesaNumero: payload.mesaNumero,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        observacao: item.observacao,
        statusPreparo: StatusPreparo.PENDENTE,
        criadoEm: new Date().toISOString(),
      }));

      setItems((prev) => [...prev, ...newItems]);
      playBeep();
      toast.success(`Novos itens - Mesa ${payload.mesaNumero}`, {
        icon: '🔔',
        duration: 5000,
      });
    }

    function handleStatusChanged(payload: ItemStatusChangedPayload) {
      if (payload.novoStatus === StatusPreparo.ENTREGUE) {
        setItems((prev) => prev.filter((i) => i.id !== payload.itemId));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === payload.itemId
              ? { ...i, statusPreparo: payload.novoStatus }
              : i
          )
        );
      }
    }

    socket.on(SOCKET_EVENTS.NEW_ORDER_ITEMS, handleNewItems);
    socket.on(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handleStatusChanged);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER_ITEMS, handleNewItems);
      socket.off(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handleStatusChanged);
    };
  }, [socket]);

  async function updateStatus(itemId: number, newStatus: StatusPreparo) {
    setUpdatingIds((prev) => new Set(prev).add(itemId));
    try {
      await api.patch(`/itens-pedido/${itemId}/status`, {
        statusPreparo: newStatus,
      });

      if (newStatus === StatusPreparo.ENTREGUE) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, statusPreparo: newStatus } : i
          )
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  const pendentes = items.filter((i) => i.statusPreparo === StatusPreparo.PENDENTE);
  const preparando = items.filter((i) => i.statusPreparo === StatusPreparo.PREPARANDO);
  const prontos = items.filter((i) => i.statusPreparo === StatusPreparo.PRONTO);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cafe-700 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando cozinha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center gap-6 px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-gray-700">
            Pendentes: <span className="font-bold">{pendentes.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm font-medium text-gray-700">
            Preparando: <span className="font-bold">{preparando.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-gray-700">
            Prontos: <span className="font-bold">{prontos.length}</span>
          </span>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={fetchItems}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
        {/* PENDENTE */}
        <div className="flex flex-col border-r border-gray-200">
          <div className="bg-red-600 text-white px-4 py-3 text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Pendente
            </h2>
            <span className="text-red-200 text-sm">{pendentes.length} itens</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-red-50 kds-column">
            {pendentes.map((item) => (
              <KitchenCard
                key={item.id}
                item={item}
                actionLabel="Iniciar Preparo"
                actionColor="bg-yellow-500 hover:bg-yellow-600"
                onAction={() => updateStatus(item.id, StatusPreparo.PREPARANDO)}
                isUpdating={updatingIds.has(item.id)}
              />
            ))}
            {pendentes.length === 0 && (
              <EmptyColumn text="Nenhum item pendente" />
            )}
          </div>
        </div>

        {/* PREPARANDO */}
        <div className="flex flex-col border-r border-gray-200">
          <div className="bg-yellow-500 text-white px-4 py-3 text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Preparando
            </h2>
            <span className="text-yellow-100 text-sm">{preparando.length} itens</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-yellow-50 kds-column">
            {preparando.map((item) => (
              <KitchenCard
                key={item.id}
                item={item}
                actionLabel="Pronto!"
                actionColor="bg-green-500 hover:bg-green-600"
                onAction={() => updateStatus(item.id, StatusPreparo.PRONTO)}
                isUpdating={updatingIds.has(item.id)}
              />
            ))}
            {preparando.length === 0 && (
              <EmptyColumn text="Nenhum item em preparo" />
            )}
          </div>
        </div>

        {/* PRONTO */}
        <div className="flex flex-col">
          <div className="bg-green-600 text-white px-4 py-3 text-center">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              Pronto
            </h2>
            <span className="text-green-200 text-sm">{prontos.length} itens</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-green-50 kds-column">
            {prontos.map((item) => (
              <KitchenCard
                key={item.id}
                item={item}
                actionLabel="Entregue"
                actionColor="bg-blue-500 hover:bg-blue-600"
                onAction={() => updateStatus(item.id, StatusPreparo.ENTREGUE)}
                isUpdating={updatingIds.has(item.id)}
              />
            ))}
            {prontos.length === 0 && (
              <EmptyColumn text="Nenhum item pronto" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KitchenCard({
  item,
  actionLabel,
  actionColor,
  onAction,
  isUpdating,
}: {
  item: KitchenItem;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  isUpdating: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-3 py-2">
        {/* Header: mesa + tempo */}
        <div className="flex items-center justify-between">
          <span className="bg-cafe-700 text-white text-sm font-bold px-2 py-0.5 rounded">
            M{item.mesaNumero}
          </span>
          <span className="text-sm font-mono font-semibold text-cafe-800">
            <ElapsedTimer criadoEm={item.criadoEm} />
          </span>
        </div>

        {/* Produto */}
        <p className="text-sm font-bold text-gray-900 mt-1.5">
          {item.quantidade}x {item.produtoNome}
        </p>
        {item.observacao && (
          <p className="text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded italic mt-1">
            {item.observacao}
          </p>
        )}

        {/* Botão */}
        <button
          onClick={onAction}
          disabled={isUpdating}
          className={`
            w-full mt-2 py-1.5 rounded-md text-white font-semibold text-sm
            transition-colors disabled:opacity-50
            ${actionColor}
          `}
        >
          {isUpdating ? '...' : actionLabel}
        </button>
      </div>
    </div>
  );
}

function EmptyColumn({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-gray-400">
      <p className="text-lg">{text}</p>
    </div>
  );
}
