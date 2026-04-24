import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store';
import { Button, Text } from '../src/components/ui';
import { colors, radii, spacing } from '../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Sign in', 'Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/tabs');
    } catch (e: any) {
      const message = e?.response?.data?.error || 'Login failed. Check your credentials.';
      Alert.alert('Sign in', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text variant="h1" color={colors.onBrand}>
              E
            </Text>
          </View>
          <Text variant="display" style={{ marginTop: spacing.xl }}>
            Eos Log
          </Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: 4 }}>
            Field Worker
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
              Email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="you@work.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View>
            <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
              Password
            </Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <Button
            label="Sign in"
            onPress={handleLogin}
            loading={loading}
            size="xl"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </View>

        <Text variant="caption" color={colors.textMuted} style={styles.version}>
          v1.0.0
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing['4xl'],
  },
});
