'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

interface Entregador {
  id: number;
  nome: string;
  telefone: string | null;
  veiculo: string | null;
  placa: string | null;
  ativo: boolean;
}

interface EntregadorForm {
  nome: string;
  telefone: string;
  veiculo: string;
  placa: string;
}

const emptyForm: EntregadorForm = {
  nome: '',
  telefone: '',
  veiculo: '',
  placa: '',
};

export default function EntregadoresPage() {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EntregadorForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEntregadores = useCallback(async () => {
    try {
      const data = await api.get<Entregador[]>('/entregadores');
      setEntregadores(data);
    } catch {
      toast.error('Erro ao carregar entregadores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntregadores();
  }, [fetchEntregadores]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(entregador: Entregador) {
    setForm({
      nome: entregador.nome,
      telefone: entregador.telefone ?? '',
      veiculo: entregador.veiculo ?? '',
      placa: entregador.placa ?? '',
    });
    setEditingId(entregador.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome) {
      toast.error('Nome e obrigatorio');
      return;
    }
    setSaving(true);
    try {
      const body = {
        nome: form.nome,
        telefone: form.telefone || null,
        veiculo: form.veiculo || null,
        placa: form.placa || null,
      };
      if (editingId) {
        await api.put(`/entregadores/${editingId}`, body);
        toast.success('Entregador atualizado');
      } else {
        await api.post('/entregadores', body);
        toast.success('Entregador criado');
      }
      setModalOpen(false);
      fetchEntregadores();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(entregador: Entregador) {
    const novoStatus = !entregador.ativo;
    if (!novoStatus && !confirm(`Deseja desativar o entregador "${entregador.nome}"?`)) return;
    try {
      await api.put(`/entregadores/${entregador.id}`, { ativo: novoStatus });
      toast.success(novoStatus ? 'Entregador ativado' : 'Entregador desativado');
      fetchEntregadores();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Entregadores</h1>
        <Button onClick={openCreate}>+ Novo Entregador</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Telefone
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Veiculo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Placa
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entregadores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Nenhum entregador cadastrado
                  </td>
                </tr>
              ) : (
                entregadores.map((entregador) => (
                  <tr key={entregador.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entregador.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entregador.telefone ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entregador.veiculo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entregador.placa ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={entregador.ativo ? 'green' : 'red'}>
                        {entregador.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(entregador)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={entregador.ativo ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleAtivo(entregador)}
                        >
                          {entregador.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Entregador' : 'Novo Entregador'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome completo"
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
          <Input
            label="Veiculo"
            value={form.veiculo}
            onChange={(e) => setForm({ ...form, veiculo: e.target.value })}
            placeholder="Ex: Moto, Bicicleta..."
          />
          <Input
            label="Placa"
            value={form.placa}
            onChange={(e) => setForm({ ...form, placa: e.target.value })}
            placeholder="ABC-1234"
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
