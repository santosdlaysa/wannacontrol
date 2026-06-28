'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

interface ItemComplemento {
  id: number;
  grupoId: number;
  nome: string;
  preco: number;
  disponivel: boolean;
}

interface GrupoComplemento {
  id: number;
  nome: string;
  descricao: string | null;
  obrigatorio: boolean;
  minimo: number;
  maximo: number;
  ativo: boolean;
  itens?: ItemComplemento[];
}

interface GrupoForm {
  nome: string;
  descricao: string;
  obrigatorio: boolean;
  minimo: number;
  maximo: number;
}

interface ItemForm {
  nome: string;
  preco: string;
}

const emptyGrupoForm: GrupoForm = {
  nome: '',
  descricao: '',
  obrigatorio: false,
  minimo: 0,
  maximo: 1,
};

const emptyItemForm: ItemForm = {
  nome: '',
  preco: '',
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ComplementosPage() {
  const [grupos, setGrupos] = useState<GrupoComplemento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Grupo modal
  const [grupoModalOpen, setGrupoModalOpen] = useState(false);
  const [editingGrupoId, setEditingGrupoId] = useState<number | null>(null);
  const [grupoForm, setGrupoForm] = useState<GrupoForm>(emptyGrupoForm);
  const [savingGrupo, setSavingGrupo] = useState(false);

  // Item modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [currentGrupoId, setCurrentGrupoId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [savingItem, setSavingItem] = useState(false);

  const fetchGrupos = useCallback(async () => {
    try {
      const data = await api.get<GrupoComplemento[]>('/complementos/grupos');
      setGrupos(data);
    } catch {
      toast.error('Erro ao carregar complementos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  function openCreateGrupo() {
    setGrupoForm(emptyGrupoForm);
    setEditingGrupoId(null);
    setGrupoModalOpen(true);
  }

  function openEditGrupo(grupo: GrupoComplemento) {
    setGrupoForm({
      nome: grupo.nome,
      descricao: grupo.descricao ?? '',
      obrigatorio: grupo.obrigatorio,
      minimo: grupo.minimo,
      maximo: grupo.maximo,
    });
    setEditingGrupoId(grupo.id);
    setGrupoModalOpen(true);
  }

  async function handleSaveGrupo() {
    if (!grupoForm.nome) {
      toast.error('Nome e obrigatorio');
      return;
    }
    setSavingGrupo(true);
    try {
      const body = {
        nome: grupoForm.nome,
        descricao: grupoForm.descricao || null,
        obrigatorio: grupoForm.obrigatorio,
        minimo: grupoForm.minimo,
        maximo: grupoForm.maximo,
      };
      if (editingGrupoId) {
        await api.put(`/complementos/grupos/${editingGrupoId}`, body);
        toast.success('Grupo atualizado');
      } else {
        await api.post('/complementos/grupos', body);
        toast.success('Grupo criado');
      }
      setGrupoModalOpen(false);
      fetchGrupos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar grupo');
    } finally {
      setSavingGrupo(false);
    }
  }

  async function handleDeleteGrupo(grupo: GrupoComplemento) {
    if (!confirm(`Deseja deletar o grupo "${grupo.nome}"?`)) return;
    try {
      await api.delete(`/complementos/grupos/${grupo.id}`);
      toast.success('Grupo deletado');
      if (expandedId === grupo.id) setExpandedId(null);
      fetchGrupos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar grupo');
    }
  }

  function openCreateItem(grupoId: number) {
    setItemForm(emptyItemForm);
    setEditingItemId(null);
    setCurrentGrupoId(grupoId);
    setItemModalOpen(true);
  }

  function openEditItem(grupoId: number, item: ItemComplemento) {
    setItemForm({
      nome: item.nome,
      preco: String(item.preco),
    });
    setEditingItemId(item.id);
    setCurrentGrupoId(grupoId);
    setItemModalOpen(true);
  }

  async function handleSaveItem() {
    if (!itemForm.nome) {
      toast.error('Nome e obrigatorio');
      return;
    }
    if (!currentGrupoId) return;
    setSavingItem(true);
    try {
      const body = {
        nome: itemForm.nome,
        preco: parseFloat(itemForm.preco) || 0,
      };
      if (editingItemId) {
        await api.put(`/complementos/grupos/${currentGrupoId}/itens/${editingItemId}`, body);
        toast.success('Item atualizado');
      } else {
        await api.post(`/complementos/grupos/${currentGrupoId}/itens`, body);
        toast.success('Item criado');
      }
      setItemModalOpen(false);
      fetchGrupos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar item');
    } finally {
      setSavingItem(false);
    }
  }

  async function handleDeleteItem(grupoId: number, item: ItemComplemento) {
    if (!confirm(`Deseja deletar o item "${item.nome}"?`)) return;
    try {
      await api.delete(`/complementos/grupos/${grupoId}/itens/${item.id}`);
      toast.success('Item deletado');
      fetchGrupos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar item');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complementos</h1>
        <Button onClick={openCreateGrupo}>+ Novo Grupo</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Nenhum grupo de complementos cadastrado
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const isExpanded = expandedId === grupo.id;
            return (
              <div key={grupo.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Grupo header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : grupo.id)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{grupo.nome}</span>
                      {grupo.descricao && (
                        <p className="text-xs text-gray-500 mt-0.5">{grupo.descricao}</p>
                      )}
                    </div>
                    <Badge variant={grupo.obrigatorio ? 'red' : 'gray'}>
                      {grupo.obrigatorio ? 'Obrigatorio' : 'Opcional'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Min: {grupo.minimo} / Max: {grupo.maximo}
                    </span>
                    <Badge variant={grupo.ativo ? 'green' : 'red'}>
                      {grupo.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openEditGrupo(grupo)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteGrupo(grupo)}>
                      Deletar
                    </Button>
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Itens</span>
                      <Button size="sm" onClick={() => openCreateItem(grupo.id)}>
                        + Adicionar Item
                      </Button>
                    </div>
                    {!grupo.itens || grupo.itens.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum item cadastrado neste grupo
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {grupo.itens.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">{item.nome}</span>
                              <span className="text-sm text-gray-600">{formatBRL(item.preco)}</span>
                              <Badge variant={item.disponivel ? 'green' : 'red'}>
                                {item.disponivel ? 'Disponivel' : 'Indisponivel'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditItem(grupo.id, item)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteItem(grupo.id, item)}
                              >
                                Deletar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grupo Modal */}
      <Modal
        isOpen={grupoModalOpen}
        onClose={() => setGrupoModalOpen(false)}
        title={editingGrupoId ? 'Editar Grupo' : 'Novo Grupo de Complementos'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={grupoForm.nome}
            onChange={(e) => setGrupoForm({ ...grupoForm, nome: e.target.value })}
            placeholder="Ex: Bebidas, Molhos..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descricao
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none resize-none"
              rows={2}
              value={grupoForm.descricao}
              onChange={(e) => setGrupoForm({ ...grupoForm, descricao: e.target.value })}
              placeholder="Descricao opcional"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimo"
              type="number"
              value={String(grupoForm.minimo)}
              onChange={(e) => setGrupoForm({ ...grupoForm, minimo: Number(e.target.value) })}
              placeholder="0"
            />
            <Input
              label="Maximo"
              type="number"
              value={String(grupoForm.maximo)}
              onChange={(e) => setGrupoForm({ ...grupoForm, maximo: Number(e.target.value) })}
              placeholder="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="obrigatorio"
              checked={grupoForm.obrigatorio}
              onChange={(e) => setGrupoForm({ ...grupoForm, obrigatorio: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cafe-600 focus:ring-cafe-500"
            />
            <label htmlFor="obrigatorio" className="text-sm font-medium text-gray-700">
              Obrigatorio
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setGrupoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGrupo} loading={savingGrupo}>
              {editingGrupoId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItemId ? 'Editar Item' : 'Adicionar Item'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={itemForm.nome}
            onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
            placeholder="Nome do item"
          />
          <Input
            label="Preco"
            type="number"
            value={itemForm.preco}
            onChange={(e) => setItemForm({ ...itemForm, preco: e.target.value })}
            placeholder="0.00"
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setItemModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} loading={savingItem}>
              {editingItemId ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
