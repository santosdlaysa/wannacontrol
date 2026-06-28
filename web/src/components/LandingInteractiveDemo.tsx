'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
                ? 'Acompanhe pedidos, cozinha, mesas, caixa e delivery no mesmo lugar, com status atualizados em tempo real.'
                : 'O cliente abre o link do restaurante, escolhe os produtos, informa os dados e recebe o numero do pedido.'}
            </p>

            {mode === 'admin' && stats && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Pedidos hoje', value: stats.pedidosHoje, cls: 'bg-gray-50 border-gray-200 text-gray-900' },
                  { label: 'Em aberto', value: stats.pedidosAbertos, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { label: 'Pagos hoje', value: stats.pedidosPagos, cls: 'bg-green-50 border-green-200 text-green-700' },
                  { label: 'Clientes cadastrados', value: stats.clientesTotal, cls: 'bg-gray-50 border-gray-200 text-gray-900' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`rounded-xl border p-4 ${cls}`}>
                    <p className="text-xs font-medium opacity-70">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {mode === 'admin' && !stats && (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cafe-400 border-t-transparent" />
                Carregando dados ao vivo...
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={mode === 'admin' ? '/login' : `/cardapio/${SLUG}`}
                className="rounded-lg bg-cafe-800 px-5 py-3 text-center text-sm font-black text-white hover:bg-cafe-900"
              >
                {mode === 'admin' ? 'Acessar painel' : 'Abrir cardapio'}
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
            /* Iframe do cardápio real dentro de mockup de celular */
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
            /* Mockup fiel ao painel admin real */
            <div className="rounded-xl border border-gray-900 bg-gray-950 p-2 shadow-2xl">
              <div className="flex rounded-lg overflow-hidden" style={{ minHeight: 480 }}>
                {/* Sidebar igual ao real */}
                <aside className="w-44 shrink-0 flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
                  <div className="px-4 py-4 border-b border-white/10">
                    <p className="text-sm font-bold text-white">CafeControl</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Gestao de Cafeteria</p>
                  </div>
                  <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
                    {[
                      ['Dashboard', true],
                      ['Pedidos', false],
                      ['Mesas', false],
                      ['Delivery', false],
                      ['Cozinha', false],
                      ['Caixa', false],
                      ['Financeiro', false],
                      ['Produtos', false],
                      ['Clientes', false],
                    ].map(([label, active]) => (
                      <div
                        key={label as string}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          active ? 'bg-white/20 text-white' : 'text-white/50'
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </nav>
                  <div className="p-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#5c2d0a' }}>
                        A
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Admin</p>
                        <p className="text-[10px] text-white/40">ADMIN</p>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Conteúdo principal igual ao real */}
                <main className="flex-1 bg-gray-50 overflow-auto">
                  <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div />
                    <span className="text-xs text-gray-500">Ola, <span className="font-medium text-gray-700">Admin</span></span>
                  </header>

                  <div className="p-4">
                    <p className="text-base font-bold text-gray-900">Dashboard</p>
                    <p className="text-xs text-gray-400 mb-4">Visao geral do dia</p>

                    {stats ? (
                      <>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Operacoes</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[
                            { label: 'Pedidos Hoje', value: stats.pedidosHoje, cls: 'bg-[#fdf6f0] border-[#e8c4a0] text-[#7a3b0f]' },
                            { label: 'Pagos Hoje', value: stats.pedidosPagos, cls: 'bg-green-50 border-green-200 text-green-700' },
                            { label: 'Abertos', value: stats.pedidosAbertos, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                            { label: 'No cardapio', value: stats.produtosDisponiveis, cls: 'bg-gray-50 border-gray-200 text-gray-700' },
                          ].map(({ label, value, cls }) => (
                            <div key={label} className={`rounded-xl border p-2.5 ${cls}`}>
                              <p className="text-[10px] font-medium opacity-70">{label}</p>
                              <p className="text-lg font-bold mt-0.5">{value}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Acesso Rapido</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['Mesas', 'Pedidos', 'Delivery', 'Cozinha'].map((item) => (
                            <div key={item} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
                              <p className="text-xs font-semibold text-gray-800">{item}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-cafe-600 border-t-transparent" />
                      </div>
                    )}
                  </div>
                </main>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
