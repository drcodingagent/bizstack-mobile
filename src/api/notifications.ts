import apiClient from './client';

function unwrap<T>(response: { data: any }): T {
  return (response.data?.data ?? response.data) as T;
}

export async function getNotifications(): Promise<any[]> {
  const response = await apiClient.get('/notifications');
  return unwrap<any[]>(response);
}

export async function markRead(id: number): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await apiClient.post('/notifications/read_all');
}
