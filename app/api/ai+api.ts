import { createHmac, timingSafeEqual } from "node:crypto";
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

const RATE_LIMIT_DAILY = 25;
const RATE_LIMIT_MONTHLY = 300;
const RATE_LIMIT_COOLDOWN_MS = 12_000;
const HMAC_MAX_AGE_MS = 60_000;

interface RateLimitEntry {
  dailyCount: number;
  monthlyCount: number;
  dailyResetAt: number;
  monthlyResetAt: number;
  lastSentAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

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

function getRequestSecret() {
  return process.env.AI_REQUEST_SECRET || readEnvFileValue("AI_REQUEST_SECRET");
}

function getNextDay(now: number) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

function getNextMonth(now: number) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

function checkRateLimit(
  installId: string,
  now: number,
): { allowed: boolean; reason?: string } {
  let entry = rateLimitMap.get(installId);
  if (!entry) {
    entry = {
      dailyCount: 0,
      monthlyCount: 0,
      dailyResetAt: getNextDay(now),
      monthlyResetAt: getNextMonth(now),
      lastSentAt: 0,
    };
    rateLimitMap.set(installId, entry);
  }

  if (now >= entry.dailyResetAt) {
    entry.dailyCount = 0;
    entry.dailyResetAt = getNextDay(now);
  }
  if (now >= entry.monthlyResetAt) {
    entry.monthlyCount = 0;
    entry.monthlyResetAt = getNextMonth(now);
  }

  if (entry.dailyCount >= RATE_LIMIT_DAILY) {
    return { allowed: false, reason: "daily_limit" };
  }
  if (entry.monthlyCount >= RATE_LIMIT_MONTHLY) {
    return { allowed: false, reason: "monthly_limit" };
  }
  if (now - entry.lastSentAt < RATE_LIMIT_COOLDOWN_MS) {
    return { allowed: false, reason: "cooldown" };
  }

  return { allowed: true };
}

function recordRateLimitHit(installId: string, now: number) {
  const entry = rateLimitMap.get(installId);
  if (entry) {
    entry.dailyCount += 1;
    entry.monthlyCount += 1;
    entry.lastSentAt = now;
  }
}

function verifyHmac(
  request: Request,
  installId: string,
  messageHash: string,
  now: number,
): { valid: boolean; error?: string } {
  const secret = getRequestSecret();
  if (!secret) {
    return { valid: true };
  }

  const signature = request.headers.get("X-GW-Signature");
  const timestampStr = request.headers.get("X-GW-Timestamp");

  if (!signature || !timestampStr) {
    return { valid: false, error: "Missing request signature." };
  }

  const timestamp = Number(timestampStr);
  if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > HMAC_MAX_AGE_MS) {
    return { valid: false, error: "Request expired." };
  }

  const payload = `${timestampStr}:${installId}:${messageHash}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, error: "Invalid request signature." };
  }

  return { valid: true };
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

  const installId =
    typeof payload.deviceInstallId === "string"
      ? payload.deviceInstallId.trim()
      : "";
  if (!installId) {
    return jsonResponse(
      { success: false, error: "Device identifier is required." },
      400,
    );
  }

  const userMessage =
    typeof payload.message === "string" ? sanitizeUserMessage(payload.message) : "";

  if (!userMessage) {
    return jsonResponse({ success: false, error: "Message is required." }, 400);
  }

  const now = Date.now();

  const hmacResult = verifyHmac(request, installId, userMessage, now);
  if (!hmacResult.valid) {
    return jsonResponse(
      { success: false, error: hmacResult.error },
      403,
    );
  }

  const rateResult = checkRateLimit(installId, now);
  if (!rateResult.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        limitedReason: rateResult.reason,
      },
      429,
    );
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

    recordRateLimitHit(installId, Date.now());

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
