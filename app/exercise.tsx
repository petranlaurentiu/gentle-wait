/**
 * Exercise screen - Physical movement breaks with category selection
 * Liquid Glass Design System
 */
import { BackgroundWrapper } from "@/src/components/BackgroundWrapper";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { LumiIllustration } from "@/src/components/LumiIllustration";
import {
  DEFAULT_EYE_RESET_EXERCISE_PREFERENCE,
  DEFAULT_MOVE_EXERCISE_PREFERENCE,
  EXERCISE_CATEGORY_METADATA,
  EXERCISE_ENTRY_METADATA,
  getCategoryMeta,
  getExerciseById,
  getExerciseImage,
  getExercisesByCategory,
  getExerciseVideo,
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
import {
  launchApp,
  markAppHandled,
  unlockPendingAppAndStartCooldown,
} from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import { insertEvent } from "@/src/services/storage/sqlite";
import { updateStreak } from "@/src/services/streaks";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";

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
  const isEyeResetFlow = entryParam === "eye-reset";
  const isCompactScreen = screenHeight < 860;
  const heroHeight = isCompactScreen ? 160 : 240;
  const activeHeroHeight = isEyeResetFlow
    ? isCompactScreen
      ? 108
      : 148
    : isCompactScreen
      ? 132
      : 188;
  const completionHeroHeight = isCompactScreen ? 150 : 220;

  // Video player for exercise demonstrations
  const videoSource = exercise ? getExerciseVideo(exercise.id) : undefined;
  console.log("[Exercise] Video debug:", {
    exerciseId: exercise?.id,
    videoSource,
    videoSourceType: typeof videoSource,
    hasExercise: !!exercise,
  });

  const videoPlayer = useVideoPlayer(videoSource ?? null, (player) => {
    console.log("[Exercise] VideoPlayer setup callback called");
    player.loop = true;
    player.muted = true;
    player.play();
  });

  console.log("[Exercise] VideoPlayer instance:", {
    hasPlayer: !!videoPlayer,
    playerStatus: videoPlayer?.status,
  });

  // When exercise changes, update the video source and replay
  useEffect(() => {
    console.log("[Exercise] Video useEffect triggered:", { videoSource, hasPlayer: !!videoPlayer });
    if (!videoSource || !videoPlayer) return;
    try {
      videoPlayer.replace(videoSource);
      videoPlayer.loop = true;
      videoPlayer.muted = true;
      videoPlayer.play();
      console.log("[Exercise] Video replaced and playing");
    } catch (e) {
      console.warn("[Exercise] Video replace failed:", e);
    }
  }, [videoSource]);

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
  const adjustExerciseForDuration = useCallback(
    (ex: Exercise): Exercise => {
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
    },
    [pauseDuration],
  );

  const startExercise = useCallback(
    (nextExercise: Exercise) => {
      const adjustedExercise = adjustExerciseForDuration(nextExercise);
      setExercise(adjustedExercise);
      setSelectedCategory(adjustedExercise.category);
      setTimeLeft(adjustedExercise.durationSec);
      setStartTime(Date.now());
      setPhase("exercise");
    },
    [adjustExerciseForDuration],
  );

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

  const navigateHome = async () => {
    if (Platform.OS === "ios") {
      await unlockPendingAppAndStartCooldown(
        settings.cooldownMinutes || 15,
      );
    }

    if (router.canDismiss()) {
      router.dismissAll();
    }

    setTimeout(() => {
      router.replace("/home");
    }, 0);
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

      // Update streak after recording alternative
      updateStreak(settings.premium).catch(console.error);

      await navigateHome();

      // Launch the app after a brief delay (pending interception already cleared)
      if (Platform.OS === "android" && appPackage) {
        setTimeout(async () => {
          try {
            await markAppHandled(appPackage);
            const launched = await launchApp(appPackage);
            if (!launched && __DEV__) {
              console.warn("[Exercise] Could not relaunch app:", appPackage);
            }
          } catch (error) {
            console.error("[Exercise] Failed to launch app:", error);
          }
        }, 800);
      }
    } catch (error) {
      console.error("[Exercise] Error completing exercise:", error);
      await navigateHome();
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

  const handleFooterLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight !== footerHeight) {
      setFooterHeight(nextHeight);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
    },
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    exerciseScrollContent: {
      flexGrow: 1,
      justifyContent: "flex-start",
      paddingTop: isCompactScreen ? spacing.sm : spacing.md,
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
    // Video exercise phase
    videoContainer: {
      width: "100%",
      borderRadius: radius.glass,
      overflow: "hidden",
      position: "relative" as const,
      marginBottom: isCompactScreen ? spacing.sm : spacing.md,
    },
    videoPlayer: {
      width: "100%",
      height: "100%",
    },
    videoFallback: {
      backgroundColor: "#f5f5f5",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    videoFallbackText: {
      fontSize: 48,
    },
    videoOverlayTop: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      paddingTop: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: "center" as const,
    },
    videoCategory: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: "#666",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.xs,
    },
    videoExerciseName: {
      fontFamily: fonts.semiBold,
      fontSize: isCompactScreen
        ? typography.sectionTitle.fontSize
        : typography.title.fontSize,
      color: "#1a1a1a",
      textAlign: "center",
    },
    videoOverlayBottom: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    videoInstructions: {
      fontFamily: fonts.regular,
      fontSize: isCompactScreen
        ? typography.caption.fontSize
        : typography.body.fontSize,
      color: "#333",
      lineHeight: isCompactScreen ? 18 : 22,
      textAlign: "center",
    },
    videoDetails: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: "#666",
      textAlign: "center",
      marginTop: spacing.xs,
    },
    timerContainer: {
      alignItems: "center",
      marginBottom: isEyeResetFlow
        ? spacing.xs
        : isCompactScreen
          ? spacing.xs
          : spacing.md,
    },
    timerCircle: {
      width: isEyeResetFlow
        ? isCompactScreen
          ? width * 0.22
          : width * 0.26
        : isCompactScreen
          ? width * 0.28
          : width * 0.35,
      height: isEyeResetFlow
        ? isCompactScreen
          ? width * 0.22
          : width * 0.26
        : isCompactScreen
          ? width * 0.28
          : width * 0.35,
      borderRadius: isEyeResetFlow
        ? isCompactScreen
          ? width * 0.11
          : width * 0.13
        : isCompactScreen
          ? width * 0.14
          : width * 0.175,
      borderWidth: 3,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isEyeResetFlow
        ? spacing.xs
        : isCompactScreen
          ? spacing.xs
          : spacing.md,
    },
    timerText: {
      fontFamily: fonts.thin,
      fontSize: isEyeResetFlow
        ? isCompactScreen
          ? 28
          : 34
        : isCompactScreen
          ? 38
          : 48,
      color: colors.text,
    },
    timerUnit: {
      fontFamily: fonts.regular,
      fontSize: isEyeResetFlow
        ? typography.caption.fontSize
        : isCompactScreen
          ? typography.body.fontSize
          : typography.heading.fontSize,
      color: colors.textSecondary,
    },
    progressBar: {
      height: 4,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: isCompactScreen ? spacing.xs : spacing.md,
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    instructionsCard: {
      marginBottom: isCompactScreen ? spacing.xs : spacing.md,
    },
    instructionsText: {
      fontFamily: fonts.regular,
      fontSize: isEyeResetFlow
        ? typography.body.fontSize
        : isCompactScreen
          ? typography.caption.fontSize
          : typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: isEyeResetFlow ? 22 : isCompactScreen ? 20 : 26,
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
      paddingBottom: 0,
    },
  });

  const footerSpacing =
    footerHeight + Math.max(insets.bottom, spacing.md) + spacing.md;
  const scrollContentStyle = [
    phase === "exercise" ? styles.exerciseScrollContent : styles.scrollContent,
    { paddingBottom: footerSpacing },
  ];

  // Category selection phase
  if (phase === "select") {
    const entryMeta = entryParam ? EXERCISE_ENTRY_METADATA[entryParam] : null;

    return (
      <BackgroundWrapper>
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={scrollContentStyle}
          >
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
                  <Ionicons
                    name={category.iconName}
                    size={32}
                    color={colors.primary}
                  />
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textMuted}
                  />
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
      </BackgroundWrapper>
    );
  }

  // Exercise in progress
  if (phase === "exercise" && exercise) {
    const categoryLabel =
      getCategoryMeta(exercise.category)?.label || exercise.category;
    const videoHeight = isCompactScreen ? screenHeight * 0.45 : screenHeight * 0.55;

    return (
      <BackgroundWrapper>
        <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={scrollContentStyle}
          >
            {/* Video with overlaid text */}
            <View style={[styles.videoContainer, { height: videoHeight }]}>
              {videoSource ? (
                <VideoView
                  player={videoPlayer}
                  style={styles.videoPlayer}
                  contentFit="cover"
                  nativeControls={false}
                />
              ) : (
                <View style={[styles.videoPlayer, styles.videoFallback]}>
                  <Text style={styles.videoFallbackText}>
                    {exercise.imagePlaceholder}
                  </Text>
                </View>
              )}

              {/* Exercise name overlay at top */}
              <View style={styles.videoOverlayTop}>
                <Text style={styles.videoCategory}>{categoryLabel}</Text>
                <Text style={styles.videoExerciseName}>{exercise.name}</Text>
              </View>

              {/* Instructions overlay at bottom */}
              <View style={styles.videoOverlayBottom}>
                <Text style={styles.videoInstructions}>
                  {exercise.instructions}
                </Text>
                {exercise.reps && (
                  <Text style={styles.videoDetails}>
                    {exercise.durationSec}s · {exercise.reps} reps
                  </Text>
                )}
              </View>
            </View>

            {/* Timer and progress below video */}
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
          </ScrollView>

          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || spacing.md }]} onLayout={handleFooterLayout}>
            <Button
              label="Try Different Exercise"
              onPress={handleGetNewExercise}
              variant="secondary"
            />
            <Button label="Skip" onPress={handleSkip} variant="ghost" />
          </View>
        </View>
      </BackgroundWrapper>
    );
  }

  // Complete phase
  const completedEyeReset =
    selectedCategory === "eye-posture" || entryParam === "eye-reset";

  return (
    <BackgroundWrapper>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={scrollContentStyle}
        >
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
              {completedEyeReset ? "Eyes Reset!" : "Well Done!"}
            </Text>
            <Text style={styles.completeMessage}>
              {completedEyeReset
                ? "You gave your eyes and posture a real break instead of falling back into the scroll."
                : "You just gave yourself a moment of calm.\nThat's something to be proud of."}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer} onLayout={handleFooterLayout}>
          <Button
            label={completedEyeReset ? "I Feel Refreshed!" : "I Feel Better"}
            onPress={handleComplete}
            variant="primary"
          />
          <Button
            label={
              completedEyeReset
                ? "Try Another Eye Reset"
                : "Do Another Exercise"
            }
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
    </BackgroundWrapper>
  );
}
