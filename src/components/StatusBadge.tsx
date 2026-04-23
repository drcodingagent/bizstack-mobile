import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3b82f6',
  en_route: '#f59e0b',
  in_progress: '#10b981',
  completed: '#6b7280',
  cancelled: '#dc2626',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  en_route: 'En Route',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const color = STATUS_COLORS[status] || '#6b7280';
  const label = STATUS_LABELS[status] || status;

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '15',
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            width: isSmall ? 6 : 8,
            height: isSmall ? 6 : 8,
            borderRadius: isSmall ? 3 : 4,
            marginRight: isSmall ? 5 : 6,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  dot: {},
  label: {
    fontWeight: '600',
  },
});
