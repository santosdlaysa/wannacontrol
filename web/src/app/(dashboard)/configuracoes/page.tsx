'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Configuracoes {
  taxa_entrega: string;
  tempo_preparo_medio: string;
  aceita_delivery: string;
  aceita_retirada: string;
  horario_abertura: string;
  horario_fechamento: string;
  mensagem_boas_vindas: string;
  percentual_servico: string;
  [key: string]: string;
}

interface Bairro {
  id: number;
  bairro: string;
  taxa: number;
  ativo: boolean;
}

const defaultConfig: Configuracoes = {
  taxa_entrega: '0',
  tempo_preparo_medio: '30',
  aceita_delivery: 'true',
  aceita_retirada: 'true',
  horario_abertura: '08:00',
  horario_fechamento: '22:00',
  mensagem_boas_vindas: '',
  percentual_servico: '0',
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Configuracoes>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bairros
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [novoBairro, setNovoBairro] = useState('');
  const [novaTaxa, setNovaTaxa] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState<Bairro | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const [data, listaBairros] = await Promise.all([
        api.get<Configuracoes>('/configuracoes'),
        api.get<Bairro[]>('/configuracoes/bairros'),
      ]);
      setConfig({ ...defaultConfig, ...data });
      setBairros(listaBairros);
    } catch {
      toast.error('Erro ao carregar configuracoes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  function setField(key: keyof Configuracoes, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/configuracoes', config);
      toast.success('Configuracoes salvas');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddBairro() {
    if (!novoBairro.trim() || !novaTaxa) return;
    setAdicionando(true);
    try {
      const criado = await api.post<Bairro>('/configuracoes/bairros', {
        bairro: novoBairro.trim(),
        taxa: Number(novaTaxa),
      });
      setBairros((prev) => [...prev, criado].sort((a, b) => a.bairro.localeCompare(b.bairro)));
      setNovoBairro('');
      setNovaTaxa('');
      toast.success('Bairro adicionado');
    } catch {
      toast.error('Erro ao adicionar bairro');
    } finally {
      setAdicionando(false);
    }
  }

  async function handleSaveBairro(b: Bairro) {
    try {
      await api.put(`/configuracoes/bairros/${b.id}`, {
        bairro: b.bairro,
        taxa: b.taxa,
        ativo: b.ativo,
      });
      setBairros((prev) => prev.map((x) => (x.id === b.id ? b : x)));
      setEditando(null);
      toast.success('Bairro atualizado');
    } catch {
      toast.error('Erro ao salvar bairro');
    }
  }

  async function handleDeleteBairro(id: number) {
    if (!confirm('Remover este bairro?')) return;
    try {
      await api.delete(`/configuracoes/bairros/${id}`);
      setBairros((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bairro removido');
    } catch {
      toast.error('Erro ao remover bairro');
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <Button onClick={handleSave} loading={saving}>
          Salvar Configuracoes
        </Button>
      </div>

      <div className="space-y-6">
        {/* Secao: Financeiro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Financeiro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Taxa de Entrega Padrao (R$)"
              type="number"
              value={config.taxa_entrega}
              onChange={(e) => setField('taxa_entrega', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="% Servico"
              type="number"
              value={config.percentual_servico}
              onChange={(e) => setField('percentual_servico', e.target.value)}
              placeholder="10"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            A taxa padrao e usada quando nenhum bairro e selecionado pelo cliente.
          </p>
        </div>

        {/* Secao: Taxas por Bairro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Taxas de Entrega por Bairro</h2>
          <p className="text-xs text-gray-400 mb-4">
            O cliente seleciona o bairro no cardapio e a taxa e calculada automaticamente.
          </p>

          {/* Adicionar bairro */}
          <div className="flex gap-3 mb-4">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cafe-500"
              placeholder="Nome do bairro"
              value={novoBairro}
              onChange={(e) => setNovoBairro(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBairro()}
            />
            <input
              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cafe-500"
              placeholder="Taxa (R$)"
              type="number"
              step="0.50"
              value={novaTaxa}
              onChange={(e) => setNovaTaxa(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBairro()}
            />
            <button
              onClick={handleAddBairro}
              disabled={adicionando || !novoBairro.trim() || !novaTaxa}
              className="px-4 py-2 bg-cafe-700 text-white rounded-lg text-sm font-medium hover:bg-cafe-800 disabled:opacity-50 transition-colors"
            >
              {adicionando ? '...' : 'Adicionar'}
            </button>
          </div>

          {/* Lista de bairros */}
          {bairros.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhum bairro cadastrado. Adicione acima.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {bairros.map((b) => (
                <div key={b.id} className="py-3">
                  {editando?.id === b.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cafe-500"
                        value={editando.bairro}
                        onChange={(e) => setEditando({ ...editando, bairro: e.target.value })}
                      />
                      <input
                        className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cafe-500"
                        type="number"
                        step="0.50"
                        value={editando.taxa}
                        onChange={(e) => setEditando({ ...editando, taxa: Number(e.target.value) })}
                      />
                      <button
                        onClick={() => handleSaveBairro(editando)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`flex-1 text-sm font-medium ${b.ativo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                        {b.bairro}
                      </span>
                      <span className="text-sm font-semibold text-cafe-700">{formatBRL(Number(b.taxa))}</span>
                      <button
                        onClick={() => setEditando({ ...b })}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleSaveBairro({ ...b, ativo: !b.ativo })}
                        className={`text-xs px-2 py-1 ${b.ativo ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {b.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteBairro(b.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secao: Operacao */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Operacao</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tempo Medio de Preparo (minutos)"
              type="number"
              value={config.tempo_preparo_medio}
              onChange={(e) => setField('tempo_preparo_medio', e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aceita_delivery"
                checked={config.aceita_delivery === 'true'}
                onChange={(e) => setField('aceita_delivery', String(e.target.checked))}
                className="w-4 h-4 rounded border-gray-300 text-cafe-600 focus:ring-cafe-500"
              />
              <label htmlFor="aceita_delivery" className="text-sm font-medium text-gray-700">
                Aceita Delivery
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aceita_retirada"
                checked={config.aceita_retirada === 'true'}
                onChange={(e) => setField('aceita_retirada', String(e.target.checked))}
                className="w-4 h-4 rounded border-gray-300 text-cafe-600 focus:ring-cafe-500"
              />
              <label htmlFor="aceita_retirada" className="text-sm font-medium text-gray-700">
                Aceita Retirada
              </label>
            </div>
          </div>
        </div>

        {/* Secao: Horarios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Horarios de Funcionamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Horario de Abertura (HH:MM)"
              type="text"
              value={config.horario_abertura}
              onChange={(e) => setField('horario_abertura', e.target.value)}
              placeholder="08:00"
            />
            <Input
              label="Horario de Fechamento (HH:MM)"
              type="text"
              value={config.horario_fechamento}
              onChange={(e) => setField('horario_fechamento', e.target.value)}
              placeholder="22:00"
            />
          </div>
        </div>

        {/* Secao: Mensagens */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Mensagens</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem de Boas-vindas
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none resize-none"
              rows={4}
              value={config.mensagem_boas_vindas}
              onChange={(e) => setField('mensagem_boas_vindas', e.target.value)}
              placeholder="Mensagem exibida para os clientes ao abrir o cardapio..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Salvar Configuracoes
          </Button>
        </div>
      </div>
    </div>
  );
}
