import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface Props {
  jobId: number;
  onClockIn: () => void;
  onClockOut: () => void;
}

export default function TimeClock({ jobId, onClockIn, onClockOut }: Props) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!isClockedIn || !clockInTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - clockInTime.getTime()) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockIn = () => {
    Alert.alert('Clock In', 'Start the timer for this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock In',
        onPress: () => {
          setClockInTime(new Date());
          setIsClockedIn(true);
          onClockIn();
        },
      },
    ]);
  };

  const handleClockOut = () => {
    Alert.alert('Clock Out', `Stop the timer? Total: ${elapsed}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out',
        style: 'destructive',
        onPress: () => {
          setIsClockedIn(false);
          setClockInTime(null);
          setElapsed('00:00:00');
          onClockOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {isClockedIn ? (
        <>
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Time on job</Text>
            <Text style={styles.timer}>{elapsed}</Text>
          </View>
          <TouchableOpacity style={styles.clockOutBtn} onPress={handleClockOut}>
            <Text style={styles.clockOutBtnText}>⏹ Clock Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.clockInBtn} onPress={handleClockIn}>
          <Text style={styles.clockInBtnText}>🕐 Clock In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  timer: {
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#111827',
  },
  clockInBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clockInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  clockOutBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clockOutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
