import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimeStore } from '../store/timeStore';
import { TimeClock } from '../types';
import { Button, Card, Pill, Text } from './ui';
import { colors, spacing } from '../theme';

interface ClockCardProps {
  /** When provided, clocking in attaches the clock to this job. */
  jobId?: number;
  jobTitle?: string;
  jobNumber?: string;
  /** Compact variant used inside Job Detail; hides the job-context row. */
  compact?: boolean;
}

function formatElapsed(seconds: number): string {
  if (!seconds || seconds < 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 10) return `${h}h ${m}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}

export function ClockCard({ jobId, jobTitle, jobNumber, compact = false }: ClockCardProps) {
  const {
    summary,
    clockIn,
    clockOut,
    markArrived,
    startWorking,
    onBreak,
    offBreak,
    isLoading,
  } = useTimeStore();

  const active = summary?.active_clock ?? null;
  const clockedIn = active !== null;
  const onBreakNow = active?.status === 'on_break';
  const workStatus = active?.work_status;

  const [tick, setTick] = useState(0);
  const startMs = useMemo(
    () => (active?.clock_in_at ? new Date(active.clock_in_at).getTime() : null),
    [active?.clock_in_at]
  );
  const elapsed = startMs ? Math.floor((Date.now() + tick * 0 - startMs) / 1000) : 0;

  useEffect(() => {
    if (!clockedIn || onBreakNow) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [clockedIn, onBreakNow]);

  const handleClockIn = () => clockIn(jobId);

  const handleClockOut = () => {
    Alert.alert(
      'Clock out?',
      'End your shift now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clock Out', style: 'destructive', onPress: () => clockOut() },
      ]
    );
  };

  const handleBreak = () => (onBreakNow ? offBreak() : onBreak());

  return (
    <Card padding="lg" elevated>
      <StatusRow active={active} onBreak={onBreakNow} />
      <Text variant="display" style={{ marginTop: spacing.xs }}>
        {clockedIn ? formatElapsed(elapsed) : 'Off the clock'}
      </Text>
      {!compact && clockedIn && active?.job && (
        <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }} numberOfLines={1}>
          {active.job.title}
          {active.job.job_number ? ` · ${active.job.job_number}` : ''}
        </Text>
      )}
      {!clockedIn && (
        <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }}>
          {jobId ? 'Start this job when you get here.' : 'Tap Clock In to start your day.'}
        </Text>
      )}

      <View style={styles.actions}>
        {renderPrimary({
          active,
          onBreakNow,
          loading: isLoading,
          onClockIn: handleClockIn,
          onMarkArrived: markArrived,
          onStartWorking: startWorking,
          onEndBreak: offBreak,
          onClockOut: handleClockOut,
        })}
        {renderSecondary({
          active,
          onBreakNow,
          onBreak: handleBreak,
          onClockOut: handleClockOut,
        })}
      </View>
    </Card>
  );
}

function StatusRow({ active, onBreak }: { active: TimeClock | null; onBreak: boolean }) {
  if (!active) {
    return <Pill label="Clocked out" color={colors.textTertiary} dot />;
  }
  if (onBreak) {
    return <Pill label="On break" color={colors.warning} dot />;
  }
  const color = workColor(active.work_status);
  return <Pill label={workLabel(active.work_status)} color={color} dot />;
}

function workLabel(s?: string): string {
  switch (s) {
    case 'traveling': return 'Traveling to site';
    case 'arrived': return 'On site';
    case 'working': return 'Working';
    case 'completed': return 'Clocked in';
    default: return 'Clocked in';
  }
}

function workColor(s?: string): string {
  switch (s) {
    case 'traveling': return colors.info;
    case 'arrived': return colors.warning;
    case 'working': return colors.success;
    default: return colors.brand;
  }
}

function renderPrimary(args: {
  active: TimeClock | null;
  onBreakNow: boolean;
  loading: boolean;
  onClockIn: () => void;
  onMarkArrived: () => void;
  onStartWorking: () => void;
  onEndBreak: () => void;
  onClockOut: () => void;
}) {
  const { active, onBreakNow, loading } = args;

  if (!active) {
    return (
      <Button
        label="Clock In"
        icon="play"
        size="xl"
        variant="primary"
        fullWidth
        loading={loading}
        onPress={args.onClockIn}
      />
    );
  }
  if (onBreakNow) {
    return (
      <Button
        label="End Break"
        icon="play"
        size="xl"
        variant="primary"
        fullWidth
        loading={loading}
        onPress={args.onEndBreak}
      />
    );
  }
  switch (active.work_status) {
    case 'traveling':
      return (
        <Button
          label="I've Arrived"
          icon="location"
          size="xl"
          variant="primary"
          fullWidth
          loading={loading}
          onPress={args.onMarkArrived}
        />
      );
    case 'arrived':
      return (
        <Button
          label="Start Working"
          icon="hammer"
          size="xl"
          variant="success"
          fullWidth
          loading={loading}
          onPress={args.onStartWorking}
        />
      );
    case 'working':
    case 'completed':
    default:
      return (
        <Button
          label="Clock Out"
          icon="stop"
          size="xl"
          variant="danger"
          fullWidth
          loading={loading}
          onPress={args.onClockOut}
        />
      );
  }
}

function renderSecondary(args: {
  active: TimeClock | null;
  onBreakNow: boolean;
  onBreak: () => void;
  onClockOut: () => void;
}) {
  const { active, onBreakNow } = args;
  if (!active) return null;

  // On break → only primary (End Break) shown
  if (onBreakNow) return null;

  // For traveling/arrived/working: show a Break button + subtle Clock Out
  const showClockOut = active.work_status === 'working' || active.work_status === 'completed'
    ? false // already primary
    : true;

  return (
    <View style={styles.secondaryRow}>
      {active.work_status === 'working' && (
        <Button label="Take Break" icon="pause" size="md" variant="secondary" onPress={args.onBreak} style={{ flex: 1 }} />
      )}
      {showClockOut && (
        <Button label="Clock Out" icon="stop" size="md" variant="secondary" onPress={args.onClockOut} style={{ flex: 1 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
