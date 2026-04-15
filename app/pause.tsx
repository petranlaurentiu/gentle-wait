/**
 * Pause screen - Interception UI shown when user tries to open a protected app
 * Liquid Glass Design System
 */
import { Button } from "@/src/components/Button";
import { BackgroundWrapper } from "@/src/components/BackgroundWrapper";
import { LUMI_ASSETS } from "@/src/data/lumi";
import { insertEvent } from "@/src/services/storage/sqlite";
import { useTheme } from "@/src/theme/ThemeProvider";
import {
  animation,
  fonts,
  radius,
  spacing,
  typography,
} from "@/src/theme/theme";
import {
  triggerSelectionFeedback,
  triggerSuccessNotification,
} from "@/src/utils/haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.45;
const LUMI_BREATHE_SIZE = CIRCLE_SIZE * 0.7;

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
  const familyActivitySelectionId =
    (params.familyActivitySelectionId as string) || "";
  const fromShield = params.source === "shield";

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
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  };

  const handleAlternative = (
    type:
      | "breathe"
      | "reflect"
      | "grounding"
      | "prayer"
      | "move"
      | "eye-reset",
  ) => {
    if (type === "move" || type === "eye-reset") {
      router.push({
        pathname: "/exercise",
        params: {
          sessionId,
          appPackage,
          appLabel,
          entry: type,
          familyActivitySelectionId,
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
          familyActivitySelectionId,
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
      paddingTop: spacing.md,
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
    chipIcon: {
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
    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm + 2,
      width: "100%",
    },
    actionCard: {
      width: "30%",
      paddingVertical: spacing.md + 4,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.button,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      minHeight: 80,
    },
    actionCardLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center" as const,
      marginTop: 6,
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginVertical: spacing.sm,
    },
    shieldBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    shieldBannerText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
    },
    lumiBreathImage: {
      width: LUMI_BREATHE_SIZE,
      height: LUMI_BREATHE_SIZE,
    },
    lumiQuestionImage: {
      width: 100,
      height: 100,
      marginBottom: spacing.md,
    },
  });

  const reasonChoices: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
    { label: "To Relax", value: "relax", icon: "leaf-outline" },
    { label: "Connection", value: "connect", icon: "chatbubbles-outline" },
    { label: "Escape", value: "distraction", icon: "exit-outline" },
    { label: "Quick Info", value: "info", icon: "phone-portrait-outline" },
    { label: "Just Habit", value: "habit", icon: "refresh-outline" },
    { label: "Not Sure", value: "unsure", icon: "help-circle-outline" },
  ];

  const actionChoices: {
    label: string;
    value: "breathe" | "eye-reset" | "grounding" | "reflect" | "move" | "prayer";
    icon: string;
    iconSet?: "material";
  }[] = [
    { label: "Breathe", value: "breathe", icon: "flower-outline" },
    { label: "Eye Reset", value: "eye-reset", icon: "eye-outline" },
    { label: "Ground", value: "grounding", icon: "leaf-outline" },
    { label: "Journal", value: "reflect", icon: "journal-outline" },
    { label: "Move", value: "move", icon: "fitness-outline" },
    { label: "Pray", value: "prayer", icon: "hands-pray", iconSet: "material" },
  ];

  return (
    <BackgroundWrapper>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {fromShield && phase === "breathing" && (
            <View style={styles.shieldBanner}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
              <Text style={styles.shieldBannerText}>
                You chose calm over {appLabel}
              </Text>
            </View>
          )}

          <View style={styles.contentWrapper}>
            {phase === "breathing" && (
              <Animated.View
                style={[phaseAnimatedStyle, styles.breathingContainer]}
              >
                <Text style={styles.timerText}>{timer}</Text>

                <View style={styles.circleContainer}>
                  {/* Glow backdrop */}
                  <Animated.View style={[styles.glowOuter, glowAnimatedStyle]}>
                    <LinearGradient
                      colors={["rgba(0, 212, 255, 0.3)", "rgba(0, 212, 255, 0)"]}
                      style={{ width: "100%", height: "100%", borderRadius: (CIRCLE_SIZE + 60) / 2 }}
                    />
                  </Animated.View>

                  {/* Breathing circle with Lumi inside */}
                  <Animated.View style={[styles.glassCircle, circleAnimatedStyle]}>
                    <LinearGradient
                      colors={["rgba(0, 212, 255, 0.08)", "rgba(0, 212, 255, 0.02)"]}
                      style={styles.circleGradient}
                    >
                      <Image
                        source={LUMI_ASSETS.breathe}
                        style={styles.lumiBreathImage}
                        contentFit="contain"
                        contentPosition="center"
                        cachePolicy="memory-disk"
                      />
                    </LinearGradient>
                  </Animated.View>
                </View>

                <Text style={styles.breathText}>{breathText}</Text>

                <Text style={styles.breathMessage}>
                  You paused. That&apos;s already a win.
                </Text>
              </Animated.View>
            )}

            {phase === "question" && (
              <Animated.View
                style={[phaseAnimatedStyle, styles.questionContainer]}
              >
                {/* Small Lumi mascot above the question */}
                <Image
                  source={LUMI_ASSETS.mascot}
                  style={styles.lumiQuestionImage}
                  contentFit="contain"
                  contentPosition="center"
                  cachePolicy="memory-disk"
                />

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
                      <Ionicons
                        name={choice.icon}
                        size={24}
                        color={selectedReason === choice.value ? colors.primary : colors.textSecondary}
                      />
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
            <View style={styles.actionGrid}>
              {actionChoices.map((choice) => (
                <TouchableOpacity
                  key={choice.value}
                  style={styles.actionCard}
                  onPress={() => handleAlternative(choice.value)}
                  activeOpacity={0.7}
                >
                  {choice.iconSet === "material" ? (
                    <MaterialCommunityIcons
                      name={choice.icon as never}
                      size={26}
                      color={colors.textSecondary}
                    />
                  ) : (
                    <Ionicons
                      name={choice.icon as never}
                      size={26}
                      color={colors.textSecondary}
                    />
                  )}
                  <Text style={styles.actionCardLabel}>{choice.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.divider} />
            <Button
              label="I don't need this right now"
              onPress={handleClose}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}
