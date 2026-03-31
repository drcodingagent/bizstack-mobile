import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { JobStatus } from '../types';
import { getStatusColor, getStatusLabel } from '../utils/format';

interface Props {
  currentStatus: JobStatus;
  onStatusChange: (status: JobStatus) => void;
  isLoading?: boolean;
}

const STATUS_FLOW: { value: JobStatus; label: string; icon: string }[] = [
  { value: 'scheduled', label: 'Scheduled', icon: '📅' },
  { value: 'en_route', label: 'En Route', icon: '🚗' },
  { value: 'in_progress', label: 'In Progress', icon: '🔧' },
  { value: 'completed', label: 'Completed', icon: '✅' },
];

export default function StatusButton({ currentStatus, onStatusChange, isLoading }: Props) {
  const currentIndex = STATUS_FLOW.findIndex((s) => s.value === currentStatus);
  const nextStatus = STATUS_FLOW[currentIndex + 1];

  // Find available transitions
  const availableStatuses = STATUS_FLOW.filter((s) => {
    const idx = STATUS_FLOW.findIndex((x) => x.value === s.value);
    return idx === currentIndex || idx === currentIndex + 1;
  });

  return (
    <View style={styles.container}>
      {/* Current status display */}
      <View style={styles.currentRow}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(currentStatus) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
            {getStatusLabel(currentStatus)}
          </Text>
        </View>
        {isLoading && <ActivityIndicator size="small" color="#4f46e5" style={styles.spinner} />}
      </View>

      {/* Quick action buttons */}
      <View style={styles.actionsRow}>
        {availableStatuses.map((status) => {
          const isCurrent = status.value === currentStatus;
          const color = getStatusColor(status.value);

          return (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.actionBtn,
                { backgroundColor: isCurrent ? '#f3f4f6' : color },
                isCurrent && styles.actionBtnActive,
              ]}
              onPress={() => !isCurrent && onStatusChange(status.value)}
              disabled={isCurrent || isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>{status.icon}</Text>
              <Text
                style={[
                  styles.actionText,
                  { color: isCurrent ? color : '#fff' },
                ]}
              >
                {isCurrent ? 'Current' : status.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  spinner: {
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnActive: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
