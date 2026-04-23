import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobStore } from '../../src/store';
import { Job } from '../../src/types';
import JobCard from '../../src/components/JobCard';
import OfflineIndicator from '../../src/components/OfflineIndicator';
import { formatDate, getTodayISO } from '../../src/utils/format';

type ViewMode = 'day' | 'week';

export default function ScheduleScreen() {
  const router = useRouter();
  const {
    jobs,
    isLoading,
    isOffline,
    fetchJobs,
    selectedDate,
    setSelectedDate,
    pendingActions,
    syncQueue,
  } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const date = selectedDate || getTodayISO();

  useEffect(() => {
    if (viewMode === 'day') {
      fetchJobs(date);
    } else {
      // Fetch for the week range
      fetchJobs();
    }
  }, [date, viewMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === 'day') {
      await fetchJobs(date);
    } else {
      await fetchJobs();
    }
    setRefreshing(false);
  }, [date, viewMode]);

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const getWeekDays = (): string[] => {
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay(); // 0 = Sunday
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${dd}`);
    }
    return days;
  };

  const isToday = date === getTodayISO();

  const navigateJob = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  // Week view: group jobs by date
  const weekDays = getWeekDays();
  const jobsByDate = viewMode === 'week'
    ? weekDays.map((d) => ({
        date: d,
        dayName: new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: new Date(d + 'T00:00:00').getDate(),
        isToday: d === getTodayISO(),
        isSelected: d === date,
        jobs: jobs.filter((j) => j.scheduled_date === d),
      }))
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      <OfflineIndicator
        isOffline={isOffline}
        pendingActions={pendingActions}
        onSync={syncQueue}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isToday ? "Today's Schedule" : formatDate(date)}
        </Text>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>
            Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigation (day mode) */}
      {viewMode === 'day' && (
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateBtn}>
            <Text style={styles.dateBtnText}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedDate(getTodayISO())}
            style={[styles.dateBtn, styles.todayBtn]}
          >
            <Text style={[styles.dateBtnText, styles.todayBtnText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateBtn}>
            <Text style={styles.dateBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Week Strip (week mode) */}
      {viewMode === 'week' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekStrip}
        >
          {jobsByDate.map((day) => (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.weekDay,
                day.isSelected && styles.weekDaySelected,
                day.isToday && styles.weekDayToday,
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text
                style={[
                  styles.weekDayName,
                  day.isSelected && styles.weekDayNameSelected,
                ]}
              >
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.weekDayNum,
                  day.isSelected && styles.weekDayNumSelected,
                ]}
              >
                {day.dayNum}
              </Text>
              {day.jobs.length > 0 && (
                <View
                  style={[
                    styles.weekDayDot,
                    day.isSelected && { backgroundColor: '#fff' },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Job List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : viewMode === 'day' ? (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <JobCard job={item} onPress={() => navigateJob(item)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No jobs scheduled</Text>
              <Text style={styles.emptySubtitle}>
                {isToday ? 'Enjoy your free day!' : 'No jobs on this date'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={jobsByDate}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
          renderItem={({ item: day }) => (
            <View style={styles.weekSection}>
              <Text style={styles.weekSectionTitle}>
                {day.dayName}, {formatDate(day.date)}
                {day.isToday ? ' (Today)' : ''}
              </Text>
              {day.jobs.length === 0 ? (
                <Text style={styles.weekEmpty}>No jobs</Text>
              ) : (
                day.jobs.map((job) => (
                  <JobCard key={job.id} job={job} onPress={() => navigateJob(job)} />
                ))
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#111827',
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  dateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  todayBtn: {
    backgroundColor: '#4f46e5',
  },
  todayBtnText: {
    color: '#fff',
  },
  weekStrip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  weekDay: {
    alignItems: 'center',
    width: 52,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  weekDaySelected: {
    backgroundColor: '#4f46e5',
  },
  weekDayToday: {
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  weekDayNameSelected: {
    color: '#c7d2fe',
  },
  weekDayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  weekDayNumSelected: {
    color: '#fff',
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4f46e5',
    marginTop: 4,
  },
  weekSection: {
    marginBottom: 16,
    gap: 6,
  },
  weekSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginHorizontal: 16,
    marginBottom: 4,
    marginTop: 8,
  },
  weekEmpty: {
    fontSize: 13,
    color: '#9ca3af',
    marginHorizontal: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 24,
  },
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
  },
});
