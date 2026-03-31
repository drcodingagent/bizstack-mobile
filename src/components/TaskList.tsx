import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onComplete: (taskId: number) => void;
  disabled?: boolean;
}

export default function TaskList({ tasks, onComplete, disabled }: Props) {
  const handleToggle = (task: Task) => {
    if (task.completed) return;

    Alert.alert(
      'Complete Task',
      `Mark "${task.name}" as done?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => onComplete(task.id),
        },
      ]
    );
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
      {tasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[styles.taskRow, task.completed && styles.taskCompleted]}
          onPress={() => handleToggle(task)}
          disabled={disabled || task.completed}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.taskName, task.completed && styles.taskNameCompleted]}>
            {task.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  taskCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
    fontSize: 14,
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
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
