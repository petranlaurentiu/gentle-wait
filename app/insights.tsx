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
import { BarChart } from "@/src/components/charts/BarChart";
import { HeatmapChart } from "@/src/components/charts/HeatmapChart";
import { LineChart } from "@/src/components/charts/LineChart";
import { useAppStore } from "@/src/services/storage";
import {
  getTopApps,
  getTopTriggers,
  getPerAppBreakdown,
  getHourlyHeatmapData,
  getWeeklyCalmRateTrend,
  type PerAppBreakdown,
  type WeeklyCalmRatePoint,
} from "@/src/services/storage/sqlite";
import {
  getCurrentWeekRange,
  getPreviousWeekRange,
  getMonthRange,
  getAllTimeRange,
  getSevenDayTrend,
  getWeeklyStats,
  getWeeklySummaryText,
} from "@/src/services/stats";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";

const INSIGHT_ACCENTS = [
  {
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.42)",
    surface: "rgba(126, 230, 198, 0.12)",
  },
  {
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.4)",
    surface: "rgba(82, 192, 255, 0.12)",
  },
  {
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.4)",
    surface: "rgba(244, 211, 94, 0.13)",
  },
  {
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.38)",
    surface: "rgba(255, 122, 182, 0.12)",
  },
  {
    accent: "#A78BFA",
    glow: "rgba(167, 139, 250, 0.38)",
    surface: "rgba(167, 139, 250, 0.12)",
  },
  {
    accent: "#FB7185",
    glow: "rgba(251, 113, 133, 0.38)",
    surface: "rgba(251, 113, 133, 0.12)",
  },
] as const;

const MINI_STAT_ACCENTS = [
  INSIGHT_ACCENTS[1],
  INSIGHT_ACCENTS[5],
  INSIGHT_ACCENTS[0],
  INSIGHT_ACCENTS[4],
] as const;

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
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
  const [appBreakdown, setAppBreakdown] = useState<PerAppBreakdown[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [calmRateTrend, setCalmRateTrend] = useState<WeeklyCalmRatePoint[]>([]);
  const [weeklySummary, setWeeklySummary] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      (async () => {
        try {
          const rangeMap = {
            week: getCurrentWeekRange,
            month: getMonthRange,
            all: getAllTimeRange,
          };
          const currentRange = rangeMap[timeRange]();
          const previousRange = getPreviousWeekRange();

          const [weekly, previousWeekly, trend, triggers, apps] = await Promise.all([
            getWeeklyStats(currentRange),
            getWeeklyStats(previousRange),
            getSevenDayTrend(getCurrentWeekRange()), // trend always shows current week
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

          // Load premium analytics data
          if (settings.premium) {
            const [breakdown, heatmap, calmTrend] = await Promise.all([
              getPerAppBreakdown(currentRange.start, currentRange.end),
              getHourlyHeatmapData(currentRange.start, currentRange.end),
              getWeeklyCalmRateTrend(currentRange.start, currentRange.end),
            ]);
            setAppBreakdown(breakdown);
            setHeatmapData(heatmap);
            setCalmRateTrend(calmTrend);

            // Generate weekly summary text
            const summary = getWeeklySummaryText(weekly, previousWeekly);
            setWeeklySummary(summary);
          }
        } catch (error) {
          console.error("Failed to load insights:", error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, [timeRange, settings.premium])
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
      paddingTop: spacing.xl,
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
      paddingTop: spacing.xs,
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
    heroBadgeText: {
      color: INSIGHT_ACCENTS[0].accent,
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
    scoreAccentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    scoreDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
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
    miniHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    miniDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
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
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
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
    },
    insightValuePill: {
      minWidth: 34,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pills,
      alignItems: "center",
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
    timeRangeRow: {
      flexDirection: "row" as const,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    timeRangePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    timeRangePillActive: {
      backgroundColor: INSIGHT_ACCENTS[1].surface,
      borderColor: INSIGHT_ACCENTS[1].accent,
    },
    timeRangePillText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
    },
    timeRangePillTextActive: {
      color: INSIGHT_ACCENTS[1].accent,
    },
    lockedPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    premiumSectionBlur: {
      opacity: 0.5,
    },
    premiumOverlay: {
      alignItems: "center" as const,
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    premiumOverlayText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.primary,
    },
    summaryText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading insights..." />;
  }

  if (weeklyStats.pausesTotal === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
        {/* Time range selector */}
        <View style={styles.timeRangeRow}>
          {(["week", "month", "all"] as const).map((range) => {
            const isActive = timeRange === range;
            const isLocked = !settings.premium && range !== "week";
            const labels = { week: "This week", month: "This month", all: "All time" };

            return (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangePill,
                  isActive && styles.timeRangePillActive,
                ]}
                onPress={() => {
                  if (isLocked) {
                    router.push("/paywall");
                  } else {
                    setTimeRange(range);
                  }
                }}
              >
                {isLocked ? (
                  <View style={styles.lockedPill}>
                    <Text style={styles.timeRangePillText}>{labels[range]}</Text>
                    <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.timeRangePillText,
                      isActive && styles.timeRangePillTextActive,
                    ]}
                  >
                    {labels[range]}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <GlassCard glowColor="primary" style={styles.heroCard}>
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: INSIGHT_ACCENTS[0].surface,
                borderColor: INSIGHT_ACCENTS[0].accent,
              },
            ]}
          >
            <Text style={[styles.eyebrow, styles.heroBadgeText]}>Your week so far</Text>
          </View>
          <View>
            <Text style={styles.heroTitleText}>{heroTitle}</Text>
            <Text style={styles.heroBodyText}>{heroBody}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <View style={styles.scoreAccentRow}>
                <View
                  style={[
                    styles.scoreDot,
                    { backgroundColor: INSIGHT_ACCENTS[0].accent },
                  ]}
                />
                <Text style={styles.scoreLabel}>Calm rate</Text>
              </View>
              <Text style={[styles.scoreValue, { color: INSIGHT_ACCENTS[0].accent }]}>
                {calmRate}%
              </Text>
              <Text style={styles.scoreHint}>
                {weeklyStats.choseCalmCount} of {weeklyStats.pausesTotal} pauses ended with intention
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <View style={styles.scoreAccentRow}>
                <View
                  style={[
                    styles.scoreDot,
                    { backgroundColor: INSIGHT_ACCENTS[1].accent },
                  ]}
                />
                <Text style={styles.scoreLabel}>Mindful time</Text>
              </View>
              <Text style={[styles.scoreValue, { color: INSIGHT_ACCENTS[1].accent }]}>
                {weeklyStats.mindfulMinutes}m
              </Text>
              <Text style={styles.scoreHint}>
                {weeklyStats.choseCalmCount} intentional outcomes this week
              </Text>
            </View>
          </View>
        </GlassCard>

        <View>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.miniGrid}>
            {[
              {
                label: "Total pauses",
                value: weeklyStats.pausesTotal,
                hint: "Every interruption you noticed",
              },
              {
                label: "Opened anyway",
                value: weeklyStats.openedAnyway,
                hint: "Moments the habit still won",
              },
              {
                label: "Closed",
                value: weeklyStats.closedCount,
                hint: "Times you stepped away fully",
              },
              {
                label: "Chose calm",
                value: weeklyStats.choseCalmCount,
                hint: "Closed or redirected with intention",
              },
            ].map((stat, index) => {
              const accent = MINI_STAT_ACCENTS[index];

              return (
                <GlassCard intensity="light" style={styles.miniCard} key={stat.label}>
                  <View style={styles.miniHeaderRow}>
                    <View
                      style={[
                        styles.miniDot,
                        {
                          backgroundColor: accent.accent,
                          shadowColor: accent.glow,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.55,
                          shadowRadius: 8,
                        },
                      ]}
                    />
                    <Text style={styles.miniLabel}>{stat.label}</Text>
                  </View>
                  <Text style={[styles.miniValue, { color: accent.accent }]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.miniHint}>{stat.hint}</Text>
                </GlassCard>
              );
            })}
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
              {trendData.map((day, index) => {
                const accent = INSIGHT_ACCENTS[index % INSIGHT_ACCENTS.length];

                return (
                  <View key={day.date} style={styles.trendBarItem}>
                    <View style={styles.trendBarTrack}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: Math.max(8, (day.count / maxTrendValue) * 84),
                            backgroundColor: accent.accent,
                            shadowColor: accent.glow,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendDay}>{getDayLabel(day.date)}</Text>
                  </View>
                );
              })}
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
                    {topTriggers.map((trigger, index) => {
                      const accent = INSIGHT_ACCENTS[index % INSIGHT_ACCENTS.length];

                      return (
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
                          <View
                            style={[
                              styles.insightValuePill,
                              { backgroundColor: accent.surface },
                            ]}
                          >
                            <Text style={[styles.insightValue, { color: accent.accent }]}>
                              {trigger.count}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>
              </View>
            )}

            {topApps.length > 0 && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>Most intercepted apps</Text>
                <GlassCard>
                  <View style={styles.insightList}>
                    {topApps.map((app, index) => {
                      const accent = INSIGHT_ACCENTS[(index + 2) % INSIGHT_ACCENTS.length];

                      return (
                        <View
                          key={`${app.appLabel}-${index}`}
                          style={[
                            styles.insightRow,
                            index < topApps.length - 1 && styles.insightRowBorder,
                          ]}
                        >
                          <Text style={styles.insightLabel}>{app.appLabel}</Text>
                          <View
                            style={[
                              styles.insightValuePill,
                              { backgroundColor: accent.surface },
                            ]}
                          >
                            <Text style={[styles.insightValue, { color: accent.accent }]}>
                              {app.count}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>
              </View>
            )}

            {/* Premium: Per-app breakdown */}
            {appBreakdown.length > 0 && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>App breakdown</Text>
                <GlassCard>
                  <BarChart
                    data={appBreakdown.slice(0, 6).map((app) => ({
                      label: app.appLabel,
                      value: app.totalPauses,
                      rate: app.totalPauses > 0
                        ? Math.round((app.calmCount / app.totalPauses) * 100)
                        : 0,
                    }))}
                    primaryColor={INSIGHT_ACCENTS[0].accent}
                    accentColor={INSIGHT_ACCENTS[2].accent}
                    textColor={colors.text}
                    mutedColor={colors.textMuted}
                  />
                </GlassCard>
              </View>
            )}

            {/* Premium: Hourly heatmap */}
            {heatmapData.length > 0 && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>When you reach for your phone</Text>
                <GlassCard>
                  <HeatmapChart
                    data={heatmapData}
                    primaryColor={INSIGHT_ACCENTS[1].accent}
                    textColor={colors.text}
                    mutedColor={colors.textMuted}
                    accentColors={INSIGHT_ACCENTS.map((item) => item.accent)}
                  />
                </GlassCard>
              </View>
            )}

            {/* Premium: Calm rate trend */}
            {calmRateTrend.length > 1 && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>Calm rate over time</Text>
                <GlassCard>
                  <LineChart
                    data={calmRateTrend.map((p) => ({
                      label: p.weekLabel,
                      value: p.calmRate,
                    }))}
                    primaryColor={INSIGHT_ACCENTS[0].accent}
                    textColor={colors.text}
                    mutedColor={colors.textMuted}
                  />
                </GlassCard>
              </View>
            )}

            {/* Premium: Weekly summary */}
            {weeklySummary && (
              <View style={styles.splitGrid}>
                <Text style={styles.sectionTitle}>Weekly summary</Text>
                <GlassCard glowColor="secondary">
                  <Text style={styles.summaryText}>{weeklySummary}</Text>
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
              {["App breakdowns", "Hourly heatmap", "Calm rate trend", "Monthly & all-time"].map(
                (label, index) => {
                  const accent = INSIGHT_ACCENTS[index % INSIGHT_ACCENTS.length];

                  return (
                    <View
                      key={label}
                      style={[
                        styles.premiumPill,
                        {
                          backgroundColor: accent.surface,
                          borderColor: accent.accent,
                        },
                      ]}
                    >
                      <Text style={[styles.premiumPillText, { color: accent.accent }]}>
                        {label}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>

            <View style={styles.ctaRow}>
              <Button
                label="Upgrade to Pro"
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
