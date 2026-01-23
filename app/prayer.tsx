/**
 * Prayer screen - A moment of spiritual reflection
 * Liquid Glass Design System
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeModules,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { insertEvent } from "@/src/services/storage/sqlite";
import { useAppStore } from "@/src/services/storage";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { getPrayerForDuration, Prayer } from "@/src/data/prayers";

const { width } = Dimensions.get("window");
const GLOW_SIZE = width * 0.4;

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type PrayerPhase = "prayer" | "complete";

export default function PrayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const settings = useAppStore((state) => state.settings);

  const sessionId = (params.sessionId as string) || "";
  const appPackage = (params.appPackage as string) || "";
  const appLabel = (params.appLabel as string) || "App";

  const [startTime] = useState(Date.now());
  const [phase, setPhase] = useState<PrayerPhase>("prayer");
  
  // Get pause duration from settings and select appropriate prayer
  const pauseDuration = settings.pauseDurationSec || 15;
  const [prayer] = useState<Prayer>(() => getPrayerForDuration(pauseDuration));
  const [timeLeft, setTimeLeft] = useState(pauseDuration); // Use user's pause duration, not prayer's estimated duration

  // Animation for gentle glow
  const glowOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);

  // Gentle pulsing glow animation
  useEffect(() => {
    if (phase !== "prayer") return;

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [phase, glowOpacity, glowScale]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "prayer") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase("complete");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const handleComplete = async () => {
    try {
      await insertEvent({
        id: generateId(),
        ts: Date.now(),
        appPackage,
        appLabel,
        action: "alternative_prayer",
        durationMs: Date.now() - startTime,
        sessionId,
      });

      // Navigate directly to home using replace to avoid navigation stack issues
      router.replace("/home");

      // Launch the app after a brief delay (pending interception already cleared)
      if (Platform.OS === "android" && NativeModules.GentleWaitModule?.launchApp && appPackage) {
        setTimeout(async () => {
          try {
            await NativeModules.GentleWaitModule.launchApp(appPackage);
            console.log("[Prayer] Launched app:", appPackage);
          } catch (error) {
            console.error("[Prayer] Failed to launch app:", error);
          }
        }, 800);
      }
    } catch (error) {
      console.error("[Prayer] Error completing prayer:", error);
      router.replace("/home");
    }
  };

  const handleSkip = async () => {
    try {
      // Pending interception already cleared by deep link handler
      router.back();
    } catch (error) {
      console.error("[Prayer] Error skipping prayer:", error);
      router.back();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    prayerName: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    prayerAttribution: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      fontStyle: "italic",
    },
    glowContainer: {
      width: GLOW_SIZE + 40,
      height: GLOW_SIZE + 40,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: spacing.xl,
    },
    glowOuter: {
      position: "absolute",
      width: GLOW_SIZE + 40,
      height: GLOW_SIZE + 40,
      borderRadius: (GLOW_SIZE + 40) / 2,
    },
    prayerIcon: {
      fontSize: 64,
      textAlign: "center",
    },
    timerText: {
      fontFamily: fonts.thin,
      fontSize: 48,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.md,
    },
    prayerTextCard: {
      marginBottom: spacing.xl,
    },
    prayerText: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: 32,
    },
    categoryBadge: {
      alignSelf: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      marginTop: spacing.lg,
    },
    categoryText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    buttonContainer: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    // Complete phase
    completeContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    completeEmoji: {
      fontSize: 64,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    completeTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    completeMessage: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: spacing.xl,
    },
  });

  // Complete phase
  if (phase === "complete") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🕊️</Text>
          <Text style={styles.completeTitle}>Peace Be With You</Text>
          <Text style={styles.completeMessage}>
            You took a moment to connect with something greater.{"\n"}
            May you carry this peace with you.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            label="Amen"
            onPress={handleComplete}
            variant="primary"
          />
          <Button label="Back" onPress={handleSkip} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  // Prayer phase
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.prayerName}>{prayer.icon} {prayer.name}</Text>
          {prayer.attribution && (
            <Text style={styles.prayerAttribution}>{prayer.attribution}</Text>
          )}
        </View>

        <View style={styles.glowContainer}>
          {/* Animated gentle glow */}
          <Animated.View style={[styles.glowOuter, glowAnimatedStyle]}>
            <LinearGradient
              colors={[
                "rgba(255, 215, 0, 0.3)",
                "rgba(255, 255, 255, 0.15)",
                "transparent",
              ]}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: (GLOW_SIZE + 40) / 2,
              }}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          <Text style={styles.prayerIcon}>✝️</Text>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        <GlassCard glowColor="secondary" style={styles.prayerTextCard}>
          <Text style={styles.prayerText}>{prayer.text}</Text>
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{prayer.category}</Text>
          </View>
        </GlassCard>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          label="Complete Prayer"
          onPress={() => setPhase("complete")}
          variant="secondary"
        />
        <Button label="Back" onPress={handleSkip} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}
