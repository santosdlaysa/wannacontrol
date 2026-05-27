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
import { COLORS, formatBRL } from '../../src/lib/constants';

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

  useEffect(() => {
    fetchPedido();
  }, [fetchPedido]);

  // Real-time item status updates
  useEffect(() => {
    if (!socket || !pedido) return;

    const handleItemStatusChanged = (payload: ItemStatusChangedPayload) => {
      if (payload.pedidoId !== pedido.id) return;

      setPedido((prev) => {
        if (!prev?.itens) return prev;
        return {
          ...prev,
          itens: prev.itens.map((item) =>
            item.id === payload.itemId
              ? { ...item, statusPreparo: payload.novoStatus }
              : item,
          ),
        };
      });
    };

    socket.on(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handleItemStatusChanged);
    return () => {
      socket.off(SOCKET_EVENTS.ITEM_STATUS_CHANGED, handleItemStatusChanged);
    };
  }, [socket, pedido?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPedido();
  }, [fetchPedido]);

  const handleAddItems = useCallback(() => {
    if (!pedido) return;
    router.push({
      pathname: '/(tabs)/novo-pedido',
      params: {
        pedidoId: pedido.id.toString(),
        mesaId: pedido.mesaId.toString(),
      },
    });
  }, [pedido, router]);

  const subtotal = pedido?.itens?.reduce(
    (sum, item) => sum + item.precoUnitario * item.quantidade,
    0,
  ) ?? 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Pedido nao encontrado</Text>
      </View>
    );
  }

  const headerTitle = `Mesa ${pedido.mesa?.numero ?? '?'} - Pedido #${pedido.id}`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: headerTitle,
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Text style={styles.garcomText}>
              Garcom: {pedido.garcom?.nome ?? '---'}
            </Text>
            <Text style={styles.statusText}>
              Status: {pedido.statusPedido}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum item no pedido</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatBRL(subtotal)}</Text>
        </View>
        {pedido.statusPedido === 'ABERTO' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddItems}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Adicionar Itens</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  headerInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  garcomText: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray[400],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
