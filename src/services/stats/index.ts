/**
 * Statistics calculation service
 */
import { WeeklyStats } from "@/src/domain/models";
import {
  getEventCountsByAction,
  getEventsByDateRange,
  getTotalMindfulTime,
} from "@/src/services/storage/sqlite";

export interface TimeRange {
  start: number;
  end: number;
}

function getStartOfWeek(offsetWeeks = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(diff + offsetWeeks * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

function getEndOfWeek(offsetWeeks = 0): Date {
  const startOfWeek = getStartOfWeek(offsetWeeks);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildWeeklyStats(counts: Record<string, number>, mindfulMinutes: number): WeeklyStats {
  const closedCount = counts["closed"] || 0;
  const openedAnyway = counts["opened_anyway"] || 0;
  const alternativeBreathed = counts["alternative_breathe"] || 0;
  const alternativeReflected = counts["alternative_reflect"] || 0;
  const alternativeGrounded = counts["alternative_grounding"] || 0;
  const alternativeExercise = counts["alternative_exercise"] || 0;
  const alternativePrayed = counts["alternative_prayer"] || 0;

  return {
    pausesTotal:
      openedAnyway +
      closedCount +
      alternativeBreathed +
      alternativeReflected +
      alternativeGrounded +
      alternativeExercise +
      alternativePrayed,
    openedAnyway,
    closedCount,
    alternativeBreathed,
    alternativeReflected,
    alternativeGrounded,
    alternativeExercise,
    alternativePrayed,
    totalMindfulMinutes: Math.round(mindfulMinutes / 60000),
  };
}

export function getCurrentWeekRange(): TimeRange {
  return {
    start: getStartOfWeek().getTime(),
    end: getEndOfWeek().getTime(),
  };
}

export function getPreviousWeekRange(): TimeRange {
  return {
    start: getStartOfWeek(-1).getTime(),
    end: getEndOfWeek(-1).getTime(),
  };
}

export async function getTodayStats(): Promise<{
  pauses: number;
  choseCalmCount: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const counts = await getEventCountsByAction(today.getTime(), endOfDay.getTime());
  const openedAnyway = counts["opened_anyway"] || 0;
  const closedCount = counts["closed"] || 0;
  const choseCalmCount =
    (counts["alternative_breathe"] || 0) +
    (counts["alternative_reflect"] || 0) +
    (counts["alternative_grounding"] || 0) +
    (counts["alternative_exercise"] || 0) +
    (counts["alternative_prayer"] || 0) +
    closedCount;

  return {
    pauses: openedAnyway + choseCalmCount,
    choseCalmCount,
  };
}

export async function getWeeklyStats(range: TimeRange = getCurrentWeekRange()): Promise<WeeklyStats> {
  const counts = await getEventCountsByAction(range.start, range.end);
  const mindfulMs = await getTotalMindfulTime(range.start, range.end);
  return buildWeeklyStats(counts, mindfulMs);
}

export function getMonthRange(): TimeRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

export function getAllTimeRange(): TimeRange {
  return { start: 0, end: Date.now() };
}

export function getLast7DaysRange(): TimeRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start: start.getTime(), end: now.getTime() };
}

export function getWeeklySummaryText(
  current: WeeklyStats,
  previous: WeeklyStats
): string {
  const parts: string[] = [];

  const currentCalmRate =
    current.pausesTotal > 0
      ? Math.round(
          ((current.pausesTotal - current.openedAnyway) / current.pausesTotal) *
            100
        )
      : 0;
  const previousCalmRate =
    previous.pausesTotal > 0
      ? Math.round(
          ((previous.pausesTotal - previous.openedAnyway) /
            previous.pausesTotal) *
            100
        )
      : 0;
  const calmDelta = currentCalmRate - previousCalmRate;

  if (calmDelta > 0) {
    parts.push(`Your calm rate improved ${calmDelta}% this week`);
  } else if (calmDelta < 0) {
    parts.push(
      `Your calm rate dipped ${Math.abs(calmDelta)}% this week — that's okay, every week is a fresh start`
    );
  } else if (current.pausesTotal > 0) {
    parts.push(`You maintained a ${currentCalmRate}% calm rate this week`);
  }

  const minutesDelta =
    current.totalMindfulMinutes - previous.totalMindfulMinutes;
  if (minutesDelta > 0 && previous.totalMindfulMinutes > 0) {
    const ratio = Math.round(
      current.totalMindfulMinutes / previous.totalMindfulMinutes
    );
    if (ratio >= 2) {
      parts.push(
        `You logged ${current.totalMindfulMinutes} mindful minutes — ${ratio}x last week`
      );
    }
  }

  if (parts.length === 0 && current.pausesTotal === 0) {
    return "No pauses recorded this week. Open a protected app to start building your streak.";
  }

  return parts.join(". ") + ".";
}

export async function getSevenDayTrend(
  range: TimeRange = getCurrentWeekRange()
): Promise<{ date: string; count: number }[]> {
  const events = await getEventsByDateRange(range.start, range.end);
  const trend: Record<string, number> = {};
  const start = new Date(range.start);

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    date.setHours(0, 0, 0, 0);
    trend[getDateKey(date)] = 0;
  }

  events.forEach((event) => {
    const eventDate = new Date(event.ts);
    eventDate.setHours(0, 0, 0, 0);
    const key = getDateKey(eventDate);
    if (trend[key] !== undefined) {
      trend[key] += 1;
    }
  });

  return Object.entries(trend).map(([date, count]) => ({ date, count }));
}
