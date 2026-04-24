import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';
import { Text } from './ui';

interface Props {
  isOffline: boolean;
  pendingActions: number;
  onSync?: () => void;
}

export default function OfflineIndicator({ isOffline, pendingActions, onSync }: Props) {
  if (!isOffline && pendingActions === 0) return null;

  const text = isOffline
    ? "You're offline — changes will sync later"
    : `${pendingActions} ${pendingActions === 1 ? 'change' : 'changes'} pending sync`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'sync-outline'}
          size={16}
          color={colors.warning}
        />
        <Text variant="caption" color={colors.warning} style={{ fontWeight: '600' }}>
          {text}
        </Text>
      </View>
      {!isOffline && pendingActions > 0 && onSync && (
        <Pressable onPress={onSync} style={styles.syncBtn}>
          <Text variant="caption" color={colors.onBrand} style={{ fontWeight: '700' }}>
            Sync Now
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  syncBtn: {
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
});
