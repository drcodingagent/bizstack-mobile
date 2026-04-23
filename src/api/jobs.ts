import apiClient from './client';
import { Job, Task, Photo, LineItem, JobNote, ApiResponse } from '../types';

// ─── Jobs ────────────────────────────────────────────────────────────────────

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
  const response = await apiClient.patch<Job>(`/jobs/${id}`, { job: { status } });
  return response.data;
}

export async function startJob(id: number): Promise<Job> {
  const response = await apiClient.post<Job>(`/jobs/${id}/start`);
  return response.data;
}

export async function completeJob(id: number): Promise<Job> {
  const response = await apiClient.post<Job>(`/jobs/${id}/complete`);
  return response.data;
}

export async function cancelJob(id: number, reason: string): Promise<Job> {
  const response = await apiClient.post<Job>(`/jobs/${id}/cancel`, { reason });
  return response.data;
}

export async function sendOnMyWay(id: number): Promise<void> {
  await apiClient.post(`/jobs/${id}/send_on_my_way`);
}

export async function signoffJob(
  id: number,
  signature: string,
  rating: number,
  feedback?: string
): Promise<Job> {
  const response = await apiClient.post<Job>(`/jobs/${id}/signoff`, {
    signature,
    rating,
    feedback,
  });
  return response.data;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
// Note: Tasks are included in the job detail response.
// These endpoints are for creating/updating tasks independently.

export async function getJobTasks(jobId: number): Promise<Task[]> {
  const response = await apiClient.get<Task[]>(`/jobs/${jobId}/tasks`);
  return response.data;
}

export async function createTask(
  jobId: number,
  data: { title: string; requires_photo?: boolean }
): Promise<Task> {
  const response = await apiClient.post<Task>(`/jobs/${jobId}/tasks`, { task: data });
  return response.data;
}

export async function updateTask(
  jobId: number,
  taskId: number,
  data: { title?: string; status?: string; requires_photo?: boolean }
): Promise<Task> {
  const response = await apiClient.patch<Task>(`/jobs/${jobId}/tasks/${taskId}`, { task: data });
  return response.data;
}

export async function completeTask(jobId: number, taskId: number): Promise<Task> {
  const response = await apiClient.post<Task>(`/jobs/${jobId}/tasks/${taskId}/complete`);
  return response.data;
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function getJobPhotos(jobId: number): Promise<Photo[]> {
  const response = await apiClient.get<Photo[]>(`/jobs/${jobId}/attachments`, {
    params: { category: 'photo' },
  });
  return response.data;
}

export async function uploadPhoto(
  jobId: number,
  uri: string,
  caption?: string
): Promise<Photo> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  } as any);
  if (caption) {
    formData.append('caption', caption);
  }

  const response = await apiClient.post<Photo>(`/jobs/${jobId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// ─── Line Items ──────────────────────────────────────────────────────────────

export async function getJobLineItems(jobId: number): Promise<LineItem[]> {
  const response = await apiClient.get<LineItem[]>(`/jobs/${jobId}/line_items`);
  return response.data;
}

export async function addJobLineItem(
  jobId: number,
  data: { name: string; quantity: number; unit_price: number }
): Promise<LineItem> {
  const response = await apiClient.post<LineItem>(`/jobs/${jobId}/line_items`, {
    line_item: data,
  });
  return response.data;
}

export async function removeJobLineItem(jobId: number, itemId: number): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}/line_items/${itemId}`);
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function getJobNotes(jobId: number): Promise<JobNote[]> {
  const response = await apiClient.get<JobNote[]>(`/jobs/${jobId}/notes`);
  return response.data;
}

export async function addJobNote(jobId: number, message: string): Promise<JobNote> {
  const response = await apiClient.post<JobNote>(`/jobs/${jobId}/notes`, {
    note: { message },
  });
  return response.data;
}

// ─── Signature ───────────────────────────────────────────────────────────────

export async function uploadSignature(jobId: number, base64: string): Promise<void> {
  await apiClient.post(`/jobs/${jobId}/signature`, { signature: base64 });
}
