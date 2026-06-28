'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface PlanoAssinatura {
  id: 'INICIAL' | 'PROFISSIONAL' | 'PREMIUM';
  nome: string;
  descricao: string;
  valor: number;
  planoSistema: 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';
  recursos: string[];
}

interface PixCheckout {
  id: number;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
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

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AssinaturaPage() {
  const { restaurante } = useAuth();
  const searchParams = useSearchParams();
  const planoParam = searchParams.get('plano');
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<PlanoAssinatura | null>(null);
  const [email, setEmail] = useState(restaurante?.email || '');
  const [pix, setPix] = useState<PixCheckout | null>(null);
  const [pixStatus, setPixStatus] = useState('');
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [gerandoPix, setGerandoPix] = useState(false);
  const [gerandoCartao, setGerandoCartao] = useState(false);
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    api.get<PlanoAssinatura[]>('/assinaturas/planos')
      .then((data) => {
        setPlanos(data);
        const porParam = planoParam ? data.find((p) => p.id === planoParam) : null;
        setSelectedPlano(porParam || data.find((p) => p.planoSistema === restaurante?.plano) || data[1] || data[0] || null);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar planos');
      })
      .finally(() => setLoadingPlanos(false));
  }, [restaurante?.plano]);

  async function gerarPix() {
    if (!selectedPlano) return;
    if (!email.trim()) {
      toast.error('Informe um e-mail para gerar o Pix');
      return;
    }

    setGerandoPix(true);
    try {
      const data = await api.post<PixCheckout>('/assinaturas/pix', {
        planoId: selectedPlano.id,
        email: email.trim(),
      });
      setPix(data);
      setPixStatus(data.status);
      toast.success('Pix gerado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar Pix');
    } finally {
      setGerandoPix(false);
    }
  }

  async function pagarCartao() {
    if (!selectedPlano) return;

    setGerandoCartao(true);
    try {
      const data = await api.post<CartaoCheckout>('/assinaturas/cartao', {
        planoId: selectedPlano.id,
        email: email.trim() || undefined,
      });
      const url = data.initPoint || data.sandboxInitPoint;
      if (!url) throw new Error('Checkout de cartao nao retornou link de pagamento');
      window.location.href = url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir checkout');
    } finally {
      setGerandoCartao(false);
    }
  }

  async function consultarPix() {
    if (!pix) return;

    setConsultando(true);
    try {
      const data = await api.get<{ status: string; statusDetail?: string }>(`/assinaturas/pagamentos/${pix.id}`);
      setPixStatus(data.status);
      if (data.status === 'approved') {
        toast.success('Pagamento aprovado. Plano ativado.');
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

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {planos.map((plano) => {
            const active = selectedPlano?.id === plano.id;
            return (
              <button
                key={plano.id}
                type="button"
                onClick={() => {
                  setSelectedPlano(plano);
                  setPix(null);
                  setPixStatus('');
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
            O Pix mostra QR Code na tela. O cartao abre o checkout seguro.
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Button onClick={gerarPix} loading={gerandoPix} disabled={!selectedPlano}>
              Gerar Pix
            </Button>
            <Button variant="secondary" onClick={pagarCartao} loading={gerandoCartao} disabled={!selectedPlano}>
              Pagar com cartao
            </Button>
          </div>

          {pix && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-gray-900">Pix gerado</h3>
                <Badge variant={pixStatus === 'approved' ? 'green' : 'yellow'}>
                  {statusLabel[pixStatus] || pixStatus}
                </Badge>
              </div>

              <div className="mt-4 flex justify-center rounded-lg bg-gray-50 p-4">
                <img
                  src={`data:image/png;base64,${pix.qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="h-56 w-56"
                />
              </div>

              <label className="mt-4 block text-sm font-medium text-gray-700">
                Pix copia e cola
              </label>
              <textarea
                readOnly
                value={pix.qrCode}
                className="mt-1 h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 focus:outline-none"
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(pix.qrCode);
                    toast.success('Codigo Pix copiado');
                  }}
                >
                  Copiar codigo Pix
                </Button>
                <Button variant="secondary" onClick={consultarPix} loading={consultando}>
                  Verificar pagamento
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
