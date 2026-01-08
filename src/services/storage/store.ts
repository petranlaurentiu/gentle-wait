/**
 * Zustand store for GentleWait global state
 */
import { create } from 'zustand';
import { UserSettings, SelectedApp, InterceptionEvent } from '@/src/domain/models';
import { mmkvStorage } from './mmkv';
import * as nativeService from '@/src/services/native';

const SETTINGS_KEY = 'user_settings';
const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  pauseDurationSec: 15,
  promptFrequency: 'sometimes',
  selectedApps: [],
  theme: 'system',
  premium: false,
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
}

export const useAppStore = create<AppStore>((set) => ({
  // Settings
  settings: DEFAULT_SETTINGS,

  loadSettings: () => {
    const stored = mmkvStorage.getJSON<UserSettings>(SETTINGS_KEY);
    const settings = stored || DEFAULT_SETTINGS;
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
}));
