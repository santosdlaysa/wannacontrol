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

type DemoMode = 'admin' | 'cliente';
type AdminScreen = 'Dashboard' | 'Pedidos' | 'Mesas' | 'Delivery' | 'Cozinha' | 'Caixa' | 'Financeiro' | 'Produtos' | 'Clientes';

const NAV_ITEMS: AdminScreen[] = ['Dashboard', 'Pedidos', 'Mesas', 'Delivery', 'Cozinha', 'Caixa', 'Financeiro', 'Produtos', 'Clientes'];

// ─── Dados mock realistas ────────────────────────────────────────────────────

const MOCK_PEDIDOS = [
  { id: 1042, tipo: 'Delivery', cliente: 'Ana Paula', status: 'ABERTO', total: 68.90 },
  { id: 1041, tipo: 'Mesa 03', cliente: 'Garcom Leo', status: 'ABERTO', total: 124.40 },
  { id: 1040, tipo: 'Retirada', cliente: 'Marcos Lima', status: 'PAGO', total: 42.00 },
  { id: 1039, tipo: 'Mesa 07', cliente: 'Garcom Ana', status: 'PAGO', total: 89.50 },
];

const MOCK_MESAS = [
  { numero: 1, status: 'LIVRE' }, { numero: 2, status: 'OCUPADA' }, { numero: 3, status: 'OCUPADA' },
  { numero: 4, status: 'LIVRE' }, { numero: 5, status: 'AGUARDANDO_CONTA' }, { numero: 6, status: 'LIVRE' },
  { numero: 7, status: 'OCUPADA' }, { numero: 8, status: 'LIVRE' }, { numero: 9, status: 'OCUPADA' },
];

const MOCK_DELIVERY = [
  { id: 1042, cliente: 'Ana Paula', tipo: 'Delivery', status: 'EM_PREPARO', total: 68.90 },
  { id: 1040, cliente: 'Marcos Lima', tipo: 'Retirada', status: 'PRONTO', total: 42.00 },
  { id: 1038, cliente: 'Carla Souza', tipo: 'Delivery', status: 'SAIU_ENTREGA', total: 55.00 },
];

const MOCK_ITENS_COZINHA = [
  { id: 1, produto: 'Frango Grelhado', pedido: '#1041 Mesa 03', status: 'PREPARANDO' },
  { id: 2, produto: 'Marmita Saudavel', pedido: '#1042 Delivery', status: 'PENDENTE' },
  { id: 3, produto: 'Lasanha de Carne', pedido: '#1041 Mesa 03', status: 'PRONTO' },
  { id: 4, produto: 'Strogonoff', pedido: '#1044 Mesa 07', status: 'PENDENTE' },
];

const MOCK_PRODUTOS = [
  { id: 1, nome: 'Frango Grelhado', categoria: 'Marmitas', preco: 30.00, disponivel: true },
  { id: 2, nome: 'Lasanha de Carne', categoria: 'Marmitas', preco: 30.00, disponivel: true },
  { id: 3, nome: 'Marmita Saudavel', categoria: 'Marmitas', preco: 30.00, disponivel: true },
  { id: 4, nome: 'Arroz', categoria: 'Acompanhamentos', preco: 0.00, disponivel: true },
];

const MOCK_CLIENTES = [
  { id: 1, nome: 'Ana Paula', telefone: '(95) 99123-7788', pedidos: 8 },
  { id: 2, nome: 'Marcos Lima', telefone: '(95) 98444-1122', pedidos: 3 },
  { id: 3, nome: 'Carla Souza', telefone: '(95) 99910-2233', pedidos: 12 },
  { id: 4, nome: 'Pedro Alves', telefone: '(95) 99001-5566', pedidos: 5 },
];

// ─── Cores de status ─────────────────────────────────────────────────────────

function statusMesaColor(s: string) {
  if (s === 'LIVRE') return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'OCUPADA') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
}

function statusMesaLabel(s: string) {
  if (s === 'LIVRE') return 'Livre';
  if (s === 'OCUPADA') return 'Ocupada';
  return 'Aguard. conta';
}

function statusPreparoColor(s: string) {
  if (s === 'PENDENTE') return 'bg-red-100 text-red-700';
  if (s === 'PREPARANDO') return 'bg-yellow-100 text-yellow-700';
  if (s === 'PRONTO') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
}

function statusPedidoColor(s: string) {
  if (s === 'ABERTO') return 'bg-blue-100 text-blue-700';
  if (s === 'PAGO') return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
}

function statusEntregaLabel(s: string) {
  const map: Record<string, string> = {
    EM_PREPARO: 'Em preparo', PRONTO: 'Pronto', SAIU_ENTREGA: 'Saiu p/ entrega',
    RECEBIDO: 'Recebido', CONFIRMADO: 'Confirmado', ENTREGUE: 'Entregue',
  };
  return map[s] ?? s;
}

function statusEntregaColor(s: string) {
  if (s === 'EM_PREPARO') return 'bg-orange-100 text-orange-700';
  if (s === 'PRONTO') return 'bg-yellow-100 text-yellow-700';
  if (s === 'SAIU_ENTREGA') return 'bg-purple-100 text-purple-700';
  if (s === 'ENTREGUE') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
}

// ─── Telas do admin ───────────────────────────────────────────────────────────

function ScreenDashboard({ stats }: { stats: Stats | null }) {
  if (!stats) return <Spinner />;
  return (
    <>
      <SectionTitle>Operacoes</SectionTitle>
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
      <SectionTitle>Acesso Rapido</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {['Mesas', 'Pedidos', 'Delivery', 'Cozinha'].map((item) => (
          <div key={item} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
            <p className="text-xs font-semibold text-gray-800">{item}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Acessar modulo</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ScreenPedidos() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-[0.5fr_0.8fr_1fr_0.8fr_0.7fr] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
        {['#', 'Tipo', 'Cliente', 'Status', 'Total'].map((h) => (
          <p key={h} className="text-[9px] font-semibold text-gray-400 uppercase">{h}</p>
        ))}
      </div>
      {MOCK_PEDIDOS.map((p) => (
        <div key={p.id} className="grid grid-cols-[0.5fr_0.8fr_1fr_0.8fr_0.7fr] gap-1 items-center px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50">
          <p className="text-xs font-bold text-gray-800">#{p.id}</p>
          <p className="text-[10px] text-gray-600 truncate">{p.tipo}</p>
          <p className="text-[10px] text-gray-600 truncate">{p.cliente}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${statusPedidoColor(p.status)}`}>
            {p.status}
          </span>
          <p className="text-[10px] font-bold text-gray-800">{formatBRL(p.total)}</p>
        </div>
      ))}
    </div>
  );
}

function ScreenMesas() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MOCK_MESAS.map((m) => (
        <div key={m.numero} className={`rounded-xl border p-3 ${statusMesaColor(m.status)}`}>
          <p className="text-xs font-black">Mesa {m.numero}</p>
          <p className="text-[10px] font-medium mt-0.5 opacity-80">{statusMesaLabel(m.status)}</p>
        </div>
      ))}
    </div>
  );
}

function ScreenDelivery() {
  return (
    <div className="space-y-2">
      {MOCK_DELIVERY.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800">#{p.id} · {p.tipo}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{p.cliente}</p>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusEntregaColor(p.status)}`}>
                {statusEntregaLabel(p.status)}
              </span>
              <p className="text-[10px] font-bold text-gray-800 mt-1">{formatBRL(p.total)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenCozinha() {
  return (
    <div className="space-y-2">
      {MOCK_ITENS_COZINHA.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-800">{item.produto}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{item.pedido}</p>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusPreparoColor(item.status)}`}>
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScreenCaixa({ stats }: { stats: Stats | null }) {
  return (
    <div className="space-y-2">
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-green-600">Caixa aberto</p>
        <p className="text-lg font-black text-green-800 mt-0.5">Em operacao</p>
      </div>
      {[
        { label: 'Vendas do dia', value: stats ? stats.pedidosPagos + ' pedidos pagos' : '—' },
        { label: 'Valor inicial', value: formatBRL(200) },
        { label: 'Sangrias', value: formatBRL(0) },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex justify-between">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-xs font-bold text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ScreenFinanceiro({ stats }: { stats: Stats | null }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Pedidos pagos hoje', value: stats?.pedidosPagos ?? '—', cls: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Total de clientes', value: stats?.clientesTotal ?? '—', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl border p-2.5 ${cls}`}>
            <p className="text-[10px] font-medium opacity-70">{label}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>
      <SectionTitle>Formas de pagamento</SectionTitle>
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
        {[['PIX', 48], ['Credito', 31], ['Debito', 14], ['Dinheiro', 7]].map(([label, pct]) => (
          <div key={label as string}>
            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
              <span>{label}</span><span>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-cafe-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ScreenProdutos() {
  return (
    <div className="space-y-2">
      {MOCK_PRODUTOS.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-800">{p.nome}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{p.categoria}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">{p.preco > 0 ? formatBRL(p.preco) : 'Incluso'}</p>
            <span className="text-[9px] font-bold text-green-600">Disponivel</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenClientes() {
  return (
    <div className="space-y-2">
      {MOCK_CLIENTES.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-800">{c.nome}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{c.telefone}</p>
          </div>
          <span className="text-[10px] font-semibold text-gray-500">{c.pedidos} pedidos</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</p>;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cafe-600 border-t-transparent" />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LandingInteractiveDemo() {
  const [mode, setMode] = useState<DemoMode>('admin');
  const [activeScreen, setActiveScreen] = useState<AdminScreen>('Dashboard');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${BASE}/public/${SLUG}/stats`)
      .then((r) => r.json())
      .then((d: Stats) => setStats(d))
      .catch(() => {});
  }, []);

  function renderAdminScreen() {
    switch (activeScreen) {
      case 'Dashboard': return <ScreenDashboard stats={stats} />;
      case 'Pedidos': return <ScreenPedidos />;
      case 'Mesas': return <ScreenMesas />;
      case 'Delivery': return <ScreenDelivery />;
      case 'Cozinha': return <ScreenCozinha />;
      case 'Caixa': return <ScreenCaixa stats={stats} />;
      case 'Financeiro': return <ScreenFinanceiro stats={stats} />;
      case 'Produtos': return <ScreenProdutos />;
      case 'Clientes': return <ScreenClientes />;
    }
  }

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
            <div className="rounded-xl border border-gray-900 bg-gray-950 p-2 shadow-2xl">
              <div className="flex rounded-lg overflow-hidden" style={{ minHeight: 500 }}>
                {/* Sidebar clicável */}
                <aside className="w-44 shrink-0 flex flex-col" style={{ backgroundColor: '#1a0f0a' }}>
                  <div className="px-4 py-4 border-b border-white/10">
                    <p className="text-sm font-bold text-white">Cozinha da Daika</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Restaurante</p>
                  </div>
                  <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
                    {NAV_ITEMS.map((item) => (
                      <button
                        key={item}
                        onClick={() => setActiveScreen(item)}
                        className={`w-full text-left flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          activeScreen === item
                            ? 'bg-white/20 text-white'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </nav>
                  <div className="p-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#5c2d0a' }}>
                        A
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">Daika Admin</p>
                        <p className="text-[10px] text-white/40">ADMIN</p>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Conteúdo */}
                <main className="flex-1 bg-gray-50 overflow-auto">
                  <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0">
                    <div />
                    <span className="text-xs text-gray-500">Ola, <span className="font-medium text-gray-700">Daika Admin</span></span>
                  </header>
                  <div className="p-4">
                    <p className="text-sm font-bold text-gray-900 mb-0.5">{activeScreen}</p>
                    <p className="text-xs text-gray-400 mb-4">
                      {activeScreen === 'Dashboard' ? 'Visao geral do dia' :
                       activeScreen === 'Pedidos' ? 'Lista de pedidos' :
                       activeScreen === 'Mesas' ? 'Status das mesas' :
                       activeScreen === 'Delivery' ? 'Pedidos delivery e retirada' :
                       activeScreen === 'Cozinha' ? 'Itens em preparo' :
                       activeScreen === 'Caixa' ? 'Controle de caixa' :
                       activeScreen === 'Financeiro' ? 'Relatorio financeiro' :
                       activeScreen === 'Produtos' ? 'Cardapio de produtos' :
                       'Base de clientes'}
                    </p>
                    {renderAdminScreen()}
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
