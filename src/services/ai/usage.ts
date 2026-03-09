import { mmkvStorage } from "@/src/services/storage/mmkv";

export const AI_DAILY_LIMIT = 25;
export const AI_MONTHLY_LIMIT = 300;
export const AI_COOLDOWN_MS = 12_000;

const AI_USAGE_KEY = "ai_usage_state";

export type AiLimitReason = "daily_limit" | "monthly_limit" | "cooldown" | null;
export type AiWarningLevel = "normal" | "elevated" | "critical" | "exhausted";

export interface AiUsageState {
  aiInstallId: string;
  aiDailyCount: number;
  aiDailyResetAt: number;
  aiMonthlyCount: number;
  aiMonthlyResetAt: number;
  aiLastSentAt: number;
}

export interface AiQuotaSnapshot {
  installId: string;
  remainingDay: number;
  remainingMonth: number;
  dailyCount: number;
  monthlyCount: number;
  cooldownRemainingMs: number;
  canSend: boolean;
  limitedReason: AiLimitReason;
  warningLevel: AiWarningLevel;
  dailyResetAt: number;
  monthlyResetAt: number;
}

function generateInstallId() {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getNextLocalDay(now: number) {
  const date = new Date(now);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
    0,
  ).getTime();
}

function getNextLocalMonth(now: number) {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0).getTime();
}

function getWarningLevel(remainingDay: number, remainingMonth: number): AiWarningLevel {
  if (remainingDay <= 0 || remainingMonth <= 0) {
    return "exhausted";
  }

  if (remainingDay <= 1 || remainingMonth <= 15) {
    return "critical";
  }

  if (remainingDay <= 5 || remainingMonth <= 60) {
    return "elevated";
  }

  return "normal";
}

function saveState(state: AiUsageState) {
  mmkvStorage.setJSON(AI_USAGE_KEY, state);
}

function normalizeState(state: Partial<AiUsageState> | undefined, now: number): AiUsageState {
  const nextDay = getNextLocalDay(now);
  const nextMonth = getNextLocalMonth(now);

  const normalized: AiUsageState = {
    aiInstallId: state?.aiInstallId || generateInstallId(),
    aiDailyCount: state?.aiDailyCount ?? 0,
    aiDailyResetAt: state?.aiDailyResetAt ?? nextDay,
    aiMonthlyCount: state?.aiMonthlyCount ?? 0,
    aiMonthlyResetAt: state?.aiMonthlyResetAt ?? nextMonth,
    aiLastSentAt: state?.aiLastSentAt ?? 0,
  };

  if (normalized.aiDailyResetAt <= now) {
    normalized.aiDailyCount = 0;
    normalized.aiDailyResetAt = nextDay;
  }

  if (normalized.aiMonthlyResetAt <= now) {
    normalized.aiMonthlyCount = 0;
    normalized.aiMonthlyResetAt = nextMonth;
  }

  saveState(normalized);
  return normalized;
}

export function getAiUsageState(now = Date.now()) {
  return normalizeState(mmkvStorage.getJSON<AiUsageState>(AI_USAGE_KEY), now);
}

export function getAiQuotaSnapshot(now = Date.now()): AiQuotaSnapshot {
  const state = getAiUsageState(now);
  const remainingDay = Math.max(0, AI_DAILY_LIMIT - state.aiDailyCount);
  const remainingMonth = Math.max(0, AI_MONTHLY_LIMIT - state.aiMonthlyCount);
  const cooldownRemainingMs = Math.max(0, state.aiLastSentAt + AI_COOLDOWN_MS - now);

  let limitedReason: AiLimitReason = null;
  if (remainingDay <= 0) {
    limitedReason = "daily_limit";
  } else if (remainingMonth <= 0) {
    limitedReason = "monthly_limit";
  } else if (cooldownRemainingMs > 0) {
    limitedReason = "cooldown";
  }

  return {
    installId: state.aiInstallId,
    remainingDay,
    remainingMonth,
    dailyCount: state.aiDailyCount,
    monthlyCount: state.aiMonthlyCount,
    cooldownRemainingMs,
    canSend: limitedReason === null,
    limitedReason,
    warningLevel: getWarningLevel(remainingDay, remainingMonth),
    dailyResetAt: state.aiDailyResetAt,
    monthlyResetAt: state.aiMonthlyResetAt,
  };
}

export function recordAiRequestAttempt(now = Date.now()) {
  const state = getAiUsageState(now);
  state.aiLastSentAt = now;
  saveState(state);
  return getAiQuotaSnapshot(now);
}

export function recordAiResponseSuccess(now = Date.now()) {
  const state = getAiUsageState(now);
  state.aiDailyCount += 1;
  state.aiMonthlyCount += 1;
  saveState(state);
  return getAiQuotaSnapshot(now);
}
