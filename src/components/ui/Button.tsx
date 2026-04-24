import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizing: Record<ButtonSize, { h: number; px: number; fs: number; icon: number }> = {
  sm: { h: 32, px: spacing.md, fs: 13, icon: 14 },
  md: { h: 40, px: spacing.lg, fs: 14, icon: 16 },
  lg: { h: 48, px: spacing.xl, fs: 15, icon: 18 },
  xl: { h: 56, px: spacing['2xl'], fs: 16, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const S = sizing[size];
  const { bg, fg, border } = resolveColors(variant);
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        {
          height: S.h,
          paddingHorizontal: S.px,
          backgroundColor: bg,
          ...(border ? { borderColor: border, borderWidth: 1 } : null),
          opacity: isInactive ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        } as ViewStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={S.icon} color={fg} style={{ marginRight: spacing.sm }} />
          )}
          <Text style={[styles.label, { color: fg, fontSize: S.fs }]} numberOfLines={1}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={S.icon} color={fg} style={{ marginLeft: spacing.sm }} />
          )}
        </View>
      )}
    </Pressable>
  );
}

function resolveColors(variant: ButtonVariant): { bg: string; fg: string; border: string | null } {
  switch (variant) {
    case 'primary':
      return { bg: colors.brand, fg: colors.onBrand, border: null };
    case 'secondary':
      return { bg: colors.surface, fg: colors.textPrimary, border: colors.borderStrong };
    case 'ghost':
      return { bg: 'transparent', fg: colors.textPrimary, border: null };
    case 'danger':
      return { bg: colors.danger, fg: colors.onDanger, border: null };
    case 'success':
      return { bg: colors.success, fg: colors.onSuccess, border: null };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: typography.title.fontWeight,
  },
});
