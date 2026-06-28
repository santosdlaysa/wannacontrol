import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { SocketProvider, useSocket } from '../src/providers/SocketProvider';
import { COLORS } from '../src/lib/constants';

// Banner de conexão desabilitado - app usa polling via API REST
// WebSocket não funciona com deploy na Vercel

function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    console.log('[NAV GUARD]', { isLoading, isAuthenticated, segments: segments.join('/') });
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'pedido' ||
      segments[0] === 'relatorios' ||
      segments[0] === 'caixa-screen' ||
      segments[0] === 'produtos' ||
      segments[0] === 'pedidos-delivery';

    if (!isAuthenticated && inAuthGroup) {
      console.log('[NAV GUARD] -> /login');
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      console.log('[NAV GUARD] -> /(tabs)/mesas');
      router.replace('/(tabs)/mesas');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingBrand}>cafecontrol</Text>
        <ActivityIndicator size="small" color={COLORS.brand} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="pedido" options={{ headerShown: false }} />
        <Stack.Screen name="relatorios" options={{ headerShown: true, title: 'Relatorios' }} />
        <Stack.Screen name="caixa-screen" options={{ headerShown: true, title: 'Caixa' }} />
        <Stack.Screen name="produtos" options={{ headerShown: true, title: 'Produtos' }} />
        <Stack.Screen name="pedidos-delivery" options={{ headerShown: true, title: 'Pedidos Delivery' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <StatusBar style="light" backgroundColor={COLORS.primary} translucent={false} />
        <NavigationGuard />
      </SocketProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingBrand: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.brand,
    letterSpacing: 1,
  },
  banner: {
    backgroundColor: COLORS.danger,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    opacity: 0.7,
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
