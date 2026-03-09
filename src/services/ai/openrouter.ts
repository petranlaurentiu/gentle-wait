import Constants from "expo-constants";
import { Platform } from "react-native";

import type { ChatMessage, ChatResponse, UserContext } from "@/src/services/ai/shared";
import {
  sanitizeConversationHistory,
  sanitizeUserContext,
  sanitizeUserMessage,
} from "@/src/services/ai/shared";

const AI_API_PATH = "/api/ai";
const REQUEST_TIMEOUT_MS = 15_000;

let currentUserContext: UserContext | null = null;

function getAiApiUrl() {
  const apiOrigin = Constants.expoConfig?.extra?.apiOrigin as string | undefined;
  if (Platform.OS === "web") {
    return AI_API_PATH;
  }

  if (apiOrigin) {
    return `${apiOrigin}${AI_API_PATH}`;
  }

  return AI_API_PATH;
}

export type { ChatMessage, ChatResponse, UserContext };

export function setUserContext(context: UserContext) {
  currentUserContext = sanitizeUserContext(context) ?? null;
}

export function getUserContext(): UserContext | null {
  return currentUserContext;
}

export async function sendMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: UserContext,
): Promise<ChatResponse> {
  const trimmedMessage = sanitizeUserMessage(userMessage);
  if (!trimmedMessage) {
    return {
      success: false,
      message: "",
      error: "Please enter a message first.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getAiApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: trimmedMessage,
        conversation: sanitizeConversationHistory(conversationHistory),
        contextSnapshot: sanitizeUserContext(context || currentUserContext || undefined),
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as ChatResponse;

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: "",
        error: data.error || "Unable to connect to AI. Please try again later.",
        limitedReason: data.limitedReason,
      };
    }

    return {
      success: true,
      message: data.message,
      quotaRemainingDay: data.quotaRemainingDay,
      quotaRemainingMonth: data.quotaRemainingMonth,
      resetAt: data.resetAt,
    };
  } catch (error) {
    return {
      success: false,
      message: "",
      error:
        error instanceof Error && error.name === "AbortError"
          ? "AI request timed out. Please try again."
          : error instanceof Error
            ? error.message
            : "Network error",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

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

  const fallbacks = [
    "Every pause is a small victory. You're building better habits, one moment at a time.",
    "Taking a breath before reaching for your phone is an act of self-care.",
    "You chose awareness over autopilot. That's powerful.",
    "This moment of pause is a gift to your future self.",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function getBreathingExercise(): Promise<string> {
  const response = await sendMessage(
    "Suggest a quick 30-second breathing exercise I can do right now. Be very brief.",
  );

  if (response.success) {
    return response.message;
  }

  return "Try box breathing: Breathe in for 4 seconds, hold for 4, breathe out for 4, hold for 4. Repeat twice.";
}

export async function getReflectionPrompt(): Promise<string> {
  const response = await sendMessage(
    "Give me one thoughtful journaling prompt about my relationship with technology. Make it simple and non-judgmental.",
  );

  if (response.success) {
    return response.message;
  }

  return "What emotion were you seeking when you reached for your phone just now?";
}

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

  return "Take a breath. Ask yourself: what do I really need right now? Often it's not what's on that screen.";
}
