/**
 * Badge definitions for GentleWait achievement system
 */

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string; // Ionicons name
  description: string;
  category: "streak" | "mindful_minutes" | "journal" | "calm_rate" | "variety";
  threshold: number;
  premium: boolean; // false = free tier badge
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Streak badges (8)
  {
    id: "streak-3",
    name: "Getting Started",
    icon: "flame-outline",
    description: "3-day streak",
    category: "streak",
    threshold: 3,
    premium: false,
  },
  {
    id: "streak-7",
    name: "One Week Strong",
    icon: "flame-outline",
    description: "7-day streak",
    category: "streak",
    threshold: 7,
    premium: true,
  },
  {
    id: "streak-14",
    name: "Two Weeks In",
    icon: "flame-outline",
    description: "14-day streak",
    category: "streak",
    threshold: 14,
    premium: true,
  },
  {
    id: "streak-30",
    name: "Monthly Master",
    icon: "flame",
    description: "30-day streak",
    category: "streak",
    threshold: 30,
    premium: true,
  },
  {
    id: "streak-60",
    name: "Deeply Rooted",
    icon: "flame",
    description: "60-day streak",
    category: "streak",
    threshold: 60,
    premium: true,
  },
  {
    id: "streak-90",
    name: "Quarter Champion",
    icon: "flame",
    description: "90-day streak",
    category: "streak",
    threshold: 90,
    premium: true,
  },
  {
    id: "streak-180",
    name: "Half-Year Hero",
    icon: "flame",
    description: "180-day streak",
    category: "streak",
    threshold: 180,
    premium: true,
  },
  {
    id: "streak-365",
    name: "Year of Presence",
    icon: "flame",
    description: "365-day streak",
    category: "streak",
    threshold: 365,
    premium: true,
  },

  // Mindful minutes badges (6)
  {
    id: "mindful-30m",
    name: "First Half Hour",
    icon: "time-outline",
    description: "30 mindful minutes",
    category: "mindful_minutes",
    threshold: 30,
    premium: false,
  },
  {
    id: "mindful-1h",
    name: "One Hour of Calm",
    icon: "time-outline",
    description: "1 hour of mindful minutes",
    category: "mindful_minutes",
    threshold: 60,
    premium: true,
  },
  {
    id: "mindful-5h",
    name: "Deep Practice",
    icon: "time-outline",
    description: "5 hours of mindful minutes",
    category: "mindful_minutes",
    threshold: 300,
    premium: true,
  },
  {
    id: "mindful-10h",
    name: "Dedicated Mind",
    icon: "time",
    description: "10 hours of mindful minutes",
    category: "mindful_minutes",
    threshold: 600,
    premium: true,
  },
  {
    id: "mindful-24h",
    name: "Full Day of Peace",
    icon: "time",
    description: "24 hours of mindful minutes",
    category: "mindful_minutes",
    threshold: 1440,
    premium: true,
  },
  {
    id: "mindful-50h",
    name: "Mindfulness Master",
    icon: "time",
    description: "50 hours of mindful minutes",
    category: "mindful_minutes",
    threshold: 3000,
    premium: true,
  },

  // Journal badges (5)
  {
    id: "journal-5",
    name: "Reflective Start",
    icon: "journal-outline",
    description: "5 journal entries",
    category: "journal",
    threshold: 5,
    premium: true,
  },
  {
    id: "journal-10",
    name: "Finding Words",
    icon: "journal-outline",
    description: "10 journal entries",
    category: "journal",
    threshold: 10,
    premium: true,
  },
  {
    id: "journal-25",
    name: "Inner Voice",
    icon: "journal-outline",
    description: "25 journal entries",
    category: "journal",
    threshold: 25,
    premium: true,
  },
  {
    id: "journal-50",
    name: "Story Weaver",
    icon: "journal",
    description: "50 journal entries",
    category: "journal",
    threshold: 50,
    premium: true,
  },
  {
    id: "journal-100",
    name: "Chronicle Keeper",
    icon: "journal",
    description: "100 journal entries",
    category: "journal",
    threshold: 100,
    premium: true,
  },

  // Calm rate badges (3)
  {
    id: "calm-50",
    name: "Finding Balance",
    icon: "leaf-outline",
    description: "50%+ calm rate for 7 days",
    category: "calm_rate",
    threshold: 50,
    premium: true,
  },
  {
    id: "calm-70",
    name: "Inner Strength",
    icon: "leaf-outline",
    description: "70%+ calm rate for 7 days",
    category: "calm_rate",
    threshold: 70,
    premium: true,
  },
  {
    id: "calm-90",
    name: "Zen Master",
    icon: "leaf",
    description: "90%+ calm rate for 7 days",
    category: "calm_rate",
    threshold: 90,
    premium: true,
  },

  // Variety badge (1)
  {
    id: "variety-all",
    name: "Renaissance Mind",
    icon: "color-palette-outline",
    description: "Used all 6 alternative types",
    category: "variety",
    threshold: 6,
    premium: false,
  },

  // Bonus badges (2)
  {
    id: "streak-night-owl",
    name: "Night Owl",
    icon: "moon-outline",
    description: "Paused after 10pm",
    category: "streak",
    threshold: 1,
    premium: true,
  },
  {
    id: "streak-early-bird",
    name: "Early Bird",
    icon: "sunny-outline",
    description: "Paused before 7am",
    category: "streak",
    threshold: 1,
    premium: true,
  },
];

export const FREE_BADGE_IDS = BADGE_DEFINITIONS.filter((b) => !b.premium).map(
  (b) => b.id
);

export const BADGE_CATEGORIES = [
  { key: "streak" as const, label: "Streaks" },
  { key: "mindful_minutes" as const, label: "Mindful Minutes" },
  { key: "journal" as const, label: "Journaling" },
  { key: "calm_rate" as const, label: "Calm Rate" },
  { key: "variety" as const, label: "Variety" },
] as const;
