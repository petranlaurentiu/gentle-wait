/**
 * Glass card with softened liquid highlights and restrained ambient bloom.
 */
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme/ThemeProvider";
import { glassEffects, radius, spacing } from "@/src/theme/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: "light" | "medium" | "strong";
  glowColor?: "primary" | "secondary" | "accent" | "none";
  noPadding?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = "medium",
  glowColor = "none",
  noPadding = false,
}: GlassCardProps) {
  const { colors } = useTheme();

  const blurIntensity = {
    light: glassEffects.blur.light,
    medium: glassEffects.blur.medium,
    strong: glassEffects.blur.heavy,
  }[intensity];

  const glowColors = {
    primary: [colors.primaryLight, "transparent"],
    secondary: [colors.secondaryLight, "transparent"],
    accent: [colors.accentLight, "transparent"],
    none: ["transparent", "transparent"],
  } as const;

  return (
    <View style={[styles.container, style]}>
      {glowColor !== "none" && (
        <LinearGradient
          colors={glowColors[glowColor]}
          style={styles.glowEffect}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}

      <View style={styles.glassContainer}>
        <BlurView intensity={blurIntensity} style={styles.blur} tint="dark">
          <LinearGradient
            colors={[colors.glassFillStrong, colors.glassFill, "rgba(255,255,255,0.02)"]}
            locations={[0, 0.38, 1]}
            style={styles.innerGradient}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={[colors.glassSpecular, "transparent"]}
              start={{ x: 0.05, y: 0 }}
              end={{ x: 0.8, y: 0.7 }}
              style={styles.specularSweep}
            />
            <View style={[styles.topHighlight, { backgroundColor: colors.glassSpecular }]} />
            <View style={[styles.content, noPadding && styles.noPadding]}>{children}</View>
          </LinearGradient>
        </BlurView>

        <View
          style={[
            styles.borderOverlay,
            {
              borderColor: colors.glassStroke,
              shadowColor: colors.glassShadowSoft,
            },
          ]}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    top: -26,
    left: 18,
    right: 18,
    height: 86,
    borderRadius: radius.glass,
    opacity: 0.95,
  },
  glassContainer: {
    borderRadius: radius.glass,
    overflow: "hidden",
  },
  blur: {
    borderRadius: radius.glass,
    overflow: "hidden",
  },
  innerGradient: {
    borderRadius: radius.glass,
    minHeight: 1,
  },
  specularSweep: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "60%",
    height: "58%",
    opacity: 0.18,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    borderRadius: 1,
    opacity: 0.85,
  },
  content: {
    padding: spacing.lg,
  },
  noPadding: {
    padding: 0,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.glass,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
});
