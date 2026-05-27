import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusPreparo, type Pedido } from '@cafecontrol/shared';
import { COLORS, SHADOWS } from '../../src/lib/constants';
import { useAuth } from '../../src/providers/AuthProvider';
import { apiClient } from '../../src/lib/api-client';

export default function TabLayout() {
  const { user, isAuthenticated } = useAuth();
  const [readyCount, setReadyCount] = useState(0);

  const fetchReadyCount = useCallback(async () => {
    try {
      const pedidos = await apiClient.get<Pedido[]>('/pedidos?status=ABERTO');
      let count = 0;
      for (const p of pedidos) {
        if (!p.itens) continue;
        for (const item of p.itens) {
          if (item.statusPreparo === StatusPreparo.PRONTO) count++;
        }
      }
      setReadyCount(count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchReadyCount();
    const interval = setInterval(fetchReadyCount, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchReadyCount]);

  // Allow alertas screen to reset
  (global as any).__resetAlertCount = () => setReadyCount(0);
  (global as any).__refreshAlertCount = fetchReadyCount;

  const initials = user?.nome
    ? user.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 64,
          paddingHorizontal: 8,
          ...SHADOWS.float,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
          ...SHADOWS.lg,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="mesas"
        options={{
          title: 'Mesas',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <View style={[styles.indicator, focused && styles.indicatorActive]} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>Mesas</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="novo-pedido"
        options={{
          title: 'Novo Pedido',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <View style={[styles.indicator, focused && styles.indicatorActive]} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>Pedido</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <View style={[styles.indicator, focused && styles.indicatorActive]} />
              <View style={styles.alertRow}>
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>Alertas</Text>
                {readyCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{readyCount > 99 ? '99+' : readyCount}</Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tab}>
              <View style={[styles.indicator, focused && styles.indicatorActive]} />
              <View style={[styles.avatar, focused && styles.avatarActive]}>
                <Text style={[styles.avatarText, focused && styles.avatarTextActive]}>{initials}</Text>
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    minWidth: 56,
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  indicatorActive: {
    backgroundColor: COLORS.brand,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.tertiary,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.brand,
    fontWeight: '700',
  },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: COLORS.danger,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: COLORS.brand,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.tertiary,
    letterSpacing: 0.5,
  },
  avatarTextActive: {
    color: '#FFFFFF',
  },
});
