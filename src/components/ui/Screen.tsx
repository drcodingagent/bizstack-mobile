import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  edges?: readonly ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  scrolls?: boolean;
  tint?: string;
}

export function Screen({
  children,
  edges = ['top'],
  style,
  tint = colors.bg,
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tint }, style]} edges={edges}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
});
