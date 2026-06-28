'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const SLUG = 'cozinha-da-daika';
const BASE = '/api/v1';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Stats {
  pedidosHoje: number;
  pedidosAbertos: number;
  pedidosPagos: number;
  produtosDisponiveis: number;
  clientesTotal: number;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
}

interface Categoria {
  id: number;
  nome: string;
  produtos: Produto[];
}

type DemoMode = 'admin' | 'cliente';

export default function LandingInteractiveDemo() {
  const [mode, setMode] = useState<DemoMode>('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catAtiva, setCatAtiva] = useState(0);
  const [selectedProduto, setSelectedProduto] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${BASE}/public/${SLUG}/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});

    fetch(`${BASE}/public/${SLUG}/cardapio`)
      .then((r) => r.json())
      .then((d) => {
        const cats: Categoria[] = (d.categorias ?? []).filter(
          (c: Categoria) => (c.produtos?.length ?? 0) > 0
        );
        setCategorias(cats);
      })
      .catch(() => {});
  }, []);

  const catAtual = categorias[catAtiva];
  const produtos = catAtual?.produtos ?? [];

  return (
    <section id="demo" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cafe-700">
              Sistema ao vivo
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-gray-950">
              Dados reais da Cozinha da Daika agora.
            </h2>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {([['admin', 'Visao admin'], ['cliente', 'Cardapio cliente']] as const).map(([value, label]) => (
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

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
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
                  ['Pedidos hoje', stats.pedidosHoje],
                  ['Em aberto', stats.pedidosAbertos],
                  ['Pagos hoje', stats.pedidosPagos],
                  ['Clientes', stats.clientesTotal],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg bg-cafe-50 p-3">
                    <p className="text-xs font-bold text-cafe-600">{label}</p>
                    <p className="mt-1 text-2xl font-black text-cafe-900">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {mode === 'cliente' && categorias.length > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{categorias.length} categorias</span>{' '}
                e{' '}
                <span className="font-semibold text-gray-700">
                  {categorias.reduce((s, c) => s + c.produtos.length, 0)} produtos
                </span>{' '}
                disponíveis agora.
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
          {mode === 'admin' ? (
            <div className="rounded-lg border border-gray-900 bg-gray-950 p-3 shadow-2xl">
              <div className="rounded-md bg-gray-100">
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-400">Cozinha da Daika</p>
                    <p className="font-black text-gray-950">Painel de operacao</p>
                  </div>
                  <span className="rounded-md bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                    Ao vivo
                  </span>
                </div>

                <div className="p-4">
                  {stats ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { label: 'Pedidos hoje', value: stats.pedidosHoje, color: 'text-cafe-800' },
                          { label: 'Em aberto agora', value: stats.pedidosAbertos, color: 'text-blue-700' },
                          { label: 'Pagos hoje', value: stats.pedidosPagos, color: 'text-green-700' },
                          { label: 'Produtos no cardapio', value: stats.produtosDisponiveis, color: 'text-gray-800' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="rounded-lg bg-white p-3">
                            <p className="text-xs font-bold text-gray-500">{label}</p>
                            <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-lg bg-white p-3">
                        <p className="text-xs font-bold text-gray-500 mb-2">Base de clientes</p>
                        <p className="text-xl font-black text-gray-900">
                          {stats.clientesTotal}{' '}
                          <span className="text-sm font-semibold text-gray-400">clientes cadastrados</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cafe-700 border-t-transparent" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-sm rounded-[28px] border border-gray-900 bg-gray-950 p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[22px] bg-amber-50">
                <div className="bg-amber-600 px-4 py-5 text-white">
                  <p className="text-xs font-black uppercase text-amber-100">Cardapio online</p>
                  <h3 className="mt-1 text-2xl font-black">Cozinha da Daika</h3>
                  <p className="mt-1 text-sm text-amber-100">Delivery e retirada</p>
                </div>

                <div className="p-4">
                  {categorias.length > 0 ? (
                    <>
                      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                        {categorias.map((cat, i) => (
                          <button
                            key={cat.id}
                            onClick={() => { setCatAtiva(i); setSelectedProduto(null); }}
                            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${
                              catAtiva === i ? 'bg-amber-500 text-white' : 'bg-white text-gray-600'
                            }`}
                          >
                            {cat.nome}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {produtos.slice(0, 3).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProduto(p.id)}
                            className={`w-full rounded-lg border bg-white p-3 text-left ${
                              selectedProduto === p.id ? 'border-amber-500' : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-black text-gray-950 text-sm">{p.nome}</p>
                                {p.descricao && (
                                  <p className="mt-0.5 text-xs leading-4 text-gray-500 line-clamp-1">
                                    {p.descricao}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 font-black text-amber-600 text-sm">
                                {formatBRL(Number(p.preco))}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    </div>
                  )}

                  <Link
                    href={`/cardapio/${SLUG}`}
                    className="mt-4 block w-full rounded-lg bg-amber-500 py-3 text-center text-sm font-black text-white hover:bg-amber-600"
                  >
                    Ver cardapio completo
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
