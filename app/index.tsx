import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store';

export default function Index() {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/schedule');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
