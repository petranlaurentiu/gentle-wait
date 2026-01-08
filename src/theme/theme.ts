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
  button: 14,
  sm: 8,
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
    bg: '#F8FAFB',
    surface: '#FFFFFF',
    text: '#1A2332',
    textSecondary: '#64748B',
    primary: '#14B8A6',
    primaryLight: '#A7F3D0',
    primaryDark: '#0D9488',
    secondary: '#06B6D4',
    secondaryLight: '#CFFAFE',
    accent: '#F59E0B',
    border: '#E2E8F0',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    overlay: 'rgba(26, 35, 50, 0.5)',
  },
  dark: {
    bg: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    primary: '#14B8A6',
    primaryLight: '#0D9488',
    primaryDark: '#0F766E',
    secondary: '#06B6D4',
    secondaryLight: '#164E63',
    accent: '#FBBF24',
    border: '#334155',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    overlay: 'rgba(241, 245, 249, 0.1)',
  },
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
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
export type Shadows = typeof shadows;
