/**
 * Settings screen.
 */
import { useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { Text as AppText } from "@/src/components/Typography";
import {
  FREE_PROTECTED_APPS_LIMIT,
  getUpgradePitch,
  PRICING,
} from "@/src/constants/monetization";
import { presentBillingCustomerCenter } from "@/src/services/billing";
import {
  COOLDOWN_OPTIONS,
  WheelPicker,
  formatCooldown,
} from "@/src/components/WheelPicker";
import { deleteAllEvents } from "@/src/services/storage/sqlite";
import {
  clearProtectedApps,
  getAndroidProtectionStatus,
  getIOSSelectionSummary,
  openAndroidAccessibilitySettings,
  setSelectedApps as syncSelectedAppsToNative,
} from "@/src/services/native";
import { mmkvStorage } from "@/src/services/storage/mmkv";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { radius, spacing } from "@/src/theme/theme";
import { triggerSelectionFeedback } from "@/src/utils/haptics";
import { useFadeInAnimation, useStaggeredFadeIn } from "@/src/utils/animations";
import {
  DEFAULT_EYE_RESET_EXERCISE_PREFERENCE,
  DEFAULT_MOVE_EXERCISE_PREFERENCE,
  EYE_RESET_PREFERENCE_OPTIONS,
  MOVE_EXERCISE_PREFERENCE_OPTIONS,
  getEyeResetExercisePreferenceLabel,
  getMoveExercisePreferenceLabel,
} from "@/src/data/exercises";
import type { ExerciseEntryPoint } from "@/src/domain/models";

const PAUSE_DURATIONS = [8, 10, 15, 20, 30];
const PROMPT_OPTIONS: ("off" | "sometimes" | "always")[] = ["off", "sometimes", "always"];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const loadSettings = useAppStore((state) => state.loadSettings);
  const billingAvailable = useAppStore((state) => state.billingAvailable);
  const [cooldownModalVisible, setCooldownModalVisible] = useState(false);
  const [pendingCooldown, setPendingCooldown] = useState(settings.cooldownMinutes || 15);
  const [exerciseModalTarget, setExerciseModalTarget] =
    useState<ExerciseEntryPoint | null>(null);
  const [androidProtectionEnabled, setAndroidProtectionEnabled] = useState(false);
  const [showAllProtectedApps, setShowAllProtectedApps] = useState(false);
  const [appPendingRemoval, setAppPendingRemoval] = useState<{
    packageName: string;
    label: string;
  } | null>(null);

  const headerAnimation = useFadeInAnimation();
  const protectedAppsAnimation = useStaggeredFadeIn(0, 5);
  const pauseDurationAnimation = useStaggeredFadeIn(1, 5);
  const promptsAnimation = useStaggeredFadeIn(2, 5);
  const premiumAnimation = useStaggeredFadeIn(3, 5);
  const privacyAnimation = useStaggeredFadeIn(4, 5);

  const hasCompletedPersonalization =
    (settings.goals && settings.goals.length > 0) ||
    (settings.emotions && settings.emotions.length > 0);
  const isIOSFamilyControlsFlow = Platform.OS === "ios";
  const iosSelection = settings.iosFamilyActivitySelection;
  const hasReachedFreeAppLimit =
    !settings.premium &&
    settings.selectedApps.length >= FREE_PROTECTED_APPS_LIMIT;
  const hiddenProtectedAppsCount = Math.max(settings.selectedApps.length - 3, 0);
  const visibleProtectedApps = showAllProtectedApps
    ? settings.selectedApps
    : settings.selectedApps.slice(0, 3);
  const movePreferenceLabel = getMoveExercisePreferenceLabel(
    settings.moveExercisePreference || DEFAULT_MOVE_EXERCISE_PREFERENCE,
  );
  const eyeResetPreferenceLabel = getEyeResetExercisePreferenceLabel(
    settings.eyeResetExercisePreference || DEFAULT_EYE_RESET_EXERCISE_PREFERENCE,
  );
  const exercisePreferenceOptions =
    exerciseModalTarget === "move"
      ? MOVE_EXERCISE_PREFERENCE_OPTIONS
      : EYE_RESET_PREFERENCE_OPTIONS;

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const refreshAndroidStatus = async () => {
      const status = await getAndroidProtectionStatus();
      setAndroidProtectionEnabled(status.accessibilityEnabled);
    };

    refreshAndroidStatus().catch((error) => {
      console.error("[Settings] Failed to refresh Android protection status:", error);
    });

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshAndroidStatus().catch((error) => {
          console.error("[Settings] Failed to refresh Android protection status:", error);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (settings.selectedApps.length <= 3 && showAllProtectedApps) {
      setShowAllProtectedApps(false);
    }
  }, [settings.selectedApps.length, showAllProtectedApps]);

  const handleRemoveApp = async (packageName: string) => {
    const appToRemove = settings.selectedApps.find((app) => app.packageName === packageName);
    const appName = appToRemove?.label || "this app";
    setAppPendingRemoval({ packageName, label: appName });
  };

  const confirmRemoveApp = async () => {
    if (!appPendingRemoval) {
      return;
    }

    await triggerSelectionFeedback();
    const updatedApps = settings.selectedApps.filter(
      (app) => app.packageName !== appPendingRemoval.packageName,
    );
    updateSettings({ selectedApps: updatedApps });
    setAppPendingRemoval(null);

    try {
      await syncSelectedAppsToNative(updatedApps);
    } catch (error) {
      console.error("[Settings] Failed to sync apps to native:", error);
    }
  };

  const handleAddApps = () => {
    if (hasReachedFreeAppLimit) {
      Alert.alert(
        "Free plan limit",
        `The free plan supports up to ${FREE_PROTECTED_APPS_LIMIT} protected apps.\n\n${getUpgradePitch()}`,
        [
          { text: "Not now", style: "cancel" },
          { text: "View Premium", onPress: () => router.push("/paywall") },
        ],
      );
      return;
    }

    router.push({ pathname: "/onboarding", params: { skipToStep: "select-apps" } });
  };

  const handleCompleteProfile = () => {
    router.push({ pathname: "/onboarding", params: { mode: "complete-profile" } });
  };

  const handleChangePauseDuration = async () => {
    await triggerSelectionFeedback();
    const currentIndex = PAUSE_DURATIONS.indexOf(settings.pauseDurationSec);
    const nextIndex = (currentIndex + 1) % PAUSE_DURATIONS.length;
    updateSettings({ pauseDurationSec: PAUSE_DURATIONS[nextIndex] });
  };

  const handleOpenCooldownPicker = () => {
    setPendingCooldown(settings.cooldownMinutes || 15);
    setCooldownModalVisible(true);
  };

  const handleConfirmCooldown = () => {
    updateSettings({ cooldownMinutes: pendingCooldown });
    setCooldownModalVisible(false);
  };

  const handleOpenExercisePreferences = async (
    target: ExerciseEntryPoint,
  ) => {
    await triggerSelectionFeedback();
    setExerciseModalTarget(target);
  };

  const handleSelectExercisePreference = async (value: string) => {
    await triggerSelectionFeedback();

    if (exerciseModalTarget === "move") {
      updateSettings({
        moveExercisePreference:
          value as typeof settings.moveExercisePreference,
      });
    } else if (exerciseModalTarget === "eye-reset") {
      updateSettings({
        eyeResetExercisePreference:
          value as typeof settings.eyeResetExercisePreference,
      });
    }

    setExerciseModalTarget(null);
  };

  const handleChangePromptFrequency = async () => {
    await triggerSelectionFeedback();
    const currentIndex = PROMPT_OPTIONS.indexOf(settings.promptFrequency);
    const nextIndex = (currentIndex + 1) % PROMPT_OPTIONS.length;
    updateSettings({ promptFrequency: PROMPT_OPTIONS[nextIndex] });
  };

  const handleManageSubscription = async () => {
    const result = await presentBillingCustomerCenter();

    if (!result.success) {
      Alert.alert("Customer Center unavailable", result.error || "Please try again later.");
    }
  };

  const handleOpenAndroidAccessibilitySettings = async () => {
    const opened = await openAndroidAccessibilitySettings();

    if (!opened) {
      Alert.alert(
        "Unable to open settings",
        "Please open Android Accessibility settings manually and enable GentleWait.",
      );
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "This will reset your preferences and show the onboarding again. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            updateSettings({
              onboardingCompleted: false,
              selectedApps: [],
              goals: [],
              emotions: [],
              iosFamilyActivitySelection: null,
            });
            clearProtectedApps().catch((error) => {
              console.error("[Settings] Failed to clear native protection:", error);
            });
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your pause history, settings, and protected apps. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllEvents();

              await clearProtectedApps();

              mmkvStorage.clearAll();
              loadSettings();
              router.replace("/onboarding");
            } catch (error) {
              console.error("[Settings] Error clearing all data:", error);
              Alert.alert("Error", "Failed to clear all data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getPromptLabel = (value: string) => {
    switch (value) {
      case "always":
        return "Always";
      case "sometimes":
        return "Sometimes";
      case "off":
        return "Off";
      default:
        return value;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl * 2,
      gap: spacing.lg,
    },
    introCard: {
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    appItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: radius.button,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    removeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: "rgba(242, 166, 160, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(242, 166, 160, 0.28)",
    },
    listToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignSelf: "center",
      paddingHorizontal: spacing.md,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.button,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: radius.glass,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    settingItemAccent: {
      backgroundColor: colors.surfaceElevated,
    },
    settingMain: {
      flex: 1,
      gap: 2,
    },
    valueWrap: {
      alignItems: "flex-end",
      gap: 2,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    modalContent: {
      width: "100%",
      borderRadius: radius.card,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.bgElevated,
      gap: spacing.lg,
    },
    modalButtons: {
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "flex-end",
    },
    modalOptionList: {
      gap: spacing.sm,
    },
    modalOptionButton: {
      borderRadius: radius.button,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    modalOptionButtonSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    modalOptionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    removeModalContent: {
      width: "100%",
      borderRadius: radius.card,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.bgElevated,
      gap: spacing.md,
      maxWidth: 380,
    },
    removeModalIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      backgroundColor: "rgba(242, 166, 160, 0.14)",
      borderWidth: 1,
      borderColor: "rgba(242, 166, 160, 0.24)",
    },
    removeModalTextWrap: {
      gap: spacing.xs,
      alignItems: "center",
    },
    removeModalButtons: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    removeModalButton: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimation]}>
        <View>
          <AppText variant="eyebrow" color="secondary">Preferences</AppText>
          <AppText variant="screenTitle">Settings</AppText>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={protectedAppsAnimation}>
          <GlassCard glowColor="primary">
            <View style={styles.introCard}>
              <View style={{ gap: 4 }}>
                <AppText variant="eyebrow" color="secondary">Configuration</AppText>
                <AppText variant="sectionTitle">Shape the pause to fit your day</AppText>
              </View>
              <AppText variant="body" color="secondary">
                Your protected apps, pacing, and prompts all live here. The goal is calm friction, not interruption.
              </AppText>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View style={[styles.section, protectedAppsAnimation]}>
          <AppText variant="eyebrow" color="secondary">Protected apps</AppText>
          {isIOSFamilyControlsFlow ? (
            iosSelection ? (
              <View style={styles.list}>
                <View style={styles.appItem}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="heading">Family Controls selection</AppText>
                    <AppText variant="caption" color="secondary">
                      {getIOSSelectionSummary(iosSelection)}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={async () => {
                      await triggerSelectionFeedback();
                      await clearProtectedApps();
                      updateSettings({ iosFamilyActivitySelection: null });
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText variant="caption" color="accent">Clear</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <GlassCard intensity="light">
                <AppText variant="body" color="secondary" align="center">
                  No iPhone apps selected yet. Add a Family Controls selection to start.
                </AppText>
              </GlassCard>
            )
          ) : settings.selectedApps.length > 0 ? (
            <View style={styles.list}>
              {visibleProtectedApps.map((app) => (
                <View key={app.packageName} style={styles.appItem}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="heading">{app.label}</AppText>
                    <AppText variant="caption" color="secondary">A pause appears before this app opens.</AppText>
                  </View>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveApp(app.packageName)} activeOpacity={0.8}>
                    <AppText variant="caption" color="accent">Remove</AppText>
                  </TouchableOpacity>
                </View>
              ))}
              {settings.selectedApps.length > 3 && (
                <TouchableOpacity
                  style={styles.listToggleButton}
                  onPress={() => setShowAllProtectedApps((current) => !current)}
                  activeOpacity={0.82}
                >
                  <AppText variant="caption" color="primary">
                    {showAllProtectedApps
                      ? "Show less"
                      : `Show ${hiddenProtectedAppsCount} more`}
                  </AppText>
                  <Ionicons
                    name={showAllProtectedApps ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <GlassCard intensity="light">
              <AppText variant="body" color="secondary" align="center">
                No apps protected yet. Add a few apps to start shaping a gentler routine.
              </AppText>
            </GlassCard>
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleAddApps} activeOpacity={0.82}>
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <AppText variant="button" color="inverse">
              {isIOSFamilyControlsFlow
                ? iosSelection
                  ? "Edit Family Controls Selection"
                  : "Choose Apps"
                : hasReachedFreeAppLimit
                  ? "Upgrade for More Apps"
                  : "Add Apps"}
            </AppText>
          </TouchableOpacity>
          {!settings.premium && !isIOSFamilyControlsFlow && (
            <AppText variant="caption" color="secondary" align="center">
              Free plan: up to {FREE_PROTECTED_APPS_LIMIT} protected apps.
            </AppText>
          )}
          {!settings.premium && isIOSFamilyControlsFlow && (
            <AppText variant="caption" color="secondary" align="center">
              Free plan: up to {FREE_PROTECTED_APPS_LIMIT} iPhone apps. Categories and websites require Premium.
            </AppText>
          )}
        </Animated.View>

        <Animated.View style={[styles.section, pauseDurationAnimation]}>
          <AppText variant="eyebrow" color="secondary">Pacing</AppText>
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePauseDuration} activeOpacity={0.82}>
            <View style={styles.settingMain}>
              <AppText variant="heading">Pause duration</AppText>
              <AppText variant="caption" color="secondary">How long the breathing pause lasts before the app opens.</AppText>
            </View>
            <View style={styles.valueWrap}>
              <AppText variant="heading" color="primary">{settings.pauseDurationSec}s</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleOpenCooldownPicker} activeOpacity={0.82}>
            <View style={styles.settingMain}>
              <AppText variant="heading">Cooldown</AppText>
              <AppText variant="caption" color="secondary">The quiet window between two pauses.</AppText>
            </View>
            <View style={styles.valueWrap}>
              <AppText variant="heading" color="primary">{formatCooldown(settings.cooldownMinutes || 15)}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, promptsAnimation]}>
          <AppText variant="eyebrow" color="secondary">Exercises</AppText>
          <View style={styles.list}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleOpenExercisePreferences("move")}
              activeOpacity={0.82}
            >
              <View style={styles.settingMain}>
                <AppText variant="heading">Move</AppText>
                <AppText variant="caption" color="secondary">
                  Choose which type of movement break opens from Pause and Home.
                </AppText>
              </View>
              <View style={styles.valueWrap}>
                <AppText variant="heading" color="primary">
                  {movePreferenceLabel}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => handleOpenExercisePreferences("eye-reset")}
              activeOpacity={0.82}
            >
              <View style={styles.settingMain}>
                <AppText variant="heading">Eye Reset</AppText>
                <AppText variant="caption" color="secondary">
                  Choose which eye or posture reset opens from Pause and Home.
                </AppText>
              </View>
              <View style={styles.valueWrap}>
                <AppText variant="heading" color="primary">
                  {eyeResetPreferenceLabel}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {Platform.OS === "android" && (
          <Animated.View style={[styles.section, promptsAnimation]}>
            <AppText variant="eyebrow" color="secondary">Android protection</AppText>
            <View style={styles.list}>
              <View style={styles.settingItem}>
                <View style={styles.settingMain}>
                  <AppText variant="heading">Accessibility service</AppText>
                  <AppText variant="caption" color="secondary">
                    Needed to detect when one of your chosen apps comes to the foreground.
                  </AppText>
                </View>
                <AppText variant="heading" color={androidProtectionEnabled ? "primary" : "accent"}>
                  {androidProtectionEnabled ? "Enabled" : "Off"}
                </AppText>
              </View>
              <TouchableOpacity
                style={[styles.settingItem, styles.settingItemAccent]}
                onPress={handleOpenAndroidAccessibilitySettings}
                activeOpacity={0.82}
              >
                <View style={styles.settingMain}>
                  <AppText variant="heading">
                    {androidProtectionEnabled ? "Review accessibility access" : "Enable accessibility access"}
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    GentleWait only uses this to notice the apps you selected and open a pause screen. It does not read what you type.
                  </AppText>
                </View>
                <Ionicons
                  name={androidProtectionEnabled ? "checkmark-circle-outline" : "settings-outline"}
                  size={20}
                  color={androidProtectionEnabled ? colors.primary : colors.accent}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.section, promptsAnimation]}>
          <AppText variant="eyebrow" color="secondary">Prompts</AppText>
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePromptFrequency} activeOpacity={0.82}>
            <View style={styles.settingMain}>
              <AppText variant="heading">Reflection prompts</AppText>
              <AppText variant="caption" color="secondary">Short questions that bring intention back into the moment.</AppText>
            </View>
            <View style={styles.valueWrap}>
              <AppText variant="heading" color="primary">{getPromptLabel(settings.promptFrequency)}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.section, premiumAnimation]}>
          <AppText variant="eyebrow" color="secondary">Plan</AppText>
          <View style={styles.list}>
            <View style={styles.settingItem}>
              <View style={styles.settingMain}>
                <AppText variant="heading">Current plan</AppText>
                <AppText variant="caption" color="secondary">
                  {settings.premium
                    ? "Unlimited protected apps and AI Companion access."
                    : `Free includes ${FREE_PROTECTED_APPS_LIMIT} protected apps and no AI Companion.`}
                </AppText>
              </View>
              <AppText variant="heading" color="primary">{settings.premium ? "Premium" : "Free"}</AppText>
            </View>
            {!settings.premium && (
              <TouchableOpacity
                style={[styles.settingItem, styles.settingItemAccent]}
                onPress={() => router.push("/paywall")}
                activeOpacity={0.82}
              >
                <View style={styles.settingMain}>
                  <AppText variant="heading">Upgrade to Premium</AppText>
                  <AppText variant="caption" color="secondary">
                    Unlimited apps, AI Companion, and deeper guidance from {PRICING.monthly}.
                  </AppText>
                </View>
                <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            {settings.premium && billingAvailable && (
              <TouchableOpacity
                style={[styles.settingItem, styles.settingItemAccent]}
                onPress={handleManageSubscription}
                activeOpacity={0.82}
              >
                <View style={styles.settingMain}>
                  <AppText variant="heading">Manage plan</AppText>
                  <AppText variant="caption" color="secondary">
                    Review your billing, renewal, and premium access details.
                  </AppText>
                </View>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {!hasCompletedPersonalization && (
          <Animated.View style={[styles.section, privacyAnimation]}>
            <AppText variant="eyebrow" color="secondary">Personalization</AppText>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemAccent]} onPress={handleCompleteProfile} activeOpacity={0.82}>
              <View style={styles.settingMain}>
                <AppText variant="heading">Complete your profile</AppText>
                <AppText variant="caption" color="secondary">
                  Add goals and emotional context for more tailored insights and AI support.
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View style={[styles.section, privacyAnimation]}>
          <AppText variant="eyebrow" color="secondary">Privacy and data</AppText>
          <View style={styles.list}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                Alert.alert(
                  "Privacy Promise",
                  "Your data never leaves your device. We don't collect, store, or share your personal mindfulness data."
                );
              }}
              activeOpacity={0.82}
            >
              <View style={styles.settingMain}>
                <AppText variant="heading">Privacy promise</AppText>
                <AppText variant="caption" color="secondary">All your pause and reflection data stays on-device.</AppText>
              </View>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleResetOnboarding} activeOpacity={0.82}>
              <View style={styles.settingMain}>
                <AppText variant="heading" color="accent">Reset onboarding</AppText>
                <AppText variant="caption" color="secondary">Start setup again without wiping your entire history.</AppText>
              </View>
              <Ionicons name="refresh-outline" size={20} color={colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData} activeOpacity={0.82}>
              <View style={styles.settingMain}>
                <AppText variant="heading" color="accent">Clear all data</AppText>
                <AppText variant="caption" color="secondary">Delete history, settings, and protected apps.</AppText>
              </View>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <AppText variant="caption" color="tertiary" align="center">GentleWait v1.0.0</AppText>
      </ScrollView>

      <Modal
        visible={cooldownModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCooldownModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ gap: 4 }}>
              <AppText variant="sectionTitle">Time between pauses</AppText>
              <AppText variant="body" color="secondary">Choose how much breathing room you want after each interruption.</AppText>
            </View>
            <WheelPicker
              items={COOLDOWN_OPTIONS}
              selectedValue={pendingCooldown}
              onValueChange={setPendingCooldown}
            />
            <View style={styles.modalButtons}>
              <Button label="Cancel" onPress={() => setCooldownModalVisible(false)} variant="ghost" />
              <Button label="Done" onPress={handleConfirmCooldown} variant="primary" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(exerciseModalTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setExerciseModalTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ gap: 4 }}>
              <AppText variant="sectionTitle">
                {exerciseModalTarget === "move"
                  ? "Move preference"
                  : "Eye Reset preference"}
              </AppText>
              <AppText variant="body" color="secondary">
                {exerciseModalTarget === "move"
                  ? "Choose what the Move action should open by default."
                  : "Choose what the Eye Reset action should open by default."}
              </AppText>
            </View>

            <ScrollView
              style={{ maxHeight: 340 }}
              contentContainerStyle={styles.modalOptionList}
              showsVerticalScrollIndicator={false}
            >
              {exercisePreferenceOptions.map((option) => {
                const isSelected =
                  exerciseModalTarget === "move"
                    ? option.id ===
                      (settings.moveExercisePreference ||
                        DEFAULT_MOVE_EXERCISE_PREFERENCE)
                    : option.id ===
                      (settings.eyeResetExercisePreference ||
                        DEFAULT_EYE_RESET_EXERCISE_PREFERENCE);

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.modalOptionButton,
                      isSelected && styles.modalOptionButtonSelected,
                    ]}
                    onPress={() => handleSelectExercisePreference(option.id)}
                    activeOpacity={0.82}
                  >
                    <View style={styles.modalOptionHeader}>
                      <AppText
                        variant="heading"
                        color={isSelected ? "primary" : "default"}
                      >
                        {option.label}
                      </AppText>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null}
                    </View>
                    <AppText variant="caption" color="secondary">
                      {option.description}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                label="Close"
                onPress={() => setExerciseModalTarget(null)}
                variant="ghost"
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(appPendingRemoval)}
        transparent
        animationType="fade"
        onRequestClose={() => setAppPendingRemoval(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.removeModalContent}>
            <View style={styles.removeModalIcon}>
              <Ionicons name="trash-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.removeModalTextWrap}>
              <AppText variant="sectionTitle" align="center">Remove protected app?</AppText>
              <AppText variant="body" color="secondary" align="center">
                Remove {appPendingRemoval?.label} from your protected apps.
                GentleWait will stop showing a pause before it opens.
              </AppText>
            </View>
            <View style={styles.removeModalButtons}>
              <View style={styles.removeModalButton}>
                <Button
                  label="Cancel"
                  onPress={() => setAppPendingRemoval(null)}
                  variant="ghost"
                />
              </View>
              <View style={styles.removeModalButton}>
                <Button
                  label="Remove"
                  onPress={confirmRemoveApp}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
