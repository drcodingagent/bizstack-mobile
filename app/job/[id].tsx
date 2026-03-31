import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJobStore } from '../../src/store';
import { JobStatus } from '../../src/types';
import TaskList from '../../src/components/TaskList';
import PhotoCapture from '../../src/components/PhotoCapture';
import SignaturePad from '../../src/components/SignaturePad';
import TimeClock from '../../src/components/TimeClock';
import { formatPhone, getStatusColor, getStatusLabel } from '../../src/utils/format';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const jobId = Number(id);

  const { selectedJob, isLoading, fetchJob, updateStatus, completeTask, clockIn, clockOut, uploadPhoto, uploadSignature } =
    useJobStore();

  const [photos, setPhotos] = useState<string[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [statusPicker, setStatusPicker] = useState(false);

  useEffect(() => {
    if (jobId) fetchJob(jobId);
  }, [jobId]);

  const job = selectedJob;

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (address: string) => {
    const encoded = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encoded}`);
  };

  const handleStatusChange = (status: JobStatus) => {
    setStatusPicker(false);
    updateStatus(jobId, status);
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

  const statusColor = getStatusColor(job.status);

  const statusOptions: { value: JobStatus; label: string; color: string }[] = [
    { value: 'scheduled', label: 'Scheduled', color: '#6366f1' },
    { value: 'en_route', label: 'En Route', color: '#f59e0b' },
    { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
  ];

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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Client Info */}
        <View style={styles.card}>
          <Text style={styles.clientName}>{job.client.full_name}</Text>
          <Text style={styles.jobTitle}>{job.title}</Text>

          <View style={styles.infoRow}>
            <TouchableOpacity onPress={() => handleCall(job.client.phone)}>
              <Text style={styles.linkText}>📞 {formatPhone(job.client.phone)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => handleDirections(job.client.address)}>
            <Text style={styles.linkText}>📍 {job.client.address}</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <TouchableOpacity
            style={styles.statusSelector}
            onPress={() => setStatusPicker(!statusPicker)}
          >
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(job.status)}
              </Text>
            </View>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>

          {statusPicker && (
            <View style={styles.statusPicker}>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusOption,
                    job.status === opt.value && styles.statusOptionActive,
                  ]}
                  onPress={() => handleStatusChange(opt.value)}
                >
                  <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                  <Text
                    style={[
                      styles.statusOptionText,
                      job.status === opt.value && { color: opt.color, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        {job.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
        ) : null}

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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 6,
  },
  linkText: {
    fontSize: 15,
    color: '#4f46e5',
    paddingVertical: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
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
  chevron: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusPicker: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusOptionActive: {
    backgroundColor: '#eef2ff',
  },
  statusOptionText: {
    fontSize: 15,
    color: '#374151',
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
