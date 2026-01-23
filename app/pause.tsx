/**
 * Pause screen - Interception UI shown when user tries to open a protected app
 * Liquid Glass Design System
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
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
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import {
  spacing,
  typography,
  fonts,
  animation,
  radius,
} from "@/src/theme/theme";
import { insertEvent } from "@/src/services/storage/sqlite";
import {
  triggerSelectionFeedback,
  triggerSuccessNotification,
} from "@/src/utils/haptics";
import { Button } from "@/src/components/Button";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.55;

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type PausePhase = "breathing" | "question";

export default function PauseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [phase, setPhase] = useState<PausePhase>("breathing");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [timer, setTimer] = useState(8);
  const [breathText, setBreathText] = useState("Breathe in");
  const sessionId = generateId();

  const appPackage = params.appPackage as string;
  const appLabel = (params.appLabel as string) || "App";

  // Breathing animation
  const breathProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const phaseOpacity = useSharedValue(1);

  // Start breathing animation
  useEffect(() => {
    if (phase !== "breathing") return;

    // Breathing cycle: 4s in, 4s out
    breathProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    // Breath text toggle
    const textInterval = setInterval(() => {
      setBreathText((prev) =>
        prev === "Breathe in" ? "Breathe out" : "Breathe in"
      );
    }, 4000);

    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Auto-advance after cycle
    const advanceTimer = setTimeout(() => {
      phaseOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });

      setTimeout(() => {
        setPhase("question");
        phaseOpacity.value = withTiming(1, { duration: 400 });
      }, 400);
    }, animation.breathingCycle);

    return () => {
      clearInterval(textInterval);
      clearInterval(timerInterval);
      clearTimeout(advanceTimer);
    };
  }, [phase, breathProgress, glowOpacity, phaseOpacity]);

  // Animated styles
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(breathProgress.value, [0, 1], [1, 1.15]) },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { scale: interpolate(breathProgress.value, [0, 1], [1, 1.25]) },
    ],
  }));

  const phaseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phaseOpacity.value,
  }));

  const handleReasonSelect = async (reason: string) => {
    await triggerSelectionFeedback();
    setSelectedReason(reason);
  };

  const handleOpenAnyway = async () => {
    await triggerSuccessNotification();
    await insertEvent({
      id: generateId(),
      ts: Date.now(),
      appPackage,
      appLabel,
      action: "opened_anyway",
      reason: (selectedReason as any) || undefined,
      sessionId,
    });
    // Pending interception already cleared by deep link handler
    router.back();
  };

  const handleClose = async () => {
    await triggerSuccessNotification();
    await insertEvent({
      id: generateId(),
      ts: Date.now(),
      appPackage,
      appLabel,
      action: "closed",
      reason: (selectedReason as any) || undefined,
      sessionId,
    });
    // Pending interception already cleared by deep link handler
    router.back();
  };

  const handleAlternative = (
    type: "breathe" | "reflect" | "grounding" | "exercise" | "prayer"
  ) => {
    if (type === "exercise") {
      router.push({
        pathname: "/exercise",
        params: { sessionId, appPackage, appLabel },
      });
    } else if (type === "prayer") {
      router.push({
        pathname: "/prayer",
        params: { sessionId, appPackage, appLabel },
      });
    } else {
      router.push({
        pathname: "/alternatives",
        params: {
          type,
          sessionId,
          appPackage,
          appLabel,
          reason: selectedReason || undefined,
        },
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },
    contentWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 400,
    },
    // Breathing phase
    breathingContainer: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    timerText: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.text,
      marginBottom: spacing.xl,
      letterSpacing: -4,
    },
    circleContainer: {
      width: CIRCLE_SIZE + 60,
      height: CIRCLE_SIZE + 60,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    glowOuter: {
      position: "absolute",
      width: CIRCLE_SIZE + 60,
      height: CIRCLE_SIZE + 60,
      borderRadius: (CIRCLE_SIZE + 60) / 2,
    },
    glassCircle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    circleBlur: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    circleGradient: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    breathText: {
      fontFamily: fonts.light,
      fontSize: typography.heading.fontSize,
      color: colors.text,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    breathMessage: {
      fontFamily: fonts.regular,
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 26,
    },
    // Question phase
    questionContainer: {
      width: "100%",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: spacing.xl,
    },
    questionTitle: {
      fontFamily: fonts.light,
      fontSize: 28,
      color: colors.text,
      marginBottom: spacing.xl,
      textAlign: "center",
      letterSpacing: 0.3,
    },
    questionAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm + 2,
      width: "100%",
    },
    chip: {
      width: "30%",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.button,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    chipSelected: {
      backgroundColor: "rgba(0, 212, 255, 0.25)",
      borderColor: colors.primary,
    },
    chipEmoji: {
      fontSize: 24,
      marginBottom: 4,
    },
    chipText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    chipSelectedText: {
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Actions
    actionContainer: {
      width: "100%",
      gap: spacing.sm + 2,
      paddingBottom: spacing.xl,
      paddingTop: spacing.md,
    },
    actionTitle: {
      fontFamily: fonts.medium,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginVertical: spacing.sm,
    },
  });

  const reasonChoices = [
    { label: "To Relax", value: "relax", emoji: "😌" },
    { label: "Connection", value: "connect", emoji: "💬" },
    { label: "Escape", value: "distraction", emoji: "🫥" },
    { label: "Quick Info", value: "info", emoji: "📱" },
    { label: "Just Habit", value: "habit", emoji: "🔄" },
    { label: "Not Sure", value: "unsure", emoji: "🤔" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.contentWrapper}>
          {phase === "breathing" && (
            <Animated.View
              style={[phaseAnimatedStyle, styles.breathingContainer]}
            >
              <Text style={styles.timerText}>{timer}</Text>

              <View style={styles.circleContainer}>
                {/* Animated glow */}
                <Animated.View style={[styles.glowOuter, glowAnimatedStyle]}>
                  <LinearGradient
                    colors={[
                      "rgba(0, 212, 255, 0.4)",
                      "rgba(168, 85, 247, 0.2)",
                      "transparent",
                    ]}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: (CIRCLE_SIZE + 60) / 2,
                    }}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                  />
                </Animated.View>

                {/* Glass breathing circle */}
                <Animated.View
                  style={[styles.glassCircle, circleAnimatedStyle]}
                >
                  <BlurView
                    intensity={40}
                    style={styles.circleBlur}
                    tint="dark"
                  >
                    <LinearGradient
                      colors={[
                        "rgba(0, 212, 255, 0.15)",
                        "rgba(168, 85, 247, 0.1)",
                        "rgba(255, 107, 157, 0.05)",
                      ]}
                      style={styles.circleGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.breathText}>{breathText}</Text>
                    </LinearGradient>
                  </BlurView>
                </Animated.View>
              </View>

              <Text style={styles.breathMessage}>
                You paused. That&apos;s already a win.
              </Text>
            </Animated.View>
          )}

          {phase === "question" && (
            <Animated.View
              style={[phaseAnimatedStyle, styles.questionContainer]}
            >
              <Text style={styles.questionTitle}>
                What brought you <Text style={styles.questionAccent}>here</Text>
                ?
              </Text>
              <View style={styles.chipGrid}>
                {reasonChoices.map((choice) => (
                  <TouchableOpacity
                    key={choice.value}
                    style={[
                      styles.chip,
                      selectedReason === choice.value && styles.chipSelected,
                    ]}
                    onPress={() => handleReasonSelect(choice.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipEmoji}>{choice.emoji}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        selectedReason === choice.value &&
                          styles.chipSelectedText,
                      ]}
                    >
                      {choice.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
        </View>

        <View style={styles.actionContainer}>
          <Text style={styles.actionTitle}>What would you like to do?</Text>
          <Button
            label="🙏  Take a Moment to Pray"
            onPress={() => handleAlternative("prayer")}
            variant="primary"
          />
          <Button
            label="🧘  Breathe & Ground"
            onPress={() => handleAlternative("breathe")}
            variant="secondary"
          />
          <Button
            label="💪  Quick Movement Break"
            onPress={() => handleAlternative("exercise")}
            variant="secondary"
          />
          <Button
            label="📝  Journal This Moment"
            onPress={() => handleAlternative("reflect")}
            variant="secondary"
          />
          <View style={styles.divider} />
          <Button
            label={`Open ${appLabel} anyway`}
            onPress={handleOpenAnyway}
            variant="ghost"
          />
          <Button
            label="I don't need this right now"
            onPress={handleClose}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
