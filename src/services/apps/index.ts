/**
 * App detection service
 * Fetches list of installed apps
 *
 * TODO: Replace mock with native module using expo-modules for PackageManager
 */
import { SelectedApp } from '@/src/domain/models';

/**
 * Mock list of popular apps for development
 * In production, this will query PackageManager via native module
 */
const MOCK_INSTALLED_APPS: SelectedApp[] = [
  { packageName: 'com.instagram.android', label: 'Instagram' },
  { packageName: 'com.android.chrome', label: 'Chrome' },
  { packageName: 'com.facebook.katana', label: 'Facebook' },
  { packageName: 'com.twitter.android', label: 'Twitter/X' },
  { packageName: 'com.tiktok.client', label: 'TikTok' },
  { packageName: 'com.whatsapp', label: 'WhatsApp' },
  { packageName: 'com.snapchat.android', label: 'Snapchat' },
  { packageName: 'com.reddit.frontpage', label: 'Reddit' },
  { packageName: 'com.spotify.music', label: 'Spotify' },
  { packageName: 'com.netflix.mediaclient', label: 'Netflix' },
  { packageName: 'com.youtube.android', label: 'YouTube' },
  { packageName: 'com.amazon.venezia', label: 'Amazon Shopping' },
  { packageName: 'com.google.android.apps.maps', label: 'Google Maps' },
  { packageName: 'com.discord', label: 'Discord' },
  { packageName: 'com.linkedin.android', label: 'LinkedIn' },
  { packageName: 'com.pinterest', label: 'Pinterest' },
  { packageName: 'com.duolingo', label: 'Duolingo' },
  { packageName: 'com.robinhood.android', label: 'Robinhood' },
];

/**
 * Get list of installed apps
 * Currently returns mock list for development
 * Will be replaced with native PackageManager call
 */
export async function getInstalledApps(): Promise<SelectedApp[]> {
  // TODO: Call native module via NativeModules or expo-modules
  // For now, return mock data
  return MOCK_INSTALLED_APPS;
}

/**
 * Filter apps by search query
 */
export function filterApps(apps: SelectedApp[], query: string): SelectedApp[] {
  const lowerQuery = query.toLowerCase();
  return apps.filter(
    (app) =>
      app.label.toLowerCase().includes(lowerQuery) ||
      app.packageName.toLowerCase().includes(lowerQuery)
  );
}
