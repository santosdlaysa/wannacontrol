'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import primeiroQr from '@/assets/pix basico.png';
import segundoQr from '@/assets/segundo.png';
import terceiroQr from '@/assets/terceiro.png';

const PIX_ESTATICO: Record<string, { imagem: typeof segundoQr; codigo: string }> = {
  INICIAL: {
    imagem: primeiroQr,
    codigo: '00020126360014BR.GOV.BCB.PIX0114+5595981273912520400005303986540575.005802BR5901N6001C62070503***630487B8',
  },
  PROFISSIONAL: {
    imagem: segundoQr,
    codigo: '00020126360014BR.GOV.BCB.PIX0114+55959812739125204000053039865406200.005802BR5901N6001C62070503***63040382',
  },
  PREMIUM: {
    imagem: terceiroQr,
    codigo: '00020126360014BR.GOV.BCB.PIX0114+55959812739125204000053039865406597.005802BR5901N6001C62070503***6304B8F3',
  },
};

interface PlanoAssinatura {
  id: 'INICIAL' | 'PROFISSIONAL' | 'PREMIUM';
  nome: string;
  descricao: string;
  valor: number;
  planoSistema: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';
  recursos: string[];
}

interface PixResponse {
  modo: 'automatico' | 'manual';
  id?: number;
  status?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  solicitacaoId?: number;
  plano: PlanoAssinatura;
}

interface CartaoCheckout {
  initPoint?: string;
  sandboxInitPoint?: string;
}

const statusLabel: Record<string, string> = {
  pending: 'Aguardando pagamento',
  approved: 'Pagamento aprovado',
  rejected: 'Pagamento recusado',
  cancelled: 'Pagamento cancelado',
};

const ORDEM_PLANOS: Record<string, number> = {
  BASICO: 0,
  PROFISSIONAL: 1,
  ENTERPRISE: 2,
};

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AssinaturaPage() {
  const { restaurante } = useAuth();
  const searchParams = useSearchParams();
  const planoParam = searchParams.get('plano');
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<PlanoAssinatura | null>(null);
  const [email, setEmail] = useState(restaurante?.email || '');
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao' | null>(null);
  const [pix, setPix] = useState<PixResponse | null>(null);
  const [pixStatus, setPixStatus] = useState('');
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [gerandoCartao, setGerandoCartao] = useState(false);
  const [consultando, setConsultando] = useState(false);

  const statusParam = searchParams.get('status');

  useEffect(() => {
    if (statusParam === 'approved') {
      toast.success('Pagamento aprovado! Ativando plano...');
      const storedRestaurante = localStorage.getItem('restaurante');
      if (storedRestaurante) {
        try {
          const r = JSON.parse(storedRestaurante);
          localStorage.setItem('restaurante', JSON.stringify({ ...r, ativo: true }));
        } catch {}
      }
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    }
  }, [statusParam]);

  const planoAtualOrdem = ORDEM_PLANOS[restaurante?.plano ?? 'BASICO'] ?? 0;

  const planosVisiveis = planos.filter(
    (p) => ORDEM_PLANOS[p.planoSistema] >= planoAtualOrdem,
  );

  useEffect(() => {
    api.get<PlanoAssinatura[]>('/assinaturas/planos')
      .then((data) => {
        setPlanos(data);
        const porParam = planoParam ? data.find((p) => p.id === planoParam) : null;
        const planoAtual = data.find((p) => p.planoSistema === restaurante?.plano);
        const ordemAtual = ORDEM_PLANOS[restaurante?.plano ?? 'BASICO'] ?? 0;
        const primeiroUpgrade = data.find((p) => ORDEM_PLANOS[p.planoSistema] > ordemAtual);
        setSelectedPlano(porParam || primeiroUpgrade || planoAtual || data[0] || null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar planos');
      })
      .finally(() => setLoadingPlanos(false));
  }, [restaurante?.plano]);

  async function handleEscolherPix() {
    if (!selectedPlano) return;
    if (!email.trim()) {
      toast.error('Informe um e-mail para gerar o Pix');
      return;
    }
    setMetodoPagamento('pix');
    setGerandoPix(true);
    try {
      const data = await api.post<PixResponse>('/assinaturas/pix', {
        planoId: selectedPlano.id,
        email: email.trim(),
      });
      setPix(data);
      if (data.status) setPixStatus(data.status);
      toast.success(data.modo === 'automatico' ? 'Pix gerado' : 'Solicitacao enviada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar Pix');
      setMetodoPagamento(null);
    } finally {
      setGerandoPix(false);
    }
  }

  async function pagarCartao() {
    if (!selectedPlano) return;
    setMetodoPagamento('cartao');
    setGerandoCartao(true);
    try {
      const data = await api.post<CartaoCheckout>('/assinaturas/cartao', {
        planoId: selectedPlano.id,
        email: email.trim() || undefined,
      });
      const url = data.sandboxInitPoint || data.initPoint;
      if (!url) throw new Error('Checkout de cartao nao retornou link de pagamento');
      window.location.href = url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir checkout');
      setMetodoPagamento(null);
    } finally {
      setGerandoCartao(false);
    }
  }

  async function consultarPix() {
    if (!pix?.id) return;
    setConsultando(true);
    try {
      const data = await api.get<{ status: string; statusDetail?: string }>(`/assinaturas/pagamentos/${pix.id}`);
      setPixStatus(data.status);
      if (data.status === 'approved') {
        toast.success('Pagamento aprovado. Plano ativado.');
        const storedRestaurante = localStorage.getItem('restaurante');
        if (storedRestaurante) {
          try {
            const r = JSON.parse(storedRestaurante);
            localStorage.setItem('restaurante', JSON.stringify({ ...r, ativo: true }));
          } catch {}
        }
        setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
      } else {
        toast(statusLabel[data.status] || data.status);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao consultar pagamento');
    } finally {
      setConsultando(false);
    }
  }

  if (loadingPlanos) {
    return <div className="text-center py-12 text-gray-500">Carregando planos...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
          <p className="mt-1 text-sm text-gray-500">
            Escolha o plano e pague por Pix ou cartao de credito pelo Mercado Pago.
          </p>
        </div>
        <Badge variant="blue">
          Plano atual: {restaurante?.plano || 'BASICO'}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-start">
        <div className={`grid gap-4 ${planosVisiveis.length === 1 ? 'md:grid-cols-1 max-w-sm' : planosVisiveis.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {planosVisiveis.map((plano) => {
            const isAtual = plano.planoSistema === restaurante?.plano;
            const active = selectedPlano?.id === plano.id;
            return isAtual ? (
              <div
                key={plano.id}
                className="rounded-lg border border-gray-300 bg-gray-50 p-5 opacity-80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-gray-950">{plano.nome}</p>
                    <p className="mt-1 text-sm text-gray-500">{plano.descricao}</p>
                  </div>
                  <Badge variant="blue">Plano atual</Badge>
                </div>
                <p className="mt-5 text-3xl font-black text-gray-400">
                  {formatBRL(plano.valor)}
                  <span className="text-sm font-semibold text-gray-400">/mes</span>
                </p>
                <div className="mt-5 space-y-2">
                  {plano.recursos.map((recurso) => (
                    <p key={recurso} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      {recurso}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <button
                key={plano.id}
                type="button"
                onClick={() => {
                  setSelectedPlano(plano);
                  setPix(null);
                  setPixStatus('');
                  setMetodoPagamento(null);
                }}
                className={`rounded-lg border bg-white p-5 text-left transition-colors ${
                  active ? 'border-cafe-700 ring-2 ring-cafe-700/15' : 'border-gray-200 hover:border-cafe-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-gray-950">{plano.nome}</p>
                    <p className="mt-1 text-sm text-gray-500">{plano.descricao}</p>
                  </div>
                  {active && <Badge variant="green">Selecionado</Badge>}
                </div>
                <p className="mt-5 text-3xl font-black text-cafe-800">
                  {formatBRL(plano.valor)}
                  <span className="text-sm font-semibold text-gray-500">/mes</span>
                </p>
                <div className="mt-5 space-y-2">
                  {plano.recursos.map((recurso) => (
                    <p key={recurso} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-2 w-2 rounded-full bg-cafe-700" />
                      {recurso}
                    </p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-black text-gray-950">Checkout</h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedPlano?.planoSistema === restaurante?.plano
              ? 'Selecione um plano acima para fazer upgrade.'
              : 'O Pix mostra QR Code na tela. O cartao abre o checkout seguro.'}
          </p>

          <div className="mt-5">
            <Input
              label="E-mail do pagador"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="financeiro@restaurante.com"
            />
          </div>

          {selectedPlano && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Plano selecionado</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="font-bold text-gray-900">{selectedPlano.nome}</span>
                <span className="font-black text-cafe-800">{formatBRL(selectedPlano.valor)}</span>
              </div>
            </div>
          )}

          {/* Seleção de método */}
          {!metodoPagamento && selectedPlano?.planoSistema !== restaurante?.plano && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Button onClick={handleEscolherPix} loading={gerandoPix} disabled={!selectedPlano}>
                Pagar via Pix
              </Button>
              <Button variant="secondary" onClick={pagarCartao} loading={gerandoCartao} disabled={!selectedPlano}>
                Pagar com cartao
              </Button>
            </div>
          )}

          {/* QR Code após escolher Pix */}
          {metodoPagamento === 'pix' && pix && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-gray-900">Pix</h3>
                {pix.modo === 'automatico' && pixStatus && (
                  <Badge variant={pixStatus === 'approved' ? 'green' : 'yellow'}>
                    {statusLabel[pixStatus] || pixStatus}
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex justify-center rounded-lg bg-gray-50 p-4">
                {pix.modo === 'automatico' && pix.qrCodeBase64 ? (
                  <img
                    src={pix.qrCodeBase64.startsWith('data:') ? pix.qrCodeBase64 : `data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code Pix"
                    style={{ width: 224, height: 224 }}
                    className="rounded"
                  />
                ) : selectedPlano && PIX_ESTATICO[selectedPlano.id] ? (
                  <img
                    src={PIX_ESTATICO[selectedPlano.id]!.imagem.src}
                    alt="QR Code Pix"
                    style={{ width: 200, height: 200 }}
                    className="rounded"
                  />
                ) : null}
              </div>

              <label className="mt-4 block text-sm font-medium text-gray-700">Pix copia e cola</label>
              <textarea
                readOnly
                value={
                  pix.modo === 'automatico' && pix.qrCode
                    ? pix.qrCode
                    : selectedPlano
                      ? (PIX_ESTATICO[selectedPlano.id]?.codigo ?? '')
                      : ''
                }
                className="mt-1 h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:outline-none"
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const codigo =
                      pix.modo === 'automatico' && pix.qrCode
                        ? pix.qrCode
                        : selectedPlano
                          ? (PIX_ESTATICO[selectedPlano.id]?.codigo ?? '')
                          : '';
                    navigator.clipboard.writeText(codigo);
                    toast.success('Codigo Pix copiado');
                  }}
                >
                  Copiar codigo Pix
                </Button>
                {pix.modo === 'automatico' && pix.id && (
                  <Button variant="secondary" onClick={consultarPix} loading={consultando}>
                    Verificar pagamento
                  </Button>
                )}
              </div>

              {pix.modo === 'manual' && (
                <p className="mt-3 text-xs text-green-600 font-medium">
                  Solicitacao enviada ao administrador. Apos confirmar o pagamento, seu plano sera ativado automaticamente.
                </p>
              )}

              <button
                type="button"
                onClick={() => { setMetodoPagamento(null); setPix(null); setPixStatus(''); }}
                className="mt-4 text-xs text-gray-400 underline hover:text-gray-600"
              >
                Escolher outra forma de pagamento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
