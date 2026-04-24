import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Pill } from '../../src/components/ui';
import { useJobStore } from '../../src/store/jobStore';
import { Job } from '../../src/types';
import { colors, radii, spacing, jobStatusColor, jobStatusLabel } from '../../src/theme';
import { formatTime, getTodayISO } from '../../src/utils/format';

const DAYS_AHEAD = 14;

function buildDayStrip(): { iso: string; label: string; day: string; isToday: boolean }[] {
  const days: { iso: string; label: string; day: string; isToday: boolean }[] = [];
  const today = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: String(d.getDate()),
      isToday: i === 0,
    });
  }
  return days;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { jobs, fetchJobs } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<string>(getTodayISO());
  const days = useMemo(buildDayStrip, []);

  const load = useCallback(async () => {
    await fetchJobs();
  }, []);

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

  const jobsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const j of jobs) {
      if (!j.scheduled_date) continue;
      map[j.scheduled_date] = (map[j.scheduled_date] || 0) + 1;
    }
    return map;
  }, [jobs]);

  const daySelected = jobs
    .filter((j) => j.scheduled_date === selected)
    .sort((a, b) => {
      if (!a.scheduled_start_time) return 1;
      if (!b.scheduled_start_time) return -1;
      return a.scheduled_start_time.localeCompare(b.scheduled_start_time);
    });

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="caption" color={colors.textTertiary}>
          SCHEDULE
        </Text>
        <Text variant="h1" style={{ marginTop: 2 }}>
          {formatDayHeader(selected)}
        </Text>
      </View>

      <FlatList
        horizontal
        data={days}
        keyExtractor={(d) => d.iso}
        contentContainerStyle={styles.strip}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <DayCell
            label={item.label}
            day={item.day}
            isToday={item.isToday}
            isSelected={item.iso === selected}
            count={jobsByDay[item.iso] || 0}
            onPress={() => setSelected(item.iso)}
          />
        )}
        style={{ flexGrow: 0 }}
      />

      <FlatList
        data={daySelected}
        keyExtractor={(j) => String(j.id)}
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
              <Ionicons name="calendar-clear-outline" size={24} color={colors.textTertiary} />
            </View>
            <Text variant="h3" style={{ marginTop: spacing.md }}>
              Nothing scheduled
            </Text>
            <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }}>
              No jobs booked for this day.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function formatDayHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function DayCell({
  label,
  day,
  isToday,
  isSelected,
  count,
  onPress,
}: {
  label: string;
  day: string;
  isToday: boolean;
  isSelected: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayCell,
        isSelected && styles.dayCellActive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        variant="caption"
        color={isSelected ? colors.onBrand : colors.textTertiary}
      >
        {label}
      </Text>
      <Text
        variant="h2"
        color={isSelected ? colors.onBrand : isToday ? colors.brand : colors.textPrimary}
        style={{ marginTop: 2 }}
      >
        {day}
      </Text>
      <View
        style={[
          styles.dayDot,
          {
            backgroundColor: count > 0
              ? isSelected
                ? colors.onBrand
                : colors.brand
              : 'transparent',
          },
        ]}
      />
    </Pressable>
  );
}

function JobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  const total = job.tasks.length;
  const done = job.tasks.filter((t) => t.status === 'completed').length;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.rowTime}>
        <Text variant="bodyStrong">
          {job.scheduled_start_time ? formatTime(job.scheduled_start_time) : 'Any'}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {job.title}
          </Text>
          <Pill
            label={jobStatusLabel(job.status)}
            color={jobStatusColor(job.status)}
            size="sm"
          />
        </View>
        <Text variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
          {job.client.full_name} · {job.job_address.street}
        </Text>
        {total > 0 && (
          <Text variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
            {done}/{total} tasks
          </Text>
        )}
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
  strip: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 76,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dayCellActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  dayDot: {
    marginTop: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowTime: {
    width: 64,
    paddingTop: 2,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
