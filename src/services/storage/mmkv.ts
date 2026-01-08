/**
 * MMKV storage service for fast key-value storage
 */
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const mmkvStorage = {
  setString: (key: string, value: string) => storage.setString(key, value),
  getString: (key: string): string | undefined => storage.getString(key),

  setNumber: (key: string, value: number) => storage.setNumber(key, value),
  getNumber: (key: string): number | undefined => storage.getNumber(key),

  setBoolean: (key: string, value: boolean) => storage.setBoolean(key, value),
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),

  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),

  // Helper methods for JSON
  setJSON: (key: string, value: any) => {
    storage.setString(key, JSON.stringify(value));
  },
  getJSON: <T = any>(key: string): T | undefined => {
    const str = storage.getString(key);
    if (!str) return undefined;
    try {
      return JSON.parse(str) as T;
    } catch {
      return undefined;
    }
  },
};
