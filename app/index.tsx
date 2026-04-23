import { redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store';

export default function Index() {
  const { isLoading, isAuthenticated, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Don't redirect until auth is loaded
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return redirect('/(tabs)/schedule');
  }

  return redirect('/(auth)/login');
}
