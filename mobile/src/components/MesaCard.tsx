import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusMesa } from '@cafecontrol/shared';
import { COLORS } from '../lib/constants';

interface MesaCardProps {
  numero: number;
  status: StatusMesa;
  clienteNome?: string;
  onPress: () => void;
}

const S: Record<StatusMesa, { color: string; bg: string; label: string }> = {
  [StatusMesa.LIVRE]: { color: '#059669', bg: '#ECFDF5', label: 'Livre' },
  [StatusMesa.OCUPADA]: { color: '#DC2626', bg: '#FEF2F2', label: 'Ocupada' },
  [StatusMesa.AGUARDANDO_CONTA]: { color: '#D97706', bg: '#FFFBEB', label: 'Conta' },
};

export function MesaCard({ numero, status, clienteNome, onPress }: MesaCardProps) {
  const cfg = S[status];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.num}>{numero}</Text>
      <Text style={styles.label}>Mesa</Text>
      <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
        <View style={[styles.dot, { backgroundColor: cfg.color }]} />
        <Text style={[styles.pillText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      {clienteNome && status !== StatusMesa.LIVRE && (
        <Text style={styles.cliente} numberOfLines={1}>{clienteNome}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    margin: 5,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  num: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 38,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.tertiary,
    marginTop: 2,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cliente: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginTop: 6,
  },
});
