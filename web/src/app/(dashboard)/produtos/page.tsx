'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api-client';
import type { Produto } from '@cafecontrol/shared';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

const CATEGORIAS = [
  'Cafes Quentes',
  'Bebidas Geladas',
  'Salgados',
  'Doces e Tortas',
];

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface ProdutoForm {
  nome: string;
  descricao: string;
  preco: string;
  categoria: string;
  disponivel: boolean;
}

const emptyForm: ProdutoForm = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: CATEGORIAS[0],
  disponivel: true,
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProdutoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  const fetchProdutos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (categoriaFiltro) params.set('categoria', categoriaFiltro);
      const query = params.toString();
      const data = await api.get<Produto[]>(`/produtos${query ? `?${query}` : ''}`);
      setProdutos(data);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  }, [busca, categoriaFiltro]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setImagemFile(null);
    setImagemPreview(null);
    setModalOpen(true);
  }

  function openEdit(produto: Produto) {
    setForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: String(produto.preco),
      categoria: produto.categoria,
      disponivel: produto.disponivel,
    });
    setEditingId(produto.id);
    setImagemFile(null);
    setImagemPreview(produto.urlImagem || null);
    setModalOpen(true);
  }

  function handleImagemChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImagemFile(file);
      setImagemPreview(URL.createObjectURL(file));
    }
  }

  async function handleSave() {
    if (!form.nome || !form.preco || !form.categoria) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    const body = {
      nome: form.nome,
      descricao: form.descricao || null,
      preco: parseFloat(form.preco),
      categoria: form.categoria,
      disponivel: form.disponivel,
    };

    setSaving(true);
    try {
      let produtoId = editingId;
      if (editingId) {
        await api.put(`/produtos/${editingId}`, body);
      } else {
        const novo = await api.post<Produto>('/produtos', body);
        produtoId = novo.id;
      }

      if (imagemFile && produtoId) {
        await api.upload(`/produtos/${produtoId}/imagem`, imagemFile);
      }

      toast.success(editingId ? 'Produto atualizado' : 'Produto criado');
      setModalOpen(false);
      fetchProdutos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function toggleDisponivel(produto: Produto) {
    try {
      await api.put(`/produtos/${produto.id}`, {
        disponivel: !produto.disponivel,
      });
      fetchProdutos();
    } catch {
      toast.error('Erro ao alterar disponibilidade');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto excluido');
      fetchProdutos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <Button onClick={openCreate}>+ Novo Produto</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum produto encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEdit(produto)}
            >
              {/* Image placeholder */}
              <div className="h-36 bg-gradient-to-br from-cafe-100 to-cafe-200 flex items-center justify-center">
                {produto.urlImagem ? (
                  <img
                    src={produto.urlImagem}
                    alt={produto.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 text-cafe-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {produto.nome}
                  </h3>
                  <Badge variant={produto.disponivel ? 'green' : 'red'}>
                    {produto.disponivel ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{produto.categoria}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-cafe-700">
                    {formatBRL(produto.preco)}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleDisponivel(produto)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title={produto.disponivel ? 'Desativar' : 'Ativar'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={produto.disponivel ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(produto.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar Produto' : 'Novo Produto'}
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome do produto"
          />
          <Input
            label="Descricao"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descricao do produto"
          />
          <Input
            label="Preco (R$) *"
            type="number"
            step="0.01"
            min="0"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/20 focus:outline-none"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagem
            </label>
            {imagemPreview && (
              <div className="mb-2 relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={imagemPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setImagemFile(null); setImagemPreview(null); }}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-cafe-400 hover:bg-cafe-50/50 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                {imagemFile ? imagemFile.name : 'Selecionar imagem'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImagemChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="disponivel"
              checked={form.disponivel}
              onChange={(e) => setForm({ ...form, disponivel: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cafe-700 focus:ring-cafe-500"
            />
            <label htmlFor="disponivel" className="text-sm text-gray-700">
              Disponivel para venda
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
