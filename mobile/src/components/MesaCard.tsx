import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusMesa } from '@cafecontrol/shared';
import { COLORS } from '../lib/constants';
import { StatusBadge } from './StatusBadge';

interface MesaCardProps {
  numero: number;
  status: StatusMesa;
  garcomNome?: string;
  onPress: () => void;
}

const BORDER_COLORS: Record<StatusMesa, string> = {
  [StatusMesa.LIVRE]: COLORS.success,
  [StatusMesa.OCUPADA]: COLORS.danger,
  [StatusMesa.AGUARDANDO_CONTA]: COLORS.warning,
};

export function MesaCard({ numero, status, garcomNome, onPress }: MesaCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: BORDER_COLORS[status] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.numero}>{numero}</Text>
      <Text style={styles.mesaLabel}>Mesa</Text>
      <StatusBadge status={status} size="sm" />
      {garcomNome && status === StatusMesa.OCUPADA && (
        <Text style={styles.garcom} numberOfLines={1}>
          {garcomNome}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 3,
    padding: 16,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  numero: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mesaLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  garcom: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 4,
  },
});
