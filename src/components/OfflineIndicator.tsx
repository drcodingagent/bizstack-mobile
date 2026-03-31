import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface Props {
  isOffline: boolean;
  pendingActions: number;
  onSync?: () => void;
}

export default function OfflineIndicator({ isOffline, pendingActions, onSync }: Props) {
  if (!isOffline && pendingActions === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {isOffline ? '📡' : '⏳'}
        </Text>
        <Text style={styles.text}>
          {isOffline
            ? "You're offline"
            : `${pendingActions} action${pendingActions > 1 ? 's' : ''} pending`}
        </Text>
      </View>
      {!isOffline && pendingActions > 0 && onSync && (
        <TouchableOpacity style={styles.syncBtn} onPress={onSync}>
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
