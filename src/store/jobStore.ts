import { create } from 'zustand';
import { Job, JobStatus } from '../types';
import * as jobsApi from '../api/jobs';
import { addToQueue, isConnected } from '../utils/offline';
import { syncOfflineActions } from '../utils/sync';

interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  isOffline: boolean;
  pendingActions: number;
  selectedDate: string;

  fetchJobs: (date?: string) => Promise<void>;
  fetchJob: (id: number) => Promise<void>;
  updateStatus: (jobId: number, status: JobStatus) => Promise<void>;
  completeTask: (jobId: number, taskId: number) => Promise<void>;
  clockIn: (jobId: number) => Promise<void>;
  clockOut: (jobId: number) => Promise<void>;
  uploadPhoto: (jobId: number, uri: string) => Promise<void>;
  uploadSignature: (jobId: number, base64: string) => Promise<void>;
  syncQueue: () => Promise<void>;
  setSelectedDate: (date: string) => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  selectedJob: null,
  isLoading: false,
  isOffline: false,
  pendingActions: 0,
  selectedDate: '',

  fetchJobs: async (date?: string) => {
    set({ isLoading: true });
    try {
      const online = await isConnected();
      if (!online) {
        set({ isOffline: true, isLoading: false });
        return;
      }
      const jobs = await jobsApi.getJobs(date);
      set({ jobs, isOffline: false });
    } catch {
      set({ isOffline: true });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchJob: async (id: number) => {
    set({ isLoading: true });
    try {
      const job = await jobsApi.getJob(id);
      set({ selectedJob: job, isOffline: false });
    } catch {
      // Use cached job from jobs list if available
      const cached = get().jobs.find((j) => j.id === id);
      if (cached) set({ selectedJob: cached });
      set({ isOffline: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStatus: async (jobId: number, status: JobStatus) => {
    // Optimistic update
    const jobs = get().jobs.map((j) =>
      j.id === jobId ? { ...j, status } : j
    );
    const selectedJob = get().selectedJob;
    if (selectedJob?.id === jobId) {
      set({ selectedJob: { ...selectedJob, status } });
    }
    set({ jobs });

    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.updateJobStatus(jobId, status);
      } else {
        addToQueue({ type: 'update_status', payload: { jobId, status } });
        set((s) => ({ pendingActions: s.pendingActions + 1, isOffline: true }));
      }
    } catch {
      addToQueue({ type: 'update_status', payload: { jobId, status } });
      set((s) => ({ pendingActions: s.pendingActions + 1 }));
    }
  },

  completeTask: async (jobId: number, taskId: number) => {
    // Optimistic update
    const updateTasks = (job: Job) => ({
      ...job,
      tasks: job.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true, completed_at: new Date().toISOString() } : t
      ),
    });

    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === jobId ? updateTasks(j) : j)),
      selectedJob: s.selectedJob?.id === jobId ? updateTasks(s.selectedJob) : s.selectedJob,
    }));

    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.completeTask(jobId, taskId);
      } else {
        addToQueue({ type: 'complete_task', payload: { jobId, taskId } });
        set((s) => ({ pendingActions: s.pendingActions + 1, isOffline: true }));
      }
    } catch {
      addToQueue({ type: 'complete_task', payload: { jobId, taskId } });
      set((s) => ({ pendingActions: s.pendingActions + 1 }));
    }
  },

  clockIn: async (jobId: number) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.clockIn(jobId);
      } else {
        addToQueue({ type: 'clock_in', payload: { jobId } });
        set((s) => ({ pendingActions: s.pendingActions + 1, isOffline: true }));
      }
    } catch {
      addToQueue({ type: 'clock_in', payload: { jobId } });
      set((s) => ({ pendingActions: s.pendingActions + 1 }));
    }
  },

  clockOut: async (jobId: number) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.clockOut(jobId);
      } else {
        addToQueue({ type: 'clock_out', payload: { jobId } });
        set((s) => ({ pendingActions: s.pendingActions + 1, isOffline: true }));
      }
    } catch {
      addToQueue({ type: 'clock_out', payload: { jobId } });
      set((s) => ({ pendingActions: s.pendingActions + 1 }));
    }
  },

  uploadPhoto: async (jobId: number, uri: string) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.uploadPhoto(jobId, uri);
      } else {
        addToQueue({ type: 'upload_photo', payload: { jobId, uri } });
        set((s) => ({ pendingActions: s.pendingActions + 1, isOffline: true }));
      }
    } catch {
      addToQueue({ type: 'upload_photo', payload: { jobId, uri } });
      set((s) => ({ pendingActions: s.pendingActions + 1 }));
    }
  },

  uploadSignature: async (jobId: number, base64: string) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.uploadSignature(jobId, base64);
      } else {
        addToQueue({ type: 'upload_signature', payload: { jobId, base64 } });
        set((s) => ({ pendingActions: s.pendingActions + 1, isOffline: true }));
      }
    } catch {
      addToQueue({ type: 'upload_signature', payload: { jobId, base64 } });
      set((s) => ({ pendingActions: s.pendingActions + 1 }));
    }
  },

  syncQueue: async () => {
    const result = await syncOfflineActions();
    if (result.success > 0) {
      set((s) => ({ pendingActions: Math.max(0, s.pendingActions - result.success) }));
    }
  },

  setSelectedDate: (date: string) => set({ selectedDate: date }),
}));
