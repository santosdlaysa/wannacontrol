'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  _count?: { produtos: number };
}

interface CategoriaForm {
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
}

const emptyForm: CategoriaForm = {
  nome: '',
  descricao: '',
  ativo: true,
  ordem: 0,
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoriaForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await api.get<Categoria[]>('/categorias');
      setCategorias(data);
    } catch {
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(categoria: Categoria) {
    setForm({
      nome: categoria.nome,
      descricao: categoria.descricao ?? '',
      ativo: categoria.ativo,
      ordem: categoria.ordem,
    });
    setEditingId(categoria.id);
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
        descricao: form.descricao || null,
        ativo: form.ativo,
        ordem: form.ordem,
      };

      if (editingId) {
        await api.put(`/categorias/${editingId}`, body);
        toast.success('Categoria atualizada');
      } else {
        await api.post('/categorias', body);
        toast.success('Categoria criada');
      }
      setModalOpen(false);
      fetchCategorias();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoria: Categoria) {
    if (!confirm(`Deseja deletar a categoria "${categoria.nome}"?`)) return;
    try {
      await api.delete(`/categorias/${categoria.id}`);
      toast.success('Categoria deletada');
      fetchCategorias();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <Button onClick={openCreate}>+ Nova Categoria</Button>
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
                  Descricao
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Produtos
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
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Nenhuma categoria cadastrada
                  </td>
                </tr>
              ) : (
                categorias.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {categoria.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {categoria.descricao ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {categoria._count?.produtos ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={categoria.ativo ? 'green' : 'red'}>
                        {categoria.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(categoria)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(categoria)}
                        >
                          Deletar
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
        title={editingId ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome da categoria"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descricao
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none resize-none"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descricao opcional"
            />
          </div>
          <Input
            label="Ordem"
            type="number"
            value={String(form.ordem)}
            onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
            placeholder="0"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cafe-600 focus:ring-cafe-500"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Ativo
            </label>
          </div>
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
