import apiClient from './client';
import { Job, Task, Photo, LineItem, JobNote } from '../types';

// Helper to unwrap Rails API response { success, data, message }
function unwrap<T>(response: { data: any }): T {
  return (response.data?.data ?? response.data) as T;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export async function getJobs(date?: string): Promise<Job[]> {
  const params = date ? { date } : {};
  const response = await apiClient.get('/jobs', { params });
  return unwrap<Job[]>(response);
}

export async function getJob(id: number): Promise<Job> {
  const response = await apiClient.get(`/jobs/${id}`);
  return unwrap<Job>(response);
}

export async function updateJobStatus(id: number, status: string): Promise<Job> {
  const response = await apiClient.patch(`/jobs/${id}`, { job: { status } });
  return unwrap<Job>(response);
}

export async function startJob(id: number): Promise<Job> {
  const response = await apiClient.post(`/jobs/${id}/start`);
  return unwrap<Job>(response);
}

export async function completeJob(id: number): Promise<Job> {
  const response = await apiClient.post(`/jobs/${id}/complete`);
  return unwrap<Job>(response);
}

export async function cancelJob(id: number, reason: string): Promise<Job> {
  const response = await apiClient.post(`/jobs/${id}/cancel`, { reason });
  return unwrap<Job>(response);
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
  const response = await apiClient.post(`/jobs/${id}/signoff`, {
    signature,
    rating,
    feedback,
  });
  return unwrap<Job>(response);
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getJobTasks(jobId: number): Promise<Task[]> {
  const response = await apiClient.get(`/jobs/${jobId}/tasks`);
  return unwrap<Task[]>(response);
}

export async function createTask(
  jobId: number,
  data: { title: string; requires_photo?: boolean }
): Promise<Task> {
  const response = await apiClient.post(`/jobs/${jobId}/tasks`, { task: data });
  return unwrap<Task>(response);
}

export async function updateTask(
  jobId: number,
  taskId: number,
  data: { title?: string; status?: string; requires_photo?: boolean }
): Promise<Task> {
  const response = await apiClient.patch(`/jobs/${jobId}/tasks/${taskId}`, { task: data });
  return unwrap<Task>(response);
}

export async function completeTask(jobId: number, taskId: number): Promise<Task> {
  const response = await apiClient.post(`/jobs/${jobId}/tasks/${taskId}/complete`);
  return unwrap<Task>(response);
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function getJobPhotos(jobId: number): Promise<Photo[]> {
  const response = await apiClient.get(`/jobs/${jobId}/attachments`, {
    params: { category: 'photo' },
  });
  return unwrap<Photo[]>(response);
}

export async function uploadPhoto(
  jobId: number,
  uri: string,
  caption?: string
): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  } as any);
  formData.append('category', 'photo');
  if (caption) {
    formData.append('caption', caption);
  }

  const response = await apiClient.post(`/jobs/${jobId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<Photo>(response);
}

export async function deletePhoto(jobId: number, photoId: number): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}/attachments/${photoId}`);
}

// ─── Line Items ──────────────────────────────────────────────────────────────

export async function getJobLineItems(jobId: number): Promise<LineItem[]> {
  const response = await apiClient.get(`/jobs/${jobId}/line_items`);
  return unwrap<LineItem[]>(response);
}

export async function addJobLineItem(
  jobId: number,
  data: { name: string; quantity: number; unit_price: number }
): Promise<LineItem> {
  const response = await apiClient.post(`/jobs/${jobId}/line_items`, {
    line_item: data,
  });
  return unwrap<LineItem>(response);
}

export async function removeJobLineItem(jobId: number, itemId: number): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}/line_items/${itemId}`);
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function getJobNotes(jobId: number): Promise<JobNote[]> {
  const response = await apiClient.get(`/jobs/${jobId}/notes`);
  return unwrap<JobNote[]>(response);
}

export async function addJobNote(jobId: number, message: string): Promise<JobNote> {
  const response = await apiClient.post(`/jobs/${jobId}/notes`, {
    note: { message },
  });
  return unwrap<JobNote>(response);
}

// ─── Signature ───────────────────────────────────────────────────────────────

export async function uploadSignature(jobId: number, base64: string): Promise<void> {
  await apiClient.post(`/jobs/${jobId}/signature`, { signature: base64 });
}
