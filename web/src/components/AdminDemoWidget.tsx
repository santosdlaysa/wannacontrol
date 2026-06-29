'use client';

import { useState, useEffect } from 'react';

const SLUG = 'chefflow-demo';
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

type AdminScreen =
  | 'Dashboard'
  | 'Pedidos'
  | 'Mesas'
  | 'Delivery'
  | 'Cozinha'
  | 'Caixa'
  | 'Financeiro'
  | 'Produtos'
  | 'Clientes';

const NAV_ITEMS: { label: AdminScreen; icon: React.ReactNode }[] = [
  {
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Pedidos',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Delivery',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    label: 'Mesas',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: 'Cozinha',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  {
    label: 'Caixa',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Financeiro',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Produtos',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const MOCK_PEDIDOS = [
  { id: 1042, tipo: 'Delivery', cliente: 'Ana Paula', status: 'ABERTO', total: 68.9 },
  { id: 1041, tipo: 'Mesa 03', cliente: 'Garcom Leo', status: 'ABERTO', total: 124.4 },
  { id: 1040, tipo: 'Retirada', cliente: 'Marcos Lima', status: 'PAGO', total: 42.0 },
  { id: 1039, tipo: 'Mesa 07', cliente: 'Garcom Ana', status: 'PAGO', total: 89.5 },
];

const MOCK_MESAS = [
  { numero: 1, status: 'LIVRE' }, { numero: 2, status: 'OCUPADA' },
  { numero: 3, status: 'OCUPADA' }, { numero: 4, status: 'LIVRE' },
  { numero: 5, status: 'AGUARDANDO_CONTA' }, { numero: 6, status: 'LIVRE' },
  { numero: 7, status: 'OCUPADA' }, { numero: 8, status: 'LIVRE' },
  { numero: 9, status: 'OCUPADA' },
];

const MOCK_DELIVERY = [
  { id: 1042, cliente: 'Ana Paula', tipo: 'DELIVERY', status: 'EM_PREPARO', total: 68.9 },
  { id: 1040, cliente: 'Marcos Lima', tipo: 'RETIRADA', status: 'PRONTO', total: 42.0 },
  { id: 1038, cliente: 'Carla Souza', tipo: 'DELIVERY', status: 'SAIU_ENTREGA', total: 55.0 },
];

const MOCK_COZINHA = [
  { id: 1, produto: 'Frango Grelhado', obs: null, pedido: '#1041', origem: 'Mesa 03', status: 'PREPARANDO', tempo: '04:23' },
  { id: 2, produto: 'Marmita Saudavel', obs: 'Sem cebola', pedido: '#1042', origem: 'Delivery', status: 'PENDENTE', tempo: '01:10' },
  { id: 3, produto: 'Lasanha de Carne', obs: null, pedido: '#1041', origem: 'Mesa 03', status: 'PRONTO', tempo: '12:05' },
  { id: 4, produto: 'Strogonoff', obs: 'Extra molho', pedido: '#1044', origem: 'Mesa 07', status: 'PENDENTE', tempo: '00:45' },
  { id: 5, produto: 'Suco de Laranja', obs: null, pedido: '#1042', origem: 'Delivery', status: 'PREPARANDO', tempo: '02:30' },
  { id: 6, produto: 'Arroz + Feijao', obs: null, pedido: '#1043', origem: 'Retirada', status: 'PRONTO', tempo: '08:15' },
];

const MOCK_PRODUTOS = [
  { id: 1, nome: 'Frango Grelhado', categoria: 'Marmitas', preco: 30.0, disponivel: true },
  { id: 2, nome: 'Lasanha de Carne', categoria: 'Marmitas', preco: 30.0, disponivel: true },
  { id: 3, nome: 'Marmita Saudavel', categoria: 'Marmitas', preco: 30.0, disponivel: true },
  { id: 4, nome: 'Arroz', categoria: 'Acompanhamentos', preco: 0.0, disponivel: true },
];

const MOCK_PEDIDOS_FIN = [
  { id: 1042, tipo: 'Delivery', cliente: 'Ana Paula', forma: 'PIX', total: 68.9 },
  { id: 1041, tipo: 'Mesa 03', cliente: 'Leo Garcom', forma: 'Credito', total: 124.4 },
  { id: 1040, tipo: 'Retirada', cliente: 'Marcos Lima', forma: 'PIX', total: 42.0 },
  { id: 1039, tipo: 'Mesa 07', cliente: 'Ana Garcom', forma: 'Debito', total: 89.5 },
  { id: 1038, tipo: 'Delivery', cliente: 'Carla Souza', forma: 'Dinheiro', total: 55.0 },
];

const MOCK_CLIENTES = [
  { id: 1, nome: 'Ana Paula', telefone: '(95) 99123-7788', pedidos: 8, cidade: 'Boa Vista' },
  { id: 2, nome: 'Marcos Lima', telefone: '(95) 98444-1122', pedidos: 3, cidade: 'Boa Vista' },
  { id: 3, nome: 'Carla Souza', telefone: '(95) 99910-2233', pedidos: 12, cidade: 'Boa Vista' },
  { id: 4, nome: 'Pedro Alves', telefone: '(95) 99001-5566', pedidos: 5, cidade: 'Boa Vista' },
];

function statusMesaBorder(s: string) {
  if (s === 'LIVRE') return 'border-green-300';
  if (s === 'OCUPADA') return 'border-red-300';
  return 'border-yellow-300';
}

function statusMesaDot(s: string) {
  if (s === 'LIVRE') return 'bg-green-500';
  if (s === 'OCUPADA') return 'bg-red-500';
  return 'bg-yellow-500';
}

function statusMesaBadge(s: string) {
  if (s === 'LIVRE') return 'bg-green-100 text-green-700';
  if (s === 'OCUPADA') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
}

function statusMesaLabel(s: string) {
  if (s === 'LIVRE') return 'Livre';
  if (s === 'OCUPADA') return 'Ocupada';
  return 'Aguard. Conta';
}

function statusPreparoColor(s: string) {
  if (s === 'PENDENTE') return 'bg-red-100 text-red-700';
  if (s === 'PREPARANDO') return 'bg-yellow-100 text-yellow-700';
  if (s === 'PRONTO') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
}

function statusPedidoBadge(s: string) {
  if (s === 'ABERTO') return 'bg-blue-100 text-blue-700';
  if (s === 'PAGO') return 'bg-green-100 text-green-700';
  return 'bg-red-100 text-red-700';
}

const STATUS_ENTREGA_LABELS: Record<string, string> = {
  EM_PREPARO: 'Em Producao',
  PRONTO: 'Pronto',
  SAIU_ENTREGA: 'Saiu p/ Entrega',
  RECEBIDO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  ENTREGUE: 'Entregue',
};

function statusEntregaColor(s: string) {
  if (s === 'EM_PREPARO') return 'bg-orange-100 text-orange-700';
  if (s === 'PRONTO') return 'bg-yellow-100 text-yellow-700';
  if (s === 'SAIU_ENTREGA') return 'bg-purple-100 text-purple-700';
  if (s === 'ENTREGUE') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
        active ? 'bg-cafe-700 text-white border-cafe-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cafe-600 border-t-transparent" />
    </div>
  );
}

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
          { label: 'Em Preparo', value: 3, cls: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Prontos', value: 1, cls: 'bg-red-50 border-red-200 text-red-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl border p-2.5 ${cls}`}>
            <p className="text-[10px] font-medium opacity-70">{label}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>
      <SectionTitle>Financeiro</SectionTitle>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl border p-2.5 bg-green-50 border-green-200 text-green-700">
          <p className="text-[10px] font-medium opacity-70">Faturamento Hoje</p>
          <p className="text-lg font-bold mt-0.5">{formatBRL(324.8)}</p>
        </div>
        <div className="rounded-xl border p-2.5 bg-[#fdf6f0] border-[#e8c4a0] text-[#7a3b0f]">
          <p className="text-[10px] font-medium opacity-70">Faturamento do Mes</p>
          <p className="text-lg font-bold mt-0.5">{formatBRL(4832.0)}</p>
        </div>
      </div>
      <SectionTitle>Acesso Rapido</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Mesas', desc: 'Gerenciar mesas' },
          { label: 'Pedidos', desc: 'Lista de pedidos' },
          { label: 'Delivery', desc: 'Pedidos delivery' },
          { label: 'Cozinha', desc: 'KDS' },
          { label: 'Clientes', desc: 'Cadastro de clientes' },
          { label: 'Caixa', desc: 'Fluxo de caixa' },
          { label: 'Financeiro', desc: 'Relatorios' },
          { label: 'Produtos', desc: 'Cardapio' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
            <p className="text-xs font-semibold text-gray-800">{item.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ScreenPedidos() {
  const [filtro, setFiltro] = useState('');
  const filtered = filtro ? MOCK_PEDIDOS.filter((p) => p.status === filtro) : MOCK_PEDIDOS;
  return (
    <>
      <div className="flex gap-1.5 mb-3">
        {[['', 'Todos'], ['ABERTO', 'Abertos'], ['PAGO', 'Pagos']].map(([f, label]) => (
          <TabButton key={f} active={filtro === f} onClick={() => setFiltro(f)}>{label}</TabButton>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[0.5fr_0.8fr_1fr_0.8fr_0.7fr] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
          {['#', 'Tipo', 'Cliente', 'Status', 'Total'].map((h) => (
            <p key={h} className="text-[9px] font-semibold text-gray-400 uppercase">{h}</p>
          ))}
        </div>
        {filtered.map((p) => (
          <div key={p.id} className="grid grid-cols-[0.5fr_0.8fr_1fr_0.8fr_0.7fr] gap-1 items-center px-3 py-2 border-b border-gray-100 last:border-0">
            <p className="text-xs font-bold text-gray-800">#{p.id}</p>
            <p className="text-[10px] text-gray-600 truncate">{p.tipo}</p>
            <p className="text-[10px] text-gray-600 truncate">{p.cliente}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${statusPedidoBadge(p.status)}`}>
              {p.status}
            </span>
            <p className="text-[10px] font-bold text-gray-800">{formatBRL(p.total)}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ScreenMesas() {
  return (
    <>
      <div className="flex gap-3 mb-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Livre</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Ocupada</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Aguard. Conta</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MOCK_MESAS.map((m) => (
          <div key={m.numero} className={`relative bg-white rounded-xl border-2 p-3 text-center ${statusMesaBorder(m.status)}`}>
            <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${statusMesaDot(m.status)}`} />
            <p className="text-xl font-bold text-gray-800 mb-1">{m.numero}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusMesaBadge(m.status)}`}>
              {statusMesaLabel(m.status)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function ScreenDelivery() {
  const [filtro, setFiltro] = useState<'ABERTOS' | 'CONCLUIDOS'>('ABERTOS');
  return (
    <>
      <div className="flex gap-1.5 mb-3">
        <TabButton active={filtro === 'ABERTOS'} onClick={() => setFiltro('ABERTOS')}>Em Andamento</TabButton>
        <TabButton active={filtro === 'CONCLUIDOS'} onClick={() => setFiltro('CONCLUIDOS')}>Concluidos</TabButton>
      </div>
      <div className="space-y-2">
        {MOCK_DELIVERY.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gray-800">#{p.id}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.tipo === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {p.tipo === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{p.cliente}</p>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusEntregaColor(p.status)}`}>
                  {STATUS_ENTREGA_LABELS[p.status] ?? p.status}
                </span>
                <p className="text-[10px] font-bold text-gray-800 mt-1">{formatBRL(p.total)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const COZINHA_COLS = [
  { status: 'PENDENTE', label: 'Pendente', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
  { status: 'PREPARANDO', label: 'Em Preparo', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-700' },
  { status: 'PRONTO', label: 'Pronto', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
];

function ScreenCozinha() {
  return (
    <div className="grid grid-cols-3 gap-2 h-full">
      {COZINHA_COLS.map((col) => {
        const items = MOCK_COZINHA.filter((i) => i.status === col.status);
        return (
          <div key={col.status} className={`rounded-xl border ${col.border} ${col.bg} p-2 flex flex-col gap-1.5`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
              <p className={`text-[9px] font-black uppercase tracking-wide ${col.text}`}>{col.label}</p>
              <span className={`ml-auto text-[9px] font-bold ${col.text} bg-white/60 rounded-full px-1.5 py-0.5`}>{items.length}</span>
            </div>
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-100 p-2 shadow-sm">
                <p className="text-[10px] font-bold text-gray-900 leading-tight">{item.produto}</p>
                {item.obs && (
                  <p className="text-[9px] text-orange-600 font-medium mt-0.5 leading-tight">{item.obs}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <div>
                    <p className="text-[9px] font-bold text-gray-700">{item.pedido}</p>
                    <p className="text-[9px] text-gray-400">{item.origem}</p>
                  </div>
                  <p className={`text-[9px] font-mono font-bold ${col.status === 'PRONTO' ? 'text-green-600' : col.status === 'PREPARANDO' ? 'text-yellow-600' : 'text-red-500'}`}>{item.tempo}</p>
                </div>
                {col.status !== 'PRONTO' && (
                  <button className={`mt-1.5 w-full text-[8px] font-bold py-0.5 rounded-md ${col.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {col.status === 'PENDENTE' ? 'Iniciar' : 'Marcar Pronto'}
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ScreenCaixa({ stats }: { stats: Stats | null }) {
  const [tab, setTab] = useState<'operacao' | 'historico'>('operacao');
  return (
    <>
      <div className="flex gap-1.5 mb-3">
        <TabButton active={tab === 'operacao'} onClick={() => setTab('operacao')}>Operacao</TabButton>
        <TabButton active={tab === 'historico'} onClick={() => setTab('historico')}>Historico</TabButton>
      </div>
      {tab === 'operacao' ? (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-green-600">Caixa aberto</p>
            <p className="text-lg font-black text-green-800 mt-0.5">Em operacao</p>
          </div>
          {[
            { label: 'Operador', value: 'Admin Demo' },
            { label: 'Vendas do dia', value: stats ? `${stats.pedidosPagos} pedidos pagos` : '—' },
            { label: 'Valor inicial', value: formatBRL(200) },
            { label: 'Sangrias', value: formatBRL(0) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex justify-between">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="text-xs font-bold text-gray-800">{value}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <div className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-2 text-center">
              <p className="text-[9px] font-semibold text-gray-500">+ Suprimento</p>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 px-3 py-2 text-center">
              <p className="text-[9px] font-semibold text-gray-500">- Sangria</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {[
            { data: '27/06', abertura: 'R$ 200,00', fechamento: 'R$ 512,40' },
            { data: '26/06', abertura: 'R$ 150,00', fechamento: 'R$ 389,90' },
          ].map((c) => (
            <div key={c.data} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-gray-800">{c.data}</p>
                <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">Fechado</span>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[10px] text-gray-500">Abertura: {c.abertura}</p>
                <p className="text-[10px] font-bold text-green-700">{c.fechamento}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ScreenFinanceiro({ stats }: { stats: Stats | null }) {
  const [tab, setTab] = useState<'resumo' | 'pedidos'>('resumo');
  const totalPedidos = MOCK_PEDIDOS_FIN.reduce((a, p) => a + p.total, 0);
  return (
    <>
      <div className="flex gap-1.5 mb-3">
        <TabButton active={tab === 'resumo'} onClick={() => setTab('resumo')}>Resumo</TabButton>
        <TabButton active={tab === 'pedidos'} onClick={() => setTab('pedidos')}>Pedidos</TabButton>
      </div>
      {tab === 'resumo' ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Faturamento Hoje', value: formatBRL(379.8), cls: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Pedidos pagos', value: stats?.pedidosPagos ?? 5, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'Ticket Medio', value: formatBRL(75.96), cls: 'bg-[#fdf6f0] border-[#e8c4a0] text-[#7a3b0f]' },
              { label: 'Total clientes', value: stats?.clientesTotal ?? '—', cls: 'bg-gray-50 border-gray-200 text-gray-700' },
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
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[0.45fr_0.7fr_0.9fr_0.7fr_0.6fr] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
            {['#', 'Tipo', 'Cliente', 'Forma', 'Total'].map((h) => (
              <p key={h} className="text-[9px] font-semibold text-gray-400 uppercase">{h}</p>
            ))}
          </div>
          {MOCK_PEDIDOS_FIN.map((p) => (
            <div key={p.id} className="grid grid-cols-[0.45fr_0.7fr_0.9fr_0.7fr_0.6fr] gap-1 items-center px-3 py-2 border-b border-gray-100 last:border-0">
              <p className="text-[10px] font-bold text-gray-800">#{p.id}</p>
              <p className="text-[9px] text-gray-600 truncate">{p.tipo}</p>
              <p className="text-[9px] text-gray-600 truncate">{p.cliente}</p>
              <p className="text-[9px] text-gray-500 truncate">{p.forma}</p>
              <p className="text-[10px] font-bold text-gray-800">{formatBRL(p.total)}</p>
            </div>
          ))}
          <div className="grid grid-cols-[0.45fr_0.7fr_0.9fr_0.7fr_0.6fr] gap-1 items-center px-3 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-[9px] font-black text-gray-700 col-span-4">Total</p>
            <p className="text-[10px] font-black text-green-700">{formatBRL(totalPedidos)}</p>
          </div>
        </div>
      )}
    </>
  );
}

function ScreenProdutos() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const categorias = [...new Set(MOCK_PRODUTOS.map((p) => p.categoria))];
  const filtered = categoriaAtiva ? MOCK_PRODUTOS.filter((p) => p.categoria === categoriaAtiva) : MOCK_PRODUTOS;
  return (
    <>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {['', ...categorias].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
              categoriaAtiva === cat ? 'bg-cafe-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === '' ? 'Todos' : cat}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((p) => (
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
    </>
  );
}

function ScreenClientes() {
  return (
    <>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 mb-3">
        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-[10px] text-gray-400">Buscar cliente...</p>
      </div>
      <div className="space-y-2">
        {MOCK_CLIENTES.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800">{c.nome}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{c.telefone}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{c.pedidos} pedidos</span>
              <p className="text-[9px] text-gray-400 mt-0.5">{c.cidade}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const SCREEN_SUBTITLE: Record<AdminScreen, string> = {
  Dashboard: 'Visao geral do dia',
  Pedidos: 'Lista de pedidos',
  Mesas: 'Status das mesas',
  Delivery: 'Pedidos delivery e retirada',
  Cozinha: 'Itens em preparo',
  Caixa: 'Controle de caixa',
  Financeiro: 'Relatorio financeiro',
  Produtos: 'Cardapio de produtos',
  Clientes: 'Base de clientes',
};

export default function AdminDemoWidget({ minHeight = 500 }: { minHeight?: number }) {
  const [activeScreen, setActiveScreen] = useState<AdminScreen>('Dashboard');
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`${BASE}/public/${SLUG}/stats`)
      .then((r) => r.json())
      .then((d: Stats) => setStats(d))
      .catch(() => {});
  }, []);

  function renderScreen() {
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
    <div className="rounded-xl border border-gray-900 bg-gray-950 p-2 shadow-2xl">
      <div className="flex rounded-lg overflow-hidden" style={{ minHeight }}>
        {/* Sidebar */}
        <aside className="w-44 shrink-0 flex flex-col bg-cafe-900">
          <div className="px-3 py-3 border-b border-cafe-800">
            <p className="text-xs font-bold text-cafe-50 leading-tight">ChefFlow Demo</p>
            <p className="text-[10px] text-cafe-300 mt-0.5">Restaurante</p>
          </div>
          <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-hidden">
            {NAV_ITEMS.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => setActiveScreen(label)}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeScreen === label
                    ? 'bg-cafe-700 text-cafe-50'
                    : 'text-cafe-200 hover:bg-cafe-800 hover:text-white'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
          <div className="p-2.5 border-t border-cafe-800">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-cafe-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                D
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white truncate">Admin Demo</p>
                <p className="text-[9px] text-cafe-300">ADMIN</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <header className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between sticky top-0 z-10">
            <div />
            <span className="text-[10px] text-gray-500">
              Ola, <span className="font-medium text-gray-700">Admin Demo</span>
            </span>
          </header>
          <div className="p-3">
            <p className="text-xs font-bold text-gray-900 mb-0.5">{activeScreen}</p>
            <p className="text-[10px] text-gray-400 mb-3">{SCREEN_SUBTITLE[activeScreen]}</p>
            {renderScreen()}
          </div>
        </main>
      </div>
    </div>
  );
}
