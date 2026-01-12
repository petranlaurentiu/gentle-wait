/**
 * Design tokens and theme configuration for GentleWait
 * Liquid Glass Design System - iOS 26 inspired
 * Typography: Outfit font family
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  card: 24,
  glass: 28,
  pills: 999,
  button: 20,
  sm: 12,
} as const;

/**
 * Font family definitions
 * Using Outfit - a geometric sans-serif with excellent readability
 */
export const fonts = {
  thin: "Outfit-Thin",
  extraLight: "Outfit-ExtraLight",
  light: "Outfit-Light",
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semiBold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
} as const;

/**
 * Typography scale with improved hierarchy
 * All text uses Outfit font family for consistency
 */
export const typography = {
  // Display - for large hero numbers (timers, stats)
  display: {
    fontSize: 72,
    fontFamily: fonts.thin,
    lineHeight: 80,
    letterSpacing: -3,
  },
  // Hero - for main titles on hero sections
  hero: {
    fontSize: 40,
    fontFamily: fonts.extraLight,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  // Title - for screen titles and section headers
  title: {
    fontSize: 28,
    fontFamily: fonts.light,
    lineHeight: 36,
    letterSpacing: 0,
  },
  // Heading - for card titles and important labels
  heading: {
    fontSize: 20,
    fontFamily: fonts.medium,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  // Body Large - for important body text
  bodyLarge: {
    fontSize: 17,
    fontFamily: fonts.regular,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  // Body - standard body text
  body: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  // Button - for button labels
  button: {
    fontSize: 16,
    fontFamily: fonts.medium,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  // Label - for form labels and small headers
  label: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
  // Caption - for helper text and timestamps
  caption: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  // Small - for fine print
  small: {
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  // Legacy aliases for backwards compatibility
  prompt: {
    fontSize: 17,
    fontFamily: fonts.regular,
    lineHeight: 26,
  },
  secondary: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 24,
  },
} as const;

// Liquid Glass Color Palette
export const colors = {
  light: {
    // Base colors
    bg: "#0A0E1A",
    surface: "rgba(255, 255, 255, 0.08)",
    surfaceGlass: "rgba(255, 255, 255, 0.12)",
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.5)",

    // Liquid Glass accent colors
    primary: "#00D4FF",
    primaryLight: "rgba(0, 212, 255, 0.3)",
    primaryDark: "#0099CC",
    secondary: "#A855F7",
    secondaryLight: "rgba(168, 85, 247, 0.3)",
    accent: "#FF6B9D",
    accentLight: "rgba(255, 107, 157, 0.3)",

    // Glass effects
    glassBorder: "rgba(255, 255, 255, 0.15)",
    glassHighlight: "rgba(255, 255, 255, 0.25)",
    glassShadow: "rgba(0, 0, 0, 0.3)",

    // Gradient colors for mesh background
    gradientStart: "#0A0E1A",
    gradientMid1: "#1A1F3A",
    gradientMid2: "#0D1525",
    gradientEnd: "#050810",
    gradientAccent1: "#00D4FF",
    gradientAccent2: "#A855F7",
    gradientAccent3: "#FF6B9D",

    // Semantic
    border: "rgba(255, 255, 255, 0.1)",
    success: "#10B981",
    error: "#F87171",
    warning: "#FBBF24",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
  dark: {
    // Same as light for this dark-first design
    bg: "#0A0E1A",
    surface: "rgba(255, 255, 255, 0.08)",
    surfaceGlass: "rgba(255, 255, 255, 0.12)",
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.5)",

    primary: "#00D4FF",
    primaryLight: "rgba(0, 212, 255, 0.3)",
    primaryDark: "#0099CC",
    secondary: "#A855F7",
    secondaryLight: "rgba(168, 85, 247, 0.3)",
    accent: "#FF6B9D",
    accentLight: "rgba(255, 107, 157, 0.3)",

    glassBorder: "rgba(255, 255, 255, 0.15)",
    glassHighlight: "rgba(255, 255, 255, 0.25)",
    glassShadow: "rgba(0, 0, 0, 0.3)",

    gradientStart: "#0A0E1A",
    gradientMid1: "#1A1F3A",
    gradientMid2: "#0D1525",
    gradientEnd: "#050810",
    gradientAccent1: "#00D4FF",
    gradientAccent2: "#A855F7",
    gradientAccent3: "#FF6B9D",

    border: "rgba(255, 255, 255, 0.1)",
    success: "#34D399",
    error: "#F87171",
    warning: "#FBBF24",
    overlay: "rgba(0, 0, 0, 0.6)",
  },
} as const;

export const glassEffects = {
  blur: {
    light: 20,
    medium: 40,
    heavy: 60,
  },
  opacity: {
    subtle: 0.05,
    light: 0.1,
    medium: 0.15,
    strong: 0.25,
  },
} as const;

export const shadows = {
  sm: "0 2px 8px rgba(0, 0, 0, 0.15)",
  md: "0 8px 24px rgba(0, 0, 0, 0.2)",
  lg: "0 16px 48px rgba(0, 0, 0, 0.25)",
  glow: {
    primary: "0 0 30px rgba(0, 212, 255, 0.4)",
    secondary: "0 0 30px rgba(168, 85, 247, 0.4)",
    accent: "0 0 30px rgba(255, 107, 157, 0.4)",
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
export type Shadows = typeof shadows;
