'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminDemoWidget from './AdminDemoWidget';

const SLUG = 'cozinha-da-daika';
const BASE = '/api/v1';

interface Stats {
  pedidosHoje: number;
  pedidosAbertos: number;
  pedidosPagos: number;
  produtosDisponiveis: number;
  clientesTotal: number;
}

type DemoMode = 'admin' | 'cliente';

export default function LandingInteractiveDemo() {
  const [mode, setMode] = useState<DemoMode>('admin');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${BASE}/public/${SLUG}/stats`)
      .then((r) => r.json())
      .then((d: Stats) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <section id="demo" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cafe-700">
              Sistema ao vivo
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-gray-950">
              Veja o sistema real em funcionamento agora.
            </h2>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {([['admin', 'Painel admin'], ['cliente', 'Cardapio cliente']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`rounded-md px-4 py-2 text-sm font-black transition-colors ${
                  mode === value ? 'bg-cafe-800 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* Texto lateral */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-2xl font-black text-gray-950">
              {mode === 'admin' ? 'Painel administrativo' : 'Cardapio do cliente'}
            </h3>
            <p className="mt-3 leading-7 text-gray-600">
              {mode === 'admin'
                ? 'Clique em qualquer item do menu lateral para navegar pelas telas. Clique em "Acessar demo ao vivo" para entrar no sistema real com dados reais.'
                : 'O cliente abre o link do restaurante, escolhe os produtos, informa os dados e recebe o numero do pedido.'}
            </p>

            {mode === 'admin' && stats && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Pedidos hoje', value: stats.pedidosHoje, cls: 'bg-gray-50 border-gray-200 text-gray-900' },
                  { label: 'Em aberto', value: stats.pedidosAbertos, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Pagos hoje', value: stats.pedidosPagos, cls: 'bg-green-50 border-green-200 text-green-700' },
                  { label: 'Clientes', value: stats.clientesTotal, cls: 'bg-gray-50 border-gray-200 text-gray-900' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`rounded-xl border p-4 ${cls}`}>
                    <p className="text-xs font-medium opacity-70">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={mode === 'admin' ? '/demo' : `/cardapio/${SLUG}`}
                target={mode === 'admin' ? '_blank' : undefined}
                rel={mode === 'admin' ? 'noopener noreferrer' : undefined}
                className="rounded-lg bg-cafe-800 px-5 py-3 text-center text-sm font-black text-white hover:bg-cafe-900"
              >
                {mode === 'admin' ? 'Acessar demo ao vivo' : 'Abrir cardapio'}
              </Link>
              <button
                onClick={() => setMode(mode === 'admin' ? 'cliente' : 'admin')}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"
              >
                Ver outra versao
              </button>
            </div>
          </div>

          {/* Preview */}
          {mode === 'cliente' ? (
            <div className="flex justify-center">
              <div className="relative w-[320px] rounded-[40px] border-[6px] border-gray-900 bg-gray-900 shadow-2xl">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full z-10" />
                <div className="overflow-hidden rounded-[34px]" style={{ height: 560 }}>
                  <iframe
                    src={`/cardapio/${SLUG}`}
                    className="w-full h-full border-0"
                    title="Cardapio ao vivo"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
            <AdminDemoWidget minHeight={500} />
          )}
        </div>
      </div>
    </section>
  );
}
