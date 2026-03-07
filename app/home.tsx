/**
 * Home screen - Main dashboard.
 */
import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import { DebugMenu } from "@/src/components/DebugMenu";
import { GlassCard } from "@/src/components/GlassCard";
import { Text as AppText } from "@/src/components/Typography";
import {
  FREE_PROTECTED_APPS_LIMIT,
  getUpgradePitch,
} from "@/src/constants/monetization";
import { getDailyAffirmation, getDailyQuote } from "@/src/data/mindfulness";
import { useAppStore } from "@/src/services/storage";
import { getTodayStats, getWeeklyStats } from "@/src/services/stats";
import { useTheme } from "@/src/theme/ThemeProvider";
import { radius, spacing } from "@/src/theme/theme";
import { useFadeInAnimation, useLoopAnimation, useStaggeredFadeIn } from "@/src/utils/animations";

const mainLogo = require("@/assets/images/main_logo.png");

const QUICK_ACTIONS = [
  { label: "Breathe", icon: "flower-outline", onPress: "/alternatives", params: { type: "breathe" } },
  { label: "Move", icon: "fitness-outline", onPress: "/exercise" },
  { label: "Eye Reset", icon: "eye-outline", onPress: "/exercise", params: { category: "eye-posture" } },
  { label: "Journal", icon: "journal-outline", onPress: "/alternatives", params: { type: "reflect" } },
  { label: "Ground", icon: "leaf-outline", onPress: "/alternatives", params: { type: "grounding" } },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const [todayPauses, setTodayPauses] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    pausesTotal: 0,
    choseCalmCount: 0,
    mindfulMinutes: 0,
  });

  const dailyQuote = getDailyQuote();
  const dailyAffirmation = getDailyAffirmation();

  const headerAnimation = useFadeInAnimation();
  const heroAnimation = useStaggeredFadeIn(0, 6);
  const todayCardAnimation = useStaggeredFadeIn(1, 6);
  const weeklyCardAnimation = useStaggeredFadeIn(2, 6);
  const appsCardAnimation = useStaggeredFadeIn(3, 6);
  const actionsAnimation = useStaggeredFadeIn(4, 6);
  const footerAnimation = useStaggeredFadeIn(5, 6);
  const logoFloat = useLoopAnimation(1, 1.015, 9000);
  const protectedAppsRemaining = Math.max(
    FREE_PROTECTED_APPS_LIMIT - settings.selectedApps.length,
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
              weekly.alternativeBreathed +
              weekly.alternativeReflected +
              weekly.alternativeGrounded +
              weekly.alternativePrayed,
            mindfulMinutes: weekly.totalMindfulMinutes,
          });
        } catch (error) {
          console.error("Failed to load stats:", error);
        }
      })();
    }, [])
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      padding: spacing.lg,
      justifyContent: "space-between",
      shadowColor: colors.glassShadowSoft,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 22,
    },
    iconBadge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    assistantButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
      borderRadius: radius.glass,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.glassFillStrong,
      gap: spacing.md,
    },
    assistantTextContainer: {
      flex: 1,
      gap: 4,
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
  });

  return (
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

        <Animated.View style={todayCardAnimation}>
          <GlassCard intensity="light">
            <AppText variant="eyebrow" color="secondary">Weekly overview</AppText>
            <View style={styles.statGrid}>
              <View style={styles.statRow}>
                <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                <AppText variant="bodyLarge">
                  <AppText variant="bodyLarge" color="primary">{weeklyStats.pausesTotal}</AppText> mindful pauses
                </AppText>
              </View>
              <View style={styles.statRow}>
                <View style={[styles.statDot, { backgroundColor: colors.secondary }]} />
                <AppText variant="bodyLarge">
                  <AppText variant="bodyLarge" color="primary">{weeklyStats.choseCalmCount}</AppText> moments of calm
                </AppText>
              </View>
              <View style={styles.statRow}>
                <View style={[styles.statDot, { backgroundColor: colors.accent }]} />
                <AppText variant="bodyLarge">
                  <AppText variant="bodyLarge" color="primary">{weeklyStats.mindfulMinutes}</AppText> minutes reclaimed
                </AppText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {settings.selectedApps.length > 0 && (
          <Animated.View style={weeklyCardAnimation}>
            <GlassCard glowColor="secondary">
              <AppText variant="eyebrow" color="secondary">Protected space</AppText>
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <AppText variant="sectionTitle">Apps under your care</AppText>
                <AppText variant="body" color="secondary">
                  {settings.selectedApps.length} app{settings.selectedApps.length !== 1 ? "s" : ""} now open with a reflective pause.
                </AppText>
              </View>
              <View style={styles.appsList}>
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
                  style={styles.quickActionCard}
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
                    <View style={styles.iconBadge}>
                      <Ionicons name={action.icon} size={22} color={colors.primary} />
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
                router.push("/assistant");
                return;
              }

              Alert.alert("AI Companion is Premium", getUpgradePitch(), [
                { text: "Not now", style: "cancel" },
                { text: "View Premium", onPress: () => router.push("/paywall") },
              ]);
            }}
            activeOpacity={0.86}
          >
            <View style={styles.iconBadge}>
              <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.assistantTextContainer}>
              <AppText variant="heading">
                {settings.premium ? "AI Companion" : "AI Companion Premium"}
              </AppText>
              <AppText variant="body" color="secondary">
                {settings.premium
                  ? "Personalized prompts, reflection, and support when your focus slips."
                  : "Upgrade to unlock guided reflection and personalized AI support."}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
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
      <DebugMenu />
    </SafeAreaView>
  );
}
