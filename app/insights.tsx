/**
 * Insights screen - Weekly stats and trends
 * Liquid Glass Design System
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { EmptyState } from "@/src/components/EmptyState";
import { LoadingState } from "@/src/components/LoadingState";
import { GlassCard } from "@/src/components/GlassCard";
import { getWeeklyStats, getSevenDayTrend } from "@/src/services/stats";
import { getTopTriggers } from "@/src/services/storage/sqlite";

// Helper to get start and end of current week (Monday - Sunday)
function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6); // Add 6 days to get Sunday
  endOfWeek.setHours(23, 59, 59, 999);
  return {
    start: startOfWeek.getTime(),
    end: endOfWeek.getTime(),
  };
}

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    pausesTotal: 0,
    openedAnyway: 0,
    closedCount: 0,
    choseCalmCount: 0,
    mindfulMinutes: 0,
  });
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>(
    []
  );
  const [topTriggers, setTopTriggers] = useState<
    { reason: string; count: number }[]
  >([]);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      (async () => {
        try {
          const weekly = await getWeeklyStats();
          setWeeklyStats({
            pausesTotal: weekly.pausesTotal,
            openedAnyway: weekly.openedAnyway,
            closedCount: weekly.closedCount,
            choseCalmCount:
              weekly.alternativeBreathed +
              weekly.alternativeReflected +
              weekly.alternativeGrounded,
            mindfulMinutes: weekly.totalMindfulMinutes,
          });

          const trend = await getSevenDayTrend();
          setTrendData(trend);

          const weekBounds = getWeekBounds();
          const triggers = await getTopTriggers(
            weekBounds.start,
            weekBounds.end,
            5
          );
          setTopTriggers(triggers);
        } catch (error) {
          console.error("Failed to load insights:", error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, [])
  );

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
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    closeButton: {
      padding: spacing.sm,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: radius.button,
    },
    closeButtonText: {
      fontSize: 20,
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 3,
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
    },
    cardLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    cardValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.primary,
      letterSpacing: -3,
      marginVertical: spacing.xs,
    },
    cardSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    statsGrid: {
      flexDirection: "row",
      gap: spacing.md,
    },
    smallCard: {
      flex: 1,
    },
    smallCardValue: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      marginTop: spacing.xs,
    },
    // Chart styles
    chartContent: {
      alignItems: "center",
    },
    chartValue: {
      fontFamily: fonts.thin,
      fontSize: typography.hero.fontSize,
      color: colors.secondary,
      letterSpacing: -2,
    },
    chartLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    trendBars: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-around",
      width: "100%",
      height: 80,
      gap: spacing.sm,
    },
    trendBarContainer: {
      alignItems: "center",
      flex: 1,
    },
    trendBar: {
      width: "80%",
      backgroundColor: colors.secondary,
      borderRadius: 4,
      minHeight: 4,
    },
    trendDayLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    // Trigger list styles
    triggerList: {
      paddingVertical: spacing.sm,
    },
    triggerItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    triggerItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    triggerLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    triggerCount: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.accent,
    },
  });

  const reasonLabels: Record<string, string> = {
    relax: "Relaxation",
    connect: "Connection",
    distraction: "Distraction",
    info: "Information",
    habit: "Habit",
    unsure: "I'm not sure",
  };

  if (isLoading) {
    return <LoadingState message="Loading insights..." />;
  }

  if (weeklyStats.pausesTotal === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <EmptyState
          icon="📊"
          title="No Data Yet"
          description="Start using GentleWait to see your insights. Complete your first pause to get started!"
          actionLabel="Go Home"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* This Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <GlassCard glowColor="primary">
            <Text style={styles.cardLabel}>Total pauses</Text>
            <Text style={styles.cardValue}>{weeklyStats.pausesTotal}</Text>
            <Text style={styles.cardSubtitle}>
              {weeklyStats.pausesTotal === 0
                ? "Start your mindful journey"
                : `${weeklyStats.pausesTotal} moments of awareness`}
            </Text>
          </GlassCard>

          <View style={styles.statsGrid}>
            <GlassCard style={styles.smallCard} intensity="light">
              <Text style={styles.cardLabel}>Chose calm</Text>
              <Text style={styles.smallCardValue}>
                {weeklyStats.choseCalmCount}
              </Text>
            </GlassCard>
            <GlassCard style={styles.smallCard} intensity="light">
              <Text style={styles.cardLabel}>Mindful min</Text>
              <Text style={styles.smallCardValue}>
                {weeklyStats.mindfulMinutes}
              </Text>
            </GlassCard>
          </View>

          <View style={styles.statsGrid}>
            <GlassCard style={styles.smallCard} intensity="light">
              <Text style={styles.cardLabel}>Opened anyway</Text>
              <Text style={styles.smallCardValue}>
                {weeklyStats.openedAnyway}
              </Text>
            </GlassCard>
            <GlassCard style={styles.smallCard} intensity="light">
              <Text style={styles.cardLabel}>Closed</Text>
              <Text style={styles.smallCardValue}>
                {weeklyStats.closedCount}
              </Text>
            </GlassCard>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Trend</Text>
          <GlassCard glowColor="secondary">
            <View style={styles.chartContent}>
              <Text style={styles.chartValue}>
                {trendData.reduce((sum, d) => sum + d.count, 0)}
              </Text>
              <Text style={styles.chartLabel}>pauses this week</Text>
              {trendData.length > 0 && (
                <View style={styles.trendBars}>
                  {trendData.map((day, index) => (
                    <View key={index} style={styles.trendBarContainer}>
                      <View
                        style={[
                          styles.trendBar,
                          {
                            height: Math.max(
                              4,
                              (day.count /
                                Math.max(...trendData.map((d) => d.count), 1)) *
                                60
                            ),
                          },
                        ]}
                      />
                      <Text style={styles.trendDayLabel}>
                        {new Date(day.date).toLocaleDateString("en", {
                          weekday: "narrow",
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </GlassCard>
        </View>

        {/* Top Triggers */}
        {topTriggers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you were looking for</Text>
            <GlassCard glowColor="accent" noPadding>
              <View style={styles.triggerList}>
                {topTriggers.map((trigger, index) => (
                  <View
                    key={trigger.reason}
                    style={[
                      styles.triggerItem,
                      index < topTriggers.length - 1 &&
                        styles.triggerItemBorder,
                    ]}
                  >
                    <Text style={styles.triggerLabel}>
                      {reasonLabels[trigger.reason] || trigger.reason}
                    </Text>
                    <Text style={styles.triggerCount}>{trigger.count}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
