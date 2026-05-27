const CATEGORY_MAP: Record<string, { emoji: string; bg: string }> = {
  'BEBIDA': { emoji: '\u2615', bg: '#FFF3E0' },
  'BEBIDAS': { emoji: '\u2615', bg: '#FFF3E0' },
  'CAFE': { emoji: '\u2615', bg: '#EFEBE9' },
  'CAFES': { emoji: '\u2615', bg: '#EFEBE9' },
  'LANCHE': { emoji: '\uD83C\uDF54', bg: '#FFF8E1' },
  'LANCHES': { emoji: '\uD83C\uDF54', bg: '#FFF8E1' },
  'SALGADO': { emoji: '\uD83E\uDD50', bg: '#FFF9C4' },
  'SALGADOS': { emoji: '\uD83E\uDD50', bg: '#FFF9C4' },
  'DOCE': { emoji: '\uD83C\uDF70', bg: '#FCE4EC' },
  'DOCES': { emoji: '\uD83C\uDF70', bg: '#FCE4EC' },
  'SOBREMESA': { emoji: '\uD83C\uDF68', bg: '#F3E5F5' },
  'SOBREMESAS': { emoji: '\uD83C\uDF68', bg: '#F3E5F5' },
  'PRATO': { emoji: '\uD83C\uDF5D', bg: '#E8F5E9' },
  'PRATOS': { emoji: '\uD83C\uDF5D', bg: '#E8F5E9' },
  'REFEICAO': { emoji: '\uD83C\uDF72', bg: '#E8F5E9' },
  'REFEICOES': { emoji: '\uD83C\uDF72', bg: '#E8F5E9' },
  'SUCO': { emoji: '\uD83E\uDDC3', bg: '#E0F7FA' },
  'SUCOS': { emoji: '\uD83E\uDDC3', bg: '#E0F7FA' },
  'AGUA': { emoji: '\uD83D\uDCA7', bg: '#E3F2FD' },
  'CERVEJA': { emoji: '\uD83C\uDF7A', bg: '#FFF8E1' },
  'CERVEJAS': { emoji: '\uD83C\uDF7A', bg: '#FFF8E1' },
  'DRINK': { emoji: '\uD83C\uDF79', bg: '#FCE4EC' },
  'DRINKS': { emoji: '\uD83C\uDF79', bg: '#FCE4EC' },
  'PETISCO': { emoji: '\uD83C\uDF7F', bg: '#FFF3E0' },
  'PETISCOS': { emoji: '\uD83C\uDF7F', bg: '#FFF3E0' },
};

const DEFAULT = { emoji: '\uD83C\uDF7D', bg: '#F5F5F5' };

export function getCategoryVisual(categoria: string): { emoji: string; bg: string } {
  const key = categoria.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CATEGORY_MAP[key] || DEFAULT;
}
