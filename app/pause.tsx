/**
 * Pause screen - Interception UI shown when user tries to open a protected app
 * Redesigned with calm & minimalist aesthetic
 */
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, animation, radius } from "@/src/theme/theme";
import { insertEvent } from "@/src/services/storage/sqlite";
import { useLoopAnimation } from "@/src/utils/animations";
import {
  triggerSelectionFeedback,
  triggerSuccessNotification,
} from "@/src/utils/haptics";

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
  const sessionId = generateId();

  const appPackage = params.appPackage as string;
  const appLabel = (params.appLabel as string) || "App";

  // Animation hooks
  const breathingAnimation = useLoopAnimation(
    1,
    1.25,
    animation.breathingCycle
  );
  const phaseOpacity = useSharedValue(1);
  const phaseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phaseOpacity.value,
  }));

  // Button press animations
  const primaryButtonScale = useSharedValue(1);
  const primaryButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryButtonScale.value }],
  }));

  const secondaryButtonScales = {
    breathe: useSharedValue(1),
    exercise: useSharedValue(1),
    close: useSharedValue(1),
  };

  const secondaryButtonAnimStyles = {
    breathe: useAnimatedStyle(() => ({
      transform: [{ scale: secondaryButtonScales.breathe.value }],
    })),
    exercise: useAnimatedStyle(() => ({
      transform: [{ scale: secondaryButtonScales.exercise.value }],
    })),
    close: useAnimatedStyle(() => ({
      transform: [{ scale: secondaryButtonScales.close.value }],
    })),
  };

  // Breathing phase - auto-advance to question after one cycle
  useEffect(() => {
    if (phase !== "breathing") return;

    const timer = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    const advanceTimer = setTimeout(() => {
      // Fade out breathing phase
      phaseOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });

      // Switch phase after fade
      setTimeout(() => {
        setPhase("question");
        phaseOpacity.value = 1;
      }, 300);
    }, animation.breathingCycle);

    return () => {
      clearInterval(timer);
      clearTimeout(advanceTimer);
    };
  }, [phase, phaseOpacity]);

  const handleReasonSelect = async (reason: string) => {
    await triggerSelectionFeedback();
    setSelectedReason(reason);
  };

  const handleButtonPress = (
    scaleRef: SharedValue<number>,
    callback: () => void
  ) => {
    scaleRef.value = withTiming(0.95, { duration: 100 });
    setTimeout(() => {
      scaleRef.value = withTiming(1, { duration: 100 });
      callback();
    }, 100);
  };

  const handleOpenAnyway = async () => {
    handleButtonPress(primaryButtonScale, async () => {
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
      router.back();
    });
  };

  const handleClose = async () => {
    handleButtonPress(secondaryButtonScales.close, async () => {
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
      router.back();
    });
  };

  const handleAlternative = (
    type: "breathe" | "reflect" | "grounding" | "exercise"
  ) => {
    const scaleRef =
      type === "breathe"
        ? secondaryButtonScales.breathe
        : secondaryButtonScales.exercise;

    handleButtonPress(scaleRef, () => {
      if (type === "exercise") {
        router.push({
          pathname: "/exercise",
          params: {
            sessionId,
            appPackage,
            appLabel,
          },
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
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: spacing.lg,
    },
    contentWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: spacing.xl,
    },
    breathingPhaseContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    breathingCircleOuter: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: `${colors.primary}15`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    breathingCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    breathingText: {
      fontSize: 18,
      fontWeight: "500",
      color: "#FFFFFF",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    timerText: {
      fontSize: 48,
      fontWeight: "200",
      color: colors.primary,
      marginBottom: spacing.lg,
      letterSpacing: -2,
    },
    breathingMessage: {
      fontSize: typography.secondary.fontSize + 2,
      fontWeight: "400",
      color: colors.textSecondary,
      textAlign: "center",
      letterSpacing: 0.5,
    },
    questionContainer: {
      width: "100%",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingTop: spacing.xl,
    },
    questionTitle: {
      fontSize: typography.title.fontSize + 4,
      fontWeight: "300",
      color: colors.text,
      marginBottom: spacing.xl + spacing.md,
      textAlign: "center",
      letterSpacing: 0.5,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm + 2,
      width: "100%",
      paddingHorizontal: spacing.sm,
    },
    chip: {
      width: "30%",
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textSecondary,
      textAlign: "center",
    },
    chipSelectedText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    divider: {
      width: 40,
      height: 3,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginVertical: spacing.xl + spacing.md,
      alignSelf: "center",
    },
    actionContainer: {
      width: "100%",
      gap: spacing.sm + 4,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    primaryButtonWrapper: {
      width: "100%",
      marginBottom: spacing.sm,
    },
    button: {
      paddingVertical: spacing.md + 4,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pills,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: typography.button.fontSize,
      fontWeight: "500",
      color: colors.text,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontWeight: "500",
    },
  });

  const reasonChoices = [
    { label: "Relax", value: "relax" },
    { label: "Connect", value: "connect" },
    { label: "Distraction", value: "distraction" },
    { label: "Info", value: "info" },
    { label: "Habit", value: "habit" },
    { label: "I'm not sure", value: "unsure" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        {phase === "breathing" && (
          <Animated.View
            style={[phaseAnimatedStyle, styles.breathingPhaseContainer]}
          >
            <Text style={styles.timerText}>{timer}</Text>
            <Animated.View style={styles.breathingCircleOuter}>
              <Animated.View
                style={[styles.breathingCircle, breathingAnimation]}
              >
                <Text style={styles.breathingText}>Breathe</Text>
              </Animated.View>
            </Animated.View>
            <Text style={styles.breathingMessage}>Take one mindful breath</Text>
          </Animated.View>
        )}

        {phase === "question" && (
          <Animated.View style={[phaseAnimatedStyle, styles.questionContainer]}>
            <Text style={styles.questionTitle}>What are you looking for?</Text>
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

      <View style={styles.divider} />

      <View style={styles.actionContainer}>
        <Animated.View
          style={[styles.primaryButtonWrapper, primaryButtonAnimStyle]}
        >
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleOpenAnyway}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Open {appLabel} anyway
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimStyles.breathe}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleAlternative("breathe")}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Take a short pause
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimStyles.exercise}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleAlternative("exercise")}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Quick movement break
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimStyles.close}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Close
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
