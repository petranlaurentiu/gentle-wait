/**
 * Native platform bridge for app protection.
 *
 * Android uses the legacy GentleWait native module.
 * iOS uses Apple's Family Controls via react-native-device-activity.
 */
import { NativeModules, Platform } from "react-native";
import {
  AuthorizationStatus,
  getAuthorizationStatus,
  isAvailable as isDeviceActivityAvailable,
  pollAuthorizationStatus,
  requestAuthorization,
  setFamilyActivitySelectionId,
  stopMonitoring,
  resetBlocks,
  userDefaultsGet,
  userDefaultsRemove,
  userDefaultsSet,
} from "react-native-device-activity";
import type { IOSFamilyActivitySelection, SelectedApp } from "@/src/domain/models";

const GentleWaitModule = NativeModules.GentleWaitModule ?? null;

const IOS_SELECTION_ID = "gentlewait.protected-selection";
const IOS_SELECTION_METADATA_KEY = "gentlewait.protected-selection.metadata";
const FAMILY_ACTIVITY_SELECTION_IDS_KEY = "familyActivitySelectionIds";

type PendingInterception = {
  appPackage: string;
  appLabel: string;
  ts: number;
};

const isAndroidNativeModuleAvailable = () => Boolean(GentleWaitModule);

export function isIOSFamilyControlsAvailable(): boolean {
  return Platform.OS === "ios" && isDeviceActivityAvailable();
}

export function getIOSFamilyControlsSelectionId(): string {
  return IOS_SELECTION_ID;
}

export function getIOSFamilyControlsSelection(): IOSFamilyActivitySelection | null {
  if (!isIOSFamilyControlsAvailable()) {
    return null;
  }

  const metadata = userDefaultsGet<IOSFamilyActivitySelection>(
    IOS_SELECTION_METADATA_KEY,
  );

  if (!metadata?.familyActivitySelection) {
    return null;
  }

  return metadata;
}

export async function saveIOSFamilyControlsSelection(
  selection: IOSFamilyActivitySelection,
): Promise<void> {
  if (!isIOSFamilyControlsAvailable()) {
    return;
  }

  setFamilyActivitySelectionId({
    id: IOS_SELECTION_ID,
    familyActivitySelection: selection.familyActivitySelection,
  });

  userDefaultsSet(IOS_SELECTION_METADATA_KEY, selection);
}

export async function clearIOSFamilyControlsSelection(): Promise<void> {
  if (!isIOSFamilyControlsAvailable()) {
    return;
  }

  const currentSelectionIds =
    userDefaultsGet<Record<string, string>>(FAMILY_ACTIVITY_SELECTION_IDS_KEY) ?? {};

  if (currentSelectionIds[IOS_SELECTION_ID]) {
    const { [IOS_SELECTION_ID]: _removed, ...remaining } = currentSelectionIds;
    userDefaultsSet(FAMILY_ACTIVITY_SELECTION_IDS_KEY, remaining);
  }

  userDefaultsRemove(IOS_SELECTION_METADATA_KEY);

  stopMonitoring();
  resetBlocks("clearIOSFamilyControlsSelection");
}

export function getIOSSelectionSummary(
  selection: IOSFamilyActivitySelection | null | undefined,
): string {
  if (!selection) {
    return "No apps selected yet.";
  }

  const parts = [
    selection.applicationCount > 0
      ? `${selection.applicationCount} app${selection.applicationCount === 1 ? "" : "s"}`
      : null,
    selection.categoryCount > 0
      ? `${selection.categoryCount} categor${selection.categoryCount === 1 ? "y" : "ies"}`
      : null,
    selection.webDomainCount > 0
      ? `${selection.webDomainCount} website${selection.webDomainCount === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "Selection saved in Family Controls.";
}

export function exceedsFreeIOSSelectionLimit(
  selection: IOSFamilyActivitySelection | null | undefined,
  freeLimit: number,
): boolean {
  if (!selection) {
    return false;
  }

  return (
    selection.applicationCount > freeLimit ||
    selection.categoryCount > 0 ||
    selection.webDomainCount > 0
  );
}

export async function isServiceEnabled(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      return Boolean(
        isAndroidNativeModuleAvailable() &&
          (await GentleWaitModule.isAccessibilityServiceEnabled()),
      );
    }

    if (Platform.OS === "ios") {
      return (
        isIOSFamilyControlsAvailable() &&
        getAuthorizationStatus() === AuthorizationStatus.approved
      );
    }

    return false;
  } catch (error) {
    console.error("[NativeService] Error checking service status:", error);
    return false;
  }
}

export async function requestServiceAuthorization(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      if (!isAndroidNativeModuleAvailable()) {
        return false;
      }

      await GentleWaitModule.openAccessibilitySettings();
      return true;
    }

    if (Platform.OS === "ios") {
      if (!isIOSFamilyControlsAvailable()) {
        return false;
      }

      await requestAuthorization("individual");
      const status = await pollAuthorizationStatus();
      return status === AuthorizationStatus.approved;
    }

    return false;
  } catch (error) {
    console.error("[NativeService] Error requesting authorization:", error);
    return false;
  }
}

export async function setSelectedApps(apps: SelectedApp[]): Promise<void> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return;
  }

  try {
    await GentleWaitModule.setSelectedApps(apps.map((app) => app.packageName));
  } catch (error) {
    console.error("[NativeService] Error syncing selected apps:", error);
  }
}

export async function getSelectedApps(): Promise<SelectedApp[]> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return [];
  }

  try {
    const json = await GentleWaitModule.getSelectedApps();
    return JSON.parse(json) as SelectedApp[];
  } catch (error) {
    console.error("[NativeService] Error getting selected apps:", error);
    return [];
  }
}

export async function clearProtectedApps(): Promise<void> {
  if (Platform.OS === "ios") {
    await clearIOSFamilyControlsSelection();
    return;
  }

  if (Platform.OS === "android") {
    await setSelectedApps([]);
  }
}

export async function getPendingInterception(): Promise<PendingInterception | null> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return null;
  }

  try {
    return (await GentleWaitModule.getPendingInterception()) as PendingInterception | null;
  } catch (error) {
    console.error("[NativeService] Error getting pending interception:", error);
    return null;
  }
}

export async function markAppHandled(packageName: string): Promise<void> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return;
  }

  try {
    await GentleWaitModule.markAppHandled(packageName);
  } catch (error) {
    console.error("[NativeService] Error marking app handled:", error);
  }
}

export async function setCooldownDuration(minutes: number): Promise<void> {
  if (!isAndroidNativeModuleAvailable()) {
    return;
  }

  try {
    await GentleWaitModule.setCooldownDuration(minutes * 60 * 1000);
  } catch (error) {
    console.error("[NativeService] Error setting cooldown duration:", error);
  }
}

export async function launchApp(packageName: string): Promise<boolean> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return false;
  }

  try {
    await GentleWaitModule.launchApp(packageName);
    return true;
  } catch (error) {
    console.error("[NativeService] Error launching app:", error);
    return false;
  }
}
