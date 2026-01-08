/**
 * Home screen - Main dashboard
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import { useAppStore } from '@/src/services/storage';
import { getTodayStats, getWeeklyStats } from '@/src/services/stats';
import { Button } from '@/src/components/Button';
import { DebugMenu } from '@/src/components/DebugMenu';
import { useFadeInAnimation, useStaggeredFadeIn } from '@/src/utils/animations';

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

  // Animation hooks for staggered card entrance
  const headerAnimation = useFadeInAnimation();
  const cardOneAnimation = useStaggeredFadeIn(0, 5);
  const cardTwoAnimation = useStaggeredFadeIn(1, 5);
  const cardThreeAnimation = useStaggeredFadeIn(2, 5);
  const buttonsAnimation = useStaggeredFadeIn(3, 5);
  const tipAnimation = useStaggeredFadeIn(4, 5);

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
              weekly.alternativeGrounded,
            mindfulMinutes: weekly.totalMindfulMinutes,
          });
        } catch (error) {
          console.error('Failed to load stats:', error);
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
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
      marginBottom: spacing.md,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      fontSize: typography.prompt.fontSize,
      fontWeight: '600',
      color: colors.bg,
    },
    cardValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.bg,
    },
    cardSubtitle: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
      opacity: 0.8,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.bg,
    },
    tip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.text,
      opacity: 0.6,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerAnimation]}>
        <Text style={styles.title}>Pause</Text>
      </Animated.View>

      <ScrollView style={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Today card */}
        <Animated.View style={[styles.card, cardOneAnimation]}>
          <Text style={styles.cardTitle}>Today</Text>
          <Text style={styles.cardValue}>{todayPauses}</Text>
          <Text style={styles.cardSubtitle}>pauses so far</Text>
        </Animated.View>

        {/* Stats cards */}
        <Animated.View style={[styles.card, cardTwoAnimation]}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={{ gap: spacing.sm }}>
            <Text style={styles.cardSubtitle}>{weeklyStats.pausesTotal} pauses</Text>
            <Text style={styles.cardSubtitle}>
              {weeklyStats.choseCalmCount} chose calm
            </Text>
            <Text style={styles.cardSubtitle}>
              {weeklyStats.mindfulMinutes} mindful minutes
            </Text>
          </View>
        </Animated.View>

        {/* Protected apps list */}
        {settings.selectedApps.length > 0 && (
          <Animated.View style={[styles.card, cardThreeAnimation]}>
            <Text style={styles.cardTitle}>Protected Apps</Text>
            <View style={{ gap: spacing.xs }}>
              {settings.selectedApps.map((app) => (
                <Text key={app.packageName} style={styles.cardSubtitle}>
                  • {app.label}
                </Text>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Action buttons */}
        <Animated.View style={[styles.buttonRow, buttonsAnimation]}>
          <Button
            label="Insights"
            onPress={() => router.push('/insights')}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            label="Settings"
            onPress={() => router.push('/settings')}
            variant="primary"
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.View style={tipAnimation}>
          <Text style={styles.tip}>Small pauses add up.</Text>
        </Animated.View>
      </ScrollView>
      <DebugMenu />
    </View>
  );
}
