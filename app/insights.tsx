/**
 * Insights screen - Weekly stats and trends
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingState } from '@/src/components/LoadingState';
import { getWeeklyStats, getSevenDayTrend } from '@/src/services/stats';
import { getTopTriggers } from '@/src/services/storage/sqlite';

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
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [topTriggers, setTopTriggers] = useState<{ reason: string; count: number }[]>([]);

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

          const triggers = await getTopTriggers(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
            Date.now(),
            5
          );
          setTopTriggers(triggers);
        } catch (error) {
          console.error('Failed to load insights:', error);
        } finally {
          setIsLoading(false);
        }
      })();
    }, [])
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.text,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
      opacity: 0.8,
    },
    cardValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.bg,
    },
    cardSubtitle: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
      opacity: 0.6,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    smallCard: {
      flex: 1,
      minWidth: '48%',
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    smallCardValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.bg,
    },
    chartPlaceholder: {
      height: 200,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.5,
    },
    chartPlaceholderText: {
      color: colors.bg,
      fontSize: typography.secondary.fontSize,
    },
    triggerList: {
      gap: spacing.sm,
    },
    triggerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      opacity: 0.7,
    },
    triggerLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
    },
    triggerCount: {
      fontSize: typography.secondary.fontSize,
      fontWeight: '700',
      color: colors.bg,
    },
  });

  const reasonLabels: Record<string, string> = {
    relax: 'Relaxation',
    connect: 'Connection',
    distraction: 'Distraction',
    info: 'Information',
    habit: 'Habit',
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
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* This Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total pauses</Text>
            <Text style={styles.cardValue}>{weeklyStats.pausesTotal}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Chose calm</Text>
              <Text style={styles.smallCardValue}>{weeklyStats.choseCalmCount}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Mindful min</Text>
              <Text style={styles.smallCardValue}>{weeklyStats.mindfulMinutes}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Opened anyway</Text>
              <Text style={styles.smallCardValue}>{weeklyStats.openedAnyway}</Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.cardLabel}>Closed pauses</Text>
              <Text style={styles.smallCardValue}>{weeklyStats.closedCount}</Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Trend</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>
              {trendData.length > 0
                ? `${trendData.reduce((sum, d) => sum + d.count, 0)} pauses this week`
                : 'No data yet'}
            </Text>
          </View>
        </View>

        {/* Top Triggers */}
        {topTriggers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you were looking for</Text>
            <View style={styles.triggerList}>
              {topTriggers.map((trigger) => (
                <View key={trigger.reason} style={styles.triggerItem}>
                  <Text style={styles.triggerLabel}>
                    {reasonLabels[trigger.reason] || trigger.reason}
                  </Text>
                  <Text style={styles.triggerCount}>{trigger.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
