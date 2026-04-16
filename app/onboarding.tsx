/**
 * Onboarding flow screen with hero welcome, program preview, and optional personalization
 * Liquid Glass Design System
 */
import { Button } from "@/src/components/Button";
import { Checkbox } from "@/src/components/Checkbox";
import { GlassCard } from "@/src/components/GlassCard";
import { COOLDOWN_OPTIONS, WheelPicker } from "@/src/components/WheelPicker";
import {
  getIOSProtectionFootnote,
  getIOSSanitizationNotice,
  getIOSSelectionValidationMessage,
  hasIOSProtectedApps,
} from "@/src/constants/iosProtection";
import {
  FREE_PROTECTED_APPS_LIMIT,
  getUpgradePitch,
} from "@/src/constants/monetization";
import type { IOSFamilyActivitySelection } from "@/src/domain/models";
import {
  APP_CATEGORIES,
  AppCategory,
  CategorizedApp,
  filterApps,
  getAppsByCategory,
  getInstalledApps,
  getSuggestedApps,
} from "@/src/services/apps";
import {
  configureIOSProtection,
  getIOSFamilyControlsRawSelection,
  getIOSSelectionSummary,
  isIOSFamilyControlsAvailable,
  isServiceEnabled,
  requestServiceAuthorization,
  saveIOSFamilyControlsSelection,
  setSelectedApps as syncSelectedAppsToNative,
} from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import { useFadeInAnimation } from "@/src/utils/animations";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ReanimatedAnimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const DeviceActivitySelectionView =
  Platform.OS === "ios"
    ? require("react-native-device-activity").DeviceActivitySelectionView
    : null;

const mainLogo = require("@/assets/images/main_logo.png");
const lumiStoryVideo = require("@/assets/lumi/video/lumi_video.mp4");
const lumiPreviewVideo = require("@/assets/lumi/video/lumi_ai.mp4");

const PROGRAM_PREVIEW_STEPS = [
  {
    label: "Choose apps",
    icon: "apps-outline",
    description: "Pick the apps that pull you in.",
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.62)",
    surface: "rgba(39, 92, 78, 0.94)",
  },
  {
    label: "Pause first",
    icon: "flower-outline",
    description: "Get a breath before opening.",
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.64)",
    surface: "rgba(29, 74, 104, 0.94)",
  },
  {
    label: "Choose next",
    icon: "compass-outline",
    description: "Continue or choose a calmer step.",
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.64)",
    surface: "rgba(93, 78, 31, 0.94)",
  },
  {
    label: "See rhythm",
    icon: "analytics-outline",
    description: "Build streaks and spot patterns.",
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.62)",
    surface: "rgba(91, 43, 70, 0.94)",
  },
] as const;

const HERO_VALUE_PROPS = [
  {
    icon: "flower-outline",
    text: "Breathe",
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.42)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
  {
    icon: "fitness-outline",
    text: "Move",
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.44)",
    surface: "rgba(82, 192, 255, 0.1)",
  },
  {
    icon: "pencil-outline",
    text: "Reflect",
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.42)",
    surface: "rgba(244, 211, 94, 0.1)",
  },
  {
    icon: "journal-outline",
    text: "Journal",
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.42)",
    surface: "rgba(255, 122, 182, 0.1)",
  },
  {
    icon: "heart-outline",
    text: "Pray",
    accent: "#FB7185",
    glow: "rgba(251, 113, 133, 0.42)",
    surface: "rgba(251, 113, 133, 0.1)",
  },
  {
    icon: "leaf-outline",
    text: "Ground",
    accent: "#A78BFA",
    glow: "rgba(167, 139, 250, 0.42)",
    surface: "rgba(167, 139, 250, 0.1)",
  },
] as const;

const CURRENT_STATE_STAT_ACCENTS = [
  {
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.46)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
  {
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.48)",
    surface: "rgba(82, 192, 255, 0.1)",
  },
  {
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.46)",
    surface: "rgba(244, 211, 94, 0.1)",
  },
] as const;

const CURRENT_STATE_SUPPORT_ACCENTS = [
  "#7EE6C6",
  "#52C0FF",
  "#FF7AB6",
] as const;

const TIME_OPTION_ACCENTS = [
  {
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.44)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
  {
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.44)",
    surface: "rgba(82, 192, 255, 0.1)",
  },
  {
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.42)",
    surface: "rgba(244, 211, 94, 0.1)",
  },
  {
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.42)",
    surface: "rgba(255, 122, 182, 0.1)",
  },
] as const;

const CURRENT_TIME_OPTION_ACCENTS = [
  TIME_OPTION_ACCENTS[0],
  TIME_OPTION_ACCENTS[0],
  TIME_OPTION_ACCENTS[1],
  TIME_OPTION_ACCENTS[1],
  TIME_OPTION_ACCENTS[2],
  TIME_OPTION_ACCENTS[2],
  TIME_OPTION_ACCENTS[3],
  TIME_OPTION_ACCENTS[3],
  TIME_OPTION_ACCENTS[3],
] as const;

const ANALYSIS_STAT_ACCENTS = [
  {
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.46)",
    surface: "rgba(255, 122, 182, 0.1)",
  },
  {
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.46)",
    surface: "rgba(82, 192, 255, 0.1)",
  },
] as const;

const PROJECTION_STAT_ACCENTS = [
  {
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.48)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
  {
    accent: "#F4D35E",
    glow: "rgba(244, 211, 94, 0.46)",
    surface: "rgba(244, 211, 94, 0.1)",
  },
] as const;

const SUMMARY_GOAL_ACCENTS = [
  {
    accent: "#7EE6C6",
    glow: "rgba(126, 230, 198, 0.42)",
    surface: "rgba(126, 230, 198, 0.1)",
  },
  {
    accent: "#52C0FF",
    glow: "rgba(82, 192, 255, 0.42)",
    surface: "rgba(82, 192, 255, 0.1)",
  },
  {
    accent: "#FF7AB6",
    glow: "rgba(255, 122, 182, 0.4)",
    surface: "rgba(255, 122, 182, 0.1)",
  },
] as const;

type SetupPath = "quick" | "personalized" | null;

type OnboardingStep =
  | "welcome-hero"
  | "program-preview"
  | "setup-choice"
  | "name"
  | "goals"
  | "time-current"
  | "time-goal"
  | "age"
  | "emotional"
  | "current-state"
  | "analysis"
  | "projection"
  | "summary"
  | "select-apps"
  | "permissions"
  | "duration"
  | "cooldown"
  | "notifications"
  | "done";

// Age ranges
const AGE_RANGES = [
  { id: "under-18", label: "Under 18" },
  { id: "18-24", label: "18-24" },
  { id: "25-34", label: "25-34" },
  { id: "35-44", label: "35-44" },
  { id: "45-54", label: "45-54" },
  { id: "55+", label: "55+" },
];

const getStepOrder = (
  setupPath: SetupPath,
  isCompleteProfileMode: boolean = false,
): OnboardingStep[] => {
  // Complete profile mode - only personalization questions, no app selection
  if (isCompleteProfileMode) {
    return [
      "goals",
      "time-current",
      "time-goal",
      "age",
      "emotional",
      "current-state",
      "analysis",
      "projection",
      "done",
    ];
  }

  const baseSteps: OnboardingStep[] = [
    "welcome-hero",
    "program-preview",
    "setup-choice",
    "name",
  ];

  const isIOS = Platform.OS === "ios";
  // Family Controls is unavailable on macOS (Mac Catalyst) — skip permissions step there
  const iosFamilyControlsAvailable = isIOS && isIOSFamilyControlsAvailable();

  if (setupPath === "personalized") {
    return [
      ...baseSteps,
      "goals",
      "time-current",
      "time-goal",
      "age",
      "emotional",
      "current-state",
      "analysis",
      "projection",
      "summary",
      // iOS needs authorization before the picker can show real apps
      ...(iosFamilyControlsAvailable
        ? (["permissions", "select-apps"] as const)
        : isIOS
          ? (["select-apps"] as const)
          : (["select-apps", "permissions"] as const)),
      "duration",
      "cooldown",
      ...(isIOS ? (["notifications"] as const) : []),
      "done",
    ];
  }

  // Quick setup path - skip all personalized questions
  return [
    ...baseSteps,
    ...(iosFamilyControlsAvailable
      ? (["permissions", "select-apps"] as const)
      : isIOS
        ? (["select-apps"] as const)
        : (["select-apps", "permissions"] as const)),
    "duration",
    "cooldown",
    ...(isIOS ? (["notifications"] as const) : []),
    "done",
  ];
};

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { width, height: screenHeight } = useWindowDimensions();
  const isCompactPreviewViewport = width < 420 || screenHeight < 880;
  const isTablet = width >= 768;
  const isLaptopPreviewLayout = width >= 1024;

  // Check if we should skip to a specific step (e.g., from settings)
  const skipToStep = params.skipToStep as OnboardingStep | undefined;
  const mode = params.mode as string | undefined; // "complete-profile" for adding personalization later
  const isCompleteProfileMode = mode === "complete-profile";
  const isScreenshotMode =
    params.screenshotMode === "1" || params.screenshotMode === "true";
  const isSimulatorScreenshotMode =
    isScreenshotMode || (__DEV__ && Platform.OS === "ios");

  // For complete-profile mode, start at goals step
  const initialStep = isCompleteProfileMode
    ? "goals"
    : skipToStep || "welcome-hero";

  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [setupPath, setSetupPath] = useState<SetupPath>(
    skipToStep === "select-apps" || isCompleteProfileMode ? "quick" : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [availableApps, setAvailableApps] = useState<CategorizedApp[]>([]);
  const [selectedAppSet, setSelectedAppSet] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    AppCategory | "all" | "suggested"
  >("suggested");
  const [pauseDuration, setPauseDuration] = useState(15);
  const [cooldownMinutes, setCooldownMinutes] = useState(15);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [upgradePromptMessage, setUpgradePromptMessage] = useState<
    string | null
  >(null);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const setNotificationsDenied = useAppStore(
    (state) => state.setNotificationsDenied,
  );
  const currentSettings = useAppStore((state) => state.settings);
  const billingAvailable = useAppStore((state) => state.billingAvailable);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [stepKey, setStepKey] = useState(0);
  const [iosPickerKey, setIOSPickerKey] = useState(0);
  const [iosRawSelection, setIOSRawSelection] = useState<string | null>(null);
  const [hasShownIOSAppSelectionSkipNotice, setHasShownIOSAppSelectionSkipNotice] =
    useState(false);

  // Onboarding state - initialize from current settings if in complete-profile mode
  const [userName, setUserName] = useState(
    isCompleteProfileMode ? currentSettings.userName || "" : "",
  );
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(
    isCompleteProfileMode && currentSettings.goals?.length
      ? new Set(currentSettings.goals)
      : new Set(),
  );
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(
    isCompleteProfileMode && currentSettings.emotions?.length
      ? new Set(currentSettings.emotions)
      : new Set(),
  );
  const [dailyScreenTime, setDailyScreenTime] = useState(
    isCompleteProfileMode ? currentSettings.dailyScreenTimeHours || 4 : 4,
  );
  const [targetScreenTime, setTargetScreenTime] = useState(
    isCompleteProfileMode ? currentSettings.targetScreenTimeHours || 2 : 2,
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    isCompleteProfileMode ? currentSettings.ageRange || null : null,
  );
  const [permissionEnabled, setPermissionEnabled] = useState(false);
  const [iosFamilyActivitySelection, setIOSFamilyActivitySelection] =
    useState<IOSFamilyActivitySelection | null>(
      currentSettings.iosFamilyActivitySelection || null,
    );
  const hasProtectedAppsPremium = currentSettings.premium && billingAvailable;
  const hasReachedFreeAppLimit =
    !hasProtectedAppsPremium &&
    selectedAppSet.size >= FREE_PROTECTED_APPS_LIMIT;
  const isIOSFamilyControlsFlow = Platform.OS === "ios";

  if (__DEV__) {
    console.log("[Billing] App selection premium check:", {
      premium: currentSettings.premium,
      billingAvailable,
      hasProtectedAppsPremium,
      hasReachedFreeAppLimit,
      selectedAppsCount: selectedAppSet.size,
    });
  }
  const isCompactCooldownViewport = width < 420 || screenHeight < 820;

  // Animation hooks
  const stepAnimation = useFadeInAnimation();
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(12);

  // Reset animation key when step changes
  useEffect(() => {
    setStepKey((prev) => prev + 1);
    setValidationMessage(null);
    setUpgradePromptMessage(null);
  }, [step]);

  useEffect(() => {
    if (!validationMessage) {
      toastOpacity.value = withTiming(0, { duration: 180 });
      toastTranslateY.value = withTiming(12, { duration: 180 });
      return;
    }

    toastOpacity.value = 0;
    toastTranslateY.value = 12;
    toastOpacity.value = withTiming(1, { duration: 180 });
    toastTranslateY.value = withTiming(0, { duration: 220 });

    const fadeTimeoutId = setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 220 });
      toastTranslateY.value = withTiming(8, { duration: 220 });
    }, 1600);

    const clearTimeoutId = setTimeout(() => {
      setValidationMessage(null);
    }, 2000);

    return () => {
      clearTimeout(fadeTimeoutId);
      clearTimeout(clearTimeoutId);
    };
  }, [toastOpacity, toastTranslateY, validationMessage]);

  // Load available apps on mount
  useEffect(() => {
    (async () => {
      try {
        if (isIOSFamilyControlsFlow) {
          const existingRaw = getIOSFamilyControlsRawSelection();
          if (existingRaw) {
            setIOSRawSelection(existingRaw);
          }
          if (currentSettings.iosFamilyActivitySelection) {
            setIOSFamilyActivitySelection(
              currentSettings.iosFamilyActivitySelection,
            );
          }
          return;
        }

        const apps = await getInstalledApps();
        setAvailableApps(apps);

        // If coming from settings, pre-select already protected apps
        if (skipToStep === "select-apps") {
          const currentAppPackages = new Set(
            currentSettings.selectedApps.map((app) => app.packageName),
          );
          setSelectedAppSet(currentAppPackages);
        }
      } catch (error) {
        console.error("Failed to load apps:", error);
      }
    })();
  }, [
    currentSettings.iosFamilyActivitySelection,
    currentSettings.selectedApps,
    isIOSFamilyControlsFlow,
    skipToStep,
  ]);

  // No cleanup needed — non-persisted view manages selection in React state

  useEffect(() => {
    if (
      hasProtectedAppsPremium ||
      isIOSFamilyControlsFlow ||
      selectedAppSet.size <= FREE_PROTECTED_APPS_LIMIT
    ) {
      return;
    }

    setSelectedAppSet(
      new Set(Array.from(selectedAppSet).slice(0, FREE_PROTECTED_APPS_LIMIT)),
    );
  }, [hasProtectedAppsPremium, isIOSFamilyControlsFlow, selectedAppSet]);

  // Check accessibility/Family Controls permission status
  const checkPermissionStatus = async () => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    try {
      const enabled = await isServiceEnabled();
      setPermissionEnabled(enabled);
    } catch (error) {
      console.error("Error checking permission status:", error);
    }
  };

  // Check permission when permissions step is active
  useEffect(() => {
    if (step === "permissions") {
      checkPermissionStatus();

      // Check permission when app comes back to foreground
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (nextAppState === "active") {
            checkPermissionStatus();
          }
        },
      );

      // Also check periodically while on this screen
      const interval = setInterval(checkPermissionStatus, 2000);

      return () => {
        subscription.remove();
        clearInterval(interval);
      };
    }
  }, [step]);

  // Re-check notification permission when returning from Settings
  useEffect(() => {
    if (step !== "notifications" || Platform.OS !== "ios") return;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        Notifications.getPermissionsAsync()
          .then((result) => {
            setNotificationsGranted(result.granted);
            setNotificationsDenied(!result.granted);
          })
          .catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, [step, setNotificationsDenied]);

  const handleAppToggle = (packageName: string) => {
    const newSet = new Set(selectedAppSet);
    if (newSet.has(packageName)) {
      newSet.delete(packageName);
    } else {
      if (
        !hasProtectedAppsPremium &&
        selectedAppSet.size >= FREE_PROTECTED_APPS_LIMIT
      ) {
        setValidationMessage(null);
        setUpgradePromptMessage(
          `You can protect up to ${FREE_PROTECTED_APPS_LIMIT} apps on the free plan.\n\n${getUpgradePitch()}`,
        );
        return;
      }
      newSet.add(packageName);
    }
    setSelectedAppSet(newSet);
  };

  // Get apps to display based on category filter
  const getDisplayedApps = (): CategorizedApp[] => {
    let apps = availableApps;

    // Apply search filter first
    if (searchQuery.trim()) {
      apps = filterApps(apps, searchQuery);
    }

    // Apply category filter
    if (selectedCategory === "suggested") {
      return getSuggestedApps(apps);
    } else if (selectedCategory !== "all") {
      return getAppsByCategory(apps, selectedCategory);
    }

    return apps;
  };

  const displayedApps = getDisplayedApps();
  const selectedGoalList = Array.from(selectedGoals);
  const selectedEmotionList = Array.from(selectedEmotions);
  const primaryGoal = selectedGoalList[0] || "Reduce my screen time";
  const primaryEmotion = selectedEmotionList[0] || "Mentally drained";
  const secondaryEmotion = selectedEmotionList[1] || null;
  const currentStateStats = [
    {
      label: "Current screen time",
      value: `${dailyScreenTime}h / day`,
      icon: "phone-portrait-outline" as const,
    },
    {
      label: "Target rhythm",
      value: `${targetScreenTime}h / day`,
      icon: "flag-outline" as const,
    },
    {
      label: "Primary goal",
      value: primaryGoal,
      icon: "sparkles-outline" as const,
    },
  ];
  const gentleWaitSupports = [
    `Interrupt the urge when you feel ${primaryEmotion.toLowerCase()}.`,
    `Turn "${primaryGoal}" into a small daily ritual instead of a vague intention.`,
    `Use ${pauseDuration} second pauses to create space before autopilot takes over.`,
  ];
  const dailyHoursBack = Math.max(dailyScreenTime - targetScreenTime, 0);

  // Check if all displayed apps are selected
  const allDisplayedSelected =
    displayedApps.length > 0 &&
    displayedApps.every((app) => selectedAppSet.has(app.packageName));

  // Handle "Select All" / "Deselect All" for current view
  const handleToggleAllDisplayed = () => {
    const newSet = new Set(selectedAppSet);
    if (allDisplayedSelected) {
      // Deselect all displayed
      displayedApps.forEach((app) => newSet.delete(app.packageName));
    } else {
      if (!hasProtectedAppsPremium) {
        const remainingSlots = Math.max(
          FREE_PROTECTED_APPS_LIMIT - newSet.size,
          0,
        );

        if (remainingSlots === 0) {
          setValidationMessage(null);
          setUpgradePromptMessage(
            `You can protect up to ${FREE_PROTECTED_APPS_LIMIT} apps on the free plan.\n\n${getUpgradePitch()}`,
          );
          return;
        }

        const appsToAdd = displayedApps.filter(
          (app) => !newSet.has(app.packageName),
        );

        appsToAdd.slice(0, remainingSlots).forEach((app) => {
          newSet.add(app.packageName);
        });

        if (appsToAdd.length > remainingSlots) {
          setValidationMessage(null);
          setUpgradePromptMessage(
            `Only ${remainingSlots} more ${
              remainingSlots === 1 ? "app fits" : "apps fit"
            } on the free plan.\n\n${getUpgradePitch()}`,
          );
        }

        setSelectedAppSet(newSet);
        return;
      }

      // Select all displayed
      displayedApps.forEach((app) => newSet.add(app.packageName));
    }
    setSelectedAppSet(newSet);
  };

  const validateIOSSelectionForPlan = () => {
    const message = getIOSSelectionValidationMessage(
      iosFamilyActivitySelection,
      {
        freeLimit: FREE_PROTECTED_APPS_LIMIT,
        hasPremiumAccess: hasProtectedAppsPremium,
      },
    );

    if (message) {
      setUpgradePromptMessage(null);

      const totalSelected =
        (iosFamilyActivitySelection?.applicationCount ?? 0) +
        (iosFamilyActivitySelection?.categoryCount ?? 0) +
        (iosFamilyActivitySelection?.webDomainCount ?? 0);
      if (
        !hasProtectedAppsPremium &&
        totalSelected > FREE_PROTECTED_APPS_LIMIT
      ) {
        setValidationMessage(null);
        setUpgradePromptMessage(message);
      } else {
        setValidationMessage(message);
      }

      return false;
    }

    return true;
  };

  const handleNext = async () => {
    const stepOrder = getStepOrder(setupPath, isCompleteProfileMode);
    const currentIndex = stepOrder.indexOf(step);

    if (step === "setup-choice" && setupPath === null) {
      // User hasn't chosen yet
      return;
    }

    // Validation for steps that require selections
    if (step === "name" && !userName.trim()) {
      Alert.alert("Name Required", "Please enter your name to continue.");
      return;
    }

    if (step === "goals" && selectedGoals.size === 0) {
      setValidationMessage(
        "Choose at least one goal to shape your GentleWait journey.",
      );
      return;
    }

    if (step === "emotional" && selectedEmotions.size === 0) {
      setValidationMessage(
        "Choose at least one emotion so GentleWait can respond with the right tone.",
      );
      return;
    }

    if (step === "time-current" && dailyScreenTime === 0) {
      Alert.alert(
        "Select Screen Time",
        "Please select your current daily screen time.",
      );
      return;
    }

    if (step === "time-goal" && targetScreenTime === 0) {
      Alert.alert(
        "Select Target Time",
        "Please select your target screen time goal.",
      );
      return;
    }

    if (
      step === "select-apps" &&
      isIOSFamilyControlsFlow &&
      !isSimulatorScreenshotMode &&
      !hasShownIOSAppSelectionSkipNotice &&
      !hasIOSProtectedApps(iosFamilyActivitySelection)
    ) {
      Alert.alert(
        "You can choose apps later",
        "GentleWait will finish setup now. When you're ready, open Settings and choose the apps you want GentleWait to pause before.",
      );
      setHasShownIOSAppSelectionSkipNotice(true);
    }

    if (
      step === "select-apps" &&
      !isIOSFamilyControlsFlow &&
      !isSimulatorScreenshotMode &&
      selectedAppSet.size === 0
    ) {
      Alert.alert(
        "Select Apps",
        "Please select at least one app to monitor. This is required for GentleWait to work.",
      );
      return;
    }

    if (
      step === "select-apps" &&
      isIOSFamilyControlsFlow &&
      hasIOSProtectedApps(iosFamilyActivitySelection) &&
      !validateIOSSelectionForPlan()
    ) {
      return;
    }

    if (
      step === "select-apps" &&
      !isIOSFamilyControlsFlow &&
      !hasProtectedAppsPremium &&
      selectedAppSet.size > FREE_PROTECTED_APPS_LIMIT
    ) {
      setSelectedAppSet(
        new Set(Array.from(selectedAppSet).slice(0, FREE_PROTECTED_APPS_LIMIT)),
      );
      setValidationMessage(
        `Free plan: protect up to ${FREE_PROTECTED_APPS_LIMIT} app.`,
      );
      return;
    }

    if (step === "age" && !selectedAge) {
      setValidationMessage(
        "Choose your age range so we can tailor the experience.",
      );
      return;
    }

    if (step === "permissions" && !permissionEnabled) {
      setValidationMessage(
        Platform.OS === "ios"
          ? "Please allow Screen Time access so GentleWait can create gentle pauses before your chosen apps."
          : "Please enable Accessibility access so GentleWait can notice when a selected app opens and start the pause flow.",
      );
      return;
    }

    // Final iOS limit enforcement before save (safety net)
    if (
      step === "select-apps" &&
      isIOSFamilyControlsFlow &&
      !hasProtectedAppsPremium
    ) {
      const hasCategories =
        (iosFamilyActivitySelection?.categoryCount ?? 0) > 0;
      const hasWebDomains =
        (iosFamilyActivitySelection?.webDomainCount ?? 0) > 0;
      const appCount = iosFamilyActivitySelection?.applicationCount ?? 0;
      if (
        hasCategories ||
        hasWebDomains ||
        appCount > FREE_PROTECTED_APPS_LIMIT
      ) {
        setUpgradePromptMessage(
          hasCategories || hasWebDomains
            ? `Free plan: pick individual apps only (up to ${FREE_PROTECTED_APPS_LIMIT}). Categories and websites are a Pro feature.\n\n${getUpgradePitch()}`
            : `You can protect up to ${FREE_PROTECTED_APPS_LIMIT} app on the free plan.\n\n${getUpgradePitch()}`,
        );
        return;
      }
    }

    // If coming from settings and on select-apps step, save and go back
    const isAddingApps = skipToStep === "select-apps";
    if (isAddingApps && step === "select-apps") {
      setIsLoading(true);
      const selectedApps = availableApps.filter((app) =>
        selectedAppSet.has(app.packageName),
      );
      let nextIOSSelection = iosFamilyActivitySelection;

      try {
        if (isIOSFamilyControlsFlow && iosFamilyActivitySelection) {
          nextIOSSelection = await saveIOSFamilyControlsSelection(
            iosFamilyActivitySelection,
          );
        }
      } catch (error) {
        console.error("[Settings] Failed to save iOS app selection:", error);
      }

      updateSettings({
        selectedApps: isIOSFamilyControlsFlow
          ? currentSettings.selectedApps
          : selectedApps,
        iosFamilyActivitySelection: isIOSFamilyControlsFlow
          ? nextIOSSelection
          : currentSettings.iosFamilyActivitySelection,
        // Preserve other settings
        pauseDurationSec: currentSettings.pauseDurationSec || pauseDuration,
        userName: currentSettings.userName || userName,
        goals: currentSettings.goals || Array.from(selectedGoals),
        emotions: currentSettings.emotions || Array.from(selectedEmotions),
        dailyScreenTimeHours:
          currentSettings.dailyScreenTimeHours || dailyScreenTime,
        targetScreenTimeHours:
          currentSettings.targetScreenTimeHours || targetScreenTime,
        ageRange: currentSettings.ageRange || selectedAge || undefined,
        onboardingCompleted: currentSettings.onboardingCompleted ?? true,
      });

      try {
        if (
          isIOSFamilyControlsFlow &&
          nextIOSSelection &&
          hasIOSProtectedApps(nextIOSSelection)
        ) {
          await configureIOSProtection(
            nextIOSSelection,
            currentSettings.cooldownMinutes || cooldownMinutes,
          );
        } else if (!isIOSFamilyControlsFlow) {
          await syncSelectedAppsToNative(selectedApps);
        }
      } catch (error) {
        console.error("[Settings] Failed to sync apps to native:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.back();
      return;
    }

    if (currentIndex === stepOrder.length - 1) {
      // Onboarding complete - save settings
      setIsLoading(true);

      if (isCompleteProfileMode) {
        // Complete profile mode - only update personalization data, preserve existing apps
        updateSettings({
          goals: Array.from(selectedGoals),
          emotions: Array.from(selectedEmotions),
          dailyScreenTimeHours: dailyScreenTime,
          targetScreenTimeHours: targetScreenTime,
          ageRange: selectedAge || undefined,
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        router.back();
        return;
      }

      // Regular onboarding - save everything including apps
      const selectedApps = availableApps.filter((app) =>
        selectedAppSet.has(app.packageName),
      );
      let nextIOSSelection = iosFamilyActivitySelection;

      try {
        if (isIOSFamilyControlsFlow && iosFamilyActivitySelection) {
          nextIOSSelection = await saveIOSFamilyControlsSelection(
            iosFamilyActivitySelection,
          );
        }
      } catch (error) {
        console.error("[Onboarding] Failed to save iOS app selection:", error);
      }

      updateSettings({
        selectedApps: isIOSFamilyControlsFlow ? [] : selectedApps,
        pauseDurationSec: pauseDuration,
        cooldownMinutes,
        userName,
        goals: Array.from(selectedGoals),
        emotions: Array.from(selectedEmotions),
        dailyScreenTimeHours: dailyScreenTime,
        targetScreenTimeHours: targetScreenTime,
        ageRange: selectedAge || undefined,
        iosFamilyActivitySelection: isIOSFamilyControlsFlow
          ? nextIOSSelection
          : null,
        onboardingCompleted: true,
      });

      try {
        if (
          isIOSFamilyControlsFlow &&
          nextIOSSelection &&
          hasIOSProtectedApps(nextIOSSelection)
        ) {
          await configureIOSProtection(nextIOSSelection, cooldownMinutes);
        } else if (!isIOSFamilyControlsFlow) {
          await syncSelectedAppsToNative(selectedApps);
        }
      } catch (error) {
        console.error("[Onboarding] Failed to sync apps to native:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/home");
    } else {
      const nextStep = stepOrder[currentIndex + 1];

      if (Platform.OS === "android" && step === "select-apps") {
        const accessibilityEnabled = await isServiceEnabled();
        setPermissionEnabled(accessibilityEnabled);
        setStep(
          accessibilityEnabled && nextStep === "permissions"
            ? "duration"
            : nextStep,
        );
        return;
      }

      setStep(nextStep);
    }
  };

  const handleBack = () => {
    // If coming from settings, go back to settings
    if (skipToStep === "select-apps" || isCompleteProfileMode) {
      router.back();
      return;
    }

    const stepOrder = getStepOrder(setupPath, isCompleteProfileMode);
    const currentIndex = stepOrder.indexOf(step);

    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  // Animated glow for hero
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowProgress.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(glowProgress.value, [0, 1], [1, 1.1]) }],
  }));

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslateY.value }],
  }));

  const lumiStoryPlayer = useVideoPlayer(lumiStoryVideo, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const lumiPreviewPlayer = useVideoPlayer(lumiPreviewVideo, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: spacing.xxl * 4,
    },
    heroContentContainer: {
      justifyContent: "flex-start" as const,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    previewContentContainer: {
      justifyContent: "flex-start",
      alignItems: "stretch",
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    // Hero — top row (logo + brand name)
    heroTopRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing.sm,
      marginBottom: screenHeight < 750 ? spacing.sm : spacing.md,
    },
    heroTopBrand: {
      fontFamily: fonts.semiBold,
      fontSize: typography.heading.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    // Hero — headline
    heroHeadline: {
      fontFamily: fonts.light,
      fontSize: screenHeight < 750 ? 22 : 26,
      color: colors.text,
      textAlign: "center" as const,
      lineHeight: screenHeight < 750 ? 30 : 34,
      marginBottom: screenHeight < 750 ? spacing.md : spacing.lg,
      letterSpacing: 0.2,
    },
    heroHeadlineAccent: {
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Hero — video
    heroVideoContainer: {
      alignItems: "center" as const,
      marginBottom: screenHeight < 750 ? spacing.md : spacing.lg,
    },
    heroVideoFrame: {
      width: width * 0.65,
      height: screenHeight * 0.35,
      borderRadius: radius.glass + 4,
      overflow: "hidden" as const,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.15)",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
    heroVideo: {
      width: "100%" as const,
      height: "100%" as const,
    },
    // Hero — value prop chips
    heroValueProps: {
      flexDirection: "column" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      marginBottom: screenHeight < 750 ? spacing.sm : spacing.md,
    },
    heroValuePropRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      width: "100%" as const,
    },
    heroValueChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 100,
      backgroundColor: "rgba(0, 212, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(0, 212, 255, 0.15)",
    },
    heroValueChipText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
    },
    // Hero — tagline
    heroTagline: {
      fontFamily: fonts.regular,
      fontSize:
        screenHeight < 750
          ? typography.body.fontSize
          : typography.bodyLarge.fontSize,
      color: colors.textSecondary,
      textAlign: "center" as const,
      lineHeight:
        screenHeight < 750
          ? typography.body.lineHeight
          : typography.bodyLarge.lineHeight,
    },
    // Hero styles (used by program-preview glow)
    heroContainer: {
      alignItems: "center",
      marginBottom: spacing.xxl,
    },
    heroGlowContainer: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    heroGlow: {
      position: "absolute",
      width: width * 0.7,
      height: width * 0.7,
      borderRadius: width * 0.35,
    },
    appNameLarge: {
      fontFamily: fonts.semiBold,
      fontSize: typography.hero.fontSize,
      color: colors.text,
      letterSpacing: typography.hero.letterSpacing,
      marginTop: spacing.xl,
    },
    appNameAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    // Typography
    title: {
      fontFamily: typography.screenTitle.fontFamily,
      fontSize: typography.screenTitle.fontSize,
      color: colors.text,
      marginBottom: spacing.xs,
      textAlign: "center",
      letterSpacing: typography.screenTitle.letterSpacing,
      lineHeight: typography.screenTitle.lineHeight,
    },
    subtitle: {
      fontFamily: typography.title.fontFamily,
      fontSize: typography.title.fontSize,
      color: colors.text,
      marginBottom: spacing.xl,
      textAlign: "center",
      lineHeight: typography.title.lineHeight,
      letterSpacing: typography.title.letterSpacing,
    },
    titleAccent: {
      color: colors.primary,
    },
    subtitleAccent: {
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    description: {
      fontFamily: fonts.regular,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: "center",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    descriptionAccent: {
      fontFamily: fonts.medium,
      color: colors.text,
    },
    descriptionSecondary: {
      fontFamily: fonts.medium,
      color: colors.secondary,
    },
    cooldownSection: {
      marginTop: spacing.lg,
      alignItems: "center",
      gap: spacing.md,
    },
    cooldownIntro: {
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    cooldownEyebrow: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    cooldownHeadline: {
      fontFamily: fonts.medium,
      fontSize: typography.heading.fontSize,
      lineHeight: typography.heading.lineHeight,
      color: colors.text,
      textAlign: "center",
      maxWidth: 300,
    },
    cooldownHint: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: typography.caption.lineHeight,
      maxWidth: 290,
    },
    descriptionSmall: {
      fontFamily: fonts.light,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    buttonContainer: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    // Glass input
    searchInput: {
      fontFamily: fonts.regular,
      backgroundColor: colors.glassFill,
      borderRadius: radius.button,
      padding: spacing.md + 4,
      marginBottom: spacing.md,
      color: colors.text,
      fontSize: typography.body.fontSize,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    categoryScroll: {
      marginBottom: spacing.md,
      marginHorizontal: -spacing.lg,
    },
    categoryScrollContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    categoryTab: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.glassFill,
      borderRadius: radius.pills,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      gap: spacing.xs,
    },
    categoryTabSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    categoryTabIcon: {
      fontSize: 16,
    },
    categoryTabLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    categoryTabLabelSelected: {
      color: colors.primary,
    },
    selectAllButton: {
      alignSelf: "flex-start",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    selectAllText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
    },
    iosPickerCard: {
      overflow: "hidden",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.card,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    iosGuidanceCard: {
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
    },
    iosPickerContent: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    iosSelectionSummaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.xs,
    },
    iosPickerEyebrow: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    iosPickerTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.sectionTitle.fontSize,
      color: colors.text,
    },
    iosPickerDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    iosSelectionView: {
      minHeight: 340,
      width: "100%",
    },
    appList: {
      marginBottom: spacing.lg,
    },
    emotionalAppList: {
      paddingBottom: spacing.md,
    },
    permissionContainer: {
      backgroundColor: colors.glassFill,
      borderRadius: radius.button,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    permissionText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    permissionCard: {
      backgroundColor: colors.glassFill,
      borderRadius: radius.card,
      padding: spacing.lg,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    permissionIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    permissionStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textTertiary,
    },
    permissionStatusDotActive: {
      backgroundColor: colors.secondary,
    },
    permissionStatusLabel: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.textPrimary,
    },
    permissionStatusValue: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    permissionFootnote: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textTertiary,
      lineHeight: 18,
      marginTop: spacing.lg,
      textAlign: "center",
    },
    durationContainer: {
      gap: spacing.md,
    },
    durationOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md + 4,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.glassFill,
      borderRadius: radius.button,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    durationOptionSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    durationLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    durationValue: {
      fontFamily: fonts.semiBold,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.primary,
    },
    selectedCount: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      marginTop: spacing.md,
      textAlign: "center",
    },
    emotionalSelectedCount: {
      marginTop: spacing.xl,
    },
    setupChoiceContainer: {
      gap: spacing.md,
    },
    setupOption: {
      borderRadius: radius.glass,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.glassFill,
      overflow: "hidden",
    },
    setupOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    setupOptionTitle: {
      fontFamily: fonts.medium,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    setupOptionTitleSelected: {
      color: colors.primary,
    },
    setupOptionSubtitle: {
      fontSize: typography.secondary.fontSize,
      fontWeight: "400",
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    setupOptionSubtitleSelected: {
      color: colors.text,
    },
    setupOptionTime: {
      fontSize: typography.secondary.fontSize,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    setupOptionTimeSelected: {
      color: colors.primary,
    },
    programDaysContainer: {
      alignItems: "center",
      marginVertical: spacing.lg,
    },
    // Time picker styles
    timePickerContainer: {
      alignItems: "center",
      marginVertical: spacing.xl,
    },
    timeValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: "#7EE6C6",
      letterSpacing: typography.display.letterSpacing,
    },
    timeLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
    },
    timeButtonsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    timeButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.button,
      borderWidth: 1,
      minWidth: 60,
      alignItems: "center",
      shadowOpacity: 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
    },
    timeButtonSelected: {
      shadowOpacity: 0.3,
      shadowRadius: 18,
    },
    timeButtonText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    timeButtonTextSelected: {
      color: colors.text,
    },
    savingsCard: {
      marginTop: spacing.xl,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.glass,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    savingsText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    savingsHighlight: {
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    // Summary styles
    summaryIntro: {
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.34)",
    },
    summaryBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: "#7EE6C6",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    summaryTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: typography.title.lineHeight,
    },
    summaryHighlight: {
      fontFamily: fonts.semiBold,
      color: "#7EE6C6",
    },
    summaryHeroCard: {
      overflow: "hidden",
      gap: spacing.md,
      marginBottom: spacing.lg,
      alignItems: "center",
    },
    summaryHeroGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    summaryHeroTop: {
      alignItems: "center",
      gap: spacing.sm,
    },
    summaryValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.text,
      letterSpacing: typography.display.letterSpacing,
      textAlign: "center",
    },
    summaryValueLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.bodyLarge.fontSize,
      color: "#7EE6C6",
      textAlign: "center",
    },
    summaryHeroText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 280,
    },
    summaryGoalsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
    },
    summaryGoalPill: {
      borderRadius: radius.pills,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
    },
    summaryGoalText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.text,
    },
    summaryClosingText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
      alignSelf: "center",
      maxWidth: 300,
    },
    // Age selection styles
    ageContainer: {
      gap: spacing.sm,
      marginVertical: spacing.lg,
    },
    ageOption: {
      paddingVertical: spacing.md + 4,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.glassFill,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignItems: "center",
    },
    ageOptionSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    ageOptionText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    ageOptionTextSelected: {
      color: colors.primary,
    },
    // Current State styles
    currentStateIntro: {
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    currentStateBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.32)",
    },
    currentStateBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: "#7EE6C6",
      letterSpacing: 0.8,
    },
    currentStateHeroCard: {
      overflow: "hidden",
      marginBottom: spacing.lg,
      gap: spacing.lg,
    },
    currentStateHeroGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.8,
    },
    currentStateHeader: {
      gap: spacing.md,
    },
    currentStateTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      lineHeight: typography.title.lineHeight,
      color: colors.text,
      textAlign: "center",
    },
    currentStateSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
    },
    currentStateEmotionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
    },
    currentStateEmotionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(255, 122, 182, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 122, 182, 0.3)",
    },
    currentStateEmotionText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.text,
    },
    currentStateStatsGrid: {
      gap: spacing.xs,
    },
    currentStateStatCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.button,
      borderWidth: 1,
      marginTop: spacing.sm,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    currentStateStatIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    currentStateStatMeta: {
      flex: 1,
      gap: 2,
    },
    currentStateStatLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.small.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    currentStateStatValue: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      color: colors.text,
    },
    currentStateSupportCard: {
      gap: spacing.lg,
    },
    currentStateSupportHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    currentStateSupportTitleWrap: {
      flex: 1,
      gap: spacing.xs,
    },
    currentStateSupportEyebrow: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    currentStateSupportTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.heading.fontSize,
      lineHeight: typography.heading.lineHeight,
      color: colors.text,
    },
    currentStateLogoChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.38)",
    },
    currentStateLogoText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
    },
    currentStateSupportList: {
      gap: spacing.md,
    },
    currentStateSupportRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start",
    },
    currentStateSupportText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    researchCard: {
      marginTop: spacing.xl,
    },
    researchHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    researchIcon: {
      fontSize: 20,
    },
    researchTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    researchText: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    researchSource: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    // Analysis styles
    analysisIntro: {
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    analysisBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(255, 122, 182, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 122, 182, 0.34)",
    },
    analysisBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: "#FF7AB6",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    analysisTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      lineHeight: typography.title.lineHeight,
      color: colors.text,
      textAlign: "center",
    },
    analysisHighlight: {
      fontFamily: fonts.semiBold,
      color: "#FF7AB6",
    },
    analysisSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: typography.body.lineHeight,
      maxWidth: 320,
    },
    analysisHeroCard: {
      overflow: "hidden",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    analysisHeroGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    analysisOverline: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    analysisValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.text,
      letterSpacing: typography.display.letterSpacing,
      textAlign: "center",
    },
    analysisValueLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.bodyLarge.fontSize,
      color: "#FF7AB6",
      textAlign: "center",
    },
    analysisDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: typography.body.lineHeight,
      maxWidth: 290,
    },
    analysisStatsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    analysisStatCard: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.button,
      borderWidth: 1,
      alignItems: "center",
      gap: spacing.xs,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    analysisStatValue: {
      fontFamily: fonts.semiBold,
      fontSize: typography.heading.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    analysisStatLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
    },
    analysisInsightCard: {
      gap: spacing.lg,
    },
    analysisInsightHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    analysisInsightTitleWrap: {
      flex: 1,
      gap: spacing.xs,
    },
    analysisInsightEyebrow: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    analysisInsightTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.heading.fontSize,
      lineHeight: typography.heading.lineHeight,
      color: colors.text,
    },
    analysisInsightChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.38)",
    },
    analysisInsightChipText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
      color: "#7EE6C6",
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    analysisInsightList: {
      gap: spacing.md,
    },
    analysisInsightRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    analysisInsightText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    analysisDisclaimer: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    // Projection styles
    projectionIntro: {
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    projectionBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.34)",
    },
    projectionBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: "#7EE6C6",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    projectionTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: typography.title.lineHeight,
    },
    projectionHighlight: {
      fontFamily: fonts.semiBold,
      color: "#7EE6C6",
    },
    projectionHeroCard: {
      overflow: "hidden",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    projectionHeroGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    projectionOverline: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    projectionValue: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.text,
      letterSpacing: typography.display.letterSpacing,
      textAlign: "center",
    },
    projectionValueLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.bodyLarge.fontSize,
      color: "#7EE6C6",
      textAlign: "center",
    },
    projectionDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: typography.body.lineHeight,
      maxWidth: 280,
    },
    projectionStatsRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    projectionStatCard: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.button,
      borderWidth: 1,
      alignItems: "center",
      gap: spacing.xs,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    projectionStatValue: {
      fontFamily: fonts.semiBold,
      fontSize: typography.heading.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    projectionStatLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: typography.caption.lineHeight,
    },
    projectionDisclaimer: {
      fontFamily: fonts.regular,
      fontSize: typography.small.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
    previewIntro: {
      alignItems: "center",
      gap: spacing.xs,
      alignSelf: "center",
      maxWidth: isLaptopPreviewLayout ? 760 : 520,
    },
    previewBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radius.pills,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    previewBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    previewIntroText: {
      fontFamily: fonts.regular,
      fontSize: isLaptopPreviewLayout
        ? typography.bodyLarge.fontSize
        : typography.caption.fontSize,
      lineHeight: isLaptopPreviewLayout
        ? typography.bodyLarge.lineHeight
        : typography.caption.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: isLaptopPreviewLayout ? 560 : 340,
    },
    previewShowcaseCard: {
      flex: 1,
      justifyContent: "flex-start",
      gap: isLaptopPreviewLayout ? spacing.xxl : spacing.lg,
      width: "100%",
      maxWidth: isLaptopPreviewLayout ? 900 : isTablet ? 680 : undefined,
      alignSelf: "center",
      paddingTop: isLaptopPreviewLayout ? spacing.xl : spacing.sm,
      paddingHorizontal: isLaptopPreviewLayout ? spacing.xxl : 0,
    },
    previewShowcaseBody: {
      gap: isLaptopPreviewLayout ? spacing.xl : spacing.lg,
      justifyContent: "center",
      flex: 1,
    },
    previewInfoColumn: {
      alignSelf: "center",
      width: "100%",
      maxWidth: isLaptopPreviewLayout ? 760 : 430,
      gap: isLaptopPreviewLayout ? spacing.xl : spacing.md,
      minWidth: 0,
    },
    previewFloatingChip: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.24)",
    },
    previewFloatingChipText: {
      fontFamily: fonts.medium,
      fontSize: typography.small.fontSize,
      color: colors.primary,
    },
    previewOverlayTextBlock: {
      gap: spacing.xs,
      maxWidth: isLaptopPreviewLayout ? 620 : 350,
      alignSelf: "center",
    },
    previewOverlayTitle: {
      fontFamily: fonts.semiBold,
      fontSize: isLaptopPreviewLayout
        ? 34
        : screenHeight < 750
          ? typography.heading.fontSize
          : typography.title.fontSize,
      lineHeight: isLaptopPreviewLayout
        ? 40
        : screenHeight < 750
          ? typography.heading.lineHeight
          : typography.title.lineHeight,
      color: colors.text,
      textAlign: "center",
    },
    previewOverlayDescription: {
      fontFamily: fonts.regular,
      fontSize: isLaptopPreviewLayout
        ? typography.body.fontSize
        : typography.caption.fontSize,
      lineHeight: isLaptopPreviewLayout
        ? typography.body.lineHeight
        : typography.caption.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
    },
    previewVideoPanel: {
      position: "relative",
      alignSelf: "center",
      width: "100%",
      maxWidth: isLaptopPreviewLayout ? 420 : isTablet ? 360 : 270,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: "rgba(9, 17, 22, 0.72)",
      shadowColor: colors.primary,
      shadowOpacity: 0.28,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
    },
    previewVideoFrame: {
      width: "100%",
      aspectRatio: isLaptopPreviewLayout ? 1.72 : 1.55,
      overflow: "hidden",
    },
    previewVideo: {
      width: "100%",
      height: "100%",
    },
    previewVideoFade: {
      ...StyleSheet.absoluteFillObject,
    },
    previewVideoBadge: {
      position: "absolute",
      left: spacing.sm,
      bottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: "rgba(8, 17, 22, 0.78)",
      borderWidth: 1,
      borderColor: "rgba(126, 230, 198, 0.32)",
    },
    previewVideoBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.text,
    },
    previewNarrativeBlock: {
      alignItems: isLaptopPreviewLayout ? "flex-start" : "center",
      gap: 2,
      paddingHorizontal: spacing.xs,
    },
    previewNarrativeEyebrow: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginTop: 0,
    },
    previewHeroTitle: {
      fontFamily: fonts.semiBold,
      fontSize: isLaptopPreviewLayout
        ? 30
        : isCompactPreviewViewport
          ? typography.heading.fontSize
          : typography.title.fontSize,
      lineHeight: isLaptopPreviewLayout
        ? 36
        : isCompactPreviewViewport
          ? typography.heading.lineHeight
          : typography.title.lineHeight,
      letterSpacing: 0,
      color: colors.text,
      textAlign: isLaptopPreviewLayout ? "left" : "center",
      maxWidth: isLaptopPreviewLayout ? 460 : 340,
    },
    previewHeroDescription: {
      fontFamily: fonts.regular,
      fontSize: isCompactPreviewViewport
        ? typography.caption.fontSize
        : typography.caption.fontSize,
      lineHeight: typography.caption.lineHeight,
      color: colors.textSecondary,
      textAlign: isLaptopPreviewLayout ? "left" : "center",
      maxWidth: isLaptopPreviewLayout ? 480 : 330,
    },
    programDays: {
      flexDirection: isTablet ? "row" : "column",
      flexWrap: isTablet ? "wrap" : "nowrap",
      alignItems: "stretch",
      justifyContent: "center",
      gap: isTablet ? spacing.md : spacing.xs,
    },
    programDay: {
      flex: 1,
      flexBasis: isTablet ? "47%" : undefined,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: isLaptopPreviewLayout ? spacing.md : spacing.sm,
      paddingHorizontal: isLaptopPreviewLayout ? spacing.md : spacing.sm,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
      shadowColor: colors.primary,
      shadowOpacity: 0.24,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
    },
    programDayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: spacing.xs,
      flexShrink: 0,
    },
    programDayIndex: {
      width: isLaptopPreviewLayout ? 52 : 42,
      height: isLaptopPreviewLayout ? 52 : 42,
      borderRadius: isLaptopPreviewLayout ? 18 : 15,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      borderWidth: 1,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    programDayIndexText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
      letterSpacing: 0,
    },
    programDayContent: {
      gap: 2,
      flex: 1,
    },
    programDayLabel: {
      fontFamily: fonts.semiBold,
      fontSize: isCompactPreviewViewport
        ? typography.caption.fontSize
        : typography.body.fontSize,
      lineHeight: isCompactPreviewViewport
        ? typography.caption.lineHeight
        : typography.body.lineHeight,
      color: colors.text,
    },
    programDayDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.small.fontSize,
      lineHeight: 16,
      color: colors.text,
      opacity: 0.86,
    },
    programConnector: {
      display: "none",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.55,
      paddingVertical: 0,
      paddingHorizontal: spacing.sm,
    },
    textInput: {
      marginVertical: spacing.lg,
      fontSize: 18,
      paddingVertical: spacing.lg,
    },
    // Remove old styles, use new hero
    logoInline: {
      width: 52,
      height: 52,
      borderRadius: 12,
    },
    validationToastWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      alignItems: "center",
      zIndex: 20,
      elevation: 6,
      pointerEvents: "none",
    },
    validationBanner: {
      width: "100%",
      maxWidth: 520,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.glass,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.bg,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      shadowColor: colors.glassShadowSoft,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    validationBannerText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.text,
    },
    upgradePromptWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 21,
      elevation: 7,
      paddingHorizontal: spacing.lg,
      backgroundColor: "rgba(5, 10, 20, 0.42)",
    },
    upgradePromptCard: {
      width: "100%",
      maxWidth: 520,
      borderRadius: radius.glass,
      overflow: "hidden",
      backgroundColor: "#122033",
      borderWidth: 1,
      borderColor: "rgba(143, 214, 255, 0.24)",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.24,
      shadowRadius: 36,
      elevation: 10,
    },
    upgradePromptGradient: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    upgradePromptGlow: {
      position: "absolute",
      top: -28,
      left: 24,
      right: 24,
      height: 88,
      borderRadius: 999,
      opacity: 0.9,
    },
    upgradePromptBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pills,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.12)",
    },
    upgradePromptHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    upgradePromptTitle: {
      flex: 1,
      fontFamily: fonts.light,
      fontSize: typography.sectionTitle.fontSize,
      lineHeight: typography.sectionTitle.lineHeight,
      color: colors.text,
    },
    upgradePromptText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    upgradePromptActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    upgradePromptButton: {
      flex: 1,
      borderRadius: radius.button,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    upgradePromptButtonGhost: {
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderColor: "rgba(255, 255, 255, 0.12)",
    },
    upgradePromptButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: "rgba(255, 255, 255, 0.12)",
    },
    upgradePromptButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
    },
    upgradePromptButtonTextGhost: {
      color: colors.text,
    },
    upgradePromptButtonTextPrimary: {
      color: colors.bg,
    },
  });

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          step === "welcome-hero" && styles.heroContentContainer,
          step === "program-preview" && styles.previewContentContainer,
        ]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ReanimatedAnimated.View key={stepKey} style={stepAnimation}>
          {step === "welcome-hero" && (
            <>
              {/* Top: Logo + Brand */}
              <View style={styles.heroTopRow}>
                <Image
                  source={mainLogo}
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
                <Text style={styles.heroTopBrand}>
                  Gentle<Text style={styles.appNameAccent}>Wait</Text>
                </Text>
              </View>

              {/* Headline */}
              <Text style={styles.heroHeadline}>
                Your phone interrupts.{"\n"}
                <Text style={styles.heroHeadlineAccent}>
                  We help you pause.
                </Text>
              </Text>

              {/* Center: Lumi story video */}
              <View style={styles.heroVideoContainer}>
                <View style={styles.heroVideoFrame}>
                  <VideoView
                    player={lumiStoryPlayer}
                    style={styles.heroVideo}
                    contentFit="cover"
                    nativeControls={false}
                    allowsPictureInPicture={false}
                  />
                </View>
              </View>

              {/* Value props */}
              <View style={styles.heroValueProps}>
                {[HERO_VALUE_PROPS.slice(0, 3), HERO_VALUE_PROPS.slice(3)].map(
                  (row, rowIndex) => (
                    <View
                      key={`hero-value-row-${rowIndex}`}
                      style={styles.heroValuePropRow}
                    >
                      {row.map((item) => (
                        <View
                          key={item.text}
                          style={[
                            styles.heroValueChip,
                            {
                              backgroundColor: item.surface,
                              borderColor: item.glow,
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={16}
                            color={item.accent}
                          />
                          <Text
                            style={[
                              styles.heroValueChipText,
                              { color: item.accent },
                            ]}
                          >
                            {item.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ),
                )}
              </View>

              {/* Tagline */}
              <Text style={styles.heroTagline}>
                Not blocking. Not guilt.{"\n"}Just a{" "}
                <Text style={styles.descriptionAccent}>gentle moment</Text> to
                choose.
              </Text>
            </>
          )}

          {step === "program-preview" && (
            <>
              <View style={styles.previewShowcaseCard}>
                <View style={styles.previewShowcaseBody}>
                  <View style={styles.previewInfoColumn}>
                    <View style={styles.previewFloatingChip}>
                      <Ionicons
                        name="sparkles"
                        size={14}
                        color={colors.secondary}
                      />
                      <Text style={styles.previewFloatingChipText}>
                        What happens next
                      </Text>
                    </View>

                    <View style={styles.previewOverlayTextBlock}>
                      <Text style={styles.previewOverlayTitle}>
                        A pause before{" "}
                        <Text style={styles.titleAccent}>autopilot.</Text>
                      </Text>
                      <Text style={styles.previewOverlayDescription}>
                        Choose apps. Get a pause. Continue mindfully.
                      </Text>
                    </View>

                    <View style={styles.previewVideoPanel}>
                      <View style={styles.previewVideoFrame}>
                        <VideoView
                          player={lumiPreviewPlayer}
                          style={styles.previewVideo}
                          contentFit="cover"
                          nativeControls={false}
                          allowsPictureInPicture={false}
                        />
                      </View>
                      <LinearGradient
                        colors={[
                          "rgba(4, 10, 13, 0)",
                          "rgba(4, 10, 13, 0.18)",
                          "rgba(4, 10, 13, 0.72)",
                        ]}
                        locations={[0, 0.52, 1]}
                        style={styles.previewVideoFade}
                      />
                      <View style={styles.previewVideoBadge}>
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={styles.previewVideoBadgeText}>
                          Before the app opens
                        </Text>
                      </View>
                    </View>

                    <View style={styles.programDays}>
                      {PROGRAM_PREVIEW_STEPS.map((item) => (
                        <LinearGradient
                          key={item.label}
                          colors={[
                            item.surface,
                            "rgba(18, 25, 32, 0.98)",
                            "rgba(11, 18, 24, 0.96)",
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.programDay,
                            {
                              borderColor: item.glow,
                              shadowColor: item.accent,
                            },
                          ]}
                        >
                          <View style={styles.programDayHeader}>
                            <LinearGradient
                              colors={[item.glow, "rgba(255,255,255,0.035)"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={[
                                styles.programDayIndex,
                                { borderColor: item.glow },
                              ]}
                            >
                              <Ionicons
                                name={item.icon}
                                size={isLaptopPreviewLayout ? 24 : 20}
                                color={item.accent}
                              />
                            </LinearGradient>
                          </View>
                          <View style={styles.programDayContent}>
                            <Text style={styles.programDayLabel}>
                              {item.label}
                            </Text>
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              <Text
                                style={[
                                  styles.programDayIndexText,
                                  { color: item.accent },
                                ]}
                              >
                                |
                              </Text>
                              <Text style={styles.programDayDescription}>
                                {item.description}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {step === "setup-choice" && (
            <>
              <Text style={styles.title}>How shall we begin?</Text>
              <Text style={styles.description}>
                Pick the path that feels right for you
              </Text>

              <View style={styles.setupChoiceContainer}>
                <TouchableOpacity
                  style={[
                    styles.setupOption,
                    setupPath === "quick" && styles.setupOptionSelected,
                  ]}
                  onPress={() => setSetupPath("quick")}
                >
                  <Text
                    style={[
                      styles.setupOptionTitle,
                      setupPath === "quick" && styles.setupOptionTitleSelected,
                    ]}
                  >
                    Quick Setup
                  </Text>
                  <Text
                    style={[
                      styles.setupOptionSubtitle,
                      setupPath === "quick" &&
                        styles.setupOptionSubtitleSelected,
                    ]}
                  >
                    Essential settings only
                  </Text>
                  <Text
                    style={[
                      styles.setupOptionTime,
                      setupPath === "quick" && styles.setupOptionTimeSelected,
                    ]}
                  >
                    1 min
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.setupOption,
                    setupPath === "personalized" && styles.setupOptionSelected,
                  ]}
                  onPress={() => setSetupPath("personalized")}
                >
                  <Text
                    style={[
                      styles.setupOptionTitle,
                      setupPath === "personalized" &&
                        styles.setupOptionTitleSelected,
                    ]}
                  >
                    Personalized Setup
                  </Text>
                  <Text
                    style={[
                      styles.setupOptionSubtitle,
                      setupPath === "personalized" &&
                        styles.setupOptionSubtitleSelected,
                    ]}
                  >
                    Deep personalization
                  </Text>
                  <Text
                    style={[
                      styles.setupOptionTime,
                      setupPath === "personalized" &&
                        styles.setupOptionTimeSelected,
                    ]}
                  >
                    5 min
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === "name" && (
            <>
              <Text style={styles.title}>Hey, who&apos;s there?</Text>
              <Text style={styles.description}>What should we call you?</Text>

              <TextInput
                style={[styles.searchInput, styles.textInput]}
                placeholder="Your first name..."
                placeholderTextColor={colors.textMuted}
                value={userName}
                onChangeText={setUserName}
                autoFocus
              />

              <Text style={styles.descriptionSmall}>
                We&apos;ll make your journey personal
              </Text>
            </>
          )}

          {step === "goals" && (
            <>
              <Text style={styles.title}>
                What do you want to{" "}
                <Text style={styles.titleAccent}>achieve</Text>?
              </Text>
              <Text style={styles.description}>
                Pick up to <Text style={styles.descriptionAccent}>3 goals</Text>{" "}
                for your GentleWait journey
              </Text>

              <View style={styles.appList}>
                {[
                  "Reduce my screen time",
                  "Sharpen my focus",
                  "Sleep better at night",
                  "More presence with loved ones",
                  "Find calm in the chaos",
                  "Boost my energy",
                  "Build lasting habits",
                ].map((goal) => (
                  <Checkbox
                    key={goal}
                    label={goal}
                    checked={selectedGoals.has(goal)}
                    onPress={() => {
                      const newSet = new Set(selectedGoals);
                      if (newSet.has(goal)) {
                        newSet.delete(goal);
                      } else if (newSet.size < 3) {
                        newSet.add(goal);
                      }
                      setSelectedGoals(newSet);
                      if (newSet.size > 0) {
                        setValidationMessage(null);
                      }
                    }}
                  />
                ))}
              </View>

              <Text style={styles.selectedCount}>
                {selectedGoals.size} goal{selectedGoals.size !== 1 ? "s" : ""}{" "}
                selected
              </Text>
            </>
          )}

          {step === "age" && (
            <>
              <Text style={styles.title}>
                What&apos;s your <Text style={styles.titleAccent}>age</Text>?
              </Text>
              <Text style={styles.description}>
                This helps us personalize your experience
              </Text>

              <View style={styles.ageContainer}>
                {AGE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.ageOption,
                      selectedAge === range.id && styles.ageOptionSelected,
                    ]}
                    onPress={() => setSelectedAge(range.id)}
                  >
                    <Text
                      style={[
                        styles.ageOptionText,
                        selectedAge === range.id &&
                          styles.ageOptionTextSelected,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === "emotional" && (
            <>
              <Text style={styles.title}>How do you feel after?</Text>
              <Text style={styles.description}>
                Be honest with yourself. After extended scrolling, you often
                feel... (pick up to 2)
              </Text>

              <View style={[styles.appList, styles.emotionalAppList]}>
                {[
                  "Guilty about wasted time",
                  "More anxious than before",
                  "Mentally drained",
                  "Disconnected from the moment",
                  "Irritable and restless",
                  "Wishing I hadn't",
                ].map((emotion) => (
                  <Checkbox
                    key={emotion}
                    label={emotion}
                    checked={selectedEmotions.has(emotion)}
                    onPress={() => {
                      const newSet = new Set(selectedEmotions);
                      if (newSet.has(emotion)) {
                        newSet.delete(emotion);
                      } else if (newSet.size < 2) {
                        newSet.add(emotion);
                      }
                      setSelectedEmotions(newSet);
                    }}
                  />
                ))}
              </View>

              <Text
                style={[styles.selectedCount, styles.emotionalSelectedCount]}
              >
                {selectedEmotions.size} emotion
                {selectedEmotions.size !== 1 ? "s" : ""} selected
              </Text>
            </>
          )}

          {step === "current-state" && (
            <>
              <View style={styles.currentStateIntro}>
                <View style={styles.currentStateBadge}>
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color="#7EE6C6"
                  />
                  <Text style={styles.currentStateBadgeText}>
                    Your pattern so far
                  </Text>
                </View>
                <Text style={styles.currentStateTitle}>
                  Here&apos;s what your current{" "}
                  <Text style={styles.titleAccent}>digital state</Text> looks
                  like
                </Text>
                <Text style={styles.currentStateSubtitle}>
                  Based on what you told us, you&apos;re not looking for more
                  screen time. You&apos;re looking for more calm, intention, and
                  control.
                </Text>
              </View>

              <GlassCard
                glowColor="primary"
                style={styles.currentStateHeroCard}
              >
                <LinearGradient
                  colors={[
                    colors.primaryLight,
                    "rgba(126, 230, 198, 0.14)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.currentStateHeroGradient}
                />

                <View style={styles.currentStateHeader}>
                  <Text style={styles.currentStateSubtitle}>
                    Right now, your phone tends to pull you away when you feel{" "}
                    <Text style={styles.descriptionAccent}>
                      {primaryEmotion.toLowerCase()}
                    </Text>
                    {secondaryEmotion
                      ? ` and ${secondaryEmotion.toLowerCase()}`
                      : ""}
                    .
                  </Text>

                  <View style={styles.currentStateEmotionRow}>
                    {selectedEmotionList.map((emotion) => (
                      <View
                        key={emotion}
                        style={styles.currentStateEmotionPill}
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={16}
                          color="#FF7AB6"
                        />
                        <Text style={styles.currentStateEmotionText}>
                          {emotion}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.currentStateStatsGrid}>
                  {currentStateStats.map((item, index) => {
                    const accent =
                      CURRENT_STATE_STAT_ACCENTS[
                        index % CURRENT_STATE_STAT_ACCENTS.length
                      ];

                    return (
                      <View
                        key={item.label}
                        style={[
                          styles.currentStateStatCard,
                          {
                            backgroundColor: accent.surface,
                            borderColor: accent.glow,
                            shadowColor: accent.accent,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.currentStateStatIcon,
                            {
                              backgroundColor: accent.surface,
                              borderColor: accent.glow,
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={18}
                            color={accent.accent}
                          />
                        </View>
                        <View style={styles.currentStateStatMeta}>
                          <Text style={styles.currentStateStatLabel}>
                            {item.label}
                          </Text>
                          <Text style={styles.currentStateStatValue}>
                            {item.value}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>

              <GlassCard
                intensity="light"
                style={styles.currentStateSupportCard}
              >
                <View style={styles.currentStateSupportHeader}>
                  <View style={styles.currentStateSupportTitleWrap}>
                    <Text style={styles.currentStateSupportEyebrow}>
                      What GentleWait will do
                    </Text>
                    <Text style={styles.currentStateSupportTitle}>
                      A calmer path from where you are now
                    </Text>
                  </View>

                  <View style={styles.currentStateLogoChip}>
                    <Image
                      source={mainLogo}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.currentStateLogoText}>GentleWait</Text>
                  </View>
                </View>

                <View style={styles.currentStateSupportList}>
                  {gentleWaitSupports.map((item, index) => (
                    <View key={item} style={styles.currentStateSupportRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={
                          CURRENT_STATE_SUPPORT_ACCENTS[
                            index % CURRENT_STATE_SUPPORT_ACCENTS.length
                          ]
                        }
                        style={{ marginTop: 2 }}
                      />
                      <Text style={styles.currentStateSupportText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>

              <GlassCard style={styles.researchCard}>
                <View style={styles.researchHeader}>
                  <Ionicons
                    name="flask-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.researchTitle}>
                    Small pause, better choice
                  </Text>
                </View>
                <Text style={styles.researchText}>
                  GentleWait adds a short moment of reflection before the scroll
                  begins, so{" "}
                  <Text style={styles.researchSource}>{primaryGoal}</Text> can
                  feel intentional instead of reactive.
                </Text>
              </GlassCard>
            </>
          )}

          {step === "analysis" &&
            (() => {
              const baseScore = Math.min(dailyScreenTime * 8, 70);
              const emotionBonus = selectedEmotions.size * 5;
              const userScore = Math.min(baseScore + emotionBonus, 85);
              const averageScore = 33;
              const difference = userScore - averageScore;
              const scoreTone =
                userScore >= 70
                  ? "high pull"
                  : userScore >= 50
                    ? "strong pattern"
                    : "noticeable pattern";
              const analysisInsights = [
                `Your current rhythm suggests your phone is pulling harder than average, especially when you feel ${primaryEmotion.toLowerCase()}.`,
                `Right now, ${dailyScreenTime}h a day makes it harder to reach "${primaryGoal}" with consistency.`,
                `GentleWait is designed to soften that pattern before it becomes another automatic scroll.`,
              ];

              return (
                <>
                  <View style={styles.analysisIntro}>
                    <View style={styles.analysisBadge}>
                      <Ionicons
                        name="pulse-outline"
                        size={14}
                        color="#FF7AB6"
                      />
                      <Text style={styles.analysisBadgeText}>
                        Your attention pattern
                      </Text>
                    </View>
                    <Text style={styles.analysisTitle}>
                      Your current phone use shows a{" "}
                      <Text style={styles.analysisHighlight}>{scoreTone}</Text>
                    </Text>
                    <Text style={styles.analysisSubtitle}>
                      This is not about blame. It&apos;s a signal that your
                      daily rhythm could use a gentler interruption.
                    </Text>
                  </View>

                  <GlassCard
                    glowColor="primary"
                    style={styles.analysisHeroCard}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 122, 182, 0.16)",
                        "rgba(82, 192, 255, 0.1)",
                        "transparent",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.analysisHeroGradient}
                    />

                    <Text style={styles.analysisOverline}>Your score</Text>
                    <Text style={styles.analysisValue}>{userScore}%</Text>
                    <Text style={styles.analysisValueLabel}>
                      reliance on autopilot habits
                    </Text>
                    <Text style={styles.analysisDescription}>
                      Based on your screen time and how scrolling tends to leave
                      you feeling afterward.
                    </Text>
                  </GlassCard>

                  <View style={styles.analysisStatsRow}>
                    <View
                      style={[
                        styles.analysisStatCard,
                        {
                          backgroundColor: ANALYSIS_STAT_ACCENTS[0].surface,
                          borderColor: ANALYSIS_STAT_ACCENTS[0].glow,
                          shadowColor: ANALYSIS_STAT_ACCENTS[0].accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.analysisStatValue,
                          { color: ANALYSIS_STAT_ACCENTS[0].accent },
                        ]}
                      >
                        +{difference}%
                      </Text>
                      <Text style={styles.analysisStatLabel}>
                        above the average pattern
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.analysisStatCard,
                        {
                          backgroundColor: ANALYSIS_STAT_ACCENTS[1].surface,
                          borderColor: ANALYSIS_STAT_ACCENTS[1].glow,
                          shadowColor: ANALYSIS_STAT_ACCENTS[1].accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.analysisStatValue,
                          { color: ANALYSIS_STAT_ACCENTS[1].accent },
                        ]}
                      >
                        {selectedEmotions.size}/2
                      </Text>
                      <Text style={styles.analysisStatLabel}>
                        emotional signals linked to scrolling
                      </Text>
                    </View>
                  </View>

                  <GlassCard
                    intensity="light"
                    style={styles.analysisInsightCard}
                  >
                    <View style={styles.analysisInsightHeader}>
                      <View style={styles.analysisInsightTitleWrap}>
                        <Text style={styles.analysisInsightEyebrow}>
                          What this means
                        </Text>
                        <Text style={styles.analysisInsightTitle}>
                          A clearer picture before we build your reset
                        </Text>
                      </View>

                      <View style={styles.analysisInsightChip}>
                        <Text style={styles.analysisInsightChipText}>
                          GentleWait
                        </Text>
                      </View>
                    </View>

                    <View style={styles.analysisInsightList}>
                      {analysisInsights.map((item, index) => (
                        <View key={item} style={styles.analysisInsightRow}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color={
                              CURRENT_STATE_SUPPORT_ACCENTS[
                                index % CURRENT_STATE_SUPPORT_ACCENTS.length
                              ]
                            }
                            style={{ marginTop: 2 }}
                          />
                          <Text style={styles.analysisInsightText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>

                  <Text style={styles.analysisDisclaimer}>
                    Based on your responses about screen time, goals, and how
                    scrolling tends to affect your mood.
                  </Text>
                </>
              );
            })()}

          {step === "projection" &&
            (() => {
              // Calculate projections
              const daysPerYear = Math.round((dailyScreenTime * 365) / 24);
              const yearsInLifetime = Math.round(
                (dailyScreenTime * 365 * 50) / (24 * 365),
              );

              return (
                <>
                  <View style={styles.projectionIntro}>
                    <View style={styles.projectionBadge}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="#7EE6C6"
                      />
                      <Text style={styles.projectionBadgeText}>
                        Time you can reclaim
                      </Text>
                    </View>

                    <Text style={styles.projectionTitle}>
                      Less scrolling can give you back{" "}
                      <Text style={styles.projectionHighlight}>
                        real life time
                      </Text>
                    </Text>
                  </View>

                  <GlassCard
                    glowColor="primary"
                    style={styles.projectionHeroCard}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(126, 230, 198, 0.16)",
                        "rgba(244, 211, 94, 0.1)",
                        "transparent",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.projectionHeroGradient}
                    />

                    <Text style={styles.projectionOverline}>Every year</Text>
                    <Text style={styles.projectionValue}>{daysPerYear}</Text>
                    <Text style={styles.projectionValueLabel}>days back</Text>
                    <Text style={styles.projectionDescription}>
                      More room for calm, focus, sleep, and people you care
                      about.
                    </Text>
                  </GlassCard>

                  <View style={styles.projectionStatsRow}>
                    <View
                      style={[
                        styles.projectionStatCard,
                        {
                          backgroundColor: PROJECTION_STAT_ACCENTS[0].surface,
                          borderColor: PROJECTION_STAT_ACCENTS[0].glow,
                          shadowColor: PROJECTION_STAT_ACCENTS[0].accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.projectionStatValue,
                          { color: PROJECTION_STAT_ACCENTS[0].accent },
                        ]}
                      >
                        {yearsInLifetime}
                      </Text>
                      <Text style={styles.projectionStatLabel}>
                        years reclaimed over a lifetime
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.projectionStatCard,
                        {
                          backgroundColor: PROJECTION_STAT_ACCENTS[1].surface,
                          borderColor: PROJECTION_STAT_ACCENTS[1].glow,
                          shadowColor: PROJECTION_STAT_ACCENTS[1].accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.projectionStatValue,
                          { color: PROJECTION_STAT_ACCENTS[1].accent },
                        ]}
                      >
                        {dailyScreenTime - targetScreenTime}h
                      </Text>
                      <Text style={styles.projectionStatLabel}>
                        saved each day if you reach your goal
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.projectionDisclaimer}>
                    Based on your current screen time and target.
                  </Text>
                </>
              );
            })()}

          {step === "time-current" && (
            (() => {
              const currentTimeIndex = [2, 3, 4, 5, 6, 7, 8, 9, 10].indexOf(
                dailyScreenTime
              );
              const currentTimeAccent =
                CURRENT_TIME_OPTION_ACCENTS[
                  currentTimeIndex >= 0 ? currentTimeIndex : 0
                ];

              return (
            <>
              <Text style={styles.title}>
                How much time do you{" "}
                <Text style={styles.titleAccent}>currently</Text> spend?
              </Text>
              <Text style={styles.description}>
                Be honest—most people underestimate. Your phone&apos;s screen
                time data can help.
              </Text>

              <View style={styles.timePickerContainer}>
                <Text
                  style={[
                    styles.timeValue,
                    { color: currentTimeAccent.accent },
                  ]}
                >
                  {dailyScreenTime}h
                </Text>
                <Text style={styles.timeLabel}>per day</Text>

                <View style={styles.timeButtonsRow}>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((hour, index) => {
                    const accent = CURRENT_TIME_OPTION_ACCENTS[index];
                    const isSelected = dailyScreenTime === hour;

                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeButton,
                          {
                            backgroundColor: isSelected
                              ? accent.surface
                              : colors.glassFill,
                            borderColor: isSelected
                              ? accent.glow
                              : colors.glassStroke,
                            shadowColor: accent.accent,
                          },
                          isSelected && styles.timeButtonSelected,
                        ]}
                        onPress={() => setDailyScreenTime(hour)}
                      >
                        <Text
                          style={[
                            styles.timeButtonText,
                            isSelected && styles.timeButtonTextSelected,
                            isSelected && { color: accent.accent },
                          ]}
                        >
                          {hour}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
              );
            })()
          )}

          {step === "time-goal" && (
            (() => {
              const goalTimeIndex = [1, 2, 3, 4, 5, 6].indexOf(
                targetScreenTime
              );
              const goalTimeAccent =
                TIME_OPTION_ACCENTS[
                  (goalTimeIndex >= 0 ? goalTimeIndex : 0) %
                    TIME_OPTION_ACCENTS.length
                ];

              return (
            <>
              <Text style={styles.title}>
                How much time do you{" "}
                <Text style={styles.titleAccent}>want</Text> to spend?
              </Text>
              <Text style={styles.description}>
                Set a realistic goal. We&apos;ll help you get there, one mindful
                pause at a time.
              </Text>

              <View style={styles.timePickerContainer}>
                <Text
                  style={[
                    styles.timeValue,
                    { color: goalTimeAccent.accent },
                  ]}
                >
                  {targetScreenTime}h
                </Text>
                <Text style={styles.timeLabel}>target per day</Text>

                <View style={styles.timeButtonsRow}>
                  {[1, 2, 3, 4, 5, 6].map((hour, index) => {
                    const accent =
                      TIME_OPTION_ACCENTS[index % TIME_OPTION_ACCENTS.length];
                    const isSelected = targetScreenTime === hour;

                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeButton,
                          {
                            backgroundColor: isSelected
                              ? accent.surface
                              : colors.glassFill,
                            borderColor: isSelected
                              ? accent.glow
                              : colors.glassStroke,
                            shadowColor: accent.accent,
                          },
                          isSelected && styles.timeButtonSelected,
                        ]}
                        onPress={() => setTargetScreenTime(hour)}
                      >
                        <Text
                          style={[
                            styles.timeButtonText,
                            isSelected && styles.timeButtonTextSelected,
                            isSelected && { color: accent.accent },
                          ]}
                        >
                          {hour}h
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {dailyScreenTime > targetScreenTime && (
                  <View
                    style={[
                      styles.savingsCard,
                      {
                        backgroundColor: goalTimeAccent.surface,
                        borderColor: goalTimeAccent.glow,
                        shadowColor: goalTimeAccent.accent,
                      },
                    ]}
                  >
                    <Text style={styles.savingsText}>
                      That&apos;s{" "}
                      <Text
                        style={[
                          styles.savingsHighlight,
                          { color: goalTimeAccent.accent },
                        ]}
                      >
                        {dailyScreenTime - targetScreenTime} hours
                      </Text>{" "}
                      of your life back every day!
                    </Text>
                  </View>
                )}
              </View>
            </>
              );
            })()
          )}

          {step === "summary" && (
            <>
              <View style={styles.summaryIntro}>
                <View style={styles.summaryBadge}>
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color="#7EE6C6"
                  />
                  <Text style={styles.summaryBadgeText}>Your reset plan</Text>
                </View>
                <Text style={styles.summaryTitle}>
                  A calmer routine is{" "}
                  <Text style={styles.summaryHighlight}>taking shape</Text>
                </Text>
              </View>

              <GlassCard glowColor="primary" style={styles.summaryHeroCard}>
                <LinearGradient
                  colors={[
                    "rgba(126, 230, 198, 0.16)",
                    "rgba(82, 192, 255, 0.1)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryHeroGradient}
                />

                <View style={styles.summaryHeroTop}>
                  <Text style={styles.projectionOverline}>
                    You&apos;re not alone
                  </Text>
                  <Text style={styles.summaryValue}>300,000+</Text>
                  <Text style={styles.summaryValueLabel}>
                    people started with the same intention
                  </Text>
                </View>

                <View style={styles.summaryGoalsRow}>
                  {selectedGoalList.slice(0, 3).map((goal, index) => {
                    const accent =
                      SUMMARY_GOAL_ACCENTS[
                        index % SUMMARY_GOAL_ACCENTS.length
                      ];

                    return (
                      <View
                        key={goal}
                        style={[
                          styles.summaryGoalPill,
                          {
                            backgroundColor: accent.surface,
                            borderColor: accent.glow,
                          },
                        ]}
                      >
                        <Text style={styles.summaryGoalText}>{goal}</Text>
                      </View>
                    );
                  })}
                  {selectedGoalList.length === 0 && (
                    <View
                      style={[
                        styles.summaryGoalPill,
                        {
                          backgroundColor: SUMMARY_GOAL_ACCENTS[0].surface,
                          borderColor: SUMMARY_GOAL_ACCENTS[0].glow,
                        },
                      ]}
                    >
                      <Text style={styles.summaryGoalText}>
                        Reduce screen time
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.summaryHeroText}>
                  Your plan aims to give back about {dailyHoursBack}h each day,
                  one gentle pause at a time.
                </Text>
              </GlassCard>

              <Text style={styles.summaryClosingText}>
                Next, we&apos;ll connect GentleWait to the apps you want help
                with and turn this intention into a real habit.
              </Text>
            </>
          )}

          {step === "select-apps" && (
            <>
              <Text style={styles.title}>Which apps grab your attention?</Text>
              {isIOSFamilyControlsFlow ? (
                <>
                  <Text style={styles.description}>
                    Pick only the apps that pull you into doom scrolling
                    (Instagram, TikTok, YouTube, etc.). Ignore any websites or
                    categories you see — GentleWait will filter those out
                    automatically.
                  </Text>

                  <View style={styles.iosPickerCard}>
                    {isIOSFamilyControlsAvailable() ? (
                      <DeviceActivitySelectionView
                        key={iosPickerKey}
                        style={styles.iosSelectionView}
                        familyActivitySelection={iosRawSelection}
                        headerText="Tap the apps you doom-scroll (up to 6)"
                        footerText="Only apps with icons count. Websites and categories are ignored."
                        onSelectionChange={(event: any) => {
                          const {
                            familyActivitySelection,
                            applicationCount,
                            categoryCount,
                            webDomainCount,
                          } = event.nativeEvent;
                          setIOSRawSelection(familyActivitySelection);
                          setIOSFamilyActivitySelection({
                            familyActivitySelection,
                            applicationCount,
                            categoryCount,
                            webDomainCount,
                            includeEntireCategory: false,
                            updatedAt: Date.now(),
                          });
                        }}
                      />
                    ) : (
                      <View style={styles.iosPickerContent}>
                        <Text style={styles.iosPickerDescription}>
                          App selection is not available. Make sure you allowed
                          access on the previous step.
                        </Text>
                      </View>
                    )}
                  </View>

                  {iosFamilyActivitySelection && (
                    <>
                      <View style={styles.iosSelectionSummaryRow}>
                        <Text style={styles.selectedCount}>
                          {getIOSSelectionSummary(iosFamilyActivitySelection)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setIOSFamilyActivitySelection(null);
                            setIOSRawSelection(null);
                            setIOSPickerKey((current) => current + 1);
                          }}
                        >
                          <Text style={styles.selectAllText}>Clear</Text>
                        </TouchableOpacity>
                      </View>
                      {iosFamilyActivitySelection.selectedApplicationLabels &&
                        iosFamilyActivitySelection.selectedApplicationLabels
                          .length > 0 && (
                          <Text style={styles.descriptionSmall}>
                            Kept:{" "}
                            {iosFamilyActivitySelection.selectedApplicationLabels.join(
                              ", ",
                            )}
                          </Text>
                        )}
                      {getIOSSanitizationNotice(iosFamilyActivitySelection) && (
                        <Text style={styles.descriptionSmall}>
                          {getIOSSanitizationNotice(iosFamilyActivitySelection)}
                        </Text>
                      )}
                    </>
                  )}

                  <Text style={styles.descriptionSmall}>
                    {getIOSProtectionFootnote(
                      FREE_PROTECTED_APPS_LIMIT,
                      hasProtectedAppsPremium,
                    )}
                  </Text>
                  {isSimulatorScreenshotMode && (
                    <Text style={styles.descriptionSmall}>
                      Screenshot mode: selection is optional so you can continue
                      through onboarding screens on simulator.
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.description}>
                    Select the apps you reach for most-we&apos;ll add a{" "}
                    <Text style={styles.descriptionAccent}>gentle pause</Text>{" "}
                    before they open.
                  </Text>
                  {!hasProtectedAppsPremium && (
                    <Text style={styles.selectedCount}>
                      Free plan: protect up to {FREE_PROTECTED_APPS_LIMIT} apps.
                    </Text>
                  )}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryScrollContent}
                  >
                    <TouchableOpacity
                      style={[
                        styles.categoryTab,
                        selectedCategory === "suggested" &&
                          styles.categoryTabSelected,
                      ]}
                      onPress={() => setSelectedCategory("suggested")}
                    >
                      <Ionicons
                        name="star-outline"
                        size={16}
                        color={
                          selectedCategory === "suggested"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.categoryTabLabel,
                          selectedCategory === "suggested" &&
                            styles.categoryTabLabelSelected,
                        ]}
                      >
                        Suggested
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.categoryTab,
                        selectedCategory === "all" &&
                          styles.categoryTabSelected,
                      ]}
                      onPress={() => setSelectedCategory("all")}
                    >
                      <Ionicons
                        name="list-outline"
                        size={16}
                        color={
                          selectedCategory === "all"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.categoryTabLabel,
                          selectedCategory === "all" &&
                            styles.categoryTabLabelSelected,
                        ]}
                      >
                        All Apps
                      </Text>
                    </TouchableOpacity>

                    {APP_CATEGORIES.slice(0, 6).map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryTab,
                          selectedCategory === category.id &&
                            styles.categoryTabSelected,
                        ]}
                        onPress={() => setSelectedCategory(category.id)}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={16}
                          color={
                            selectedCategory === category.id
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.categoryTabLabel,
                            selectedCategory === category.id &&
                              styles.categoryTabLabelSelected,
                          ]}
                        >
                          {category.label.split(" ")[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search apps..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />

                  {displayedApps.length > 0 && hasProtectedAppsPremium && (
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={handleToggleAllDisplayed}
                    >
                      <Text style={styles.selectAllText}>
                        {allDisplayedSelected
                          ? `✓ Deselect All (${displayedApps.length})`
                          : `Select All (${displayedApps.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.appList}>
                    {displayedApps.length > 0 ? (
                      displayedApps.map((app) => (
                        <Checkbox
                          key={app.packageName}
                          label={`${app.label}`}
                          checked={selectedAppSet.has(app.packageName)}
                          disabled={
                            !hasProtectedAppsPremium &&
                            !selectedAppSet.has(app.packageName) &&
                            selectedAppSet.size >= FREE_PROTECTED_APPS_LIMIT
                          }
                          onPress={() => handleAppToggle(app.packageName)}
                        />
                      ))
                    ) : (
                      <Text style={styles.description}>No apps found</Text>
                    )}
                  </View>

                  <Text style={styles.selectedCount}>
                    {selectedAppSet.size} app
                    {selectedAppSet.size !== 1 ? "s" : ""} selected
                  </Text>
                  {!hasProtectedAppsPremium && hasReachedFreeAppLimit && (
                    <Text style={styles.descriptionSmall}>
                      You&apos;ve reached the free plan limit. Upgrade to
                      protect more apps and unlock Lumi.
                    </Text>
                  )}
                  {isSimulatorScreenshotMode && (
                    <Text style={styles.descriptionSmall}>
                      Screenshot mode: selection is optional so you can continue
                      through onboarding screens on simulator.
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {step === "permissions" && (
            <>
              <Text style={styles.title}>
                {permissionEnabled
                  ? "You\u2019re all set"
                  : Platform.OS === "ios"
                    ? "One small step"
                    : "Turn on Accessibility"}
              </Text>
              <Text style={styles.description}>
                {permissionEnabled
                  ? "GentleWait can now create gentle pauses before your chosen apps."
                  : isIOSFamilyControlsFlow
                    ? "GentleWait needs permission to manage screen time for the apps you choose."
                    : "GentleWait needs Accessibility access to notice when a chosen app opens and show your pause screen at the right moment."}
              </Text>

              <View style={styles.permissionCard}>
                <View style={styles.permissionIconRow}>
                  <View
                    style={[
                      styles.permissionStatusDot,
                      permissionEnabled && styles.permissionStatusDotActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.permissionStatusLabel,
                      permissionEnabled && { color: colors.secondary },
                    ]}
                  >
                    {isIOSFamilyControlsFlow
                      ? "App management"
                      : "Accessibility access"}
                  </Text>
                  <Text
                    style={[
                      styles.permissionStatusValue,
                      permissionEnabled && { color: colors.secondary },
                    ]}
                  >
                    {permissionEnabled ? "On" : "Off"}
                  </Text>
                </View>

                {!permissionEnabled && (
                  <Button
                    label={
                      Platform.OS === "ios"
                        ? "Allow access"
                        : "Open Accessibility Settings"
                    }
                    onPress={async () => {
                      try {
                        if (
                          isIOSFamilyControlsFlow &&
                          !isIOSFamilyControlsAvailable()
                        ) {
                          Alert.alert(
                            "Not available",
                            "This permission requires a native iOS build. Please run the app on a real device.",
                          );
                          return;
                        }
                        const granted = await requestServiceAuthorization();
                        if (granted) {
                          setPermissionEnabled(true);
                          return;
                        }

                        if (Platform.OS === "android") {
                          Alert.alert(
                            "Android setup incomplete",
                            "This build cannot open Accessibility Settings yet because the Android native accessibility module is not available. Add and register the Android GentleWait native module and accessibility service, then rebuild the app.",
                          );
                        }
                      } catch (error) {
                        console.error("Permission request error:", error);
                        if (Platform.OS === "android") {
                          Alert.alert(
                            "Could not open Accessibility Settings",
                            "GentleWait could not open Android Accessibility Settings from this build.",
                          );
                        }
                      }
                    }}
                    variant="primary"
                    style={{ marginTop: spacing.md }}
                  />
                )}
              </View>

              <Text style={styles.permissionFootnote}>
                Private by design — everything stays on your device. We never
                see your data.
              </Text>
            </>
          )}

          {step === "duration" && (
            <>
              <Text style={styles.title}>How long should we pause?</Text>
              <Text style={styles.description}>
                Just enough time for{" "}
                <Text style={styles.descriptionAccent}>one mindful breath</Text>
                . You can always adjust this later.
              </Text>

              <View style={styles.durationContainer}>
                {[10, 15, 20, 30].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationOption,
                      pauseDuration === duration && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => setPauseDuration(duration)}
                  >
                    <Text
                      style={[
                        styles.durationLabel,
                        pauseDuration === duration && { color: colors.bg },
                      ]}
                    >
                      {duration} seconds
                    </Text>
                    {pauseDuration === duration && (
                      <Ionicons name="checkmark" size={22} color={colors.bg} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === "cooldown" && (
            <>
              <Text style={styles.title}>How often should we check in?</Text>
              <Text style={styles.description}>
                After you complete a pause, how long before we{" "}
                <Text style={styles.descriptionAccent}>
                  gently remind you again
                </Text>{" "}
                for the same app?
              </Text>

              <View style={styles.cooldownSection}>
                <View style={styles.cooldownIntro}>
                  <Text style={styles.cooldownEyebrow}>Reminder cadence</Text>
                  <Text style={styles.cooldownHeadline}>
                    Give yourself enough room to actually reset
                  </Text>
                </View>

                <WheelPicker
                  items={COOLDOWN_OPTIONS}
                  selectedValue={cooldownMinutes}
                  onValueChange={setCooldownMinutes}
                  itemHeight={isCompactCooldownViewport ? 44 : 50}
                  visibleItems={3}
                  showSelectionBadge={!isCompactCooldownViewport}
                />

                {!isCompactCooldownViewport && (
                  <Text style={styles.cooldownHint}>
                    Shorter times keep you accountable. Longer times feel
                    gentler after a focused break.
                  </Text>
                )}
              </View>
            </>
          )}

          {step === "notifications" && (
            <>
              <View style={{ alignItems: "center", marginBottom: spacing.md }}>
                <View
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: colors.primaryLight,
                    borderWidth: 1,
                    borderColor: colors.glassStroke,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={30}
                    color={colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.title}>
                {notificationsGranted
                  ? "Notifications enabled"
                  : "Notifications are optional"}
              </Text>
              <Text style={styles.description}>
                {notificationsGranted
                  ? "You'll receive a gentle notification each time you choose calm. Tap it to start a guided breathing exercise."
                  : "GentleWait works without notifications. If you turn them on, you'll get a gentle reminder that can take you into a breathing exercise after a pause."}
              </Text>

              {!notificationsGranted && (
                <Button
                  label="Enable Notifications"
                  onPress={async () => {
                    const { status } =
                      await Notifications.getPermissionsAsync();
                    if (status === "denied") {
                      // iOS won't show the dialog again after denial — open Settings
                      Linking.openSettings();
                      return;
                    }
                    const result = await Notifications.requestPermissionsAsync({
                      ios: { allowAlert: true, allowSound: true },
                    });
                    setNotificationsGranted(result.granted);
                    setNotificationsDenied(!result.granted);
                  }}
                  variant="primary"
                  style={{ marginTop: spacing.md }}
                />
              )}

              {notificationsGranted && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    marginTop: spacing.md,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.secondary}
                  />
                  <Text
                    style={[
                      styles.permissionStatusLabel,
                      { color: colors.secondary },
                    ]}
                  >
                    Notifications are on
                  </Text>
                </View>
              )}
            </>
          )}

          {step === "done" && (
            <>
              <Text style={styles.title}>You&apos;re ready!</Text>
              <Text style={styles.description}>
                Your{" "}
                <Text style={styles.descriptionAccent}>mindful journey</Text>{" "}
                begins now.
              </Text>
              <Text style={styles.description}>
                Next time you reach for one of your selected apps, we&apos;ll be
                there with a{" "}
                <Text style={styles.descriptionSecondary}>gentle pause</Text>.
                {"\n\n"}
                Remember: every pause is a small victory.
              </Text>
            </>
          )}
        </ReanimatedAnimated.View>
      </ScrollView>

      {upgradePromptMessage && (
        <View style={styles.upgradePromptWrap}>
          <View style={styles.upgradePromptCard}>
            <LinearGradient
              colors={[
                "rgba(143, 214, 255, 0.22)",
                "rgba(126, 230, 198, 0.16)",
                "rgba(15, 23, 36, 0.98)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradePromptGradient}
            >
              <LinearGradient
                colors={[
                  "rgba(143, 214, 255, 0.35)",
                  "rgba(126, 230, 198, 0.24)",
                  "transparent",
                ]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.upgradePromptGlow}
              />

              <View style={styles.upgradePromptBadge}>
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={colors.secondary}
                />
                <Text style={styles.currentStateBadgeText}>Go Pro</Text>
              </View>

              <View style={styles.upgradePromptHeader}>
                <Ionicons
                  name="diamond-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.upgradePromptTitle}>
                  Unlock more protected apps and Lumi
                </Text>
              </View>

              <Text style={styles.upgradePromptText}>
                {upgradePromptMessage}
              </Text>

              <View style={styles.upgradePromptActions}>
                <TouchableOpacity
                  style={[
                    styles.upgradePromptButton,
                    styles.upgradePromptButtonGhost,
                  ]}
                  onPress={() => setUpgradePromptMessage(null)}
                >
                  <Text
                    style={[
                      styles.upgradePromptButtonText,
                      styles.upgradePromptButtonTextGhost,
                    ]}
                  >
                    Not now
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.upgradePromptButton,
                    styles.upgradePromptButtonPrimary,
                  ]}
                  onPress={() => {
                    setUpgradePromptMessage(null);
                    router.push("/paywall");
                  }}
                >
                  <Text
                    style={[
                      styles.upgradePromptButtonText,
                      styles.upgradePromptButtonTextPrimary,
                    ]}
                  >
                    View Premium
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}

      {validationMessage && !upgradePromptMessage && (
        <View pointerEvents="none" style={styles.validationToastWrap}>
          <ReanimatedAnimated.View
            style={[styles.validationBanner, toastStyle]}
          >
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.primary}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.validationBannerText}>{validationMessage}</Text>
          </ReanimatedAnimated.View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {(step !== "welcome-hero" &&
          step !== "program-preview" &&
          step !== "setup-choice") ||
        skipToStep === "select-apps" ? (
          <Button label="Back" onPress={handleBack} variant="secondary" />
        ) : null}
        <Button
          label={
            step === "done"
              ? "Start My Journey"
              : step === "welcome-hero"
                ? "Get Started"
                : step === "program-preview"
                  ? "Set Up My Pauses"
                  : step === "setup-choice"
                    ? "Continue"
                    : step === "summary"
                      ? "Almost There"
                      : skipToStep === "select-apps" && step === "select-apps"
                        ? "Save"
                        : step === "notifications" && !notificationsGranted
                          ? "Continue without notifications"
                          : "Continue"
          }
          onPress={handleNext}
          variant="primary"
          disabled={
            (step === "setup-choice" && setupPath === null) ||
            (step === "permissions" && !permissionEnabled)
          }
        />
      </View>
    </SafeAreaView>
  );
}
