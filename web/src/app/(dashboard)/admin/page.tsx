'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface SolicitacaoPix {
  id: number;
  planoId: string;
  planoNome: string;
  valor: number;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  criadoEm: string;
  restaurante: {
    id: number;
    nome: string;
    email: string | null;
    plano: string;
    ativo: boolean;
  };
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const statusVariant: Record<string, 'yellow' | 'green' | 'blue'> = {
  PENDENTE: 'yellow',
  APROVADO: 'green',
  REJEITADO: 'blue',
};

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
};

export default function AdminPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPix[]>([]);
  const [loading, setLoading] = useState(true);
  const [aprovando, setAprovando] = useState<number | null>(null);
  const [rejeitando, setRejeitando] = useState<number | null>(null);

  async function load() {
    try {
      const data = await api.get<SolicitacaoPix[]>('/admin/solicitacoes-pix');
      setSolicitacoes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function aprovar(id: number) {
    setAprovando(id);
    try {
      await api.patch(`/admin/solicitacoes-pix/${id}/aprovar`, {});
      toast.success('Plano ativado com sucesso');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar');
    } finally {
      setAprovando(null);
    }
  }

  async function rejeitar(id: number) {
    setRejeitando(id);
    try {
      await api.patch(`/admin/solicitacoes-pix/${id}/rejeitar`, {});
      toast.success('Solicitação rejeitada');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao rejeitar');
    } finally {
      setRejeitando(null);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Carregando...</div>;

  const pendentes = solicitacoes.filter((s) => s.status === 'PENDENTE');
  const historico = solicitacoes.filter((s) => s.status !== 'PENDENTE');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plataforma</h1>
        <p className="mt-1 text-sm text-gray-500">
          Solicitações de pagamento via Pix aguardando confirmação.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          Aguardando aprovação {pendentes.length > 0 && `(${pendentes.length})`}
        </h2>

        {pendentes.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            Nenhuma solicitação pendente.
          </div>
        ) : (
          <div className="space-y-3">
            {pendentes.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-gray-900">{s.restaurante.nome}</p>
                  <p className="text-sm text-gray-500">{s.restaurante.email}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Plano <span className="font-semibold">{s.planoNome}</span>{' '}
                    — {formatBRL(s.valor)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(s.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    onClick={() => rejeitar(s.id)}
                    loading={rejeitando === s.id}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => aprovar(s.id)}
                    loading={aprovando === s.id}
                  >
                    Confirmar pagamento
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {historico.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Histórico</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Restaurante</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Plano</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Valor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.restaurante.nome}</p>
                      <p className="text-xs text-gray-400">{s.restaurante.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.planoNome}</td>
                    <td className="px-4 py-3 text-gray-700">{formatBRL(s.valor)}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(s.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[s.status] ?? 'yellow'}>
                        {statusLabel[s.status] ?? s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
