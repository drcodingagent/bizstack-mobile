import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text } from '../../src/components/ui';
import { Conversation } from '../../src/types';
import { getConversations, getUnreadCount } from '../../src/api/inbox';
import { colors, radii, spacing } from '../../src/theme';

type Filter = 'all' | 'unread' | 'job' | 'client';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'job', label: 'Jobs' },
  { key: 'client', label: 'Clients' },
];

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function channelIcon(channel: string): keyof typeof Ionicons.glyphMap {
  switch (channel) {
    case 'sms': return 'chatbubble-ellipses-outline';
    case 'email': return 'mail-outline';
    case 'internal': return 'business-outline';
    default: return 'chatbubble-ellipses-outline';
  }
}

export default function InboxScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, string> = {};
      if (filter === 'unread') params.filter = 'unread';
      const [list, count] = await Promise.all([getConversations(params), getUnreadCount()]);
      setConversations(list);
      setUnreadCount(count);
    } catch {
      setError('Could not load messages.');
      setConversations([]);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      fetchData().finally(() => setIsLoading(false));
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const filtered = conversations.filter((c) => {
    switch (filter) {
      case 'unread': return c.unread_count > 0;
      case 'job': return c.context_type === 'Job';
      case 'client': return c.context_type !== 'Job';
      default: return true;
    }
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text variant="caption" color={colors.textTertiary}>
            INBOX
          </Text>
          <Text variant="h1" style={{ marginTop: 2 }}>
            Messages
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadPill}>
            <Text variant="caption" color={colors.onBrand} style={{ fontWeight: '700' }}>
              {unreadCount} new
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={FILTERS}
        keyExtractor={(f) => f.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        renderItem={({ item: f }) => {
          const active = filter === f.key;
          return (
            <Pressable
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text
                variant="caption"
                color={active ? colors.onBrand : colors.textSecondary}
                style={{ fontWeight: '600' }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        }}
        style={{ flexGrow: 0 }}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textTertiary} />
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
            {error}
          </Text>
          <Pressable onPress={fetchData} style={styles.retry}>
            <Text variant="bodyStrong" color={colors.onBrand}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => <Row conversation={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.brand} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyCircle}>
                <Ionicons name="chatbubble-outline" size={24} color={colors.textTertiary} />
              </View>
              <Text variant="h3" style={{ marginTop: spacing.md }}>
                No messages
              </Text>
              <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Client and office messages will show here.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

function Row({ conversation }: { conversation: Conversation }) {
  const hasUnread = conversation.unread_count > 0;
  const preview = conversation.last_message?.body || 'No messages yet';
  const time = conversation.last_message?.created_at;

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
        <Ionicons
          name={channelIcon(conversation.channel)}
          size={18}
          color={hasUnread ? colors.brand : colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowHeader}>
          <Text
            variant={hasUnread ? 'bodyStrong' : 'body'}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {conversation.subject}
          </Text>
          {time && (
            <Text variant="caption" color={colors.textTertiary}>
              {timeAgo(time)}
            </Text>
          )}
        </View>
        <Text variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
          {conversation.client.name}
        </Text>
        <Text
          variant="bodySm"
          color={hasUnread ? colors.textPrimary : colors.textTertiary}
          numberOfLines={1}
          style={{ marginTop: 2 }}
        >
          {conversation.last_message?.sender
            ? `${conversation.last_message.sender}: `
            : ''}
          {preview}
        </Text>
      </View>
      {hasUnread && (
        <View style={styles.unreadDot}>
          <Text variant="caption" color={colors.onBrand} style={{ fontWeight: '700' }}>
            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  unreadPill: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: colors.brandSoft,
  },
  unreadDot: {
    backgroundColor: colors.brand,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  retry: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
  emptyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
