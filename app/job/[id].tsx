import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJobStore } from '../../src/store/jobStore';
import { Job, JobStatus, Task } from '../../src/types';
import { Screen, Text, Pill, Button, Card, IconButton } from '../../src/components/ui';
import { ClockCard } from '../../src/components/ClockCard';
import OfflineIndicator from '../../src/components/OfflineIndicator';
import PhotoCapture from '../../src/components/PhotoCapture';
import SignaturePad from '../../src/components/SignaturePad';
import {
  colors,
  jobStatusColor,
  jobStatusLabel,
  radii,
  shadows,
  spacing,
} from '../../src/theme';
import { formatCurrency, formatPhone, formatTime } from '../../src/utils/format';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const jobId = Number(id);

  const {
    selectedJob: job,
    photos,
    isOffline,
    pendingActions,
    fetchJob,
    fetchPhotos,
    completeTask,
    uploadPhoto,
    uploadSignature,
    startJob,
    completeJob,
    sendOnMyWay,
    syncQueue,
  } = useJobStore();

  const [showCamera, setShowCamera] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    fetchJob(jobId);
    fetchPhotos(jobId);
  }, [jobId]);

  if (!job) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text variant="body" color={colors.textSecondary}>
            Loading…
          </Text>
        </View>
      </Screen>
    );
  }

  const addressLine = `${job.job_address.street}, ${job.job_address.city}, ${job.job_address.state}`;

  const handleCall = () => {
    if (job.client.phone) Linking.openURL(`tel:${job.client.phone}`);
  };
  const handleText = () => {
    if (job.client.phone) Linking.openURL(`sms:${job.client.phone}`);
  };
  const handleEmail = () => {
    if (job.client.email) Linking.openURL(`mailto:${job.client.email}`);
  };
  const handleNavigate = () => {
    const q = encodeURIComponent(addressLine);
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${q}`,
      android: `geo:0,0?q=${q}`,
      default: `https://maps.google.com/?q=${q}`,
    });
    Linking.openURL(url!);
  };

  const handleOnMyWay = async () => {
    Alert.alert('Notify client?', `Send "${job.client.full_name}" a heads-up that you're on your way.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          await sendOnMyWay(jobId);
          Alert.alert('Sent', 'The client has been notified.');
        },
      },
    ]);
  };

  const handlePhotoCaptured = (uri: string) => {
    uploadPhoto(jobId, uri);
  };

  const handleStart = async () => {
    setTransitioning(true);
    try {
      await startJob(jobId);
    } finally {
      setTransitioning(false);
    }
  };

  const handleComplete = async () => {
    const totalTasks = job.tasks.length;
    const doneTasks = job.tasks.filter((t) => t.status === 'completed').length;
    const warnings: string[] = [];
    if (totalTasks > 0 && doneTasks < totalTasks) {
      warnings.push(`${totalTasks - doneTasks} of ${totalTasks} tasks not complete`);
    }
    if (photos.length === 0) warnings.push('No photos attached');
    if (!job.client_signature) warnings.push('No client signature');

    const proceed = async () => {
      setTransitioning(true);
      try {
        await completeJob(jobId);
      } finally {
        setTransitioning(false);
      }
    };

    if (warnings.length === 0) {
      Alert.alert('Complete job?', 'Mark this job as done?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', style: 'destructive', onPress: proceed },
      ]);
    } else {
      Alert.alert(
        'Before you complete',
        warnings.map((w) => `• ${w}`).join('\n') + '\n\nComplete anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete anyway', style: 'destructive', onPress: proceed },
        ]
      );
    }
  };

  const handleTaskTap = (task: Task) => {
    if (task.status === 'completed') return;
    completeTask(jobId, task.id);
  };

  const handleSignatureSaved = (sig: string) => {
    setShowSignature(false);
    uploadSignature(jobId, sig);
    Alert.alert('Saved', 'Signature saved.');
  };

  return (
    <Screen edges={['top']}>
      {/* Sticky header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconHit} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="caption" color={colors.textTertiary}>
            #{job.job_number}
          </Text>
          <Pill
            label={jobStatusLabel(job.status)}
            color={jobStatusColor(job.status)}
            dot
            size="sm"
            style={{ marginTop: 2 }}
          />
        </View>
        <View style={styles.iconHit} />
      </View>

      <OfflineIndicator isOffline={isOffline} pendingActions={pendingActions} onSync={syncQueue} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text variant="h1">{job.title}</Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: 4 }}>
            {job.client.full_name}
          </Text>
          <View style={{ marginTop: spacing.md, gap: 6 }}>
            <MetaRow icon="location-outline" text={addressLine} />
            {job.scheduled_date && (
              <MetaRow
                icon="calendar-outline"
                text={
                  formatLongDate(job.scheduled_date) +
                  (job.scheduled_start_time ? ` · ${formatTime(job.scheduled_start_time)}` : '')
                }
              />
            )}
            {job.client.phone && (
              <MetaRow icon="call-outline" text={formatPhone(job.client.phone)} />
            )}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="call" label="Call" onPress={handleCall} disabled={!job.client.phone} />
          <QuickAction icon="chatbox" label="Text" onPress={handleText} disabled={!job.client.phone} />
          <QuickAction icon="mail" label="Email" onPress={handleEmail} disabled={!job.client.email} />
          <QuickAction icon="navigate" label="Drive" onPress={handleNavigate} />
        </View>

        {/* On my way button (only when scheduled) */}
        {job.status === 'scheduled' && job.client.phone && (
          <Button
            label="Tell client I'm on my way"
            icon="paper-plane"
            variant="secondary"
            fullWidth
            onPress={handleOnMyWay}
            style={{ marginTop: spacing.md }}
          />
        )}

        {/* Description */}
        {job.description ? (
          <Section label="Description">
            <Card>
              <Text variant="body" color={colors.textPrimary}>
                {job.description}
              </Text>
            </Card>
          </Section>
        ) : null}

        {/* Clock */}
        <Section label="Time">
          <ClockCard
            jobId={job.id}
            jobTitle={job.title}
            jobNumber={job.job_number}
            compact
          />
        </Section>

        {/* Tasks */}
        {job.tasks.length > 0 && (
          <Section
            label="Tasks"
            right={
              <Text variant="caption" color={colors.textSecondary}>
                {job.tasks.filter((t) => t.status === 'completed').length} / {job.tasks.length}
              </Text>
            }
          >
            <Card padding={0}>
              <TaskProgress tasks={job.tasks} />
              {job.tasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isLast={i === job.tasks.length - 1}
                  onToggle={() => handleTaskTap(task)}
                />
              ))}
            </Card>
          </Section>
        )}

        {/* Photos */}
        <Section
          label="Photos"
          right={
            <Pressable onPress={() => setShowCamera(true)} hitSlop={8}>
              <Text variant="caption" color={colors.brand} style={{ fontWeight: '700' }}>
                + Add
              </Text>
            </Pressable>
          }
        >
          {photos.length === 0 ? (
            <Pressable onPress={() => setShowCamera(true)} style={styles.photoEmpty}>
              <Ionicons name="camera-outline" size={22} color={colors.textTertiary} />
              <Text variant="bodySm" color={colors.textSecondary} style={{ marginTop: 4 }}>
                Take before/after photos for this job
              </Text>
            </Pressable>
          ) : (
            <FlatList
              data={photos}
              keyExtractor={(p) => String(p.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.thumbnail_url || item.url }}
                  style={styles.photo}
                />
              )}
            />
          )}
        </Section>

        {/* Line items */}
        {job.line_items.length > 0 && (
          <Section label="Services">
            <Card padding={0}>
              {job.line_items.map((item, i) => (
                <View
                  key={item.id}
                  style={[
                    styles.lineItem,
                    i < job.line_items.length - 1 && styles.lineItemBorder,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{item.name}</Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </Text>
                  </View>
                  <Text variant="bodyStrong">{formatCurrency(item.total)}</Text>
                </View>
              ))}
              {job.total_price != null && (
                <View style={[styles.lineItem, styles.lineItemBorder, { backgroundColor: colors.surfaceAlt }]}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    Total
                  </Text>
                  <Text variant="bodyStrong">{formatCurrency(job.total_price)}</Text>
                </View>
              )}
            </Card>
          </Section>
        )}

        {/* Signature */}
        <Section label="Client signoff">
          {job.client_signature ? (
            <Card>
              <View style={styles.signatureDone}>
                <View style={styles.signatureCheck}>
                  <Ionicons name="checkmark" size={18} color={colors.onSuccess} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Signature collected</Text>
                  {job.client_rating != null && (
                    <Text variant="caption" color={colors.textSecondary}>
                      {job.client_rating}/5 rating
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          ) : (
            <Button
              label="Get client signature"
              icon="create"
              variant="secondary"
              fullWidth
              onPress={() => setShowSignature(true)}
            />
          )}
        </Section>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>

      {/* Sticky bottom action */}
      <BottomActionBar
        status={job.status}
        loading={transitioning}
        onStart={handleStart}
        onComplete={handleComplete}
      />

      <PhotoCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCaptured}
      />
      <SignaturePad
        visible={showSignature}
        onSave={handleSignatureSaved}
        onClose={() => setShowSignature(false)}
      />
    </Screen>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="overline" color={colors.textTertiary}>
          {label}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function MetaRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={colors.textTertiary} />
      <Text variant="bodySm" color={colors.textSecondary} style={{ flex: 1 }} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.qaBtn,
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.brand} />
      <Text variant="caption" color={colors.textPrimary} style={{ marginTop: 4, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function TaskProgress({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((t) => t.status === 'completed').length;
  const pct = tasks.length === 0 ? 0 : (done / tasks.length) * 100;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function TaskRow({
  task,
  onToggle,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  isLast: boolean;
}) {
  const complete = task.status === 'completed';
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.taskRow,
        !isLast && styles.taskRowBorder,
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <View style={[styles.checkbox, complete && styles.checkboxChecked]}>
        {complete && <Ionicons name="checkmark" size={15} color={colors.onSuccess} />}
      </View>
      <Text
        variant="body"
        style={
          complete
            ? { flex: 1, textDecorationLine: 'line-through', color: colors.textTertiary }
            : { flex: 1 }
        }
      >
        {task.title}
      </Text>
      {task.requires_photo && !complete && (
        <Ionicons name="camera-outline" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

function BottomActionBar({
  status,
  loading,
  onStart,
  onComplete,
}: {
  status: JobStatus;
  loading: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  if (status === 'completed' || status === 'cancelled') return null;

  const isStart = status === 'new' || status === 'scheduled';

  return (
    <View style={styles.bottomBar}>
      <Button
        label={isStart ? 'Start Job' : 'Complete Job'}
        icon={isStart ? 'play' : 'checkmark-circle'}
        iconPosition="right"
        variant={isStart ? 'primary' : 'success'}
        size="xl"
        fullWidth
        loading={loading}
        onPress={isStart ? onStart : onComplete}
      />
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingBottom: 120,
  },

  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  qaBtn: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  section: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  progressWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceSunken,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  taskRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  photoEmpty: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },

  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  lineItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  signatureDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signatureCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.md,
  },
});
