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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  SOCKET_EVENTS,
  type Pedido,
  type ItemPedido,
  type ItemStatusChangedPayload,
} from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { useSocket } from '../../src/providers/SocketProvider';
import { ItemPedidoRow } from '../../src/components/ItemPedidoRow';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../../src/lib/constants';

export default function PedidoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { socket } = useSocket();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const subtotal = pedido?.itens?.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0) ?? 0;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  if (!pedido) return <View style={styles.center}><Text style={styles.noData}>Pedido nao encontrado</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Mesa ${pedido.mesa?.numero ?? '?'}`,
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
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
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Garcom</Text>
              <Text style={styles.headerValue}>{pedido.garcom?.nome ?? '---'}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerLabel}>Status</Text>
              <Text style={styles.headerStatus}>{pedido.statusPedido}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>Nenhum item no pedido</Text></View>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(subtotal)}</Text>
        </View>
        {pedido.statusPedido === 'ABERTO' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push({ pathname: '/(tabs)/novo-pedido', params: { pedidoId: pedido.id.toString(), mesaId: pedido.mesaId.toString() } })}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Adicionar Itens</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  noData: { fontSize: 15, color: COLORS.text.tertiary },
  list: { padding: SPACING.lg, paddingBottom: 150 },
  header: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  headerValue: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  headerStatus: { fontSize: 15, fontWeight: '700', color: COLORS.brand },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.text.tertiary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.float,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  totalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  totalValue: { fontSize: 26, fontWeight: '800', color: COLORS.text.primary },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
