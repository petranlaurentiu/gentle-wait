export const MAX_USER_MESSAGE_CHARS = 500;
export const MAX_CONVERSATION_MESSAGES = 6;
export const MAX_SELECTED_APPS = 3;
export const MAX_JOURNAL_ENTRIES = 2;
export const MAX_JOURNAL_ENTRY_CHARS = 200;
export const MAX_RESPONSE_TOKENS = 180;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
  quotaRemainingDay?: number;
  quotaRemainingMonth?: number;
  resetAt?: number;
  limitedReason?: "daily_limit" | "monthly_limit" | "cooldown";
}

export interface UserContext {
  userName?: string;
  ageRange?: string;
  goals?: string[];
  emotions?: string[];
  dailyScreenTimeHours?: number;
  targetScreenTimeHours?: number;
  selectedApps?: string[];
  pauseDurationSec?: number;
  todayPauses?: number;
  weeklyPauses?: number;
  weeklyMindfulMinutes?: number;
  weeklyOpenedAnyway?: number;
  weeklyChoseCalm?: number;
  recentJournalEntries?: string[];
}

export interface AssistantApiRequest {
  message: string;
  conversation?: ChatMessage[];
  contextSnapshot?: UserContext;
  deviceInstallId?: string;
  premium?: boolean;
}

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function sanitizeUserMessage(message: string) {
  return truncateText(message.trim(), MAX_USER_MESSAGE_CHARS);
}

export function sanitizeConversationHistory(messages: ChatMessage[] = []) {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-MAX_CONVERSATION_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: truncateText(message.content.trim(), MAX_USER_MESSAGE_CHARS),
    }));
}

export function sanitizeUserContext(context?: UserContext): UserContext | undefined {
  if (!context) {
    return undefined;
  }

  return {
    ...context,
    selectedApps: context.selectedApps?.slice(0, MAX_SELECTED_APPS),
    recentJournalEntries: context.recentJournalEntries
      ?.slice(0, MAX_JOURNAL_ENTRIES)
      .map((entry) => truncateText(entry.trim(), MAX_JOURNAL_ENTRY_CHARS)),
  };
}

const BASE_SYSTEM_PROMPT = `You are a compassionate and supportive AI wellness coach within GentleWait, a mindfulness app that helps users pause before opening distracting apps.

Your role is to:
- Help users understand their screen time habits with empathy, not judgment
- Suggest mindful alternatives to scrolling (breathing, movement, journaling)
- Provide encouragement and motivation during difficult moments
- Share brief, actionable tips for building better digital habits
- Celebrate small wins and progress

Guidelines:
- Keep responses concise (2-4 sentences max)
- Be warm, understanding, and non-judgmental
- Use simple, friendly language
- Suggest practical, quick exercises (30 seconds to 2 minutes)
- Focus on the present moment, not past failures
- Never shame the user for their habits
- If you know the user's name, use it occasionally to make responses more personal
- Reference their goals and progress when relevant

Remember: The user is trying to improve their relationship with technology. Every pause is a victory worth celebrating.`;

export function buildSystemPrompt(context?: UserContext) {
  if (!context) return BASE_SYSTEM_PROMPT;

  const contextParts: string[] = [BASE_SYSTEM_PROMPT, "\n\n--- USER CONTEXT ---"];

  if (context.userName) {
    contextParts.push(`The user's name is ${context.userName}.`);
  }

  if (context.ageRange) {
    contextParts.push(`They are in the ${context.ageRange} age range.`);
  }

  if (context.goals && context.goals.length > 0) {
    contextParts.push(`Their goals are: ${context.goals.join(", ")}.`);
  }

  if (context.emotions && context.emotions.length > 0) {
    contextParts.push(
      `After scrolling, they typically feel: ${context.emotions.join(", ")}.`,
    );
  }

  if (context.dailyScreenTimeHours) {
    contextParts.push(
      `They currently spend about ${context.dailyScreenTimeHours} hours daily on their phone.`,
    );
    if (context.targetScreenTimeHours) {
      contextParts.push(
        `They want to reduce this to ${context.targetScreenTimeHours} hours.`,
      );
    }
  }

  if (context.selectedApps && context.selectedApps.length > 0) {
    contextParts.push(
      `Apps they're trying to use more mindfully: ${context.selectedApps.join(", ")}.`,
    );
  }

  if (context.pauseDurationSec) {
    contextParts.push(
      `Their pause duration is set to ${context.pauseDurationSec} seconds.`,
    );
  }

  if (context.todayPauses !== undefined) {
    if (context.todayPauses === 0) {
      contextParts.push("They haven't had any mindful pauses today yet.");
    } else {
      contextParts.push(
        `Today they've had ${context.todayPauses} mindful pause${
          context.todayPauses !== 1 ? "s" : ""
        }.`,
      );
    }
  }

  if (context.weeklyPauses !== undefined) {
    contextParts.push(`This week: ${context.weeklyPauses} total pauses.`);
  }

  if (
    context.weeklyMindfulMinutes !== undefined &&
    context.weeklyMindfulMinutes > 0
  ) {
    contextParts.push(
      `They've accumulated ${context.weeklyMindfulMinutes} mindful minutes this week.`,
    );
  }

  if (
    context.weeklyChoseCalm !== undefined &&
    context.weeklyOpenedAnyway !== undefined
  ) {
    const total = context.weeklyChoseCalm + context.weeklyOpenedAnyway;
    if (total > 0) {
      const calmRate = Math.round((context.weeklyChoseCalm / total) * 100);
      contextParts.push(
        `${calmRate}% of the time, they choose a mindful alternative over opening the app.`,
      );
    }
  }

  if (context.recentJournalEntries && context.recentJournalEntries.length > 0) {
    contextParts.push(
      `\nRecent journal reflections from the user:\n${context.recentJournalEntries
        .map((entry, index) => `${index + 1}. "${entry}"`)
        .join("\n")}`,
    );
  }

  contextParts.push("--- END USER CONTEXT ---");

  return contextParts.join("\n");
}
