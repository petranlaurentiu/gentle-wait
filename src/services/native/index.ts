/**
 * Native platform bridge for app protection.
 *
 * Android uses the legacy GentleWait native module.
 * iOS uses Apple's Family Controls via react-native-device-activity.
 */
import type {
  IOSFamilyActivitySelection,
  SelectedApp,
} from "@/src/domain/models";
import { Asset } from "expo-asset";
import { NativeModules, Platform } from "react-native";
import {
  addSelectionToWhitelistAndUpdateBlock,
  AuthorizationStatus,
  blockSelection,
  cleanUpAfterActivity,
  configureActions,
  copyFile,
  getAppGroupFileDirectory,
  getAuthorizationStatus,
  isAvailable as isDeviceActivityAvailable,
  pollAuthorizationStatus,
  requestAuthorization,
  resetBlocks,
  setFamilyActivitySelectionId,
  startMonitoring,
  stopMonitoring,
  updateShieldWithId,
  userDefaultsGet,
  userDefaultsRemove,
  userDefaultsSet,
} from "react-native-device-activity";

const GentleWaitModule = NativeModules.GentleWaitModule ?? null;

const IOS_SELECTION_ID = "gentlewait.protected-selection";
const IOS_SELECTION_METADATA_KEY = "gentlewait.protected-selection.metadata";
const FAMILY_ACTIVITY_SELECTION_IDS_KEY = "familyActivitySelectionIds";
const IOS_SHIELD_ID = "gentlewait-default";
const IOS_MAIN_ACTIVITY = `gentlewait-monitor-${IOS_SELECTION_ID}`;
const IOS_COOLDOWN_ACTIVITY = `gentlewait-cooldown-${IOS_SELECTION_ID}`;
const IOS_SHIELD_ICON_FILENAME = "shield-mascot.png";
// DeviceActivitySchedule requires a minimum 15-minute monitoring interval on iOS
const IOS_MIN_COOLDOWN_MINUTES = 15;

type PendingInterception = {
  appPackage: string;
  appLabel: string;
  ts: number;
};

export type AndroidProtectionStatus = {
  available: boolean;
  accessibilityEnabled: boolean;
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
    userDefaultsGet<Record<string, string>>(
      FAMILY_ACTIVITY_SELECTION_IDS_KEY,
    ) ?? {};

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

  return parts.length > 0 ? parts.join(" \u2022 ") : "Selection saved.";
}

async function ensureIOSShieldIcon(): Promise<string | null> {
  try {
    const appGroupDirectory = getAppGroupFileDirectory();
    if (!appGroupDirectory) {
      return null;
    }

    const mascotAsset = Asset.fromModule(
      require("../../../assets/lumi/lumi-shield-mascot.png"),
    );

    if (!mascotAsset.localUri) {
      await mascotAsset.downloadAsync();
    }

    if (!mascotAsset.localUri) {
      return null;
    }

    copyFile(
      mascotAsset.localUri,
      `${appGroupDirectory}/${IOS_SHIELD_ICON_FILENAME}`,
      true,
    );

    return IOS_SHIELD_ICON_FILENAME;
  } catch (error) {
    console.warn("[NativeService] Could not copy shield icon, using fallback:", error);
    return null;
  }
}

function buildIOSShieldConfig(iconAppGroupRelativePath: string | null) {
  return {
    backgroundBlurStyle: 18, // systemThickMaterialDark — consistent dark backdrop
    backgroundColor: { red: 15, green: 23, blue: 36, alpha: 0.85 },
    title: "A gentle pause",
    titleColor: { red: 245, green: 247, blue: 251, alpha: 1 },
    subtitle:
      "You opened this without thinking — and noticing that is already a win. Tap below, then open GentleWait.",
    subtitleColor: { red: 226, green: 232, blue: 240, alpha: 0.78 },
    iconAppGroupRelativePath: iconAppGroupRelativePath ?? undefined,
    iconSystemName: iconAppGroupRelativePath ? undefined : "leaf.circle.fill",
    iconTint: iconAppGroupRelativePath
      ? undefined
      : { red: 126, green: 230, blue: 198, alpha: 1 },
    primaryButtonLabel: "Choose calm instead",
    primaryButtonLabelColor: { red: 255, green: 255, blue: 255, alpha: 1 },
    primaryButtonBackgroundColor: { red: 52, green: 120, blue: 156, alpha: 1 },
    secondaryButtonLabel: "Continue anyway",
    secondaryButtonLabelColor: { red: 226, green: 232, blue: 240, alpha: 0.5 },
  } as const;
}

function buildIOSShieldActions(cooldownMinutes: number) {
  const cooldownMs =
    Math.max(cooldownMinutes, IOS_MIN_COOLDOWN_MINUTES) * 60 * 1000;

  return {
    primary: {
      behavior: "close" as const,
      actions: [
        // 1. Whitelist only this specific app (per-app, not entire selection)
        { type: "addCurrentToWhitelist" as const },
        // 2. Start cooldown timer to re-block this app after cooldown expires
        {
          type: "startMonitoring" as const,
          activityName: IOS_COOLDOWN_ACTIVITY,
          intervalStartDelayMs: 0,
          intervalEndDelayMs: cooldownMs,
          deviceActivityEvents: [],
        },
        // 3. Persist interception data to shared UserDefaults (always succeeds)
        {
          type: "writeUserDefaults" as any,
          key: "gentlewait.pendingShieldInterception",
          value: {
            source: "shield",
            action: "pause",
            familyActivitySelectionId: "{familyActivitySelectionId}",
            appLabel: "{applicationName}",
            webDomain: "{webDomain}",
            ts: String(Date.now()),
          },
        },
        // 4. Send notification (works if permitted, silently dropped otherwise)
        {
          type: "sendNotification" as const,
          payload: {
            title: "Nice choice — you paused",
            body: "Tap to start a quick exercise. You'll feel the difference.",
            sound: "default" as const,
            interruptionLevel: "timeSensitive" as unknown as "active",
            userInfo: {
              source: "shield",
              action: "pause",
              familyActivitySelectionId: "{familyActivitySelectionId}",
              appLabel: "{applicationName}",
              webDomain: "{webDomain}",
            },
          },
        },
        // 3. Open app directly (guaranteed fallback, no permission needed)
        {
          type: "openApp" as any,
          url: "gentlewait://shield-pause",
        },
      ],
    },
    secondary: {
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

  const shieldIconPath = await ensureIOSShieldIcon();
  const shieldConfiguration = buildIOSShieldConfig(shieldIconPath);
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
    { activitySelectionId: IOS_SELECTION_ID },
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

export async function getAndroidProtectionStatus(): Promise<AndroidProtectionStatus> {
  if (Platform.OS !== "android") {
    return {
      available: false,
      accessibilityEnabled: false,
    };
  }

  const available = isAndroidNativeModuleAvailable();
  if (!available) {
    return {
      available: false,
      accessibilityEnabled: false,
    };
  }

  try {
    const accessibilityEnabled =
      await GentleWaitModule.isAccessibilityServiceEnabled();

    return {
      available,
      accessibilityEnabled: Boolean(accessibilityEnabled),
    };
  } catch (error) {
    console.error(
      "[NativeService] Error getting Android protection status:",
      error,
    );
    return {
      available,
      accessibilityEnabled: false,
    };
  }
}

export async function openAndroidAccessibilitySettings(): Promise<boolean> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return false;
  }

  try {
    await GentleWaitModule.openAccessibilitySettings();
    return true;
  } catch (error) {
    console.error(
      "[NativeService] Error opening accessibility settings:",
      error,
    );
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

export async function getInstalledAndroidApps(): Promise<SelectedApp[]> {
  if (Platform.OS !== "android" || !isAndroidNativeModuleAvailable()) {
    return [];
  }

  try {
    const apps = await GentleWaitModule.getInstalledApps();
    if (!Array.isArray(apps)) {
      return [];
    }

    return apps.filter(
      (app): app is SelectedApp =>
        Boolean(app) &&
        typeof app.packageName === "string" &&
        typeof app.label === "string",
    );
  } catch (error) {
    console.error("[NativeService] Error getting installed apps:", error);
    return [];
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
  if (Platform.OS === "ios") {
    try {
      const pending = userDefaultsGet<{
        source: string;
        action: string;
        familyActivitySelectionId: string;
        appLabel: string;
        webDomain: string;
        ts: string;
      }>("gentlewait.pendingShieldInterception");

      if (pending?.source === "shield") {
        const appLabel =
          pending.appLabel && pending.appLabel !== "applicationName"
            ? pending.appLabel
            : pending.webDomain && pending.webDomain !== "webDomain"
              ? pending.webDomain
              : "Protected app";

        return {
          appPackage: pending.familyActivitySelectionId || "ios.familycontrols",
          appLabel,
          ts: Number(pending.ts) || Date.now(),
        };
      }
      return null;
    } catch (error) {
      if (__DEV__) console.log("[NativeService] Error reading iOS pending interception:", error);
      return null;
    }
  }

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
  if (Platform.OS === "ios") {
    userDefaultsRemove("gentlewait.pendingShieldInterception");
    return;
  }

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

export async function startIOSCooldownForSelection(
  familyActivitySelectionId: string,
  cooldownMinutes: number,
): Promise<void> {
  if (!isIOSFamilyControlsAvailable()) {
    return;
  }

  const normalizedSelectionId = familyActivitySelectionId.trim();
  if (!normalizedSelectionId) {
    return;
  }

  const cooldownMs =
    Math.max(cooldownMinutes, IOS_MIN_COOLDOWN_MINUTES) * 60 * 1000;

  addSelectionToWhitelistAndUpdateBlock(
    { activitySelectionId: normalizedSelectionId },
    "startIOSCooldownForSelection",
  );

  configureActions({
    activityName: IOS_COOLDOWN_ACTIVITY,
    callbackName: "intervalDidEnd",
    actions: [
      { type: "clearWhitelistAndUpdateBlock" as const },
      {
        type: "stopMonitoring" as const,
        activityNames: [IOS_COOLDOWN_ACTIVITY],
      },
    ],
  });

  stopMonitoring([IOS_COOLDOWN_ACTIVITY]);

  const now = new Date();
  const endAt = new Date(now.getTime() + cooldownMs);

  await startMonitoring(
    IOS_COOLDOWN_ACTIVITY,
    {
      intervalStart: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
      },
      intervalEnd: {
        year: endAt.getFullYear(),
        month: endAt.getMonth() + 1,
        day: endAt.getDate(),
        hour: endAt.getHours(),
        minute: endAt.getMinutes(),
        second: endAt.getSeconds(),
      },
      repeats: false,
    },
    [],
  );
}
