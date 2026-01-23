/**
 * Home screen - Main dashboard
 * Liquid Glass Design System
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Animated from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { useAppStore } from "@/src/services/storage";
import { getTodayStats, getWeeklyStats } from "@/src/services/stats";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { DebugMenu } from "@/src/components/DebugMenu";
import { useFadeInAnimation, useStaggeredFadeIn } from "@/src/utils/animations";
import { getDailyQuote, getDailyAffirmation } from "@/src/data/mindfulness";

const logoImage = require("@/assets/logo.png");

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

  // Daily content
  const dailyQuote = getDailyQuote();
  const dailyAffirmation = getDailyAffirmation();

  // Animation hooks for staggered card entrance
  const headerAnimation = useFadeInAnimation();
  const cardOneAnimation = useStaggeredFadeIn(0, 6);
  const cardTwoAnimation = useStaggeredFadeIn(1, 6);
  const cardThreeAnimation = useStaggeredFadeIn(2, 6);
  const cardFourAnimation = useStaggeredFadeIn(3, 6);
  const buttonsAnimation = useStaggeredFadeIn(4, 6);
  const quoteAnimation = useStaggeredFadeIn(5, 6);

  // Load stats when screen is focused
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    headerLogo: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.15)",
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl * 2,
    },
    cardsContainer: {
      gap: spacing.md,
    },
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
    },
    cardValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.primary,
      letterSpacing: -3,
      marginBottom: spacing.xs,
    },
    cardSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    cardSubtitleAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    statsRow: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    statDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 6,
    },
    statDotSecondary: {
      backgroundColor: colors.secondary,
      shadowColor: colors.secondary,
    },
    statDotAccent: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
    },
    statText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    appsList: {
      marginTop: spacing.sm,
    },
    appItem: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      paddingVertical: spacing.xs + 2,
    },
    appItemMore: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
      paddingVertical: spacing.xs,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.md,
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    quickActionCard: {
      width: "47%",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: radius.glass,
      padding: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 100,
    },
    quickActionIcon: {
      fontSize: 32,
      marginBottom: spacing.sm,
    },
    quickActionLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.md,
    },
    assistantButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 212, 255, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(0, 212, 255, 0.3)",
      borderRadius: radius.glass,
      padding: spacing.md,
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    assistantIcon: {
      fontSize: 28,
    },
    assistantTextContainer: {
      flex: 1,
    },
    assistantTitle: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
      marginBottom: 2,
    },
    assistantSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    assistantArrow: {
      fontFamily: fonts.light,
      fontSize: typography.heading.fontSize,
      color: colors.primary,
    },
    affirmationText: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      fontStyle: "italic",
      textAlign: "center",
      lineHeight: 26,
    },
    quoteContainer: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.md,
    },
    quoteText: {
      fontFamily: fonts.light,
      fontSize: typography.body.fontSize,
      color: colors.textMuted,
      fontStyle: "italic",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: spacing.sm,
    },
    quoteAuthor: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
    },
    statValue: {
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimation]}>
        <Image source={logoImage} style={styles.headerLogo} />
        <Text style={styles.title}>GentleWait</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {/* Daily affirmation */}
          <Animated.View style={cardOneAnimation}>
            <GlassCard intensity="light">
              <Text style={styles.affirmationText}>"{dailyAffirmation}"</Text>
            </GlassCard>
          </Animated.View>

          {/* Today card */}
          <Animated.View style={cardTwoAnimation}>
            <GlassCard glowColor="primary">
              <Text style={styles.cardTitle}>Today's Mindful Moments</Text>
              <Text style={styles.cardValue}>{todayPauses}</Text>
              <Text style={styles.cardSubtitle}>
                {todayPauses === 0
                  ? "Your first pause is waiting"
                  : todayPauses === 1
                  ? "A beautiful start to your journey"
                  : `${todayPauses} times you chose presence`}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Weekly progress */}
          <Animated.View style={cardThreeAnimation}>
            <GlassCard glowColor="secondary">
              <Text style={styles.cardTitle}>Your Week in Review</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statDot} />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {weeklyStats.pausesTotal}
                    </Text>{" "}
                    mindful pauses
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, styles.statDotSecondary]} />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {weeklyStats.choseCalmCount}
                    </Text>{" "}
                    moments of calm
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, styles.statDotAccent]} />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {weeklyStats.mindfulMinutes}
                    </Text>{" "}
                    minutes reclaimed
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Protected apps */}
          {settings.selectedApps.length > 0 && (
            <Animated.View style={cardFourAnimation}>
              <GlassCard glowColor="accent">
                <Text style={styles.cardTitle}>Apps Under Your Care</Text>
                <Text style={styles.cardSubtitle}>
                  {settings.selectedApps.length} app
                  {settings.selectedApps.length !== 1 ? "s" : ""} with gentle
                  reminders
                </Text>
                <View style={styles.appsList}>
                  {settings.selectedApps.slice(0, 3).map((app) => (
                    <Text key={app.packageName} style={styles.appItem}>
                      {app.label}
                    </Text>
                  ))}
                  {settings.selectedApps.length > 3 && (
                    <Text style={styles.appItemMore}>
                      +{settings.selectedApps.length - 3} more
                    </Text>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Quick Actions */}
          <Animated.View style={buttonsAnimation}>
            <Text style={styles.sectionTitle}>Quick Mindful Break</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() =>
                  router.push({
                    pathname: "/alternatives",
                    params: { type: "breathe" },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>🧘</Text>
                <Text style={styles.quickActionLabel}>Breathe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push("/exercise")}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>💪</Text>
                <Text style={styles.quickActionLabel}>Move</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() =>
                  router.push({
                    pathname: "/exercise",
                    params: { category: "eye-posture" },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>👁️</Text>
                <Text style={styles.quickActionLabel}>Eye Strain</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() =>
                  router.push({
                    pathname: "/alternatives",
                    params: { type: "reflect" },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>📝</Text>
                <Text style={styles.quickActionLabel}>Journal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() =>
                  router.push({
                    pathname: "/alternatives",
                    params: { type: "grounding" },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>🌿</Text>
                <Text style={styles.quickActionLabel}>Ground</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* AI Assistant button */}
          <TouchableOpacity
            style={styles.assistantButton}
            onPress={() => router.push("/assistant")}
            activeOpacity={0.8}
          >
            <Text style={styles.assistantIcon}>✨</Text>
            <View style={styles.assistantTextContainer}>
              <Text style={styles.assistantTitle}>AI Companion</Text>
              <Text style={styles.assistantSubtitle}>
                Get personalized guidance & support
              </Text>
            </View>
            <Text style={styles.assistantArrow}>→</Text>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <Button
              label="Insights"
              onPress={() => router.push("/insights")}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              label="Settings"
              onPress={() => router.push("/settings")}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </View>

          {/* Daily wisdom */}
          <Animated.View style={quoteAnimation}>
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>"{dailyQuote.quote}"</Text>
              <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
      <DebugMenu />
    </SafeAreaView>
  );
}
