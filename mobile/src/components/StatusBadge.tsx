import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusPreparo, StatusMesa } from '@chefflow/shared';
import { COLORS } from '../lib/constants';

type BadgeStatus = StatusPreparo | StatusMesa | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG: Record<string, { bg: string; fg: string; label: string }> = {
  [StatusPreparo.PENDENTE]: { bg: '#F3F4F6', fg: '#6B7280', label: 'Pendente' },
  [StatusPreparo.PREPARANDO]: { bg: COLORS.warningBg, fg: COLORS.warning, label: 'Preparando' },
  [StatusPreparo.PRONTO]: { bg: COLORS.successBg, fg: COLORS.success, label: 'Pronto' },
  [StatusPreparo.ENTREGUE]: { bg: '#F3F4F6', fg: '#9CA3AF', label: 'Entregue' },
  [StatusMesa.LIVRE]: { bg: COLORS.successBg, fg: COLORS.success, label: 'Livre' },
  [StatusMesa.OCUPADA]: { bg: COLORS.dangerBg, fg: COLORS.danger, label: 'Ocupada' },
  [StatusMesa.AGUARDANDO_CONTA]: { bg: COLORS.warningBg, fg: COLORS.warning, label: 'Conta' },
};

const SIZES = {
  sm: { px: 8, py: 3, fs: 10, dot: 5 },
  md: { px: 10, py: 4, fs: 11, dot: 6 },
  lg: { px: 14, py: 6, fs: 13, dot: 7 },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = CONFIG[status] || { bg: '#F3F4F6', fg: '#6B7280', label: status };
  const s = SIZES[size];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, paddingHorizontal: s.px, paddingVertical: s.py }]}>
      <View style={[styles.dot, { backgroundColor: c.fg, width: s.dot, height: s.dot, borderRadius: s.dot }]} />
      <Text style={[styles.text, { color: c.fg, fontSize: s.fs }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    gap: 5,
  },
  dot: {},
  text: {
    fontWeight: '700',
  },
});
