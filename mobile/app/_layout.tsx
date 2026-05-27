import React from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
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

function ConnectionBanner() {
  const { isConnected } = useSocket();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || isConnected) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.bannerDot} />
      <Text style={styles.bannerText}>Sem conexao com o servidor</Text>
    </View>
  );
}

function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    console.log('[NAV GUARD]', { isLoading, isAuthenticated, segments: segments.join('/') });
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'pedido';

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
      <ConnectionBanner />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
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
