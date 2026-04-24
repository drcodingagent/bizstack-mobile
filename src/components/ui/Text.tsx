import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors, typography } from '../../theme';

type Variant = keyof typeof typography;

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

export function Text({ variant = 'body', color = colors.textPrimary, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[typography[variant], { color }, style as TextStyle]} />;
}
