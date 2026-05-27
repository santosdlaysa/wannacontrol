import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, SECURE_STORE_KEYS } from './constants';
import { authEvents } from './auth-events';

type RequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    authEvents.emitForceLogout();
    throw new Error('Sessao expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Erro ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function request<T>(
  method: string,
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options?.headers,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (options?.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, config);
  return handleResponse<T>(response);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};
