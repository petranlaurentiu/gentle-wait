/**
 * Statistics calculation service
 */
import {
  getRecentEvents,
  getEventCountsByAction,
  getTotalMindfulTime,
} from "@/src/services/storage/sqlite";
import { WeeklyStats } from "@/src/domain/models";

/**
 * Get the start of the current week (Monday at 00:00:00)
 */
function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Get the end of the current week (Sunday at 23:59:59)
 */
function getEndOfWeek(): Date {
  const startOfWeek = getStartOfWeek();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6); // Add 6 days to get Sunday
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * Get today's stats
 */
export async function getTodayStats(): Promise<{
  pauses: number;
  choseCalmCount: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const events = await getRecentEvents(1);
  const todayEvents = events.filter(
    (e) => e.ts >= today.getTime() && e.ts <= endOfDay.getTime()
  );

  const pauses = todayEvents.filter((e) => e.action !== "opened_anyway").length;
  const choseCalmCount = todayEvents.filter((e) =>
    e.action.startsWith("alternative_")
  ).length;

  return { pauses, choseCalmCount };
}

/**
 * Get this week's stats (Monday - Sunday)
 */
export async function getWeeklyStats(): Promise<WeeklyStats> {
  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();

  const startTime = startOfWeek.getTime();
  const endTime = endOfWeek.getTime();

  // Get events from the current week
  const allEvents = await getRecentEvents(30); // Get more events to ensure we cover the week
  const weekEvents = allEvents.filter(
    (e) => e.ts >= startTime && e.ts <= endTime
  );

  const counts = await getEventCountsByAction(startTime, endTime);
  const mindfulMs = await getTotalMindfulTime(startTime, endTime);

  return {
    pausesTotal: weekEvents.length,
    openedAnyway: counts["opened_anyway"] || 0,
    closedCount: counts["closed"] || 0,
    alternativeBreathed: counts["alternative_breathe"] || 0,
    alternativeReflected: counts["alternative_reflect"] || 0,
    alternativeGrounded: counts["alternative_grounding"] || 0,
    alternativePrayed: counts["alternative_prayer"] || 0,
    totalMindfulMinutes: Math.round(mindfulMs / 60000),
  };
}

/**
 * Get 7-day trend (pauses per day for current week: Monday - Sunday)
 */
export async function getSevenDayTrend(): Promise<
  { date: string; count: number }[]
> {
  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();

  const startTime = startOfWeek.getTime();
  const endTime = endOfWeek.getTime();

  // Get events from the current week
  const allEvents = await getRecentEvents(30); // Get more events to ensure we cover the week
  const weekEvents = allEvents.filter(
    (e) => e.ts >= startTime && e.ts <= endTime
  );

  const trend: Record<string, number> = {};

  // Initialize all 7 days of the current week (Monday - Sunday)
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    trend[dateStr] = 0;
  }

  // Count events by day
  weekEvents.forEach((event) => {
    const eventDate = new Date(event.ts);
    eventDate.setHours(0, 0, 0, 0);
    const dateStr = eventDate.toISOString().split("T")[0];
    if (trend[dateStr] !== undefined) {
      trend[dateStr]++;
    }
  });

  // Return in order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
  return Object.entries(trend)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, count]) => ({ date, count }));
}
