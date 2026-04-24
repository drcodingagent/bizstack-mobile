import { Platform, ViewStyle } from 'react-native';

export const palette = {
  white: '#ffffff',
  black: '#000000',

  neutral0: '#ffffff',
  neutral25: '#fafafa',
  neutral50: '#f5f5f4',
  neutral100: '#eeece8',
  neutral200: '#e3e1dc',
  neutral300: '#cdcac2',
  neutral400: '#a3a09a',
  neutral500: '#78756f',
  neutral600: '#57544f',
  neutral700: '#3d3b37',
  neutral800: '#262522',
  neutral900: '#1a1918',

  brand50: '#eef4ff',
  brand100: '#dbe7ff',
  brand200: '#b8ceff',
  brand500: '#3a6ff2',
  brand600: '#2757d6',
  brand700: '#1f47ac',

  green50: '#ecfdf5',
  green100: '#d1fae5',
  green500: '#10b981',
  green600: '#059669',
  green700: '#047857',

  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber500: '#f59e0b',
  amber600: '#d97706',

  red50: '#fef2f2',
  red100: '#fee2e2',
  red500: '#ef4444',
  red600: '#dc2626',

  sky50: '#f0f9ff',
  sky100: '#e0f2fe',
  sky500: '#0ea5e9',
  sky600: '#0284c7',
};

export const colors = {
  // Surfaces
  bg: palette.neutral25,
  surface: palette.neutral0,
  surfaceAlt: palette.neutral50,
  surfaceSunken: palette.neutral100,

  // Text
  textPrimary: palette.neutral900,
  textSecondary: palette.neutral600,
  textTertiary: palette.neutral500,
  textMuted: palette.neutral400,
  textInverse: palette.neutral0,

  // Borders / dividers
  border: palette.neutral200,
  borderStrong: palette.neutral300,

  // Brand
  brand: palette.brand600,
  brandSoft: palette.brand50,
  brandPressed: palette.brand700,
  onBrand: palette.neutral0,

  // Status semantic
  success: palette.green600,
  successSoft: palette.green50,
  onSuccess: palette.neutral0,

  warning: palette.amber600,
  warningSoft: palette.amber50,

  danger: palette.red600,
  dangerSoft: palette.red50,
  onDanger: palette.neutral0,

  info: palette.sky600,
  infoSoft: palette.sky50,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.6 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as const,
  },
};

const makeShadow = (elevation: number, opacity: number, radius: number, offsetY: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  })!;

export const shadows = {
  none: {} as ViewStyle,
  sm: makeShadow(1, 0.04, 3, 1),
  md: makeShadow(2, 0.06, 8, 2),
  lg: makeShadow(6, 0.1, 16, 6),
};

// Job status → semantic color
export const jobStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
    case 'new':
      return colors.info;
    case 'in_progress':
      return colors.brand;
    case 'completed':
      return colors.success;
    case 'cancelled':
      return colors.textMuted;
    default:
      return colors.textSecondary;
  }
};

export const jobStatusLabel = (status: string) => {
  switch (status) {
    case 'new': return 'New';
    case 'scheduled': return 'Scheduled';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

export const workStatusLabel = (status: string) => {
  switch (status) {
    case 'traveling': return 'Traveling';
    case 'arrived': return 'On Site';
    case 'working': return 'Working';
    case 'completed': return 'Done';
    default: return status;
  }
};
