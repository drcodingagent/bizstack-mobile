import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Job } from '../types';
import { formatTime, getStatusColor, getStatusLabel } from '../utils/format';

interface Props {
  job: Job;
  onPress: () => void;
}

export default function JobCard({ job, onPress }: Props) {
  const statusColor = getStatusColor(job.status);
  const completedCount = job.tasks.filter((t) => t.completed).length;
  const totalCount = job.tasks.length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.time}>{formatTime(job.scheduled_start_time)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(job.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.clientName}>{job.client.full_name}</Text>
      <Text style={styles.title} numberOfLines={1}>{job.title}</Text>

      <View style={styles.footer}>
        <Text style={styles.address} numberOfLines={1}>
          📍 {job.client.address}
        </Text>
        {totalCount > 0 && (
          <Text style={styles.tasks}>
            ✅ {completedCount}/{totalCount}
          </Text>
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
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  title: {
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
  tasks: {
    fontSize: 13,
    fontWeight: '500',
    color: '#10b981',
  },
});
