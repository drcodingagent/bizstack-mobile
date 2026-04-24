import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing | 0;
  elevated?: boolean;
  tint?: string;
}

export function Card({
  children,
  onPress,
  style,
  padding = 'lg',
  elevated = false,
  tint,
}: CardProps) {
  const pad = padding === 0 ? 0 : spacing[padding];
  const baseStyle: ViewStyle = {
    backgroundColor: tint ?? colors.surface,
    borderRadius: radii.lg,
    padding: pad,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...(elevated ? shadows.md : shadows.sm),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, style, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
