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

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Configuracoes>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await api.get<Configuracoes>('/configuracoes');
      setConfig({ ...defaultConfig, ...data });
    } catch {
      toast.error('Erro ao carregar configuracoes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  function setField(key: keyof Configuracoes, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/configuracoes', config);
      toast.success('Configuracoes salvas com sucesso');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
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
              label="Taxa de Entrega (R$)"
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

        {/* Footer save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Salvar Configuracoes
          </Button>
        </div>
      </div>
    </div>
  );
}
