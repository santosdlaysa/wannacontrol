import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, API_BASE_URL } from '../lib/constants';
import { authEvents } from '../lib/auth-events';
import type { Usuario, LoginResponse } from '@chefflow/shared';

interface AuthContextData {
  user: Omit<Usuario, 'pin'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<void>;
  loginEmail: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<Usuario, 'pin'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeTokens = useCallback(async (data: LoginResponse) => {
    console.log('[AUTH] storeTokens called, user:', data.usuario?.nome);
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.ACCESS_TOKEN,
      data.accessToken,
    );
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.REFRESH_TOKEN,
      data.refreshToken,
    );
    setUser(data.usuario);
  }, []);

  const clearAuth = useCallback(async () => {
    console.log('[AUTH] clearAuth called');
    console.trace('[AUTH] clearAuth stack');
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    setUser(null);
  }, []);

  // Listen for forced logout from api-client (e.g. 401 responses)
  useEffect(() => {
    return authEvents.onForceLogout(() => {
      console.log('[AUTH] forceLogout event received');
      clearAuth();
    });
  }, [clearAuth]);

  // Check stored token on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.ACCESS_TOKEN,
        );
        console.log('[AUTH] mount check, hasToken:', !!token);
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Validate token by refreshing
        const refreshToken = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.REFRESH_TOKEN,
        );
        console.log('[AUTH] attempting refresh, hasRefreshToken:', !!refreshToken);

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        console.log('[AUTH] refresh response:', response.status);

        if (response.ok) {
          const data: LoginResponse = await response.json();
          await storeTokens(data);
        } else {
          console.log('[AUTH] refresh failed, clearing auth');
          await clearAuth();
        }
      } catch (err) {
        console.log('[AUTH] refresh error:', err);
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [storeTokens, clearAuth]);

  const login = useCallback(
    async (pin: string) => {
      console.log('[AUTH] login-pin chamando API:', `${API_BASE_URL}/auth/login-pin`);
      const response = await fetch(`${API_BASE_URL}/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();
      console.log('[AUTH] login-pin response:', response.status, data?.usuario?.nome);

      if (!response.ok) {
        throw new Error(data?.message || 'PIN invalido');
      }

      await storeTokens(data as LoginResponse);
    },
    [storeTokens],
  );

  const loginEmail = useCallback(
    async (email: string, senha: string) => {
      console.log('[AUTH] login-email chamando API:', `${API_BASE_URL}/auth/login`);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      console.log('[AUTH] login-email response:', response.status, data?.usuario?.nome);

      if (!response.ok) {
        throw new Error(data?.message || 'Credenciais invalidas');
      }

      await storeTokens(data as LoginResponse);
    },
    [storeTokens],
  );

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context.isAuthenticated && context.isAuthenticated === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
