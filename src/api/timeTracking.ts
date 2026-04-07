import apiClient from './client';
import { TimeClock, TimeSummary, ApiResponse } from '../types';

export async function getSummary(): Promise<TimeSummary> {
  const response = await apiClient.get<ApiResponse<TimeSummary>>('/time_clocks/summary');
  return response.data.data;
}

export async function getHistory(): Promise<TimeClock[]> {
  const response = await apiClient.get<TimeClock[]>('/time_clocks');
  return response.data;
}

export async function clockIn(jobId?: number, location?: { lat: number; lng: number }): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (jobId) payload.job_id = jobId;
  if (location) {
    payload.latitude = location.lat;
    payload.longitude = location.lng;
  }
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/clock_in', payload);
  return response.data.data;
}

export async function markArrived(location?: { lat: number; lng: number }): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (location) {
    payload.latitude = location.lat;
    payload.longitude = location.lng;
  }
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/mark_arrived', payload);
  return response.data.data;
}

export async function startWorking(): Promise<TimeClock> {
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/start_working');
  return response.data.data;
}

export async function clockOut(location?: { lat: number; lng: number }): Promise<TimeClock> {
  const payload: Record<string, unknown> = {};
  if (location) {
    payload.latitude = location.lat;
    payload.longitude = location.lng;
  }
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/clock_out', payload);
  return response.data.data;
}

export async function onBreak(): Promise<TimeClock> {
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/on_break');
  return response.data.data;
}

export async function offBreak(): Promise<TimeClock> {
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/off_break');
  return response.data.data;
}

export async function createManualEntry(params: {
  clock_in_at: string;
  clock_out_at: string;
  job_id?: number;
  notes?: string;
}): Promise<TimeClock> {
  const response = await apiClient.post<ApiResponse<{ data: TimeClock }>>('/time_clocks/create_manual', params);
  return response.data.data;
}

export async function getTeamClocks(params?: {
  user_id?: number;
  from?: string;
  to?: string;
}): Promise<TimeClock[]> {
  const response = await apiClient.get<TimeClock[]>('/time_clocks/team', { params });
  return response.data;
}

export async function updateClock(id: number, params: {
  clock_in_at?: string;
  clock_out_at?: string;
  notes?: string;
  approved?: boolean;
}): Promise<TimeClock> {
  const response = await apiClient.patch<ApiResponse<{ data: TimeClock }>>(`/time_clocks/${id}`, params);
  return response.data.data;
}
