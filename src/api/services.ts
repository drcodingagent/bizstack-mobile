import apiClient from './client';

function unwrap<T>(response: { data: any }): T {
  return (response.data?.data ?? response.data) as T;
}

export async function getServices(): Promise<any[]> {
  const response = await apiClient.get('/services');
  return unwrap<any[]>(response);
}
