import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

interface Props {
  status: 'clocked_out' | 'clocked_in' | 'on_break';
  workStatus?: 'traveling' | 'arrived' | 'working' | 'completed';
  onPress: (action: string) => void;
  loading?: boolean;
}

export default function ClockButton({ status, workStatus, onPress, loading }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulsing animation when clocked in
  React.useEffect(() => {
    if (status === 'clocked_in') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getStatusConfig = () => {
    switch (status) {
      case 'clocked_in':
        return {
          backgroundColor: '#10b981',
          icon: '▶️',
          label: 'Working',
          textColor: '#fff',
        };
      case 'on_break':
        return {
          backgroundColor: '#f59e0b',
          icon: '⏸️',
          label: 'On Break',
          textColor: '#fff',
        };
      case 'clocked_out':
      default:
        return {
          backgroundColor: '#6b7280',
          icon: '🕐',
          label: 'Clock In',
          textColor: '#fff',
        };
    }
  };

  const getActions = useCallback(() => {
    const actions: { label: string; action: string; destructive?: boolean }[] = [];

    if (status === 'clocked_out') {
      actions.push({ label: 'Clock In', action: 'clock_in' });
    } else if (status === 'clocked_in') {
      if (workStatus === 'traveling') {
        actions.push({ label: 'Mark Arrived', action: 'mark_arrived' });
      } else if (workStatus === 'arrived') {
        actions.push({ label: 'Start Working', action: 'start_working' });
      } else if (workStatus === 'working') {
        actions.push({ label: 'Start Break', action: 'start_break' });
        actions.push({ label: 'Clock Out', action: 'clock_out', destructive: true });
      }
    } else if (status === 'on_break') {
      actions.push({ label: 'End Break', action: 'end_break' });
      actions.push({ label: 'Clock Out', action: 'clock_out', destructive: true });
    }

    return actions;
  }, [status, workStatus]);

  const handlePress = () => {
    // Simple vibration feedback (no expo-haptics dependency)
    try {
      const { Vibration } = require('react-native');
      Vibration.vibrate(10);
    } catch {}

    const actions = getActions();

    if (actions.length === 1) {
      // Single action — confirm if destructive
      if (actions[0].destructive) {
        onPress(actions[0].action);
      } else {
        onPress(actions[0].action);
      }
    } else if (actions.length > 1) {
      // Multiple actions — show action sheet
      const options = actions.map((a) => ({
        text: a.label,
        style: a.destructive ? 'destructive' as const : 'default' as const,
        onPress: () => onPress(a.action),
      }));
      options.push({ text: 'Cancel', style: 'cancel' as const, onPress: () => {} });

      Alert.alert('Clock Actions', null, options);
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} disabled={loading} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.button,
            { backgroundColor: config.backgroundColor, transform: [{ scale: pulseAnim }] },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={styles.icon}>{config.icon}</Text>
              <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>

      {workStatus && workStatus !== 'working' && status === 'clocked_in' && (
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {workStatus === 'traveling' ? 'En Route' : workStatus === 'arrived' ? 'Arrived' : workStatus}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 28,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
