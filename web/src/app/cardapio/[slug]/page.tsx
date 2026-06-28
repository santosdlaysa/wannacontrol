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

interface CardapioData {
  restaurante: Restaurante;
  configuracoes: Record<string, string | null>;
  categorias: CategoriaPublica[];
  semCategoria: (ProdutoPublico & { categoria: string })[];
}

interface CartItem {
  produto: ProdutoPublico;
  quantidade: number;
  observacao: string;
}

type Tipo = 'DELIVERY' | 'RETIRADA';
type Step = 'menu' | 'checkout' | 'sucesso';

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
  const [enviando, setEnviando] = useState(false);

  // Checkout form
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipo, setTipo] = useState<Tipo>('DELIVERY');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');

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
  const taxaEntrega = tipo === 'DELIVERY' ? Number(data?.configuracoes?.taxa_entrega ?? 0) : 0;
  const total = subtotal + taxaEntrega;

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!nome.trim() || !telefone.trim()) {
      alert('Preencha seu nome e telefone');
      return;
    }
    if (tipo === 'DELIVERY' && !endereco.trim()) {
      alert('Preencha o endereço de entrega');
      return;
    }
    if (cart.length === 0) {
      alert('Adicione pelo menos um item');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${BASE}/public/${slug}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: nome.trim(),
          clienteTelefone: telefone.trim(),
          tipoPedido: tipo,
          enderecoEntrega: tipo === 'DELIVERY' ? endereco.trim() : null,
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
      setPedidoId(pedido.id);
      setCart([]);
      setStep('sucesso');
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar pedido. Tente novamente.');
    } finally {
      setEnviando(false);
    }
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
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido Recebido!</h2>
          <p className="text-gray-500 mb-1">Pedido <span className="font-bold text-amber-600">#{pedidoId}</span></p>
          <p className="text-gray-500 mb-6">
            {tipo === 'DELIVERY'
              ? 'Seu pedido foi recebido e estará a caminho em breve.'
              : 'Seu pedido foi recebido. Aguarde a confirmação para retirada.'}
          </p>
          {restaurante.telefone && (
            <a
              href={`https://wa.me/55${restaurante.telefone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Falar no WhatsApp
            </a>
          )}
          <button
            onClick={() => { setStep('menu'); setNome(''); setTelefone(''); setEndereco(''); setObs(''); }}
            className="block w-full text-center text-amber-600 font-medium hover:text-amber-800 transition-colors"
          >
            Fazer outro pedido
          </button>
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
            <h2 className="font-bold text-gray-800">Seus dados</h2>
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
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Telefone / WhatsApp *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                placeholder="(95) 99999-9999"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            {tipo === 'DELIVERY' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Endereco de Entrega *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Rua, numero, bairro..."
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
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
                  <span>Taxa de entrega</span>
                  <span>{taxaEntrega > 0 ? formatBRL(taxaEntrega) : 'Grátis'}</span>
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
              disabled={enviando}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
            >
              {enviando ? (
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
                          onClick={() => addItem(produto)}
                          className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors font-bold text-xl"
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
                            onClick={() => addItem(produto)}
                            className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors font-bold text-lg"
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
              onClick={() => setStep('checkout')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg transition-colors flex items-center justify-between px-5"
            >
              <span className="bg-amber-600 rounded-lg px-2.5 py-0.5 text-sm font-bold">
                {totalItens}
              </span>
              <span>Ver carrinho</span>
              <span>{formatBRL(subtotal)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
