/**
 * Badges screen - achievement collection
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard } from "@/src/components/GlassCard";
import {
  BADGE_DEFINITIONS,
  BADGE_CATEGORIES,
  FREE_BADGE_IDS,
} from "@/src/data/badges";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";

export default function BadgesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const unlockedBadges = useAppStore((state) => state.unlockedBadges);
  const streakState = useAppStore((state) => state.streakState);

  const unlockedIds = new Set(unlockedBadges.map((b) => b.id));
  const unlockedCount = unlockedBadges.length;
  const totalAvailable = settings.premium
    ? BADGE_DEFINITIONS.length
    : BADGE_DEFINITIONS.filter(
        (b) => !b.premium || FREE_BADGE_IDS.includes(b.id)
      ).length;

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
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textMuted,
    },
    summaryCount: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.primary,
    },
    streakRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    streakText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    categoryTitle: {
      fontFamily: fonts.medium,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    badgeIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeInfo: {
      flex: 1,
      gap: 2,
    },
    badgeName: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    badgeNameLocked: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.textMuted,
    },
    badgeDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
    },
    badgeDate: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
    },
    lockIcon: {
      position: "absolute",
      right: -2,
      bottom: -2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.glassStroke,
    },
    upgradeCard: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    upgradeText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textMuted,
      textAlign: "center",
    },
    upgradeButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.button,
    },
    upgradeButtonText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: "#FFFFFF",
    },
  });

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>Achievements</Text>
          <Text style={styles.title}>Badges</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary card */}
        <GlassCard>
          <View style={styles.summaryRow}>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={20} color={colors.primary} />
              <Text style={styles.streakText}>
                {streakState.currentStreak} day streak
              </Text>
            </View>
            <Text style={styles.summaryCount}>
              {unlockedCount}/{totalAvailable}
            </Text>
          </View>
          {streakState.longestStreak > streakState.currentStreak && (
            <Text style={styles.summaryText}>
              Longest streak: {streakState.longestStreak} days
            </Text>
          )}
        </GlassCard>

        {/* Badge categories */}
        {BADGE_CATEGORIES.map((category) => {
          const badges = BADGE_DEFINITIONS.filter(
            (b) => b.category === category.key
          );
          const visibleBadges = settings.premium
            ? badges
            : badges.filter(
                (b) => !b.premium || FREE_BADGE_IDS.includes(b.id)
              );

          if (visibleBadges.length === 0) return null;

          return (
            <GlassCard key={category.key}>
              <Text style={styles.categoryTitle}>{category.label}</Text>
              {visibleBadges.map((badge, index) => {
                const isUnlocked = unlockedIds.has(badge.id);
                const unlock = unlockedBadges.find((b) => b.id === badge.id);

                return (
                  <React.Fragment key={badge.id}>
                    {index > 0 && <View style={styles.separator} />}
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.badgeIconContainer,
                          {
                            backgroundColor: isUnlocked
                              ? colors.primary + "20"
                              : colors.glassFill,
                          },
                        ]}
                      >
                        <Ionicons
                          name={badge.icon as any}
                          size={22}
                          color={
                            isUnlocked ? colors.primary : colors.textMuted
                          }
                        />
                        {!isUnlocked && badge.premium && (
                          <View style={styles.lockIcon}>
                            <Ionicons
                              name="lock-closed"
                              size={12}
                              color={colors.textMuted}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.badgeInfo}>
                        <Text
                          style={
                            isUnlocked
                              ? styles.badgeName
                              : styles.badgeNameLocked
                          }
                        >
                          {badge.name}
                        </Text>
                        <Text style={styles.badgeDescription}>
                          {badge.description}
                        </Text>
                        {unlock && (
                          <Text style={styles.badgeDate}>
                            Earned {formatDate(unlock.unlockedAt)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </GlassCard>
          );
        })}

        {/* Upgrade CTA for free users */}
        {!settings.premium && (
          <GlassCard>
            <View style={styles.upgradeCard}>
              <Ionicons name="trophy-outline" size={32} color={colors.primary} />
              <Text style={styles.upgradeText}>
                Unlock {BADGE_DEFINITIONS.length - FREE_BADGE_IDS.length} more
                badges, streak freeze, and advanced analytics with Pro.
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push("/paywall")}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
