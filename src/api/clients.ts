import apiClient from './client';
import { Client } from '../types';

function unwrap<T>(response: { data: any }): T {
  return (response.data?.data ?? response.data) as T;
}

export async function getClient(id: number): Promise<Client> {
  const response = await apiClient.get(`/clients/${id}`);
  return unwrap<Client>(response);
}

export async function getClientJobs(id: number): Promise<any[]> {
  const response = await apiClient.get(`/clients/${id}/jobs`);
  return unwrap<any[]>(response);
}
