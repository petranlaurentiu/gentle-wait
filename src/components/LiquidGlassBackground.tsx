/**
 * Liquid Glass Background - iOS 26 inspired animated gradient mesh
 */
import { useEffect } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";

const { width, height } = Dimensions.get("window");

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface LiquidGlassBackgroundProps {
  children: React.ReactNode;
}

export function LiquidGlassBackground({
  children,
}: LiquidGlassBackgroundProps) {
  const { colors } = useTheme();

  // Animation values for floating orbs
  const orb1Progress = useSharedValue(0);
  const orb2Progress = useSharedValue(0);
  const orb3Progress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    // Slow, dreamy floating animations
    orb1Progress.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orb2Progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    orb3Progress.value = withRepeat(
      withTiming(1, { duration: 25000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animated orb styles
  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb1Progress.value, [0, 1], [-50, 100]) },
      { translateY: interpolate(orb1Progress.value, [0, 1], [0, 150]) },
      { scale: interpolate(pulseProgress.value, [0, 1], [1, 1.3]) },
    ],
    opacity: interpolate(pulseProgress.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb2Progress.value, [0, 1], [50, -80]) },
      { translateY: interpolate(orb2Progress.value, [0, 1], [100, -50]) },
      { scale: interpolate(pulseProgress.value, [0, 1], [1.2, 0.9]) },
    ],
    opacity: interpolate(pulseProgress.value, [0, 0.5, 1], [0.5, 0.3, 0.5]),
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(orb3Progress.value, [0, 1], [0, -120]) },
      { translateY: interpolate(orb3Progress.value, [0, 1], [-100, 80]) },
      { scale: interpolate(pulseProgress.value, [0, 1], [0.8, 1.1]) },
    ],
    opacity: interpolate(pulseProgress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={["#0A0E1A", "#0D1525", "#1A1F3A", "#0A0E1A"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated gradient orbs */}
      <Animated.View style={[styles.orb, styles.orb1, orb1Style]}>
        <LinearGradient
          colors={["rgba(0, 212, 255, 0.6)", "rgba(0, 212, 255, 0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
        <LinearGradient
          colors={["rgba(168, 85, 247, 0.5)", "rgba(168, 85, 247, 0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb3, orb3Style]}>
        <LinearGradient
          colors={["rgba(255, 107, 157, 0.4)", "rgba(255, 107, 157, 0)"]}
          style={styles.orbGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Subtle noise/grain overlay for texture */}
      <View style={styles.noiseOverlay} />

      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E1A",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.2,
    left: -width * 0.1,
  },
  orb2: {
    width: width * 0.7,
    height: width * 0.7,
    top: height * 0.3,
    right: -width * 0.2,
  },
  orb3: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.1,
    left: -width * 0.15,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
});
