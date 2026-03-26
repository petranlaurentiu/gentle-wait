/**
 * Daily nudge generation service
 * Generates one AI-powered personalized insight per day for premium users.
 */
import { sendMessage, isAiConfigured } from "@/src/services/ai/openrouter";
import { useAppStore } from "@/src/services/storage/store";
import { getTopApps, getTopTriggers } from "@/src/services/storage/sqlite";
import { getWeeklyStats, getLast7DaysRange } from "@/src/services/stats";

function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const NUDGE_PROMPT_TEMPLATE = `You are a mindful screen time coach. Based on this user's last 7 days:
- Calm rate: {calmRate}%
- Total pauses: {totalPauses}
- Mindful minutes: {mindfulMinutes}
- Top trigger: {topTrigger}
- Top app: {topApp}
- Current streak: {streak} days
- Trend: {trend}

Write ONE personalized insight (1-2 sentences). Be specific, warm, and actionable.
Do not use generic advice. Reference their actual data.
Do not use emojis. Keep the tone gentle and encouraging.`;

/**
 * Generate or return cached daily nudge.
 * Returns the nudge text, or null if unavailable.
 */
export async function generateDailyNudge(): Promise<string | null> {
  const store = useAppStore.getState();
  const today = getTodayISO();

  // Return cached nudge if already generated today
  if (store.dailyNudge?.date === today) {
    return store.dailyNudge.text;
  }

  // Must be premium
  if (!store.settings.premium) return null;

  // Must have AI configured
  if (!isAiConfigured()) return null;

  try {
    // Gather last 7 days context
    const range = getLast7DaysRange();
    const [stats, topApps, topTriggers] = await Promise.all([
      getWeeklyStats(range),
      getTopApps(range.start, range.end, 1),
      getTopTriggers(range.start, range.end, 1),
    ]);

    const totalCalm =
      stats.closedCount +
      stats.alternativeBreathed +
      stats.alternativeReflected +
      stats.alternativeGrounded +
      stats.alternativeExercise +
      stats.alternativePrayed;

    const calmRate =
      stats.pausesTotal > 0
        ? Math.round((totalCalm / stats.pausesTotal) * 100)
        : 0;

    // Don't generate if no data
    if (stats.pausesTotal === 0) return null;

    // Build prompt
    const prompt = NUDGE_PROMPT_TEMPLATE
      .replace("{calmRate}", String(calmRate))
      .replace("{totalPauses}", String(stats.pausesTotal))
      .replace("{mindfulMinutes}", String(stats.totalMindfulMinutes))
      .replace("{topTrigger}", topTriggers[0]?.reason || "unknown")
      .replace("{topApp}", topApps[0]?.appLabel || "your apps")
      .replace("{streak}", String(store.streakState.currentStreak))
      .replace("{trend}", calmRate >= 60 ? "improving" : calmRate >= 40 ? "stable" : "needs attention");

    // Call AI
    const response = await sendMessage(prompt);
    if (!response.success) return null;

    // Cache the nudge
    const nudge = { date: today, text: response.message, dismissed: false };
    store.setDailyNudge(nudge);
    store.addNudgeToHistory({ date: today, text: response.message });

    return response.message;
  } catch (error) {
    console.error("[Nudges] Error generating daily nudge:", error);
    return null;
  }
}
