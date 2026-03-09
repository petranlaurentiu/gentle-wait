/**
 * Exercise screen - Physical movement breaks with category selection
 * Liquid Glass Design System
 */
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  useWindowDimensions,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { launchApp } from "@/src/services/native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { insertEvent } from "@/src/services/storage/sqlite";
import { useAppStore } from "@/src/services/storage";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { LumiIllustration } from "@/src/components/LumiIllustration";
import {
  DEFAULT_EYE_RESET_EXERCISE_PREFERENCE,
  DEFAULT_MOVE_EXERCISE_PREFERENCE,
  EXERCISE_ENTRY_METADATA,
  EXERCISE_CATEGORY_METADATA,
  getCategoryMeta,
  getExerciseById,
  getExercisesByCategory,
  getEyeResetExercisePool,
  getMoveExercisePool,
  getRandomExercise,
} from "@/src/data/exercises";
import { getLumiAssetForExercise } from "@/src/data/lumi";
import {
  Exercise,
  ExerciseCategory,
  ExerciseEntryPoint,
} from "@/src/domain/models";

const { width } = Dimensions.get("window");

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type ScreenPhase = "select" | "exercise" | "complete";

const CATEGORIES = EXERCISE_CATEGORY_METADATA;

export default function ExerciseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const settings = useAppStore((state) => state.settings);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sessionId = (params.sessionId as string) || "";
  const appPackage = (params.appPackage as string) || "";
  const appLabel = (params.appLabel as string) || "App";
  const entryParam = params.entry as ExerciseEntryPoint | undefined;
  const categoryParam = params.category as ExerciseCategory | undefined;

  // Get pause duration from settings
  const pauseDuration = settings.pauseDurationSec || 15;
  const movePreference =
    settings.moveExercisePreference || DEFAULT_MOVE_EXERCISE_PREFERENCE;
  const eyeResetPreference =
    settings.eyeResetExercisePreference ||
    DEFAULT_EYE_RESET_EXERCISE_PREFERENCE;

  const [phase, setPhase] = useState<ScreenPhase>("select");
  const [selectedCategory, setSelectedCategory] =
    useState<ExerciseCategory | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPaused] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const isCompactScreen = screenHeight < 860;
  const heroHeight = isCompactScreen ? 160 : 240;
  const activeHeroHeight = isCompactScreen ? 170 : 250;
  const completionHeroHeight = isCompactScreen ? 150 : 220;

  // Animation
  const progressWidth = useSharedValue(0);

  // Timer countdown
  useEffect(() => {
    if (phase !== "exercise" || !exercise || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("complete");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, exercise, isPaused]);

  // Adjust exercise duration to match user's pause duration setting
  const adjustExerciseForDuration = useCallback((ex: Exercise): Exercise => {
    if (ex.durationSec <= pauseDuration) {
      // Exercise fits within pause duration, use as-is
      return ex;
    }
    // Scale down exercise duration to fit within pause duration
    // Keep the same exercise but reduce duration proportionally
    return {
      ...ex,
      durationSec: pauseDuration,
    };
  }, [pauseDuration]);

  const startExercise = useCallback((nextExercise: Exercise) => {
    const adjustedExercise = adjustExerciseForDuration(nextExercise);
    setExercise(adjustedExercise);
    setSelectedCategory(adjustedExercise.category);
    setTimeLeft(adjustedExercise.durationSec);
    setStartTime(Date.now());
    setPhase("exercise");
  }, [adjustExerciseForDuration]);

  const pickRandomExerciseFromPool = useCallback((pool: Exercise[]) => {
    if (pool.length === 0) {
      return null;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const getInitialExercise = useCallback((): Exercise | null => {
    if (categoryParam) {
      return pickRandomExerciseFromPool(getExercisesByCategory(categoryParam));
    }

    if (entryParam === "eye-reset") {
      return pickRandomExerciseFromPool(
        getEyeResetExercisePool(eyeResetPreference),
      );
    }

    if (entryParam === "move") {
      return pickRandomExerciseFromPool(getMoveExercisePool(movePreference));
    }

    return null;
  }, [
    categoryParam,
    entryParam,
    eyeResetPreference,
    movePreference,
    pickRandomExerciseFromPool,
  ]);

  useEffect(() => {
    if (phase !== "select" || exercise) {
      return;
    }

    const nextExercise = getInitialExercise();
    if (nextExercise) {
      startExercise(nextExercise);
    }
  }, [exercise, getInitialExercise, phase, startExercise]);

  // Progress animation
  useEffect(() => {
    if (phase !== "exercise" || !exercise) return;

    const progress = 1 - timeLeft / exercise.durationSec;
    progressWidth.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [timeLeft, phase, exercise, progressWidth]);

  const handleSelectCategory = (category: ExerciseCategory) => {
    const exercises = getExercisesByCategory(category);
    const suitableExercises = exercises.filter(
      (ex) => ex.durationSec <= pauseDuration,
    );
    const exercisesToChooseFrom =
      suitableExercises.length > 0 ? suitableExercises : exercises;
    const randomExercise = pickRandomExerciseFromPool(exercisesToChooseFrom);
    if (randomExercise) {
      startExercise(randomExercise);
    }
  };

  const handleRandomExercise = () => {
    startExercise(getRandomExercise());
  };

  const handleGetNewExercise = () => {
    if (entryParam === "eye-reset") {
      const nextExercise = pickRandomExerciseFromPool(
        getEyeResetExercisePool(eyeResetPreference),
      );
      if (nextExercise) {
        startExercise(nextExercise);
      }
      return;
    }

    if (entryParam === "move") {
      const nextExercise = pickRandomExerciseFromPool(
        getMoveExercisePool(movePreference),
      );
      if (nextExercise) {
        startExercise(nextExercise);
      }
      return;
    }

    if (selectedCategory) {
      const exercises = getExercisesByCategory(selectedCategory);
      const suitableExercises = exercises.filter(
        (ex) => ex.durationSec <= pauseDuration,
      );
      const exercisesToChooseFrom =
        suitableExercises.length > 0 ? suitableExercises : exercises;
      const randomExercise = pickRandomExerciseFromPool(exercisesToChooseFrom);
      if (randomExercise) {
        startExercise(randomExercise);
      }
    } else if (entryParam === "eye-reset" && eyeResetPreference !== "random") {
      const preferredExercise = getExerciseById(eyeResetPreference);
      if (preferredExercise) {
        startExercise(preferredExercise);
      }
    }
  };

  const handleComplete = async () => {
    try {
      await insertEvent({
        id: generateId(),
        ts: Date.now(),
        appPackage,
        appLabel,
        action: "alternative_exercise",
        durationMs: Date.now() - startTime,
        sessionId,
      });
      
      // Navigate directly to home using replace to avoid navigation stack issues
      router.replace("/home");

      // Launch the app after a brief delay (pending interception already cleared)
      if (Platform.OS === "android" && appPackage) {
        setTimeout(async () => {
          try {
            const launched = await launchApp(appPackage);
            if (launched) {
              console.log("[Exercise] Launched app:", appPackage);
            } else {
              console.warn("[Exercise] Could not relaunch app:", appPackage);
            }
          } catch (error) {
            console.error("[Exercise] Failed to launch app:", error);
          }
        }, 800);
      }
    } catch (error) {
      console.error("[Exercise] Error completing exercise:", error);
      router.replace("/home");
    }
  };

  const handleSkip = async () => {
    try {
      // Pending interception already cleared by deep link handler
      router.back();
    } catch (error) {
      console.error("[Exercise] Error skipping exercise:", error);
      router.back();
    }
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const footerSpacing = footerHeight + spacing.md;
  const scrollContentStyle = [
    styles.scrollContent,
    { paddingBottom: footerSpacing },
  ];

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight !== footerHeight) {
      setFooterHeight(nextHeight);
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
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    categoriesGrid: {
      gap: spacing.md,
      marginBottom: isCompactScreen ? spacing.md : spacing.xl,
    },
    categoryCard: {
      padding: isCompactScreen ? spacing.md : spacing.lg,
      borderRadius: radius.glass,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    categoryIcon: {
      fontSize: 32,
    },
    categoryContent: {
      flex: 1,
    },
    categoryLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
      marginBottom: 2,
    },
    categoryDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    categoryArrow: {
      fontFamily: fonts.light,
      fontSize: typography.heading.fontSize,
      color: colors.textMuted,
    },
    // Exercise phase
    exerciseHeader: {
      alignItems: "center",
      marginBottom: isCompactScreen ? spacing.sm : spacing.lg,
    },
    exerciseCategory: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: isCompactScreen ? spacing.xs : spacing.sm,
    },
    exerciseName: {
      fontFamily: fonts.light,
      fontSize: isCompactScreen
        ? typography.sectionTitle.fontSize
        : typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    timerContainer: {
      alignItems: "center",
      marginBottom: isCompactScreen ? spacing.sm : spacing.lg,
    },
    timerCircle: {
      width: isCompactScreen ? width * 0.28 : width * 0.35,
      height: isCompactScreen ? width * 0.28 : width * 0.35,
      borderRadius: isCompactScreen ? width * 0.14 : width * 0.175,
      borderWidth: 3,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isCompactScreen ? spacing.sm : spacing.lg,
    },
    timerText: {
      fontFamily: fonts.thin,
      fontSize: isCompactScreen ? 38 : 48,
      color: colors.text,
    },
    timerUnit: {
      fontFamily: fonts.regular,
      fontSize: isCompactScreen
        ? typography.body.fontSize
        : typography.heading.fontSize,
      color: colors.textSecondary,
    },
    progressBar: {
      height: 4,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: isCompactScreen ? spacing.sm : spacing.lg,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    instructionsCard: {
      marginBottom: isCompactScreen ? spacing.sm : spacing.lg,
    },
    instructionsText: {
      fontFamily: fonts.regular,
      fontSize: isCompactScreen
        ? typography.caption.fontSize
        : typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: isCompactScreen ? 20 : 26,
      textAlign: "center",
    },
    detailsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: isCompactScreen ? spacing.md : spacing.lg,
      paddingTop: isCompactScreen ? spacing.md : spacing.lg,
      borderTopWidth: 1,
      borderTopColor: "rgba(255, 255, 255, 0.1)",
    },
    detailItem: {
      alignItems: "center",
    },
    detailLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    detailValue: {
      fontFamily: fonts.light,
      fontSize: typography.heading.fontSize,
      color: colors.text,
    },
    // Complete phase
    completeContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    completeEmoji: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    completeTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
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
    buttonContainer: {
      gap: spacing.sm,
      marginTop: isCompactScreen ? spacing.sm : "auto",
      paddingBottom: Math.max(insets.bottom, spacing.xs),
    },
  });

  // Category selection phase
  if (phase === "select") {
    const entryMeta = entryParam ? EXERCISE_ENTRY_METADATA[entryParam] : null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={scrollContentStyle}>
          <LumiIllustration
            source={getLumiAssetForExercise({ entry: entryParam })}
            maxHeight={heroHeight}
          />

          <View style={styles.header}>
            <Text style={styles.title}>
              {entryMeta ? entryMeta.label : "Choose Your Reset"}
            </Text>
            <Text style={styles.subtitle}>
              {entryMeta
                ? entryMeta.description
                : "Choose what feels right for your body right now"}
            </Text>
          </View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: category.color },
                ]}
                onPress={() => handleSelectCategory(category.id)}
                activeOpacity={0.7}
              >
                <Ionicons name={category.iconName} size={32} color={colors.primary} />
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Surprise Me"
            onPress={handleRandomExercise}
            variant="secondary"
            iconName="shuffle-outline"
          />
        </ScrollView>

        <View style={styles.buttonContainer} onLayout={handleFooterLayout}>
          <Button label="Back" onPress={handleSkip} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  // Exercise in progress
  if (phase === "exercise" && exercise) {
    const categoryLabel = getCategoryMeta(exercise.category)?.label || exercise.category;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={scrollContentStyle}>
          <LumiIllustration
            source={getLumiAssetForExercise({
              entry: entryParam,
              category: exercise.category,
            })}
            maxHeight={activeHeroHeight}
          />

          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseCategory}>{categoryLabel}</Text>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
          </View>

          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeLeft}</Text>
              <Text style={styles.timerUnit}>seconds</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, progressAnimatedStyle]}
            />
          </View>

          <GlassCard glowColor="primary" style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>{exercise.instructions}</Text>

            {exercise.reps && (
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {exercise.durationSec}s
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reps</Text>
                  <Text style={styles.detailValue}>{exercise.reps}</Text>
                </View>
              </View>
            )}
          </GlassCard>
        </ScrollView>

        <View style={styles.buttonContainer} onLayout={handleFooterLayout}>
          <Button
            label="Try Different Exercise"
            onPress={handleGetNewExercise}
            variant="secondary"
          />
          <Button label="Skip" onPress={handleSkip} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  // Complete phase
  const completedEyeReset =
    selectedCategory === "eye-posture" || entryParam === "eye-reset";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={scrollContentStyle}>
        <View style={styles.completeContainer}>
          <LumiIllustration
            source={getLumiAssetForExercise({
              entry: entryParam,
              category: selectedCategory,
              isComplete: true,
            })}
            maxHeight={completionHeroHeight}
            scale={1.3}
          />
          <Text style={styles.completeTitle}>
            {completedEyeReset ? "Eyes Reset!" : "Great Job!"}
          </Text>
          <Text style={styles.completeMessage}>
            {completedEyeReset
              ? "You gave your eyes and posture a real break instead of falling back into the scroll."
              : "You just moved your body instead of scrolling.\nThat&apos;s a powerful choice."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer} onLayout={handleFooterLayout}>
        <Button
          label={completedEyeReset ? "I Feel Refreshed!" : "I Feel Energized!"}
          onPress={handleComplete}
          variant="primary"
        />
        <Button
          label={completedEyeReset ? "Try Another Eye Reset" : "Do Another Exercise"}
          onPress={() => {
            if (entryParam === "eye-reset" || entryParam === "move") {
              handleGetNewExercise();
              return;
            }
            setPhase("select");
          }}
          variant="secondary"
        />
        <Button label="Back" onPress={handleSkip} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}
