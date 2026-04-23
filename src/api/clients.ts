import apiClient from './client';
import { Client, Job } from '../types';

export async function getClient(id: number): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function getClientJobs(id: number): Promise<Job[]> {
  const response = await apiClient.get<Job[]>(`/clients/${id}/jobs`);
  return response.data;
}
