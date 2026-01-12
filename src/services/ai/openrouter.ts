/**
 * OpenRouter AI Service
 * Provides AI-powered coaching and support for GentleWait
 *
 * Using: https://openrouter.ai/
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// API Key for OpenRouter
const API_KEY =
  "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";

// Free models with fallbacks - ordered by preference
const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free", // Primary - fast and reliable
  "google/gemma-3-27b-it:free", // Fallback 1 - good quality
  "mistralai/mistral-7b-instruct:free", // Fallback 2 - excellent for coaching
  "huggingfaceh4/zephyr-7b-beta:free", // Fallback 3
  "openchat/openchat-7b:free", // Fallback 4
];

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

// User context for personalized responses
export interface UserContext {
  userName?: string;
  goals?: string[];
  emotions?: string[];
  dailyScreenTimeHours?: number;
  targetScreenTimeHours?: number;
  selectedApps?: string[];
  pauseDurationSec?: number;
  // Stats
  todayPauses?: number;
  weeklyPauses?: number;
  weeklyMindfulMinutes?: number;
  weeklyOpenedAnyway?: number;
  weeklyChoseCalm?: number;
}

// Base system prompt for the AI assistant
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

/**
 * Build personalized system prompt with user context
 */
function buildSystemPrompt(context?: UserContext): string {
  if (!context) return BASE_SYSTEM_PROMPT;

  const contextParts: string[] = [
    BASE_SYSTEM_PROMPT,
    "\n\n--- USER CONTEXT ---",
  ];

  // Personal info
  if (context.userName) {
    contextParts.push(`The user's name is ${context.userName}.`);
  }

  // Goals
  if (context.goals && context.goals.length > 0) {
    contextParts.push(`Their goals are: ${context.goals.join(", ")}.`);
  }

  // How scrolling makes them feel
  if (context.emotions && context.emotions.length > 0) {
    contextParts.push(
      `After scrolling, they typically feel: ${context.emotions.join(", ")}.`
    );
  }

  // Screen time
  if (context.dailyScreenTimeHours) {
    contextParts.push(
      `They currently spend about ${context.dailyScreenTimeHours} hours daily on their phone.`
    );
    if (context.targetScreenTimeHours) {
      contextParts.push(
        `They want to reduce this to ${context.targetScreenTimeHours} hours.`
      );
    }
  }

  // Apps they're managing
  if (context.selectedApps && context.selectedApps.length > 0) {
    contextParts.push(
      `Apps they're trying to use more mindfully: ${context.selectedApps
        .slice(0, 5)
        .join(", ")}${
        context.selectedApps.length > 5
          ? ` and ${context.selectedApps.length - 5} more`
          : ""
      }.`
    );
  }

  // Pause settings
  if (context.pauseDurationSec) {
    contextParts.push(
      `Their pause duration is set to ${context.pauseDurationSec} seconds.`
    );
  }

  // Today's stats
  if (context.todayPauses !== undefined) {
    if (context.todayPauses === 0) {
      contextParts.push("They haven't had any mindful pauses today yet.");
    } else {
      contextParts.push(
        `Today they've had ${context.todayPauses} mindful pause${
          context.todayPauses !== 1 ? "s" : ""
        }.`
      );
    }
  }

  // Weekly stats
  if (context.weeklyPauses !== undefined) {
    contextParts.push(`This week: ${context.weeklyPauses} total pauses.`);
  }

  if (
    context.weeklyMindfulMinutes !== undefined &&
    context.weeklyMindfulMinutes > 0
  ) {
    contextParts.push(
      `They've accumulated ${context.weeklyMindfulMinutes} mindful minutes this week.`
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
        `${calmRate}% of the time, they choose a mindful alternative over opening the app.`
      );
    }
  }

  contextParts.push("--- END USER CONTEXT ---");

  return contextParts.join("\n");
}

// Store current user context
let currentUserContext: UserContext | null = null;

/**
 * Set the user context for personalized AI responses
 */
export function setUserContext(context: UserContext) {
  currentUserContext = context;
}

/**
 * Get the current user context
 */
export function getUserContext(): UserContext | null {
  return currentUserContext;
}

/**
 * Try a single model request
 */
async function tryModel(
  model: string,
  messages: ChatMessage[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://gentlewait.app",
        "X-Title": "GentleWait",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return { success: false, error: "No response from AI" };
    }

    return { success: true, message: assistantMessage.trim() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Send a message to the AI assistant with automatic fallback to other models
 */
export async function sendMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: UserContext
): Promise<ChatResponse> {
  // Use provided context, stored context, or no context
  const userContext = context || currentUserContext || undefined;
  const systemPrompt = buildSystemPrompt(userContext);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  // Try each model in order until one succeeds
  for (const model of FREE_MODELS) {
    console.log(`[AI] Trying model: ${model}`);
    const result = await tryModel(model, messages);

    if (result.success && result.message) {
      console.log(`[AI] Success with model: ${model}`);
      return {
        success: true,
        message: result.message,
      };
    }

    console.log(`[AI] Model ${model} failed: ${result.error}`);
  }

  // All models failed
  console.error("[AI] All models failed");
  return {
    success: false,
    message: "",
    error: "Unable to connect to AI. Please try again later.",
  };
}

/**
 * Get a quick motivational message
 */
export async function getMotivationalMessage(): Promise<string> {
  const prompts = [
    "Give me a one-sentence encouragement for choosing to pause instead of scrolling.",
    "Share a brief mindfulness tip for this moment.",
    "What's a quick way to reset my focus right now?",
    "Give me a gentle reminder about why pausing matters.",
  ];

  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  const response = await sendMessage(randomPrompt);

  if (response.success) {
    return response.message;
  }

  // Fallback messages if AI is unavailable
  const fallbacks = [
    "Every pause is a small victory. You're building better habits, one moment at a time.",
    "Taking a breath before reaching for your phone is an act of self-care.",
    "You chose awareness over autopilot. That's powerful.",
    "This moment of pause is a gift to your future self.",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Get a breathing exercise suggestion
 */
export async function getBreathingExercise(): Promise<string> {
  const response = await sendMessage(
    "Suggest a quick 30-second breathing exercise I can do right now. Be very brief."
  );

  if (response.success) {
    return response.message;
  }

  return "Try box breathing: Breathe in for 4 seconds, hold for 4, breathe out for 4, hold for 4. Repeat twice.";
}

/**
 * Get a reflection prompt for journaling
 */
export async function getReflectionPrompt(): Promise<string> {
  const response = await sendMessage(
    "Give me one thoughtful journaling prompt about my relationship with technology. Make it simple and non-judgmental."
  );

  if (response.success) {
    return response.message;
  }

  return "What emotion were you seeking when you reached for your phone just now?";
}

/**
 * Get personalized advice based on user's reason for opening the app
 */
export async function getPersonalizedAdvice(reason: string): Promise<string> {
  const reasonMessages: Record<string, string> = {
    relax:
      "I wanted to relax by opening a distracting app. What's a healthier way to unwind for 2 minutes?",
    connect:
      "I felt lonely and wanted to check social media. How can I feel more connected right now?",
    distraction:
      "I'm looking for a distraction. What's a quick mindful activity I can do instead?",
    info: "I wanted to check something on my phone. Help me pause and ask: is this urgent?",
    habit:
      "I automatically reached for my phone out of habit. How do I break this pattern?",
    unsure:
      "I'm not sure why I wanted to open this app. Help me understand what I might be feeling.",
  };

  const prompt = reasonMessages[reason] || reasonMessages.unsure;
  const response = await sendMessage(prompt);

  if (response.success) {
    return response.message;
  }

  // Fallback
  return "Take a breath. Ask yourself: what do I really need right now? Often it's not what's on that screen.";
}
