/**
 * MMKV storage service for fast key-value storage
 * Falls back to in-memory storage if MMKV is not available (Expo Go compatibility)
 */
let storage: any = null;
let inMemoryStore: Record<string, any> = {};

// Try to import MMKV, but fall back to in-memory if not available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
  console.log('[Storage] MMKV initialized');
} catch {
  console.log('[Storage] MMKV not available, using in-memory storage for Expo Go');
}

export const mmkvStorage = {
  setString: (key: string, value: string) => {
    if (storage) {
      storage.setString(key, value);
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
      storage.setNumber(key, value);
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
      storage.setBoolean(key, value);
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
      storage.delete(key);
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
      storage.setString(key, JSON.stringify(value));
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
