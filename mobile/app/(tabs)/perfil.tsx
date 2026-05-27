import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/providers/AuthProvider';
import { useSocket } from '../../src/providers/SocketProvider';
import { apiClient } from '../../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../../src/lib/constants';

interface PedidoResumo {
  id: number;
  mesaId: number;
  statusPedido: string;
  dataCriacao: string;
  mesa: { numero: number };
  itens: Array<{
    id: number;
    quantidade: number;
    precoUnitario: number;
    produto: { nome: string };
  }>;
}

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await apiClient.get<PedidoResumo[]>('/pedidos');
      // Filtrar pedidos deste garçom (a API já filtra se necessário, mas garantimos)
      setPedidos(data);
    } catch {
      // silencioso
    } finally {
      setLoadingPedidos(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPedidos();
  };

  const calcTotal = (pedido: PedidoResumo) =>
    pedido.itens.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0);

  const totalVendas = pedidos
    .filter((p) => p.statusPedido === 'PAGO')
    .reduce((s, p) => s + calcTotal(p), 0);

  const pedidosPagos = pedidos.filter((p) => p.statusPedido === 'PAGO').length;
  const pedidosAbertos = pedidos.filter((p) => p.statusPedido === 'ABERTO').length;

  const handleEncerrarTurno = () => {
    if (pedidosAbertos > 0) {
      Alert.alert(
        'Pedidos em aberto',
        `Voce tem ${pedidosAbertos} pedido(s) em aberto. Feche todos antes de encerrar o turno.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Encerrar Turno',
      `Resumo do turno:\n\n` +
      `Pedidos fechados: ${pedidosPagos}\n` +
      `Total em vendas: ${formatBRL(totalVendas)}\n\n` +
      `Deseja encerrar seu turno?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } catch {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const getInitials = (nome: string) =>
    nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const getPerfilLabel = (perfil: string) => {
    const map: Record<string, string> = {
      ADMIN: 'Administrador',
      GERENTE: 'Gerente',
      CAIXA: 'Operador de Caixa',
      GARCOM: 'Garcom',
      COZINHA: 'Cozinha',
    };
    return map[perfil] || perfil;
  };

  const formatHora = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAGO': return { bg: COLORS.successBg, color: COLORS.success, label: 'Pago' };
      case 'ABERTO': return { bg: COLORS.warningBg, color: COLORS.warning, label: 'Aberto' };
      case 'CANCELADO': return { bg: COLORS.dangerBg, color: COLORS.danger, label: 'Cancelado' };
      default: return { bg: COLORS.border.light, color: COLORS.text.tertiary, label: status };
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.nome)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.nome}</Text>
              <Text style={styles.userRole}>{getPerfilLabel(user.perfil)}</Text>
            </View>
            <View style={[styles.connDot, { backgroundColor: isConnected ? COLORS.success : COLORS.danger }]} />
          </View>
        </View>

        {/* Resumo do turno */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Turno</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pedidosPagos}</Text>
              <Text style={styles.statLabel}>Fechados</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pedidosAbertos}</Text>
              <Text style={styles.statLabel}>Abertos</Text>
            </View>
            <View style={[styles.statCard, styles.statCardHighlight]}>
              <Text style={[styles.statValue, { color: COLORS.brand }]}>{formatBRL(totalVendas)}</Text>
              <Text style={styles.statLabel}>Total vendas</Text>
            </View>
          </View>
        </View>

        {/* Histórico de pedidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos do Turno</Text>

          {loadingPedidos ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.brand} />
            </View>
          ) : pedidos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhum pedido neste turno</Text>
            </View>
          ) : (
            <View style={styles.pedidosList}>
              {pedidos.map((pedido) => {
                const total = calcTotal(pedido);
                const status = getStatusStyle(pedido.statusPedido);
                const expanded = expandedId === pedido.id;

                return (
                  <TouchableOpacity
                    key={pedido.id}
                    style={styles.pedidoCard}
                    onPress={() => setExpandedId(expanded ? null : pedido.id)}
                    activeOpacity={0.7}
                  >
                    {/* Header do pedido */}
                    <View style={styles.pedidoHeader}>
                      <View style={styles.pedidoLeft}>
                        <Text style={styles.pedidoMesa}>Mesa {pedido.mesa.numero}</Text>
                        <Text style={styles.pedidoHora}>{formatHora(pedido.dataCriacao)}</Text>
                      </View>
                      <View style={styles.pedidoRight}>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                        <Text style={styles.pedidoTotal}>{formatBRL(total)}</Text>
                      </View>
                    </View>

                    {/* Itens expandidos */}
                    {expanded && (
                      <View style={styles.pedidoItens}>
                        {pedido.itens.map((item) => (
                          <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.itemNome}>
                              {item.quantidade}x {item.produto.nome}
                            </Text>
                            <Text style={styles.itemPreco}>
                              {formatBRL(Number(item.precoUnitario) * item.quantidade)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <Text style={styles.expandHint}>
                      {expanded ? 'Toque para fechar' : `${pedido.itens.length} ${pedido.itens.length === 1 ? 'item' : 'itens'} — toque para ver`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Botão encerrar turno */}
        <TouchableOpacity
          style={styles.encerrarBtn}
          onPress={handleEncerrarTurno}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View>
              <Text style={styles.encerrarTitle}>Encerrar Turno</Text>
              <Text style={styles.encerrarSub}>
                {pedidosAbertos > 0
                  ? `${pedidosAbertos} pedido(s) em aberto`
                  : `${pedidosPagos} pedido(s) — ${formatBRL(totalVendas)}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>CafeControl v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },

  // Profile
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brand,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  connDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statCardHighlight: {
    flex: 1.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    fontWeight: '500',
    marginTop: 2,
  },

  // Pedidos
  loadingBox: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },
  pedidosList: {
    gap: SPACING.sm,
  },
  pedidoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pedidoLeft: {},
  pedidoMesa: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pedidoHora: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  pedidoRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pedidoTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  pedidoItens: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemNome: {
    fontSize: 13,
    color: COLORS.text.secondary,
    flex: 1,
  },
  itemPreco: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  expandHint: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Encerrar turno
  encerrarBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  encerrarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  encerrarSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Version
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
});
