'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '@/providers/SocketProvider';
import { SOCKET_EVENTS } from '@cafecontrol/shared';
import type { NewDeliveryOrderPayload } from '@cafecontrol/shared';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// AudioContext persistente — reutilizado para evitar bloqueio de autoplay
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx) {
      const Cls = window.AudioContext || (window as any).webkitAudioContext;
      if (!Cls) return null;
      _audioCtx = new Cls();
    }
    return _audioCtx;
  } catch {
    return null;
  }
}

// Desbloqueia o AudioContext na primeira interação do usuário
if (typeof window !== 'undefined') {
  const unlock = () => {
    getAudioCtx()?.resume();
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);
}

function beep(ctx: AudioContext) {
  const notes = [660, 880, 1100];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t);
    osc.stop(t + 0.16);
  });
}

function playSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => beep(ctx)).catch(() => {});
    } else {
      beep(ctx);
    }
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
  const { socket, isConnected } = useSocket();
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [aberto, setAberto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  // Debug: logar estado da conexão
  useEffect(() => {
    console.log('[Socket] isConnected:', isConnected, '| socket:', socket?.id ?? 'null');
  }, [isConnected, socket]);

  const handleNovoPedido = useCallback((payload: NewDeliveryOrderPayload) => {
    console.log('[Notificação] Novo pedido recebido:', payload);
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
    if (!socket) {
      console.log('[Socket] Sem socket, listener não registrado');
      return;
    }
    console.log('[Socket] Registrando listener NEW_DELIVERY_ORDER no socket', socket.id);
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
        {/* Ponto de status: verde = conectado, vermelho = desconectado */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white ${isConnected ? 'bg-green-500' : 'bg-red-400'}`}
        />
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
