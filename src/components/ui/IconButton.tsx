import React from 'react';
import { Pressable, StyleSheet, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { Text } from './Text';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: ViewStyle;
  variant?: 'chip' | 'plain' | 'ring';
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.textPrimary,
  size = 20,
  style,
  variant = 'chip',
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'chip' && styles.chip,
        variant === 'ring' && styles.ring,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
      {label && (
        <Text variant="caption" color={color} style={{ marginTop: 4 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 56,
  },
  ring: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
