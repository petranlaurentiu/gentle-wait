/**
 * MMKV storage service for fast key-value storage
 * Falls back to in-memory storage if MMKV is not available (Expo Go compatibility)
 */
import { Platform } from "react-native";

let storage: any = null;
let inMemoryStore: Record<string, any> = {};

// Try to import MMKV, but fall back to in-memory if not available
try {
  // Check if we're on a platform that supports native modules
  if (Platform.OS === "web") {
    console.log("[Storage] Web platform detected - using in-memory storage");
  } else {
    // Try to require MMKV
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkvModule = require("react-native-mmkv");

    // Prefer the v4+ API (createMMKV), fall back to older MMKV class if needed
    if (mmkvModule && typeof mmkvModule.createMMKV === "function") {
      storage = mmkvModule.createMMKV();
      console.log("[Storage] ✅ MMKV initialized - settings will persist");
    } else if (
      mmkvModule &&
      mmkvModule.MMKV &&
      typeof mmkvModule.MMKV === "function"
    ) {
      storage = new mmkvModule.MMKV();
      console.log("[Storage] ✅ MMKV initialized - settings will persist");
    } else {
      throw new Error("MMKV class not found in module");
    }
  }
} catch (error: any) {
  console.warn("[Storage] ⚠️ MMKV not available, using in-memory storage");
  console.warn("[Storage] ⚠️ Settings will NOT persist between app restarts!");

  if (Platform.OS !== "web") {
    console.warn(
      "[Storage] ⚠️ Make sure you are running a native build (npx expo run:android), not Expo Go"
    );
    console.warn(
      "[Storage] ⚠️ Try: npx expo prebuild --clean && npx expo run:android"
    );
  }

  if (__DEV__ && error) {
    console.warn("[Storage] Error details:", error.message || error);
  }
}

/**
 * Check if MMKV is available (native storage) or using fallback (in-memory)
 */
export const isMMKVAvailable = (): boolean => {
  return storage !== null;
};

export const mmkvStorage = {
  setString: (key: string, value: string) => {
    if (storage) {
      if (typeof storage.setString === 'function') {
        storage.setString(key, value);
      } else {
        storage.set(key, value);
      }
    } else {
      inMemoryStore[key] = value;
    }
  },
  getString: (key: string): string | undefined => {
    if (storage) {
      return storage.getString(key);
    } else {
      return inMemoryStore[key];
    }
  },

  setNumber: (key: string, value: number) => {
    if (storage) {
      if (typeof storage.setNumber === 'function') {
        storage.setNumber(key, value);
      } else {
        storage.set(key, value);
      }
    } else {
      inMemoryStore[key] = value;
    }
  },
  getNumber: (key: string): number | undefined => {
    if (storage) {
      return storage.getNumber(key);
    } else {
      return inMemoryStore[key];
    }
  },

  setBoolean: (key: string, value: boolean) => {
    if (storage) {
      if (typeof storage.setBoolean === 'function') {
        storage.setBoolean(key, value);
      } else {
        storage.set(key, value);
      }
    } else {
      inMemoryStore[key] = value;
    }
  },
  getBoolean: (key: string): boolean | undefined => {
    if (storage) {
      return storage.getBoolean(key);
    } else {
      return inMemoryStore[key];
    }
  },

  delete: (key: string) => {
    if (storage) {
      if (typeof storage.delete === 'function') {
        storage.delete(key);
      } else if (typeof storage.remove === 'function') {
        storage.remove(key);
      }
    } else {
      delete inMemoryStore[key];
    }
  },
  clearAll: () => {
    if (storage) {
      storage.clearAll();
    } else {
      inMemoryStore = {};
    }
  },

  // Helper methods for JSON
  setJSON: (key: string, value: any) => {
    if (storage) {
      const payload = JSON.stringify(value);
      if (typeof storage.setString === 'function') {
        storage.setString(key, payload);
      } else {
        storage.set(key, payload);
      }
    } else {
      inMemoryStore[key] = value;
    }
  },
  getJSON: <T = any>(key: string): T | undefined => {
    if (storage) {
      const str = storage.getString(key);
      if (!str) return undefined;
      try {
        return JSON.parse(str) as T;
      } catch {
        return undefined;
      }
    } else {
      return inMemoryStore[key];
    }
  },
};
