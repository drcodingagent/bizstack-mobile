import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';

interface PillProps {
  label: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Pill({ label, color = colors.textSecondary, icon, dot = false, style, size = 'md' }: PillProps) {
  const fg = color;
  const bg = withAlpha(color, 0.1);
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
          paddingVertical: isSmall ? 2 : 4,
        },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: fg }]} />}
      {icon && <Ionicons name={icon} size={isSmall ? 11 : 13} color={fg} style={{ marginRight: 4 }} />}
      <Text
        style={[
          styles.label,
          { color: fg, fontSize: isSmall ? 11 : 12 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontWeight: typography.caption.fontWeight,
    letterSpacing: 0.1,
  },
});
