import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Switch, Alert,
} from 'react-native';
import { apiClient } from '../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../src/lib/constants';

interface Configuracoes {
  id?: number;
  taxa_entrega?: number | null;
  tempo_preparo_medio?: number | null;
  aceita_delivery?: boolean;
  aceita_retirada?: boolean;
  percentual_servico?: number | null;
  horario_abertura?: string | null;
  horario_fechamento?: string | null;
}

interface ConfigForm {
  taxa_entrega: string;
  tempo_preparo_medio: string;
  aceita_delivery: boolean;
  aceita_retirada: boolean;
  percentual_servico: string;
  horario_abertura: string;
  horario_fechamento: string;
}

const DEFAULT_FORM: ConfigForm = {
  taxa_entrega: '',
  tempo_preparo_medio: '',
  aceita_delivery: true,
  aceita_retirada: true,
  percentual_servico: '',
  horario_abertura: '',
  horario_fechamento: '',
};

function configToForm(c: Configuracoes): ConfigForm {
  return {
    taxa_entrega: c.taxa_entrega != null ? String(c.taxa_entrega) : '',
    tempo_preparo_medio: c.tempo_preparo_medio != null ? String(c.tempo_preparo_medio) : '',
    aceita_delivery: c.aceita_delivery ?? true,
    aceita_retirada: c.aceita_retirada ?? true,
    percentual_servico: c.percentual_servico != null ? String(c.percentual_servico) : '',
    horario_abertura: c.horario_abertura ?? '',
    horario_fechamento: c.horario_fechamento ?? '',
  };
}

export default function ConfiguracoesRestauranteScreen() {
  const [form, setForm] = useState<ConfigForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const data = await apiClient.get<Configuracoes>('/configuracoes');
      setForm(configToForm(data));
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Erro ao carregar configuracoes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function handleSave() {
    setSaving(true);
    try {
      const body: Configuracoes = {
        taxa_entrega: form.taxa_entrega !== '' ? Number(form.taxa_entrega) : null,
        tempo_preparo_medio: form.tempo_preparo_medio !== '' ? Number(form.tempo_preparo_medio) : null,
        aceita_delivery: form.aceita_delivery,
        aceita_retirada: form.aceita_retirada,
        percentual_servico: form.percentual_servico !== '' ? Number(form.percentual_servico) : null,
        horario_abertura: form.horario_abertura.trim() || null,
        horario_fechamento: form.horario_fechamento.trim() || null,
      };
      await apiClient.put('/configuracoes', body);
      Alert.alert('Sucesso', 'Configuracoes salvas com sucesso!');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={COLORS.brand} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Entrega</Text>

        <Text style={s.label}>Taxa de Entrega (R$)</Text>
        <TextInput
          style={s.input}
          value={form.taxa_entrega}
          onChangeText={v => setForm(p => ({ ...p, taxa_entrega: v }))}
          placeholder="0.00"
          placeholderTextColor={COLORS.text.tertiary}
          keyboardType="numeric"
        />

        <Text style={s.label}>Tempo Medio de Preparo (min)</Text>
        <TextInput
          style={s.input}
          value={form.tempo_preparo_medio}
          onChangeText={v => setForm(p => ({ ...p, tempo_preparo_medio: v }))}
          placeholder="30"
          placeholderTextColor={COLORS.text.tertiary}
          keyboardType="numeric"
        />

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Aceita Delivery</Text>
          <Switch
            value={form.aceita_delivery}
            onValueChange={v => setForm(p => ({ ...p, aceita_delivery: v }))}
            trackColor={{ false: COLORS.border?.medium || '#ccc', true: COLORS.success || '#22c55e' }}
            thumbColor="#fff"
          />
        </View>

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Aceita Retirada</Text>
          <Switch
            value={form.aceita_retirada}
            onValueChange={v => setForm(p => ({ ...p, aceita_retirada: v }))}
            trackColor={{ false: COLORS.border?.medium || '#ccc', true: COLORS.success || '#22c55e' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Financeiro</Text>

        <Text style={s.label}>% Servico</Text>
        <TextInput
          style={s.input}
          value={form.percentual_servico}
          onChangeText={v => setForm(p => ({ ...p, percentual_servico: v }))}
          placeholder="10"
          placeholderTextColor={COLORS.text.tertiary}
          keyboardType="numeric"
        />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Horario de Funcionamento</Text>

        <Text style={s.label}>Horario de Abertura</Text>
        <TextInput
          style={s.input}
          value={form.horario_abertura}
          onChangeText={v => setForm(p => ({ ...p, horario_abertura: v }))}
          placeholder="08:00"
          placeholderTextColor={COLORS.text.tertiary}
        />

        <Text style={s.label}>Horario de Fechamento</Text>
        <TextInput
          style={s.input}
          value={form.horario_fechamento}
          onChangeText={v => setForm(p => ({ ...p, horario_fechamento: v }))}
          placeholder="22:00"
          placeholderTextColor={COLORS.text.tertiary}
        />
      </View>

      <TouchableOpacity
        style={[s.saveBtn, saving && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={s.saveBtnText}>Salvar Configuracoes</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 14 },
  input: { height: 46, backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, fontSize: 15, color: COLORS.text.primary, borderWidth: 1, borderColor: COLORS.border?.light || '#e5e7eb' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border?.light || '#e5e7eb' },
  switchLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  saveBtn: { backgroundColor: COLORS.brand, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
