/**
 * Web stub for SQLite - uses MMKV in-memory storage
 * Full SQLite implementation only available on native (Android/iOS)
 */
import { mmkvStorage } from './mmkv';

/**
 * Web stub: Initialize the database (no-op on web)
 */
export async function initializeDatabase() {
  console.log('Note: SQLite not available on web. Using MMKV for event storage.');
  return;
}

/**
 * Web stub: Insert an event to MMKV
 */
export async function insertEvent(event: any): Promise<void> {
  try {
    const events = mmkvStorage.getJSON('events') || [];
    events.push(event);
    mmkvStorage.setJSON('events', events);
  } catch (error) {
    console.error('Error inserting event:', error);
  }
}

/**
 * Web stub: Get events by date range
 */
export async function getEventsByDateRange(
  startTs: number,
  endTs: number
): Promise<any[]> {
  try {
    const events = mmkvStorage.getJSON('events') || [];
    return events.filter((e: any) => e.ts >= startTs && e.ts <= endTs);
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

/**
 * Web stub: Get recent events
 */
export async function getRecentEvents(days: number = 7): Promise<any[]> {
  const now = Date.now();
  const startTs = now - days * 24 * 60 * 60 * 1000;
  return getEventsByDateRange(startTs, now);
}

/**
 * Web stub: Get event counts by action
 */
export async function getEventCountsByAction(
  startTs: number,
  endTs: number
): Promise<Record<string, number>> {
  try {
    const events = await getEventsByDateRange(startTs, endTs);
    const counts: Record<string, number> = {};
    events.forEach((event: any) => {
      counts[event.action] = (counts[event.action] || 0) + 1;
    });
    return counts;
  } catch (error) {
    console.error('Error getting event counts:', error);
    return {};
  }
}

/**
 * Web stub: Get top triggers
 */
export async function getTopTriggers(
  startTs: number,
  endTs: number,
  limit: number = 5
): Promise<{ reason: string; count: number }[]> {
  try {
    const events = await getEventsByDateRange(startTs, endTs);
    const reasons: Record<string, number> = {};

    events.forEach((event: any) => {
      if (event.reason) {
        reasons[event.reason] = (reasons[event.reason] || 0) + 1;
      }
    });

    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting triggers:', error);
    return [];
  }
}

/**
 * Web stub: Get total mindful time
 */
export async function getTotalMindfulTime(
  startTs: number,
  endTs: number
): Promise<number> {
  try {
    const events = await getEventsByDateRange(startTs, endTs);
    let total = 0;
    events.forEach((event: any) => {
      if (event.action.startsWith('alternative_') && event.durationMs) {
        total += event.durationMs;
      }
    });
    return total;
  } catch (error) {
    console.error('Error getting mindful time:', error);
    return 0;
  }
}

/**
 * Web stub: Clear old events
 */
export async function clearOldEvents(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffTs = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const events = mmkvStorage.getJSON('events') || [];
    const filtered = events.filter((e: any) => e.ts >= cutoffTs);
    mmkvStorage.setJSON('events', filtered);
  } catch (error) {
    console.error('Error clearing old events:', error);
  }
}

/**
 * Web stub: Delete all events
 */
export async function deleteAllEvents(): Promise<void> {
  try {
    mmkvStorage.delete('events');
  } catch (error) {
    console.error('Error deleting all events:', error);
  }
}

// ==================== JOURNAL ENTRIES (Web stubs) ====================

export interface JournalEntry {
  id: string;
  ts: number;
  content: string;
  prompt?: string;
  appPackage?: string;
  appLabel?: string;
}

export async function insertJournalEntry(entry: JournalEntry): Promise<void> {
  try {
    const entries = mmkvStorage.getJSON('journal_entries') || [];
    entries.push(entry);
    mmkvStorage.setJSON('journal_entries', entries);
  } catch (error) {
    console.error('Error inserting journal entry:', error);
  }
}

export async function getRecentJournalEntries(
  limit: number = 10
): Promise<JournalEntry[]> {
  try {
    const entries: JournalEntry[] = mmkvStorage.getJSON('journal_entries') || [];
    return entries.sort((a, b) => b.ts - a.ts).slice(0, limit);
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
}

export async function getJournalEntriesByDateRange(
  startTs: number,
  endTs: number
): Promise<JournalEntry[]> {
  try {
    const entries: JournalEntry[] = mmkvStorage.getJSON('journal_entries') || [];
    return entries
      .filter((e) => e.ts >= startTs && e.ts <= endTs)
      .sort((a, b) => b.ts - a.ts);
  } catch (error) {
    console.error('Error getting journal entries by date range:', error);
    return [];
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    const entries: JournalEntry[] = mmkvStorage.getJSON('journal_entries') || [];
    mmkvStorage.setJSON('journal_entries', entries.filter((e) => e.id !== id));
  } catch (error) {
    console.error('Error deleting journal entry:', error);
  }
}

export async function deleteAllJournalEntries(): Promise<void> {
  try {
    mmkvStorage.delete('journal_entries');
  } catch (error) {
    console.error('Error deleting journal entries:', error);
  }
}
