export const SYSTEM_MODULES = [
  'MESAS',
  'DELIVERY',
  'RETIRADA',
  'CARDAPIO_ONLINE',
  'COZINHA',
  'CAIXA',
  'FINANCEIRO',
  'CLIENTES',
  'PRODUTOS',
  'COMPLEMENTOS',
  'ENTREGADORES',
  'USUARIOS',
] as const;

export type SystemModule = (typeof SYSTEM_MODULES)[number];

export function normalizeModules(modulos: unknown): SystemModule[] {
  if (!Array.isArray(modulos)) return [];
  return modulos.filter((modulo): modulo is SystemModule =>
    SYSTEM_MODULES.includes(modulo as SystemModule)
  );
}
