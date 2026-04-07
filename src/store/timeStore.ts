import { create } from 'zustand';
import * as Location from 'expo-location';
import { TimeClock, TimeSummary } from '../types';
import * as timeApi from '../api/timeTracking';

async function getCurrentLocation(): Promise<{ lat: number; lng: number } | undefined> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return undefined;
    const pos = await Location.getCurrentPositionAsync({});
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return undefined;
  }
}

interface TimeState {
  summary: TimeSummary | null;
  history: TimeClock[];
  isLoading: boolean;
  error: string | null;

  fetchSummary: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  clockIn: (jobId?: number) => Promise<void>;
  markArrived: () => Promise<void>;
  startWorking: () => Promise<void>;
  clockOut: () => Promise<void>;
  onBreak: () => Promise<void>;
  offBreak: () => Promise<void>;
  addManualEntry: (params: { clock_in_at: string; clock_out_at: string; job_id?: number; notes?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  summary: null,
  history: [],
  isLoading: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await timeApi.getSummary();
      set({ summary, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load time summary';
      set({ error: message, isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await timeApi.getHistory();
      set({ history, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      set({ error: message, isLoading: false });
    }
  },

  clockIn: async (jobId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const location = await getCurrentLocation();
      await timeApi.clockIn(jobId, location);
      await get().fetchSummary();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clock in';
      set({ error: message, isLoading: false });
    }
  },

  markArrived: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await getCurrentLocation();
      await timeApi.markArrived(location);
      await get().fetchSummary();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark arrived';
      set({ error: message, isLoading: false });
    }
  },

  startWorking: async () => {
    set({ isLoading: true, error: null });
    try {
      await timeApi.startWorking();
      await get().fetchSummary();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start working';
      set({ error: message, isLoading: false });
    }
  },

  clockOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const location = await getCurrentLocation();
      await timeApi.clockOut(location);
      await get().fetchSummary();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clock out';
      set({ error: message, isLoading: false });
    }
  },

  onBreak: async () => {
    set({ isLoading: true, error: null });
    try {
      await timeApi.onBreak();
      await get().fetchSummary();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start break';
      set({ error: message, isLoading: false });
    }
  },

  offBreak: async () => {
    set({ isLoading: true, error: null });
    try {
      await timeApi.offBreak();
      await get().fetchSummary();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to end break';
      set({ error: message, isLoading: false });
    }
  },

  addManualEntry: async (params) => {
    set({ isLoading: true, error: null });
    try {
      await timeApi.createManualEntry(params);
      await get().fetchSummary();
      await get().fetchHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add entry';
      set({ error: message, isLoading: false });
    }
  },

  refresh: async () => {
    await Promise.all([get().fetchSummary(), get().fetchHistory()]);
  },
}));
