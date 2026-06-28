import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Produto } from '@cafecontrol/shared';
import { apiClient } from '../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../src/lib/constants';

type ModalMode = 'create' | 'edit' | null;

const EMPTY_FORM = {
  nome: '',
  descricao: '',
  preco: '',
  categoria: '',
  disponivel: true,
};

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProdutos = useCallback(async () => {
    try {
      const data = await apiClient.get<Produto[]>('/produtos');
      setProdutos(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(produtos.map((p) => p.categoria))).sort();
    return ['Todos', ...cats];
  }, [produtos]);

  const filtered = useMemo(() => {
    let list = produtos;
    if (catFilter !== 'Todos') list = list.filter((p) => p.categoria === catFilter);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter((p) => p.nome.toLowerCase().includes(q));
    }
    return list;
  }, [produtos, catFilter, busca]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedProduto(null);
    setModalMode('create');
  };

  const openEdit = (p: Produto) => {
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      preco: String(p.preco),
      categoria: p.categoria,
      disponivel: p.disponivel,
    });
    setSelectedProduto(p);
    setModalMode('edit');
  };

  const handleSave = useCallback(async () => {
    if (!form.nome.trim()) { Alert.alert('Aviso', 'Nome obrigatorio.'); return; }
    if (!form.categoria.trim()) { Alert.alert('Aviso', 'Categoria obrigatoria.'); return; }
    const preco = parseFloat(form.preco.replace(',', '.'));
    if (isNaN(preco) || preco <= 0) { Alert.alert('Aviso', 'Informe um preco valido.'); return; }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco,
        categoria: form.categoria.trim(),
        disponivel: form.disponivel,
      };
      if (modalMode === 'create') {
        await apiClient.post('/produtos', payload);
      } else if (selectedProduto) {
        await apiClient.put(`/produtos/${selectedProduto.id}`, payload);
      }
      setModalMode(null);
      fetchProdutos();
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao salvar produto');
    } finally { setSaving(false); }
  }, [form, modalMode, selectedProduto, fetchProdutos]);

  const handleDelete = useCallback((p: Produto) => {
    Alert.alert('Remover produto', `Deseja remover "${p.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/produtos/${p.id}`);
            setModalMode(null);
            fetchProdutos();
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Erro ao remover');
          }
        },
      },
    ]);
  }, [fetchProdutos]);

  const toggleDisponivel = useCallback(async (p: Produto) => {
    try {
      await apiClient.put(`/produtos/${p.id}`, { disponivel: !p.disponivel });
      setProdutos((prev) => prev.map((x) => x.id === p.id ? { ...x, disponivel: !x.disponivel } : x));
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao atualizar');
    }
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          placeholderTextColor={COLORS.text.tertiary}
          value={busca}
          onChangeText={setBusca}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filtro categorias */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={styles.catScroll}
      >
        {categorias.map((c) => {
          const on = catFilter === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.catBtn, on && styles.catBtnOn]}
              onPress={() => setCatFilter(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catBtnText, on && styles.catBtnTextOn]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
                <Text style={styles.cardPreco}>{formatBRL(Number(item.preco))}</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardCat}>{item.categoria}</Text>
                <Switch
                  value={item.disponivel}
                  onValueChange={() => toggleDisponivel(item)}
                  trackColor={{ false: COLORS.border.medium, true: COLORS.success }}
                  thumbColor={COLORS.white}
                  style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                />
              </View>
              {item.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProdutos(); }} colors={[COLORS.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum produto</Text>
            <Text style={styles.emptySub}>Toque em + para adicionar</Text>
          </View>
        }
      />

      {/* Modal Create/Edit */}
      <Modal visible={modalMode !== null} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Novo Produto' : 'Editar Produto'}
              </Text>

              {[
                { key: 'nome', label: 'Nome *', placeholder: 'Ex: Espresso' },
                { key: 'categoria', label: 'Categoria *', placeholder: 'Ex: Cafes Quentes' },
                { key: 'preco', label: 'Preco (R$) *', placeholder: '0,00', keyboard: 'decimal-pad' },
                { key: 'descricao', label: 'Descricao', placeholder: 'Descricao do produto...' },
              ].map(({ key, label, placeholder, keyboard }) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.text.tertiary}
                    value={(form as any)[key]}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
                    keyboardType={(keyboard as any) || 'default'}
                    autoCapitalize={key === 'preco' ? 'none' : 'sentences'}
                  />
                </View>
              ))}

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Disponivel no cardapio</Text>
                <Switch
                  value={form.disponivel}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, disponivel: v }))}
                  trackColor={{ false: COLORS.border.medium, true: COLORS.success }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.modalActions}>
                {modalMode === 'edit' && selectedProduto && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedProduto)}>
                    <Text style={styles.deleteBtnText}>Remover</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalMode(null)} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 24, color: '#fff', fontWeight: '700', lineHeight: 28 },

  catScroll: { maxHeight: 52, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border.light },
  catRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm, alignItems: 'center' },
  catBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  catBtnOn: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  catBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text.secondary },
  catBtnTextOn: { color: '#fff' },

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardBody: { padding: SPACING.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  cardNome: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary, flex: 1, marginRight: SPACING.sm },
  cardPreco: { fontSize: 16, fontWeight: '800', color: COLORS.brand },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCat: { fontSize: 12, color: COLORS.text.tertiary, fontWeight: '600' },
  cardDesc: { fontSize: 12, color: COLORS.text.tertiary, marginTop: SPACING.xs },

  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text.tertiary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text.tertiary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldInput: {
    height: 46,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    marginBottom: SPACING.sm,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  deleteBtn: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
