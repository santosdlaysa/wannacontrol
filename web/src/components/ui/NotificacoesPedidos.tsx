'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '@/providers/SocketProvider';
import { SOCKET_EVENTS } from '@cafecontrol/shared';
import type { NewDeliveryOrderPayload } from '@cafecontrol/shared';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function playSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Três beeps ascendentes
    const notes = [660, 880, 1100];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  } catch {}
}

interface NotificacaoItem {
  id: number;
  clienteNome: string;
  tipoPedido: string;
  total: number;
  lida: boolean;
  hora: string;
}

export function NotificacoesPedidos() {
  const { socket } = useSocket();
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [aberto, setAberto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const handleNovoPedido = useCallback((payload: NewDeliveryOrderPayload) => {
    playSound();

    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const label = payload.tipoPedido === 'DELIVERY' ? 'Delivery' : 'Retirada';

    setNotificacoes((prev) => [
      {
        id: payload.pedidoId,
        clienteNome: payload.clienteNome,
        tipoPedido: label,
        total: payload.total,
        lida: false,
        hora,
      },
      ...prev.slice(0, 49),
    ]);

    toast(
      (t) => (
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛵</span>
          <div>
            <p className="font-bold text-white">Novo pedido — {label}</p>
            <p className="text-sm text-cafe-200">{payload.clienteNome}</p>
            <p className="text-sm font-semibold text-green-300">{formatBRL(payload.total)}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-2 text-cafe-300 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      ),
      { duration: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on(SOCKET_EVENTS.NEW_DELIVERY_ORDER, handleNovoPedido);
    return () => {
      socket.off(SOCKET_EVENTS.NEW_DELIVERY_ORDER, handleNovoPedido);
    };
  }, [socket, handleNovoPedido]);

  // Fechar painel ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [aberto]);

  function marcarTodasLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Sino */}
      <button
        onClick={() => {
          setAberto((v) => !v);
          if (!aberto) marcarTodasLidas();
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        title="Notificacoes"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Painel */}
      {aberto && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">Notificacoes</span>
            {notificacoes.length > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="text-xs text-cafe-600 hover:text-cafe-800"
              >
                Marcar como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notificacoes.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Nenhuma notificacao
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={`${n.id}-${n.hora}`}
                  className={`px-4 py-3 flex gap-3 items-start ${n.lida ? '' : 'bg-cafe-50'}`}
                >
                  <span className="text-xl mt-0.5">
                    {n.tipoPedido === 'Delivery' ? '🛵' : '🏃'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {n.tipoPedido} — {n.clienteNome}
                    </p>
                    <p className="text-xs text-green-600 font-medium">{formatBRL(n.total)}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{n.hora}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
