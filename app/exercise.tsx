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
  NativeModules,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
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
  getRandomExercise,
  getExercisesByCategory,
} from "@/src/data/exercises";
import { Exercise, ExerciseCategory } from "@/src/domain/models";

const { width } = Dimensions.get("window");

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type ScreenPhase = "select" | "exercise" | "complete";

const CATEGORIES: {
  id: ExerciseCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
}[] = [
  {
    id: "desk-stretch",
    label: "Desk Stretches",
    icon: "🪑",
    description: "Quick stretches you can do sitting down",
    color: "rgba(0, 212, 255, 0.15)",
  },
  {
    id: "standing",
    label: "Standing",
    icon: "🧍",
    description: "Get up and move your body",
    color: "rgba(168, 85, 247, 0.15)",
  },
  {
    id: "energy",
    label: "Energy Boost",
    icon: "⚡",
    description: "Quick exercises to wake you up",
    color: "rgba(255, 107, 157, 0.15)",
  },
  {
    id: "eye-posture",
    label: "Eyes & Posture",
    icon: "👁️",
    description: "Reduce screen strain and fix posture",
    color: "rgba(16, 185, 129, 0.15)",
  },
];

export default function ExerciseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const settings = useAppStore((state) => state.settings);

  const sessionId = (params.sessionId as string) || "";
  const appPackage = (params.appPackage as string) || "";
  const appLabel = (params.appLabel as string) || "App";
  const categoryParam = params.category as ExerciseCategory | undefined;

  // Get pause duration from settings
  const pauseDuration = settings.pauseDurationSec || 15;

  const [phase, setPhase] = useState<ScreenPhase>("select");
  const [selectedCategory, setSelectedCategory] =
    useState<ExerciseCategory | null>(categoryParam || null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPaused] = useState(false);

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

  // Auto-select category and start exercise if category param is provided
  useEffect(() => {
    if (categoryParam && phase === "select" && !selectedCategory) {
      const category = categoryParam as ExerciseCategory;
      setSelectedCategory(category);
      const exercises = getExercisesByCategory(category);
      const suitableExercises = exercises.filter(
        (ex) => ex.durationSec <= pauseDuration
      );
      const exercisesToChooseFrom =
        suitableExercises.length > 0 ? suitableExercises : exercises;
      const randomExercise =
        exercisesToChooseFrom[
          Math.floor(Math.random() * exercisesToChooseFrom.length)
        ];
      const adjustedExercise = adjustExerciseForDuration(randomExercise);
      setExercise(adjustedExercise);
      setTimeLeft(adjustedExercise.durationSec);
      setStartTime(Date.now());
      setPhase("exercise");
    }
  }, [categoryParam, phase, selectedCategory, pauseDuration, adjustExerciseForDuration]);

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
    setSelectedCategory(category);
    const exercises = getExercisesByCategory(category);
    // Filter exercises that fit within pause duration, or use closest match
    const suitableExercises = exercises.filter(
      (ex) => ex.durationSec <= pauseDuration
    );
    const exercisesToChooseFrom =
      suitableExercises.length > 0 ? suitableExercises : exercises;
    const randomExercise =
      exercisesToChooseFrom[
        Math.floor(Math.random() * exercisesToChooseFrom.length)
      ];
    const adjustedExercise = adjustExerciseForDuration(randomExercise);
    setExercise(adjustedExercise);
    setTimeLeft(adjustedExercise.durationSec);
    setStartTime(Date.now());
    setPhase("exercise");
  };

  const handleRandomExercise = () => {
    const randomExercise = getRandomExercise();
    const adjustedExercise = adjustExerciseForDuration(randomExercise);
    setExercise(adjustedExercise);
    setSelectedCategory(adjustedExercise.category as ExerciseCategory);
    setTimeLeft(adjustedExercise.durationSec);
    setStartTime(Date.now());
    setPhase("exercise");
  };

  const handleGetNewExercise = () => {
    if (selectedCategory) {
      const exercises = getExercisesByCategory(selectedCategory);
      const suitableExercises = exercises.filter(
        (ex) => ex.durationSec <= pauseDuration
      );
      const exercisesToChooseFrom =
        suitableExercises.length > 0 ? suitableExercises : exercises;
      const randomExercise =
        exercisesToChooseFrom[
          Math.floor(Math.random() * exercisesToChooseFrom.length)
        ];
      const adjustedExercise = adjustExerciseForDuration(randomExercise);
      setExercise(adjustedExercise);
      setTimeLeft(adjustedExercise.durationSec);
      setStartTime(Date.now());
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
      if (Platform.OS === "android" && NativeModules.GentleWaitModule?.launchApp && appPackage) {
        setTimeout(async () => {
          try {
            await NativeModules.GentleWaitModule.launchApp(appPackage);
            console.log("[Exercise] Launched app:", appPackage);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
    },
    header: {
      marginBottom: spacing.xl,
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
      marginBottom: spacing.xl,
    },
    categoryCard: {
      padding: spacing.lg,
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
      marginBottom: spacing.xl,
    },
    exerciseCategory: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
    },
    exerciseName: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    timerContainer: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    timerCircle: {
      width: width * 0.5,
      height: width * 0.5,
      borderRadius: width * 0.25,
      borderWidth: 3,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    timerText: {
      fontFamily: fonts.thin,
      fontSize: 72,
      color: colors.text,
    },
    timerUnit: {
      fontFamily: fonts.regular,
      fontSize: typography.heading.fontSize,
      color: colors.textSecondary,
    },
    progressBar: {
      height: 4,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: spacing.xl,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    instructionsCard: {
      marginBottom: spacing.xl,
    },
    instructionsText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: 26,
      textAlign: "center",
    },
    detailsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
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
      marginTop: "auto",
    },
  });

  // Category selection phase
  if (phase === "select") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Movement Break</Text>
            <Text style={styles.subtitle}>
              Choose what feels right for your body right now
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
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </View>
                <Text style={styles.categoryArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="🎲  Surprise Me"
            onPress={handleRandomExercise}
            variant="secondary"
          />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button label="Back" onPress={handleSkip} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  // Exercise in progress
  if (phase === "exercise" && exercise) {
    const categoryLabel =
      CATEGORIES.find((c) => c.id === exercise.category)?.label ||
      exercise.category;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
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

        <View style={styles.buttonContainer}>
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
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.completeContainer}>
        <Text style={styles.completeEmoji}>💪</Text>
        <Text style={styles.completeTitle}>Great Job!</Text>
        <Text style={styles.completeMessage}>
          You just moved your body instead of scrolling.{"\n"}
          That&apos;s a powerful choice.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          label="I Feel Energized!"
          onPress={handleComplete}
          variant="primary"
        />
        <Button
          label="Do Another Exercise"
          onPress={() => setPhase("select")}
          variant="secondary"
        />
        <Button label="Back" onPress={handleSkip} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}
