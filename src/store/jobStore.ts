import { create } from 'zustand';
import { Job, JobStatus } from '../types';
import * as jobsApi from '../api/jobs';
import { addToQueue, isConnected, getQueueLength } from '../utils/offline';
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
  startJob: (jobId: number) => Promise<void>;
  completeJob: (jobId: number) => Promise<void>;
  cancelJob: (jobId: number, reason: string) => Promise<void>;
  sendOnMyWay: (jobId: number) => Promise<void>;
  signoffJob: (jobId: number, signature: string, rating: number, feedback?: string) => Promise<void>;
  completeTask: (jobId: number, taskId: number) => Promise<void>;
  uploadPhoto: (jobId: number, uri: string, caption?: string) => Promise<void>;
  uploadSignature: (jobId: number, base64: string) => Promise<void>;
  syncQueue: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
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
      const cached = get().jobs.find((j) => j.id === id);
      if (cached) set({ selectedJob: cached });
      set({ isOffline: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStatus: async (jobId: number, status: JobStatus) => {
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
        await addToQueue({ type: 'update_status', payload: { jobId, status } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'update_status', payload: { jobId, status } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  startJob: async (jobId: number) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.startJob(jobId);
        await get().fetchJob(jobId);
      } else {
        await addToQueue({ type: 'update_status', payload: { jobId, status: 'in_progress' } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'update_status', payload: { jobId, status: 'in_progress' } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  completeJob: async (jobId: number) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.completeJob(jobId);
        await get().fetchJob(jobId);
      } else {
        await addToQueue({ type: 'update_status', payload: { jobId, status: 'completed' } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'update_status', payload: { jobId, status: 'completed' } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  cancelJob: async (jobId: number, reason: string) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.cancelJob(jobId, reason);
        await get().fetchJob(jobId);
      } else {
        await addToQueue({ type: 'update_status', payload: { jobId, status: 'cancelled' } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'update_status', payload: { jobId, status: 'cancelled' } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  sendOnMyWay: async (jobId: number) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.sendOnMyWay(jobId);
      } else {
        await addToQueue({ type: 'update_status', payload: { jobId, action: 'send_on_my_way' } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'update_status', payload: { jobId, action: 'send_on_my_way' } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  signoffJob: async (jobId: number, signature: string, rating: number, feedback?: string) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.signoffJob(jobId, signature, rating, feedback);
        await get().fetchJob(jobId);
      } else {
        await addToQueue({
          type: 'upload_signature',
          payload: { jobId, signature, rating, feedback },
        });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({
        type: 'upload_signature',
        payload: { jobId, signature, rating, feedback },
      });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  completeTask: async (jobId: number, taskId: number) => {
    const updateTasks = (job: Job) => ({
      ...job,
      tasks: job.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as const }
          : t
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
        await addToQueue({ type: 'complete_task', payload: { jobId, taskId } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'complete_task', payload: { jobId, taskId } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  uploadPhoto: async (jobId: number, uri: string, caption?: string) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.uploadPhoto(jobId, uri, caption);
      } else {
        await addToQueue({ type: 'upload_photo', payload: { jobId, uri, caption } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'upload_photo', payload: { jobId, uri, caption } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  uploadSignature: async (jobId: number, base64: string) => {
    try {
      const online = await isConnected();
      if (online) {
        await jobsApi.uploadSignature(jobId, base64);
      } else {
        await addToQueue({ type: 'upload_signature', payload: { jobId, base64 } });
        const count = await getQueueLength();
        set({ pendingActions: count, isOffline: true });
      }
    } catch {
      await addToQueue({ type: 'upload_signature', payload: { jobId, base64 } });
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  syncQueue: async () => {
    const result = await syncOfflineActions();
    if (result.success > 0) {
      const count = await getQueueLength();
      set({ pendingActions: count });
    }
  },

  refreshPendingCount: async () => {
    const count = await getQueueLength();
    set({ pendingActions: count });
  },

  setSelectedDate: (date: string) => set({ selectedDate: date }),
}));
