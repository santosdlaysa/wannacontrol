import { Platform } from 'react-native';

const ANDROID_EMULATOR_HOST = '10.0.2.2';
const DEFAULT_HOST = 'localhost';

const host = Platform.select({
  android: ANDROID_EMULATOR_HOST,
  default: DEFAULT_HOST,
});

export const API_BASE_URL = `http://${host}:3333/api/v1`;
export const SOCKET_URL = `http://${host}:3333`;

export const COLORS = {
  primary: '#6F4E37',
  secondary: '#FFF8DC',
  accent: '#D4A574',
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
  background: '#FDF6EC',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
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
