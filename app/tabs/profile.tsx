import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { useTimeStore } from '../../src/store/timeStore';
import { Screen, Text } from '../../src/components/ui';
import { colors, radii, shadows, spacing } from '../../src/theme';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { summary } = useTimeStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'time-outline', label: 'My time cards', onPress: () => {} },
    { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & support', onPress: () => {} },
    {
      icon: 'information-circle-outline',
      label: 'About',
      onPress: () => Alert.alert('Eos Log', 'Version 1.0.0'),
    },
  ];

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '??';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="caption" color={colors.textTertiary}>
            PROFILE
          </Text>
          <Text variant="h1" style={{ marginTop: 2 }}>
            Account
          </Text>
        </View>

        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <Text variant="h1" color={colors.onBrand}>
              {initials}
            </Text>
          </View>
          <Text variant="h2" style={{ marginTop: spacing.md }}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {user?.email}
          </Text>
          {user?.role && (
            <View style={styles.roleBadge}>
              <Text variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <Stat value={`${summary?.week_hours ?? 0}h`} label="This week" />
          <StatDivider />
          <Stat
            value={String(summary?.today_clocks?.length ?? 0)}
            label="Shifts today"
          />
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <MenuRow key={item.label} item={item} isLast={i === menuItems.length - 1} />
          ))}
        </View>

        <Pressable onPress={handleLogout} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text variant="bodyStrong" color={colors.danger}>
            Sign out
          </Text>
        </Pressable>

        <Text variant="caption" color={colors.textMuted} style={styles.version}>
          Eos Log · v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text variant="h2">{value}</Text>
      <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && styles.menuItemBorder,
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
      <Text variant="body" style={{ flex: 1 }}>
        {item.label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing['4xl'],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  profileBlock: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },

  stats: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  menu: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  signOut: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
  },

  version: {
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
