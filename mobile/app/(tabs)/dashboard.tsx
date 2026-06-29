import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../../src/lib/constants';
import { useAuth } from '../../src/providers/AuthProvider';

interface DashboardData {
  data: string;
  pedidosHoje: number;
  pedidosPagosHoje: number;
  pedidosAbertos: number;
  emPreparo: number;
  prontos: number;
  faturamento: number;
  totalMes: number;
  valorInicialCaixa: number | null;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await apiClient.get<DashboardData>('/financeiro/dashboard');
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const firstName = user?.nome?.split(' ')[0] || 'Usuario';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Ola, {firstName}</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Valor inicial do caixa */}
        {data?.valorInicialCaixa != null && (
          <TouchableOpacity
            style={styles.valorInicialCard}
            onPress={() => router.push('/caixa-screen')}
            activeOpacity={0.8}
          >
            <Text style={styles.valorInicialLabel}>Caixa aberto com</Text>
            <Text style={styles.valorInicialValue}>{formatBRL(data.valorInicialCaixa)}</Text>
            <Text style={styles.valorInicialSub}>Valor inicial do caixa</Text>
          </TouchableOpacity>
        )}

        {/* Cards de status em tempo real */}
        <Text style={styles.sectionTitle}>Agora</Text>
        <View style={styles.rowCards}>
          <TouchableOpacity
            style={[styles.statCard, styles.cardOrange]}
            onPress={() => router.push('/(tabs)/mesas')}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{data?.pedidosAbertos ?? 0}</Text>
            <Text style={styles.statLabel}>Em aberto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.cardBlue]}
            onPress={() => router.push('/(tabs)/cozinha')}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{data?.emPreparo ?? 0}</Text>
            <Text style={styles.statLabel}>Em preparo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.cardGreen]}
            onPress={() => router.push('/(tabs)/alertas')}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{data?.prontos ?? 0}</Text>
            <Text style={styles.statLabel}>Prontos</Text>
          </TouchableOpacity>
        </View>

        {/* Faturamento */}
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.faturamentoCard}>
          <View style={styles.faturamentoRow}>
            <View style={styles.faturamentoItem}>
              <Text style={styles.faturamentoLabel}>Faturamento hoje</Text>
              <Text style={styles.faturamentoValue}>{formatBRL(data?.faturamento ?? 0)}</Text>
            </View>
            <View style={styles.faturamentoDivider} />
            <View style={styles.faturamentoItem}>
              <Text style={styles.faturamentoLabel}>Total no mes</Text>
              <Text style={[styles.faturamentoValue, { color: COLORS.brand }]}>
                {formatBRL(data?.totalMes ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pedidos do dia */}
        <Text style={styles.sectionTitle}>Pedidos hoje</Text>
        <View style={styles.rowCards}>
          <View style={[styles.statCard, styles.cardNeutral]}>
            <Text style={styles.statNumber}>{data?.pedidosHoje ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.cardNeutral]}>
            <Text style={styles.statNumber}>{data?.pedidosPagosHoje ?? 0}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>
          <View style={[styles.statCard, styles.cardNeutral]}>
            <Text style={styles.statNumber}>
              {data && data.pedidosPagosHoje > 0
                ? formatBRL(data.faturamento / data.pedidosPagosHoje).replace('R$\u00a0', '')
                : '-'}
            </Text>
            <Text style={styles.statLabel}>Ticket medio</Text>
          </View>
        </View>

        {/* Atalhos */}
        <Text style={styles.sectionTitle}>Acesso rapido</Text>
        <View style={styles.atalhos}>
          {[
            { label: 'Mesas', icon: '\u25A2', route: '/(tabs)/mesas' },
            { label: 'Cozinha', icon: '\u2B50', route: '/(tabs)/cozinha' },
            { label: 'Clientes', icon: '\u25CF', route: '/(tabs)/clientes' },
            { label: 'Delivery', icon: '\u25B6', route: '/pedidos-delivery' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.atalhoBtn}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.atalhoIcon}>{item.icon}</Text>
              <Text style={styles.atalhoLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.atalhos, { marginTop: SPACING.sm }]}>
          {[
            { label: 'Relatorios', icon: '\u25B3', route: '/relatorios' },
            { label: 'Caixa', icon: '$', route: '/caixa-screen' },
            { label: 'Produtos', icon: '\u2B23', route: '/produtos' },
            { label: 'Novo Pedido', icon: '+', route: '/(tabs)/novo-pedido' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.atalhoBtn}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.atalhoIcon}>{item.icon}</Text>
              <Text style={styles.atalhoLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: 40 },

  header: { marginBottom: SPACING.xl },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary },
  date: { fontSize: 13, color: COLORS.text.tertiary, marginTop: 2, textTransform: 'capitalize' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },

  rowCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  cardOrange: { backgroundColor: '#FFF3E0' },
  cardBlue: { backgroundColor: '#E3F2FD' },
  cardGreen: { backgroundColor: '#E8F5E9' },
  cardNeutral: { backgroundColor: COLORS.surface },
  statNumber: { fontSize: 28, fontWeight: '800', color: COLORS.text.primary },
  statLabel: { fontSize: 11, color: COLORS.text.tertiary, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  faturamentoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
    marginBottom: SPACING.sm,
  },
  faturamentoRow: { flexDirection: 'row', alignItems: 'center' },
  faturamentoItem: { flex: 1, alignItems: 'center' },
  faturamentoDivider: { width: 1, height: 48, backgroundColor: COLORS.border.light, marginHorizontal: SPACING.md },
  faturamentoLabel: { fontSize: 12, color: COLORS.text.tertiary, fontWeight: '600', marginBottom: 6 },
  faturamentoValue: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary },

  valorInicialCard: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  valorInicialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  valorInicialValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  valorInicialSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },

  atalhos: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  atalhoBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.sm,
  },
  atalhoIcon: { fontSize: 22 },
  atalhoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text.secondary },
});
