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
import type { Usuario, LoginResponse } from '@cafecontrol/shared';

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
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    setUser(null);
  }, []);

  // Check stored token on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.ACCESS_TOKEN,
        );
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Validate token by fetching user profile
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refreshToken: await SecureStore.getItemAsync(
              SECURE_STORE_KEYS.REFRESH_TOKEN,
            ),
          }),
        });

        if (response.ok) {
          const data: LoginResponse = await response.json();
          await storeTokens(data);
        } else {
          await clearAuth();
        }
      } catch {
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [storeTokens, clearAuth]);

  const login = useCallback(
    async (pin: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'PIN invalido');
      }

      await storeTokens(data as LoginResponse);
    },
    [storeTokens],
  );

  const loginEmail = useCallback(
    async (email: string, senha: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

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
