import apiClient from './client';
import { TimeClock, ApiResponse } from '../types';

// ─── Summary & History ───────────────────────────────────────────────────────

export async function getSummary(): Promise<TimeClock> {
  const response = await apiClient.get<TimeClock>('/time_clocks/summary');
  return response.data;
}

export async function getHistory(): Promise<TimeClock[]> {
  const response = await apiClient.get<TimeClock[]>('/time_clocks');
  return response.data;
}

// ─── Clock Actions ───────────────────────────────────────────────────────────

interface LocationPayload {
  lat: number;
  lng: number;
  accuracy?: number;
}

function locationParams(location?: LocationPayload) {
  if (!location) return {};
  const params: Record<string, unknown> = {
    latitude: location.lat,
    longitude: location.lng,
  };
  if (location.accuracy) params.accuracy = location.accuracy;
  return params;
}

export async function clockIn(
  jobId?: number,
  location?: LocationPayload
): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (jobId) payload.job_id = jobId;
  if (location) Object.assign(payload, locationParams(location));
  const response = await apiClient.post<TimeClock>('/time_clocks/clock_in', payload);
  return response.data;
}

export async function markArrived(location?: LocationPayload): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (location) Object.assign(payload, locationParams(location));
  const response = await apiClient.post<TimeClock>('/time_clocks/mark_arrived', payload);
  return response.data;
}

export async function startWorking(): Promise<TimeClock> {
  const response = await apiClient.post<TimeClock>('/time_clocks/start_working');
  return response.data;
}

export async function clockOut(location?: LocationPayload): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (location) Object.assign(payload, locationParams(location));
  const response = await apiClient.post<TimeClock>('/time_clocks/clock_out', payload);
  return response.data;
}

export async function onBreak(): Promise<TimeClock> {
  const response = await apiClient.post<TimeClock>('/time_clocks/on_break');
  return response.data;
}

export async function offBreak(): Promise<TimeClock> {
  const response = await apiClient.post<TimeClock>('/time_clocks/off_break');
  return response.data;
}
