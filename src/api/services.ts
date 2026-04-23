import apiClient from './client';
import { Service } from '../types';

export async function getServices(): Promise<Service[]> {
  const response = await apiClient.get<Service[]>('/services');
  return response.data;
}
