import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusPreparo } from '@cafecontrol/shared';
import { COLORS, formatBRL } from '../lib/constants';
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
    <View
      style={[
        styles.row,
        isReady && styles.readyRow,
        isDelivered && styles.deliveredRow,
      ]}
    >
      <View style={styles.mainInfo}>
        <View style={styles.header}>
          <Text
            style={[styles.nome, isDelivered && styles.mutedText]}
            numberOfLines={1}
          >
            {quantidade}x {produtoNome}
          </Text>
          <StatusBadge status={statusPreparo} size="sm" />
        </View>
        {observacao ? (
          <Text style={styles.observacao} numberOfLines={2}>
            Obs: {observacao}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.preco, isDelivered && styles.mutedText]}>
        {formatBRL(quantidade * precoUnitario)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  readyRow: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  deliveredRow: {
    opacity: 0.6,
  },
  mainInfo: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nome: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    flex: 1,
  },
  mutedText: {
    color: COLORS.gray[400],
  },
  observacao: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    marginTop: 4,
  },
  preco: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
