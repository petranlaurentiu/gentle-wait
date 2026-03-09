/**
 * Insights screen - weekly reflection and progress
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { GlassCard } from "@/src/components/GlassCard";
import { LoadingState } from "@/src/components/LoadingState";
import { PRICING } from "@/src/constants/monetization";
import { useAppStore } from "@/src/services/storage";
import { getTopApps, getTopTriggers } from "@/src/services/storage/sqlite";
import {
  getCurrentWeekRange,
  getPreviousWeekRange,
  getSevenDayTrend,
  getWeeklyStats,
} from "@/src/services/stats";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";

function formatDelta(value: number) {
  if (value === 0) {
    return "Same as last week";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value} vs last week`;
}

function getDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en", {
    weekday: "narrow",
  });
}

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    pausesTotal: 0,
    openedAnyway: 0,
    closedCount: 0,
    choseCalmCount: 0,
    mindfulMinutes: 0,
  });
  const [previousWeekPauses, setPreviousWeekPauses] = useState(0);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [topTriggers, setTopTriggers] = useState<{ reason: string; count: number }[]>([]);
  const [topApps, setTopApps] = useState<{ appLabel: string; count: number }[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      (async () => {
        try {
          const currentRange = getCurrentWeekRange();
          const previousRange = getPreviousWeekRange();

          const [weekly, previousWeekly, trend, triggers, apps] = await Promise.all([
            getWeeklyStats(currentRange),
            getWeeklyStats(previousRange),
            getSevenDayTrend(currentRange),
            getTopTriggers(currentRange.start, currentRange.end, 4),
            getTopApps(currentRange.start, currentRange.end, 4),
          ]);

          setWeeklyStats({
            pausesTotal: weekly.pausesTotal,
            openedAnyway: weekly.openedAnyway,
            closedCount: weekly.closedCount,
            choseCalmCount:
              weekly.closedCount +
              weekly.alternativeBreathed +
              weekly.alternativeReflected +
              weekly.alternativeGrounded +
              weekly.alternativeExercise +
              weekly.alternativePrayed,
            mindfulMinutes: weekly.totalMindfulMinutes,
          });
          setPreviousWeekPauses(previousWeekly.pausesTotal);
          setTrendData(trend);
          setTopTriggers(triggers);
          setTopApps(apps);
        } catch (error) {
          console.error("Failed to load insights:", error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, [])
  );

  const reasonLabels: Record<string, string> = {
    relax: "Relaxation",
    connect: "Connection",
    distraction: "Distraction",
    info: "Information",
    habit: "Habit",
    unsure: "Not sure",
  };

  const calmRate = useMemo(() => {
    if (weeklyStats.pausesTotal === 0) {
      return 0;
    }
    return Math.round((weeklyStats.choseCalmCount / weeklyStats.pausesTotal) * 100);
  }, [weeklyStats]);

  const totalTrendCount = trendData.reduce((sum, item) => sum + item.count, 0);
  const maxTrendValue = Math.max(...trendData.map((item) => item.count), 1);
  const weekDelta = weeklyStats.pausesTotal - previousWeekPauses;
  const primaryTrigger = topTriggers[0] ? reasonLabels[topTriggers[0].reason] || topTriggers[0].reason : null;
  const primaryApp = topApps[0]?.appLabel || null;

  const heroTitle =
    weeklyStats.pausesTotal === 0
      ? "Your patterns will appear here"
      : calmRate >= 70
        ? "You are interrupting the scroll more intentionally"
        : "Your pauses are happening, but the pattern is still fragile";

  const heroBody = settings.premium
    ? primaryTrigger && primaryApp
      ? `This week, ${primaryApp} and ${primaryTrigger.toLowerCase()} showed up the most. GentleWait is helping you catch that loop earlier.`
      : "This week shows where your attention gets pulled and where you already choose calm instead."
    : "You can already see your weekly rhythm here. Premium adds deeper patterns, app breakdowns, and stronger progress context.";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitleWrap: {
      gap: 4,
    },
    eyebrow: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.1,
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      letterSpacing: 0.4,
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl * 2,
      gap: spacing.md,
    },
    heroCard: {
      gap: spacing.lg,
    },
    heroBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pills,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    heroTitleText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.sectionTitle.fontSize,
      lineHeight: typography.sectionTitle.lineHeight,
      color: colors.text,
    },
    heroBodyText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    scoreRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    scoreCard: {
      flex: 1,
      gap: spacing.xs,
    },
    scoreValue: {
      fontFamily: fonts.thin,
      fontSize: typography.hero.fontSize,
      color: colors.primary,
      letterSpacing: -2,
    },
    scoreLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    scoreHint: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: spacing.xs,
    },
    miniGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    miniCard: {
      width: "47%",
      gap: spacing.xs,
    },
    miniValue: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
    },
    miniLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    miniHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    trendWrap: {
      gap: spacing.md,
    },
    trendSummary: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    trendValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.secondary,
      letterSpacing: -2,
    },
    trendDelta: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: weekDelta >= 0 ? colors.secondary : colors.textMuted,
    },
    trendBars: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      height: 120,
    },
    trendBarItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    trendBarTrack: {
      width: "100%",
      height: 84,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    trendBar: {
      width: "100%",
      borderRadius: 999,
      backgroundColor: colors.secondary,
      minHeight: 8,
    },
    trendDay: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.textMuted,
    },
    splitGrid: {
      gap: spacing.md,
    },
    insightList: {
      gap: spacing.sm,
    },
    insightRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    insightRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.glassStroke,
    },
    insightLabel: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    insightValue: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.accent,
      marginLeft: spacing.md,
    },
    premiumCard: {
      gap: spacing.md,
    },
    premiumPills: {
      flexDirection: "row",
      gap: spacing.sm,
      flexWrap: "wrap",
      marginBottom: spacing.sm,
    },
    premiumPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    premiumPillText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.text,
    },
    ctaRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    ctaButton: {
      flex: 1,
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading insights..." />;
  }

  if (weeklyStats.pausesTotal === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>Weekly reflection</Text>
            <Text style={styles.title}>Insights</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon="bar-chart-outline"
          title="No data yet"
          description="Start using GentleWait to unlock your weekly patterns and progress."
          actionLabel="Go Home"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>
            {settings.premium ? "Deep weekly reflection" : "Weekly reflection"}
          </Text>
          <Text style={styles.title}>Insights</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <GlassCard glowColor="primary" style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.eyebrow}>Your week so far</Text>
          </View>
          <View>
            <Text style={styles.heroTitleText}>{heroTitle}</Text>
            <Text style={styles.heroBodyText}>{heroBody}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Calm rate</Text>
              <Text style={styles.scoreValue}>{calmRate}%</Text>
              <Text style={styles.scoreHint}>
                {weeklyStats.choseCalmCount} of {weeklyStats.pausesTotal} pauses ended with intention
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Mindful time</Text>
              <Text style={styles.scoreValue}>{weeklyStats.mindfulMinutes}m</Text>
              <Text style={styles.scoreHint}>
                {weeklyStats.choseCalmCount} intentional outcomes this week
              </Text>
            </View>
          </View>
        </GlassCard>

        <View>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.miniGrid}>
            <GlassCard intensity="light" style={styles.miniCard}>
              <Text style={styles.miniLabel}>Total pauses</Text>
              <Text style={styles.miniValue}>{weeklyStats.pausesTotal}</Text>
              <Text style={styles.miniHint}>Every interruption you noticed</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.miniCard}>
              <Text style={styles.miniLabel}>Opened anyway</Text>
              <Text style={styles.miniValue}>{weeklyStats.openedAnyway}</Text>
              <Text style={styles.miniHint}>Moments the habit still won</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.miniCard}>
              <Text style={styles.miniLabel}>Closed</Text>
              <Text style={styles.miniValue}>{weeklyStats.closedCount}</Text>
              <Text style={styles.miniHint}>Times you stepped away fully</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.miniCard}>
              <Text style={styles.miniLabel}>Chose calm</Text>
              <Text style={styles.miniValue}>{weeklyStats.choseCalmCount}</Text>
              <Text style={styles.miniHint}>Closed or redirected with intention</Text>
            </GlassCard>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>7-day trend</Text>
          <GlassCard glowColor="secondary" style={styles.trendWrap}>
            <View style={styles.trendSummary}>
              <View>
                <Text style={styles.miniLabel}>Weekly total</Text>
                <Text style={styles.trendValue}>{totalTrendCount}</Text>
              </View>
              <Text style={styles.trendDelta}>{formatDelta(weekDelta)}</Text>
            </View>
            <View style={styles.trendBars}>
              {trendData.map((day) => (
                <View key={day.date} style={styles.trendBarItem}>
                  <View style={styles.trendBarTrack}>
                    <View
                      style={[
                        styles.trendBar,
                        { height: Math.max(8, (day.count / maxTrendValue) * 84) },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendDay}>{getDayLabel(day.date)}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {settings.premium ? (
          <>
            {topTriggers.length > 0 && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>What pulls you in</Text>
                <GlassCard glowColor="accent">
                  <View style={styles.insightList}>
                    {topTriggers.map((trigger, index) => (
                      <View
                        key={trigger.reason}
                        style={[
                          styles.insightRow,
                          index < topTriggers.length - 1 && styles.insightRowBorder,
                        ]}
                      >
                        <Text style={styles.insightLabel}>
                          {reasonLabels[trigger.reason] || trigger.reason}
                        </Text>
                        <Text style={styles.insightValue}>{trigger.count}</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </View>
            )}

            {topApps.length > 0 && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>Most intercepted apps</Text>
                <GlassCard>
                  <View style={styles.insightList}>
                    {topApps.map((app, index) => (
                      <View
                        key={`${app.appLabel}-${index}`}
                        style={[
                          styles.insightRow,
                          index < topApps.length - 1 && styles.insightRowBorder,
                        ]}
                      >
                        <Text style={styles.insightLabel}>{app.appLabel}</Text>
                        <Text style={styles.insightValue}>{app.count}</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </View>
            )}
          </>
        ) : (
          <GlassCard glowColor="accent" style={styles.premiumCard}>
            <View>
              <Text style={styles.sectionTitle}>Premium insight layer</Text>
              <Text style={styles.heroTitleText}>See the patterns behind the numbers</Text>
              <Text style={styles.heroBodyText}>
                Unlock app breakdowns, stronger trigger analysis, and week-over-week context with GentleWait Pro.
              </Text>
            </View>

            <View style={styles.premiumPills}>
              <View style={styles.premiumPill}>
                <Text style={styles.premiumPillText}>App breakdowns</Text>
              </View>
              <View style={styles.premiumPill}>
                <Text style={styles.premiumPillText}>Trigger patterns</Text>
              </View>
              <View style={styles.premiumPill}>
                <Text style={styles.premiumPillText}>Deeper weekly context</Text>
              </View>
            </View>

            <View style={styles.ctaRow}>
              <Button
                label={`Upgrade from ${PRICING.monthly}`}
                onPress={() => router.push("/paywall")}
                variant="primary"
                style={styles.ctaButton}
              />
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
