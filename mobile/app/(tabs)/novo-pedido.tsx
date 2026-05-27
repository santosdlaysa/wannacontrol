import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Produto, Mesa, Pedido } from '@cafecontrol/shared';
import { StatusMesa } from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { COLORS, RADIUS, SHADOWS, SPACING, formatBRL } from '../../src/lib/constants';

interface CartItem {
  produto: Produto;
  quantidade: number;
  observacao: string;
}

export default function NovoPedidoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mesaId?: string; pedidoId?: string }>();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [existingPedidoId, setExistingPedidoId] = useState<number | null>(null);

  // Atualizar quando navegar com params (ex: vindo da tela de mesas)
  useEffect(() => {
    if (params.mesaId) setSelectedMesaId(Number(params.mesaId));
    if (params.pedidoId) setExistingPedidoId(Number(params.pedidoId));
    else setExistingPedidoId(null);
  }, [params.mesaId, params.pedidoId]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, m] = await Promise.all([
          apiClient.get<Produto[]>('/produtos?disponivel=true'),
          apiClient.get<Mesa[]>('/mesas'),
        ]);
        setProdutos(p);
        setMesas(m);
      } catch (err: any) {
        Alert.alert('Erro', err?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(produtos.map((p) => p.categoria))).sort();
    if (cats.length === 0) {
      return ['Todos', 'Cafés Quentes', 'Bebidas Geladas', 'Salgados', 'Doces e Tortas'];
    }
    return ['Todos', ...cats];
  }, [produtos]);

  const filtered = useMemo(() => {
    let list = produtos;
    if (selectedCategory !== 'Todos') {
      list = list.filter((p) => p.categoria === selectedCategory);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter((p) => p.nome.toLowerCase().includes(q));
    }
    return list;
  }, [produtos, selectedCategory, busca]);

  const availableMesas = useMemo(
    () => mesas.filter((m) => m.status === StatusMesa.LIVRE || m.status === StatusMesa.OCUPADA || m.status === StatusMesa.AGUARDANDO_CONTA),
    [mesas],
  );

  const totalQty = useMemo(() => cart.reduce((s, i) => s + i.quantidade, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((s, i) => s + Number(i.produto.preco) * i.quantidade, 0), [cart]);

  const getQty = useCallback((id: number) => cart.find((c) => c.produto.id === id)?.quantidade || 0, [cart]);

  const addItem = useCallback((produto: Produto) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.produto.id === produto.id);
      if (idx >= 0) {
        const u = [...prev];
        u[idx] = { ...u[idx], quantidade: u[idx].quantidade + 1 };
        return u;
      }
      return [...prev, { produto, quantidade: 1, observacao: '' }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.produto.id === id);
      if (idx < 0) return prev;
      if (prev[idx].quantidade <= 1) return prev.filter((_, i) => i !== idx);
      const u = [...prev];
      u[idx] = { ...u[idx], quantidade: u[idx].quantidade - 1 };
      return u;
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (cart.length === 0) { Alert.alert('Aviso', 'Adicione pelo menos um item.'); return; }
    setSending(true);
    try {
      let pedidoId = existingPedidoId;
      if (!pedidoId) {
        if (!selectedMesaId) { Alert.alert('Aviso', 'Selecione uma mesa.'); setSending(false); return; }
        const pedido = await apiClient.post<Pedido>('/pedidos', { mesaId: selectedMesaId });
        pedidoId = pedido.id;
      }
      await apiClient.post(`/pedidos/${pedidoId}/itens`, {
        itens: cart.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade, observacao: i.observacao || null })),
      });
      Alert.alert('Sucesso', 'Itens enviados para a cozinha!', [
        { text: 'OK', onPress: () => { setCart([]); router.push(`/pedido/${pedidoId}`); } },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  }, [cart, existingPedidoId, selectedMesaId, router]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand} /></View>;
  }

  const headerComponent = (
    <View>
      {/* Mesa selection */}
      {!existingPedidoId && (
        <View style={styles.mesaSection}>
          <Text style={styles.sectionLabel}>Selecione a mesa</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mesaRow}>
            {availableMesas.map((m) => {
              const active = selectedMesaId === m.id;
              const isLivre = m.status === StatusMesa.LIVRE;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.mesaChip, active && styles.mesaChipActive]}
                  onPress={() => setSelectedMesaId(m.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.mesaNum, active && styles.mesaNumActive]}>{m.numero}</Text>
                  <Text style={[styles.mesaStatus, active && styles.mesaStatusActive,
                    isLivre ? styles.mesaLivre : styles.mesaOcupada
                  ]}>
                    {isLivre ? 'Livre' : 'Ocupada'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {existingPedidoId && (
        <View style={styles.existingBar}>
          <Text style={styles.existingLabel}>Adicionando ao pedido #{existingPedidoId}</Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produto..."
          placeholderTextColor={COLORS.text.tertiary}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catCard, active && styles.catCardActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catText, active && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={headerComponent}
        renderItem={({ item }) => {
          const qty = getQty(item.id);
          return (
            <TouchableOpacity
              style={[styles.prodCard, qty > 0 && styles.prodCardSelected]}
              onPress={() => addItem(item)}
              onLongPress={() => removeItem(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.prodNome} numberOfLines={2}>{item.nome}</Text>
              <Text style={styles.prodPreco}>{formatBRL(Number(item.preco))}</Text>
              {qty > 0 && (
                <View style={styles.prodQtyBadge}>
                  <Text style={styles.prodQtyText}>{qty}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          </View>
        }
      />

      {/* Cart bar */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartQty}>{totalQty} {totalQty === 1 ? 'item' : 'itens'}</Text>
            <Text style={styles.cartTotal}>{formatBRL(totalPrice)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.cartBtn, sending && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.cartBtnText}>Enviar para Cozinha</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },

  // Mesa
  mesaSection: { paddingTop: SPACING.lg },
  mesaRow: {
    paddingHorizontal: SPACING.xl,
    gap: 10,
  },
  mesaChip: {
    width: 64,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border.light,
    ...SHADOWS.sm,
  },
  mesaChipActive: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandLight,
  },
  mesaNum: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary },
  mesaNumActive: { color: COLORS.primary },
  mesaStatus: { fontSize: 9, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  mesaStatusActive: { color: COLORS.primary },
  mesaLivre: { color: COLORS.success },
  mesaOcupada: { color: COLORS.warning },

  existingBar: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  existingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text.secondary },

  // Search
  searchSection: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md },
  searchInput: {
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },

  // Categories
  catRow: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.sm },
  catCard: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border.light,
  },
  catCardActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  catTextActive: {
    color: COLORS.white,
  },

  // Product grid
  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.xl, marginBottom: SPACING.sm },
  list: { paddingTop: SPACING.xs, paddingBottom: 120 },
  prodCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border.light,
    minHeight: 90,
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  prodCardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surfaceElevated,
  },
  prodNome: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  prodPreco: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brand,
  },
  prodQtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  prodQtyText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  emptyBox: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.text.tertiary },

  // Cart bar
  cartBar: {
    position: 'absolute',
    bottom: 12,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.lg,
  },
  cartInfo: {
    gap: 2,
  },
  cartQty: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  cartBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  cartBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
