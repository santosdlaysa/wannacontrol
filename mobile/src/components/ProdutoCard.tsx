import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, formatBRL } from '../lib/constants';

interface ProdutoCardProps {
  nome: string;
  preco: number;
  categoria: string;
  onAdd: () => void;
}

export function ProdutoCard({ nome, preco, categoria, onAdd }: ProdutoCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onAdd} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>
          {nome}
        </Text>
        <Text style={styles.categoria}>{categoria}</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.preco}>{formatBRL(preco)}</Text>
        <View style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  categoria: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  preco: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});
