import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, formatBRL } from '../lib/constants';
import { getCategoryVisual } from '../lib/category-icons';

interface ProdutoCardProps {
  nome: string;
  preco: number;
  categoria: string;
  quantidade: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function ProdutoCard({ nome, preco, categoria, quantidade, onAdd, onRemove }: ProdutoCardProps) {
  const selected = quantidade > 0;
  const visual = getCategoryVisual(categoria);

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardActive]}
      onPress={onAdd}
      activeOpacity={0.85}
    >
      {/* Big thumbnail */}
      <View style={[styles.thumb, { backgroundColor: visual.bg }]}>
        <Text style={styles.emoji}>{visual.emoji}</Text>
      </View>

      {/* Center info */}
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>{nome}</Text>
        <Text style={styles.cat}>{categoria}</Text>
        <Text style={styles.preco}>{formatBRL(preco)}</Text>
      </View>

      {/* Right action */}
      {selected ? (
        <View style={styles.qtyCol}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onAdd}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{quantidade}</Text>
          <TouchableOpacity style={styles.qtyBtnMinus} onPress={onRemove}>
            <Text style={styles.qtyBtnMinusText}>-</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.addCol}>
          <View style={styles.addCircle}>
            <Text style={styles.addPlus}>+</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardActive: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: COLORS.brand,
    padding: 12,
  },
  thumb: {
    width: 82,
    height: 82,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  info: {
    flex: 1,
    paddingHorizontal: 14,
    gap: 3,
  },
  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    lineHeight: 21,
  },
  cat: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '500',
  },
  preco: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brand,
    marginTop: 4,
  },
  addCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 24,
  },
  qtyCol: {
    alignItems: 'center',
    gap: 4,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  qtyNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  qtyBtnMinus: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnMinusText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
});
