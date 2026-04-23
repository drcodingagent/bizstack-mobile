import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJobStore, useTimeStore } from '../../src/store';
import { JobStatus } from '../../src/types';
import ClientCard from '../../src/components/ClientCard';
import TaskList from '../../src/components/TaskList';
import PhotoCapture from '../../src/components/PhotoCapture';
import SignaturePad from '../../src/components/SignaturePad';
import TimeClock from '../../src/components/TimeClock';
import StatusButton from '../../src/components/StatusButton';
import OfflineIndicator from '../../src/components/OfflineIndicator';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const jobId = Number(id);

  const {
    selectedJob,
    isLoading,
    isOffline,
    pendingActions,
    fetchJob,
    updateStatus,
    completeTask,
    uploadPhoto,
    uploadSignature,
    syncQueue,
  } = useJobStore();

  const { clockIn, clockOut } = useTimeStore();

  const [photos, setPhotos] = useState<string[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (jobId) fetchJob(jobId);
  }, [jobId]);

  const job = selectedJob;

  const handleStatusChange = async (status: JobStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatus(jobId, status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTaskComplete = (taskId: number) => {
    completeTask(jobId, taskId);
  };

  const handlePhotoTaken = (uri: string) => {
    setPhotos((prev) => [...prev, uri]);
    uploadPhoto(jobId, uri);
  };

  const handleSignatureSave = (base64: string) => {
    setShowSignature(false);
    uploadSignature(jobId, base64);
    Alert.alert('Success', 'Signature saved');
  };

  const handleClockIn = () => {
    clockIn(jobId);
  };

  const handleClockOut = () => {
    clockOut(jobId);
  };

  if (isLoading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job #{job.id}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Offline indicator */}
      <OfflineIndicator
        isOffline={isOffline}
        pendingActions={pendingActions}
        onSync={syncQueue}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Client Card */}
        <ClientCard client={job.client} />

        {/* Job Title & Description */}
        <View style={styles.section}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          {job.description ? (
            <Text style={styles.description}>{job.description}</Text>
          ) : null}
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <StatusButton
            currentStatus={job.status}
            onStatusChange={handleStatusChange}
            isLoading={isUpdatingStatus}
          />
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <TaskList tasks={job.tasks} onComplete={handleTaskComplete} />
        </View>

        {/* Time Clock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Clock</Text>
          <TimeClock
            jobId={jobId}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <PhotoCapture onPhotoTaken={handlePhotoTaken} photos={photos} />
        </View>

        {/* Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <TouchableOpacity
            style={styles.signatureBtn}
            onPress={() => setShowSignature(true)}
          >
            <Text style={styles.signatureBtnText}>✍️ Get Client Signature</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Signature Modal */}
      <SignaturePad
        visible={showSignature}
        onSave={handleSignatureSave}
        onClose={() => setShowSignature(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  signatureBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signatureBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
