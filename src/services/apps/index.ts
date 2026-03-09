/**
 * App detection service
 * Fetches installed apps and assigns lightweight categories for onboarding.
 */
import { SelectedApp } from "@/src/domain/models";
import { getInstalledAndroidApps } from "@/src/services/native";

export type AppCategory =
  | "social"
  | "video"
  | "messaging"
  | "news"
  | "shopping"
  | "games"
  | "productivity"
  | "other";

export interface CategorizedApp extends SelectedApp {
  category: AppCategory;
}

export interface AppCategoryInfo {
  id: AppCategory;
  label: string;
  icon: string;
  description: string;
}

export const APP_CATEGORIES: AppCategoryInfo[] = [
  {
    id: "social",
    label: "Social Media",
    icon: "people-outline",
    description: "Instagram, TikTok, Facebook, etc.",
  },
  {
    id: "video",
    label: "Video & Streaming",
    icon: "film-outline",
    description: "YouTube, Netflix, Twitch, etc.",
  },
  {
    id: "messaging",
    label: "Messaging",
    icon: "chatbubble-outline",
    description: "WhatsApp, Messenger, Discord, etc.",
  },
  {
    id: "news",
    label: "News & Reading",
    icon: "newspaper-outline",
    description: "Twitter/X, Reddit, News apps, etc.",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "cart-outline",
    description: "Amazon, eBay, etc.",
  },
  {
    id: "games",
    label: "Games",
    icon: "game-controller-outline",
    description: "Mobile games",
  },
  {
    id: "productivity",
    label: "Productivity",
    icon: "bar-chart-outline",
    description: "Email, work apps, etc.",
  },
  {
    id: "other",
    label: "Other",
    icon: "apps-outline",
    description: "Other apps",
  },
];

const MOCK_INSTALLED_APPS: CategorizedApp[] = [
  // Social Media
  {
    packageName: "com.instagram.android",
    label: "Instagram",
    category: "social",
  },
  { packageName: "com.facebook.katana", label: "Facebook", category: "social" },
  { packageName: "com.zhiliaoapp.musically", label: "TikTok", category: "social" },
  { packageName: "com.ss.android.ugc.trill", label: "TikTok Lite", category: "social" },
  {
    packageName: "com.snapchat.android",
    label: "Snapchat",
    category: "social",
  },
  { packageName: "com.linkedin.android", label: "LinkedIn", category: "social" },
  { packageName: "com.pinterest", label: "Pinterest", category: "social" },
  { packageName: "com.tumblr", label: "Tumblr", category: "social" },
  { packageName: "com.bereal.ft", label: "BeReal", category: "social" },

  // Video & Streaming
  { packageName: "com.google.android.youtube", label: "YouTube", category: "video" },
  {
    packageName: "com.netflix.mediaclient",
    label: "Netflix",
    category: "video",
  },
  { packageName: "tv.twitch.android.app", label: "Twitch", category: "video" },
  { packageName: "com.hulu.plus", label: "Hulu", category: "video" },
  { packageName: "com.disney.disneyplus", label: "Disney+", category: "video" },
  { packageName: "com.amazon.avod", label: "Prime Video", category: "video" },
  { packageName: "com.hbo.hbonow", label: "HBO Max", category: "video" },
  { packageName: "com.spotify.music", label: "Spotify", category: "video" },

  // Messaging
  { packageName: "com.whatsapp", label: "WhatsApp", category: "messaging" },
  {
    packageName: "com.facebook.orca",
    label: "Messenger",
    category: "messaging",
  },
  { packageName: "com.discord", label: "Discord", category: "messaging" },
  { packageName: "org.telegram.messenger", label: "Telegram", category: "messaging" },
  { packageName: "com.Slack", label: "Slack", category: "messaging" },
  { packageName: "us.zoom.videomeetings", label: "Zoom", category: "messaging" },

  // News & Reading
  { packageName: "com.twitter.android", label: "Twitter/X", category: "news" },
  { packageName: "com.reddit.frontpage", label: "Reddit", category: "news" },
  { packageName: "com.google.android.apps.magazines", label: "Google News", category: "news" },
  { packageName: "flipboard.app", label: "Flipboard", category: "news" },
  { packageName: "com.medium.reader", label: "Medium", category: "news" },

  // Shopping
  { packageName: "com.amazon.venezia", label: "Amazon", category: "shopping" },
  { packageName: "com.ebay.mobile", label: "eBay", category: "shopping" },
  { packageName: "com.alibaba.aliexpresshd", label: "AliExpress", category: "shopping" },
  { packageName: "com.shopify.arrive", label: "Shop", category: "shopping" },
  { packageName: "com.etsy.android", label: "Etsy", category: "shopping" },
  { packageName: "com.shein.android", label: "SHEIN", category: "shopping" },

  // Games
  { packageName: "com.supercell.clashofclans", label: "Clash of Clans", category: "games" },
  { packageName: "com.king.candycrushsaga", label: "Candy Crush", category: "games" },
  { packageName: "com.mojang.minecraftpe", label: "Minecraft", category: "games" },
  { packageName: "com.roblox.client", label: "Roblox", category: "games" },
  { packageName: "com.supercell.brawlstars", label: "Brawl Stars", category: "games" },
  { packageName: "com.pubg.imobile", label: "PUBG Mobile", category: "games" },

  // Productivity (usually not distracting, but some users want to limit)
  { packageName: "com.android.chrome", label: "Chrome", category: "productivity" },
  { packageName: "com.google.android.gm", label: "Gmail", category: "productivity" },
  { packageName: "com.google.android.apps.maps", label: "Google Maps", category: "productivity" },

  // Other
  { packageName: "com.duolingo", label: "Duolingo", category: "other" },
  { packageName: "com.robinhood.android", label: "Robinhood", category: "other" },
  { packageName: "com.tinder", label: "Tinder", category: "other" },
  { packageName: "com.bumble.app", label: "Bumble", category: "other" },
];

const CATEGORY_KEYWORDS: Record<AppCategory, string[]> = {
  social: [
    "instagram",
    "facebook",
    "snapchat",
    "linkedin",
    "pinterest",
    "bereal",
    "threads",
    "mastodon",
    "wechat",
    "weibo",
    "social",
  ],
  video: [
    "youtube",
    "netflix",
    "twitch",
    "hulu",
    "disney",
    "prime video",
    "spotify",
    "music",
    "video",
    "stream",
    "podcast",
  ],
  messaging: [
    "whatsapp",
    "messenger",
    "telegram",
    "discord",
    "slack",
    "zoom",
    "teams",
    "chat",
    "message",
    "signal",
    "line",
  ],
  news: [
    "reddit",
    "twitter",
    "x.com",
    "news",
    "medium",
    "flipboard",
    "feedly",
    "newspaper",
    "reader",
  ],
  shopping: [
    "amazon",
    "ebay",
    "etsy",
    "shop",
    "store",
    "shopping",
    "shein",
    "temu",
    "aliexpress",
  ],
  games: [
    "game",
    "play games",
    "clash",
    "candy crush",
    "minecraft",
    "roblox",
    "pubg",
    "brawl",
  ],
  productivity: [
    "chrome",
    "gmail",
    "mail",
    "calendar",
    "docs",
    "drive",
    "maps",
    "notion",
    "todo",
    "task",
    "browser",
    "productivity",
  ],
  other: [],
};

function sortApps(apps: CategorizedApp[]) {
  return [...apps].sort((a, b) => {
    const categoryOrder = APP_CATEGORIES.findIndex((c) => c.id === a.category);
    const categoryOrderB = APP_CATEGORIES.findIndex((c) => c.id === b.category);
    if (categoryOrder !== categoryOrderB) {
      return categoryOrder - categoryOrderB;
    }
    return a.label.localeCompare(b.label);
  });
}

function categorizeApp(app: SelectedApp): AppCategory {
  const haystack = `${app.label} ${app.packageName}`.toLowerCase();

  for (const category of APP_CATEGORIES.map((item) => item.id)) {
    if (category === "other") {
      continue;
    }

    if (CATEGORY_KEYWORDS[category].some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return "other";
}

function toCategorizedApps(apps: SelectedApp[]): CategorizedApp[] {
  return apps.map((app) => ({
    ...app,
    category: categorizeApp(app),
  }));
}

/**
 * Get list of installed apps with categories
 */
export async function getInstalledApps(): Promise<CategorizedApp[]> {
  const installedApps = await getInstalledAndroidApps();

  if (installedApps.length > 0) {
    return sortApps(toCategorizedApps(installedApps));
  }

  return sortApps(MOCK_INSTALLED_APPS);
}

/**
 * Get apps by category
 */
export function getAppsByCategory(
  apps: CategorizedApp[],
  category: AppCategory
): CategorizedApp[] {
  return apps.filter((app) => app.category === category);
}

/**
 * Filter apps by search query
 */
export function filterApps(
  apps: CategorizedApp[],
  query: string
): CategorizedApp[] {
  const lowerQuery = query.toLowerCase();
  return apps.filter(
    (app) =>
      app.label.toLowerCase().includes(lowerQuery) ||
      app.packageName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get suggested apps (high-distraction apps)
 */
export function getSuggestedApps(apps: CategorizedApp[]): CategorizedApp[] {
  const suggestedPackages = [
    "com.instagram.android",
    "com.zhiliaoapp.musically", // TikTok
    "com.ss.android.ugc.trill", // TikTok Lite
    "com.twitter.android",
    "com.reddit.frontpage",
    "com.facebook.katana",
    "com.google.android.youtube",
    "com.snapchat.android",
    "com.whatsapp",
    "com.netflix.mediaclient",
  ];
  return apps.filter((app) => suggestedPackages.includes(app.packageName));
}
