import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Pill } from '../../src/components/ui';
import { useJobStore } from '../../src/store/jobStore';
import { Job } from '../../src/types';
import { colors, radii, spacing, jobStatusColor, jobStatusLabel } from '../../src/theme';
import { formatTime } from '../../src/utils/format';

type Filter = 'all' | 'scheduled' | 'in_progress' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Upcoming' },
  { key: 'in_progress', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

export default function JobsScreen() {
  const router = useRouter();
  const { jobs, fetchJobs } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const filtered = jobs
    .filter((j) => {
      if (filter === 'all') return true;
      if (filter === 'scheduled') return j.status === 'scheduled' || j.status === 'new';
      return j.status === filter;
    })
    .filter((j) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.client.full_name.toLowerCase().includes(q) ||
        j.job_number.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (!a.scheduled_date) return 1;
      if (!b.scheduled_date) return -1;
      return b.scheduled_date.localeCompare(a.scheduled_date);
    });

  const counts = {
    all: jobs.length,
    scheduled: jobs.filter((j) => j.status === 'scheduled' || j.status === 'new').length,
    in_progress: jobs.filter((j) => j.status === 'in_progress').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="caption" color={colors.textTertiary}>
          ALL JOBS
        </Text>
        <Text variant="h1" style={{ marginTop: 2 }}>
          Jobs
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, clients…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
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
                {f.label} · {counts[f.key]}
              </Text>
            </Pressable>
          );
        }}
        style={{ flexGrow: 0 }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JobRow job={item} onPress={() => router.push(`/job/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="briefcase-outline" size={24} color={colors.textTertiary} />
            </View>
            <Text variant="h3" style={{ marginTop: spacing.md }}>
              No jobs found
            </Text>
            <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {search ? 'Try a different search.' : 'Pull down to refresh.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function JobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  const total = job.tasks.length;
  const done = job.tasks.filter((t) => t.status === 'completed').length;
  const statusColor = jobStatusColor(job.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.rowAccent, { backgroundColor: statusColor }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {job.title}
          </Text>
          <Pill label={jobStatusLabel(job.status)} color={statusColor} size="sm" />
        </View>
        <Text variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
          {job.client.full_name}
        </Text>
        <View style={styles.rowMeta}>
          <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
          <Text variant="caption" color={colors.textTertiary} numberOfLines={1} style={{ flex: 1 }}>
            {job.job_address.street}, {job.job_address.city}
          </Text>
          <Text variant="caption" color={colors.textTertiary}>
            #{job.job_number}
          </Text>
        </View>
        <View style={styles.rowFooter}>
          <Text variant="caption" color={colors.textSecondary}>
            {job.scheduled_date}
            {job.scheduled_start_time ? ` · ${formatTime(job.scheduled_start_time)}` : ''}
          </Text>
          {total > 0 && (
            <Text variant="caption" color={done === total ? colors.success : colors.textSecondary}>
              {done}/{total} tasks
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowAccent: {
    width: 4,
  },
  rowBody: {
    flex: 1,
    padding: spacing.md,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
