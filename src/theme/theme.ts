/**
 * Design tokens and theme configuration for GentleWait.
 * Soft liquid-glass system with a dark-first premium palette.
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

export const fonts = {
  thin: "Outfit-Thin",
  extraLight: "Outfit-ExtraLight",
  light: "Outfit-Light",
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semiBold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
} as const;

export const typography = {
  display: {
    fontSize: 60,
    fontFamily: fonts.thin,
    lineHeight: 66,
    letterSpacing: -2.6,
  },
  hero: {
    fontSize: 38,
    fontFamily: fonts.light,
    lineHeight: 44,
    letterSpacing: -1.1,
  },
  screenTitle: {
    fontSize: 31,
    fontFamily: fonts.semiBold,
    lineHeight: 36,
    letterSpacing: -0.7,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.medium,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontSize: 21,
    fontFamily: fonts.medium,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  heading: {
    fontSize: 18,
    fontFamily: fonts.medium,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 17,
    fontFamily: fonts.regular,
    lineHeight: 25,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 22,
    letterSpacing: 0,
  },
  button: {
    fontSize: 16,
    fontFamily: fonts.medium,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: "uppercase" as const,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.medium,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    letterSpacing: 0,
  },
  small: {
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 15,
    letterSpacing: 0,
  },
  prompt: {
    fontSize: 17,
    fontFamily: fonts.regular,
    lineHeight: 25,
  },
  secondary: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },
} as const;

const liquidPalette = {
  bg: "#0F1724",
  bgElevated: "#162033",
  surface: "rgba(224, 232, 255, 0.08)",
  surfaceElevated: "rgba(224, 232, 255, 0.12)",
  surfaceGlass: "rgba(235, 242, 255, 0.16)",
  glassFill: "rgba(218, 228, 248, 0.12)",
  glassFillStrong: "rgba(228, 236, 252, 0.18)",
  glassStroke: "rgba(236, 244, 255, 0.16)",
  glassSpecular: "rgba(255, 255, 255, 0.34)",
  glassShadowSoft: "rgba(4, 9, 20, 0.34)",
  textPrimary: "#F5F7FB",
  textSecondary: "rgba(226, 232, 240, 0.78)",
  textTertiary: "rgba(226, 232, 240, 0.56)",
  textInverse: "#0F1724",
  primary: "#8FD6FF",
  primaryLight: "rgba(143, 214, 255, 0.30)",
  primaryDark: "#58BDEB",
  secondary: "#7EE6C6",
  secondaryLight: "rgba(126, 230, 198, 0.28)",
  accent: "#FFC9A9",
  accentLight: "rgba(255, 201, 169, 0.28)",
  border: "rgba(233, 240, 255, 0.12)",
  glassBorder: "rgba(236, 244, 255, 0.14)",
  glassHighlight: "rgba(255, 255, 255, 0.22)",
  glassShadow: "rgba(0, 0, 0, 0.24)",
  gradientStart: "#0F1724",
  gradientMid1: "#162033",
  gradientMid2: "#1B2840",
  gradientEnd: "#0C1422",
  gradientAccent1: "rgba(143, 214, 255, 0.65)",
  gradientAccent2: "rgba(126, 230, 198, 0.42)",
  gradientAccent3: "rgba(255, 201, 169, 0.34)",
  success: "#8DE0BA",
  error: "#F2A6A0",
  warning: "#F4C98A",
  overlay: "rgba(5, 10, 20, 0.64)",
} as const;

export const colors = {
  light: {
    ...liquidPalette,
    text: liquidPalette.textPrimary,
    textMuted: liquidPalette.textTertiary,
  },
  dark: {
    ...liquidPalette,
    text: liquidPalette.textPrimary,
    textMuted: liquidPalette.textTertiary,
  },
} as const;

export const glassEffects = {
  blur: {
    light: 28,
    medium: 42,
    heavy: 60,
  },
  opacity: {
    subtle: 0.06,
    light: 0.1,
    medium: 0.16,
    strong: 0.24,
  },
} as const;

export const shadows = {
  sm: "0 4px 14px rgba(5, 10, 20, 0.16)",
  md: "0 14px 32px rgba(5, 10, 20, 0.22)",
  lg: "0 24px 54px rgba(5, 10, 20, 0.28)",
  glow: {
    primary: "0 0 28px rgba(143, 214, 255, 0.24)",
    secondary: "0 0 28px rgba(126, 230, 198, 0.20)",
    accent: "0 0 28px rgba(255, 201, 169, 0.18)",
  },
} as const;

export const animation = {
  screenFade: 420,
  breathingCycle: 8000,
  breathePhase: 4000,
  enterSoft: 380,
  enterLift: 460,
  glassShift: 9000,
  specularSweep: 2200,
  pressScale: 140,
} as const;

export type Theme = typeof colors.light;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
