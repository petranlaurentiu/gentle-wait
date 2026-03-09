import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  buildSystemPrompt,
  MAX_RESPONSE_TOKENS,
  sanitizeConversationHistory,
  sanitizeUserContext,
  sanitizeUserMessage,
} from "@/src/services/ai/shared";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";
const API_TIMEOUT_MS = 15_000;

type OpenRouterSuccessResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

function readEnvFileValue(key: string) {
  const envFiles = [".env.local", ".env"];

  for (const fileName of envFiles) {
    const filePath = path.join(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const contents = readFileSync(filePath, "utf8");
    const lines = contents.split(/\r?\n/);

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const currentKey = trimmedLine.slice(0, separatorIndex).trim();
      if (currentKey !== key) {
        continue;
      }

      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      return rawValue.replace(/^['"]|['"]$/g, "");
    }
  }

  return "";
}

function getOpenRouterApiKey() {
  return process.env.OPENROUTER_API_KEY || readEnvFileValue("OPENROUTER_API_KEY");
}

export async function POST(request: Request) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return jsonResponse(
      {
        success: false,
        error: "AI server is not configured. Missing OPENROUTER_API_KEY.",
      },
      503,
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON payload." }, 400);
  }

  const userMessage =
    typeof payload.message === "string" ? sanitizeUserMessage(payload.message) : "";

  if (!userMessage) {
    return jsonResponse({ success: false, error: "Message is required." }, 400);
  }

  const conversation = Array.isArray(payload.conversation)
    ? sanitizeConversationHistory(payload.conversation as never[])
    : [];

  const contextSnapshot =
    payload.contextSnapshot && typeof payload.contextSnapshot === "object"
      ? sanitizeUserContext(payload.contextSnapshot as never)
      : undefined;

  const messages = [
    {
      role: "system" as const,
      content: buildSystemPrompt(contextSnapshot),
    },
    ...conversation,
    {
      role: "user" as const,
      content: userMessage,
    },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "GentleWait",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: MAX_RESPONSE_TOKENS,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return jsonResponse(
        {
          success: false,
          error:
            errorData.error?.message ||
            `OpenRouter error (${response.status}). Please try again.`,
        },
        response.status,
      );
    }

    const data = (await response.json()) as OpenRouterSuccessResponse;
    const assistantMessage = data.choices?.[0]?.message?.content?.trim();

    if (!assistantMessage) {
      return jsonResponse(
        { success: false, error: "AI returned an empty response." },
        502,
      );
    }

    return jsonResponse({
      success: true,
      message: assistantMessage,
      model: MODEL,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonResponse(
        { success: false, error: "AI request timed out. Please try again." },
        504,
      );
    }

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      },
      500,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
