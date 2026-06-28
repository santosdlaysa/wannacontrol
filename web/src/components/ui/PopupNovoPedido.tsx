'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { SOCKET_EVENTS } from '@cafecontrol/shared';
import type { NewDeliveryOrderPayload } from '@cafecontrol/shared';
import Link from 'next/link';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// ─── Áudio ────────────────────────────────────────────────────────────────────

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
  // Melodia: dó-mi-sol (alegre e chamativa)
  const notes = [523, 659, 784, 659, 784];
  const times = [0, 0.15, 0.3, 0.5, 0.65];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + times[i];
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.start(t);
    osc.stop(t + 0.13);
  });
}

function playSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const play = () => beep(ctx);
    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {}
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface PedidoPopup extends NewDeliveryOrderPayload {
  hora: string;
}

export function PopupNovoPedido() {
  const { socket } = useSocket();
  const [fila, setFila] = useState<PedidoPopup[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pedidoAtual = fila[0] ?? null;

  const handleNovoPedido = useCallback((payload: NewDeliveryOrderPayload) => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setFila((prev) => [...prev, { ...payload, hora }]);
    playSound();
    // Repetir o som 3x com intervalo de 3s
    let count = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      playSound();
      count++;
      if (count >= 2) clearInterval(intervalRef.current!);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on(SOCKET_EVENTS.NEW_DELIVERY_ORDER, handleNovoPedido);
    return () => {
      socket.off(SOCKET_EVENTS.NEW_DELIVERY_ORDER, handleNovoPedido);
    };
  }, [socket, handleNovoPedido]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function dispensar() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFila((prev) => prev.slice(1));
  }

  if (!pedidoAtual) return null;

  const label = pedidoAtual.tipoPedido === 'DELIVERY' ? 'Delivery' : 'Retirada';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={dispensar} />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-bounce-once">
          {/* Topo colorido */}
          <div className="bg-amber-500 px-6 pt-6 pb-4 text-white text-center">
            <div className="text-5xl mb-2">{pedidoAtual.tipoPedido === 'DELIVERY' ? '🛵' : '🏃'}</div>
            <h2 className="text-xl font-extrabold">Novo Pedido!</h2>
            <p className="text-amber-100 text-sm mt-0.5">{label} · {pedidoAtual.hora}</p>
          </div>

          {/* Corpo */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Cliente</span>
              <span className="font-semibold text-gray-900">{pedidoAtual.clienteNome}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Telefone</span>
              <span className="font-semibold text-gray-900">{pedidoAtual.clienteTelefone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Itens</span>
              <span className="font-semibold text-gray-900">{pedidoAtual.itensCount} iten{pedidoAtual.itensCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-lg font-extrabold text-amber-600">{formatBRL(pedidoAtual.total)}</span>
            </div>

            {fila.length > 1 && (
              <p className="text-xs text-center text-orange-600 font-medium">
                +{fila.length - 1} pedido{fila.length - 1 !== 1 ? 's' : ''} na fila
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="px-6 pb-6 flex gap-3">
            <Link
              href="/delivery"
              onClick={dispensar}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Ver Pedidos
            </Link>
            <button
              onClick={dispensar}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Dispensar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
