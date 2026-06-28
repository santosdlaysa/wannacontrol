const BASE_URL = '/api/v1';

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
    return data.accessToken as string;
  } catch {
    return null;
  }
}

function clearSessionAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && path !== '/auth/refresh') {
    if (typeof window === 'undefined') throw new ApiError('Sessao expirada', 401);

    if (isRefreshing) {
      // Aguarda o refresh em andamento
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (!newToken) throw new ApiError('Sessao expirada', 401);
      headers['Authorization'] = `Bearer ${newToken}`;
      const retry = await fetch(url, { ...options, headers });
      if (!retry.ok) throw new ApiError('Erro na requisicao', retry.status);
      return retry.status === 204 ? (undefined as T) : retry.json();
    }

    isRefreshing = true;
    const newToken = await tryRefreshToken();
    isRefreshing = false;
    refreshQueue.forEach((cb) => cb(newToken ?? ''));
    refreshQueue = [];

    if (!newToken) {
      clearSessionAndRedirect();
      throw new ApiError('Sessao expirada', 401);
    }

    headers['Authorization'] = `Bearer ${newToken}`;
    const retry = await fetch(url, { ...options, headers });
    if (retry.status === 401) {
      clearSessionAndRedirect();
      throw new ApiError('Sessao expirada', 401);
    }
    if (!retry.ok) {
      let data: unknown;
      try { data = await retry.json(); } catch { data = null; }
      const message = (data && typeof data === 'object' && 'message' in data ? (data as { message: string }).message : null) || `Erro ${retry.status}`;
      throw new ApiError(message, retry.status, data);
    }
    return retry.status === 204 ? (undefined as T) : retry.json();
  }

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? (data as { message: string }).message
        : null) || `Erro ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),

  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: <T = unknown>(path: string, file: File, fieldName = 'imagem') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return request<T>(path, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
};

export { ApiError };
