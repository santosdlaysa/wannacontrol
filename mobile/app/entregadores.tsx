import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal,
  Alert, Switch, ScrollView,
} from 'react-native';
import { apiClient } from '../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../src/lib/constants';

interface Entregador {
  id: number;
  nome: string;
  telefone: string | null;
  veiculo: string | null;
  placa: string | null;
  ativo: boolean;
}

interface EntForm {
  nome: string;
  telefone: string;
  veiculo: string;
  placa: string;
  ativo: boolean;
}

const EMPTY: EntForm = { nome: '', telefone: '', veiculo: '', placa: '', ativo: true };

export default function EntregadoresScreen() {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EntForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiClient.get<Entregador[]>('/entregadores');
      setEntregadores(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() { setForm(EMPTY); setEditingId(null); setModalOpen(true); }

  function openEdit(e: Entregador) {
    setForm({
      nome: e.nome,
      telefone: e.telefone ?? '',
      veiculo: e.veiculo ?? '',
      placa: e.placa ?? '',
      ativo: e.ativo,
    });
    setEditingId(e.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { Alert.alert('Aviso', 'Nome obrigatorio'); return; }
    setSaving(true);
    try {
      const body = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || null,
        veiculo: form.veiculo.trim() || null,
        placa: form.placa.trim() || null,
        ativo: form.ativo,
      };
      if (editingId) await apiClient.put(`/entregadores/${editingId}`, body);
      else await apiClient.post('/entregadores', body);
      setModalOpen(false);
      fetchData();
    } catch (e: any) { Alert.alert('Erro', e?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  async function handleDelete(e: Entregador) {
    Alert.alert('Remover', `Remover entregador "${e.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await apiClient.delete(`/entregadores/${e.id}`); fetchData(); }
        catch (err: any) { Alert.alert('Erro', err?.message || 'Erro'); }
      }},
    ]);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.brand} size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.title}>Entregadores</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={entregadores}
        keyExtractor={(e) => e.id.toString()}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.brand]} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <View style={s.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardNome}>{item.nome}</Text>
                {item.telefone ? <Text style={s.cardSub}>{item.telefone}</Text> : null}
                <View style={s.cardMetaRow}>
                  {item.veiculo ? <Text style={s.cardMeta}>{item.veiculo}</Text> : null}
                  {item.placa ? <Text style={s.cardMeta}> | {item.placa}</Text> : null}
                </View>
              </View>
              <View style={[s.badge, { backgroundColor: item.ativo ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.badgeText, { color: item.ativo ? '#166534' : '#991b1b' }]}>
                  {item.ativo ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Nenhum entregador</Text></View>}
      />

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <ScrollView>
              <Text style={s.modalTitle}>{editingId ? 'Editar Entregador' : 'Novo Entregador'}</Text>

              <Text style={s.label}>Nome *</Text>
              <TextInput style={s.input} value={form.nome} onChangeText={v => setForm(p => ({ ...p, nome: v }))} placeholder="Nome do entregador" placeholderTextColor={COLORS.text.tertiary} />

              <Text style={s.label}>Telefone</Text>
              <TextInput style={s.input} value={form.telefone} onChangeText={v => setForm(p => ({ ...p, telefone: v }))} placeholder="(00) 00000-0000" placeholderTextColor={COLORS.text.tertiary} keyboardType="phone-pad" />

              <Text style={s.label}>Veiculo</Text>
              <TextInput style={s.input} value={form.veiculo} onChangeText={v => setForm(p => ({ ...p, veiculo: v }))} placeholder="Ex: Moto, Carro..." placeholderTextColor={COLORS.text.tertiary} />

              <Text style={s.label}>Placa</Text>
              <TextInput style={s.input} value={form.placa} onChangeText={v => setForm(p => ({ ...p, placa: v }))} placeholder="Ex: ABC-1234" placeholderTextColor={COLORS.text.tertiary} autoCapitalize="characters" />

              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Ativo</Text>
                <Switch
                  value={form.ativo}
                  onValueChange={v => setForm(p => ({ ...p, ativo: v }))}
                  trackColor={{ false: COLORS.border?.medium || '#ccc', true: COLORS.success || '#22c55e' }}
                  thumbColor="#fff"
                />
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
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(entregadores.find(e => e.id === editingId)!)}>
                  <Text style={s.deleteText}>Remover Entregador</Text>
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
  cardSub: { fontSize: 12, color: COLORS.text.tertiary, marginTop: 2 },
  cardMetaRow: { flexDirection: 'row', marginTop: 4 },
  cardMeta: { fontSize: 11, color: COLORS.text.tertiary },
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
