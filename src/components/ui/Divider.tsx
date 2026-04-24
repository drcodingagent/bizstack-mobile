import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';

export function Divider({ style, inset }: { style?: ViewStyle; inset?: number }) {
  return <View style={[styles.line, inset ? { marginHorizontal: inset } : null, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
