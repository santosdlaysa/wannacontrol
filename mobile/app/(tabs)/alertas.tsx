import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import {
  SOCKET_EVENTS,
  StatusPreparo,
  type ItemReadyPayload,
  type Pedido,
} from '@chefflow/shared';
import { apiClient } from '../../src/lib/api-client';
import { useSocket } from '../../src/providers/SocketProvider';
import { COLORS, SPACING } from '../../src/lib/constants';

interface AlertItem {
  key: string;
  itemId: number;
  pedidoId: number;
  mesaNumero: number;
  produtoNome: string;
  quantidade: number;
  timestamp: Date;
}

export default function AlertasScreen() {
  const { socket } = useSocket();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [delivering, setDelivering] = useState<Set<number>>(new Set());

  const fetchReadyItems = useCallback(async () => {
    try {
      const pedidos = await apiClient.get<Pedido[]>('/pedidos?status=ABERTO');
      const readyItems: AlertItem[] = [];

      for (const pedido of pedidos) {
        if (!pedido.itens) continue;
        for (const item of pedido.itens) {
          if (item.statusPreparo === StatusPreparo.PRONTO) {
            readyItems.push({
              key: `item-${item.id}`,
              itemId: item.id,
              pedidoId: pedido.id,
              mesaNumero: pedido.mesa?.numero ?? 0,
              produtoNome: item.produto?.nome ?? `Produto #${item.produtoId}`,
              quantidade: item.quantidade,
              timestamp: new Date(item.criadoEm),
            });
          }
        }
      }

      setAlerts(readyItems);
    } catch {
      // retry next poll
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReadyItems(); }, [fetchReadyItems]);

  useEffect(() => {
    const interval = setInterval(fetchReadyItems, 15000);
    return () => clearInterval(interval);
  }, [fetchReadyItems]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchReadyItems();
    socket.on(SOCKET_EVENTS.ITEM_READY, handler);
    socket.on(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handler);
    return () => {
      socket.off(SOCKET_EVENTS.ITEM_READY, handler);
      socket.off(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handler);
    };
  }, [socket, fetchReadyItems]);

  useEffect(() => {
    if ((global as any).__resetAlertCount) (global as any).__resetAlertCount();
  }, [alerts]);

  const markDelivered = useCallback(async (item: AlertItem) => {
    setDelivering((prev) => new Set(prev).add(item.itemId));
    try {
      await apiClient.patch(`/pedidos/${item.pedidoId}/itens/${item.itemId}/status`, {
        statusPreparo: StatusPreparo.ENTREGUE,
      });
      // Remove from list immediately
      setAlerts((prev) => prev.filter((a) => a.itemId !== item.itemId));
      // Refresh badge count
      if ((global as any).__refreshAlertCount) (global as any).__refreshAlertCount();
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao marcar como entregue');
    } finally {
      setDelivering((prev) => {
        const next = new Set(prev);
        next.delete(item.itemId);
        return next;
      });
    }
  }, []);

  const formatTime = (d: Date) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  return (
    <View style={styles.container}>
      {alerts.length > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.topText}>
            {alerts.length} {alerts.length === 1 ? 'item pronto' : 'itens prontos'}
          </Text>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => {
          const isDelivering = delivering.has(item.itemId);
          return (
            <View style={styles.card}>
              <View style={styles.accent} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardMesa}>Mesa {item.mesaNumero}</Text>
                  <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
                </View>
                <Text style={styles.cardProduct}>
                  {item.quantidade}x {item.produtoNome}
                </Text>
                <Text style={styles.cardHint}>Pronto para entregar</Text>

                <TouchableOpacity
                  style={[styles.deliverBtn, isDelivering && styles.deliverBtnOff]}
                  onPress={() => markDelivered(item)}
                  disabled={isDelivering}
                  activeOpacity={0.8}
                >
                  {isDelivering ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.deliverText}>Entreguei</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchReadyItems(); }}
            colors={[COLORS.brand]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Tudo entregue</Text>
            <Text style={styles.emptySub}>
              Quando itens ficarem prontos na cozinha,{'\n'}eles aparecerao aqui
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  topText: { fontSize: 14, fontWeight: '700', color: COLORS.text.secondary },

  list: { padding: 20 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  accent: { width: 4, alignSelf: 'stretch', backgroundColor: COLORS.success },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMesa: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  cardTime: { fontSize: 11, color: COLORS.text.tertiary, fontWeight: '500' },
  cardProduct: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary },
  cardHint: { fontSize: 12, color: COLORS.success, fontWeight: '600' },

  deliverBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  deliverBtnOff: { opacity: 0.5 },
  deliverText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  empty: { paddingVertical: 100, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 20 },
});
