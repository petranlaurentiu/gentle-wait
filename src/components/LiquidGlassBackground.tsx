/**
 * Soft liquid-glass background with slow ambient drift.
 */
import { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { animation } from "@/src/theme/theme";

const { width, height } = Dimensions.get("window");

interface LiquidGlassBackgroundProps {
  children: React.ReactNode;
}

export function LiquidGlassBackground({ children }: LiquidGlassBackgroundProps) {
  const { colors } = useTheme();

  const driftOne = useSharedValue(0);
  const driftTwo = useSharedValue(0);
  const driftThree = useSharedValue(0);

  useEffect(() => {
    driftOne.value = withRepeat(
      withTiming(1, { duration: animation.glassShift + 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    driftTwo.value = withRepeat(
      withTiming(1, { duration: animation.glassShift + 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    driftThree.value = withRepeat(
      withTiming(1, { duration: animation.glassShift + 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [driftOne, driftTwo, driftThree]);

  const orbOneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(driftOne.value, [0, 1], [-26, 52]) },
      { translateY: interpolate(driftOne.value, [0, 1], [-18, 42]) },
      { scale: interpolate(driftOne.value, [0, 1], [1, 1.08]) },
    ],
    opacity: interpolate(driftOne.value, [0, 0.5, 1], [0.5, 0.68, 0.52]),
  }));

  const orbTwoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(driftTwo.value, [0, 1], [34, -46]) },
      { translateY: interpolate(driftTwo.value, [0, 1], [12, -34]) },
      { scale: interpolate(driftTwo.value, [0, 1], [1.04, 0.94]) },
    ],
    opacity: interpolate(driftTwo.value, [0, 0.5, 1], [0.34, 0.46, 0.36]),
  }));

  const orbThreeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(driftThree.value, [0, 1], [0, -44]) },
      { translateY: interpolate(driftThree.value, [0, 1], [22, -28]) },
      { scale: interpolate(driftThree.value, [0, 1], [0.98, 1.06]) },
    ],
    opacity: interpolate(driftThree.value, [0, 0.5, 1], [0.24, 0.38, 0.28]),
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}> 
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid1, colors.gradientMid2, colors.gradientEnd]}
        locations={[0, 0.3, 0.68, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.orb, styles.orb1, orbOneStyle]}>
        <LinearGradient
          colors={[colors.gradientAccent1, "rgba(143, 214, 255, 0)"]}
          style={styles.orbGradient}
          start={{ x: 0.3, y: 0.25 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb2, orbTwoStyle]}>
        <LinearGradient
          colors={[colors.gradientAccent2, "rgba(126, 230, 198, 0)"]}
          style={styles.orbGradient}
          start={{ x: 0.35, y: 0.2 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb3, orbThreeStyle]}>
        <LinearGradient
          colors={[colors.gradientAccent3, "rgba(255, 201, 169, 0)"]}
          style={styles.orbGradient}
          start={{ x: 0.45, y: 0.2 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <LinearGradient
        colors={["rgba(255,255,255,0.03)", "rgba(255,255,255,0)"]}
        style={styles.vignette}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <View style={styles.noiseOverlay} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: width * 0.92,
    height: width * 0.92,
    top: -width * 0.34,
    left: -width * 0.12,
  },
  orb2: {
    width: width * 0.84,
    height: width * 0.84,
    top: height * 0.18,
    right: -width * 0.25,
  },
  orb3: {
    width: width * 0.68,
    height: width * 0.68,
    bottom: height * 0.04,
    left: width * 0.08,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.018)",
  },
});
