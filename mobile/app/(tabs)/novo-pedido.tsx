import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Produto, Mesa, Pedido } from '@cafecontrol/shared';
import { StatusMesa } from '@cafecontrol/shared';
import { apiClient } from '../../src/lib/api-client';
import { ProdutoCard } from '../../src/components/ProdutoCard';
import { COLORS, formatBRL } from '../../src/lib/constants';

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

  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(
    params.mesaId ? Number(params.mesaId) : null,
  );
  const [existingPedidoId, setExistingPedidoId] = useState<number | null>(
    params.pedidoId ? Number(params.pedidoId) : null,
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add item modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalProduto, setModalProduto] = useState<Produto | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalObs, setModalObs] = useState('');

  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [produtosData, mesasData] = await Promise.all([
          apiClient.get<Produto[]>('/produtos?disponivel=true'),
          apiClient.get<Mesa[]>('/mesas'),
        ]);
        setProdutos(produtosData);
        setMesas(mesasData);
      } catch (err: any) {
        Alert.alert('Erro', err?.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(produtos.map((p) => p.categoria));
    return ['Todos', ...Array.from(cats).sort()];
  }, [produtos]);

  const filteredProdutos = useMemo(() => {
    if (selectedCategory === 'Todos') return produtos;
    return produtos.filter((p) => p.categoria === selectedCategory);
  }, [produtos, selectedCategory]);

  const occupiedOrFreeMesas = useMemo(
    () =>
      mesas.filter(
        (m) =>
          m.status === StatusMesa.LIVRE ||
          m.status === StatusMesa.OCUPADA ||
          m.status === StatusMesa.AGUARDANDO_CONTA,
      ),
    [mesas],
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.produto.preco * item.quantidade,
        0,
      ),
    [cart],
  );

  const handleAddProduto = useCallback((produto: Produto) => {
    setModalProduto(produto);
    setModalQty(1);
    setModalObs('');
    setModalVisible(true);
  }, []);

  const confirmAddToCart = useCallback(() => {
    if (!modalProduto) return;
    setCart((prev) => {
      const existing = prev.findIndex(
        (item) =>
          item.produto.id === modalProduto.id &&
          item.observacao === modalObs,
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantidade: updated[existing].quantidade + modalQty,
        };
        return updated;
      }
      return [
        ...prev,
        { produto: modalProduto, quantidade: modalQty, observacao: modalObs },
      ];
    });
    setModalVisible(false);
  }, [modalProduto, modalQty, modalObs]);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    if (cart.length === 0) {
      Alert.alert('Aviso', 'Adicione pelo menos um item ao pedido.');
      return;
    }

    setSending(true);

    try {
      let pedidoId = existingPedidoId;

      // If no existing pedido, create one for the selected mesa
      if (!pedidoId) {
        if (!selectedMesaId) {
          Alert.alert('Aviso', 'Selecione uma mesa primeiro.');
          setSending(false);
          return;
        }
        const pedido = await apiClient.post<Pedido>('/pedidos', {
          mesaId: selectedMesaId,
        });
        pedidoId = pedido.id;
      }

      // Send items to the order
      await apiClient.post(`/pedidos/${pedidoId}/itens`, {
        itens: cart.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
          observacao: item.observacao || null,
        })),
      });

      Alert.alert('Sucesso', 'Itens enviados para a cozinha!', [
        {
          text: 'OK',
          onPress: () => {
            setCart([]);
            router.push(`/pedido/${pedidoId}`);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  }, [cart, existingPedidoId, selectedMesaId, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Step 1: Mesa selection */}
      {!existingPedidoId && (
        <View style={styles.mesaSection}>
          <Text style={styles.sectionTitle}>Mesa</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {occupiedOrFreeMesas.map((mesa) => (
              <TouchableOpacity
                key={mesa.id}
                style={[
                  styles.mesaChip,
                  selectedMesaId === mesa.id && styles.mesaChipSelected,
                ]}
                onPress={() => setSelectedMesaId(mesa.id)}
              >
                <Text
                  style={[
                    styles.mesaChipText,
                    selectedMesaId === mesa.id && styles.mesaChipTextSelected,
                  ]}
                >
                  Mesa {mesa.numero}
                </Text>
                <Text
                  style={[
                    styles.mesaChipStatus,
                    selectedMesaId === mesa.id && styles.mesaChipTextSelected,
                  ]}
                >
                  {mesa.status === StatusMesa.LIVRE ? 'Livre' : 'Ocupada'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {existingPedidoId && (
        <View style={styles.mesaSection}>
          <Text style={styles.sectionTitle}>
            Adicionando itens ao Pedido #{existingPedidoId}
          </Text>
        </View>
      )}

      {/* Step 2: Category tabs */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product list */}
      <FlatList
        data={filteredProdutos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProdutoCard
            nome={item.nome}
            preco={item.preco}
            categoria={item.categoria}
            onAdd={() => handleAddProduto(item)}
          />
        )}
        contentContainerStyle={styles.productList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
        }
      />

      {/* Cart summary */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cart.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.cartItem}
                  onPress={() => removeFromCart(idx)}
                >
                  <Text style={styles.cartItemText}>
                    {item.quantidade}x {item.produto.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.cartTotal}>
              {cart.reduce((s, i) => s + i.quantidade, 0)} itens -{' '}
              {formatBRL(subtotal)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.disabledButton]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Add item modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalProduto?.nome}</Text>
            <Text style={styles.modalPrice}>
              {modalProduto ? formatBRL(modalProduto.preco) : ''}
            </Text>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setModalQty((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{modalQty}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setModalQty((q) => q + 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.obsInput}
              placeholder="Observacao (opcional)"
              placeholderTextColor={COLORS.gray[400]}
              value={modalObs}
              onChangeText={setModalObs}
              maxLength={200}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmAddToCart}
              >
                <Text style={styles.confirmButtonText}>
                  Adicionar {formatBRL((modalProduto?.preco || 0) * modalQty)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  mesaSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[600],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mesaChip: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  mesaChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  mesaChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  mesaChipTextSelected: {
    color: COLORS.white,
  },
  mesaChipStatus: {
    fontSize: 10,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  productList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray[400],
    paddingVertical: 40,
    fontSize: 15,
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  cartInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItem: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  cartItemText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  cartTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  qtyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  qtyButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qtyValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray[800],
    minWidth: 40,
    textAlign: 'center',
  },
  obsInput: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.gray[800],
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  confirmButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
