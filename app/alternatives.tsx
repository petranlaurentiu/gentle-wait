/**
 * Alternatives screen - Breathing, Journaling, and Grounding exercises
 * Liquid Glass Design System
 */
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { LumiIllustration } from "@/src/components/LumiIllustration";
import { getLumiAssetForAlternative } from "@/src/data/lumi";
import {
  getBreathingExerciseForDuration,
  getGroundingExerciseForDuration,
  getRandomJournalingPrompt,
} from "@/src/data/mindfulness";
import { getPrayerForDuration, Prayer } from "@/src/data/prayers";
import { launchApp } from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import {
  getRecentJournalEntries,
  insertEvent,
  insertJournalEntry,
  JournalEntry,
} from "@/src/services/storage/sqlite";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type AlternativeType = "breathe" | "reflect" | "grounding" | "prayer";
type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";

export default function AlternativesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const settings = useAppStore((state) => state.settings);
  const { height: screenHeight } = useWindowDimensions();

  const type = (params.type as AlternativeType) || "breathe";
  const sessionId = (params.sessionId as string) || "";
  const appPackage = (params.appPackage as string) || "";
  const appLabel = (params.appLabel as string) || "App";

  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const isCompactScreen = screenHeight < 860;
  const heroHeight = isCompactScreen ? 150 : 220;
  const breatheHeroHeight = isCompactScreen ? 165 : 250;
  const groundingHeroHeight = isCompactScreen ? 155 : 230;
  const prayerHeroHeight = isCompactScreen ? 165 : 240;

  // Breathing state - use pause duration from settings
  const pauseDuration = settings.pauseDurationSec || 15;
  const [breathingExercise] = useState(() =>
    getBreathingExerciseForDuration(pauseDuration),
  );
  const [currentCycle, setCurrentCycle] = useState(1);
  const currentCycleRef = useRef(1); // Ref for synchronous access
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("inhale");
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(breathingExercise.inhale);

  // Grounding state - use pause duration from settings
  const [groundingExercise] = useState(() =>
    getGroundingExerciseForDuration(pauseDuration),
  );
  const [groundingTimeLeft, setGroundingTimeLeft] = useState(
    groundingExercise.durationSec,
  );
  const [groundingStep, setGroundingStep] = useState(0); // For 5-4-3-2-1

  // Journaling state
  const [journalPrompt] = useState(() => getRandomJournalingPrompt());
  const [journalEntry, setJournalEntry] = useState("");
  const [previousEntries, setPreviousEntries] = useState<JournalEntry[]>([]);
  const [savedJournalEntry, setSavedJournalEntry] = useState<JournalEntry | null>(
    null,
  );
  const [journalSaveError, setJournalSaveError] = useState<string | null>(null);

  // Load previous journal entries
  useEffect(() => {
    if (type !== "reflect") return;
    getRecentJournalEntries(10)
      .then(setPreviousEntries)
      .catch((err) => console.error("[Alternatives] Failed to load journal entries:", err));
  }, [type]);

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
      withSequence(
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [type, isComplete, glowOpacity, breathScale]);

  // Animated styles
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
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

      // Save journal entry if this was a reflection exercise
      if (type === "reflect" && journalEntry.trim().length > 0) {
        const entry = {
          id: generateId(),
          ts: Date.now(),
          content: journalEntry.trim(),
          prompt: journalPrompt,
          appPackage,
          appLabel,
        };

        await insertJournalEntry(entry);
        setPreviousEntries((entries) => [entry, ...entries].slice(0, 10));
        setSavedJournalEntry(entry);
        setJournalSaveError(null);
        setJournalEntry("");
        return;
      }

      exitToHome();
    } catch (error) {
      console.error("[Alternatives] Error completing exercise:", error);
      if (type === "reflect") {
        setJournalSaveError("Your reflection could not be saved. Please try again.");
        return;
      }
      exitToHome();
    }
  };

  const exitToHome = () => {
    router.replace("/home");

    if (Platform.OS === "android" && appPackage) {
      setTimeout(async () => {
        try {
          const launched = await launchApp(appPackage);
          if (launched) {
            console.log("[Alternatives] Launched app:", appPackage);
          } else {
            console.warn("[Alternatives] Could not relaunch app:", appPackage);
          }
        } catch (error) {
          console.error("[Alternatives] Failed to launch app:", error);
        }
      }, 800);
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
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    exerciseName: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.sectionTitle.fontSize
        : typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: isCompactScreen ? spacing.xs : spacing.sm,
    },
    exerciseDescription: {
      fontFamily: fonts.regular,
      fontSize: isCompactScreen
        ? typography.caption.fontSize
        : typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: isCompactScreen ? 20 : typography.body.lineHeight,
    },
    breathStatusCard: {
      alignItems: "center",
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
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
      fontSize: isCompactScreen ? 42 : typography.display.fontSize,
      color: colors.text,
      marginTop: isCompactScreen ? spacing.xs : spacing.sm,
    },
    cycleInfo: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: isCompactScreen ? spacing.md : spacing.lg,
    },
    // Grounding styles
    groundingContainer: {
      flex: 1,
      justifyContent: "center",
    },
    groundingTimer: {
      fontFamily: fonts.thin,
      fontSize: isCompactScreen ? 48 : 64,
      color: colors.text,
      textAlign: "center",
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    groundingStepContainer: {
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    groundingStepNumber: {
      fontFamily: fonts.thin,
      fontSize: isCompactScreen ? 82 : 120,
      color: colors.primary,
      textAlign: "center",
      lineHeight: isCompactScreen ? 92 : 130,
    },
    groundingSense: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.primary,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 3,
      marginBottom: isCompactScreen ? spacing.xs : spacing.sm,
    },
    groundingPrompt: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.body.fontSize
        : typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: isCompactScreen ? 22 : 28,
    },
    groundingDots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
      marginTop: isCompactScreen ? spacing.md : spacing.xl,
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
    journalSavedCard: {
      marginTop: isCompactScreen ? spacing.md : spacing.lg,
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    journalSavedEyebrow: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.secondary,
      textTransform: "uppercase",
      letterSpacing: 1.6,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    journalSavedTitle: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.sectionTitle.fontSize
        : typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    journalSavedBody: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: isCompactScreen ? 22 : 24,
      marginBottom: spacing.lg,
    },
    journalSavedPreview: {
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderRadius: radius.glass,
      padding: isCompactScreen ? spacing.md : spacing.lg,
    },
    journalSavedPrompt: {
      fontFamily: fonts.light,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      fontStyle: "italic",
      marginBottom: spacing.sm,
    },
    journalSavedContent: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      lineHeight: isCompactScreen ? 22 : 24,
      textAlign: "center",
    },
    journalPromptText: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.sectionTitle.fontSize
        : typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
      lineHeight: isCompactScreen ? 30 : 36,
    },
    journalInput: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: radius.glass,
      padding: isCompactScreen ? spacing.md : spacing.lg,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      minHeight: isCompactScreen ? 150 : 200,
      textAlignVertical: "top",
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    journalHint: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      fontStyle: "italic",
    },
    journalMetaCard: {
      marginTop: isCompactScreen ? spacing.md : spacing.lg,
      padding: isCompactScreen ? spacing.md : spacing.lg,
    },
    previousEntriesTitle: {
      fontFamily: fonts.medium,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.xs,
      textAlign: "center",
    },
    previousEntryDate: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
    },
    journalError: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.accent,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    // Prayer styles
    prayerContainer: {
      flex: 1,
      justifyContent: "center",
    },
    prayerName: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.sectionTitle.fontSize
        : typography.title.fontSize,
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
    prayerTimer: {
      fontFamily: fonts.thin,
      fontSize: isCompactScreen ? 38 : 48,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: isCompactScreen ? spacing.md : spacing.lg,
    },
    prayerTextCard: {
      padding: isCompactScreen ? spacing.md : spacing.lg,
    },
    prayerText: {
      fontFamily: fonts.regular,
      fontSize: isCompactScreen
        ? typography.body.fontSize
        : typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: isCompactScreen ? 22 : 28,
      marginBottom: isCompactScreen ? spacing.sm : spacing.md,
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
      marginTop: isCompactScreen ? spacing.md : spacing.lg,
    },
    completeMessage: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.body.fontSize
        : typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
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
          <LumiIllustration
            source={getLumiAssetForAlternative(type, true)}
            maxHeight={heroHeight}
            scale={1.8}
          />
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
            <LumiIllustration
              source={getLumiAssetForAlternative("breathe")}
              maxHeight={breatheHeroHeight}
            />
            <View style={styles.header}>
              <Text style={styles.exerciseName}>{breathingExercise.name}</Text>
              <Text style={styles.exerciseDescription}>
                {breathingExercise.description}
              </Text>
            </View>

            <Animated.View style={circleAnimatedStyle}>
              <GlassCard glowColor="primary" style={styles.breathStatusCard}>
                <Text style={styles.phaseText}>
                  {getBreathPhaseLabel(breathPhase)}
                </Text>
                <Text style={styles.timerText}>{phaseTimeLeft}</Text>
              </GlassCard>
            </Animated.View>

            <Text style={styles.cycleInfo}>
              Cycle {currentCycle} of {breathingExercise.cycles}
            </Text>
          </>
        )}

        {/* GROUNDING EXERCISE - 5-4-3-2-1 */}
        {type === "grounding" && groundingExercise.id === "5-4-3-2-1" && (
          <View style={styles.groundingContainer}>
            <LumiIllustration
              source={getLumiAssetForAlternative("grounding")}
              maxHeight={groundingHeroHeight}
            />
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
            <LumiIllustration
              source={getLumiAssetForAlternative("grounding")}
              maxHeight={groundingHeroHeight}
            />
            <Text style={styles.groundingTimer}>{groundingTimeLeft}</Text>

            <GlassCard glowColor="secondary">
              <Text style={styles.exerciseName}>{groundingExercise.name}</Text>
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
            <LumiIllustration
              source={getLumiAssetForAlternative("reflect")}
              maxHeight={heroHeight}
            />
            {savedJournalEntry ? (
              <>
                <GlassCard glowColor="secondary" style={styles.journalSavedCard}>
                  <Text style={styles.journalSavedEyebrow}>Saved</Text>
                  <Text style={styles.journalSavedTitle}>
                    Your reflection is in your journal
                  </Text>
                  <Text style={styles.journalSavedBody}>
                    You can come back to it anytime without losing your place.
                  </Text>
                  <View style={styles.journalSavedPreview}>
                    <Text style={styles.journalSavedPrompt}>
                      &ldquo;{savedJournalEntry.prompt}&rdquo;
                    </Text>
                    <Text style={styles.journalSavedContent}>
                      {savedJournalEntry.content}
                    </Text>
                  </View>
                </GlassCard>

                <View style={styles.buttonContainer}>
                  <Button
                    label="View Journal"
                    onPress={() =>
                      router.push({
                        pathname: "/journal",
                        params: { highlightId: savedJournalEntry.id },
                      })
                    }
                    variant="primary"
                  />
                  <Button label="Back Home" onPress={exitToHome} variant="ghost" />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.journalPromptText}>
                  &ldquo;{journalPrompt}&rdquo;
                </Text>

                <TextInput
                  style={styles.journalInput}
                  placeholder="Take a moment to reflect..."
                  placeholderTextColor={colors.textMuted}
                  value={journalEntry}
                  onChangeText={(value) => {
                    setJournalEntry(value);
                    if (journalSaveError) setJournalSaveError(null);
                  }}
                  multiline
                  autoFocus
                />

                <Text style={styles.journalHint}>
                  This is just for you. No one else will see it.
                </Text>
                {journalSaveError && (
                  <Text style={styles.journalError}>{journalSaveError}</Text>
                )}

                <GlassCard style={styles.journalMetaCard}>
                  <Text style={styles.previousEntriesTitle}>Journal History</Text>
                  <Text style={styles.previousEntryDate}>
                    {previousEntries.length === 0
                      ? "Your first saved reflection will appear here."
                      : `${previousEntries.length} recent reflection${
                          previousEntries.length === 1 ? "" : "s"
                        } saved on this device.`}
                  </Text>
                </GlassCard>

                <View style={styles.buttonContainer}>
                  <Button
                    label="Save Reflection"
                    onPress={handleComplete}
                    variant="primary"
                    disabled={journalEntry.trim().length === 0}
                  />
                  {previousEntries.length > 0 && (
                    <Button
                      label="View Journal History"
                      onPress={() => router.push("/journal")}
                      variant="secondary"
                    />
                  )}
                  <Button label="Skip" onPress={handleSkip} variant="ghost" />
                </View>
              </>
            )}
          </View>
        )}

        {/* PRAYER */}
        {type === "prayer" && (
          <View style={styles.prayerContainer}>
            <LumiIllustration
              source={getLumiAssetForAlternative("prayer")}
              maxHeight={prayerHeroHeight}
            />
            <View style={styles.header}>
              <Text style={styles.prayerName}>{prayer.name}</Text>
              {prayer.attribution && (
                <Text style={styles.prayerAttribution}>
                  {prayer.attribution}
                </Text>
              )}
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
