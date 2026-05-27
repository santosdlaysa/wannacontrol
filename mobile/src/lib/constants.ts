export const API_BASE_URL = 'https://wannacontrol-web.vercel.app/api/v1';
export const SOCKET_URL = 'https://wannacontrol-web.vercel.app';

export const COLORS = {
  // Core brand (marrom café)
  primary: '#4A2C1A',
  primarySoft: '#5D3A24',
  brand: '#C4864C',
  brandLight: '#E8C9A0',
  brandMuted: '#A06B3A',

  // Surfaces
  background: '#FDF6EC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF9F0',
  card: '#FFFFFF',

  // Semantic
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  text: {
    primary: '#2D1810',
    secondary: '#6B5244',
    tertiary: '#A08E82',
    inverse: '#FFFFFF',
    brand: '#C4864C',
  },
  border: {
    light: '#EDE4DA',
    medium: '#D4C4B5',
    dark: '#B8A494',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'cafecontrol_access_token',
  REFRESH_TOKEN: 'cafecontrol_refresh_token',
} as const;

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
