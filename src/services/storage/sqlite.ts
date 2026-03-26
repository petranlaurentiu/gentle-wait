/**
 * SQLite storage service for events and analytics
 */
import { InterceptionEvent, ReflectionReason } from '@/src/domain/models';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the database and create tables
 */
export async function initializeDatabase() {
  // If already initializing, wait for it
  if (initPromise) {
    return initPromise;
  }

  // If already initialized, return immediately
  if (db) {
    return Promise.resolve();
  }

  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync('gentlewait.db');

      // Create interception_events table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS interception_events (
          id TEXT PRIMARY KEY,
          ts INTEGER NOT NULL,
          appPackage TEXT NOT NULL,
          appLabel TEXT NOT NULL,
          action TEXT NOT NULL,
          reason TEXT,
          durationMs INTEGER,
          sessionId TEXT
        );

        -- Primary indexes for date-range queries (most common)
        CREATE INDEX IF NOT EXISTS idx_ts_desc ON interception_events(ts DESC);
        CREATE INDEX IF NOT EXISTS idx_ts_asc ON interception_events(ts ASC);

        -- App-specific queries
        CREATE INDEX IF NOT EXISTS idx_appPackage ON interception_events(appPackage);

        -- Action-based queries
        CREATE INDEX IF NOT EXISTS idx_action ON interception_events(action);

        -- Composite indexes for common query patterns
        CREATE INDEX IF NOT EXISTS idx_ts_action ON interception_events(ts DESC, action);
        CREATE INDEX IF NOT EXISTS idx_ts_reason ON interception_events(ts DESC, reason);
        CREATE INDEX IF NOT EXISTS idx_ts_appPackage ON interception_events(ts DESC, appPackage);

        -- Reason-based queries (for triggers/insights)
        CREATE INDEX IF NOT EXISTS idx_reason ON interception_events(reason);

        -- Journal entries table
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY,
          ts INTEGER NOT NULL,
          content TEXT NOT NULL,
          prompt TEXT,
          appPackage TEXT,
          appLabel TEXT
        );

        -- Index for recent entries
        CREATE INDEX IF NOT EXISTS idx_journal_ts_desc ON journal_entries(ts DESC);
      `);

      if (__DEV__) console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      db = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the database instance, ensuring it's initialized
 */
async function getDb(): Promise<SQLite.SQLiteDatabase> {
  // If not initialized, initialize now
  if (!db) {
    await initializeDatabase();
  }

  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }

  return db;
}

/**
 * Insert an interception event
 */
export async function insertEvent(event: InterceptionEvent): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO interception_events (id, ts, appPackage, appLabel, action, reason, durationMs, sessionId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.ts,
      event.appPackage,
      event.appLabel,
      event.action,
      event.reason || null,
      event.durationMs || null,
      event.sessionId || null,
    ]
  );
}

/**
 * Get events for a date range
 */
export async function getEventsByDateRange(
  startTs: number,
  endTs: number
): Promise<InterceptionEvent[]> {
  const database = await getDb();
  const results = await database.getAllAsync<InterceptionEvent>(
    `SELECT * FROM interception_events WHERE ts >= ? AND ts <= ? ORDER BY ts DESC`,
    [startTs, endTs]
  );
  return results;
}

/**
 * Get events for the last N days
 */
export async function getRecentEvents(days: number = 7): Promise<InterceptionEvent[]> {
  const now = Date.now();
  const startTs = now - days * 24 * 60 * 60 * 1000;
  return getEventsByDateRange(startTs, now);
}

/**
 * Get event count by action for a date range
 */
export async function getEventCountsByAction(
  startTs: number,
  endTs: number
): Promise<Record<string, number>> {
  const database = await getDb();
  const results = await database.getAllAsync<{ action: string; count: number }>(
    `SELECT action, COUNT(*) as count FROM interception_events
     WHERE ts >= ? AND ts <= ? GROUP BY action`,
    [startTs, endTs]
  );

  const counts: Record<string, number> = {};
  results.forEach((row) => {
    counts[row.action] = row.count;
  });
  return counts;
}

/**
 * Get top triggers (reasons) for a date range
 */
export async function getTopTriggers(
  startTs: number,
  endTs: number,
  limit: number = 5
): Promise<{ reason: string; count: number }[]> {
  const database = await getDb();
  const results = await database.getAllAsync<{ reason: ReflectionReason; count: number }>(
    `SELECT reason, COUNT(*) as count FROM interception_events
     WHERE ts >= ? AND ts <= ? AND reason IS NOT NULL
     GROUP BY reason ORDER BY count DESC LIMIT ?`,
    [startTs, endTs, limit]
  );
  return results as { reason: string; count: number }[];
}

/**
 * Get top apps by interception count for a date range
 */
export async function getTopApps(
  startTs: number,
  endTs: number,
  limit: number = 5
): Promise<{ appLabel: string; count: number }[]> {
  const database = await getDb();
  const results = await database.getAllAsync<{ appLabel: string; count: number }>(
    `SELECT appLabel, COUNT(*) as count FROM interception_events
     WHERE ts >= ? AND ts <= ?
     GROUP BY appLabel
     ORDER BY count DESC, appLabel ASC
     LIMIT ?`,
    [startTs, endTs, limit]
  );
  return results;
}

/**
 * Get total time spent in alternatives (in milliseconds)
 */
export async function getTotalMindfulTime(
  startTs: number,
  endTs: number
): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(durationMs), 0) as total FROM interception_events
     WHERE ts >= ? AND ts <= ? AND action LIKE 'alternative_%'`,
    [startTs, endTs]
  );
  return result?.total || 0;
}

/**
 * Clear events older than N days
 */
export async function clearOldEvents(daysToKeep: number = 30): Promise<void> {
  const database = await getDb();
  const cutoffTs = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  await database.runAsync(`DELETE FROM interception_events WHERE ts < ?`, [cutoffTs]);
}

/**
 * Delete all events
 */
export async function deleteAllEvents(): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM interception_events`);
}

// ==================== JOURNAL ENTRIES ====================

export interface JournalEntry {
  id: string;
  ts: number;
  content: string;
  prompt?: string;
  appPackage?: string;
  appLabel?: string;
}

/**
 * Insert a journal entry
 */
export async function insertJournalEntry(entry: JournalEntry): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO journal_entries (id, ts, content, prompt, appPackage, appLabel)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.ts,
      entry.content,
      entry.prompt || null,
      entry.appPackage || null,
      entry.appLabel || null,
    ]
  );
}

/**
 * Get recent journal entries
 */
export async function getRecentJournalEntries(
  limit: number = 10
): Promise<JournalEntry[]> {
  const database = await getDb();
  const results = await database.getAllAsync<JournalEntry>(
    `SELECT * FROM journal_entries ORDER BY ts DESC LIMIT ?`,
    [limit]
  );
  return results;
}

/**
 * Get journal entries for a date range
 */
export async function getJournalEntriesByDateRange(
  startTs: number,
  endTs: number
): Promise<JournalEntry[]> {
  const database = await getDb();
  const results = await database.getAllAsync<JournalEntry>(
    `SELECT * FROM journal_entries WHERE ts >= ? AND ts <= ? ORDER BY ts DESC`,
    [startTs, endTs]
  );
  return results;
}

/**
 * Delete a single journal entry by id
 */
export async function deleteJournalEntry(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM journal_entries WHERE id = ?`, [id]);
}

/**
 * Delete all journal entries
 */
export async function deleteAllJournalEntries(): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM journal_entries`);
}

// ==================== PREMIUM ANALYTICS QUERIES ====================

export interface PerAppBreakdown {
  appLabel: string;
  appPackage: string;
  totalPauses: number;
  calmCount: number;
  topReason: string | null;
}

/**
 * Get per-app breakdown with calm rate and top trigger
 */
export async function getPerAppBreakdown(
  startTs: number,
  endTs: number
): Promise<PerAppBreakdown[]> {
  const database = await getDb();
  const results = await database.getAllAsync<{
    appLabel: string;
    appPackage: string;
    totalPauses: number;
    calmCount: number;
  }>(
    `SELECT appLabel, appPackage,
            COUNT(*) as totalPauses,
            SUM(CASE WHEN action != 'opened_anyway' THEN 1 ELSE 0 END) as calmCount
     FROM interception_events
     WHERE ts >= ? AND ts <= ?
     GROUP BY appPackage
     ORDER BY totalPauses DESC`,
    [startTs, endTs]
  );

  // Get top reason per app in a second pass (simpler than correlated subquery)
  const breakdown: PerAppBreakdown[] = [];
  for (const row of results) {
    const reasonResult = await database.getFirstAsync<{ reason: string }>(
      `SELECT reason FROM interception_events
       WHERE appPackage = ? AND ts >= ? AND ts <= ? AND reason IS NOT NULL
       GROUP BY reason ORDER BY COUNT(*) DESC LIMIT 1`,
      [row.appPackage, startTs, endTs]
    );
    breakdown.push({
      ...row,
      topReason: reasonResult?.reason || null,
    });
  }
  return breakdown;
}

/**
 * Get hourly heatmap data (7x24 matrix of pause counts)
 * Returns a 7-element array (Sun-Sat), each containing a 24-element array (hours)
 */
export async function getHourlyHeatmapData(
  startTs: number,
  endTs: number
): Promise<number[][]> {
  const database = await getDb();
  const events = await database.getAllAsync<{ ts: number }>(
    `SELECT ts FROM interception_events WHERE ts >= ? AND ts <= ?`,
    [startTs, endTs]
  );

  // Initialize 7x24 matrix (Sun=0 through Sat=6)
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0)
  );

  for (const event of events) {
    const date = new Date(event.ts);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const hour = date.getHours();
    matrix[dayOfWeek][hour]++;
  }

  return matrix;
}

export interface WeeklyCalmRatePoint {
  weekLabel: string; // e.g., "Mar 10"
  calmRate: number; // 0-100
  totalPauses: number;
}

/**
 * Get weekly calm rate trend over a date range
 */
export async function getWeeklyCalmRateTrend(
  startTs: number,
  endTs: number
): Promise<WeeklyCalmRatePoint[]> {
  const events = await getEventsByDateRange(startTs, endTs);

  // Bucket events by ISO week
  const weekBuckets: Record<string, { total: number; calm: number; weekStart: Date }> = {};

  for (const event of events) {
    const date = new Date(event.ts);
    // Get Monday of this week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);

    if (!weekBuckets[key]) {
      weekBuckets[key] = { total: 0, calm: 0, weekStart: monday };
    }
    weekBuckets[key].total++;
    if (event.action !== 'opened_anyway') {
      weekBuckets[key].calm++;
    }
  }

  return Object.entries(weekBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => {
      const month = bucket.weekStart.toLocaleDateString('en-US', { month: 'short' });
      const day = bucket.weekStart.getDate();
      return {
        weekLabel: `${month} ${day}`,
        calmRate: bucket.total > 0 ? Math.round((bucket.calm / bucket.total) * 100) : 0,
        totalPauses: bucket.total,
      };
    });
}

/**
 * Get total journal entry count
 */
export async function getJournalEntryCount(): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM journal_entries`
  );
  return result?.count || 0;
}

/**
 * Get distinct dates where an alternative action was chosen
 */
export async function getDaysWithAlternativeChosen(
  startTs: number,
  endTs: number
): Promise<string[]> {
  const database = await getDb();
  const events = await database.getAllAsync<{ ts: number }>(
    `SELECT DISTINCT ts FROM interception_events
     WHERE ts >= ? AND ts <= ? AND action LIKE 'alternative_%'
     ORDER BY ts ASC`,
    [startTs, endTs]
  );

  // Extract unique dates in JS (timezone-safe)
  const dates = new Set<string>();
  for (const event of events) {
    const date = new Date(event.ts);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dates.add(key);
  }
  return Array.from(dates).sort();
}
