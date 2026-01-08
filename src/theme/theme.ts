/**
 * Design tokens and theme configuration for GentleWait
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  card: 16,
  pills: 999,
} as const;

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  secondary: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
} as const;

export const colors = {
  light: {
    bg: '#F6F7F5',
    text: '#1F2D2B',
    primary: '#2F5D50',
    secondary: '#8FB8A2',
    border: 'rgba(31,45,43,0.12)',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
  },
  dark: {
    bg: '#0F1A18',
    text: '#E3ECE8',
    primary: '#8FB8A2',
    secondary: '#2F5D50',
    border: 'rgba(227,236,232,0.12)',
    success: '#81C784',
    error: '#EF5350',
    warning: '#FFD54F',
  },
} as const;

export const animation = {
  screenFade: 300,
  breathingCycle: 8000, // 8s total (4 inhale + 4 exhale)
  breathePhase: 4000, // 4s per phase
} as const;

export type Theme = typeof colors.light;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
