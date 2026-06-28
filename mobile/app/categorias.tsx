import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal,
  Alert, Switch, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../src/lib/constants';

interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  _count?: { produtos: number };
}

interface CatForm {
  nome: string;
  descricao: string;
  ativo: boolean;
  ordem: string;
}

const EMPTY: CatForm = { nome: '', descricao: '', ativo: true, ordem: '0' };

export default function CategoriasScreen() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = await apiClient.get<Categoria[]>('/categorias');
      setCategorias(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openCreate() { setForm(EMPTY); setEditingId(null); setModalOpen(true); }

  function openEdit(c: Categoria) {
    setForm({ nome: c.nome, descricao: c.descricao ?? '', ativo: c.ativo, ordem: String(c.ordem) });
    setEditingId(c.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { Alert.alert('Aviso', 'Nome obrigatorio'); return; }
    setSaving(true);
    try {
      const body = { nome: form.nome.trim(), descricao: form.descricao.trim() || null, ativo: form.ativo, ordem: Number(form.ordem) || 0 };
      if (editingId) await apiClient.put(`/categorias/${editingId}`, body);
      else await apiClient.post('/categorias', body);
      setModalOpen(false);
      fetch();
    } catch (e: any) { Alert.alert('Erro', e?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: Categoria) {
    Alert.alert('Remover', `Remover categoria "${c.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await apiClient.delete(`/categorias/${c.id}`); fetch(); }
        catch (e: any) { Alert.alert('Erro', e?.message || 'Erro'); }
      }},
    ]);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.title}>Categorias</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categorias}
        keyExtractor={(c) => c.id.toString()}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} colors={[COLORS.brand]} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <View style={s.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardNome}>{item.nome}</Text>
                {item.descricao ? <Text style={s.cardDesc} numberOfLines={1}>{item.descricao}</Text> : null}
                <Text style={s.cardSub}>{item._count?.produtos ?? 0} produto(s)</Text>
              </View>
              <View style={[s.badge, { backgroundColor: item.ativo ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.badgeText, { color: item.ativo ? '#166534' : '#991b1b' }]}>
                  {item.ativo ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Nenhuma categoria</Text></View>}
      />

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView>
              <Text style={s.modalTitle}>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</Text>
              <Text style={s.label}>Nome *</Text>
              <TextInput style={s.input} value={form.nome} onChangeText={v => setForm(p => ({ ...p, nome: v }))} placeholder="Nome da categoria" placeholderTextColor={COLORS.text.tertiary} />
              <Text style={s.label}>Descricao</Text>
              <TextInput style={s.input} value={form.descricao} onChangeText={v => setForm(p => ({ ...p, descricao: v }))} placeholder="Descricao..." placeholderTextColor={COLORS.text.tertiary} />
              <Text style={s.label}>Ordem</Text>
              <TextInput style={s.input} value={form.ordem} onChangeText={v => setForm(p => ({ ...p, ordem: v }))} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.text.tertiary} />
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Ativo</Text>
                <Switch value={form.ativo} onValueChange={v => setForm(p => ({ ...p, ativo: v }))} trackColor={{ false: COLORS.border?.medium || '#ccc', true: COLORS.success || '#22c55e' }} thumbColor="#fff" />
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalOpen(false)}>
                  <Text style={s.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveText}>Salvar</Text>}
                </TouchableOpacity>
              </View>
              {editingId && (
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(categorias.find(c => c.id === editingId)!)}>
                  <Text style={s.deleteText}>Remover Categoria</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border?.light || '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary },
  addBtn: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, color: '#fff', fontWeight: '700', lineHeight: 26 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, padding: SPACING.lg, ...SHADOWS.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardNome: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  cardDesc: { fontSize: 12, color: COLORS.text.tertiary, marginTop: 2 },
  cardSub: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.text.tertiary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 14 },
  input: { height: 46, backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, fontSize: 15, color: COLORS.text.primary, borderWidth: 1, borderColor: COLORS.border?.light || '#e5e7eb' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border?.light || '#e5e7eb' },
  switchLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border?.medium || '#d1d5db', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.brand, alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  deleteBtn: { marginTop: 12, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: '#fee2e2', alignItems: 'center' },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
});
