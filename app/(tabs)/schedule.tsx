import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJobStore } from '../../src/store';
import { Job } from '../../src/types';
import JobCard from '../../src/components/JobCard';
import { formatDate, getTodayISO } from '../../src/utils/format';

export default function ScheduleScreen() {
  const router = useRouter();
  const { jobs, isLoading, isOffline, fetchJobs, selectedDate, setSelectedDate, pendingActions } =
    useJobStore();
  const [refreshing, setRefreshing] = useState(false);

  const date = selectedDate || getTodayISO();

  useEffect(() => {
    fetchJobs(date);
  }, [date]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs(date);
    setRefreshing(false);
  }, [date]);

  const changeDate = (offset: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const isToday = date === getTodayISO();

  const navigateJob = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {(isOffline || pendingActions > 0) && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {isOffline ? '📡 Offline' : `⏳ ${pendingActions} pending sync`}
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isToday ? "Today's Schedule" : formatDate(date)}
        </Text>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateBtn}>
          <Text style={styles.dateBtnText}>← Yesterday</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedDate(getTodayISO())}
          style={[styles.dateBtn, styles.todayBtn]}
        >
          <Text style={[styles.dateBtnText, styles.todayBtnText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateBtn}>
          <Text style={styles.dateBtnText}>Tomorrow →</Text>
        </TouchableOpacity>
      </View>

      {/* Job List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
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
