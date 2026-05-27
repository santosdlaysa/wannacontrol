import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SOCKET_EVENTS, type ItemReadyPayload } from '@cafecontrol/shared';
import { useSocket } from '../../src/providers/SocketProvider';
import { COLORS } from '../../src/lib/constants';

interface AlertItem {
  id: string;
  mesaNumero: number;
  produtoNome: string;
  pedidoId: number;
  itemId: number;
  timestamp: Date;
  read: boolean;
}

export default function AlertasScreen() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleItemReady = (payload: ItemReadyPayload) => {
      const newAlert: AlertItem = {
        id: `${payload.itemId}-${Date.now()}`,
        mesaNumero: payload.mesaNumero,
        produtoNome: payload.produtoNome,
        pedidoId: payload.pedidoId,
        itemId: payload.itemId,
        timestamp: new Date(),
        read: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    };

    socket.on(SOCKET_EVENTS.ITEM_READY, handleItemReady);
    return () => {
      socket.off(SOCKET_EVENTS.ITEM_READY, handleItemReady);
    };
  }, [socket]);

  // Reset badge count when viewing alerts
  useEffect(() => {
    if ((global as any).__resetAlertCount) {
      (global as any).__resetAlertCount();
    }
  }, [alerts.length]);

  const handleDismiss = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  }, []);

  const handleClearRead = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.read));
  }, []);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <View style={styles.container}>
      {alerts.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
          </Text>
          {alerts.some((a) => a.read) && (
            <TouchableOpacity onPress={handleClearRead}>
              <Text style={styles.clearText}>Limpar lidas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.alertCard, item.read && styles.alertCardRead]}
            onPress={() => handleDismiss(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>
                {item.read ? '\u2713' : '\u{1F37D}'}
              </Text>
            </View>
            <View style={styles.alertContent}>
              <Text
                style={[styles.alertTitle, item.read && styles.mutedText]}
              >
                Mesa {item.mesaNumero}
              </Text>
              <Text
                style={[styles.alertMessage, item.read && styles.mutedText]}
              >
                {item.produtoNome} esta pronto!
              </Text>
            </View>
            <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>&#9749;</Text>
            <Text style={styles.emptyText}>Nenhuma notificacao</Text>
            <Text style={styles.emptySubtext}>
              Voce sera notificado quando itens estiverem prontos
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  clearText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertCardRead: {
    opacity: 0.5,
    borderLeftColor: COLORS.gray[300],
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertIconText: {
    fontSize: 18,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  mutedText: {
    color: COLORS.gray[400],
  },
  alertTime: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
