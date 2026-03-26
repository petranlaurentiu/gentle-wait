/**
 * Badge evaluation service — checks conditions and unlocks earned badges
 */
import { BADGE_DEFINITIONS, FREE_BADGE_IDS, type BadgeDefinition } from "@/src/data/badges";
import { useAppStore } from "@/src/services/storage/store";
import {
  getTotalMindfulTime,
  getJournalEntryCount,
  getEventCountsByAction,
  getEventsByDateRange,
} from "@/src/services/storage/sqlite";

/**
 * Check all badge conditions and unlock any newly earned badges.
 * Returns array of newly unlocked badge IDs.
 */
export async function checkBadgeUnlocks(isPremium: boolean): Promise<string[]> {
  const store = useAppStore.getState();
  const unlockedIds = new Set(store.unlockedBadges.map((b) => b.id));
  const newlyUnlocked: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedIds.has(badge.id)) continue;

    // Skip premium badges for free users (unless it's a free badge)
    if (badge.premium && !isPremium && !FREE_BADGE_IDS.includes(badge.id))
      continue;

    const earned = await evaluateBadge(badge, store.streakState.longestStreak);
    if (earned) {
      const wasNew = store.unlockBadge(badge.id);
      if (wasNew) {
        newlyUnlocked.push(badge.id);
      }
    }
  }

  return newlyUnlocked;
}

async function evaluateBadge(
  badge: BadgeDefinition,
  longestStreak: number
): Promise<boolean> {
  switch (badge.category) {
    case "streak":
      return evaluateStreakBadge(badge);
    case "mindful_minutes":
      return evaluateMindfulMinutesBadge(badge);
    case "journal":
      return evaluateJournalBadge(badge);
    case "calm_rate":
      return evaluateCalmRateBadge(badge);
    case "variety":
      return evaluateVarietyBadge();
    default:
      return false;
  }
}

async function evaluateStreakBadge(badge: BadgeDefinition): Promise<boolean> {
  const store = useAppStore.getState();

  // Special badges
  if (badge.id === "streak-night-owl") {
    return checkTimeOfDayBadge(22, 23); // 10pm-midnight
  }
  if (badge.id === "streak-early-bird") {
    return checkTimeOfDayBadge(0, 6); // midnight-7am
  }

  // Regular streak badges
  return store.streakState.longestStreak >= badge.threshold;
}

async function checkTimeOfDayBadge(
  startHour: number,
  endHour: number
): Promise<boolean> {
  // Check last 30 days for events in the time range
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const events = await getEventsByDateRange(thirtyDaysAgo, now);

  return events.some((event) => {
    if (!event.action.startsWith("alternative_")) return false;
    const hour = new Date(event.ts).getHours();
    return hour >= startHour && hour <= endHour;
  });
}

async function evaluateMindfulMinutesBadge(
  badge: BadgeDefinition
): Promise<boolean> {
  const totalMs = await getTotalMindfulTime(0, Date.now());
  const totalMinutes = Math.round(totalMs / 60000);
  return totalMinutes >= badge.threshold;
}

async function evaluateJournalBadge(
  badge: BadgeDefinition
): Promise<boolean> {
  const count = await getJournalEntryCount();
  return count >= badge.threshold;
}

async function evaluateCalmRateBadge(
  badge: BadgeDefinition
): Promise<boolean> {
  // Check last 7 days: each day with pauses must have calm rate >= threshold
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let daysWithPauses = 0;
  let daysAboveThreshold = 0;

  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(sevenDaysAgo);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const counts = await getEventCountsByAction(
      dayStart.getTime(),
      dayEnd.getTime()
    );

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    if (total === 0) continue;

    daysWithPauses++;
    const opened = counts["opened_anyway"] || 0;
    const calmRate = Math.round(((total - opened) / total) * 100);

    if (calmRate >= badge.threshold) {
      daysAboveThreshold++;
    }
  }

  // Must have at least 3 days with pauses, all above threshold
  return daysWithPauses >= 3 && daysAboveThreshold === daysWithPauses;
}

async function evaluateVarietyBadge(): Promise<boolean> {
  const counts = await getEventCountsByAction(0, Date.now());
  const alternatives = [
    "alternative_breathe",
    "alternative_reflect",
    "alternative_grounding",
    "alternative_exercise",
    "alternative_prayer",
  ];
  // Also count "closed" as an alternative for variety purposes
  const allUsed = alternatives.every((action) => (counts[action] || 0) > 0);
  return allUsed;
}
