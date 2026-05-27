import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  StatusMesa,
  SOCKET_EVENTS,
  type Mesa,
  type MesaStatusChangedPayload,
  type Pedido,
} from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { useSocket } from '../../src/providers/SocketProvider';
import { MesaCard } from '../../src/components/MesaCard';
import { COLORS } from '../../src/lib/constants';

interface MesaWithGarcom extends Mesa {
  garcomNome?: string;
  pedidoId?: number;
}

export default function MesasScreen() {
  const [mesas, setMesas] = useState<MesaWithGarcom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2;

  const fetchMesas = useCallback(async () => {
    try {
      const data = await apiClient.get<Mesa[]>('/mesas');

      // For occupied tables, fetch active pedidos to get waiter info
      const mesasWithInfo: MesaWithGarcom[] = await Promise.all(
        data.map(async (mesa) => {
          if (mesa.status === StatusMesa.OCUPADA || mesa.status === StatusMesa.AGUARDANDO_CONTA) {
            try {
              const pedidos = await apiClient.get<Pedido[]>(
                `/pedidos?mesa_id=${mesa.id}&status=ABERTO`,
              );
              if (pedidos.length > 0) {
                const pedido = pedidos[0];
                return {
                  ...mesa,
                  garcomNome: pedido.garcom?.nome,
                  pedidoId: pedido.id,
                };
              }
            } catch {
              // Ignore error fetching pedido details
            }
          }
          return mesa;
        }),
      );

      setMesas(mesasWithInfo);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  // Real-time mesa status updates
  useEffect(() => {
    if (!socket) return;

    const handleMesaChanged = (payload: MesaStatusChangedPayload) => {
      setMesas((prev) =>
        prev.map((mesa) =>
          mesa.id === payload.mesaId
            ? { ...mesa, status: payload.novoStatus }
            : mesa,
        ),
      );
      // Refresh full data to get updated garcom info
      fetchMesas();
    };

    socket.on(SOCKET_EVENTS.MESA_STATUS_CHANGED, handleMesaChanged);
    return () => {
      socket.off(SOCKET_EVENTS.MESA_STATUS_CHANGED, handleMesaChanged);
    };
  }, [socket, fetchMesas]);

  const handleMesaPress = useCallback(
    async (mesa: MesaWithGarcom) => {
      if (mesa.status === StatusMesa.LIVRE) {
        Alert.alert(
          `Mesa ${mesa.numero}`,
          'Abrir novo pedido para esta mesa?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Pedido',
              onPress: async () => {
                try {
                  const pedido = await apiClient.post<Pedido>('/pedidos', {
                    mesaId: mesa.id,
                  });
                  router.push(`/pedido/${pedido.id}`);
                } catch (err: any) {
                  Alert.alert(
                    'Erro',
                    err?.message || 'Erro ao criar pedido',
                  );
                }
              },
            },
          ],
        );
      } else if (mesa.pedidoId) {
        router.push(`/pedido/${mesa.pedidoId}`);
      } else {
        // Try to find the active pedido
        try {
          const pedidos = await apiClient.get<Pedido[]>(
            `/pedidos?mesa_id=${mesa.id}&status=ABERTO`,
          );
          if (pedidos.length > 0) {
            router.push(`/pedido/${pedidos[0].id}`);
          } else {
            Alert.alert('Info', 'Nenhum pedido aberto para esta mesa.');
          }
        } catch (err: any) {
          Alert.alert('Erro', err?.message || 'Erro ao buscar pedido');
        }
      }
    },
    [router],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMesas();
  }, [fetchMesas]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={mesas}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        key={`cols-${numColumns}`}
        renderItem={({ item }) => (
          <MesaCard
            numero={item.numero}
            status={item.status}
            garcomNome={item.garcomNome}
            onPress={() => handleMesaPress(item)}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma mesa cadastrada</Text>
          </View>
        }
      />
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
  list: {
    padding: 10,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[400],
  },
});
