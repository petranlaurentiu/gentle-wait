/**
 * Native module bridge for GentleWait Android functionality
 */
import { NativeModules, Platform } from "react-native";

const GentleWaitModule = NativeModules.GentleWaitModule || null;

/**
 * Check if Accessibility Service is enabled
 */
export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (Platform.OS !== "android" || !GentleWaitModule) {
    return false;
  }

  try {
    return await GentleWaitModule.isAccessibilityServiceEnabled();
  } catch (error) {
    console.error("Error checking accessibility service:", error);
    return false;
  }
}

/**
 * Save selected apps to native storage (synced with React Native store)
 */
export async function setSelectedApps(
  apps: { packageName: string; label: string }[]
): Promise<void> {
  if (Platform.OS !== "android" || !GentleWaitModule) {
    console.log(
      "[NativeService] Not on Android or GentleWaitModule not available"
    );
    return;
  }

  try {
    // Extract just package names for native module
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
 */
export async function getSelectedApps(): Promise<
  { packageName: string; label: string }[]
> {
  if (Platform.OS !== "android" || !GentleWaitModule) {
    return [];
  }

  try {
    const json = await GentleWaitModule.getSelectedApps();
    return JSON.parse(json);
  } catch (error) {
    console.error("Error getting selected apps:", error);
    return [];
  }
}

/**
 * Get pending app interception from accessibility service
 */
export async function getPendingInterception(): Promise<{
  appPackage: string;
  appLabel: string;
  ts: number;
} | null> {
  if (Platform.OS !== "android" || !GentleWaitModule) {
    return null;
  }

  try {
    return await GentleWaitModule.getPendingInterception();
  } catch (error) {
    console.error("Error getting pending interception:", error);
    return null;
  }
}

/**
 * Open Accessibility Settings for user to enable the service
 */
export async function openAccessibilitySettings(): Promise<void> {
  if (Platform.OS !== "android" || !GentleWaitModule) {
    return;
  }

  try {
    await GentleWaitModule.openAccessibilitySettings();
  } catch (error) {
    console.error("Error opening accessibility settings:", error);
  }
}
