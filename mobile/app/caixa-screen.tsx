import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../src/lib/constants';

interface MovimentacaoCaixa {
  id: number;
  tipo: 'SANGRIA' | 'SUPRIMENTO';
  valor: number;
  descricao: string;
  criadoEm: string;
}

interface Caixa {
  id: number;
  valorInicial: number;
  valorFinal: number | null;
  totalVendas: number | null;
  aberturaEm: string;
  fechamentoEm: string | null;
  aberto: boolean;
  observacao: string | null;
  operador: { id: number; nome: string };
  movimentacoes: MovimentacaoCaixa[];
}

type ModalType = 'abrir' | 'fechar' | 'sangria' | 'suprimento' | null;

export default function CaixaScreen() {
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCaixa = useCallback(async () => {
    try {
      const data = await apiClient.get<Caixa | null>('/caixa/atual');
      setCaixa(data);
    } catch {
      // sem permissao ou erro
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCaixa(); }, [fetchCaixa]);

  const handleAbrir = useCallback(async () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (isNaN(v) || v < 0) { Alert.alert('Aviso', 'Informe um valor valido.'); return; }
    setSaving(true);
    try {
      await apiClient.post('/caixa/abrir', { valorInicial: v, observacao: observacao.trim() || undefined });
      setModalType(null);
      setValor('');
      setObservacao('');
      fetchCaixa();
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao abrir caixa');
    } finally { setSaving(false); }
  }, [valor, observacao, fetchCaixa]);

  const handleFechar = useCallback(async () => {
    if (!caixa) return;
    Alert.alert(
      'Fechar Caixa',
      `Confirma o fechamento?\nTotal de vendas: ${formatBRL(Number(caixa.totalVendas ?? 0))}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Fechar',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await apiClient.patch(`/caixa/${caixa.id}/fechar`, {});
              fetchCaixa();
            } catch (err: any) {
              Alert.alert('Erro', err?.message || 'Erro ao fechar caixa');
            } finally { setSaving(false); }
          },
        },
      ],
    );
  }, [caixa, fetchCaixa]);

  const handleMovimentacao = useCallback(async () => {
    if (!caixa) return;
    const v = parseFloat(valor.replace(',', '.'));
    if (isNaN(v) || v <= 0) { Alert.alert('Aviso', 'Informe um valor valido.'); return; }
    if (!descricao.trim()) { Alert.alert('Aviso', 'Informe uma descricao.'); return; }
    setSaving(true);
    try {
      await apiClient.post(`/caixa/${caixa.id}/movimentacao`, {
        tipo: modalType === 'sangria' ? 'SANGRIA' : 'SUPRIMENTO',
        valor: v,
        descricao: descricao.trim(),
      });
      setModalType(null);
      setValor('');
      setDescricao('');
      fetchCaixa();
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao registrar movimentacao');
    } finally { setSaving(false); }
  }, [caixa, modalType, valor, descricao, fetchCaixa]);

  const formatHora = (s: string) =>
    new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatData = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Calcular saldo atual
  const saldoAtual = caixa
    ? Number(caixa.valorInicial)
      + Number(caixa.totalVendas ?? 0)
      + caixa.movimentacoes.filter((m) => m.tipo === 'SUPRIMENTO').reduce((s, m) => s + Number(m.valor), 0)
      - caixa.movimentacoes.filter((m) => m.tipo === 'SANGRIA').reduce((s, m) => s + Number(m.valor), 0)
    : 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCaixa(); }} tintColor={COLORS.brand} />}
      >
        {/* Status do caixa */}
        <View style={[styles.statusCard, caixa?.aberto ? styles.statusOpen : styles.statusClosed]}>
          <View>
            <Text style={styles.statusTitle}>{caixa?.aberto ? 'Caixa Aberto' : 'Caixa Fechado'}</Text>
            {caixa?.aberto && (
              <Text style={styles.statusSub}>
                Aberto por {caixa.operador.nome} as {formatHora(caixa.aberturaEm)}
              </Text>
            )}
            {!caixa?.aberto && <Text style={styles.statusSub}>Nenhum caixa aberto no momento</Text>}
          </View>
          <View style={[styles.statusDot, { backgroundColor: caixa?.aberto ? COLORS.success : COLORS.text.tertiary }]} />
        </View>

        {/* Saldo e métricas */}
        {caixa?.aberto && (
          <>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Saldo inicial</Text>
                <Text style={styles.metricValue}>{formatBRL(Number(caixa.valorInicial))}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Vendas</Text>
                <Text style={[styles.metricValue, { color: COLORS.success }]}>
                  {formatBRL(Number(caixa.totalVendas ?? 0))}
                </Text>
              </View>
              <View style={[styles.metricCard, styles.metricHighlight]}>
                <Text style={styles.metricLabel}>Saldo atual</Text>
                <Text style={[styles.metricValue, { color: COLORS.brand }]}>{formatBRL(saldoAtual)}</Text>
              </View>
            </View>

            {/* Botoes de acao */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FFF0EB', borderColor: '#FF6B35' }]}
                onPress={() => { setValor(''); setDescricao(''); setModalType('sangria'); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, { color: '#FF6B35' }]}>Sangria</Text>
                <Text style={styles.actionBtnSub}>Retirar dinheiro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#E8F5E9', borderColor: COLORS.success }]}
                onPress={() => { setValor(''); setDescricao(''); setModalType('suprimento'); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Suprimento</Text>
                <Text style={styles.actionBtnSub}>Adicionar dinheiro</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, saving && { opacity: 0.5 }]}
              onPress={handleFechar}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.closeBtnText}>Fechar Caixa</Text>}
            </TouchableOpacity>

            {/* Movimentacoes */}
            {caixa.movimentacoes.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Movimentacoes</Text>
                <View style={styles.movList}>
                  {caixa.movimentacoes.map((m) => (
                    <View key={m.id} style={styles.movRow}>
                      <View style={[styles.movDot, { backgroundColor: m.tipo === 'SANGRIA' ? '#FF6B35' : COLORS.success }]} />
                      <View style={styles.movInfo}>
                        <Text style={styles.movDesc}>{m.descricao}</Text>
                        <Text style={styles.movHora}>{formatHora(m.criadoEm)}</Text>
                      </View>
                      <Text style={[styles.movValor, { color: m.tipo === 'SANGRIA' ? '#FF6B35' : COLORS.success }]}>
                        {m.tipo === 'SANGRIA' ? '-' : '+'}{formatBRL(Number(m.valor))}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Botao abrir caixa */}
        {!caixa?.aberto && (
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => { setValor(''); setObservacao(''); setModalType('abrir'); }}
            activeOpacity={0.85}
          >
            <Text style={styles.openBtnText}>Abrir Caixa</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal Abrir Caixa */}
      <Modal visible={modalType === 'abrir'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Abrir Caixa</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Valor inicial (R$)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="0,00"
                placeholderTextColor={COLORS.text.tertiary}
                value={valor}
                onChangeText={setValor}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Observacao (opcional)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: Turno da manha"
                placeholderTextColor={COLORS.text.tertiary}
                value={observacao}
                onChangeText={setObservacao}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.5 }]} onPress={handleAbrir} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>Abrir</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Sangria / Suprimento */}
      <Modal visible={modalType === 'sangria' || modalType === 'suprimento'} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {modalType === 'sangria' ? 'Registrar Sangria' : 'Registrar Suprimento'}
            </Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Valor (R$)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="0,00"
                placeholderTextColor={COLORS.text.tertiary}
                value={valor}
                onChangeText={setValor}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Descricao *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Motivo da movimentacao"
                placeholderTextColor={COLORS.text.tertiary}
                value={descricao}
                onChangeText={setDescricao}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.5 }]} onPress={handleMovimentacao} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: 40 },

  statusCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  statusOpen: { backgroundColor: '#E8F5E9' },
  statusClosed: { backgroundColor: COLORS.surface },
  statusTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  statusSub: { fontSize: 13, color: COLORS.text.tertiary, marginTop: 4 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },

  metricsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  metricHighlight: { flex: 1.2 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text.tertiary, textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontSize: 15, fontWeight: '800', color: COLORS.text.primary, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
  actionBtnSub: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 2 },

  closeBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  openBtn: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },

  movList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    gap: SPACING.md,
  },
  movDot: { width: 8, height: 8, borderRadius: 4 },
  movInfo: { flex: 1 },
  movDesc: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  movHora: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 1 },
  movValor: { fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 20 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text.tertiary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldInput: {
    height: 46,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
