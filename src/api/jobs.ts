import apiClient from './client';
import { Job, Task, ClockEntry } from '../types';

export async function getJobs(date?: string): Promise<Job[]> {
  const params = date ? { date } : {};
  const response = await apiClient.get<Job[]>('/jobs', { params });
  return response.data;
}

export async function getJob(id: number): Promise<Job> {
  const response = await apiClient.get<Job>(`/jobs/${id}`);
  return response.data;
}

export async function updateJobStatus(id: number, status: string): Promise<Job> {
  const response = await apiClient.patch<Job>(`/jobs/${id}`, { status });
  return response.data;
}

export async function completeTask(jobId: number, taskId: number): Promise<Task> {
  const response = await apiClient.post<Task>(`/jobs/${jobId}/tasks/${taskId}/complete`);
  return response.data;
}

export async function clockIn(jobId: number): Promise<ClockEntry> {
  const response = await apiClient.post<ClockEntry>('/time_clocks/clock_in', { job_id: jobId });
  return response.data;
}

export async function clockOut(jobId: number): Promise<ClockEntry> {
  const response = await apiClient.post<ClockEntry>('/time_clocks/clock_out', { job_id: jobId });
  return response.data;
}

export async function uploadPhoto(jobId: number, uri: string): Promise<void> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  } as any);

  await apiClient.post(`/jobs/${jobId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function uploadSignature(jobId: number, base64: string): Promise<void> {
  await apiClient.post(`/jobs/${jobId}/signature`, { signature: base64 });
}
