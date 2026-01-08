/**
 * Storage layer exports
 *
 * Platform-specific handling:
 * - Native (Android/iOS): Uses real SQLite via expo-sqlite
 * - Web: Uses MMKV-backed in-memory storage (sqlite.web.ts)
 *
 * Metro bundler automatically selects:
 * - sqlite.ts on native
 * - sqlite.web.ts on web
 */
export * from './mmkv';
export * from './sqlite';
export { useAppStore } from './store';
