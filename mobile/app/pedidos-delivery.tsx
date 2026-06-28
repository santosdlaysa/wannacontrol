import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SOCKET_EVENTS,
  StatusEntrega,
  TipoPedido,
  type Pedido,
} from '@cafecontrol/shared';
import { apiClient } from '../src/lib/api-client';
import { useSocket } from '../src/providers/SocketProvider';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../src/lib/constants';

const STATUS_ENTREGA_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; next: StatusEntrega | null; nextLabel: string }
> = {
  RECEBIDO:     { label: 'Recebido',        color: '#9E9E9E', bg: '#F5F5F5',   next: StatusEntrega.CONFIRMADO,   nextLabel: 'Confirmar pedido' },
  CONFIRMADO:   { label: 'Confirmado',      color: '#1976D2', bg: '#E3F2FD',   next: StatusEntrega.EM_PREPARO,   nextLabel: 'Iniciar preparo' },
  EM_PREPARO:   { label: 'Em preparo',      color: '#FF6B35', bg: '#FFF0EB',   next: StatusEntrega.PRONTO,       nextLabel: 'Marcar pronto' },
  PRONTO:       { label: 'Pronto',          color: COLORS.success, bg: '#E8F5E9', next: StatusEntrega.SAIU_ENTREGA, nextLabel: 'Saiu para entrega' },
  SAIU_ENTREGA: { label: 'Saiu p/ entrega', color: COLORS.brand, bg: '#FFF3E0', next: StatusEntrega.ENTREGUE,    nextLabel: 'Confirmar entrega' },
  ENTREGUE:     { label: 'Entregue',        color: COLORS.success, bg: '#E8F5E9', next: null, nextLabel: '' },
  CANCELADO:    { label: 'Cancelado',       color: COLORS.danger,  bg: COLORS.dangerBg, next: null, nextLabel: '' },
};

type Filter = 'aberto' | 'entregue' | 'todos';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'aberto',   label: 'Em andamento' },
  { key: 'entregue', label: 'Finalizados' },
  { key: 'todos',    label: 'Todos' },
];

export default function PedidosDeliveryScreen() {
  const { socket } = useSocket();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('aberto');
  const [detail, setDetail] = useState<Pedido | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchPedidos = useCallback(async () => {
    try {
      const all = await apiClient.get<Pedido[]>('/pedidos');
      // Filtrar apenas delivery e retirada
      const delivery = all.filter(
        (p) => p.tipoPedido === TipoPedido.DELIVERY || p.tipoPedido === TipoPedido.RETIRADA,
      );
      setPedidos(delivery);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchPedidos();
    socket.on(SOCKET_EVENTS.ORDER_CLOSED, handler);
    socket.on(SOCKET_EVENTS.NEW_ORDER_ITEMS, handler);
    return () => {
      socket.off(SOCKET_EVENTS.ORDER_CLOSED, handler);
      socket.off(SOCKET_EVENTS.NEW_ORDER_ITEMS, handler);
    };
  }, [socket, fetchPedidos]);

  const filtered = useMemo(() => {
    if (filter === 'aberto') return pedidos.filter((p) => p.statusPedido === 'ABERTO');
    if (filter === 'entregue') return pedidos.filter((p) => p.statusPedido === 'PAGO' || p.statusPedido === 'CANCELADO');
    return pedidos;
  }, [pedidos, filter]);

  const avancarStatus = useCallback(async (pedido: Pedido) => {
    const cfg = STATUS_ENTREGA_CONFIG[pedido.statusEntrega ?? 'RECEBIDO'];
    if (!cfg?.next) return;

    setAdvancing(true);
    try {
      // Atualizar statusEntrega via patch no pedido
      // Se o proximo for ENTREGUE, fechar o pedido
      if (cfg.next === StatusEntrega.ENTREGUE) {
        await apiClient.patch(`/pedidos/${pedido.id}/fechar`, {});
      } else {
        await apiClient.patch(`/pedidos/${pedido.id}/status-entrega`, { statusEntrega: cfg.next });
      }
      await fetchPedidos();
      // Atualizar o detalhe se estiver aberto
      if (detail?.id === pedido.id) {
        const updated = await apiClient.get<Pedido>(`/pedidos/${pedido.id}`);
        setDetail(updated);
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao atualizar status');
    } finally {
      setAdvancing(false);
    }
  }, [detail, fetchPedidos]);

  const cancelarPedido = useCallback(async (pedido: Pedido) => {
    Alert.alert('Cancelar pedido', `Confirma o cancelamento do pedido #${pedido.id}?`, [
      { text: 'Nao', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await apiClient.patch(`/pedidos/${pedido.id}/cancelar`, {});
            setDetail(null);
            fetchPedidos();
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Erro ao cancelar');
          } finally {
            setCancelling(false); }
        },
      },
    ]);
  }, [fetchPedidos]);

  const openDetail = useCallback(async (pedido: Pedido) => {
    try {
      const d = await apiClient.get<Pedido>(`/pedidos/${pedido.id}`);
      setDetail(d);
    } catch {
      setDetail(pedido);
    }
  }, []);

  const calcTotal = (p: Pedido) => {
    const itensTotal = p.itens?.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0) ?? 0;
    return itensTotal + Number(p.taxaEntrega ?? 0);
  };

  const formatHora = (d: string | Date) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, on && styles.filterBtnOn]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id.toString()}
        renderItem={({ item }) => {
          const cfg = STATUS_ENTREGA_CONFIG[item.statusEntrega ?? 'RECEBIDO'] ?? STATUS_ENTREGA_CONFIG.RECEBIDO;
          const total = calcTotal(item);
          return (
            <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} activeOpacity={0.8}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardId}>Pedido #{item.id}</Text>
                  <Text style={styles.cardTipo}>
                    {item.tipoPedido === TipoPedido.DELIVERY ? 'Delivery' : 'Retirada'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              <Text style={styles.cardCliente}>
                {item.clienteNome ?? 'Cliente nao identificado'}
                {item.clienteTelefone ? `  •  ${item.clienteTelefone}` : ''}
              </Text>

              {item.enderecoEntrega ? (
                <Text style={styles.cardEndereco} numberOfLines={1}>{item.enderecoEntrega}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardHora}>{formatHora(item.dataCriacao)}</Text>
                <Text style={styles.cardTotal}>{formatBRL(total)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPedidos(); }} colors={[COLORS.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum pedido</Text>
            <Text style={styles.emptySub}>
              {filter === 'aberto' ? 'Nenhum pedido em andamento' : 'Nenhum pedido encontrado'}
            </Text>
          </View>
        }
      />

      {/* Modal Detalhe */}
      <Modal visible={!!detail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {detail && (() => {
              const cfg = STATUS_ENTREGA_CONFIG[detail.statusEntrega ?? 'RECEBIDO'] ?? STATUS_ENTREGA_CONFIG.RECEBIDO;
              const total = calcTotal(detail);
              const isOpen = detail.statusPedido === 'ABERTO';
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header */}
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailId}>Pedido #{detail.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  {/* Tipo */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tipo</Text>
                    <Text style={styles.infoValue}>
                      {detail.tipoPedido === TipoPedido.DELIVERY ? 'Delivery' : 'Retirada'}
                    </Text>
                  </View>

                  {/* Cliente */}
                  {detail.clienteNome && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Cliente</Text>
                      <Text style={styles.infoValue}>{detail.clienteNome}</Text>
                    </View>
                  )}
                  {detail.clienteTelefone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Telefone</Text>
                      <Text style={styles.infoValue}>{detail.clienteTelefone}</Text>
                    </View>
                  )}
                  {detail.enderecoEntrega && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Endereco</Text>
                      <Text style={styles.infoValue}>{detail.enderecoEntrega}</Text>
                    </View>
                  )}
                  {detail.observacao && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Obs</Text>
                      <Text style={styles.infoValue}>{detail.observacao}</Text>
                    </View>
                  )}

                  {/* Itens */}
                  {detail.itens && detail.itens.length > 0 && (
                    <View style={styles.itensList}>
                      <Text style={styles.itensTitulo}>Itens</Text>
                      {detail.itens.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <Text style={styles.itemNome}>
                            {item.quantidade}x {item.produto?.nome ?? `Produto #${item.produtoId}`}
                          </Text>
                          <Text style={styles.itemPreco}>
                            {formatBRL(Number(item.precoUnitario) * item.quantidade)}
                          </Text>
                        </View>
                      ))}
                      {Number(detail.taxaEntrega ?? 0) > 0 && (
                        <View style={styles.itemRow}>
                          <Text style={styles.itemNome}>Taxa de entrega</Text>
                          <Text style={styles.itemPreco}>{formatBRL(Number(detail.taxaEntrega))}</Text>
                        </View>
                      )}
                      <View style={[styles.itemRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatBRL(total)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Acoes */}
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.closeModalBtn}
                      onPress={() => setDetail(null)}
                    >
                      <Text style={styles.closeModalText}>Fechar</Text>
                    </TouchableOpacity>

                    {isOpen && cfg.next && (
                      <TouchableOpacity
                        style={[styles.advanceBtn, { backgroundColor: cfg.color }, advancing && { opacity: 0.5 }]}
                        onPress={() => avancarStatus(detail)}
                        disabled={advancing}
                        activeOpacity={0.85}
                      >
                        {advancing
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.advanceBtnText}>{cfg.nextLabel}</Text>
                        }
                      </TouchableOpacity>
                    )}

                    {isOpen && (
                      <TouchableOpacity
                        style={[styles.cancelPedidoBtn, cancelling && { opacity: 0.5 }]}
                        onPress={() => cancelarPedido(detail)}
                        disabled={cancelling}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.cancelPedidoText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  filterRow: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: 'center',
  },
  filterBtnOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.text.secondary },
  filterTextOn: { color: '#fff' },

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardId: { fontSize: 15, fontWeight: '800', color: COLORS.text.primary },
  cardTipo: { fontSize: 11, fontWeight: '700', color: COLORS.text.tertiary, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardCliente: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 2 },
  cardEndereco: { fontSize: 12, color: COLORS.text.tertiary, marginBottom: SPACING.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  cardHora: { fontSize: 12, color: COLORS.text.tertiary },
  cardTotal: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },

  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text.tertiary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '85%',
  },

  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  detailId: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  infoLabel: { fontSize: 13, color: COLORS.text.tertiary, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, maxWidth: '60%', textAlign: 'right' },

  itensList: { marginTop: SPACING.xl },
  itensTitulo: { fontSize: 12, fontWeight: '700', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  itemNome: { fontSize: 14, color: COLORS.text.secondary, flex: 1 },
  itemPreco: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  totalRow: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border.medium },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary },

  detailActions: { marginTop: SPACING.xl, gap: SPACING.sm },
  closeModalBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
  },
  closeModalText: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary },
  advanceBtn: {
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  advanceBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cancelPedidoBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
  },
  cancelPedidoText: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
});
