'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

const formatDate = (d: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const PLANOS = ['BASICO', 'PROFISSIONAL', 'ENTERPRISE'] as const;
type Plano = (typeof PLANOS)[number];

const planoBadge: Record<Plano, 'gray' | 'blue' | 'green'> = {
  BASICO: 'gray',
  PROFISSIONAL: 'blue',
  ENTERPRISE: 'green',
};

const planoLabel: Record<Plano, string> = {
  BASICO: 'Basico',
  PROFISSIONAL: 'Profissional',
  ENTERPRISE: 'Premium',
};

interface Restaurante {
  id: number;
  nome: string;
  slug: string;
  email: string | null;
  telefone: string | null;
  cnpj: string | null;
  endereco: string | null;
  plano: Plano;
  ativo: boolean;
  dataVencimento: string | null;
  criadoEm: string;
  _count: { usuarios: number; produtos: number; pedidos: number; clientes: number; mesas: number };
}

interface SolicitacaoPix {
  id: number;
  planoId: string;
  planoNome: string;
  valor: number;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  criadoEm: string;
  restaurante: { id: number; nome: string; email: string | null; plano: string; ativo: boolean };
}

interface CriarForm {
  nome: string;
  slug: string;
  email: string;
  telefone: string;
  plano: Plano;
  ativo: boolean;
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}

interface EditarForm {
  nome: string;
  slug: string;
  email: string;
  telefone: string;
  cnpj: string;
  endereco: string;
  plano: Plano;
  ativo: boolean;
  dataVencimento: string;
}

const emptyCriar: CriarForm = {
  nome: '', slug: '', email: '', telefone: '', plano: 'BASICO', ativo: true,
  adminNome: '', adminEmail: '', adminSenha: '',
};

export default function SuperAdminPage() {
  const [aba, setAba] = useState<'restaurantes' | 'pix'>('restaurantes');
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPix[]>([]);
  const [loadingPix, setLoadingPix] = useState(true);
  const [aprovandoId, setAprovandoId] = useState<number | null>(null);
  const [rejeitandoId, setRejeitandoId] = useState<number | null>(null);

  const [modalCriar, setModalCriar] = useState(false);
  const [criarForm, setCriarForm] = useState<CriarForm>(emptyCriar);
  const [salvandoCriar, setSalvandoCriar] = useState(false);

  const [modalEditar, setModalEditar] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editarForm, setEditarForm] = useState<EditarForm>({
    nome: '', slug: '', email: '', telefone: '', cnpj: '', endereco: '', plano: 'BASICO', ativo: true, dataVencimento: '',
  });
  const [salvandoEditar, setSalvandoEditar] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchRestaurantes = useCallback(async () => {
    try {
      const data = await api.get<Restaurante[]>('/admin/restaurantes');
      setRestaurantes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar restaurantes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSolicitacoes = useCallback(async () => {
    setLoadingPix(true);
    try {
      const data = await api.get<SolicitacaoPix[]>('/admin/solicitacoes-pix');
      setSolicitacoes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar solicitacoes');
    } finally {
      setLoadingPix(false);
    }
  }, []);

  useEffect(() => { fetchRestaurantes(); }, [fetchRestaurantes]);
  useEffect(() => { fetchSolicitacoes(); }, [fetchSolicitacoes]);

  async function aprovarPix(id: number) {
    setAprovandoId(id);
    try {
      await api.patch(`/admin/solicitacoes-pix/${id}/aprovar`, {});
      toast.success('Plano ativado com sucesso!');
      fetchSolicitacoes();
      fetchRestaurantes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar');
    } finally {
      setAprovandoId(null);
    }
  }

  async function rejeitarPix(id: number) {
    setRejeitandoId(id);
    try {
      await api.patch(`/admin/solicitacoes-pix/${id}/rejeitar`, {});
      toast.success('Solicitacao rejeitada');
      fetchSolicitacoes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao rejeitar');
    } finally {
      setRejeitandoId(null);
    }
  }

  async function handleCriar() {
    if (!criarForm.nome.trim() || !criarForm.slug.trim()) {
      toast.error('Nome e slug sao obrigatorios');
      return;
    }
    setSalvandoCriar(true);
    try {
      await api.post('/admin/restaurantes', {
        nome: criarForm.nome.trim(),
        slug: criarForm.slug.trim().toLowerCase(),
        email: criarForm.email.trim() || null,
        telefone: criarForm.telefone.trim() || null,
        plano: criarForm.plano,
        ativo: criarForm.ativo,
        adminNome: criarForm.adminNome.trim() || undefined,
        adminEmail: criarForm.adminEmail.trim() || undefined,
        adminSenha: criarForm.adminSenha.trim() || undefined,
      });
      toast.success('Restaurante criado');
      setModalCriar(false);
      setCriarForm(emptyCriar);
      fetchRestaurantes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar restaurante');
    } finally {
      setSalvandoCriar(false);
    }
  }

  function openEditar(r: Restaurante) {
    setEditandoId(r.id);
    setEditarForm({
      nome: r.nome,
      slug: r.slug,
      email: r.email ?? '',
      telefone: r.telefone ?? '',
      cnpj: r.cnpj ?? '',
      endereco: r.endereco ?? '',
      plano: r.plano,
      ativo: r.ativo,
      dataVencimento: r.dataVencimento ? r.dataVencimento.slice(0, 10) : '',
    });
    setModalEditar(true);
  }

  async function handleEditar() {
    if (!editandoId || !editarForm.nome.trim() || !editarForm.slug.trim()) {
      toast.error('Nome e slug sao obrigatorios');
      return;
    }
    setSalvandoEditar(true);
    try {
      await api.put(`/admin/restaurantes/${editandoId}`, {
        nome: editarForm.nome.trim(),
        slug: editarForm.slug.trim().toLowerCase(),
        email: editarForm.email.trim() || null,
        telefone: editarForm.telefone.trim() || null,
        cnpj: editarForm.cnpj.trim() || null,
        endereco: editarForm.endereco.trim() || null,
        plano: editarForm.plano,
        ativo: editarForm.ativo,
        dataVencimento: editarForm.dataVencimento
          ? new Date(`${editarForm.dataVencimento}T23:59:59`).toISOString()
          : null,
      });
      toast.success('Restaurante atualizado');
      setModalEditar(false);
      setEditandoId(null);
      fetchRestaurantes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar restaurante');
    } finally {
      setSalvandoEditar(false);
    }
  }

  async function toggleAtivo(r: Restaurante) {
    setTogglingId(r.id);
    try {
      await api.put(`/admin/restaurantes/${r.id}`, { ativo: !r.ativo });
      toast.success(r.ativo ? 'Restaurante desativado' : 'Restaurante ativado');
      fetchRestaurantes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status');
    } finally {
      setTogglingId(null);
    }
  }

  const filtrados = restaurantes.filter((r) =>
    r.nome.toLowerCase().includes(busca.toLowerCase()) ||
    r.slug.toLowerCase().includes(busca.toLowerCase()) ||
    (r.email ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const stats = {
    total: restaurantes.length,
    ativos: restaurantes.filter((r) => r.ativo).length,
    basico: restaurantes.filter((r) => r.plano === 'BASICO').length,
    profissional: restaurantes.filter((r) => r.plano === 'PROFISSIONAL').length,
    enterprise: restaurantes.filter((r) => r.plano === 'ENTERPRISE').length,
  };

  const pendentes = solicitacoes.filter((s) => s.status === 'PENDENTE').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie todos os restaurantes da plataforma</p>
        </div>
        {aba === 'restaurantes' && (
          <Button onClick={() => { setCriarForm(emptyCriar); setModalCriar(true); }}>
            + Novo Restaurante
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([
          { key: 'restaurantes', label: 'Restaurantes' },
          { key: 'pix', label: `Solicitacoes Pix${pendentes > 0 ? ` (${pendentes})` : ''}` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              aba === key
                ? 'border-cafe-700 text-cafe-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === 'pix' && (
        <div>
          {loadingPix ? (
            <div className="text-center py-16 text-gray-500">Carregando...</div>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Nenhuma solicitacao encontrada</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['#', 'Restaurante', 'Plano', 'Valor', 'Status', 'Data', 'Acoes'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitacoes.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{s.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{s.restaurante.nome}</p>
                          {s.restaurante.email && <p className="text-xs text-gray-400">{s.restaurante.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-700">{s.planoNome}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-cafe-800">{formatBRL(s.valor)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={s.status === 'APROVADO' ? 'green' : s.status === 'REJEITADO' ? 'red' : 'yellow'}>
                            {s.status === 'PENDENTE' ? 'Pendente' : s.status === 'APROVADO' ? 'Aprovado' : 'Rejeitado'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(s.criadoEm)}</td>
                        <td className="px-4 py-3">
                          {s.status === 'PENDENTE' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => aprovarPix(s.id)}
                                disabled={aprovandoId === s.id}
                                className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {aprovandoId === s.id ? '...' : 'Aprovar'}
                              </button>
                              <button
                                onClick={() => rejeitarPix(s.id)}
                                disabled={rejeitandoId === s.id}
                                className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors"
                              >
                                {rejeitandoId === s.id ? '...' : 'Rejeitar'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {aba === 'restaurantes' && <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, cls: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'Ativos', value: stats.ativos, cls: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Basico', value: stats.basico, cls: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'Profissional', value: stats.profissional, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Premium', value: stats.enterprise, cls: 'bg-cafe-50 border-cafe-200 text-cafe-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl border p-4 ${cls}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar por nome, slug ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Nenhum restaurante encontrado</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Restaurante', 'Slug', 'Plano', 'Status', 'Vencimento', 'Usuarios', 'Pedidos', 'Criado em', 'Acoes'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{r.nome}</p>
                      {r.email && <p className="text-xs text-gray-400">{r.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">{r.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={planoBadge[r.plano]}>{planoLabel[r.plano]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAtivo(r)}
                        disabled={togglingId === r.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          r.ativo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.ativo ? 'bg-green-500' : 'bg-red-500'}`} />
                        {togglingId === r.id ? '...' : r.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.dataVencimento ? (
                        <span className={`text-xs font-medium ${new Date(r.dataVencimento) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                          {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(r.dataVencimento))}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r._count.usuarios}</td>
                    <td className="px-4 py-3 text-gray-600">{r._count.pedidos}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(r.criadoEm)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditar(r)}
                        className="text-cafe-700 hover:text-cafe-900 text-xs font-semibold hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar */}
      <Modal
        isOpen={modalCriar}
        onClose={() => setModalCriar(false)}
        title="Novo Restaurante"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={criarForm.nome}
              onChange={(e) => setCriarForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome do restaurante"
            />
            <Input
              label="Slug *"
              value={criarForm.slug}
              onChange={(e) => setCriarForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              placeholder="meu-restaurante"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              value={criarForm.email}
              onChange={(e) => setCriarForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="contato@restaurante.com"
            />
            <Input
              label="Telefone"
              value={criarForm.telefone}
              onChange={(e) => setCriarForm((f) => ({ ...f, telefone: e.target.value }))}
              placeholder="(95) 99999-9999"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
              <select
                value={criarForm.plano}
                onChange={(e) => setCriarForm((f) => ({ ...f, plano: e.target.value as Plano }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
              >
                {PLANOS.map((p) => <option key={p} value={p}>{planoLabel[p]}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criarForm.ativo}
                  onChange={(e) => setCriarForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="rounded border-gray-300 text-cafe-700 focus:ring-cafe-500"
                />
                <span className="text-sm font-medium text-gray-700">Ativo</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin do restaurante (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome do admin"
                value={criarForm.adminNome}
                onChange={(e) => setCriarForm((f) => ({ ...f, adminNome: e.target.value }))}
                placeholder="Joao Silva"
              />
              <Input
                label="E-mail do admin"
                type="email"
                value={criarForm.adminEmail}
                onChange={(e) => setCriarForm((f) => ({ ...f, adminEmail: e.target.value }))}
                placeholder="admin@restaurante.com"
              />
            </div>
            <div className="mt-4">
              <Input
                label="Senha do admin"
                type="password"
                value={criarForm.adminSenha}
                onChange={(e) => setCriarForm((f) => ({ ...f, adminSenha: e.target.value }))}
                placeholder="Minimo 6 caracteres"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalCriar(false)}>Cancelar</Button>
            <Button onClick={handleCriar} loading={salvandoCriar}>Criar Restaurante</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal
        key="editar"
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        title="Editar Restaurante"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={editarForm.nome}
              onChange={(e) => setEditarForm((f) => ({ ...f, nome: e.target.value }))}
            />
            <Input
              label="Slug *"
              value={editarForm.slug}
              onChange={(e) => setEditarForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              value={editarForm.email}
              onChange={(e) => setEditarForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Telefone"
              value={editarForm.telefone}
              onChange={(e) => setEditarForm((f) => ({ ...f, telefone: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CNPJ"
              value={editarForm.cnpj}
              onChange={(e) => setEditarForm((f) => ({ ...f, cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00"
            />
            <Input
              label="Endereco"
              value={editarForm.endereco}
              onChange={(e) => setEditarForm((f) => ({ ...f, endereco: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
              <select
                value={editarForm.plano}
                onChange={(e) => setEditarForm((f) => ({ ...f, plano: e.target.value as Plano }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cafe-500"
              >
                {PLANOS.map((p) => <option key={p} value={p}>{planoLabel[p]}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editarForm.ativo}
                  onChange={(e) => setEditarForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="rounded border-gray-300 text-cafe-700 focus:ring-cafe-500"
                />
                <span className="text-sm font-medium text-gray-700">Ativo</span>
              </label>
            </div>
          </div>
          <div>
            <Input
              label="Vencimento da assinatura"
              type="date"
              value={editarForm.dataVencimento}
              onChange={(e) => setEditarForm((f) => ({ ...f, dataVencimento: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ao vencer, o restaurante é desativado automaticamente. Deixe vazio para acesso sem vencimento.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalEditar(false)}>Cancelar</Button>
            <Button onClick={handleEditar} loading={salvandoEditar}>Salvar</Button>
          </div>
        </div>
      </Modal>
      </>}
    </div>
  );
}
