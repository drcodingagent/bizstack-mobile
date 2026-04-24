import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../src/store';
import { colors } from '../src/theme';

export default function Index() {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/tabs/home');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});
