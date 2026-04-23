import apiClient from './client';
import { Notification } from '../types';

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<Notification[]>('/notifications');
  return response.data;
}

export async function markRead(id: number): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await apiClient.post('/notifications/read_all');
}
