import type { IOSFamilyActivitySelection } from "@/src/domain/models";

export const IOS_MAX_PROTECTED_APPS = 6;
export const IOS_RELEVANT_APP_EXAMPLES = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Reddit",
  "X",
  "Safari",
] as const;
export const IOS_EXCLUDED_APP_EXAMPLES = [
  "Mail",
  "Photos",
  "Weather",
  "FaceTime",
  "Reminders",
  "Phone",
] as const;
/**
 * Patterns used by the native sanitizeSelection function.
 * Patterns <= 2 characters use exact (case-insensitive) matching.
 * Patterns >= 3 characters use substring (case-insensitive) matching.
 */
export const IOS_DOOM_SCROLL_ALLOW_PATTERNS = [
  // Social media & short-video
  "instagram",
  "tiktok",
  "youtube",
  "reddit",
  "facebook",
  "threads",
  "x", // exact match only (<=2 chars) — matches the "X" app
  "twitter",
  "snapchat",
  "linkedin",
  "pinterest",
  "bluesky",
  "tumblr",
  "bereal",
  "twitch",
  "9gag",
  "lemon8",
  "mastodon",
  "quora",
  // Browsers (doom scrolling happens here too)
  "chrome",
  "safari",
  "firefox",
  "brave browser",
  "opera",
  "microsoft edge",
  "duckduckgo",
  "arc browser",
] as const;

export const IOS_DOOM_SCROLL_BLOCK_PATTERNS = [
  // Communication & messaging
  "facetime",
  "messages",
  "message",
  "mail",
  "gmail",
  "outlook",
  "whatsapp",
  "telegram",
  "signal",
  "messenger",
  "discord",
  "viber",
  // Productivity & work
  "meet",
  "zoom",
  "teams",
  "slack",
  "calendar",
  "reminders",
  "notes",
  "notion",
  "trello",
  // System & utilities
  "phone",
  "contacts",
  "photos",
  "camera",
  "maps",
  "wallet",
  "health",
  "weather",
  "clock",
  "calculator",
  "compass",
  "files",
  "settings",
  "shortcuts",
  "translate",
  "magnifier",
  "measure",
  "find my",
  "app store",
  // Shopping & commerce subdomains that piggyback on social brands
  "seller",
  "business suite",
  "ads manager",
] as const;

export function getTotalSelectionCount(
  selection: IOSFamilyActivitySelection | null | undefined,
): number {
  if (!selection) return 0;
  return (
    (selection.applicationCount ?? 0) +
    (selection.categoryCount ?? 0) +
    (selection.webDomainCount ?? 0)
  );
}

export function hasIOSProtectedApps(
  selection: IOSFamilyActivitySelection | null | undefined,
): boolean {
  return getTotalSelectionCount(selection) > 0;
}

export function getIOSSelectionValidationMessage(
  selection: IOSFamilyActivitySelection | null | undefined,
  options: {
    freeLimit: number;
    hasPremiumAccess: boolean;
    maxProtectedApps?: number;
  },
): string | null {
  const maxProtectedApps =
    options.maxProtectedApps ?? IOS_MAX_PROTECTED_APPS;
  const totalCount = getTotalSelectionCount(selection);

  if (totalCount === 0) {
    return "Choose at least one app to protect on iPhone.";
  }

  if (totalCount > maxProtectedApps) {
    return `Keep iPhone protection to ${maxProtectedApps} items or fewer so the shield stays fast and reliable.`;
  }

  if (!options.hasPremiumAccess) {
    // Free users: categories and web domains require premium
    if ((selection?.categoryCount ?? 0) > 0 || (selection?.webDomainCount ?? 0) > 0) {
      return `Free plan: pick individual apps only (up to ${options.freeLimit}). Upgrade to protect categories and websites too.`;
    }
    if ((selection?.applicationCount ?? 0) > options.freeLimit) {
      return `Free plan: protect up to ${options.freeLimit} app${options.freeLimit === 1 ? "" : "s"}. GentleWait Pro lets you protect your full distraction stack.`;
    }
  }

  return null;
}

export function getIOSProtectionFootnote(
  freeLimit: number,
  hasPremiumAccess: boolean,
): string {
  if (hasPremiumAccess) {
    return `Pick up to ${IOS_MAX_PROTECTED_APPS} items — apps, categories, or websites.`;
  }

  return `Free plan: up to ${freeLimit} app${freeLimit === 1 ? "" : "s"} with no categories or websites. GentleWait Pro expands that to ${IOS_MAX_PROTECTED_APPS}.`;
}

export function getIOSSanitizationNotice(
  selection: IOSFamilyActivitySelection | null | undefined,
): string | null {
  if (!selection) {
    return null;
  }

  const removedLabels = selection.removedApplicationLabels ?? [];
  const removedWebDomains = selection.removedWebDomains ?? [];
  const removedCategoryCount = selection.removedCategoryCount ?? 0;
  const parts: string[] = [];

  if (removedLabels.length > 0) {
    parts.push(removedLabels.slice(0, 3).join(", "));
  }

  if (removedWebDomains.length > 0) {
    parts.push(
      `${removedWebDomains.length} website${removedWebDomains.length === 1 ? "" : "s"}`,
    );
  }

  if (removedCategoryCount > 0) {
    parts.push(
      `${removedCategoryCount} categor${removedCategoryCount === 1 ? "y" : "ies"}`,
    );
  }

  if (parts.length === 0) {
    return null;
  }

  return `GentleWait kept only doom-scrolling apps. Removed: ${parts.join(" • ")}.`;
}
