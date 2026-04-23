import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        {/* Auth screens — no header, redirected if already authenticated */}
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />
        {/* Tab screens */}
        <Stack.Screen
          name="(tabs)/schedule"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)/jobs"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)/time"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)/profile"
          options={{
            headerShown: false,
          }}
        />
        {/* Job detail */}
        <Stack.Screen
          name="job/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
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
