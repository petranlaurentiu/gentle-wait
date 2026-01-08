/**
 * Home screen - Main dashboard
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    title: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.text,
      letterSpacing: -0.5,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl * 2,
    },
    cardsContainer: {
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.lg + spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    cardValue: {
      fontSize: 48,
      fontWeight: '200',
      color: colors.primary,
      letterSpacing: -2,
      marginBottom: spacing.xs,
    },
    cardSubtitle: {
      fontSize: typography.secondary.fontSize,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    statsRow: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    statText: {
      fontSize: typography.secondary.fontSize + 1,
      fontWeight: '500',
      color: colors.text,
    },
    appsCard: {
      backgroundColor: `${colors.primary}08`,
      borderColor: `${colors.primary}20`,
    },
    appItem: {
      fontSize: typography.secondary.fontSize + 1,
      fontWeight: '500',
      color: colors.text,
      paddingVertical: spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    tip: {
      marginTop: spacing.xl,
      fontSize: typography.secondary.fontSize,
      fontWeight: '400',
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      opacity: 0.7,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimation]}>
        <Text style={styles.title}>Pause</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {/* Today card */}
          <Animated.View style={[styles.card, cardOneAnimation]}>
            <Text style={styles.cardTitle}>Today</Text>
            <Text style={styles.cardValue}>{todayPauses}</Text>
            <Text style={styles.cardSubtitle}>pauses so far</Text>
          </Animated.View>

          {/* Stats cards */}
          <Animated.View style={[styles.card, cardTwoAnimation]}>
            <Text style={styles.cardTitle}>This Week</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statDot} />
                <Text style={styles.statText}>
                  {weeklyStats.pausesTotal} pauses
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statDot} />
                <Text style={styles.statText}>
                  {weeklyStats.choseCalmCount} chose calm
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statDot} />
                <Text style={styles.statText}>
                  {weeklyStats.mindfulMinutes} mindful minutes
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Protected apps list */}
          {settings.selectedApps.length > 0 && (
            <Animated.View style={[styles.card, styles.appsCard, cardThreeAnimation]}>
              <Text style={styles.cardTitle}>Protected Apps</Text>
              <View>
                {settings.selectedApps.map((app) => (
                  <Text key={app.packageName} style={styles.appItem}>
                    {app.label}
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
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              label="Settings"
              onPress={() => router.push('/settings')}
              variant="secondary"
              style={{ flex: 1 }}
            />
          </Animated.View>

          <Animated.View style={tipAnimation}>
            <Text style={styles.tip}>Small pauses add up.</Text>
          </Animated.View>
        </View>
      </ScrollView>
      <DebugMenu />
    </SafeAreaView>
  );
}
