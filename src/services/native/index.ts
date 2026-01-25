/**
 * Native module bridge for GentleWait (iOS & Android)
 * 
 * Android: Uses Accessibility Service
 * iOS: Uses Family Controls + DeviceActivity
 */
import { NativeModules, Platform } from "react-native";

const GentleWaitModule = NativeModules.GentleWaitModule || null;

/**
 * Check if the app interception service is authorized/enabled
 * - Android: Checks Accessibility Service status
 * - iOS: Checks Family Controls authorization status
 */
export async function isServiceEnabled(): Promise<boolean> {
  if (!GentleWaitModule) {
    return false;
  }

  try {
    if (Platform.OS === "android") {
      return await GentleWaitModule.isAccessibilityServiceEnabled();
    } else if (Platform.OS === "ios") {
      return await GentleWaitModule.isFamilyControlsAuthorized();
    }
    return false;
  } catch (error) {
    console.error("[NativeService] Error checking service status:", error);
    return false;
  }
}

/**
 * Request authorization for the app interception service
 * - Android: Opens Accessibility Settings
 * - iOS: Requests Family Controls authorization
 */
export async function requestServiceAuthorization(): Promise<boolean> {
  if (!GentleWaitModule) {
    console.warn("[NativeService] GentleWaitModule not available");
    return false;
  }

  try {
    if (Platform.OS === "android") {
      await GentleWaitModule.openAccessibilitySettings();
      return true; // User needs to manually enable
    } else if (Platform.OS === "ios") {
      return await GentleWaitModule.requestFamilyControlsAuthorization();
    }
    return false;
  } catch (error) {
    console.error("[NativeService] Error requesting authorization:", error);
    return false;
  }
}

/**
 * Legacy Android-specific method (deprecated, use isServiceEnabled instead)
 */
export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  return isServiceEnabled();
}

/**
 * Legacy Android-specific method (deprecated, use requestServiceAuthorization instead)
 */
export async function openAccessibilitySettings(): Promise<void> {
  await requestServiceAuthorization();
}

/**
 * Save selected apps to native storage (synced with React Native store)
 * Works on both iOS and Android
 */
export async function setSelectedApps(
  apps: { packageName: string; label: string }[]
): Promise<void> {
  if (!GentleWaitModule) {
    console.log("[NativeService] GentleWaitModule not available");
    return;
  }

  try {
    // Extract just package names (bundle IDs on iOS) for native module
    const packageNames = apps.map((app) => app.packageName);
    console.log(
      "[NativeService] Syncing selected apps to native:",
      packageNames
    );
    await GentleWaitModule.setSelectedApps(packageNames);
    console.log("[NativeService] Successfully synced selected apps");
  } catch (error) {
    console.error("[NativeService] Error saving selected apps:", error);
  }
}

/**
 * Get selected apps from native storage
 * Works on both iOS and Android
 */
export async function getSelectedApps(): Promise<
  { packageName: string; label: string }[]
> {
  if (!GentleWaitModule) {
    return [];
  }

  try {
    const json = await GentleWaitModule.getSelectedApps();
    return JSON.parse(json);
  } catch (error) {
    console.error("[NativeService] Error getting selected apps:", error);
    return [];
  }
}

/**
 * Get pending app interception from native service
 * Works on both iOS (DeviceActivity) and Android (Accessibility Service)
 */
export async function getPendingInterception(): Promise<{
  appPackage: string;
  appLabel: string;
  ts: number;
} | null> {
  if (!GentleWaitModule) {
    return null;
  }

  try {
    return await GentleWaitModule.getPendingInterception();
  } catch (error) {
    console.error("[NativeService] Error getting pending interception:", error);
    return null;
  }
}

/**
 * Mark an app as handled (sets cooldown timer)
 * Works on both iOS and Android
 */
export async function markAppHandled(packageName: string): Promise<void> {
  if (!GentleWaitModule) {
    return;
  }

  try {
    await GentleWaitModule.markAppHandled(packageName);
    console.log("[NativeService] Marked app as handled:", packageName);
  } catch (error) {
    console.error("[NativeService] Error marking app as handled:", error);
  }
}

/**
 * Launch an app by package name (Android only)
 * iOS does not support launching apps by bundle ID from third-party apps
 */
export async function launchApp(packageName: string): Promise<boolean> {
  if (!GentleWaitModule) {
    return false;
  }

  try {
    if (Platform.OS === "android") {
      await GentleWaitModule.launchApp(packageName);
      return true;
    } else {
      console.warn("[NativeService] launchApp is not supported on iOS");
      return false;
    }
  } catch (error) {
    console.error("[NativeService] Error launching app:", error);
    return false;
  }
}
