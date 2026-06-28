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
import { apiClient } from '../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../src/lib/constants';

interface ResumoDiario {
  data: string;
  faturamento: number;
  totalPedidos: number;
  ticketMedio: number;
  topProdutos: Array<{ nome: string; categoria: string; quantidade: number; receita: number }>;
  vendasPorGarcom: Array<{ nome: string; pedidos: number; receita: number }>;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function RelatoriosScreen() {
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [resumo, setResumo] = useState<ResumoDiario | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResumo = useCallback(async (dia: string) => {
    try {
      const result = await apiClient.get<ResumoDiario>(`/financeiro/resumo-diario?data=${dia}`);
      setResumo(result);
    } catch {
      // silent — pode ser erro de permissao
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchResumo(data); }, [data, fetchResumo]);

  const changeDay = (delta: number) => {
    const newDate = addDays(data, delta);
    setData(newDate);
    setLoading(true);
  };

  const isToday = data === new Date().toISOString().split('T')[0];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Seletor de data */}
      <View style={styles.datePicker}>
        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDay(-1)}>
          <Text style={styles.dateArrowText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{formatDateBR(data)}{isToday ? '  (hoje)' : ''}</Text>
        <TouchableOpacity
          style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}
          onPress={() => !isToday && changeDay(1)}
          disabled={isToday}
        >
          <Text style={[styles.dateArrowText, isToday && { opacity: 0.3 }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchResumo(data); }} tintColor={COLORS.brand} />}
      >
        {!resumo || resumo.totalPedidos === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sem dados</Text>
            <Text style={styles.emptySub}>Nenhum pedido finalizado neste dia</Text>
          </View>
        ) : (
          <>
            {/* Cards principais */}
            <View style={styles.row}>
              <View style={[styles.metricCard, { flex: 1.5 }]}>
                <Text style={styles.metricLabel}>Faturamento</Text>
                <Text style={[styles.metricValue, { color: COLORS.brand }]}>
                  {formatBRL(resumo.faturamento)}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pedidos</Text>
                <Text style={styles.metricValue}>{resumo.totalPedidos}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Ticket medio</Text>
                <Text style={styles.metricValue}>{formatBRL(resumo.ticketMedio)}</Text>
              </View>
            </View>

            {/* Top produtos */}
            {resumo.topProdutos.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Produtos mais vendidos</Text>
                <View style={styles.card}>
                  {resumo.topProdutos.slice(0, 8).map((p, i) => {
                    const pct = resumo.faturamento > 0 ? (p.receita / resumo.faturamento) * 100 : 0;
                    return (
                      <View key={p.nome} style={styles.rankRow}>
                        <View style={styles.rankLeft}>
                          <Text style={styles.rankPos}>#{i + 1}</Text>
                          <View>
                            <Text style={styles.rankNome} numberOfLines={1}>{p.nome}</Text>
                            <Text style={styles.rankCat}>{p.categoria}</Text>
                          </View>
                        </View>
                        <View style={styles.rankRight}>
                          <Text style={styles.rankQtd}>{p.quantidade}x</Text>
                          <Text style={styles.rankReceita}>{formatBRL(p.receita)}</Text>
                          <Text style={styles.rankPct}>{pct.toFixed(1)}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Vendas por garcom */}
            {resumo.vendasPorGarcom.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Vendas por atendente</Text>
                <View style={styles.card}>
                  {resumo.vendasPorGarcom.map((g) => (
                    <View key={g.nome} style={styles.garcomRow}>
                      <View style={styles.garcomAvatar}>
                        <Text style={styles.garcomInitial}>
                          {g.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </Text>
                      </View>
                      <View style={styles.garcomInfo}>
                        <Text style={styles.garcomNome}>{g.nome}</Text>
                        <Text style={styles.garcomPedidos}>{g.pedidos} pedido(s)</Text>
                      </View>
                      <Text style={styles.garcomReceita}>{formatBRL(g.receita)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dateArrow: {
    padding: SPACING.md,
  },
  dateArrowDisabled: { opacity: 0.4 },
  dateArrowText: { fontSize: 20, fontWeight: '700', color: COLORS.brand },
  dateLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },

  content: { padding: SPACING.xl, paddingBottom: 40 },

  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },

  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, textAlign: 'center' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  rankPos: { fontSize: 13, fontWeight: '800', color: COLORS.text.tertiary, width: 24 },
  rankNome: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary, maxWidth: 160 },
  rankCat: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 1 },
  rankRight: { alignItems: 'flex-end', gap: 2 },
  rankQtd: { fontSize: 12, color: COLORS.text.tertiary, fontWeight: '600' },
  rankReceita: { fontSize: 14, fontWeight: '800', color: COLORS.text.primary },
  rankPct: { fontSize: 11, color: COLORS.brand, fontWeight: '600' },

  garcomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    gap: SPACING.md,
  },
  garcomAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garcomInitial: { fontSize: 13, fontWeight: '800', color: COLORS.brand },
  garcomInfo: { flex: 1 },
  garcomNome: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  garcomPedidos: { fontSize: 12, color: COLORS.text.tertiary, marginTop: 1 },
  garcomReceita: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },

  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text.secondary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text.tertiary, textAlign: 'center' },
});
