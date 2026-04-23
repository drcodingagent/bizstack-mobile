import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTimeStore } from '../../src/store/timeStore';
import { useJobStore } from '../../src/store/jobStore';
import { Job, TimeClock, AvailableJob } from '../../src/types';
import { formatTime, getStatusColor, getStatusLabel, getTodayISO } from '../../src/utils/format';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getDayHeader(): string {
  const d = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `Today, ${months[d.getMonth()]} ${d.getDate()}`;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Job Card ───────────────────────────────────────────────────────────────

function ScheduleJobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const statusColor = getStatusColor(job.status);
  const completedCount = job.tasks.filter((t) => t.completed).length;
  const totalCount = job.tasks.length;

  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardTime}>
          <Text style={styles.jobCardTimeText}>
            {job.scheduled_start_time ? formatTime(job.scheduled_start_time) : 'Flexible'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(job.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.jobCardTitle} numberOfLines={1}>{job.title}</Text>
      <Text style={styles.jobCardClient}>{job.client.full_name}</Text>
      <View style={styles.jobCardFooter}>
        <Text style={styles.jobCardAddress} numberOfLines={1}>
          📍 {job.job_address.street}, {job.job_address.city}
        </Text>
        {totalCount > 0 && (
          <Text style={styles.jobCardTasks}>{completedCount}/{totalCount}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router = useRouter();
  const { summary, isLoading: timeLoading, fetchSummary, clockIn, clockOut } = useTimeStore();
  const { jobs, isLoading: jobsLoading, fetchJobs, isOffline, pendingActions, syncQueue } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const todayISO = getTodayISO();
  const activeClock = summary?.active_clock;
  const isClockedIn = activeClock && activeClock.clock_out_at === null;
  const isOnBreak = activeClock?.status === 'on_break';

  useEffect(() => {
    fetchSummary();
    fetchJobs(todayISO);
  }, []);

  // Poll every 30s
  useEffect(() => {
    const poll = setInterval(() => {
      fetchSummary();
      fetchJobs(todayISO);
    }, 30000);
    return () => clearInterval(poll);
  }, [todayISO]);

  // Live timer for clocked-in state
  useEffect(() => {
    if (isClockedIn && activeClock?.clock_in_at) {
      const updateElapsed = () => {
        const diff = Math.floor((Date.now() - new Date(activeClock.clock_in_at).getTime()) / 1000);
        setElapsed(diff);
      };
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsed(0);
    }
  }, [isClockedIn, activeClock?.clock_in_at]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchJobs(todayISO)]);
    setRefreshing(false);
  }, [todayISO]);

  const handleClockToggle = () => {
    if (isClockedIn) {
      Alert.alert(
        'Clock Out',
        'Are you sure you want to clock out for the day?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock Out', style: 'destructive', onPress: () => clockOut() },
        ]
      );
    } else {
      Alert.alert(
        'Clock In',
        'Start your work day?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock In', onPress: () => clockIn() },
        ]
      );
    }
  };

  const handleNavigate = (address: string) => {
    const query = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    Linking.openURL(url);
  };

  const handleCallClient = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Find next upcoming job
  const sortedJobs = [...jobs].sort((a, b) => {
    if (!a.scheduled_start_time) return 1;
    if (!b.scheduled_start_time) return -1;
    return a.scheduled_start_time.localeCompare(b.scheduled_start_time);
  });

  const now = new Date();
  const nextJob = sortedJobs.find((j) => {
    if (j.status === 'completed' || j.status === 'cancelled') return false;
    if (!j.scheduled_start_time) return true;
    const time = j.scheduled_start_time;
    const [h, m] = time.split(':').map(Number);
    const jobTime = new Date();
    jobTime.setHours(h, m, 0, 0);
    return jobTime >= now || j.status === 'scheduled';
  });

  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const upcomingJobs = jobs.filter((j) => j.status !== 'completed' && j.status !== 'cancelled').length;

  const isLoading = timeLoading || jobsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={sortedJobs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ScheduleJobCard
            job={item}
            onPress={() => router.push(`/job/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{getDayHeader()}</Text>
            </View>

            {/* Clock Status */}
            <View style={styles.clockSection}>
              <View style={[
                styles.clockStatusBar,
                { backgroundColor: isClockedIn ? '#dcfce7' : '#f3f4f6' },
              ]}>
                <View style={[
                  styles.clockStatusDot,
                  { backgroundColor: isClockedIn ? '#10b981' : '#9ca3af' },
                ]} />
                <Text style={[
                  styles.clockStatusText,
                  { color: isClockedIn ? '#065f46' : '#6b7280' },
                ]}>
                  {isClockedIn
                    ? isOnBreak ? 'On Break' : 'Clocked In'
                    : 'Not Clocked In'}
                </Text>
                {isClockedIn && (
                  <Text style={styles.clockDurationText}>
                    {formatDuration(elapsed)}
                  </Text>
                )}
              </View>

              {/* Big Clock Button */}
              <TouchableOpacity
                style={[
                  styles.clockButton,
                  isClockedIn ? styles.clockButtonActive : styles.clockButtonInactive,
                  isOnBreak && styles.clockButtonBreak,
                ]}
                onPress={handleClockToggle}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isClockedIn ? 'stop-circle' : 'play-circle'}
                  size={48}
                  color="#fff"
                />
                <Text style={styles.clockButtonText}>
                  {isClockedIn ? 'Clock Out' : 'Clock In'}
                </Text>
                {isClockedIn && (
                  <Text style={styles.clockButtonTimer}>
                    {formatDuration(elapsed)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Next Job Card */}
            {nextJob && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>NEXT UP</Text>
                <View style={styles.nextJobCard}>
                  <View style={styles.nextJobInfo}>
                    <Text style={styles.nextJobTitle} numberOfLines={1}>{nextJob.title}</Text>
                    <Text style={styles.nextJobClient}>{nextJob.client.full_name}</Text>
                    <Text style={styles.nextJobAddress} numberOfLines={1}>
                      📍 {nextJob.job_address.street}, {nextJob.job_address.city}
                    </Text>
                    {nextJob.scheduled_start_time && (
                      <Text style={styles.nextJobTime}>
                        🕐 {formatTime(nextJob.scheduled_start_time)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => handleNavigate(
                      `${nextJob.job_address.street}, ${nextJob.job_address.city}, ${nextJob.job_address.state}`
                    )}
                  >
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Today's Jobs */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TODAY'S JOBS ({jobs.length})</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No jobs today</Text>
              <Text style={styles.emptySubtitle}>Enjoy your free day!</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footerSection}>
            {/* Week Summary */}
            <View style={styles.weekSummary}>
              <Text style={styles.weekSummaryTitle}>This Week</Text>
              <View style={styles.weekStatsRow}>
                <View style={styles.weekStat}>
                  <Text style={styles.weekStatValue}>{jobs.length}</Text>
                  <Text style={styles.weekStatLabel}>Total Jobs</Text>
                </View>
                <View style={styles.weekStatDivider} />
                <View style={styles.weekStat}>
                  <Text style={[styles.weekStatValue, { color: '#10b981' }]}>{completedJobs}</Text>
                  <Text style={styles.weekStatLabel}>Completed</Text>
                </View>
                <View style={styles.weekStatDivider} />
                <View style={styles.weekStat}>
                  <Text style={[styles.weekStatValue, { color: '#4f46e5' }]}>{upcomingJobs}</Text>
                  <Text style={styles.weekStatLabel}>Upcoming</Text>
                </View>
              </View>
            </View>
            <View style={{ height: 24 }} />
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
        }
      />

      {isLoading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
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
  listContent: {
    paddingBottom: 24,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Clock Section
  clockSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clockStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  clockStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clockStatusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  clockDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  clockButton: {
    width: '100%',
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  clockButtonActive: {
    backgroundColor: '#dc2626',
  },
  clockButtonInactive: {
    backgroundColor: '#4f46e5',
  },
  clockButtonBreak: {
    backgroundColor: '#f59e0b',
  },
  clockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  clockButtonTimer: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  // Next Job
  nextJobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nextJobInfo: {
    flex: 1,
    gap: 2,
  },
  nextJobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  nextJobClient: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  nextJobAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  nextJobTime: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  navigateBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 2,
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Job Cards
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobCardTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobCardTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  jobCardClient: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardAddress: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
    marginRight: 8,
  },
  jobCardTasks: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },

  // Week Summary
  footerSection: {
    paddingHorizontal: 16,
  },
  weekSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  weekSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  weekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  weekStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  weekStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
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
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249,250,251,0.8)',
  },
});
