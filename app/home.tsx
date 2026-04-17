/**
 * Home screen - Main dashboard.
 */
import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import { BackgroundWrapper } from "@/src/components/BackgroundWrapper";
import { GlassCard } from "@/src/components/GlassCard";
import { Text as AppText } from "@/src/components/Typography";
import { hasIOSProtectedApps } from "@/src/constants/iosProtection";
import {
  FREE_PROTECTED_APPS_LIMIT,
  getUpgradePitch,
} from "@/src/constants/monetization";
import { getDailyAffirmation, getDailyQuote } from "@/src/data/mindfulness";
import { getAiConfigurationError } from "@/src/services/ai/openrouter";
import { generateDailyNudge } from "@/src/services/ai/nudges";
import { getIOSSelectionSummary } from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import { getTodayStats, getWeeklyStats } from "@/src/services/stats";
import { updateStreak } from "@/src/services/streaks";
import { useTheme } from "@/src/theme/ThemeProvider";
import { radius, spacing } from "@/src/theme/theme";
import { useFadeInAnimation, useLoopAnimation, useStaggeredFadeIn } from "@/src/utils/animations";

const mainLogo = require("@/assets/images/main_logo.png");
const lumiAiVideo = require("@/assets/lumi/video/lumi_ai.mp4");
const lumiAiImage = require("@/assets/lumi/lumi_ai.png");

const QUICK_ACTIONS = [
  {
    label: "Breathe",
    icon: "flower-outline",
    onPress: "/alternatives",
    params: { type: "breathe" },
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.52)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
  {
    label: "Pray",
    icon: "heart-outline",
    onPress: "/alternatives",
    params: { type: "prayer" },
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.5)",
    surface: "rgba(255, 122, 182, 0.1)",
  },
  {
    label: "Move",
    icon: "fitness-outline",
    onPress: "/exercise",
    params: { entry: "move" },
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.52)",
    surface: "rgba(82, 192, 255, 0.1)",
  },
  {
    label: "Eye Reset",
    icon: "eye-outline",
    onPress: "/exercise",
    params: { entry: "eye-reset" },
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.5)",
    surface: "rgba(244, 211, 94, 0.1)",
  },
  {
    label: "Journal",
    icon: "journal-outline",
    onPress: "/alternatives",
    params: { type: "reflect" },
    accent: "#A78BFA",
    glow: "rgba(167, 139, 250, 0.5)",
    surface: "rgba(167, 139, 250, 0.1)",
  },
  {
    label: "Ground",
    icon: "leaf-outline",
    onPress: "/alternatives",
    params: { type: "grounding" },
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.52)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
] as const;

const DASHBOARD_STAT_ACCENTS = [
  "#7EE6C6",
  "#52C0FF",
  "#F4D35E",
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const notificationsDenied = useAppStore((state) => state.notificationsDenied);
  const [todayPauses, setTodayPauses] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    pausesTotal: 0,
    choseCalmCount: 0,
    mindfulMinutes: 0,
  });
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const streakState = useAppStore((state) => state.streakState);
  const dailyNudge = useAppStore((state) => state.dailyNudge);
  const dismissNudge = useAppStore((state) => state.dismissNudge);
  const lumiLoopResetRef = useRef(false);

  const dailyQuote = getDailyQuote();
  const dailyAffirmation = getDailyAffirmation();

  const headerAnimation = useFadeInAnimation();
  const heroAnimation = useStaggeredFadeIn(0, 8);
  const streakCardAnimation = useStaggeredFadeIn(1, 8);
  const nudgeCardAnimation = useStaggeredFadeIn(2, 8);
  const todayCardAnimation = useStaggeredFadeIn(3, 8);
  const weeklyCardAnimation = useStaggeredFadeIn(4, 8);
  const appsCardAnimation = useStaggeredFadeIn(5, 8);
  const actionsAnimation = useStaggeredFadeIn(6, 8);
  const footerAnimation = useStaggeredFadeIn(7, 8);
  const logoFloat = useLoopAnimation(1, 1.015, 9000);
  const lumiPreviewPlayer = useVideoPlayer(lumiAiVideo, (player) => {
    player.loop = false;
    player.muted = true;
    player.timeUpdateEventInterval = 0.05;
    player.play();
  });
  const iosSelection = settings.iosFamilyActivitySelection;
  const protectedAppsCount =
    Platform.OS === "ios"
      ? iosSelection?.applicationCount ?? 0
      : settings.selectedApps.length;
  const hasProtectedApps =
    Platform.OS === "ios"
      ? hasIOSProtectedApps(iosSelection)
      : settings.selectedApps.length > 0;
  const protectedAppsRemaining = Math.max(
    FREE_PROTECTED_APPS_LIMIT - protectedAppsCount,
    0,
  );

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const today = await getTodayStats();
          setTodayPauses(today.pauses);

          const weekly = await getWeeklyStats();
          setWeeklyStats({
            pausesTotal: weekly.pausesTotal,
            choseCalmCount:
              weekly.closedCount +
              weekly.alternativeBreathed +
              weekly.alternativeReflected +
              weekly.alternativeGrounded +
              weekly.alternativeExercise +
              weekly.alternativePrayed,
            mindfulMinutes: weekly.totalMindfulMinutes,
          });

          // Update streak and check for new badges
          const streakResult = await updateStreak(settings.premium);
          if (streakResult.newBadges.length > 0) {
            setNewBadges(streakResult.newBadges);
          }

          // Generate daily nudge (no-op if already cached for today)
          if (settings.premium) {
            generateDailyNudge().catch(console.error);
          }
        } catch (error) {
          console.error("Failed to load stats:", error);
        }
      })();
    }, [settings.premium])
  );

  useEffect(() => {
    const subscription = lumiPreviewPlayer.addListener("timeUpdate", (event) => {
      if (event.currentTime < 0.25) {
        lumiLoopResetRef.current = false;
        return;
      }

      if (
        lumiPreviewPlayer.duration > 0 &&
        event.currentTime >= lumiPreviewPlayer.duration - 0.08 &&
        !lumiLoopResetRef.current
      ) {
        lumiLoopResetRef.current = true;
        lumiPreviewPlayer.currentTime = 0.02;
        lumiPreviewPlayer.play();
      }
    });

    return () => subscription.remove();
  }, [lumiPreviewPlayer]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    brandWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    logoFrame: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignItems: "center",
      justifyContent: "center",
    },
    headerMeta: {
      gap: 2,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl * 2,
      gap: spacing.md,
    },
    heroCard: {
      overflow: "hidden",
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.lg,
    },
    heroBadge: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pills,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignSelf: "flex-start",
    },
    heroStatWrap: {
      gap: spacing.xs,
      alignItems: "flex-end",
    },
    heroTitle: {
      maxWidth: "76%",
    },
    mutedCard: {
      backgroundColor: colors.glassFill,
    },
    statGrid: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    statDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      shadowOpacity: 0.42,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
    appsList: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    appChip: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    appChipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: spacing.md,
    },
    quickActionCard: {
      width: "48.2%",
      minHeight: 112,
      borderRadius: radius.glass,
      borderWidth: 1,
      padding: spacing.lg,
      justifyContent: "space-between",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    iconBadge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    assistantButton: {
      position: "relative",
      overflow: "hidden",
      borderRadius: radius.glass,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.glassFillStrong,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      minHeight: 320,
    },
    assistantBackgroundImage: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.3,
    },
    assistantBackgroundVideo: {
      ...StyleSheet.absoluteFillObject,
    },
    assistantTextContainer: {
      flex: 1,
      gap: spacing.sm,
    },
    assistantGlow: {
      ...StyleSheet.absoluteFillObject,
      opacity: 1,
    },
    assistantInner: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: "space-between",
      gap: spacing.lg,
    },
    assistantHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    assistantEyebrowChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pills,
      backgroundColor: "rgba(15, 23, 36, 0.66)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      marginBottom: spacing.xs,
    },
    assistantFooterRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "flex-start",
    },
    assistantCTA: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      alignSelf: "flex-start",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pills,
      backgroundColor: "rgba(15, 23, 36, 0.74)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    quoteContainer: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    notifBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.glass,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.glassFill,
    },
    notifBannerText: {
      flex: 1,
    },
    streakCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    streakLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    freezeBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pills,
      backgroundColor: colors.primaryLight,
    },
    nudgeCard: {
      gap: spacing.sm,
    },
    nudgeHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    nudgeHeaderLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
    },
    nudgeDismiss: {
      padding: spacing.xs,
    },
    nudgeLockedCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
    },
  });

  return (
    <BackgroundWrapper>
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, headerAnimation]}>
        <View style={styles.brandWrap}>
          <Animated.View style={[styles.logoFrame, logoFloat]}>
            <Image source={mainLogo} style={{ width: 28, height: 28 }} resizeMode="contain" />
          </Animated.View>
          <View style={styles.headerMeta}>
            <AppText variant="eyebrow" color="secondary">Daily reset</AppText>
            <AppText variant="screenTitle">GentleWait</AppText>
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/settings")}>
          <Ionicons name="options-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
        {Platform.OS === "ios" && notificationsDenied && hasProtectedApps && (
          <TouchableOpacity
            style={styles.notifBanner}
            activeOpacity={0.8}
            onPress={() => Linking.openSettings()}
          >
            <Ionicons name="notifications-off-outline" size={22} color={colors.accent} />
            <View style={styles.notifBannerText}>
              <AppText variant="caption" color="accent">
                Notifications are needed to guide you when you pause an app. Tap to enable.
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>
        )}

        <Animated.View style={heroAnimation}>
          <GlassCard glowColor="primary" style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTitle}>
                <View style={styles.heroBadge}>
                  <AppText variant="eyebrow" color="primary">Today&apos;s tone</AppText>
                </View>
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  <AppText variant="hero">A calmer rhythm before every tap.</AppText>
                  <AppText variant="bodyLarge" color="secondary">
                    {dailyAffirmation}
                  </AppText>
                </View>
              </View>
              <View style={styles.heroStatWrap}>
                <AppText variant="eyebrow" color="tertiary">Pauses</AppText>
                <AppText variant="display" color="primary">{todayPauses}</AppText>
              </View>
            </View>
            <AppText variant="caption" color="secondary">
              {todayPauses === 0
                ? "Your first mindful pause is waiting."
                : todayPauses === 1
                  ? "A gentle start. Keep the pace light."
                  : `${todayPauses} mindful moments already shifted the tone of your day.`}
            </AppText>
          </GlassCard>
        </Animated.View>

        {/* Streak card */}
        <Animated.View style={streakCardAnimation}>
          <TouchableOpacity activeOpacity={0.82} onPress={() => router.push("/badges")}>
            <GlassCard intensity="light">
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <Ionicons name="flame" size={22} color={colors.primary} />
                  <AppText variant="bodyLarge">
                    <AppText variant="bodyLarge" color="primary">{streakState.currentStreak}</AppText> day streak
                  </AppText>
                  {streakState.longestStreak > streakState.currentStreak && (
                    <AppText variant="caption" color="tertiary">
                      Best: {streakState.longestStreak}
                    </AppText>
                  )}
                </View>
                <View style={styles.streakLeft}>
                  <AppText variant="caption" color="secondary">Badges</AppText>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>

        {/* Daily nudge card */}
        <Animated.View style={nudgeCardAnimation}>
          {settings.premium ? (
            dailyNudge && !dailyNudge.dismissed ? (
              <GlassCard intensity="light">
                <View style={styles.nudgeCard}>
                  <View style={styles.nudgeHeader}>
                    <View style={styles.nudgeHeaderLeft}>
                      <Ionicons name="sparkles" size={16} color={colors.primary} />
                      <AppText variant="eyebrow" color="primary">Daily insight</AppText>
                    </View>
                    <TouchableOpacity
                      style={styles.nudgeDismiss}
                      onPress={dismissNudge}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <AppText variant="body" color="secondary">
                    {dailyNudge.text}
                  </AppText>
                </View>
              </GlassCard>
            ) : null
          ) : (
            <TouchableOpacity activeOpacity={0.82} onPress={() => router.push("/paywall")}>
              <GlassCard intensity="light">
                <View style={styles.nudgeLockedCard}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.textMuted} />
                  <AppText variant="body" color="tertiary">
                    Unlock daily AI insights with Pro
                  </AppText>
                  <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View style={todayCardAnimation}>
          <GlassCard intensity="light">
            <AppText variant="eyebrow" color="secondary">Weekly overview</AppText>
            <View style={styles.statGrid}>
              <View style={styles.statRow}>
                <View
                  style={[
                    styles.statDot,
                    {
                      backgroundColor: DASHBOARD_STAT_ACCENTS[0],
                      shadowColor: DASHBOARD_STAT_ACCENTS[0],
                    },
                  ]}
                />
                <AppText variant="bodyLarge">
                  <AppText variant="bodyLarge" color="primary">{weeklyStats.pausesTotal}</AppText> mindful pauses
                </AppText>
              </View>
              <View style={styles.statRow}>
                <View
                  style={[
                    styles.statDot,
                    {
                      backgroundColor: DASHBOARD_STAT_ACCENTS[1],
                      shadowColor: DASHBOARD_STAT_ACCENTS[1],
                    },
                  ]}
                />
                <AppText variant="bodyLarge">
                  <AppText variant="bodyLarge" color="primary">{weeklyStats.choseCalmCount}</AppText> moments of calm
                </AppText>
              </View>
              <View style={styles.statRow}>
                <View
                  style={[
                    styles.statDot,
                    {
                      backgroundColor: DASHBOARD_STAT_ACCENTS[2],
                      shadowColor: DASHBOARD_STAT_ACCENTS[2],
                    },
                  ]}
                />
                <AppText variant="bodyLarge">
                  <AppText variant="bodyLarge" color="primary">{weeklyStats.mindfulMinutes}</AppText> minutes reclaimed
                </AppText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {hasProtectedApps && (
          <Animated.View style={weeklyCardAnimation}>
            <GlassCard glowColor="secondary">
              <AppText variant="eyebrow" color="secondary">Protected space</AppText>
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <AppText variant="sectionTitle">Apps under your care</AppText>
                <AppText variant="body" color="secondary">
                  {protectedAppsCount} app{protectedAppsCount !== 1 ? "s" : ""} now open with a reflective pause.
                </AppText>
              </View>
              <View style={styles.appsList}>
                {Platform.OS === "ios" && iosSelection ? (
                  iosSelection.selectedApplicationLabels &&
                  iosSelection.selectedApplicationLabels.length > 0 ? (
                    <View style={styles.appChipsWrap}>
                      {iosSelection.selectedApplicationLabels.slice(0, 4).map((label) => (
                        <View key={label} style={styles.appChip}>
                          <AppText variant="body" color="secondary">{label}</AppText>
                        </View>
                      ))}
                      {iosSelection.selectedApplicationLabels.length > 4 && (
                        <View style={styles.appChip}>
                          <AppText variant="body" color="primary">
                            +{iosSelection.selectedApplicationLabels.length - 4} more
                          </AppText>
                        </View>
                      )}
                    </View>
                  ) : (
                    <AppText variant="body" color="secondary">
                      {getIOSSelectionSummary(iosSelection)} selected for mindful pauses on iPhone.
                    </AppText>
                  )
                ) : (
                  <View style={styles.appChipsWrap}>
                    {settings.selectedApps.slice(0, 4).map((app) => (
                      <View key={app.packageName} style={styles.appChip}>
                        <AppText variant="body" color="secondary">{app.label}</AppText>
                      </View>
                    ))}
                    {settings.selectedApps.length > 4 && (
                      <View style={styles.appChip}>
                        <AppText variant="body" color="primary">+{settings.selectedApps.length - 4} more</AppText>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <Animated.View style={appsCardAnimation}>
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: 4 }}>
              <AppText variant="eyebrow" color="secondary">Quick reset</AppText>
              <AppText variant="sectionTitle">Choose a short mindful break</AppText>
            </View>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.quickActionCard,
                    {
                      backgroundColor: action.surface,
                      borderColor: action.glow,
                      shadowColor: action.accent,
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={() => {
                    if (action.params) {
                      router.push({ pathname: action.onPress as never, params: action.params as never });
                    } else {
                      router.push(action.onPress as never);
                    }
                  }}
                >
                  <View>
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: action.surface,
                          borderColor: action.glow,
                        },
                      ]}
                    >
                      <Ionicons name={action.icon} size={22} color={action.accent} />
                    </View>
                    <AppText variant="heading">{action.label}</AppText>
                  </View>
                  <AppText variant="caption" color="secondary">Take one deliberate minute.</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={actionsAnimation}>
          <TouchableOpacity
            style={styles.assistantButton}
            onPress={() => {
              if (settings.premium) {
                const aiConfigurationError = getAiConfigurationError();
                if (aiConfigurationError) {
                  Alert.alert("Lumi unavailable", aiConfigurationError);
                  return;
                }
                router.push("/assistant");
                return;
              }

              Alert.alert("Protect more than one app", getUpgradePitch(), [
                { text: "Not now", style: "cancel" },
                { text: "See Pro", onPress: () => router.push("/paywall") },
              ]);
            }}
            activeOpacity={0.86}
          >
            <Image
              source={lumiAiImage}
              style={styles.assistantBackgroundImage}
              resizeMode="cover"
            />
            <VideoView
              player={lumiPreviewPlayer}
              style={styles.assistantBackgroundVideo}
              contentFit="cover"
              nativeControls={false}
              allowsPictureInPicture={false}
            />
            <LinearGradient
              colors={[
                "rgba(7, 12, 22, 0.58)",
                "rgba(10, 18, 28, 0.34)",
                "rgba(15, 23, 36, 0.82)",
              ]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.assistantGlow}
            />

            <View style={styles.assistantInner}>
              <View style={styles.assistantHeaderRow}>
                <View style={styles.assistantTextContainer}>
                  <View style={styles.assistantEyebrowChip}>
                    {!settings.premium && (
                      <Ionicons name="sparkles" size={12} color="#FFD7B8" />
                    )}
                    <AppText variant="eyebrow" style={{ color: "#FFD7B8" }}>
                      {settings.premium ? "AI companion" : "Most loved premium"}
                    </AppText>
                  </View>
                  <AppText variant="sectionTitle" style={{ color: "#F8FBFF" }}>
                    {settings.premium ? "Talk to Lumi" : "Lumi Companion"}
                  </AppText>
                  <AppText variant="body" style={{ color: "rgba(245, 247, 251, 0.92)" }}>
                    {settings.premium
                      ? "Gentle reflection, clarity, and support when your focus drifts."
                      : "Meet Lumi, your warm AI companion for reflection and support."}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={22} color="rgba(248, 251, 255, 0.86)" />
              </View>

              <View style={styles.assistantFooterRow}>
                <View style={styles.assistantCTA}>
                  <Ionicons
                    name={settings.premium ? "sparkles" : "lock-closed-outline"}
                    size={16}
                    color="#FFD7B8"
                  />
                  <AppText variant="label" style={{ color: "#F8FBFF" }}>
                    {settings.premium ? "Open conversation" : "Unlock with Premium"}
                  </AppText>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {!settings.premium && (
            <AppText variant="caption" color="secondary" align="center">
              Free plan: {protectedAppsRemaining} of {FREE_PROTECTED_APPS_LIMIT} protected app slots remaining.
            </AppText>
          )}

          <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
            <Button label="Insights" onPress={() => router.push("/insights")} variant="secondary" style={{ flex: 1 }} />
            <Button label="Settings" onPress={() => router.push("/settings")} variant="secondary" style={{ flex: 1 }} />
          </View>
        </Animated.View>

        <Animated.View style={footerAnimation}>
          <View style={styles.quoteContainer}>
            <AppText variant="caption" color="tertiary" align="center">
              “{dailyQuote.quote}”
            </AppText>
            <AppText variant="caption" color="secondary" align="center">
              {dailyQuote.author}
            </AppText>
          </View>
        </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}
