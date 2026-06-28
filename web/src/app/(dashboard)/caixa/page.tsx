'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { StatusMesa } from '@cafecontrol/shared';
import type { Mesa, Pedido } from '@cafecontrol/shared';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDateTime = (date: string | Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', icon: '📱' },
  { id: 'credito', label: 'Credito', icon: '💳' },
  { id: 'debito', label: 'Debito', icon: '💳' },
  { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
];

interface CaixaData {
  id: number;
  operadorId: number;
  valorInicial: number;
  valorFinal: number | null;
  totalVendas: number | null;
  aberturaEm: string;
  fechamentoEm: string | null;
  observacao: string | null;
  aberto: boolean;
  operador: { id: number; nome: string };
  movimentacoes: Array<{
    id: number;
    tipo: 'SANGRIA' | 'SUPRIMENTO';
    valor: number;
    descricao: string;
    criadoEm: string;
  }>;
}

function normalizeCaixa(caixa: CaixaData): CaixaData {
  return {
    ...caixa,
    movimentacoes: caixa.movimentacoes || [],
  };
}

interface MesaComPedido extends Mesa {
  pedidoAtivo?: Pedido;
}

type Tab = 'operacao' | 'historico';

export default function CaixaPage() {
  const [tab, setTab] = useState<Tab>('operacao');
  const [caixaAtual, setCaixaAtual] = useState<CaixaData | null>(null);
  const [historicoCaixas, setHistoricoCaixas] = useState<CaixaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Abertura
  const [valorInicial, setValorInicial] = useState('');
  const [obsAbertura, setObsAbertura] = useState('');
  const [abrindo, setAbrindo] = useState(false);

  // Fechamento
  const [confirmFechamento, setConfirmFechamento] = useState(false);
  const [fechando, setFechando] = useState(false);

  // Movimentações
  const [modalMov, setModalMov] = useState(false);
  const [tipoMov, setTipoMov] = useState<'SANGRIA' | 'SUPRIMENTO'>('SANGRIA');
  const [valorMov, setValorMov] = useState('');
  const [descMov, setDescMov] = useState('');
  const [salvandoMov, setSalvandoMov] = useState(false);

  // Fechar conta mesa
  const [mesas, setMesas] = useState<MesaComPedido[]>([]);
  const [selectedMesa, setSelectedMesa] = useState<MesaComPedido | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // Pedidos pagos
  const [pedidosPagos, setPedidosPagos] = useState<Pedido[]>([]);

  const fetchCaixaAtual = useCallback(async () => {
    try {
      const data = await api.get<CaixaData | null>('/caixa/atual');
      setCaixaAtual(data ? normalizeCaixa(data) : null);
    } catch {
      setCaixaAtual(null);
    }
  }, []);

  const fetchMesas = useCallback(async () => {
    try {
      const allMesas = await api.get<MesaComPedido[]>('/mesas');
      setMesas(allMesas.filter(
        (m) => m.status === StatusMesa.OCUPADA || m.status === StatusMesa.AGUARDANDO_CONTA
      ));
    } catch {}
  }, []);

  const fetchPedidosPagos = useCallback(async () => {
    try {
      const data = await api.get<Pedido[]>('/pedidos?status=PAGO');
      setPedidosPagos(data);
    } catch {}
  }, []);

  const fetchHistorico = useCallback(async () => {
    try {
      const data = await api.get<CaixaData[]>('/caixa/historico');
      setHistoricoCaixas(data);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchCaixaAtual(), fetchMesas(), fetchPedidosPagos()]).finally(() => setIsLoading(false));
  }, [fetchCaixaAtual, fetchMesas]);

  useEffect(() => {
    if (tab === 'historico') fetchHistorico();
  }, [tab, fetchHistorico]);

  async function handleAbrirCaixa() {
    const valor = parseFloat(valorInicial);
    if (isNaN(valor) || valor < 0) {
      toast.error('Informe um valor inicial valido');
      return;
    }
    setAbrindo(true);
    try {
      const caixa = await api.post<CaixaData>('/caixa/abrir', {
        valorInicial: valor,
        observacao: obsAbertura || undefined,
      });
      setCaixaAtual(normalizeCaixa(caixa));
      setValorInicial('');
      setObsAbertura('');
      toast.success('Caixa aberto com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao abrir caixa');
    } finally {
      setAbrindo(false);
    }
  }

  async function handleFecharCaixa() {
    if (!caixaAtual) return;
    setFechando(true);
    try {
      const caixa = await api.patch<CaixaData>(`/caixa/${caixaAtual.id}/fechar`);
      setCaixaAtual(null);
      setConfirmFechamento(false);
      toast.success(
        `Caixa fechado! Total vendas: ${formatBRL(Number(caixa.totalVendas || 0))} | Valor final: ${formatBRL(Number(caixa.valorFinal || 0))}`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fechar caixa');
    } finally {
      setFechando(false);
    }
  }

  async function handleMovimentacao() {
    if (!caixaAtual) return;
    const valor = parseFloat(valorMov);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor valido');
      return;
    }
    if (!descMov.trim()) {
      toast.error('Informe uma descricao');
      return;
    }
    setSalvandoMov(true);
    try {
      await api.post(`/caixa/${caixaAtual.id}/movimentacao`, {
        tipo: tipoMov,
        valor,
        descricao: descMov,
      });
      toast.success(`${tipoMov === 'SANGRIA' ? 'Sangria' : 'Suprimento'} registrado!`);
      setModalMov(false);
      setValorMov('');
      setDescMov('');
      fetchCaixaAtual();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar movimentacao');
    } finally {
      setSalvandoMov(false);
    }
  }

  async function handleMesaSelect(mesa: MesaComPedido) {
    try {
      const detalhes = await api.get<any>(`/mesas/${mesa.id}`);
      const pedidoAtivo = detalhes.pedidos?.[0] || undefined;
      setSelectedMesa({ ...detalhes, pedidoAtivo });
    } catch {
      toast.error('Erro ao carregar detalhes da mesa');
    }
  }

  function calcTotal(): number {
    if (!selectedMesa?.pedidoAtivo?.itens) return 0;
    return (selectedMesa.pedidoAtivo.itens as any[]).reduce(
      (sum: number, item: any) => sum + Number(item.precoUnitario) * item.quantidade, 0
    );
  }

  async function confirmFecharConta() {
    if (!selectedMesa?.pedidoAtivo) return;
    setClosing(true);
    try {
      await api.patch(`/pedidos/${selectedMesa.pedidoAtivo.id}/fechar`);
      toast.success(`Conta da Mesa ${selectedMesa.numero} fechada!`);
      setConfirmModalOpen(false);
      setSelectedMesa(null);
      fetchMesas();
      fetchPedidosPagos();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fechar conta');
    } finally {
      setClosing(false);
    }
  }

  const totalSangrias = caixaAtual?.movimentacoes
    ?.filter((m) => m.tipo === 'SANGRIA')
    .reduce((sum, m) => sum + Number(m.valor), 0) || 0;

  const totalSuprimentos = caixaAtual?.movimentacoes
    ?.filter((m) => m.tipo === 'SUPRIMENTO')
    .reduce((sum, m) => sum + Number(m.valor), 0) || 0;

  const faturamento = pedidosPagos.reduce((sum, p) => {
    const total = (p.itens || []).reduce((s: number, i: any) => s + Number(i.precoUnitario) * i.quantidade, 0);
    return sum + (Number(p.total) || total);
  }, 0);

  const valorEmCaixa = Number(caixaAtual?.valorInicial || 0) + faturamento + totalSuprimentos - totalSangrias;

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Caixa</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('operacao')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'operacao' ? 'bg-white text-cafe-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            Operacao
          </button>
          <button
            onClick={() => setTab('historico')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'historico' ? 'bg-white text-cafe-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            Historico
          </button>
        </div>
      </div>

      {tab === 'operacao' && (
        <>
          {/* Caixa não aberto */}
          {!caixaAtual && (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Caixa Fechado</h2>
                <p className="text-sm text-gray-500 mb-6">Abra o caixa para iniciar as operacoes do dia</p>

                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Inicial (fundo de troco)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={valorInicial}
                      onChange={(e) => setValorInicial(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observacao (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Turno da manha"
                      value={obsAbertura}
                      onChange={(e) => setObsAbertura(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
                    />
                  </div>
                  <Button variant="primary" size="lg" className="w-full" loading={abrindo} onClick={handleAbrirCaixa}>
                    Abrir Caixa
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Caixa aberto */}
          {caixaAtual && (
            <div>
              {/* Status do caixa */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-bold text-gray-900">Caixa Aberto</span>
                    <Badge variant="green">#{caixaAtual.id}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setTipoMov('SUPRIMENTO'); setModalMov(true); }}>
                      + Suprimento
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setTipoMov('SANGRIA'); setModalMov(true); }}>
                      - Sangria
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmFechamento(true)}>
                      Fechar Caixa
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Abertura</p>
                    <p className="text-sm font-medium text-gray-800">{formatDateTime(caixaAtual.aberturaEm)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Valor Inicial</p>
                    <p className="text-sm font-bold text-gray-900">{formatBRL(Number(caixaAtual.valorInicial))}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Faturamento</p>
                    <p className="text-sm font-bold text-green-700">{formatBRL(faturamento)}</p>
                    <p className="text-xs text-green-500">{pedidosPagos.length} pedidos</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600">Suprimentos</p>
                    <p className="text-sm font-bold text-blue-700">+ {formatBRL(totalSuprimentos)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-600">Sangrias</p>
                    <p className="text-sm font-bold text-red-700">- {formatBRL(totalSangrias)}</p>
                  </div>
                  <div className="bg-cafe-50 rounded-lg p-3 border border-cafe-200">
                    <p className="text-xs text-cafe-600">Valor em Caixa</p>
                    <p className="text-lg font-bold text-cafe-800">{formatBRL(valorEmCaixa)}</p>
                  </div>
                </div>

                {/* Movimentações recentes */}
                {(caixaAtual.movimentacoes || []).length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Movimentacoes</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(caixaAtual.movimentacoes || []).map((mov) => (
                        <div key={mov.id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">
                            <Badge variant={mov.tipo === 'SANGRIA' ? 'red' : 'green'}>
                              {mov.tipo === 'SANGRIA' ? 'Sangria' : 'Suprimento'}
                            </Badge>
                            <span className="ml-2">{mov.descricao}</span>
                          </span>
                          <span className={`font-medium ${mov.tipo === 'SANGRIA' ? 'text-red-600' : 'text-green-600'}`}>
                            {mov.tipo === 'SANGRIA' ? '-' : '+'} {formatBRL(Number(mov.valor))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {caixaAtual.observacao && (
                  <p className="mt-3 text-xs text-gray-400 italic">Obs: {caixaAtual.observacao}</p>
                )}
              </div>

              {/* Mesas para fechar conta */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Mesas com conta aberta</h2>
                  {mesas.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
                      Nenhuma mesa com conta aberta
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mesas.map((mesa) => (
                        <button
                          key={mesa.id}
                          onClick={() => handleMesaSelect(mesa)}
                          className={`w-full bg-white rounded-xl border-2 p-4 text-left transition-all ${
                            selectedMesa?.id === mesa.id ? 'border-cafe-700 shadow-md' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-gray-800">Mesa {mesa.numero}</div>
                            <Badge variant={mesa.status === StatusMesa.AGUARDANDO_CONTA ? 'yellow' : 'red'}>
                              {mesa.status === StatusMesa.AGUARDANDO_CONTA ? 'Aguardando' : 'Ocupada'}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  {selectedMesa?.pedidoAtivo ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-cafe-700 text-white px-6 py-4">
                        <h2 className="text-lg font-bold">Mesa {selectedMesa.numero} - Conta</h2>
                        <p className="text-cafe-200 text-sm">Pedido #{selectedMesa.pedidoAtivo.id}</p>
                      </div>

                      <div className="p-6">
                        <div className="space-y-2 mb-6">
                          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase pb-2 border-b">
                            <div className="col-span-1">Qtd</div>
                            <div className="col-span-6">Item</div>
                            <div className="col-span-2 text-right">Unit.</div>
                            <div className="col-span-3 text-right">Subtotal</div>
                          </div>
                          {(selectedMesa.pedidoAtivo.itens as any[])?.map((item: any) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 py-2 border-b border-gray-50 text-sm">
                              <div className="col-span-1 font-medium">{item.quantidade}x</div>
                              <div className="col-span-6 text-gray-800">
                                {item.produto?.nome ?? `#${item.produtoId}`}
                                {item.observacao && <span className="block text-xs text-gray-500 italic">{item.observacao}</span>}
                              </div>
                              <div className="col-span-2 text-right text-gray-600">{formatBRL(Number(item.precoUnitario))}</div>
                              <div className="col-span-3 text-right font-medium">{formatBRL(Number(item.precoUnitario) * item.quantidade)}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between py-4 border-t-2 border-gray-200">
                          <span className="text-xl font-bold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-cafe-700">{formatBRL(calcTotal())}</span>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Forma de pagamento</h3>
                          <div className="grid grid-cols-4 gap-2">
                            {PAYMENT_METHODS.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setPaymentMethod(m.id)}
                                className={`p-3 rounded-lg border-2 text-center transition-all ${
                                  paymentMethod === m.id ? 'border-cafe-700 bg-cafe-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="text-2xl mb-1">{m.icon}</div>
                                <div className="text-xs font-medium text-gray-700">{m.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6">
                          <Button size="lg" className="w-full" onClick={() => setConfirmModalOpen(true)}>
                            Fechar Conta - {formatBRL(calcTotal())}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                      Selecione uma mesa para ver a conta
                    </div>
                  )}
                </div>
              </div>

              {/* Pedidos Pagos */}
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Pedidos Pagos</h2>
                {pedidosPagos.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
                    Nenhum pedido pago ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pedidosPagos.map((pedido) => {
                      const total = (pedido.itens || []).reduce(
                        (s: number, i: any) => s + Number(i.precoUnitario) * i.quantidade, 0
                      );
                      return (
                        <div key={pedido.id} className="bg-white rounded-xl border border-gray-200 p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-800">Mesa {pedido.mesa?.numero}</span>
                              <Badge variant="green">Pago</Badge>
                              {pedido.clienteNome && (
                                <span className="text-sm text-gray-500">{pedido.clienteNome}</span>
                              )}
                            </div>
                            <span className="text-lg font-bold text-green-600">{formatBRL(Number(pedido.total || total))}</span>
                          </div>
                          <div className="space-y-1">
                            {(pedido.itens || []).map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                                <span className="text-gray-600">
                                  {item.quantidade}x {item.produto?.nome ?? `#${item.produtoId}`}
                                </span>
                                <span className="font-medium text-gray-800">
                                  {formatBRL(Number(item.precoUnitario) * item.quantidade)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-3 text-xs text-gray-400">
                            <span>Pedido #{pedido.id} - Garcom: {pedido.garcom?.nome ?? '---'}</span>
                            <span>{formatDateTime(pedido.dataCriacao)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'historico' && (
        <div>
          {historicoCaixas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              Nenhum caixa fechado encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {historicoCaixas.map((caixa) => {
                const sangrias = caixa.movimentacoes?.filter((m) => m.tipo === 'SANGRIA').reduce((s, m) => s + Number(m.valor), 0) || 0;
                const suprimentos = caixa.movimentacoes?.filter((m) => m.tipo === 'SUPRIMENTO').reduce((s, m) => s + Number(m.valor), 0) || 0;

                return (
                  <div key={caixa.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="gray">#{caixa.id}</Badge>
                        <span className="font-semibold text-gray-800">Operador: {caixa.operador.nome}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Abertura</p>
                        <p className="font-medium">{formatDateTime(caixa.aberturaEm)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fechamento</p>
                        <p className="font-medium">{caixa.fechamentoEm ? formatDateTime(caixa.fechamentoEm) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valor Inicial</p>
                        <p className="font-medium">{formatBRL(Number(caixa.valorInicial))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Vendas</p>
                        <p className="font-bold text-green-600">{formatBRL(Number(caixa.totalVendas || 0))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valor Final</p>
                        <p className="font-bold text-cafe-700">{formatBRL(Number(caixa.valorFinal || 0))}</p>
                      </div>
                    </div>
                    {(sangrias > 0 || suprimentos > 0) && (
                      <div className="mt-2 flex gap-4 text-xs text-gray-500">
                        {suprimentos > 0 && <span className="text-green-600">Suprimentos: +{formatBRL(suprimentos)}</span>}
                        {sangrias > 0 && <span className="text-red-600">Sangrias: -{formatBRL(sangrias)}</span>}
                      </div>
                    )}
                    {caixa.observacao && <p className="mt-2 text-xs text-gray-400 italic">Obs: {caixa.observacao}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Movimentação */}
      <Modal isOpen={modalMov} onClose={() => setModalMov(false)} title={tipoMov === 'SANGRIA' ? 'Registrar Sangria' : 'Registrar Suprimento'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={valorMov}
              onChange={(e) => setValorMov(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
            <input
              type="text"
              placeholder={tipoMov === 'SANGRIA' ? 'Ex: Pagamento fornecedor' : 'Ex: Troco adicional'}
              value={descMov}
              onChange={(e) => setDescMov(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalMov(false)}>Cancelar</Button>
            <Button variant={tipoMov === 'SANGRIA' ? 'danger' : 'primary'} loading={salvandoMov} onClick={handleMovimentacao}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Fechamento de Caixa */}
      <Modal isOpen={confirmFechamento} onClose={() => setConfirmFechamento(false)} title="Fechar Caixa">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Deseja fechar o caixa atual? O sistema vai calcular automaticamente o total de vendas do periodo.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Valor Inicial</span><span className="font-medium">{formatBRL(Number(caixaAtual?.valorInicial || 0))}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Suprimentos</span><span className="font-medium text-green-600">+ {formatBRL(totalSuprimentos)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Sangrias</span><span className="font-medium text-red-600">- {formatBRL(totalSangrias)}</span></div>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => setConfirmFechamento(false)}>Cancelar</Button>
            <Button variant="danger" loading={fechando} onClick={handleFecharCaixa}>Fechar Caixa</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmar Fechar Conta */}
      <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirmar Fechamento">
        <div className="text-center">
          <p className="text-gray-700 mb-2">
            Mesa <span className="font-bold">{selectedMesa?.numero}</span>
          </p>
          <p className="text-2xl font-bold text-cafe-700 mb-2">{formatBRL(calcTotal())}</p>
          <p className="text-sm text-gray-500 mb-6">
            Pagamento via <span className="font-medium">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
            <Button onClick={confirmFecharConta} loading={closing}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
