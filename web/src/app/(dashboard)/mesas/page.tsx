'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { useSocket } from '@/providers/SocketProvider';
import { SOCKET_EVENTS, StatusMesa } from '@cafecontrol/shared';
import type { Mesa, Pedido, MesaStatusChangedPayload } from '@cafecontrol/shared';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const statusColor: Record<StatusMesa, string> = {
  [StatusMesa.LIVRE]: 'bg-green-500',
  [StatusMesa.OCUPADA]: 'bg-red-500',
  [StatusMesa.AGUARDANDO_CONTA]: 'bg-yellow-500',
};

const statusLabel: Record<StatusMesa, string> = {
  [StatusMesa.LIVRE]: 'Livre',
  [StatusMesa.OCUPADA]: 'Ocupada',
  [StatusMesa.AGUARDANDO_CONTA]: 'Aguardando Conta',
};

const statusBadgeVariant: Record<StatusMesa, 'green' | 'red' | 'yellow'> = {
  [StatusMesa.LIVRE]: 'green',
  [StatusMesa.OCUPADA]: 'red',
  [StatusMesa.AGUARDANDO_CONTA]: 'yellow',
};

interface MesaComPedidos extends Mesa {
  pedidos?: Array<Pedido & { garcom?: { id: number; nome: string } }>;
}

interface MesaDetalhes extends Mesa {
  pedidoAtivo?: Pedido;
}

export default function MesasPage() {
  const [mesas, setMesas] = useState<MesaComPedidos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState<MesaDetalhes | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [criandoPedido, setCriandoPedido] = useState(false);

  // Estado para adicionar itens
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [carrinho, setCarrinho] = useState<Array<{ produtoId: number; nome: string; preco: number; quantidade: number; observacao: string }>>([]);
  const [pedidoAberto, setPedidoAberto] = useState<Pedido | null>(null);
  const [enviandoItens, setEnviandoItens] = useState(false);
  const [modalFecharConta, setModalFecharConta] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [fechandoConta, setFechandoConta] = useState(false);

  const { socket } = useSocket();

  const fetchMesas = useCallback(async () => {
    try {
      const data = await api.get<MesaComPedidos[]>('/mesas');
      setMesas(data);
    } catch {
      toast.error('Erro ao carregar mesas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    function handleMesaChanged(payload: MesaStatusChangedPayload) {
      setMesas((prev) =>
        prev.map((m) =>
          m.id === payload.mesaId
            ? { ...m, status: payload.novoStatus }
            : m
        )
      );
    }

    socket.on(SOCKET_EVENTS.MESA_STATUS_CHANGED, handleMesaChanged);
    return () => {
      socket.off(SOCKET_EVENTS.MESA_STATUS_CHANGED, handleMesaChanged);
    };
  }, [socket]);

  async function handleMesaClick(mesa: MesaComPedidos) {
    if (mesa.status === StatusMesa.LIVRE) {
      // Mesa livre: abrir painel para criar pedido
      setSelectedMesa({ ...mesa, pedidoAtivo: undefined });
      setCarrinho([]);
      setPedidoAberto(null);
      setSlideOverOpen(true);

      // Carregar produtos se ainda não carregou
      if (produtos.length === 0) {
        try {
          const data = await api.get<any[]>('/produtos?disponivel=true');
          setProdutos(data);
          const categorias = [...new Set(data.map((p: any) => p.categoria))];
          if (categorias.length > 0) setCategoriaAtiva(categorias[0] as string);
        } catch {
          toast.error('Erro ao carregar produtos');
        }
      }
      return;
    }

    // Mesa ocupada/aguardando: mostrar detalhes do pedido
    try {
      const detalhes = await api.get<any>(`/mesas/${mesa.id}`);
      const pedidoAtivo = detalhes.pedidos?.[0] || undefined;
      setSelectedMesa({ ...detalhes, pedidoAtivo });
      setCarrinho([]);
      setPedidoAberto(pedidoAtivo || null);
      setSlideOverOpen(true);

      // Carregar produtos para poder adicionar mais itens
      if (produtos.length === 0) {
        try {
          const data = await api.get<any[]>('/produtos?disponivel=true');
          setProdutos(data);
          const categorias = [...new Set(data.map((p: any) => p.categoria))];
          if (categorias.length > 0) setCategoriaAtiva(categorias[0] as string);
        } catch {}
      }
    } catch {
      toast.error('Erro ao carregar detalhes da mesa');
    }
  }

  async function handleCriarPedidoEEnviar() {
    if (!selectedMesa || carrinho.length === 0) return;
    setEnviandoItens(true);

    try {
      let pedido = pedidoAberto;

      // Se mesa livre, criar pedido primeiro
      if (!pedido) {
        pedido = await api.post<Pedido>('/pedidos', { mesaId: selectedMesa.id });
        setPedidoAberto(pedido);
        toast.success(`Pedido #${pedido.id} aberto na Mesa ${selectedMesa.numero}`);
      }

      // Enviar itens
      await api.post(`/pedidos/${pedido.id}/itens`, {
        itens: carrinho.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          observacao: item.observacao || null,
        })),
      });

      toast.success(`${carrinho.length} item(ns) enviado(s) para a cozinha!`);
      setCarrinho([]);
      setSlideOverOpen(false);
      fetchMesas();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar pedido');
    } finally {
      setEnviandoItens(false);
    }
  }

  async function handleFecharConta() {
    if (!pedidoAberto || !formaPagamento) return;
    setFechandoConta(true);
    try {
      await api.patch(`/pedidos/${pedidoAberto.id}/fechar`);
      toast.success(`Conta da Mesa ${selectedMesa?.numero} fechada — ${formaPagamento}`);
      setModalFecharConta(false);
      setSlideOverOpen(false);
      setFormaPagamento('');
      setPedidoAberto(null);
      fetchMesas();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fechar conta');
    } finally {
      setFechandoConta(false);
    }
  }

  function adicionarAoCarrinho(produto: any) {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.produtoId === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.produtoId === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { produtoId: produto.id, nome: produto.nome, preco: Number(produto.preco), quantidade: 1, observacao: '' }];
    });
  }

  function removerDoCarrinho(produtoId: number) {
    setCarrinho((prev) => prev.filter((i) => i.produtoId !== produtoId));
  }

  function alterarQuantidade(produtoId: number, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((i) =>
          i.produtoId === produtoId
            ? { ...i, quantidade: Math.max(0, i.quantidade + delta) }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }

  function alterarObservacao(produtoId: number, obs: string) {
    setCarrinho((prev) =>
      prev.map((i) =>
        i.produtoId === produtoId ? { ...i, observacao: obs } : i
      )
    );
  }

  const categorias = [...new Set(produtos.map((p) => p.categoria))];
  const produtosFiltrados = categoriaAtiva
    ? produtos.filter((p) => p.categoria === categoriaAtiva)
    : produtos;

  const totalCarrinho = carrinho.reduce((sum, i) => sum + i.preco * i.quantidade, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
        <Button variant="secondary" onClick={fetchMesas}>
          Atualizar
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 mb-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Livre — clique para abrir pedido</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Ocupada</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Aguardando Conta</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              onClick={() => handleMesaClick(mesa)}
              className={`
                relative bg-white rounded-xl border-2 p-6 text-center cursor-pointer
                transition-all duration-200 hover:shadow-md
                ${mesa.status === StatusMesa.LIVRE
                  ? 'border-green-300 hover:border-green-500 hover:bg-green-50'
                  : mesa.status === StatusMesa.OCUPADA
                  ? 'border-red-300 hover:border-red-400'
                  : 'border-yellow-300 hover:border-yellow-400'
                }
              `}
            >
              {/* Status indicator dot */}
              <div
                className={`absolute top-3 right-3 w-3 h-3 rounded-full ${statusColor[mesa.status]}`}
              />

              <div className="text-3xl font-bold text-gray-800 mb-2">
                {mesa.numero}
              </div>
              <Badge variant={statusBadgeVariant[mesa.status]}>
                {statusLabel[mesa.status]}
              </Badge>
              {mesa.status === StatusMesa.LIVRE && (
                <p className="text-xs text-green-600 mt-2 font-medium">Clique para abrir pedido</p>
              )}
              {mesa.pedidos && mesa.pedidos[0]?.garcom && (
                <p className="text-xs text-gray-500 mt-1">{mesa.pedidos[0].garcom.nome}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Slide-over panel */}
      {slideOverOpen && selectedMesa && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSlideOverOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto flex flex-col" style={{ maxHeight: '100vh' }}>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Mesa {selectedMesa.numero}
                  {selectedMesa.status === StatusMesa.LIVRE
                    ? ' — Novo Pedido'
                    : pedidoAberto
                    ? ` — Pedido #${pedidoAberto.id}`
                    : ''}
                </h2>
                <button
                  onClick={() => setSlideOverOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Itens existentes do pedido */}
              {pedidoAberto?.itens && pedidoAberto.itens.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Itens já enviados</h3>
                  <div className="space-y-1">
                    {pedidoAberto.itens.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                        <span className="text-gray-700">
                          {item.quantidade}x {item.produto?.nome || `#${item.produtoId}`}
                          {item.observacao && <span className="text-gray-400 italic ml-1">({item.observacao})</span>}
                        </span>
                        <span className="text-gray-500">{formatBRL(Number(item.precoUnitario) * item.quantidade)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-300 font-bold text-gray-900">
                    <span>Total da conta</span>
                    <span>
                      {formatBRL(
                        pedidoAberto.itens.reduce(
                          (sum: number, item: any) => sum + Number(item.precoUnitario) * item.quantidade,
                          0
                        )
                      )}
                    </span>
                  </div>

                  {/* Botão Fechar Conta */}
                  <Button
                    variant="danger"
                    size="md"
                    className="w-full mt-3"
                    onClick={() => { setFormaPagamento(''); setModalFecharConta(true); }}
                  >
                    Fechar Conta
                  </Button>
                </div>
              )}

              {/* Catalogo de produtos */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Adicionar itens</h3>
                {/* Categorias */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                  {categorias.map((cat) => (
                    <button
                      key={cat as string}
                      onClick={() => setCategoriaAtiva(cat as string)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        categoriaAtiva === cat
                          ? 'bg-cafe-700 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat as string}
                    </button>
                  ))}
                </div>

                {/* Grid de produtos */}
                <div className="grid grid-cols-2 gap-2">
                  {produtosFiltrados.map((produto: any) => {
                    const noCarrinho = carrinho.find((i) => i.produtoId === produto.id);
                    return (
                      <button
                        key={produto.id}
                        onClick={() => adicionarAoCarrinho(produto)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          noCarrinho
                            ? 'border-cafe-500 bg-cafe-50'
                            : 'border-gray-200 hover:border-cafe-300 hover:bg-gray-50'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">{produto.nome}</p>
                        <p className="text-xs text-gray-500">{formatBRL(Number(produto.preco))}</p>
                        {noCarrinho && (
                          <span className="inline-block mt-1 text-xs font-bold text-cafe-700">
                            {noCarrinho.quantidade}x no carrinho
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carrinho */}
              {carrinho.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                    Carrinho ({carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'})
                  </h3>
                  <div className="space-y-3">
                    {carrinho.map((item) => (
                      <div key={item.produtoId} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">{item.nome}</span>
                          <button
                            onClick={() => removerDoCarrinho(item.produtoId)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remover
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => alterarQuantidade(item.produtoId, -1)}
                              className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantidade}</span>
                            <button
                              onClick={() => alterarQuantidade(item.produtoId, 1)}
                              className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {formatBRL(item.preco * item.quantidade)}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Observação (ex: sem açúcar)"
                          value={item.observacao}
                          onChange={(e) => alterarObservacao(item.produtoId, e.target.value)}
                          className="mt-2 w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cafe-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixo com total e botão */}
            {carrinho.length > 0 && (
              <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatBRL(totalCarrinho)}</span>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={enviandoItens}
                  onClick={handleCriarPedidoEEnviar}
                >
                  Enviar para Cozinha ({carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Fechar Conta */}
      {modalFecharConta && pedidoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalFecharConta(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Fechar Conta</h3>
            <p className="text-sm text-gray-500 mb-4">
              Mesa {selectedMesa?.numero} — Pedido #{pedidoAberto.id}
            </p>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatBRL(
                    pedidoAberto.itens?.reduce(
                      (sum: number, item: any) => sum + Number(item.precoUnitario) * item.quantidade,
                      0
                    ) ?? 0
                  )}
                </span>
              </div>
            </div>

            {/* Forma de pagamento */}
            <p className="text-sm font-semibold text-gray-700 mb-2">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['PIX', 'Crédito', 'Débito', 'Dinheiro'].map((forma) => (
                <button
                  key={forma}
                  onClick={() => setFormaPagamento(forma)}
                  className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                    formaPagamento === forma
                      ? 'border-cafe-700 bg-cafe-50 text-cafe-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {forma}
                </button>
              ))}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setModalFecharConta(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={fechandoConta}
                onClick={handleFecharConta}
                disabled={!formaPagamento}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
