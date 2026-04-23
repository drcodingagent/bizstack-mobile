import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '../../src/types';
import { getConversations, getUnreadCount } from '../../src/api/inbox';

type Filter = 'all' | 'unread' | 'job' | 'client';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'job', label: 'Job-related' },
  { key: 'client', label: 'Client' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getChannelIcon(channel: string): string {
  switch (channel) {
    case 'sms': return '💬';
    case 'email': return '📧';
    case 'internal': return '🏢';
    default: return '💬';
  }
}

// ─── Conversation Card ──────────────────────────────────────────────────────

function ConversationCard({ conversation }: { conversation: Conversation }) {
  const hasUnread = conversation.unread_count > 0;
  const preview = conversation.last_message?.body || 'No messages yet';
  const time = conversation.last_message?.created_at;

  return (
    <TouchableOpacity style={styles.convCard} activeOpacity={0.7}>
      <View style={styles.convLeft}>
        <View style={[styles.convIcon, hasUnread && styles.convIconUnread]}>
          <Text style={styles.convIconText}>
            {getChannelIcon(conversation.channel)}
          </Text>
        </View>
      </View>
      <View style={styles.convCenter}>
        <View style={styles.convTopRow}>
          <Text
            style={[styles.convSubject, hasUnread && styles.convSubjectUnread]}
            numberOfLines={1}
          >
            {conversation.subject}
          </Text>
          {time && (
            <Text style={styles.convTime}>{timeAgo(time)}</Text>
          )}
        </View>
        <Text style={styles.convClient} numberOfLines={1}>
          {conversation.client.name}
        </Text>
        <Text
          style={[styles.convPreview, hasUnread && styles.convPreviewUnread]}
          numberOfLines={1}
        >
          {conversation.last_message?.sender ? `${conversation.last_message.sender}: ` : ''}
          {preview}
        </Text>
      </View>
      {hasUnread && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

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
      if (filter === 'jobs') params.context_type = 'Job';

      const data = await getConversations(params);
      setConversations(data);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      setError('Failed to load messages');
      setConversations([]);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
    setIsLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
  };

  const filteredConversations = conversations.filter((c) => {
    switch (filter) {
      case 'unread': return c.unread_count > 0;
      case 'job': return c.context_type === 'Job';
      case 'client': return c.context_type !== 'Job';
      default: return true;
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => handleFilterChange(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversation List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color="#d1d5db" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ConversationCard conversation={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Messages from clients and the office will appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: '#4f46e5',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },

  // List
  list: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Conversation Card
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  convLeft: {
    marginRight: 12,
  },
  convIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convIconUnread: {
    backgroundColor: '#ede9fe',
  },
  convIconText: {
    fontSize: 18,
  },
  convCenter: {
    flex: 1,
    marginRight: 8,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  convSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  convSubjectUnread: {
    fontWeight: '700',
  },
  convTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  convClient: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  convPreview: {
    fontSize: 13,
    color: '#9ca3af',
  },
  convPreviewUnread: {
    color: '#6b7280',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
