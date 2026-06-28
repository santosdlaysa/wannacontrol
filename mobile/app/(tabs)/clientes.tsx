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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Cliente } from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../../src/lib/constants';

type ModalMode = 'create' | 'edit' | 'detail';

const EMPTY_FORM = {
  nome: '',
  telefone: '',
  endereco: '',
  complemento: '',
  bairro: '',
  cidade: '',
  observacao: '',
};

export default function ClientesScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchClientes = useCallback(async () => {
    try {
      const data = await apiClient.get<Cliente[]>('/clientes');
      setClientes(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const filtered = useMemo(() => {
    if (!busca.trim()) return clientes;
    const q = busca.toLowerCase();
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.telefone.includes(q),
    );
  }, [clientes, busca]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedCliente(null);
    setModalMode('create');
  };

  const openEdit = (cliente: Cliente) => {
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco ?? '',
      complemento: cliente.complemento ?? '',
      bairro: cliente.bairro ?? '',
      cidade: cliente.cidade ?? '',
      observacao: cliente.observacao ?? '',
    });
    setSelectedCliente(cliente);
    setModalMode('edit');
  };

  const openDetail = async (cliente: Cliente) => {
    try {
      const detail = await apiClient.get<Cliente>(`/clientes/${cliente.id}`);
      setSelectedCliente(detail);
      setModalMode('detail');
    } catch {
      setSelectedCliente(cliente);
      setModalMode('detail');
    }
  };

  const handleSave = useCallback(async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      Alert.alert('Aviso', 'Nome e telefone sao obrigatorios.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim() || undefined,
        complemento: form.complemento.trim() || undefined,
        bairro: form.bairro.trim() || undefined,
        cidade: form.cidade.trim() || undefined,
        observacao: form.observacao.trim() || undefined,
      };

      if (modalMode === 'create') {
        await apiClient.post('/clientes', payload);
      } else if (modalMode === 'edit' && selectedCliente) {
        await apiClient.put(`/clientes/${selectedCliente.id}`, payload);
      }

      setModalMode(null);
      fetchClientes();
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  }, [form, modalMode, selectedCliente, fetchClientes]);

  const handleDelete = useCallback((cliente: Cliente) => {
    Alert.alert(
      'Remover cliente',
      `Deseja remover ${cliente.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/clientes/${cliente.id}`);
              setModalMode(null);
              fetchClientes();
            } catch (err: any) {
              Alert.alert('Erro', err?.message || 'Erro ao remover');
            }
          },
        },
      ],
    );
  }, [fetchClientes]);

  const getInitials = (nome: string) =>
    nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Search + Add */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou telefone..."
          placeholderTextColor={COLORS.text.tertiary}
          value={busca}
          onChangeText={setBusca}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.nome)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardTel}>{item.telefone}</Text>
              {item.bairro ? <Text style={styles.cardEnd}>{item.bairro}</Text> : null}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.pedidosCount}>{(item as any)._count?.pedidos ?? 0}</Text>
              <Text style={styles.pedidosLabel}>pedidos</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchClientes(); }}
            colors={[COLORS.brand]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum cliente</Text>
            <Text style={styles.emptySub}>Toque em + para cadastrar</Text>
          </View>
        }
      />

      {/* Modal Create/Edit */}
      <Modal visible={modalMode === 'create' || modalMode === 'edit'} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
              </Text>

              {[
                { key: 'nome', label: 'Nome *', placeholder: 'Ex: Joao Silva' },
                { key: 'telefone', label: 'Telefone *', placeholder: '(00) 00000-0000', keyboard: 'phone-pad' },
                { key: 'endereco', label: 'Endereco', placeholder: 'Rua, numero' },
                { key: 'complemento', label: 'Complemento', placeholder: 'Apto, bloco...' },
                { key: 'bairro', label: 'Bairro', placeholder: 'Ex: Centro' },
                { key: 'cidade', label: 'Cidade', placeholder: 'Ex: Sao Paulo' },
                { key: 'observacao', label: 'Observacoes', placeholder: 'Alergias, preferenicas...' },
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
                    autoCapitalize={key === 'telefone' ? 'none' : 'words'}
                  />
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalMode(null)}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Detail */}
      <Modal visible={modalMode === 'detail'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
            {selectedCliente && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <View style={[styles.avatar, styles.avatarLarge]}>
                    <Text style={[styles.avatarText, styles.avatarTextLarge]}>
                      {getInitials(selectedCliente.nome)}
                    </Text>
                  </View>
                  <Text style={styles.detailNome}>{selectedCliente.nome}</Text>
                  <Text style={styles.detailTel}>{selectedCliente.telefone}</Text>
                </View>

                {(selectedCliente.endereco || selectedCliente.bairro || selectedCliente.cidade) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Endereco</Text>
                    {selectedCliente.endereco && <Text style={styles.detailText}>{selectedCliente.endereco}</Text>}
                    {selectedCliente.complemento && <Text style={styles.detailText}>{selectedCliente.complemento}</Text>}
                    {(selectedCliente.bairro || selectedCliente.cidade) && (
                      <Text style={styles.detailText}>
                        {[selectedCliente.bairro, selectedCliente.cidade].filter(Boolean).join(' - ')}
                      </Text>
                    )}
                  </View>
                )}

                {selectedCliente.observacao && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Observacoes</Text>
                    <Text style={styles.detailText}>{selectedCliente.observacao}</Text>
                  </View>
                )}

                {selectedCliente.pedidos && selectedCliente.pedidos.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      Historico ({selectedCliente.pedidos.length} pedidos)
                    </Text>
                    {selectedCliente.pedidos.slice(0, 5).map((pedido) => {
                      const total = pedido.itens?.reduce(
                        (s, i) => s + Number(i.precoUnitario) * i.quantidade, 0
                      ) ?? 0;
                      return (
                        <View key={pedido.id} style={styles.pedidoRow}>
                          <Text style={styles.pedidoRowId}>
                            Pedido #{pedido.id}
                            {pedido.mesa ? ` - Mesa ${pedido.mesa.numero}` : ''}
                          </Text>
                          <Text style={styles.pedidoRowTotal}>{formatBRL(total)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalMode(null)}
                  >
                    <Text style={styles.cancelBtnText}>Fechar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEdit(selectedCliente)}
                  >
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(selectedCliente)}
                  >
                    <Text style={styles.deleteBtnText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  searchRow: {
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

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: COLORS.brand },
  avatarLarge: { width: 64, height: 64, borderRadius: 32 },
  avatarTextLarge: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  cardTel: { fontSize: 13, color: COLORS.text.tertiary, marginTop: 2 },
  cardEnd: { fontSize: 12, color: COLORS.text.tertiary, marginTop: 1 },
  cardRight: { alignItems: 'center' },
  pedidosCount: { fontSize: 20, fontWeight: '800', color: COLORS.brand },
  pedidosLabel: { fontSize: 10, color: COLORS.text.tertiary, fontWeight: '600' },

  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text.tertiary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
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

  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
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
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },

  // Detail
  detailHeader: { alignItems: 'center', marginBottom: 20 },
  detailNome: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginTop: 12 },
  detailTel: { fontSize: 14, color: COLORS.text.tertiary, marginTop: 4 },
  detailSection: { marginBottom: 16 },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailText: { fontSize: 14, color: COLORS.text.secondary, lineHeight: 22 },
  pedidoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  pedidoRowId: { fontSize: 13, color: COLORS.text.secondary, fontWeight: '500' },
  pedidoRowTotal: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary },
});
