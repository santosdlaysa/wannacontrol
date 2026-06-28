'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { LoginResponse, Restaurante, Usuario } from '@cafecontrol/shared';
import { Perfil } from '@cafecontrol/shared';

type UserInfo = Omit<Usuario, 'pin'>;
type RestaurantInfo = Omit<Restaurante, 'criadoEm'>;

interface AuthContextType {
  user: UserInfo | null;
  restaurante: RestaurantInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  loginPin: (pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [restaurante, setRestaurante] = useState<RestaurantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    function clearSession() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('restaurante');
    }

    async function restoreSession() {
      const storedUser = localStorage.getItem('user');
      const storedRestaurant = localStorage.getItem('restaurante');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      try {
        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser) as UserInfo;
          const parsedRestaurant = storedRestaurant ? JSON.parse(storedRestaurant) as RestaurantInfo : null;
          if (isMounted) {
            setUser(parsedUser);
            setRestaurante(parsedRestaurant);
          }
          return;
        }

        if (refreshToken) {
          const timeout = new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('Tempo de sessao expirado')), 8000);
          });
          const data = await Promise.race([
            api.post<LoginResponse>('/auth/refresh', { refreshToken }),
            timeout,
          ]);

          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.usuario));
          if (data.restaurante) {
            localStorage.setItem('restaurante', JSON.stringify(data.restaurante));
          }

          if (isMounted) {
            setUser(data.usuario);
            setRestaurante((data.restaurante as RestaurantInfo) ?? null);
          }
        }
      } catch {
        clearSession();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const data = await api.post<LoginResponse>('/auth/login', { email, senha });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    if (data.restaurante) {
      localStorage.setItem('restaurante', JSON.stringify(data.restaurante));
    } else {
      localStorage.removeItem('restaurante');
    }
    setUser(data.usuario);
    setRestaurante((data.restaurante as RestaurantInfo) ?? null);
  }, []);

  const loginPin = useCallback(async (pin: string) => {
    const data = await api.post<LoginResponse>('/auth/login-pin', { pin });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.usuario));
    if (data.restaurante) {
      localStorage.setItem('restaurante', JSON.stringify(data.restaurante));
    } else {
      localStorage.removeItem('restaurante');
    }
    setUser(data.usuario);
    setRestaurante((data.restaurante as RestaurantInfo) ?? null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('restaurante');
    setUser(null);
    setRestaurante(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurante,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginPin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function getRoleDashboard(perfil: Perfil): string {
  switch (perfil) {
    case Perfil.COZINHA:
      return '/cozinha';
    case Perfil.CAIXA:
      return '/caixa';
    default:
      return '/dashboard';
  }
}
