import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusPreparo, StatusMesa } from '@cafecontrol/shared';
import { COLORS } from '../lib/constants';

type BadgeStatus = StatusPreparo | StatusMesa | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  // StatusPreparo
  [StatusPreparo.PENDENTE]: {
    bg: COLORS.gray[200],
    text: COLORS.gray[700],
    label: 'Pendente',
  },
  [StatusPreparo.PREPARANDO]: {
    bg: '#FEF3C7',
    text: '#92400E',
    label: 'Preparando',
  },
  [StatusPreparo.PRONTO]: {
    bg: '#D1FAE5',
    text: '#065F46',
    label: 'Pronto',
  },
  [StatusPreparo.ENTREGUE]: {
    bg: COLORS.gray[100],
    text: COLORS.gray[400],
    label: 'Entregue',
  },
  // StatusMesa
  [StatusMesa.LIVRE]: {
    bg: '#D1FAE5',
    text: '#065F46',
    label: 'Livre',
  },
  [StatusMesa.OCUPADA]: {
    bg: '#FEE2E2',
    text: '#991B1B',
    label: 'Ocupada',
  },
  [StatusMesa.AGUARDANDO_CONTA]: {
    bg: '#FEF3C7',
    text: '#92400E',
    label: 'Aguardando Conta',
  },
};

const SIZE_STYLES = {
  sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
  md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
  lg: { paddingHorizontal: 14, paddingVertical: 6, fontSize: 14 },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    bg: COLORS.gray[200],
    text: COLORS.gray[700],
    label: status,
  };

  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: config.text, fontSize: sizeStyle.fontSize },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
  },
});
