/**
 * Zustand store for GentleWait global state
 */
import { create } from 'zustand';
import {
  UserSettings,
  SelectedApp,
  InterceptionEvent,
  StreakState,
  BadgeUnlock,
  DailyNudge,
  NudgeHistoryEntry,
} from '@/src/domain/models';
import type { BillingPackage } from '@/src/services/billing';
import { mmkvStorage } from './mmkv';
import * as nativeService from '@/src/services/native';

const SETTINGS_KEY = 'user_settings';
const STREAK_STATE_KEY = 'streak_state';
const UNLOCKED_BADGES_KEY = 'unlocked_badges';
const DAILY_NUDGE_KEY = 'daily_nudge';
const NUDGE_HISTORY_KEY = 'nudge_history';

const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: '',
  freezesUsedThisWeek: 0,
  freezeWeekStart: '',
};

const MAX_NUDGE_HISTORY = 7;
const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  userName: '',
  pauseDurationSec: 15,
  cooldownMinutes: 15,
  promptFrequency: 'sometimes',
  selectedApps: [],
  theme: 'system',
  premium: false,
  iosFamilyActivitySelection: null,
  moveExercisePreference: 'random',
  eyeResetExercisePreference: 'random',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

interface AppStore {
  // Settings
  settings: UserSettings;
  loadSettings: () => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  addSelectedApp: (app: SelectedApp) => void;
  removeSelectedApp: (packageName: string) => void;

  // Interception state
  currentInterceptionEvent: InterceptionEvent | null;
  setCurrentInterceptionEvent: (event: InterceptionEvent | null) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  billingAvailable: boolean;
  billingPackages: BillingPackage[];
  setBillingAvailable: (available: boolean) => void;
  setBillingPackages: (packages: BillingPackage[]) => void;
  notificationsDenied: boolean;
  setNotificationsDenied: (denied: boolean) => void;

  // Streaks
  streakState: StreakState;
  loadStreakState: () => void;
  updateStreakState: (updates: Partial<StreakState>) => void;

  // Badges
  unlockedBadges: BadgeUnlock[];
  loadBadges: () => void;
  unlockBadge: (id: string) => boolean; // returns true if newly unlocked

  // Nudges
  dailyNudge: DailyNudge | null;
  nudgeHistory: NudgeHistoryEntry[];
  loadNudgeState: () => void;
  setDailyNudge: (nudge: DailyNudge) => void;
  dismissNudge: () => void;
  addNudgeToHistory: (entry: NudgeHistoryEntry) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Settings
  settings: DEFAULT_SETTINGS,

  loadSettings: () => {
    const stored = mmkvStorage.getJSON<UserSettings>(SETTINGS_KEY);
    const settings = {
      ...DEFAULT_SETTINGS,
      ...stored,
      selectedApps: stored?.selectedApps || [],
      iosFamilyActivitySelection: stored?.iosFamilyActivitySelection ?? null,
    };

    nativeService.setSelectedApps(settings.selectedApps).catch((e) => {
      console.error('Error syncing selected apps on load:', e);
    });
    nativeService.setCooldownDuration(settings.cooldownMinutes).catch((e) => {
      console.error('Error syncing cooldown on load:', e);
    });

    set({ settings });
  },

  updateSettings: (updates) => {
    set((state) => {
      const updated = {
        ...state.settings,
        ...updates,
        updatedAt: Date.now(),
      };
      mmkvStorage.setJSON(SETTINGS_KEY, updated);

      if (updates.cooldownMinutes !== undefined) {
        nativeService.setCooldownDuration(updates.cooldownMinutes).catch((e) => {
          console.error('Error syncing cooldown to native:', e);
        });
      }

      return { settings: updated };
    });
  },

  addSelectedApp: (app) => {
    set((state) => {
      const exists = state.settings.selectedApps.some(
        (a) => a.packageName === app.packageName
      );
      if (exists) return state;

      const updatedApps = [...state.settings.selectedApps, app];
      const updated = {
        ...state.settings,
        selectedApps: updatedApps,
        updatedAt: Date.now(),
      };
      mmkvStorage.setJSON(SETTINGS_KEY, updated);

      // Sync with native module (for accessibility service)
      nativeService.setSelectedApps(updatedApps).catch((e) => {
        console.error('Error syncing apps to native:', e);
      });

      return { settings: updated };
    });
  },

  removeSelectedApp: (packageName) => {
    set((state) => {
      const updatedApps = state.settings.selectedApps.filter(
        (a) => a.packageName !== packageName
      );
      const updated = {
        ...state.settings,
        selectedApps: updatedApps,
        updatedAt: Date.now(),
      };
      mmkvStorage.setJSON(SETTINGS_KEY, updated);

      // Sync with native module (for accessibility service)
      nativeService.setSelectedApps(updatedApps).catch((e) => {
        console.error('Error syncing apps to native:', e);
      });

      return { settings: updated };
    });
  },

  // Interception state
  currentInterceptionEvent: null,

  setCurrentInterceptionEvent: (event) => {
    set({ currentInterceptionEvent: event });
  },

  // UI state
  isLoading: false,

  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  billingAvailable: false,
  billingPackages: [],

  setBillingAvailable: (available) => {
    set({ billingAvailable: available });
  },

  setBillingPackages: (packages) => {
    set({ billingPackages: packages });
  },

  notificationsDenied: false,
  setNotificationsDenied: (denied) => {
    set({ notificationsDenied: denied });
  },

  // Streaks
  streakState: DEFAULT_STREAK_STATE,

  loadStreakState: () => {
    const stored = mmkvStorage.getJSON<StreakState>(STREAK_STATE_KEY);
    set({ streakState: { ...DEFAULT_STREAK_STATE, ...stored } });
  },

  updateStreakState: (updates) => {
    set((state) => {
      const updated = { ...state.streakState, ...updates };
      mmkvStorage.setJSON(STREAK_STATE_KEY, updated);
      return { streakState: updated };
    });
  },

  // Badges
  unlockedBadges: [],

  loadBadges: () => {
    const stored = mmkvStorage.getJSON<BadgeUnlock[]>(UNLOCKED_BADGES_KEY);
    set({ unlockedBadges: stored || [] });
  },

  unlockBadge: (id) => {
    const state = useAppStore.getState();
    if (state.unlockedBadges.some((b) => b.id === id)) return false;

    const updated = [...state.unlockedBadges, { id, unlockedAt: Date.now() }];
    mmkvStorage.setJSON(UNLOCKED_BADGES_KEY, updated);
    set({ unlockedBadges: updated });
    return true;
  },

  // Nudges
  dailyNudge: null,
  nudgeHistory: [],

  loadNudgeState: () => {
    const nudge = mmkvStorage.getJSON<DailyNudge>(DAILY_NUDGE_KEY);
    const history = mmkvStorage.getJSON<NudgeHistoryEntry[]>(NUDGE_HISTORY_KEY);
    set({ dailyNudge: nudge || null, nudgeHistory: history || [] });
  },

  setDailyNudge: (nudge) => {
    mmkvStorage.setJSON(DAILY_NUDGE_KEY, nudge);
    set({ dailyNudge: nudge });
  },

  dismissNudge: () => {
    set((state) => {
      if (!state.dailyNudge) return state;
      const updated = { ...state.dailyNudge, dismissed: true };
      mmkvStorage.setJSON(DAILY_NUDGE_KEY, updated);
      return { dailyNudge: updated };
    });
  },

  addNudgeToHistory: (entry) => {
    set((state) => {
      const updated = [entry, ...state.nudgeHistory].slice(0, MAX_NUDGE_HISTORY);
      mmkvStorage.setJSON(NUDGE_HISTORY_KEY, updated);
      return { nudgeHistory: updated };
    });
  },
}));
