'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

const BASE = '/api/v1';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Types ───────────────────────────────────────────────────────────────────

interface Restaurante {
  id: number;
  nome: string;
  slug: string;
  telefone: string | null;
  logoUrl: string | null;
}

interface ProdutoPublico {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  urlImagem: string | null;
  disponivel: boolean;
}

interface CategoriaPublica {
  id: number;
  nome: string;
  descricao: string | null;
  produtos: ProdutoPublico[];
}

interface BairroPublico {
  id: number;
  bairro: string;
  taxa: number;
}

interface CardapioData {
  restaurante: Restaurante;
  configuracoes: Record<string, string | null>;
  categorias: CategoriaPublica[];
  semCategoria: (ProdutoPublico & { categoria: string })[];
  bairros: BairroPublico[];
}

interface CartItem {
  produto: ProdutoPublico;
  quantidade: number;
  observacao: string;
}

type Tipo = 'DELIVERY' | 'RETIRADA';
type Step = 'menu' | 'checkout' | 'sucesso';

interface LastPedido {
  id: number;
  clienteNome: string;
  clienteTelefone: string;
  tipoPedido: Tipo;
  criadoEm: string;
}

type StatusEntregaPedido =
  | 'RECEBIDO'
  | 'CONFIRMADO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'SAIU_ENTREGA'
  | 'ENTREGUE'
  | 'CANCELADO';

interface StatusPedidoPublico {
  id: number;
  tipoPedido: Tipo;
  statusPedido: 'ABERTO' | 'PAGO' | 'CANCELADO';
  statusEntrega: StatusEntregaPedido | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  total: number;
}

interface PedidoHistoricoPublico {
  id: number;
  tipoPedido: Tipo;
  statusPedido: 'ABERTO' | 'PAGO' | 'CANCELADO';
  statusEntrega: StatusEntregaPedido | null;
  dataCriacao: string;
  total: number;
  itens: Array<{
    id: number;
    quantidade: number;
    produto: { nome: string };
  }>;
}

interface TimelineStep {
  status: StatusEntregaPedido;
  label: string;
  icon: string;
  desc: string;
}

const TIMELINE_DELIVERY: TimelineStep[] = [
  { status: 'RECEBIDO',     label: 'Pedido recebido',    icon: '📋', desc: 'Seu pedido foi enviado ao restaurante' },
  { status: 'CONFIRMADO',   label: 'Confirmado',         icon: '✅', desc: 'O restaurante confirmou seu pedido' },
  { status: 'EM_PREPARO',   label: 'Em produção',        icon: '👨‍🍳', desc: 'Sua comida está sendo preparada' },
  { status: 'SAIU_ENTREGA', label: 'Saiu para entrega',  icon: '🛵', desc: 'O entregador está a caminho' },
  { status: 'ENTREGUE',     label: 'Entregue',           icon: '🎉', desc: 'Pedido entregue. Bom apetite!' },
];

const TIMELINE_RETIRADA: TimelineStep[] = [
  { status: 'RECEBIDO',   label: 'Pedido recebido',       icon: '📋', desc: 'Seu pedido foi enviado ao restaurante' },
  { status: 'CONFIRMADO', label: 'Confirmado',            icon: '✅', desc: 'O restaurante confirmou seu pedido' },
  { status: 'EM_PREPARO', label: 'Em produção',           icon: '👨‍🍳', desc: 'Sua comida está sendo preparada' },
  { status: 'PRONTO',     label: 'Pronto para retirada',  icon: '🥡', desc: 'Seu pedido está pronto!' },
];

const STATUS_ORDER: Record<StatusEntregaPedido, number> = {
  RECEBIDO: 0, CONFIRMADO: 1, EM_PREPARO: 2, PRONTO: 3,
  SAIU_ENTREGA: 3, ENTREGUE: 4, CANCELADO: -1,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CardapioPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<CardapioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [catAtiva, setCatAtiva] = useState<number | 'sem' | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [lastPedido, setLastPedido] = useState<LastPedido | null>(null);
  const [pedidoStatus, setPedidoStatus] = useState<StatusPedidoPublico | null>(null);
  const [statusErro, setStatusErro] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historicoPedidos, setHistoricoPedidos] = useState<PedidoHistoricoPublico[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoErro, setHistoricoErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Checkout form
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipo, setTipo] = useState<Tipo>('DELIVERY');
  const [bairroId, setBairroId] = useState<number | null>(null);
  const [rua, setRua] = useState('');
  const [obs, setObs] = useState('');
  const [dadosSalvos, setDadosSalvos] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  const fetchCardapio = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/public/${slug}/cardapio`);
      if (!res.ok) throw new Error('Cardapio nao encontrado');
      const json: CardapioData = await res.json();
      setData(json);
      if (json.categorias.length > 0) setCatAtiva(json.categorias[0].id);
      else if (json.semCategoria.length > 0) setCatAtiva('sem');
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar cardapio');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchCardapio(); }, [fetchCardapio]);

  useEffect(() => {
    if (!slug) return;

    const storageKey = `cardapio:last-pedido:${slug}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      setLastPedido(JSON.parse(raw) as LastPedido);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const raw = localStorage.getItem(`cardapio:cliente:${slug}`);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as { nome: string; telefone: string; bairroId: number | null; rua: string };
      if (saved.nome) setNome(saved.nome);
      if (saved.telefone) setTelefone(saved.telefone);
      if (saved.bairroId) setBairroId(saved.bairroId);
      if (saved.rua) setRua(saved.rua);
      setDadosSalvos(true);
    } catch {
      localStorage.removeItem(`cardapio:cliente:${slug}`);
    }
  }, [slug]);

  const fetchPedidoStatus = useCallback(async () => {
    if (!pedidoId || !telefone.trim()) return;

    setStatusLoading(true);
    try {
      const params = new URLSearchParams({ telefone: telefone.trim() });
      const res = await fetch(`${BASE}/public/${slug}/pedidos/${pedidoId}/status?${params}`);
      if (!res.ok) throw new Error('Nao foi possivel carregar o status do pedido');
      const json: StatusPedidoPublico = await res.json();
      setPedidoStatus(json);
      setStatusErro('');
    } catch (e: any) {
      setStatusErro(e.message || 'Erro ao carregar status');
    } finally {
      setStatusLoading(false);
    }
  }, [pedidoId, slug, telefone]);

  useEffect(() => {
    if (step !== 'sucesso' || !pedidoId) return;

    fetchPedidoStatus();
    const interval = window.setInterval(fetchPedidoStatus, 10_000);
    return () => window.clearInterval(interval);
  }, [step, pedidoId, fetchPedidoStatus]);

  async function fetchHistoricoPedidos(telefoneHistorico?: string) {
    const telefoneBusca = telefoneHistorico || lastPedido?.clienteTelefone || telefone;
    if (!telefoneBusca.trim()) {
      setHistoricoErro('Informe um telefone para buscar o historico');
      return;
    }

    setHistoricoLoading(true);
    try {
      const params = new URLSearchParams({ telefone: telefoneBusca.trim() });
      const res = await fetch(`${BASE}/public/${slug}/pedidos/historico?${params}`);
      if (!res.ok) throw new Error('Nao foi possivel carregar seu historico');
      const json: PedidoHistoricoPublico[] = await res.json();
      setHistoricoPedidos(json);
      setHistoricoErro('');
      setHistoricoOpen(true);
    } catch (e: any) {
      setHistoricoErro(e.message || 'Erro ao carregar historico');
    } finally {
      setHistoricoLoading(false);
    }
  }

  // ─── Cart helpers ──────────────────────────────────────────────────────────

  function addItem(produto: ProdutoPublico) {
    setCart((prev) => {
      const existing = prev.find((i) => i.produto.id === produto.id);
      if (existing) {
        return prev.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { produto, quantidade: 1, observacao: '' }];
    });
  }

  function removeItem(produtoId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.produto.id === produtoId);
      if (existing && existing.quantidade > 1) {
        return prev.map((i) =>
          i.produto.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i
        );
      }
      return prev.filter((i) => i.produto.id !== produtoId);
    });
  }

  function getQty(produtoId: number) {
    return cart.find((i) => i.produto.id === produtoId)?.quantidade ?? 0;
  }

  const totalItens = cart.reduce((a, i) => a + i.quantidade, 0);
  const subtotal = cart.reduce((a, i) => a + Number(i.produto.preco) * i.quantidade, 0);

  const bairroSelecionado = data?.bairros?.find((b) => b.id === bairroId) ?? null;
  const usaBairros = (data?.bairros?.length ?? 0) > 0;
  const restauranteAberto = data?.configuracoes?.restaurante_aberto !== 'false';
  const taxaEntrega = tipo === 'DELIVERY'
    ? (bairroSelecionado ? Number(bairroSelecionado.taxa) : (usaBairros ? 0 : Number(data?.configuracoes?.taxa_entrega ?? 0)))
    : 0;
  const total = subtotal + taxaEntrega;

  async function buscarClientePorTelefone(tel: string) {
    const digits = tel.replace(/\D/g, '');
    if (digits.length < 10) return;

    setBuscandoCliente(true);
    try {
      const res = await fetch(`${BASE}/public/${slug}/cliente?telefone=${encodeURIComponent(digits)}`);
      if (!res.ok) return;
      const cliente = await res.json() as { nome: string; telefone: string; endereco: string | null; bairro: string | null } | null;
      if (!cliente) return;

      if (cliente.nome) setNome(cliente.nome);

      // Tentar encontrar o bairroId pelo nome do bairro
      if (cliente.bairro && data?.bairros) {
        const bairroEncontrado = data.bairros.find(
          (b) => b.bairro.toLowerCase() === cliente.bairro!.toLowerCase()
        );
        if (bairroEncontrado) setBairroId(bairroEncontrado.id);
      }

      // Rua: pegar a parte antes do bairro se endereço contiver ", Bairro"
      if (cliente.endereco) {
        const ruaExtraida = cliente.bairro
          ? cliente.endereco.replace(new RegExp(`,?\\s*${cliente.bairro}$`, 'i'), '').trim()
          : cliente.endereco;
        if (ruaExtraida) setRua(ruaExtraida);
      }

      setDadosSalvos(true);
      localStorage.setItem(`cardapio:cliente:${slug}`, JSON.stringify({
        nome: cliente.nome,
        telefone: digits,
        bairroId: data?.bairros?.find((b) => b.bairro.toLowerCase() === (cliente.bairro || '').toLowerCase())?.id ?? null,
        rua: cliente.endereco || '',
      }));
    } catch {
      // silencioso
    } finally {
      setBuscandoCliente(false);
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!restauranteAberto) {
      alert('Restaurante fechado no momento');
      return;
    }
    if (!nome.trim() || !telefone.trim()) {
      alert('Preencha seu nome e telefone');
      return;
    }
    if (tipo === 'DELIVERY' && usaBairros && !bairroId) {
      alert('Selecione o bairro de entrega');
      return;
    }
    if (tipo === 'DELIVERY' && !usaBairros && !rua.trim()) {
      alert('Preencha o endereço de entrega');
      return;
    }
    if (cart.length === 0) {
      alert('Adicione pelo menos um item');
      return;
    }

    const enderecoFinal = tipo === 'DELIVERY'
      ? [rua.trim(), bairroSelecionado?.bairro].filter(Boolean).join(', ')
      : null;

    setEnviando(true);
    try {
      const res = await fetch(`${BASE}/public/${slug}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: nome.trim(),
          clienteTelefone: telefone.trim(),
          tipoPedido: tipo,
          bairroId: tipo === 'DELIVERY' ? bairroId : null,
          enderecoEntrega: enderecoFinal,
          observacao: obs.trim() || null,
          itens: cart.map((i) => ({
            produtoId: i.produto.id,
            quantidade: i.quantidade,
            observacao: i.observacao || null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Erro ao enviar pedido');
      }

      const pedido = await res.json();
      const pedidoSalvo: LastPedido = {
        id: pedido.id,
        clienteNome: pedido.cliente?.nome || nome.trim(),
        clienteTelefone: pedido.cliente?.telefone || telefone.replace(/\D/g, ''),
        tipoPedido: pedido.tipoPedido || tipo,
        criadoEm: new Date().toISOString(),
      };

      setPedidoId(pedido.id);
      setPedidoStatus(null);
      setLastPedido(pedidoSalvo);
      localStorage.setItem(`cardapio:last-pedido:${slug}`, JSON.stringify(pedidoSalvo));
      localStorage.setItem(`cardapio:cliente:${slug}`, JSON.stringify({
        nome: nome.trim(),
        telefone: telefone.trim(),
        bairroId: tipo === 'DELIVERY' ? bairroId : null,
        rua: tipo === 'DELIVERY' ? rua.trim() : '',
      }));
      setDadosSalvos(true);
      setCart([]);
      setStep('sucesso');
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function getStatusLabel(status: StatusEntregaPedido | string): string {
    const allSteps = [...TIMELINE_DELIVERY, ...TIMELINE_RETIRADA];
    const found = allSteps.find((s) => s.status === status);
    return found?.label ?? status;
  }

  // ─── Render estados ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-amber-700 font-medium">Carregando cardapio...</p>
        </div>
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl mb-2">🍽️</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Cardapio nao encontrado</h1>
          <p className="text-gray-500">{erro}</p>
        </div>
      </div>
    );
  }

  const { restaurante, categorias, semCategoria } = data;

  // Tela de sucesso
  if (step === 'sucesso') {
    const currentStatusRaw: StatusEntregaPedido =
      pedidoStatus?.statusPedido === 'CANCELADO'
        ? 'CANCELADO'
        : (pedidoStatus?.statusEntrega || 'RECEBIDO');

    const isCanceled = currentStatusRaw === 'CANCELADO';
    const tipoPedidoAtual = pedidoStatus?.tipoPedido || tipo;
    const timeline = tipoPedidoAtual === 'DELIVERY' ? TIMELINE_DELIVERY : TIMELINE_RETIRADA;
    const currentOrder = isCanceled ? -1 : (STATUS_ORDER[currentStatusRaw] ?? 0);

    const tempoPreparo = Number(data?.configuracoes?.tempo_preparo_medio ?? 30);
    const criadoEm = lastPedido?.criadoEm ? new Date(lastPedido.criadoEm) : null;
    const minutosDecorridos = criadoEm
      ? Math.floor((Date.now() - criadoEm.getTime()) / 60000)
      : null;

    function getStepState(index: number): 'done' | 'current' | 'pending' {
      if (isCanceled) return 'pending';
      if (index < currentOrder) return 'done';
      if (index === currentOrder) return 'current';
      return 'pending';
    }

    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-amber-500 text-white px-6 pt-8 pb-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold">Pedido Recebido!</h2>
            <p className="text-amber-100 text-sm mt-1">
              Pedido <span className="font-bold text-white">#{pedidoId}</span>
            </p>
          </div>

          <div className="p-5">
            {/* Cancelado */}
            {isCanceled && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                <p className="text-red-600 font-bold">Pedido cancelado</p>
                <p className="text-xs text-red-400 mt-1">Entre em contato com o restaurante</p>
              </div>
            )}

            {/* Tempo estimado + decorrido */}
            {!isCanceled && (
              <div className="flex items-center gap-3 mb-5 bg-amber-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Tempo estimado</p>
                  <p className="text-xl font-extrabold text-gray-900">~{tempoPreparo} min</p>
                </div>
                {minutosDecorridos !== null && (
                  <div className="text-right border-l border-amber-200 pl-3">
                    <p className="text-xs text-gray-400">Aguardando há</p>
                    <p className="text-xl font-extrabold text-gray-700">{minutosDecorridos} min</p>
                  </div>
                )}
                <button
                  onClick={fetchPedidoStatus}
                  disabled={statusLoading}
                  className="text-amber-600 bg-white rounded-lg p-2 disabled:opacity-50 hover:bg-amber-100 transition-colors"
                  title="Atualizar status"
                >
                  <svg className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}

            {statusErro && (
              <p className="text-sm text-red-500 mb-4 text-center">{statusErro}</p>
            )}

            {/* Timeline */}
            {!isCanceled && (
              <div>
                {timeline.map((timelineStep, index) => {
                  const state = getStepState(index);
                  const isLast = index === timeline.length - 1;
                  return (
                    <div key={timelineStep.status} className="flex gap-3">
                      {/* Coluna esquerda: ícone + linha */}
                      <div className="flex flex-col items-center">
                        {state === 'done' ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : state === 'current' ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 ring-4 ring-amber-200 animate-pulse">
                            <span className="text-sm leading-none">{timelineStep.icon}</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
                            <span className="text-sm leading-none opacity-30">{timelineStep.icon}</span>
                          </div>
                        )}
                        {!isLast && (
                          <div
                            className={`w-0.5 my-1 ${state === 'done' ? 'bg-amber-400' : 'bg-gray-200'}`}
                            style={{ minHeight: '24px' }}
                          />
                        )}
                      </div>

                      {/* Coluna direita: texto */}
                      <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-bold leading-tight ${state !== 'pending' ? 'text-gray-900' : 'text-gray-400'}`}>
                          {timelineStep.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${state !== 'pending' ? 'text-gray-500' : 'text-gray-300'}`}>
                          {timelineStep.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total */}
            {pedidoStatus && (
              <div className="mt-5 border-t border-gray-100 pt-3 flex justify-between text-sm">
                <span className="text-gray-500">Total do pedido</span>
                <span className="font-bold text-gray-900">{formatBRL(Number(pedidoStatus.total))}</span>
              </div>
            )}

            <p className="text-xs text-gray-300 text-center mt-3">Atualiza automaticamente a cada 10 segundos</p>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 space-y-2">
            {restaurante.telefone && (
              <a
                href={`https://wa.me/55${restaurante.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar no WhatsApp
              </a>
            )}
            <button
              onClick={() => { setStep('menu'); setNome(''); setTelefone(''); setBairroId(null); setRua(''); setObs(''); }}
              className="w-full text-center text-amber-600 font-medium text-sm py-2 hover:text-amber-800 transition-colors"
            >
              Fazer outro pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tela de checkout ────────────────────────────────────────────────────

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-amber-50">
        {/* Header */}
        <header className="bg-amber-600 text-white px-4 py-4 sticky top-0 z-10">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => setStep('menu')} className="p-1 hover:bg-amber-700 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">Finalizar Pedido</h1>
          </div>
        </header>

        <div className="max-w-lg mx-auto p-4 space-y-4 pb-32">
          {!restauranteAberto && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-700">Restaurante fechado no momento</p>
              <p className="text-xs text-red-500 mt-1">Voce pode consultar o cardapio, mas novos pedidos estao pausados.</p>
            </div>
          )}

          {/* Tipo */}
          <div className="bg-white rounded-2xl p-4">
            <h2 className="font-bold text-gray-800 mb-3">Como voce quer receber?</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['DELIVERY', 'RETIRADA'] as Tipo[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                    tipo === t
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'DELIVERY' ? '🛵 Delivery' : '🏃 Retirada'}
                </button>
              ))}
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Seus dados</h2>
              {dadosSalvos && (
                <button
                  onClick={() => {
                    setNome('');
                    setTelefone('');
                    setBairroId(null);
                    setRua('');
                    setDadosSalvos(false);
                    localStorage.removeItem(`cardapio:cliente:${slug}`);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Limpar dados salvos
                </button>
              )}
            </div>
            {dadosSalvos && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-green-700 font-medium">Seus dados foram carregados automaticamente</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nome *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                Telefone / WhatsApp *
                {buscandoCliente && <span className="ml-2 text-amber-500 normal-case font-normal">Buscando dados...</span>}
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                placeholder="(95) 99999-9999"
                type="tel"
                value={telefone}
                onChange={(e) => { setTelefone(e.target.value); setDadosSalvos(false); }}
                onBlur={(e) => buscarClientePorTelefone(e.target.value)}
              />
            </div>
            {tipo === 'DELIVERY' && usaBairros && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Bairro *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 bg-white"
                  value={bairroId ?? ''}
                  onChange={(e) => setBairroId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Selecione o bairro...</option>
                  {data?.bairros?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bairro} — {formatBRL(Number(b.taxa))}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tipo === 'DELIVERY' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                  Rua / Numero / Complemento{usaBairros ? ' (opcional)' : ' *'}
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Ex: Rua das Flores, 123, Apto 2"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Observacoes (opcional)</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 resize-none"
                placeholder="Alguma observacao para o pedido?"
                rows={2}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-2xl p-4">
            <h2 className="font-bold text-gray-800 mb-3">Resumo do pedido</h2>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.produto.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantidade}x {item.produto.nome}</span>
                  <span className="font-medium">{formatBRL(Number(item.produto.preco) * item.quantidade)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {tipo === 'DELIVERY' && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Taxa de entrega{bairroSelecionado ? ` — ${bairroSelecionado.bairro}` : ''}</span>
                  <span>{taxaEntrega > 0 ? formatBRL(taxaEntrega) : (usaBairros && !bairroId ? '—' : 'Grátis')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-amber-600">{formatBRL(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmit}
              disabled={enviando || !restauranteAberto}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
            >
              {!restauranteAberto ? (
                'Restaurante fechado'
              ) : enviando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Confirmar Pedido · {formatBRL(total)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tela do menu ────────────────────────────────────────────────────────


  // Agrupar categorias + semCategoria agrupado por categoria string
  const todasCategorias: { id: number | 'sem'; nome: string; produtos: ProdutoPublico[] }[] = [
    ...categorias.map((c) => ({ id: c.id as number | 'sem', nome: c.nome, produtos: c.produtos })),
  ];

  // Agrupar semCategoria por categoria string
  if (semCategoria.length > 0) {
    const byCategoria: Record<string, ProdutoPublico[]> = {};
    for (const p of semCategoria) {
      const key = p.categoria || 'Outros';
      if (!byCategoria[key]) byCategoria[key] = [];
      byCategoria[key].push(p);
    }
    for (const [nome, produtos] of Object.entries(byCategoria)) {
      // só adiciona se não existe categoria com mesmo nome
      if (!todasCategorias.find((c) => c.nome === nome)) {
        todasCategorias.push({ id: 'sem', nome, produtos });
      }
    }
  }

  const catAtivaObj = todasCategorias.find((c) => c.id === catAtiva) ?? todasCategorias[0];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-extrabold">{restaurante.nome}</h1>
          {restaurante.telefone && (
            <a
              href={`https://wa.me/55${restaurante.telefone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1 text-amber-100 text-sm hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {restaurante.telefone}
            </a>
          )}
          {lastPedido && (
            <div className="mt-4 rounded-2xl bg-white/15 border border-white/20 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-100 font-semibold">
                Ultimo pedido
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold">#{lastPedido.id}</p>
                  <p className="text-xs text-amber-100">
                    {lastPedido.tipoPedido === 'DELIVERY' ? 'Delivery' : 'Retirada'} de {lastPedido.clienteNome}
                  </p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    onClick={() => fetchHistoricoPedidos(lastPedido.clienteTelefone)}
                    className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white"
                  >
                    Historico
                  </button>
                  <button
                    onClick={() => {
                      setPedidoId(lastPedido.id);
                      setPedidoStatus(null);
                      setNome(lastPedido.clienteNome);
                      setTelefone(lastPedido.clienteTelefone);
                      setTipo(lastPedido.tipoPedido);
                      setStep('sucesso');
                    }}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-700"
                  >
                    Ver numero
                  </button>
                </div>
              </div>
              {historicoOpen && (
                <div className="mt-3 rounded-xl bg-white text-gray-900 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                    <span className="text-sm font-bold">Meus pedidos</span>
                    <button
                      onClick={() => setHistoricoOpen(false)}
                      className="text-xs font-bold text-gray-400"
                    >
                      Fechar
                    </button>
                  </div>
                  {historicoLoading ? (
                    <p className="px-3 py-4 text-sm text-gray-500">Carregando historico...</p>
                  ) : historicoErro ? (
                    <p className="px-3 py-4 text-sm text-red-600">{historicoErro}</p>
                  ) : historicoPedidos.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-gray-500">Nenhum pedido encontrado para este telefone.</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {historicoPedidos.map((pedido) => {
                        const statusAtual = pedido.statusPedido === 'CANCELADO'
                          ? 'CANCELADO'
                          : pedido.statusEntrega || 'RECEBIDO';
                        return (
                          <button
                            key={pedido.id}
                            onClick={() => {
                              setPedidoId(pedido.id);
                              setPedidoStatus(null);
                              setNome(lastPedido.clienteNome);
                              setTelefone(lastPedido.clienteTelefone);
                              setTipo(pedido.tipoPedido);
                              setStep('sucesso');
                            }}
                            className="w-full px-3 py-3 text-left hover:bg-amber-50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-extrabold">Pedido #{pedido.id}</p>
                                <p className="text-xs text-gray-500">
                                  {pedido.tipoPedido === 'DELIVERY' ? 'Delivery' : 'Retirada'} · {getStatusLabel(statusAtual as StatusEntregaPedido)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                                </p>
                              </div>
                              <span className="text-sm font-bold text-amber-700">
                                {formatBRL(Number(pedido.total))}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {!restauranteAberto && (
            <div className="mt-4 rounded-2xl border border-white/25 bg-black/20 p-3">
              <p className="text-sm font-extrabold text-white">Restaurante fechado no momento</p>
              <p className="text-xs text-amber-100 mt-1">
                O cardapio esta disponivel para consulta, mas novos pedidos estao pausados.
              </p>
            </div>
          )}
        </div>

        {/* Category tabs */}
        {todasCategorias.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-0 scrollbar-hide">
            {todasCategorias.map((cat) => (
              <button
                key={`${cat.id}-${cat.nome}`}
                onClick={() => setCatAtiva(cat.id)}
                className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                  catAtiva === cat.id
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Seletor de bairro para ver taxa */}
      {usaBairros && (
        <div className="bg-white border-b border-amber-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <span className="text-sm text-gray-500 shrink-0">Seu bairro:</span>
            <select
              className="flex-1 bg-transparent text-sm font-semibold text-gray-800 focus:outline-none"
              value={bairroId ?? ''}
              onChange={(e) => setBairroId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Selecione para ver a taxa...</option>
              {data?.bairros?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bairro} — {formatBRL(Number(b.taxa))}
                </option>
              ))}
            </select>
            {bairroSelecionado && (
              <span className="text-sm font-bold text-amber-600 shrink-0">
                + {formatBRL(Number(bairroSelecionado.taxa))}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Products */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {catAtivaObj && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">{catAtivaObj.nome}</h2>
            <div className="space-y-3">
              {catAtivaObj.produtos.map((produto) => {
                const qty = getQty(produto.id);
                return (
                  <div key={produto.id} className="bg-white rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                    {produto.urlImagem && (
                      <img
                        src={produto.urlImagem}
                        alt={produto.nome}
                        className="w-20 h-20 object-cover rounded-xl shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{produto.nome}</h3>
                      {produto.descricao && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{produto.descricao}</p>
                      )}
                      <p className="text-amber-600 font-bold mt-2">{formatBRL(Number(produto.preco))}</p>
                    </div>
                    <div className="shrink-0">
                      {qty === 0 ? (
                        <button
                          onClick={() => restauranteAberto && addItem(produto)}
                          disabled={!restauranteAberto}
                          className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors font-bold text-xl"
                        >
                          +
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeItem(produto.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors font-bold text-lg text-gray-700"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-bold text-gray-800 text-sm">{qty}</span>
                          <button
                            onClick={() => restauranteAberto && addItem(produto)}
                            disabled={!restauranteAberto}
                            className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {todasCategorias.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>Nenhum produto disponivel no momento</p>
          </div>
        )}
      </main>

      {/* Floating cart button */}
      {totalItens > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => restauranteAberto && setStep('checkout')}
              disabled={!restauranteAberto}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold text-base shadow-lg transition-colors flex items-center justify-between px-5"
            >
              <span className="bg-amber-600 rounded-lg px-2.5 py-0.5 text-sm font-bold">
                {totalItens}
              </span>
              <span>{restauranteAberto ? 'Ver carrinho' : 'Restaurante fechado'}</span>
              <span>{formatBRL(subtotal)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
