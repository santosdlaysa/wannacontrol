'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import { Perfil } from '@cafecontrol/shared';
import type { Usuario } from '@cafecontrol/shared';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

type UserInfo = Omit<Usuario, 'pin'>;

interface UsuarioForm {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  pin: string;
}

const emptyForm: UsuarioForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: Perfil.GARCOM,
  pin: '',
};

const roleBadgeVariant: Record<Perfil, 'purple' | 'blue' | 'orange' | 'green' | 'yellow'> = {
  [Perfil.ADMIN]: 'purple',
  [Perfil.GERENTE]: 'blue',
  [Perfil.CAIXA]: 'orange',
  [Perfil.GARCOM]: 'green',
  [Perfil.COZINHA]: 'yellow',
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    try {
      const data = await api.get<UserInfo[]>('/usuarios');
      setUsuarios(data);
    } catch {
      toast.error('Erro ao carregar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(usuario: UserInfo) {
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      pin: '',
    });
    setEditingId(usuario.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome || !form.email || !form.perfil) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    if (!editingId && !form.senha) {
      toast.error('Senha e obrigatoria para novos usuarios');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          nome: form.nome,
          email: form.email,
          perfil: form.perfil,
        };
        if (form.senha) body.senha = form.senha;
        if (form.pin) body.pin = form.pin;
        await api.put(`/usuarios/${editingId}`, body);
        toast.success('Usuario atualizado');
      } else {
        const body: Record<string, unknown> = {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
        };
        if (form.pin) body.pin = form.pin;
        await api.post('/usuarios', body);
        toast.success('Usuario criado');
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(usuario: UserInfo) {
    if (!confirm(`Deseja desativar o usuario "${usuario.nome}"?`)) return;
    try {
      await api.put(`/usuarios/${usuario.id}`, { ativo: false });
      toast.success('Usuario desativado');
      fetchUsuarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desativar');
    }
  }

  async function handleActivate(usuario: UserInfo) {
    try {
      await api.put(`/usuarios/${usuario.id}`, { ativo: true });
      toast.success('Usuario ativado');
      fetchUsuarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ativar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <Button onClick={openCreate}>+ Novo Usuario</Button>
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
                  E-mail
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Perfil
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
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cafe-100 flex items-center justify-center text-sm font-bold text-cafe-700">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {usuario.nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {usuario.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant[usuario.perfil]}>
                      {usuario.perfil}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={usuario.ativo ? 'green' : 'red'}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(usuario)}
                      >
                        Editar
                      </Button>
                      {usuario.ativo ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeactivate(usuario)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActivate(usuario)}
                        >
                          Ativar
                        </Button>
                      )}
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
        title={editingId ? 'Editar Usuario' : 'Novo Usuario'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome completo"
          />
          <Input
            label="E-mail *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
          <Input
            label={editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder="Minimo 6 caracteres"
          />
          <Input
            label="PIN (6 digitos, opcional)"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value })}
            placeholder="000000"
            maxLength={6}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perfil *
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none"
              value={form.perfil}
              onChange={(e) =>
                setForm({ ...form, perfil: e.target.value as Perfil })
              }
            >
              {Object.values(Perfil).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
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
