import apiClient from './client';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, User } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', { email, password });

  // Rails wraps in { status: "success", data: { user, jwt_token }, message: "..." }
  const payload = response.data?.data || response.data;
  const token = payload?.jwt_token || payload?.token;
  const user = payload?.user;

  if (!token || !user) {
    throw new Error('Invalid login response');
  }

  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));

  return { token, user };
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_data');
}

export async function getStoredAuth(): Promise<{ token: string; user: User } | null> {
  const token = await SecureStore.getItemAsync('auth_token');
  const userData = await SecureStore.getItemAsync('user_data');

  if (!token || !userData) return null;

  try {
    const user = JSON.parse(userData) as User;
    return { token, user };
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<User> {
  const response = await apiClient.get('/profile');
  const payload = response.data?.data || response.data;
  return payload as User;
}
