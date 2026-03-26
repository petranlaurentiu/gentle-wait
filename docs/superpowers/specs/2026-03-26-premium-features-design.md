# Premium Features Design: Streaks, Analytics, Smart Nudges

## Context

GentleWait Pro currently offers 3 premium features: unlimited protected apps, AI Companion, and basic premium insights. At $4.99/mo, the value proposition feels thin — the AI Companion carries most of the weight, and the "deeper insights" are a marginal improvement over free analytics. This design adds 3 high-impact features to strengthen conversions, reduce churn, and justify the price — all local-only, no backend required.

---

## Feature 1: Streak System + Achievement Badges

### Streak Mechanic

- A streak increments each calendar day the user chooses at least 1 alternative (breathe, journal, ground, exercise, pray) instead of opening an app
- Only days with at least 1 triggered pause count — days with no app opens do NOT break the streak
- Streak resets to 0 if a pause-triggered day passes with no alternative chosen
- Displayed prominently on the home screen (flame icon + count)

### Streak Freeze (Premium Only)

- 1 freeze per week, auto-applied if the user misses a day
- Freeze count resets every Monday (based on device locale)
- Visual indicator: "Saved by streak freeze" badge on the day

### Achievement Badges

Unlockable badges displayed in a dedicated badges screen, accessible from the home screen.

**Badge categories:**

| Category | Milestones |
|----------|-----------|
| Streak | 3, 7, 14, 30, 60, 90, 180, 365 days |
| Mindful minutes | 30min, 1hr, 5hr, 10hr, 24hr, 50hr cumulative |
| Journal entries | 5, 10, 25, 50, 100 entries |
| Calm rate | >50%, >70%, >90% sustained for 7 days |
| Variety | Used all 6 alternative types at least once |

Each badge has: `id`, `name`, `icon`, `description`, `unlockedAt` (null if locked).

Badge unlock triggers a celebratory animation (Reanimated spring + confetti-style particles).

### Premium Gate

- **Free users:** See streak counter (no freeze), 3 starter badges (3-day streak, 30min mindful, variety)
- **Premium users:** Streak freeze + full badge collection (25+ badges)

### Data Model (MMKV)

```typescript
// Streak state
currentStreak: number
longestStreak: number
lastStreakDate: string        // ISO date "2026-03-26"
freezesUsedThisWeek: number
freezeWeekStart: string       // ISO date of Monday

// Badges
unlockedBadges: Array<{ id: string; unlockedAt: number }>
```

Badge definitions are constants in code (`src/data/badges.ts`), not stored in DB.

### Streak Calculation Logic

On app open or after a pause event:
1. Query today's interception events from SQLite
2. Check if any event has an alternative action
3. If yes and `lastStreakDate !== today`: increment streak, update date
4. On next day open: if `lastStreakDate` is yesterday, streak continues. If `lastStreakDate` is 2 days ago and freeze available, apply freeze (decrement freezes, set `lastStreakDate` to yesterday). If `lastStreakDate` is 3+ days ago, reset streak to 0 regardless of freeze (freeze only covers 1 missed day).

### Files to Modify/Create

- `src/data/badges.ts` — badge definitions (new)
- `src/services/streaks/index.ts` — streak logic (new)
- `app/home.tsx` — streak display + daily nudge card
- `app/badges.tsx` — badges screen (new)
- `src/services/storage/store.ts` — add streak/badge state to Zustand

---

## Feature 2: Advanced Analytics Dashboard

### Current State (Free Tier)

Weekly stats: total pauses, calm count, mindful minutes, 7-day trend, top 4 triggers, top 4 apps.

### Premium Additions

#### Time Range Selector

- Options: This week / This month / All time
- Picker at top of insights screen
- Free users locked to "This week"

#### Per-App Breakdown

- Horizontal bar chart for each protected app showing:
  - Total pauses triggered
  - Calm rate (% chose alternative) with color coding (red < 50%, yellow 50-70%, green > 70%)
  - Most common trigger reason per app
- Sorted by pause count descending

#### Hourly Heatmap

- 7x24 grid: days of week (columns) x hours of day (rows)
- Color intensity = pause frequency
- Derived from `ts` field on interception events (group by `dayOfWeek` and `hour`)
- Reveals time-based patterns

#### Calm Rate Trend

- Line chart showing weekly calm rate over the selected time range
- X-axis: weeks, Y-axis: calm rate %
- Shows improvement trajectory

#### Weekly Summary Card

Auto-generated text (no AI, pure template logic):
- Compare this week vs last week
- Highlight: calm rate change, mindful minutes change, biggest trigger app
- Example: "Your calm rate improved 12% this week. Instagram was your biggest trigger but you resisted 80% of the time."

### Premium Gate

- Free users see blurred preview cards with "Unlock with Pro" overlay
- Premium users see full interactive analytics

### Data Model

No new storage — all derived from existing `interception_events` SQLite table via new query functions.

### Files to Modify/Create

- `src/services/stats/index.ts` — add monthly/all-time/hourly/per-app queries
- `app/insights.tsx` — add premium analytics sections
- `src/components/charts/` — heatmap and bar chart components (new, using Reanimated for animations)

---

## Feature 3: Smart Daily Nudges via AI

### Concept

One AI-generated personalized insight per day on the home screen. Low cost (1 API call/day), high perceived value.

### Flow

1. User opens app
2. App checks MMKV for today's nudge (`dailyNudge.date === today`)
3. If no nudge exists and user is premium:
   a. Gather last 7 days stats: calm rate, top triggers, top apps, streak, total pauses, mindful minutes
   b. Send to OpenRouter API (same service as AI Companion)
   c. AI returns 1-2 sentence insight + actionable suggestion
   d. Cache in MMKV with today's date
4. Display nudge card on home screen

### AI Prompt

```
You are a mindful screen time coach. Based on this user's last 7 days:
- Calm rate: {calmRate}%
- Total pauses: {totalPauses}
- Mindful minutes: {mindfulMinutes}
- Top trigger: {topTrigger}
- Top app: {topApp}
- Current streak: {streak} days
- Trend: {improving/declining/stable}

Write ONE personalized insight (1-2 sentences). Be specific, warm, and actionable.
Do not use generic advice. Reference their actual data.
```

### Example Outputs

- "You opened Instagram 12 times yesterday, mostly from boredom. Try keeping a book next to your phone tonight."
- "Your calm rate jumped to 85% — your best week yet. Breathing exercises seem to be your go-to."
- "You reach for social media most between 9-11pm. Consider charging your phone in another room after 9."

### UI

- Card below streak counter on home screen
- Sparkle icon indicating AI-generated
- Tappable to dismiss
- "View past nudges" link showing last 7 days

### Premium Gate

- Free users: locked nudge card with "Unlock daily AI insights with Pro"
- Premium users: daily nudge + 7-day history

### Cost

- 1 API call/day per active premium user
- ~100 tokens in, ~50 tokens out
- Negligible vs AI Companion's 25/day allowance

### Data Model (MMKV)

```typescript
dailyNudge: {
  date: string          // ISO date
  text: string          // nudge content
  dismissed: boolean
}
nudgeHistory: Array<{
  date: string
  text: string
}>  // last 7 entries, FIFO
```

### Files to Modify/Create

- `src/services/ai/nudges.ts` — nudge generation logic (new)
- `app/home.tsx` — nudge card display
- `src/services/storage/store.ts` — add nudge state

---

## Updated Paywall Messaging

Current benefits list:
1. "Unlimited protected apps"
2. "AI Companion & guided reflection"
3. "Premium insights & personalization"

Updated to:
1. "Unlimited protected apps"
2. "AI Companion & daily smart nudges"
3. "Streaks, badges & advanced analytics"

Updated pitch: "Unlock unlimited apps, streaks with freeze protection, detailed analytics, AI-powered daily insights, and 25+ achievement badges with GentleWait Pro."

---

## Verification Plan

1. **Streaks:** Trigger a pause, choose an alternative, verify streak increments. Skip a day, verify freeze applies (premium) or streak resets (free). Check badge unlock animation triggers at thresholds.
2. **Analytics:** Generate test interception events across multiple days/hours/apps. Verify heatmap renders correctly, per-app breakdown shows accurate calm rates, time range selector filters data properly.
3. **Nudges:** Mock 7 days of stats, trigger nudge generation, verify AI call fires once per day and result is cached. Verify free users see locked state. Verify nudge history stores last 7 entries.
4. **Premium gate:** Toggle `settings.premium` off and verify all 3 features show appropriate locked/upgrade UI.
