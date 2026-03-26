/**
 * Streak calculation and management service
 */
import { useAppStore } from "@/src/services/storage/store";
import { getEventCountsByAction } from "@/src/services/storage/sqlite";
import { checkBadgeUnlocks } from "./badges";

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function getYesterdayDate(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function hasAlternativeToday(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const counts = await getEventCountsByAction(today.getTime(), endOfDay.getTime());
  const alternativeCount =
    (counts["alternative_breathe"] || 0) +
    (counts["alternative_reflect"] || 0) +
    (counts["alternative_grounding"] || 0) +
    (counts["alternative_exercise"] || 0) +
    (counts["alternative_prayer"] || 0);

  return alternativeCount > 0;
}

export interface StreakUpdateResult {
  streakChanged: boolean;
  freezeApplied: boolean;
  newBadges: string[];
}

/**
 * Update streak state based on current events.
 * Called on app open and after each pause event.
 */
export async function updateStreak(
  isPremium: boolean
): Promise<StreakUpdateResult> {
  const store = useAppStore.getState();
  const { streakState } = store;
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const currentMonday = getCurrentWeekMonday();

  let {
    currentStreak,
    longestStreak,
    lastStreakDate,
    freezesUsedThisWeek,
    freezeWeekStart,
  } = streakState;

  let streakChanged = false;
  let freezeApplied = false;

  // Reset freeze count if new week
  if (freezeWeekStart !== currentMonday) {
    freezesUsedThisWeek = 0;
    freezeWeekStart = currentMonday;
  }

  const hasAlt = await hasAlternativeToday();

  if (lastStreakDate === today) {
    // Already processed today — no change needed
  } else if (hasAlt) {
    if (lastStreakDate === "" || lastStreakDate === yesterday) {
      // Continue or start streak
      currentStreak++;
      lastStreakDate = today;
      streakChanged = true;
    } else if (lastStreakDate !== "") {
      const gap = daysBetween(lastStreakDate, today);
      if (gap === 2 && isPremium && freezesUsedThisWeek < 1) {
        // Apply freeze for the missed day, then continue
        freezesUsedThisWeek++;
        freezeApplied = true;
        currentStreak++;
        lastStreakDate = today;
        streakChanged = true;
      } else {
        // Gap too large or no freeze available — reset
        currentStreak = 1;
        lastStreakDate = today;
        streakChanged = true;
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  }

  if (streakChanged || freezeApplied) {
    store.updateStreakState({
      currentStreak,
      longestStreak,
      lastStreakDate,
      freezesUsedThisWeek,
      freezeWeekStart,
    });
  }

  // Check for newly unlocked badges
  const newBadges = await checkBadgeUnlocks(isPremium);

  return { streakChanged, freezeApplied, newBadges };
}
