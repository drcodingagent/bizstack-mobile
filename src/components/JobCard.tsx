import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Job } from '../types';
import { formatTime } from '../utils/format';
import StatusBadge from './StatusBadge';

interface Props {
  job: Job;
  onPress: () => void;
}

export default function JobCard({ job, onPress }: Props) {
  const completedCount = job.tasks.filter((t) => t.status === 'completed').length;
  const totalCount = job.tasks.length;

  const formatAddress = (address: string) => {
    if (address.length > 40) {
      return address.substring(0, 37) + '...';
    }
    return address;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.jobNumber}>#{job.job_number}</Text>
          {job.scheduled_start_time && (
            <Text style={styles.time}>{formatTime(job.scheduled_start_time)}</Text>
          )}
        </View>
        <StatusBadge status={job.status} size="sm" />
      </View>

      <Text style={styles.title} numberOfLines={1}>{job.title || job.name}</Text>
      <Text style={styles.clientName}>{job.client.full_name}</Text>

      <View style={styles.footer}>
        <Text style={styles.address} numberOfLines={1}>
          📍 {formatAddress(job.client.address)}
        </Text>
        {totalCount > 0 && (
          <View style={styles.taskCount}>
            <Text style={styles.taskCountText}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  jobNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  address: {
    fontSize: 13,
    color: '#9ca3af',
    flex: 1,
    marginRight: 8,
  },
  taskCount: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
