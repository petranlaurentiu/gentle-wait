/**
 * SQLite storage service for events and analytics
 */
import * as SQLite from 'expo-sqlite';
import { InterceptionEvent, ReflectionReason } from '@/src/domain/models';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables
 */
export async function initializeDatabase() {
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

      CREATE INDEX IF NOT EXISTS idx_interception_ts ON interception_events(ts);
      CREATE INDEX IF NOT EXISTS idx_interception_appPackage ON interception_events(appPackage);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Insert an interception event
 */
export async function insertEvent(event: InterceptionEvent): Promise<void> {
  const database = getDb();
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
  const database = getDb();
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
  const database = getDb();
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
  const database = getDb();
  const results = await database.getAllAsync<{ reason: ReflectionReason; count: number }>(
    `SELECT reason, COUNT(*) as count FROM interception_events
     WHERE ts >= ? AND ts <= ? AND reason IS NOT NULL
     GROUP BY reason ORDER BY count DESC LIMIT ?`,
    [startTs, endTs, limit]
  );
  return results as { reason: string; count: number }[];
}

/**
 * Get total time spent in alternatives (in milliseconds)
 */
export async function getTotalMindfulTime(
  startTs: number,
  endTs: number
): Promise<number> {
  const database = getDb();
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
  const database = getDb();
  const cutoffTs = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  await database.runAsync(`DELETE FROM interception_events WHERE ts < ?`, [cutoffTs]);
}

/**
 * Delete all events
 */
export async function deleteAllEvents(): Promise<void> {
  const database = getDb();
  await database.runAsync(`DELETE FROM interception_events`);
}
