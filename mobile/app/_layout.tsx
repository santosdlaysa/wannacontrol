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
      <Text style={styles.bannerText}>Sem conexao com o servidor</Text>
    </View>
  );
}

function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'pedido';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)/mesas');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
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
    backgroundColor: COLORS.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  banner: {
    backgroundColor: COLORS.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
