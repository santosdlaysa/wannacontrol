'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import type { Cliente, Pedido } from '@cafecontrol/shared';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

interface ClienteForm {
  nome: string;
  telefone: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cidade: string;
  observacao: string;
}

const emptyForm: ClienteForm = {
  nome: '',
  telefone: '',
  endereco: '',
  complemento: '',
  bairro: '',
  cidade: '',
  observacao: '',
};

interface ClienteComHistorico extends Cliente {
  pedidos?: Pedido[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detalhe, setDetalhe] = useState<ClienteComHistorico | null>(null);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const fetchClientes = useCallback(async () => {
    try {
      const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
      const data = await api.get<Cliente[]>(`/clientes${params}`);
      setClientes(data);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      complemento: cliente.complemento || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      observacao: cliente.observacao || '',
    });
    setEditingId(cliente.id);
    setModalOpen(true);
  }

  async function openDetalhe(cliente: Cliente) {
    setDetalhe(cliente);
    setDetalheOpen(true);
    setLoadingDetalhe(true);
    try {
      const data = await api.get<ClienteComHistorico>(`/clientes/${cliente.id}`);
      setDetalhe(data);
    } catch {
      toast.error('Erro ao carregar historico');
    } finally {
      setLoadingDetalhe(false);
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Nome e obrigatorio');
      return;
    }

    setSaving(true);
    try {
      const body = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim() || null,
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim() || null,
        cidade: form.cidade.trim() || null,
        observacao: form.observacao.trim() || null,
      };

      if (editingId) {
        await api.put(`/clientes/${editingId}`, body);
        toast.success('Cliente atualizado');
      } else {
        await api.post('/clientes', body);
        toast.success('Cliente criado');
      }
      setModalOpen(false);
      fetchClientes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Deseja remover este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente removido');
      fetchClientes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  }

  const statusLabel: Record<string, string> = {
    ABERTO: 'Aberto',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
  };

  const statusVariant: Record<string, 'yellow' | 'green' | 'red'> = {
    ABERTO: 'yellow',
    PAGO: 'green',
    CANCELADO: 'red',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button onClick={openCreate}>+ Novo Cliente</Button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhum cliente encontrado</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Endereco</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cafe-100 flex items-center justify-center text-sm font-bold text-cafe-700 shrink-0">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{cliente.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{cliente.telefone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {[cliente.endereco, cliente.bairro, cliente.cidade].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {cliente._count?.pedidos ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDetalhe(cliente)}>
                        Historico
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(cliente)}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(cliente.id)}>
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Nome *"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Endereco"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua e numero"
              />
            </div>
            <Input
              label="Complemento"
              value={form.complemento}
              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
              placeholder="Apto, bloco..."
            />
            <Input
              label="Bairro"
              value={form.bairro}
              onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              placeholder="Bairro"
            />
            <Input
              label="Cidade"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              placeholder="Cidade"
            />
            <Input
              label="Observacao"
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder="Ponto de referencia, preferencias..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail/History Modal */}
      <Modal
        isOpen={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        title={detalhe ? `Historico — ${detalhe.nome}` : 'Historico'}
      >
        {loadingDetalhe ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : detalhe ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold">Telefone</p>
                <p className="text-gray-800">{detalhe.telefone || '—'}</p>
              </div>
              {detalhe.cidade && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Cidade</p>
                  <p className="text-gray-800">{detalhe.cidade}</p>
                </div>
              )}
              {detalhe.endereco && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Endereco</p>
                  <p className="text-gray-800">
                    {[detalhe.endereco, detalhe.complemento, detalhe.bairro, detalhe.cidade]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
              {detalhe.observacao && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Observacao</p>
                  <p className="text-gray-800">{detalhe.observacao}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Ultimos Pedidos</h3>
              {!detalhe.pedidos || detalhe.pedidos.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum pedido encontrado</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {detalhe.pedidos.map((pedido) => (
                    <div key={pedido.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Pedido #{pedido.id}</p>
                        <p className="text-xs text-gray-400">{formatDate(String(pedido.dataCriacao))}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {pedido.total != null && (
                          <span className="text-sm font-semibold text-cafe-700">{formatBRL(Number(pedido.total))}</span>
                        )}
                        <Badge variant={statusVariant[pedido.statusPedido] || 'yellow'}>
                          {statusLabel[pedido.statusPedido] || pedido.statusPedido}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button variant="ghost" onClick={() => setDetalheOpen(false)}>Fechar</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
