import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusPreparo } from '@cafecontrol/shared';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../lib/constants';
import { StatusBadge } from './StatusBadge';

interface ItemPedidoRowProps {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  statusPreparo: StatusPreparo;
}

export function ItemPedidoRow({
  produtoNome,
  quantidade,
  precoUnitario,
  observacao,
  statusPreparo,
}: ItemPedidoRowProps) {
  const isReady = statusPreparo === StatusPreparo.PRONTO;
  const isDelivered = statusPreparo === StatusPreparo.ENTREGUE;

  return (
    <View style={[styles.row, isReady && styles.rowReady, isDelivered && styles.rowDone]}>
      <View style={styles.qty}>
        <Text style={[styles.qtyText, isDelivered && styles.muted]}>{quantidade}x</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.nome, isDelivered && styles.muted]} numberOfLines={1}>
          {produtoNome}
        </Text>
        {observacao ? (
          <Text style={styles.obs} numberOfLines={2}>{observacao}</Text>
        ) : null}
        <StatusBadge status={statusPreparo} size="sm" />
      </View>
      <Text style={[styles.preco, isDelivered && styles.muted]}>
        {formatBRL(quantidade * precoUnitario)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  rowReady: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successBg,
  },
  rowDone: {
    opacity: 0.45,
  },
  qty: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  info: {
    flex: 1,
    marginRight: SPACING.md,
    gap: 4,
  },
  nome: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  obs: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  muted: {
    color: COLORS.text.tertiary,
  },
  preco: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },
});
