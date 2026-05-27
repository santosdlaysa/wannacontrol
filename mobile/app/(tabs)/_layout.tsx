import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../src/lib/constants';
import { useSocket } from '../../src/providers/SocketProvider';
import { SOCKET_EVENTS, type ItemReadyPayload } from '@cafecontrol/shared';

export default function TabLayout() {
  const { socket } = useSocket();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleItemReady = (_payload: ItemReadyPayload) => {
      setAlertCount((prev) => prev + 1);
    };

    socket.on(SOCKET_EVENTS.ITEM_READY, handleItemReady);
    return () => {
      socket.off(SOCKET_EVENTS.ITEM_READY, handleItemReady);
    };
  }, [socket]);

  // Allow alertas screen to reset badge
  // We use a global callback approach via context or direct state
  // For simplicity we pass it through the tab screen options
  (global as any).__resetAlertCount = () => setAlertCount(0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="mesas"
        options={{
          title: 'Mesas',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>&#9638;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="novo-pedido"
        options={{
          title: 'Novo Pedido',
          tabBarIcon: ({ color, size }) => (
            <View
              style={[
                styles.addIcon,
                { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
              ]}
            >
              <Text style={{ fontSize: size - 2, color: COLORS.white, fontWeight: '700' }}>
                +
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Text style={{ fontSize: size, color }}>&#128276;</Text>
              {alertCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addIcon: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
