import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
  FlatList, SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTimeStore } from '../../src/store/timeStore';
import { useAuthStore } from '../../src/store/authStore';
import { TimeClock, AvailableJob } from '../../src/types';

type Tab = 'today' | 'history' | 'team';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const WORKFLOW_STEPS = [
  { key: 'traveling', label: 'Traveling', icon: '🚗', next: 'arrived' },
  { key: 'arrived', label: 'Arrived', icon: '📍', next: 'working' },
  { key: 'working', label: 'Working', icon: '⚒️', next: null },
];

// ─── Job Picker Modal ──────────────────────────────────────────────────────

function JobPickerModal({
  jobs,
  visible,
  onClose,
  onSelect,
  loading,
}: {
  jobs: AvailableJob[];
  visible: boolean;
  onClose: () => void;
  onSelect: (jobId: number | null) => void;
  loading: boolean;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf9' }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Job</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator style={{ margin: 32 }} color="#4f46e5" />
          ) : jobs.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280', textAlign: 'center' }}>No jobs available today</Text>
              <TouchableOpacity style={[styles.btn, styles.btnOutline, { marginTop: 16 }]} onPress={() => onSelect(null)}>
                <Text style={styles.btnOutlineText}>Clock in — No Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobItem}
                onPress={() => { onSelect(job.id); onClose(); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobName}>{job.name}</Text>
                  <Text style={styles.jobMeta}>
                    {job.job_number} • {job.client_name || 'No client'}
                  </Text>
                  {job.scheduled_time && (
                    <Text style={styles.jobMeta}>🕐 {job.scheduled_time}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        {!loading && jobs.length > 0 && (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => { onSelect(null); onClose(); }}>
              <Text style={styles.btnOutlineText}>Clock in — No Specific Job</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Manual Entry Modal ────────────────────────────────────────────────────

function ManualEntryModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { clock_in_at: string; clock_out_at: string; notes: string }) => void;
  loading: boolean;
}) {
  const [clockIn, setClockIn] = useState('09:00');
  const [clockOut, setClockOut] = useState('17:00');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    onSubmit({
      clock_in_at: `${today}T${clockIn}:00`,
      clock_out_at: `${today}T${clockOut}:00`,
      notes,
    });
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf9' }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Missing Entry</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          <View>
            <Text style={styles.fieldLabel}>Clock In Time</Text>
            <TextInput style={styles.input} value={clockIn} onChangeText={setClockIn} placeholder="HH:MM" keyboardType="numbers-and-punctuation" />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Clock Out Time</Text>
            <TextInput style={styles.input} value={clockOut} onChangeText={setClockOut} placeholder="HH:MM" keyboardType="numbers-and-punctuation" />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="e.g. Forgot to clock in" multiline />
          </View>
          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Entry</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TimeScreen() {
  const { summary, history, isLoading, error, fetchSummary, fetchHistory, clockIn, markArrived, startWorking, clockOut, onBreak, offBreak, addManualEntry } = useTimeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const activeClock = summary?.active_clock;
  const isOnBreak = activeClock?.status === 'on_break';
  const currentStep = activeClock?.work_status;

  useEffect(() => {
    fetchSummary();
    if (activeTab === 'history') fetchHistory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), activeTab === 'history' ? fetchHistory() : Promise.resolve()]);
    setRefreshing(false);
  }, [activeTab]);

  const handleClockIn = async (jobId: number | null) => {
    setShowJobPicker(false);
    await clockIn(jobId ?? undefined);
  };

  const handleClockOut = () => {
    Alert.alert('Clock Out', 'End your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clock Out', style: 'destructive', onPress: () => clockOut() },
    ]);
  };

  const handleAddManual = async (data: { clock_in_at: string; clock_out_at: string; notes: string }) => {
    setShowManualEntry(false);
    await addManualEntry(data);
  };

  // Group history by date
  const historySections = history.reduce<{ title: string; data: TimeClock[] }[]>((acc, clock) => {
    const date = formatDate(clock.clock_in_at);
    const existing = acc.find((s) => s.title === date);
    if (existing) {
      existing.data.push(clock);
    } else {
      acc.push({ title: date, data: [clock] });
    }
    return acc;
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf9' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Time & Attendance</Text>
        <TouchableOpacity onPress={() => setShowManualEntry(true)} style={styles.headerBtn}>
          <Ionicons name="add-circle-outline" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['today', 'history', 'team'] as Tab[]).map((tab) => (
          (!isManager && tab === 'team') ? null :
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { setActiveTab(tab); if (tab === 'history') fetchHistory(); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'today' ? 'Today' : tab === 'history' ? 'History' : 'Team'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={{ margin: 16, padding: 12, backgroundColor: '#fee2e2', borderRadius: 8 }}>
          <Text style={{ color: '#dc2626' }}>{error}</Text>
        </View>
      )}

      {/* ── TODAY TAB ── */}
      {activeTab === 'today' && (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, gap: 16 }}
        >
          {/* Active Clock Hero */}
          {activeClock ? (
            <View style={[styles.clockCard, { borderLeftColor: isOnBreak ? '#f59e0b' : '#22c55e' }]}>
              <View style={styles.clockCardTop}>
                <View>
                  <Text style={styles.clockStatus}>
                    {isOnBreak ? '☕ On Break' : `⚒️ ${currentStep?.charAt(0).toUpperCase()}${currentStep?.slice(1)}`}
                  </Text>
                  {activeClock.job && (
                    <Text style={styles.clockJob}>{activeClock.job.name}</Text>
                  )}
                  <Text style={styles.clockTime}>Since {formatTime(activeClock.clock_in_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.clockDuration}>{formatDuration(activeClock.total_duration)}</Text>
                  {activeClock.hourly_rate > 0 && (
                    <Text style={styles.clockRate}>${activeClock.hourly_rate}/hr</Text>
                  )}
                </View>
              </View>

              {/* Status buttons */}
              <View style={styles.clockActions}>
                {!isOnBreak && currentStep === 'traveling' && (
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={markArrived} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>📍 Mark Arrived</Text>}
                  </TouchableOpacity>
                )}
                {!isOnBreak && currentStep === 'arrived' && (
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={startWorking} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✅ Start Work</Text>}
                  </TouchableOpacity>
                )}
                {!isOnBreak && currentStep === 'working' && (
                  <View style={styles.clockActions}>
                    <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onBreak} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color="#4f46e5" /> : <Text style={styles.btnPrimaryText}>☕ Break</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleClockOut} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Clock Out</Text>}
                    </TouchableOpacity>
                  </View>
                )}
                {isOnBreak && (
                  <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={offBreak} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>↩️ Back from Break</Text>}
                  </TouchableOpacity>
                )}
              </View>

              {/* Status pipeline */}
              <View style={styles.pipeline}>
                {WORKFLOW_STEPS.map((step, idx) => {
                  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);
                  const isDone = stepIndex > idx || currentStep === 'completed';
                  const isCurrent = step.key === currentStep;
                  return (
                    <View key={step.key} style={styles.pipelineStep}>
                      <View style={[styles.pipelineDot, isDone && styles.pipelineDotDone, isCurrent && styles.pipelineDotActive]}>
                        {isDone && <Ionicons name="checkmark" size={10} color="#fff" />}
                      </View>
                      {idx < WORKFLOW_STEPS.length - 1 && <View style={[styles.pipelineLine, isDone && styles.pipelineLineDone]} />}
                      <Text style={[styles.pipelineLabel, isCurrent && styles.pipelineLabelActive]}>{step.icon} {step.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            /* Not clocked in */
            <View style={styles.clockCard}>
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🕐</Text>
                <Text style={styles.emptyTitle}>You're not clocked in</Text>
                <Text style={{ color: '#6b7280', marginBottom: 20 }}>Select a job to start your day</Text>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary, { width: '100%' }]} onPress={() => setShowJobPicker(true)}>
                  <Text style={styles.btnText}>Clock In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Available jobs for clock-in */}
          {!activeClock && summary?.available_jobs && summary.available_jobs.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Today's Jobs</Text>
              {summary.available_jobs.slice(0, 5).map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobRow}
                  onPress={() => handleClockIn(job.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobName}>{job.name}</Text>
                    <Text style={styles.jobMeta}>{job.job_number} • {job.client_name || 'No client'}</Text>
                  </View>
                  <TouchableOpacity style={styles.btnSmall} onPress={() => handleClockIn(job.id)}>
                    <Text style={styles.btnSmallText}>Clock In</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Today's log */}
          {summary?.today_clocks && summary.today_clocks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Today's Log</Text>
              {summary.today_clocks.map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>
                      {entry.job?.name || 'Unscheduled'}
                    </Text>
                    <Text style={styles.entryMeta}>
                      {entry.work_status} • {formatTime(entry.clock_in_at)} – {formatTime(entry.clock_out_at)}
                    </Text>
                    {entry.notes && <Text style={styles.entryNotes}>📝 {entry.notes}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.entryDuration}>{formatDuration(entry.total_duration)}</Text>
                    {entry.labor_cost && entry.labor_cost > 0 && (
                      <Text style={styles.entryCost}>${entry.labor_cost}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Week summary */}
          {summary && (
            <View style={styles.weekBar}>
              <Text style={styles.weekLabel}>This Week</Text>
              <Text style={styles.weekHours}>{summary.week_hours} hrs logged</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <SectionList
          sections={historySections}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ padding: 16 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item: entry }) => (
            <View style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryName}>{entry.job?.name || 'Unscheduled'}</Text>
                <Text style={styles.entryMeta}>
                  {entry.work_status} • {formatTime(entry.clock_in_at)} – {formatTime(entry.clock_out_at)}
                </Text>
                {entry.notes && <Text style={styles.entryNotes}>📝 {entry.notes}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.entryDuration}>{formatDuration(entry.total_duration)}</Text>
                {entry.labor_cost && entry.labor_cost > 0 && (
                  <Text style={styles.entryCost}>${entry.labor_cost}</Text>
                )}
                {entry.approved !== null && (
                  <View style={[styles.approvalBadge, entry.approved ? styles.approvedBadge : styles.rejectedBadge]}>
                    <Text style={styles.approvalText}>{entry.approved ? '✓' : '✗'}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280' }}>No entries yet</Text>
            </View>
          }
        />
      )}

      {/* ── TEAM TAB ── */}
      {activeTab === 'team' && isManager && (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        >
          {summary?.team_active && summary.team_active.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Active Now</Text>
              {summary.team_active.map((clock) => (
                <View key={clock.id} style={[styles.teamCard, { borderLeftColor: '#22c55e' }]}>
                  <View style={styles.teamCardRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{clock.user?.first_name?.[0] || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamName}>{clock.user?.first_name} {clock.user?.last_name}</Text>
                      <Text style={styles.teamMeta}>
                        {clock.job?.name || 'Unscheduled'} • {clock.work_status}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.clockDuration}>{formatDuration(clock.total_duration)}</Text>
                      <Text style={styles.clockTime}>{formatTime(clock.clock_in_at)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280' }}>No team members are currently clocked in</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <JobPickerModal
        visible={showJobPicker}
        onClose={() => setShowJobPicker(false)}
        onSelect={handleClockIn}
        jobs={summary?.available_jobs || []}
        loading={isLoading}
      />
      <ManualEntryModal
        visible={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSubmit={handleAddManual}
        loading={isLoading}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerBtn: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#4f46e5',
  },
  clockCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clockCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clockStatus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  clockJob: {
    fontSize: 14,
    color: '#4f46e5',
    marginBottom: 2,
  },
  clockTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  clockDuration: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  clockRate: {
    fontSize: 12,
    color: '#6b7280',
  },
  clockActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pipelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineDotDone: {
    backgroundColor: '#22c55e',
  },
  pipelineDotActive: {
    backgroundColor: '#4f46e5',
  },
  pipelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  pipelineLineDone: {
    backgroundColor: '#22c55e',
  },
  pipelineLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
    position: 'absolute',
    top: 24,
    left: -8,
    width: 60,
  },
  pipelineLabelActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    paddingVertical: 8,
    backgroundColor: '#fafaf9',
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  jobName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  jobMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  entryMeta: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  entryNotes: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  entryDuration: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  entryCost: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  weekBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  weekLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  weekHours: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  teamCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  teamMeta: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  approvalBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  approvedBadge: { backgroundColor: '#dcfce7' },
  rejectedBadge: { backgroundColor: '#fee2e2' },
  approvalText: { fontSize: 11, fontWeight: '700' },
  // Buttons
  btn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimary: { backgroundColor: '#4f46e5' },
  btnDanger: { backgroundColor: '#dc2626' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e5e7eb' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4f46e5' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnPrimaryText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
  btnOutlineText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
  btnSmall: {
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnSmallText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalClose: { padding: 4 },
  // Form fields
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
});
