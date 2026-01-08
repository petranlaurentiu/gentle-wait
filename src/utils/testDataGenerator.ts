/**
 * Test Data Generator
 *
 * Utility to generate mock event data for development and testing.
 * Helps verify stats, insights, and analytics features without manual interaction.
 *
 * Usage:
 * ```typescript
 * import { generateTestEvents } from '@/src/utils/testDataGenerator';
 *
 * // Generate 30 test events over the last 7 days
 * await generateTestEvents(30);
 * ```
 */
import { insertEvent } from '@/src/services/storage/sqlite';
import { InterceptionEvent } from '@/src/domain/models';

const TEST_APPS = [
  { packageName: 'com.instagram.android', label: 'Instagram' },
  { packageName: 'com.facebook.katana', label: 'Facebook' },
  { packageName: 'com.twitter.android', label: 'Twitter' },
  { packageName: 'com.tiktok.client', label: 'TikTok' },
  { packageName: 'com.reddit.frontpage', label: 'Reddit' },
];

const TEST_REASONS = ['relax', 'connect', 'distraction', 'info', 'habit', 'unsure'] as const;

const TEST_ACTIONS = [
  'opened_anyway',
  'closed',
  'alternative_breathe',
  'alternative_reflect',
  'alternative_grounding',
] as const;

/**
 * Generate random test events for the last N days
 *
 * @param count - Number of events to generate (default: 20)
 * @param days - Number of past days to spread events across (default: 7)
 */
export async function generateTestEvents(count: number = 20, days: number = 7) {
  console.log(`[Test Data] Generating ${count} test events over ${days} days...`);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const startTime = now - days * dayMs;

  const events: InterceptionEvent[] = [];

  for (let i = 0; i < count; i++) {
    // Random timestamp within the date range
    const randomOffset = Math.random() * (now - startTime);
    const ts = startTime + randomOffset;

    // Random app
    const app = TEST_APPS[Math.floor(Math.random() * TEST_APPS.length)];

    // Random action
    const action = TEST_ACTIONS[Math.floor(Math.random() * TEST_ACTIONS.length)];

    // Random reason (only for some actions)
    const reason =
      Math.random() > 0.3 ? TEST_REASONS[Math.floor(Math.random() * TEST_REASONS.length)] : undefined;

    // Random duration for alternatives (0-60 seconds in ms)
    const durationMs =
      action.startsWith('alternative_') ? Math.floor(Math.random() * 60000) : undefined;

    const event: InterceptionEvent = {
      id: `test-${i}-${Date.now()}`,
      ts: Math.floor(ts),
      appPackage: app.packageName,
      appLabel: app.label,
      action,
      reason,
      durationMs,
      sessionId: `session-${Math.floor(i / 3)}`, // Group ~3 events per session
    };

    events.push(event);

    // Insert with slight delay to avoid database locks
    try {
      await insertEvent(event);
    } catch (error) {
      console.error(`[Test Data] Error inserting event ${i}:`, error);
    }
  }

  console.log(`[Test Data] ✓ Generated ${count} test events`);
  console.log('[Test Data] Check Insights tab to see stats');

  return events;
}

/**
 * Generate a single event (for manual testing)
 */
export async function generateSingleEvent(overrides: Partial<InterceptionEvent> = {}) {
  const app = TEST_APPS[Math.floor(Math.random() * TEST_APPS.length)];
  const action = TEST_ACTIONS[Math.floor(Math.random() * TEST_ACTIONS.length)];

  const event: InterceptionEvent = {
    id: `test-${Date.now()}`,
    ts: Date.now(),
    appPackage: app.packageName,
    appLabel: app.label,
    action,
    reason: Math.random() > 0.3 ? TEST_REASONS[Math.floor(Math.random() * TEST_REASONS.length)] : undefined,
    durationMs: action.startsWith('alternative_') ? Math.floor(Math.random() * 60000) : undefined,
    ...overrides,
  };

  await insertEvent(event);
  console.log('[Test Data] ✓ Generated event:', event);

  return event;
}

/**
 * Generate events distributed across different times of day
 * Useful for testing trend charts and daily stats
 */
export async function generateDailyEvents(daysBack: number = 7, eventsPerDay: number = 3) {
  console.log(`[Test Data] Generating ${eventsPerDay} events per day for ${daysBack} days...`);

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (let day = daysBack; day >= 0; day--) {
    const dayStart = now - day * dayMs;

    for (let i = 0; i < eventsPerDay; i++) {
      // Spread events throughout the day
      const timeOffset = (dayMs / eventsPerDay) * i + Math.random() * (dayMs / eventsPerDay);
      const ts = dayStart + timeOffset;

      const app = TEST_APPS[Math.floor(Math.random() * TEST_APPS.length)];
      const action = TEST_ACTIONS[Math.floor(Math.random() * TEST_ACTIONS.length)];

      const event: InterceptionEvent = {
        id: `test-daily-${day}-${i}-${Date.now()}`,
        ts: Math.floor(ts),
        appPackage: app.packageName,
        appLabel: app.label,
        action,
        reason: TEST_REASONS[Math.floor(Math.random() * TEST_REASONS.length)],
        durationMs: action.startsWith('alternative_') ? Math.floor(Math.random() * 60000) : undefined,
        sessionId: `session-${day}-${i}`,
      };

      try {
        await insertEvent(event);
      } catch (error) {
        console.error(`[Test Data] Error on day ${day}:`, error);
      }
    }
  }

  console.log(`[Test Data] ✓ Generated ${daysBack * eventsPerDay} daily events`);

  return {
    daysBack,
    eventsPerDay,
    total: daysBack * eventsPerDay,
  };
}

/**
 * Helper: Print summary of generated data
 */
export function printDataSummary(events: InterceptionEvent[]) {
  console.log('\n[Test Data] Summary:');
  console.log(`  Total events: ${events.length}`);

  // Count by action
  const actionCounts = events.reduce(
    (acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  console.log('  By action:', actionCounts);

  // Count by reason
  const reasonCounts = events.reduce(
    (acc, e) => {
      if (e.reason) {
        acc[e.reason] = (acc[e.reason] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );
  console.log('  By reason:', reasonCounts);

  // Count by app
  const appCounts = events.reduce(
    (acc, e) => {
      acc[e.appLabel] = (acc[e.appLabel] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  console.log('  By app:', appCounts);

  // Total mindful time
  const totalMindful = events
    .filter((e) => e.action.startsWith('alternative_'))
    .reduce((sum, e) => sum + (e.durationMs || 0), 0);
  console.log(`  Total mindful time: ${Math.round(totalMindful / 60000)} minutes`);
}
