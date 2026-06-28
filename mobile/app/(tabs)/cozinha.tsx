import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  SOCKET_EVENTS,
  StatusPreparo,
  type Pedido,
  type NewOrderItemsPayload,
} from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { useSocket } from '../../src/providers/SocketProvider';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/lib/constants';

interface KitchenItem {
  itemId: number;
  pedidoId: number;
  mesaNumero: number;
  clienteNome: string | null;
  produtoNome: string;
  quantidade: number;
  observacao: string | null;
  statusPreparo: StatusPreparo;
  criadoEm: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; next: StatusPreparo | null; nextLabel: string }
> = {
  PENDENTE: { label: 'Pendente', color: '#FF6B35', bg: '#FFF0EB', next: StatusPreparo.PREPARANDO, nextLabel: 'Iniciar preparo' },
  PREPARANDO: { label: 'Em preparo', color: '#1976D2', bg: '#E3F2FD', next: StatusPreparo.PRONTO, nextLabel: 'Marcar como pronto' },
  PRONTO: { label: 'Pronto', color: COLORS.success, bg: '#E8F5E9', next: null, nextLabel: '' },
};

export default function CozinhaScreen() {
  const { socket } = useSocket();
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<Set<number>>(new Set());

  const fetchItems = useCallback(async () => {
    try {
      const pedidos = await apiClient.get<Pedido[]>('/pedidos?status=ABERTO');
      const kitchenItems: KitchenItem[] = [];
      for (const pedido of pedidos) {
        if (!pedido.itens) continue;
        for (const item of pedido.itens) {
          if (item.statusPreparo === StatusPreparo.ENTREGUE) continue;
          kitchenItems.push({
            itemId: item.id,
            pedidoId: pedido.id,
            mesaNumero: pedido.mesa?.numero ?? 0,
            clienteNome: pedido.clienteNome ?? null,
            produtoNome: item.produto?.nome ?? `Produto #${item.produtoId}`,
            quantidade: item.quantidade,
            observacao: item.observacao ?? null,
            statusPreparo: item.statusPreparo,
            criadoEm: String(item.criadoEm),
          });
        }
      }
      // Ordem: PENDENTE primeiro, depois PREPARANDO, depois PRONTO
      const order = ['PENDENTE', 'PREPARANDO', 'PRONTO'];
      kitchenItems.sort((a, b) => order.indexOf(a.statusPreparo) - order.indexOf(b.statusPreparo));
      setItems(kitchenItems);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchItems();
    socket.on(SOCKET_EVENTS.NEW_ORDER_ITEMS, handler);
    socket.on(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handler);
    return () => {
      socket.off(SOCKET_EVENTS.NEW_ORDER_ITEMS, handler);
      socket.off(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handler);
    };
  }, [socket, fetchItems]);

  const avancarStatus = useCallback(async (item: KitchenItem) => {
    const cfg = STATUS_CONFIG[item.statusPreparo];
    if (!cfg?.next) return;

    setUpdating((prev) => new Set(prev).add(item.itemId));
    try {
      await apiClient.patch(`/pedidos/${item.pedidoId}/itens/${item.itemId}/status`, {
        statusPreparo: cfg.next,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.itemId === item.itemId ? { ...i, statusPreparo: cfg.next! } : i,
        ),
      );
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao atualizar status');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(item.itemId);
        return next;
      });
    }
  }, []);

  const pendentes = items.filter((i) => i.statusPreparo === StatusPreparo.PENDENTE).length;
  const emPreparo = items.filter((i) => i.statusPreparo === StatusPreparo.PREPARANDO).length;
  const prontos = items.filter((i) => i.statusPreparo === StatusPreparo.PRONTO).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Contadores */}
      <View style={styles.counters}>
        <View style={[styles.counter, { backgroundColor: '#FFF0EB' }]}>
          <Text style={[styles.counterNum, { color: '#FF6B35' }]}>{pendentes}</Text>
          <Text style={styles.counterLabel}>Pendentes</Text>
        </View>
        <View style={[styles.counter, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.counterNum, { color: '#1976D2' }]}>{emPreparo}</Text>
          <Text style={styles.counterLabel}>Em preparo</Text>
        </View>
        <View style={[styles.counter, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.counterNum, { color: COLORS.success }]}>{prontos}</Text>
          <Text style={styles.counterLabel}>Prontos</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => `${i.itemId}`}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.statusPreparo];
          const isUpdating = updating.has(item.itemId);
          const canAdvance = !!cfg?.next;

          return (
            <View style={styles.card}>
              <View style={[styles.cardAccent, { backgroundColor: cfg?.color }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardMesa}>
                    {item.mesaNumero > 0 ? `Mesa ${item.mesaNumero}` : 'Delivery'}
                    {item.clienteNome ? ` • ${item.clienteNome}` : ''}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg?.bg }]}>
                    <Text style={[styles.statusText, { color: cfg?.color }]}>{cfg?.label}</Text>
                  </View>
                </View>

                <Text style={styles.produtoNome}>
                  {item.quantidade}x {item.produtoNome}
                </Text>

                {item.observacao ? (
                  <Text style={styles.observacao}>Obs: {item.observacao}</Text>
                ) : null}

                {canAdvance && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: cfg?.color }, isUpdating && styles.actionBtnOff]}
                    onPress={() => avancarStatus(item)}
                    disabled={isUpdating}
                    activeOpacity={0.8}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionBtnText}>{cfg?.nextLabel}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchItems(); }}
            colors={[COLORS.brand]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Cozinha livre</Text>
            <Text style={styles.emptySub}>Nenhum item aguardando preparo</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  counters: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  counter: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  counterNum: { fontSize: 24, fontWeight: '800' },
  counterLabel: { fontSize: 10, fontWeight: '600', color: COLORS.text.tertiary, marginTop: 2 },

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: SPACING.md, gap: SPACING.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMesa: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, flex: 1 },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  produtoNome: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  observacao: { fontSize: 12, color: COLORS.text.tertiary, fontStyle: 'italic' },

  actionBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnOff: { opacity: 0.5 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text.tertiary, textAlign: 'center' },
});
