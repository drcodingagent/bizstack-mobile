import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Pill, IconButton } from '../../src/components/ui';
import { ClockCard } from '../../src/components/ClockCard';
import { useTimeStore } from '../../src/store/timeStore';
import { useJobStore } from '../../src/store/jobStore';
import { useAuthStore, useFeature } from '../../src/store';
import { Job } from '../../src/types';
import { colors, radii, shadows, spacing } from '../../src/theme';
import { jobStatusColor, jobStatusLabel } from '../../src/theme';
import { formatTime, getTodayISO } from '../../src/utils/format';

function greeting(name?: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}

function todayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { summary, fetchSummary } = useTimeStore();
  const { jobs, fetchJobs } = useJobStore();
  const timeTrackingEnabled = useFeature('time_tracking');
  const [refreshing, setRefreshing] = useState(false);

  const todayISO = getTodayISO();

  const load = useCallback(async () => {
    const tasks: Promise<unknown>[] = [fetchJobs(todayISO)];
    if (timeTrackingEnabled) tasks.push(fetchSummary());
    await Promise.all(tasks);
  }, [todayISO, timeTrackingEnabled]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const todays = jobs.filter((j) => j.scheduled_date === todayISO);
  const sorted = [...todays].sort((a, b) => {
    if (!a.scheduled_start_time) return 1;
    if (!b.scheduled_start_time) return -1;
    return a.scheduled_start_time.localeCompare(b.scheduled_start_time);
  });

  const nextJob = sorted.find((j) => j.status !== 'completed' && j.status !== 'cancelled');

  const done = todays.filter((j) => j.status === 'completed').length;
  const remaining = todays.length - done;
  const weekHours = summary?.week_hours ?? 0;

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JobListItem
            job={item}
            onPress={() => router.push(`/job/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text variant="caption" color={colors.textTertiary}>
              {todayLabel().toUpperCase()}
            </Text>
            <Text variant="display" style={{ marginTop: 4 }}>
              {greeting(user?.first_name)}
            </Text>

            {timeTrackingEnabled && (
              <>
                <View style={{ height: spacing.xl }} />
                <ClockCard />
              </>
            )}

            <StatsRow
              total={todays.length}
              done={done}
              remaining={remaining}
              weekHours={weekHours}
              showWeekHours={timeTrackingEnabled}
            />

            {nextJob && (
              <NextUpCard
                job={nextJob}
                onOpen={() => router.push(`/job/${nextJob.id}`)}
              />
            )}

            {sorted.length > 0 && (
              <View style={styles.listHeader}>
                <Text variant="overline" color={colors.textTertiary}>
                  Today's Schedule
                </Text>
                <Text variant="caption" color={colors.textTertiary}>
                  {sorted.length} {sorted.length === 1 ? 'job' : 'jobs'}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          todays.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
              </View>
              <Text variant="h3" style={{ marginTop: spacing.md }}>
                No jobs today
              </Text>
              <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
                Enjoy your day off.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      />
    </Screen>
  );
}

function StatsRow({
  total,
  done,
  remaining,
  weekHours,
  showWeekHours,
}: {
  total: number;
  done: number;
  remaining: number;
  weekHours: number;
  showWeekHours: boolean;
}) {
  return (
    <View style={styles.stats}>
      <Stat value={String(total)} label="Today" />
      <StatDivider />
      <Stat value={String(done)} label="Done" color={colors.success} />
      <StatDivider />
      <Stat value={String(remaining)} label="Left" color={colors.brand} />
      {showWeekHours && (
        <>
          <StatDivider />
          <Stat value={`${weekHours}h`} label="Week" />
        </>
      )}
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.statItem}>
      <Text variant="h2" color={color ?? colors.textPrimary}>
        {value}
      </Text>
      <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

function NextUpCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const addr = `${job.job_address.street}, ${job.job_address.city}, ${job.job_address.state}`;

  const navigate = () => {
    const q = encodeURIComponent(addr);
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${q}`,
      android: `geo:0,0?q=${q}`,
      default: `https://maps.google.com/?q=${q}`,
    });
    Linking.openURL(url!);
  };

  const call = () => {
    if (job.client.phone) Linking.openURL(`tel:${job.client.phone}`);
  };

  return (
    <Card style={{ marginTop: spacing.xl }} padding="lg" elevated>
      <View style={styles.nextUpHeader}>
        <Text variant="overline" color={colors.brand}>
          Next Up
        </Text>
        <Pill
          label={jobStatusLabel(job.status)}
          color={jobStatusColor(job.status)}
          dot
          size="sm"
        />
      </View>

      <Pressable onPress={onOpen} style={{ marginTop: spacing.sm }}>
        <Text variant="h2" numberOfLines={1}>
          {job.title}
        </Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={1}>
          {job.client.full_name}
        </Text>
        <View style={{ marginTop: spacing.sm, gap: 4 }}>
          <MetaRow icon="location-outline" text={addr} />
          {job.scheduled_start_time && (
            <MetaRow icon="time-outline" text={formatTime(job.scheduled_start_time)} />
          )}
        </View>
      </Pressable>

      <View style={styles.quickActions}>
        <IconButton icon="navigate" label="Directions" onPress={navigate} color={colors.brand} />
        <IconButton
          icon="call"
          label="Call"
          onPress={call}
          color={job.client.phone ? colors.textPrimary : colors.textMuted}
        />
        <IconButton icon="arrow-forward" label="Open" onPress={onOpen} color={colors.textPrimary} />
      </View>
    </Card>
  );
}

function MetaRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={colors.textTertiary} />
      <Text variant="bodySm" color={colors.textSecondary} numberOfLines={1} style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function JobListItem({ job, onPress }: { job: Job; onPress: () => void }) {
  const statusColor = jobStatusColor(job.status);
  const total = job.tasks.length;
  const done = job.tasks.filter((t) => t.status === 'completed').length;
  const isCompleted = job.status === 'completed';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.itemTimeCol}>
        <Text variant="bodyStrong" color={isCompleted ? colors.textTertiary : colors.textPrimary}>
          {job.scheduled_start_time ? formatTime(job.scheduled_start_time) : '—'}
        </Text>
        <View style={[styles.itemBullet, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemHeader}>
          <Text
            variant="bodyStrong"
            color={isCompleted ? colors.textTertiary : colors.textPrimary}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {job.title}
          </Text>
          <Pill label={jobStatusLabel(job.status)} color={statusColor} size="sm" />
        </View>
        <Text variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
          {job.client.full_name}
        </Text>
        <View style={styles.itemMeta}>
          <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
          <Text variant="caption" color={colors.textTertiary} numberOfLines={1} style={{ flex: 1 }}>
            {job.job_address.street}
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  headerBlock: {
    paddingTop: spacing.md,
  },
  stats: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
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
    height: 28,
    backgroundColor: colors.border,
  },

  nextUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },

  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemTimeCol: {
    alignItems: 'center',
    width: 60,
    gap: 4,
  },
  itemBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemMeta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
