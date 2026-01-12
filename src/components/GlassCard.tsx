/**
 * Glass Card Component - Liquid Glass UI element with blur and light effects
 */
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme/ThemeProvider";
import { radius, spacing } from "@/src/theme/theme";

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
    light: 20,
    medium: 40,
    strong: 60,
  }[intensity];

  const glowColors = {
    primary: ["rgba(0, 212, 255, 0.15)", "transparent"],
    secondary: ["rgba(168, 85, 247, 0.15)", "transparent"],
    accent: ["rgba(255, 107, 157, 0.15)", "transparent"],
    none: ["transparent", "transparent"],
  };

  return (
    <View style={[styles.container, style]}>
      {/* Glow effect behind card */}
      {glowColor !== "none" && (
        <LinearGradient
          colors={glowColors[glowColor] as [string, string]}
          style={styles.glowEffect}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      )}

      {/* Glass card */}
      <View style={styles.glassContainer}>
        <BlurView intensity={blurIntensity} style={styles.blur} tint="dark">
          {/* Inner highlight gradient */}
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0.12)",
              "rgba(255, 255, 255, 0.05)",
              "rgba(255, 255, 255, 0.02)",
            ]}
            locations={[0, 0.3, 1]}
            style={styles.innerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Top edge highlight */}
            <View style={styles.topHighlight} />

            {/* Content */}
            <View style={[styles.content, noPadding && styles.noPadding]}>
              {children}
            </View>
          </LinearGradient>
        </BlurView>

        {/* Border overlay */}
        <View style={styles.borderOverlay} pointerEvents="none" />
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
    top: -20,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: radius.glass,
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
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 1,
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
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
