/**
 * Statistics calculation service
 */
import {
  getRecentEvents,
  getEventCountsByAction,
  getTotalMindfulTime,
} from '@/src/services/storage/sqlite';
import { WeeklyStats } from '@/src/domain/models';

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

  const pauses = todayEvents.filter((e) => e.action !== 'opened_anyway').length;
  const choseCalmCount = todayEvents.filter((e) =>
    e.action.startsWith('alternative_')
  ).length;

  return { pauses, choseCalmCount };
}

/**
 * Get this week's stats
 */
export async function getWeeklyStats(): Promise<WeeklyStats> {
  const events = await getRecentEvents(7);
  const counts = await getEventCountsByAction(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
    Date.now()
  );
  const mindfulMs = await getTotalMindfulTime(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
    Date.now()
  );

  return {
    pausesTotal: events.length,
    openedAnyway: counts['opened_anyway'] || 0,
    closedCount: counts['closed'] || 0,
    alternativeBreathed: counts['alternative_breathe'] || 0,
    alternativeReflected: counts['alternative_reflect'] || 0,
    alternativeGrounded: counts['alternative_grounding'] || 0,
    totalMindfulMinutes: Math.round(mindfulMs / 60000),
  };
}

/**
 * Get 7-day trend (pauses per day)
 */
export async function getSevenDayTrend(): Promise<{ date: string; count: number }[]> {
  const events = await getRecentEvents(7);
  const trend: Record<string, number> = {};

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    trend[dateStr] = 0;
  }

  // Count events by day
  events.forEach((event) => {
    const eventDate = new Date(event.ts);
    eventDate.setHours(0, 0, 0, 0);
    const dateStr = eventDate.toISOString().split('T')[0];
    trend[dateStr]++;
  });

  return Object.entries(trend).map(([date, count]) => ({ date, count }));
}
