import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJobStore } from '../../src/store/jobStore';
import { Job } from '../../src/types';
import { formatTime, getStatusColor, getStatusLabel } from '../../src/utils/format';

type Filter = 'all' | 'scheduled' | 'in_progress' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

// ─── Job Card ───────────────────────────────────────────────────────────────

function JobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  const statusColor = getStatusColor(job.status);
  const completedCount = job.tasks.filter((t) => t.completed).length;
  const totalCount = job.tasks.length;

  return (
    <TouchableOpacity style={styles.jobRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.jobRowLeft}>
        <View style={styles.jobRowTop}>
          <Text style={styles.jobRowTitle} numberOfLines={1}>{job.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(job.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.jobRowClient}>{job.client.full_name}</Text>
        <View style={styles.jobRowMeta}>
          <Text style={styles.jobRowAddress} numberOfLines={1}>
            📍 {job.job_address.street}
          </Text>
          <Text style={styles.jobRowNumber}>#{job.job_number}</Text>
        </View>
        <View style={styles.jobRowBottom}>
          <Text style={styles.jobRowDate}>
            {job.scheduled_date}
            {job.scheduled_start_time ? ` · ${formatTime(job.scheduled_start_time)}` : ''}
          </Text>
          {totalCount > 0 && (
            <Text style={styles.jobRowTasks}>✅ {completedCount}/{totalCount}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function JobsScreen() {
  const router = useRouter();
  const { jobs, isLoading, isOffline, pendingActions, fetchJobs, syncQueue } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const filteredJobs = jobs
    .filter((j) => {
      if (filter === 'all') return true;
      if (filter === 'in_progress') return j.status === 'in_progress' || j.status === 'en_route';
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

  const filterCounts = {
    all: jobs.length,
    scheduled: jobs.filter((j) => j.status === 'scheduled').length,
    in_progress: jobs.filter((j) => j.status === 'in_progress' || j.status === 'en_route').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Jobs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, clients..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label} ({filterCounts[f.key]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <JobRow job={item} onPress={() => router.push(`/job/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try a different search' : 'Pull down to refresh'}
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  searchClear: {
    paddingRight: 12,
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
    paddingHorizontal: 12,
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

  // Job Row
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  jobRowLeft: {
    flex: 1,
    marginRight: 8,
  },
  jobRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  jobRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
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
  jobRowClient: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 3,
  },
  jobRowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobRowAddress: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
    marginRight: 8,
  },
  jobRowNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  jobRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  jobRowDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  jobRowTasks: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
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
  },
});
