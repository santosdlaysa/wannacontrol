import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  SOCKET_EVENTS,
  type Pedido,
  type ItemStatusChangedPayload,
} from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { useSocket } from '../../src/providers/SocketProvider';
import { ItemPedidoRow } from '../../src/components/ItemPedidoRow';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../../src/lib/constants';

type PaymentMethod = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'PIX', label: 'Pix', icon: 'P' },
  { key: 'DINHEIRO', label: 'Dinheiro', icon: '$' },
  { key: 'CARTAO_CREDITO', label: 'Credito', icon: 'C' },
  { key: 'CARTAO_DEBITO', label: 'Debito', icon: 'D' },
];

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { socket } = useSocket();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('PIX');
  const [closing, setClosing] = useState(false);
  const [comprovante, setComprovante] = useState<string | null>(null);

  const fetchPedido = useCallback(async () => {
    try {
      const data = await apiClient.get<Pedido>(`/pedidos/${id}`);
      setPedido(data);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao carregar pedido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchPedido(); }, [fetchPedido]);

  useEffect(() => {
    if (!socket || !pedido) return;
    const handler = (payload: ItemStatusChangedPayload) => {
      if (payload.pedidoId !== pedido.id) return;
      setPedido((prev) => {
        if (!prev?.itens) return prev;
        return { ...prev, itens: prev.itens.map((item) => item.id === payload.itemId ? { ...item, statusPreparo: payload.novoStatus } : item) };
      });
    };
    socket.on(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handler);
    return () => { socket.off(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handler); };
  }, [socket, pedido?.id]);

  const subtotal = pedido?.itens?.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0) ?? 0;
  const totalItems = pedido?.itens?.reduce((s, i) => s + i.quantidade, 0) ?? 0;

  const needsReceipt = selectedPayment === 'CARTAO_CREDITO' || selectedPayment === 'CARTAO_DEBITO';

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Permita o acesso a camera para tirar foto do comprovante.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setComprovante(result.assets[0].uri);
    }
  }, []);

  const handlePickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setComprovante(result.assets[0].uri);
    }
  }, []);

  const handleConfirmClose = useCallback(async () => {
    if (!pedido) return;
    setClosing(true);
    try {
      await apiClient.patch(`/pedidos/${pedido.id}/fechar`);
      setShowCheckout(false);
      Alert.alert(
        'Conta Fechada',
        `Pedido #${pedido.id} encerrado.\nPagamento: ${PAYMENT_OPTIONS.find((p) => p.key === selectedPayment)?.label}\nTotal: ${formatBRL(subtotal)}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao fechar conta');
    } finally {
      setClosing(false);
    }
  }, [pedido, selectedPayment, subtotal, router]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  if (!pedido) return <View style={styles.center}><Text style={styles.noData}>Pedido nao encontrado</Text></View>;

  const isOpen = pedido.statusPedido === 'ABERTO';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Mesa ${pedido.mesa?.numero ?? '?'} - Pedido #${pedido.id}`,
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        }}
      />

      <FlatList
        data={pedido.itens || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ItemPedidoRow
            produtoNome={item.produto?.nome ?? `Produto #${item.produtoId}`}
            quantidade={item.quantidade}
            precoUnitario={item.precoUnitario}
            observacao={item.observacao}
            statusPreparo={item.statusPreparo}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPedido(); }} colors={[COLORS.brand]} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Garcom</Text>
                <Text style={styles.infoValue}>{pedido.garcom?.nome ?? '---'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: isOpen ? COLORS.success : COLORS.text.tertiary }]}>
                  {pedido.statusPedido}
                </Text>
              </View>
              {pedido.clienteNome && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Cliente</Text>
                    <Text style={styles.infoValue}>{pedido.clienteNome}</Text>
                  </View>
                </>
              )}
              {pedido.clienteTelefone && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Telefone</Text>
                    <Text style={styles.infoValue}>{pedido.clienteTelefone}</Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.itemsTitle}>Itens ({pedido.itens?.length ?? 0})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>Nenhum item no pedido</Text></View>
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(subtotal)}</Text>
        </View>
        {isOpen && (
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push({ pathname: '/(tabs)/novo-pedido', params: { pedidoId: pedido.id.toString(), mesaId: pedido.mesaId.toString() } })}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>+ Adicionar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => { setComprovante(null); setShowCheckout(true); }}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnText}>Fechar Conta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Checkout Modal */}
      <Modal visible={showCheckout} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Fechar Conta</Text>
                <Text style={styles.modalSubtitle}>
                  Mesa {pedido.mesa?.numero} - Pedido #{pedido.id}
                </Text>
              </View>

              {/* Client info */}
              {pedido.clienteNome && (
                <View style={styles.clientCard}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientInitial}>
                      {pedido.clienteNome.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>{pedido.clienteNome}</Text>
                    {pedido.clienteTelefone && (
                      <Text style={styles.clientTel}>{pedido.clienteTelefone}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Resumo dos itens */}
              <View style={styles.resumeCard}>
                <Text style={styles.resumeTitle}>Resumo</Text>
                {pedido.itens?.map((item) => (
                  <View key={item.id} style={styles.resumeRow}>
                    <Text style={styles.resumeItem} numberOfLines={1}>
                      {item.quantidade}x {item.produto?.nome ?? 'Item'}
                    </Text>
                    <Text style={styles.resumePrice}>
                      {formatBRL(Number(item.precoUnitario) * item.quantidade)}
                    </Text>
                  </View>
                ))}
                <View style={styles.resumeDivider} />
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeQty}>{totalItems} itens</Text>
                  <Text style={styles.resumeTotal}>{formatBRL(subtotal)}</Text>
                </View>
              </View>

              {/* Payment method */}
              <Text style={styles.payLabel}>Forma de Pagamento</Text>
              <View style={styles.payGrid}>
                {PAYMENT_OPTIONS.map((opt) => {
                  const active = selectedPayment === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.payCard, active && styles.payCardActive]}
                      onPress={() => { setSelectedPayment(opt.key); setComprovante(null); }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.payIcon, active && styles.payIconActive]}>
                        <Text style={[styles.payIconText, active && styles.payIconTextActive]}>
                          {opt.icon}
                        </Text>
                      </View>
                      <Text style={[styles.payText, active && styles.payTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Receipt photo - only for card payments */}
              {needsReceipt && (
                <View style={styles.receiptSection}>
                  <Text style={styles.payLabel}>Comprovante</Text>
                  {comprovante ? (
                    <View style={styles.receiptPreview}>
                      <Image source={{ uri: comprovante }} style={styles.receiptImage} />
                      <View style={styles.receiptActions}>
                        <TouchableOpacity style={styles.receiptBtn} onPress={handleTakePhoto}>
                          <Text style={styles.receiptBtnText}>Tirar outra</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.receiptBtnRemove} onPress={() => setComprovante(null)}>
                          <Text style={styles.receiptRemoveText}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.receiptEmpty}>
                      <TouchableOpacity style={styles.receiptCameraBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
                        <Text style={styles.receiptCameraIcon}>{'[ ]'}</Text>
                        <Text style={styles.receiptCameraText}>Tirar foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.receiptGalleryBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
                        <Text style={styles.receiptGalleryText}>Escolher da galeria</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowCheckout(false)}
                  disabled={closing}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirm, closing && { opacity: 0.5 }]}
                  onPress={handleConfirmClose}
                  disabled={closing}
                  activeOpacity={0.85}
                >
                  {closing ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalConfirmText}>
                      Confirmar {formatBRL(subtotal)}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  noData: { fontSize: 15, color: COLORS.text.tertiary },
  list: { padding: 20, paddingBottom: 180 },

  headerSection: { marginBottom: 8 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  infoLabel: { fontSize: 14, color: COLORS.text.secondary, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  divider: { height: 1, backgroundColor: COLORS.border.light, marginHorizontal: 18 },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.text.tertiary },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  totalValue: { fontSize: 26, fontWeight: '800', color: COLORS.text.primary },
  footerActions: { flexDirection: 'row', gap: 10 },
  addBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  closeBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  // Checkout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },

  // Client
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  clientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  clientTel: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },

  // Resume
  resumeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  resumeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  resumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  resumeItem: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
    marginRight: 12,
  },
  resumePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  resumeDivider: {
    height: 1,
    backgroundColor: COLORS.border.medium,
    marginVertical: 10,
  },
  resumeQty: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
  resumeTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text.primary,
  },

  // Payment
  payLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  payGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  payCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  payCardActive: {
    borderColor: COLORS.brand,
    backgroundColor: '#FFF8F0',
  },
  payIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payIconActive: {
    backgroundColor: COLORS.brand,
  },
  payIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },
  payIconTextActive: {
    color: COLORS.white,
  },
  payText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.tertiary,
  },
  payTextActive: {
    color: COLORS.brand,
    fontWeight: '700',
  },

  // Receipt
  receiptSection: {
    marginBottom: 24,
  },
  receiptPreview: {
    alignItems: 'center',
    gap: 12,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 12,
  },
  receiptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.brand,
  },
  receiptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  receiptBtnRemove: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  receiptRemoveText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  receiptEmpty: {
    gap: 10,
  },
  receiptCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    borderStyle: 'dashed',
  },
  receiptCameraIcon: {
    fontSize: 20,
    color: COLORS.text.tertiary,
  },
  receiptCameraText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  receiptGalleryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptGalleryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brand,
  },

  // Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  modalConfirm: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
