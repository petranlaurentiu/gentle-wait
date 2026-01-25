/**
 * Alternatives screen - Breathing, Journaling, and Grounding exercises
 * Liquid Glass Design System
 */
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
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
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { insertEvent } from "@/src/services/storage/sqlite";
import { useAppStore } from "@/src/services/storage";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import {
  getBreathingExerciseForDuration,
  getGroundingExerciseForDuration,
  getRandomJournalingPrompt,
} from "@/src/data/mindfulness";
import { getPrayerForDuration, Prayer } from "@/src/data/prayers";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.5;
const GLOW_SIZE = width * 0.4;

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type AlternativeType = "breathe" | "reflect" | "grounding" | "prayer";
type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";

export default function AlternativesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const settings = useAppStore((state) => state.settings);

  const type = (params.type as AlternativeType) || "breathe";
  const sessionId = (params.sessionId as string) || "";
  const appPackage = (params.appPackage as string) || "";
  const appLabel = (params.appLabel as string) || "App";

  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Breathing state - use pause duration from settings
  const pauseDuration = settings.pauseDurationSec || 15;
  const [breathingExercise] = useState(() =>
    getBreathingExerciseForDuration(pauseDuration)
  );
  const [currentCycle, setCurrentCycle] = useState(1);
  const currentCycleRef = useRef(1); // Ref for synchronous access
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("inhale");
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(breathingExercise.inhale);

  // Grounding state - use pause duration from settings
  const [groundingExercise] = useState(() =>
    getGroundingExerciseForDuration(pauseDuration)
  );
  const [groundingTimeLeft, setGroundingTimeLeft] = useState(
    groundingExercise.durationSec
  );
  const [groundingStep, setGroundingStep] = useState(0); // For 5-4-3-2-1

  // Journaling state
  const [journalPrompt] = useState(() => getRandomJournalingPrompt());
  const [journalEntry, setJournalEntry] = useState("");

  // Prayer state
  const [prayer] = useState<Prayer>(() => getPrayerForDuration(pauseDuration));
  const [prayerTimeLeft, setPrayerTimeLeft] = useState(pauseDuration);

  // Animations
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Breathing animation - only runs when phase changes
  useEffect(() => {
    if (type !== "breathe" || isComplete) return;

    // Animate circle based on phase
    if (breathPhase === "inhale") {
      breathScale.value = withTiming(1.3, {
        duration: breathingExercise.inhale * 1000,
        easing: Easing.inOut(Easing.ease),
      });
      glowOpacity.value = withTiming(0.6, {
        duration: breathingExercise.inhale * 1000,
      });
    } else if (breathPhase === "exhale") {
      breathScale.value = withTiming(1, {
        duration: breathingExercise.exhale * 1000,
        easing: Easing.inOut(Easing.ease),
      });
      glowOpacity.value = withTiming(0.3, {
        duration: breathingExercise.exhale * 1000,
      });
    }
  }, [
    type,
    breathPhase,
    breathingExercise,
    isComplete,
    breathScale,
    glowOpacity,
  ]);

  // Breathing timer - countdown logic
  useEffect(() => {
    if (type !== "breathe" || isComplete) return;

    const phaseDurations: Record<BreathPhase, number> = {
      inhale: breathingExercise.inhale,
      hold1: breathingExercise.hold1,
      exhale: breathingExercise.exhale,
      hold2: breathingExercise.hold2,
    };

    const nextPhaseMap: Record<BreathPhase, BreathPhase> = {
      inhale: "hold1",
      hold1: "exhale",
      exhale: "hold2",
      hold2: "inhale",
    };

    const getNextPhase = (current: BreathPhase): BreathPhase => {
      let next = nextPhaseMap[current];
      // Skip phases with 0 duration
      while (phaseDurations[next] === 0) {
        next = nextPhaseMap[next];
      }
      return next;
    };

    const timer = setInterval(() => {
      setPhaseTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Time's up for this phase, move to next
          const nextPhase = getNextPhase(breathPhase);

          // Check if we're starting a new cycle (going back to inhale)
          if (nextPhase === "inhale") {
            // Check completion using ref (synchronous)
            if (currentCycleRef.current >= breathingExercise.cycles) {
              // All cycles complete
              setIsComplete(true);
              clearInterval(timer);
              return 0;
            }
            // Increment cycle
            currentCycleRef.current += 1;
            setCurrentCycle(currentCycleRef.current);
          }

          setBreathPhase(nextPhase);
          return phaseDurations[nextPhase];
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, breathPhase, breathingExercise, isComplete]);

  // Grounding timer
  useEffect(() => {
    if (type !== "grounding" || isComplete) return;

    const timer = setInterval(() => {
      setGroundingTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, isComplete]);

  // Prayer timer
  useEffect(() => {
    if (type !== "prayer" || isComplete) return;

    const timer = setInterval(() => {
      setPrayerTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, isComplete]);

  // Prayer glow animation
  useEffect(() => {
    if (type !== "prayer" || isComplete) return;

    glowOpacity.value = withRepeat(
      Animated.sequence([
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ]),
      -1
    );

    breathScale.value = withRepeat(
      Animated.sequence([
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ]),
      -1
    );
  }, [type, isComplete, glowOpacity, breathScale]);

  // Animated styles
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleComplete = async () => {
    try {
      const actionMap: Record<AlternativeType, string> = {
        breathe: "alternative_breathe",
        reflect: "alternative_reflect",
        grounding: "alternative_grounding",
        prayer: "alternative_prayer",
      };

      await insertEvent({
        id: generateId(),
        ts: Date.now(),
        appPackage,
        appLabel,
        action: actionMap[type] as any,
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
            console.log("[Alternatives] Launched app:", appPackage);
          } catch (error) {
            console.error("[Alternatives] Failed to launch app:", error);
          }
        }, 800);
      }
    } catch (error) {
      console.error("[Alternatives] Error completing exercise:", error);
      router.replace("/home");
    }
  };

  const handleSkip = async () => {
    try {
      // Pending interception already cleared by deep link handler
      router.back();
    } catch (error) {
      console.error("[Alternatives] Error skipping exercise:", error);
      router.back();
    }
  };

  const getBreathPhaseLabel = (phase: BreathPhase): string => {
    const labels: Record<BreathPhase, string> = {
      inhale: "Breathe In",
      hold1: "Hold",
      exhale: "Breathe Out",
      hold2: "Hold",
    };
    return labels[phase];
  };

  // 5-4-3-2-1 grounding steps
  const groundingSteps = [
    { count: 5, sense: "SEE", prompt: "Name 5 things you can see around you" },
    { count: 4, sense: "TOUCH", prompt: "Name 4 things you can touch or feel" },
    { count: 3, sense: "HEAR", prompt: "Name 3 things you can hear" },
    { count: 2, sense: "SMELL", prompt: "Name 2 things you can smell" },
    { count: 1, sense: "TASTE", prompt: "Name 1 thing you can taste" },
  ];

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
    exerciseName: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    exerciseDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    circleContainer: {
      width: CIRCLE_SIZE + 60,
      height: CIRCLE_SIZE + 60,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: spacing.xl,
    },
    glowOuter: {
      position: "absolute",
      width: CIRCLE_SIZE + 60,
      height: CIRCLE_SIZE + 60,
      borderRadius: (CIRCLE_SIZE + 60) / 2,
    },
    breathingCircle: {
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
    phaseText: {
      fontFamily: fonts.medium,
      fontSize: typography.heading.fontSize,
      color: colors.text,
      letterSpacing: 2,
      textTransform: "uppercase",
      textAlign: "center",
    },
    timerText: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.text,
      marginTop: spacing.sm,
    },
    cycleInfo: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    // Grounding styles
    groundingContainer: {
      flex: 1,
      justifyContent: "center",
    },
    groundingTimer: {
      fontFamily: fonts.thin,
      fontSize: 64,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    groundingStepContainer: {
      marginBottom: spacing.xl,
    },
    groundingStepNumber: {
      fontFamily: fonts.thin,
      fontSize: 120,
      color: colors.primary,
      textAlign: "center",
      lineHeight: 130,
    },
    groundingSense: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.primary,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 3,
      marginBottom: spacing.sm,
    },
    groundingPrompt: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: 28,
    },
    groundingDots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    groundingDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    groundingDotActive: {
      backgroundColor: colors.primary,
    },
    groundingDotComplete: {
      backgroundColor: colors.secondary,
    },
    // Journaling styles
    journalContainer: {
      flex: 1,
    },
    journalPromptText: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xl,
      lineHeight: 36,
    },
    journalInput: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: radius.glass,
      padding: spacing.lg,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      minHeight: 200,
      textAlignVertical: "top",
      marginBottom: spacing.xl,
    },
    journalHint: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      fontStyle: "italic",
    },
    // Prayer styles
    prayerContainer: {
      flex: 1,
      justifyContent: "center",
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
    prayerGlowContainer: {
      width: GLOW_SIZE + 40,
      height: GLOW_SIZE + 40,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginVertical: spacing.xl,
    },
    prayerIcon: {
      fontSize: 64,
      textAlign: "center",
    },
    prayerTimer: {
      fontFamily: fonts.thin,
      fontSize: 48,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    prayerTextCard: {
      padding: spacing.lg,
    },
    prayerText: {
      fontFamily: fonts.regular,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: 28,
      marginBottom: spacing.md,
    },
    categoryText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    // Buttons
    buttonContainer: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    completeMessage: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    completeEmoji: {
      fontSize: 48,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
  });

  // Completed state (except for reflect and prayer which handle completion inline)
  if (isComplete && type !== "reflect" && type !== "prayer") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          <Text style={styles.completeEmoji}>✨</Text>
          <Text style={styles.exerciseName}>Well Done!</Text>
          <Text style={styles.completeMessage}>
            You just gave yourself a moment of calm.{"\n"}That&apos;s something
            to be proud of.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              label="I Feel Better"
              onPress={handleComplete}
              variant="primary"
            />
            <Button label="Back" onPress={handleSkip} variant="ghost" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* BREATHING EXERCISE */}
        {type === "breathe" && (
          <>
            <View style={styles.header}>
              <Text style={styles.exerciseName}>
                {breathingExercise.icon} {breathingExercise.name}
              </Text>
              <Text style={styles.exerciseDescription}>
                {breathingExercise.description}
              </Text>
            </View>

            <View style={styles.circleContainer}>
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

              <Animated.View
                style={[styles.breathingCircle, circleAnimatedStyle]}
              >
                <BlurView intensity={40} style={styles.circleBlur} tint="dark">
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
                    <Text style={styles.phaseText}>
                      {getBreathPhaseLabel(breathPhase)}
                    </Text>
                    <Text style={styles.timerText}>{phaseTimeLeft}</Text>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            </View>

            <Text style={styles.cycleInfo}>
              Cycle {currentCycle} of {breathingExercise.cycles}
            </Text>
          </>
        )}

        {/* GROUNDING EXERCISE - 5-4-3-2-1 */}
        {type === "grounding" && groundingExercise.id === "5-4-3-2-1" && (
          <View style={styles.groundingContainer}>
            <View style={styles.groundingStepContainer}>
              <Text style={styles.groundingStepNumber}>
                {groundingSteps[groundingStep].count}
              </Text>
              <Text style={styles.groundingSense}>
                {groundingSteps[groundingStep].sense}
              </Text>
              <Text style={styles.groundingPrompt}>
                {groundingSteps[groundingStep].prompt}
              </Text>
            </View>

            <View style={styles.groundingDots}>
              {groundingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.groundingDot,
                    index === groundingStep && styles.groundingDotActive,
                    index < groundingStep && styles.groundingDotComplete,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {groundingStep < groundingSteps.length - 1 ? (
                <Button
                  label="Next Sense →"
                  onPress={() => setGroundingStep((s) => s + 1)}
                  variant="primary"
                />
              ) : (
                <Button
                  label="Complete"
                  onPress={() => setIsComplete(true)}
                  variant="primary"
                />
              )}
              <Button label="Back" onPress={handleSkip} variant="ghost" />
            </View>
          </View>
        )}

        {/* OTHER GROUNDING EXERCISES */}
        {type === "grounding" && groundingExercise.id !== "5-4-3-2-1" && (
          <View style={styles.groundingContainer}>
            <Text style={styles.groundingTimer}>{groundingTimeLeft}</Text>

            <GlassCard glowColor="secondary">
              <Text style={styles.exerciseName}>
                {groundingExercise.icon} {groundingExercise.name}
              </Text>
              <Text
                style={[
                  styles.exerciseDescription,
                  { marginTop: spacing.md, lineHeight: 26 },
                ]}
              >
                {groundingExercise.instructions}
              </Text>
            </GlassCard>

            <View style={styles.buttonContainer}>
              <Button
                label={isComplete ? "Done" : "I'm Done Early"}
                onPress={() => setIsComplete(true)}
                variant="primary"
              />
              <Button label="Back" onPress={handleSkip} variant="ghost" />
            </View>
          </View>
        )}

        {/* JOURNALING */}
        {type === "reflect" && (
          <View style={styles.journalContainer}>
            <Text style={styles.journalPromptText}>
              &ldquo;{journalPrompt}&rdquo;
            </Text>

            <TextInput
              style={styles.journalInput}
              placeholder="Take a moment to reflect..."
              placeholderTextColor={colors.textMuted}
              value={journalEntry}
              onChangeText={setJournalEntry}
              multiline
              autoFocus
            />

            <Text style={styles.journalHint}>
              This is just for you. No one else will see it.
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                label="Save & Close"
                onPress={handleComplete}
                variant="primary"
                disabled={journalEntry.trim().length === 0}
              />
              <Button label="Skip" onPress={handleSkip} variant="ghost" />
            </View>
          </View>
        )}

        {/* PRAYER */}
        {type === "prayer" && (
          <View style={styles.prayerContainer}>
            <View style={styles.header}>
              <Text style={styles.prayerName}>
                {prayer.icon} {prayer.name}
              </Text>
              {prayer.attribution && (
                <Text style={styles.prayerAttribution}>
                  {prayer.attribution}
                </Text>
              )}
            </View>

            <View style={styles.prayerGlowContainer}>
              <Animated.View
                style={[styles.glowOuter, glowAnimatedStyle]}
              >
                <LinearGradient
                  colors={[
                    colors.primaryDim + "00",
                    colors.primaryDim + "40",
                    colors.primaryDim + "00",
                  ]}
                  style={styles.glowOuter}
                />
              </Animated.View>

              <Text style={styles.prayerIcon}>✝️</Text>
            </View>

            <Text style={styles.prayerTimer}>{prayerTimeLeft}s</Text>

            <GlassCard glowColor="secondary" style={styles.prayerTextCard}>
              <Text style={styles.prayerText}>{prayer.text}</Text>

              {prayer.category && (
                <Text style={styles.categoryText}>{prayer.category}</Text>
              )}
            </GlassCard>

            {!isComplete && (
              <View style={styles.buttonContainer}>
                <Button label="Skip" onPress={handleSkip} variant="ghost" />
              </View>
            )}

            {isComplete && (
              <View style={styles.buttonContainer}>
                <Button
                  label="Complete Prayer"
                  onPress={handleComplete}
                  variant="primary"
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Breathing skip button */}
      {type === "breathe" && !isComplete && (
        <View style={styles.buttonContainer}>
          <Button label="Skip" onPress={handleSkip} variant="ghost" />
        </View>
      )}
    </SafeAreaView>
  );
}
