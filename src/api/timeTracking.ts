import apiClient from './client';
import { TimeClock, TimeSummary } from '../types';

// Helper to unwrap Rails API response { success, data, message }
function unwrap<T>(response: { data: any }): T {
  return (response.data?.data ?? response.data) as T;
}

export async function getSummary(): Promise<TimeSummary> {
  const response = await apiClient.get('/time_clocks/summary');
  return unwrap<TimeSummary>(response);
}

export async function getHistory(): Promise<TimeClock[]> {
  const response = await apiClient.get('/time_clocks');
  return unwrap<TimeClock[]>(response);
}

export async function clockIn(
  jobId?: number,
  location?: { lat: number; lng: number }
): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (jobId) payload.job_id = jobId;
  if (location) {
    payload.latitude = location.lat;
    payload.longitude = location.lng;
  }
  const response = await apiClient.post('/time_clocks/clock_in', payload);
  return unwrap<TimeClock>(response);
}

export async function markArrived(
  location?: { lat: number; lng: number }
): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (location) {
    payload.latitude = location.lat;
    payload.longitude = location.lng;
  }
  const response = await apiClient.post('/time_clocks/mark_arrived', payload);
  return unwrap<TimeClock>(response);
}

export async function startWorking(): Promise<TimeClock> {
  const response = await apiClient.post('/time_clocks/start_working');
  return unwrap<TimeClock>(response);
}

export async function clockOut(
  location?: { lat: number; lng: number }
): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (location) {
    payload.latitude = location.lat;
    payload.longitude = location.lng;
  }
  const response = await apiClient.post('/time_clocks/clock_out', payload);
  return unwrap<TimeClock>(response);
}

export async function onBreak(): Promise<TimeClock> {
  const response = await apiClient.post('/time_clocks/on_break');
  return unwrap<TimeClock>(response);
}

export async function offBreak(): Promise<TimeClock> {
  const response = await apiClient.post('/time_clocks/off_break');
  return unwrap<TimeClock>(response);
}
