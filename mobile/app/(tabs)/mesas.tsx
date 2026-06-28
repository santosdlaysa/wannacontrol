import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  StatusMesa,
  SOCKET_EVENTS,
  type Mesa,
  type MesaStatusChangedPayload,
  type Pedido,
} from '@chefflow/shared';
import { apiClient } from '../../src/lib/api-client';
import { useSocket } from '../../src/providers/SocketProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { MesaCard } from '../../src/components/MesaCard';
import { COLORS } from '../../src/lib/constants';

interface MesaWithGarcom extends Mesa {
  garcomNome?: string;
  clienteNome?: string;
  pedidoId?: number;
}

type Filter = 'all' | 'free' | 'busy';

export default function MesasScreen() {
  const [mesas, setMesas] = useState<MesaWithGarcom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [modalMesa, setModalMesa] = useState<MesaWithGarcom | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTel, setClienteTel] = useState('');
  const [creating, setCreating] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2;

  const fetchMesas = useCallback(async () => {
    try {
      const data = await apiClient.get<Mesa[]>('/mesas');
      const result: MesaWithGarcom[] = await Promise.all(
        data.map(async (mesa) => {
          if (mesa.status === StatusMesa.OCUPADA || mesa.status === StatusMesa.AGUARDANDO_CONTA) {
            try {
              const pedidos = await apiClient.get<Pedido[]>(`/pedidos?mesa_id=${mesa.id}&status=ABERTO`);
              if (pedidos.length > 0) return { ...mesa, garcomNome: pedidos[0].garcom?.nome, clienteNome: pedidos[0].clienteNome ?? undefined, pedidoId: pedidos[0].id };
            } catch {}
          }
          return mesa;
        }),
      );
      setMesas(result);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMesas(); }, [fetchMesas]);

  useEffect(() => {
    if (!socket) return;
    const handler = (p: MesaStatusChangedPayload) => {
      setMesas((prev) => prev.map((m) => m.id === p.mesaId ? { ...m, status: p.novoStatus } : m));
      fetchMesas();
    };
    socket.on(SOCKET_EVENTS.MESA_STATUS_CHANGED, handler);
    return () => { socket.off(SOCKET_EVENTS.MESA_STATUS_CHANGED, handler); };
  }, [socket, fetchMesas]);

  const counts = useMemo(() => ({
    free: mesas.filter((m) => m.status === StatusMesa.LIVRE).length,
    busy: mesas.filter((m) => m.status !== StatusMesa.LIVRE).length,
  }), [mesas]);

  const filtered = useMemo(() => {
    if (filter === 'free') return mesas.filter((m) => m.status === StatusMesa.LIVRE);
    if (filter === 'busy') return mesas.filter((m) => m.status !== StatusMesa.LIVRE);
    return mesas;
  }, [mesas, filter]);

  const handlePress = useCallback(async (mesa: MesaWithGarcom) => {
    if (mesa.status === StatusMesa.LIVRE) {
      setModalMesa(mesa);
      setClienteNome('');
      setClienteTel('');
    } else if (mesa.pedidoId) {
      router.push({ pathname: '/pedido/[id]', params: { id: mesa.pedidoId!.toString() } });
    } else {
      try {
        const pedidos = await apiClient.get<Pedido[]>(`/pedidos?mesa_id=${mesa.id}&status=ABERTO`);
        if (pedidos.length > 0) router.push({ pathname: '/pedido/[id]', params: { id: pedidos[0].id.toString() } });
        else Alert.alert('Info', 'Nenhum pedido aberto.');
      } catch (err: any) { Alert.alert('Erro', err?.message || 'Erro'); }
    }
  }, [router]);

  const handleCreatePedido = useCallback(async () => {
    if (!modalMesa) return;
    setCreating(true);
    try {
      const pedido = await apiClient.post<Pedido>('/pedidos', {
        mesaId: modalMesa.id,
        clienteNome: clienteNome.trim() || null,
        clienteTelefone: clienteTel.trim() || null,
      });
      setModalMesa(null);
      router.push({ pathname: '/pedido/[id]', params: { id: pedido.id.toString() } });
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao abrir pedido');
    } finally {
      setCreating(false);
    }
  }, [modalMesa, clienteNome, clienteTel, router]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  const firstName = user?.nome?.split(' ')[0] || 'Usuario';
  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'free', label: 'Livres' },
    { key: 'busy', label: 'Ocupadas' },
  ];

  return (
    <View style={styles.container}>
      {/* Custom header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ola, {firstName}</Text>
          <Text style={styles.headerTitle}>ChefFlow</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{counts.free}</Text>
            <Text style={styles.statLabel}>livres</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{counts.busy}</Text>
            <Text style={styles.statLabel}>ocupadas</Text>
          </View>
        </View>
      </View>
      </SafeAreaView>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id.toString()}
        numColumns={numColumns}
        key={`c-${numColumns}`}
        renderItem={({ item }) => (
          <MesaCard
            numero={item.numero}
            status={item.status}
            clienteNome={item.clienteNome}
            onPress={() => handlePress(item)}
          />
        )}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMesas(); }} colors={[COLORS.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma mesa encontrada</Text>
          </View>
        }
      />

      {/* Modal novo pedido */}
      <Modal visible={!!modalMesa} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              Mesa {modalMesa?.numero} - Novo Pedido
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Nome do cliente</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Joao Silva"
                placeholderTextColor={COLORS.text.tertiary}
                value={clienteNome}
                onChangeText={setClienteNome}
                autoFocus
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Telefone (opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="(00) 00000-0000"
                placeholderTextColor={COLORS.text.tertiary}
                value={clienteTel}
                onChangeText={setClienteTel}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalMesa(null)}
                disabled={creating}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, creating && { opacity: 0.5 }]}
                onPress={handleCreatePedido}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Abrir Pedido</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Header
  headerSafe: {
    backgroundColor: COLORS.primary,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
  },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabOn: {
    backgroundColor: COLORS.brand,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  tabTextOn: {
    color: COLORS.white,
  },

  // Grid
  grid: { paddingHorizontal: 14, paddingBottom: 100 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.text.tertiary, fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
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
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
