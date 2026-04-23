import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onComplete: (taskId: number) => void;
  onPhoto: (taskId: number) => void;
  disabled?: boolean;
}

export default function TaskList({ tasks, onComplete, onPhoto, disabled }: Props) {
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;

  const handleToggle = (task: Task) => {
    if (task.status === 'completed' || disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Complete Task',
      `Mark "${task.title || task.name}" as done?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => onComplete(task.id),
        },
      ]
    );
  };

  const handlePhoto = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPhoto(task.id);
  };

  if (tasks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No tasks for this job</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {completedCount} of {totalCount} complete
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>

      {/* Task list */}
      {tasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[styles.taskRow, task.status === 'completed' && styles.taskCompleted]}
          onPress={() => handleToggle(task)}
          disabled={disabled || task.status === 'completed'}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, task.status === 'completed' && styles.checkboxChecked]}>
            {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <Text style={[styles.taskName, task.status === 'completed' && styles.taskNameCompleted]}>
            {task.title || task.name}
          </Text>

          {task.status === 'completed' && (
            <View style={styles.completedIndicator}>
              <Text style={styles.completedCheckmark}>✅</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 110,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
  },
  taskCompleted: {
    backgroundColor: '#f0fdf4',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  taskName: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  completedIndicator: {
    marginLeft: 8,
  },
  completedCheckmark: {
    fontSize: 16,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
