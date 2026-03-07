/**
 * Native platform bridge for app protection.
 *
 * Android uses the legacy GentleWait native module.
 * iOS uses Apple's Family Controls via react-native-device-activity.
 */
import { NativeModules, Platform } from "react-native";
import {
  AuthorizationStatus,
  blockSelection,
  cleanUpAfterActivity,
  configureActions,
  getAuthorizationStatus,
  isAvailable as isDeviceActivityAvailable,
  pollAuthorizationStatus,
  requestAuthorization,
  resetBlocks,
  startMonitoring,
  setFamilyActivitySelectionId,
  stopMonitoring,
  userDefaultsGet,
  userDefaultsRemove,
  userDefaultsSet,
  updateShieldWithId,
  type Action,
} from "react-native-device-activity";
import type { IOSFamilyActivitySelection, SelectedApp } from "@/src/domain/models";

const GentleWaitModule = NativeModules.GentleWaitModule ?? null;

const IOS_SELECTION_ID = "gentlewait.protected-selection";
const IOS_SELECTION_METADATA_KEY = "gentlewait.protected-selection.metadata";
const FAMILY_ACTIVITY_SELECTION_IDS_KEY = "familyActivitySelectionIds";
const IOS_SHIELD_ID = "gentlewait-default";
const IOS_MAIN_ACTIVITY = `gentlewait-monitor-${IOS_SELECTION_ID}`;
const IOS_COOLDOWN_ACTIVITY = `gentlewait-cooldown-${IOS_SELECTION_ID}`;
const IOS_DEEP_LINK_URL =
  "gentlewait://pause?appPackage=ios.familycontrols&appLabel=Protected%20app&source=shield";

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

  stopMonitoring([IOS_MAIN_ACTIVITY, IOS_COOLDOWN_ACTIVITY]);
  resetBlocks("clearIOSFamilyControlsSelection");
  cleanUpAfterActivity(IOS_MAIN_ACTIVITY);
  cleanUpAfterActivity(IOS_COOLDOWN_ACTIVITY);
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

function buildIOSShieldConfig() {
  return {
    backgroundBlurStyle: 8,
    backgroundColor: { red: 245, green: 248, blue: 252, alpha: 0.96 },
    title: "Take a breath before you continue",
    titleColor: { red: 24, green: 31, blue: 42, alpha: 1 },
    subtitle:
      "GentleWait added a short layer of friction here. Open the app for a few minutes, or step back into your pause ritual.",
    subtitleColor: { red: 84, green: 94, blue: 111, alpha: 1 },
    iconSystemName: "leaf.circle",
    iconTint: { red: 53, green: 114, blue: 91, alpha: 1 },
    primaryButtonLabel: "Open for a few minutes",
    primaryButtonLabelColor: { red: 255, green: 255, blue: 255, alpha: 1 },
    primaryButtonBackgroundColor: { red: 53, green: 114, blue: 91, alpha: 1 },
    secondaryButtonLabel: "Open GentleWait",
    secondaryButtonLabelColor: { red: 53, green: 114, blue: 91, alpha: 1 },
  } as const;
}

function buildIOSShieldActions(cooldownMinutes: number) {
  const cooldownMs = Math.max(cooldownMinutes, 1) * 60 * 1000;

  return {
    primary: {
      behavior: "defer" as const,
      actions: [
        { type: "addCurrentToWhitelist" as const },
        {
          type: "startMonitoring" as const,
          activityName: IOS_COOLDOWN_ACTIVITY,
          intervalStartDelayMs: 0,
          intervalEndDelayMs: cooldownMs,
          deviceActivityEvents: [],
        },
      ],
    },
    secondary: {
      behavior: "close" as const,
      actions: [
        {
          type: "openUrlWithDispatch",
          url: IOS_DEEP_LINK_URL,
        } as Action & { type: "openUrlWithDispatch"; url: string },
      ],
    },
  };
}

async function startIOSMainMonitoring(): Promise<void> {
  await startMonitoring(
    IOS_MAIN_ACTIVITY,
    {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
    },
    [],
  );
}

export async function configureIOSProtection(
  selection: IOSFamilyActivitySelection,
  cooldownMinutes: number,
): Promise<void> {
  if (!isIOSFamilyControlsAvailable()) {
    return;
  }

  stopMonitoring([IOS_MAIN_ACTIVITY, IOS_COOLDOWN_ACTIVITY]);
  cleanUpAfterActivity(IOS_MAIN_ACTIVITY);
  cleanUpAfterActivity(IOS_COOLDOWN_ACTIVITY);

  const shieldConfiguration = buildIOSShieldConfig();
  const shieldActions = buildIOSShieldActions(cooldownMinutes);

  setFamilyActivitySelectionId({
    id: IOS_SELECTION_ID,
    familyActivitySelection: selection.familyActivitySelection,
  });
  userDefaultsSet(IOS_SELECTION_METADATA_KEY, selection);

  updateShieldWithId(shieldConfiguration, shieldActions, IOS_SHIELD_ID);

  configureActions({
    activityName: IOS_MAIN_ACTIVITY,
    callbackName: "intervalDidStart",
    actions: [
      {
        type: "blockSelection",
        familyActivitySelectionId: IOS_SELECTION_ID,
        shieldId: IOS_SHIELD_ID,
      },
    ],
  });

  configureActions({
    activityName: IOS_COOLDOWN_ACTIVITY,
    callbackName: "intervalDidEnd",
    actions: [
      { type: "clearWhitelistAndUpdateBlock" },
      {
        type: "stopMonitoring",
        activityNames: [IOS_COOLDOWN_ACTIVITY],
      },
    ],
  });

  blockSelection(
    { familyActivitySelectionId: IOS_SELECTION_ID },
    "configureIOSProtection",
  );
  await startIOSMainMonitoring();
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
