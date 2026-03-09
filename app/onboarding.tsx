/**
 * Onboarding flow screen with hero welcome, program preview, and optional personalization
 * Liquid Glass Design System
 */
import { Button } from "@/src/components/Button";
import { Checkbox } from "@/src/components/Checkbox";
import { GlassCard } from "@/src/components/GlassCard";
import { COOLDOWN_OPTIONS, WheelPicker } from "@/src/components/WheelPicker";
import {
  FREE_PROTECTED_APPS_LIMIT,
  getUpgradePitch,
  PRICING,
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
  clearIOSFamilyControlsSelection,
  configureIOSProtection,
  exceedsFreeIOSSelectionLimit,
  getIOSSelectionSummary,
  isIOSFamilyControlsAvailable,
  isServiceEnabled,
  requestServiceAuthorization,
  setSelectedApps as syncSelectedAppsToNative,
} from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import { useFadeInAnimation } from "@/src/utils/animations";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Fragment, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { DeviceActivitySelectionView } from "react-native-device-activity";
import ReanimatedAnimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const mainLogo = require("@/assets/images/main_logo.png");

const PROGRAM_PREVIEW_STEPS = [
  {
    label: "Breathe",
    icon: "flower-outline",
    description: "Pause the urge with one calm inhale and a softer exhale.",
  },
  {
    label: "Reflect",
    icon: "pencil-outline",
    description: "Notice what you need before habit takes over.",
  },
  {
    label: "Grow",
    icon: "leaf-outline",
    description: "Return with a steadier sense of time, focus, and energy.",
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
      "select-apps",
      "permissions",
      "duration",
      "cooldown",
      "done",
    ];
  }

  // Quick setup path - skip all personalized questions
  return [
    ...baseSteps,
    "select-apps",
    "permissions",
    "duration",
    "cooldown",
    "done",
  ];
};

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { width, height: screenHeight } = useWindowDimensions();
  const isNarrowPreviewLayout = width < 420;
  const isCompactPreviewViewport = width < 420 || screenHeight < 880;

  // Check if we should skip to a specific step (e.g., from settings)
  const skipToStep = params.skipToStep as OnboardingStep | undefined;
  const mode = params.mode as string | undefined; // "complete-profile" for adding personalization later
  const isCompleteProfileMode = mode === "complete-profile";

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
  const currentSettings = useAppStore((state) => state.settings);
  const [stepKey, setStepKey] = useState(0);

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
  const hasReachedFreeAppLimit =
    !currentSettings.premium &&
    selectedAppSet.size >= FREE_PROTECTED_APPS_LIMIT;
  const isIOSFamilyControlsFlow = Platform.OS === "ios";

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
          if (
            skipToStep === "select-apps" &&
            currentSettings.iosFamilyActivitySelection
          ) {
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

  const handleAppToggle = (packageName: string) => {
    const newSet = new Set(selectedAppSet);
    if (newSet.has(packageName)) {
      newSet.delete(packageName);
    } else {
      if (
        !currentSettings.premium &&
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
      if (!currentSettings.premium) {
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
    if (currentSettings.premium) {
      return true;
    }

    if (
      exceedsFreeIOSSelectionLimit(
        iosFamilyActivitySelection,
        FREE_PROTECTED_APPS_LIMIT,
      )
    ) {
      setValidationMessage(null);
      setUpgradePromptMessage(
        `On iPhone, the free plan supports up to ${FREE_PROTECTED_APPS_LIMIT} individual apps. Categories, websites, and larger selections are part of Premium.`,
      );
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
      ((isIOSFamilyControlsFlow &&
        !iosFamilyActivitySelection?.familyActivitySelection) ||
        (!isIOSFamilyControlsFlow && selectedAppSet.size === 0))
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
      !validateIOSSelectionForPlan()
    ) {
      return;
    }

    if (step === "age" && !selectedAge) {
      setValidationMessage(
        "Choose your age range so we can tailor the experience.",
      );
      return;
    }

    // If coming from settings and on select-apps step, save and go back
    const isAddingApps = skipToStep === "select-apps";
    if (isAddingApps && step === "select-apps") {
      setIsLoading(true);
      const selectedApps = availableApps.filter((app) =>
        selectedAppSet.has(app.packageName),
      );

      updateSettings({
        selectedApps: isIOSFamilyControlsFlow
          ? currentSettings.selectedApps
          : selectedApps,
        iosFamilyActivitySelection: isIOSFamilyControlsFlow
          ? iosFamilyActivitySelection
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
        if (isIOSFamilyControlsFlow && iosFamilyActivitySelection) {
          await configureIOSProtection(
            iosFamilyActivitySelection,
            currentSettings.cooldownMinutes || cooldownMinutes,
          );
        } else {
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
          ? iosFamilyActivitySelection
          : null,
        onboardingCompleted: true,
      });

      try {
        if (isIOSFamilyControlsFlow && iosFamilyActivitySelection) {
          await configureIOSProtection(
            iosFamilyActivitySelection,
            cooldownMinutes,
          );
        } else {
          await syncSelectedAppsToNative(selectedApps);
        }
      } catch (error) {
        console.error("[Onboarding] Failed to sync apps to native:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/home");
    } else {
      setStep(stepOrder[currentIndex + 1]);
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
    previewContentContainer: {
      justifyContent: "flex-start",
      paddingBottom: spacing.xl,
    },
    // Hero styles
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
      position: "relative",
      overflow: "hidden",
      minHeight: 220,
      marginBottom: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    iosPickerContent: {
      padding: spacing.lg,
      gap: spacing.sm,
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
      ...StyleSheet.absoluteFillObject,
      opacity: 0.02,
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
      color: colors.primary,
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
      backgroundColor: colors.glassFill,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      minWidth: 60,
      alignItems: "center",
    },
    timeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeButtonText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    timeButtonTextSelected: {
      color: colors.bg,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    summaryBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
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
      color: colors.primary,
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
      color: colors.primary,
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
      backgroundColor: colors.glassFill,
      borderRadius: radius.pills,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassStroke,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    currentStateBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
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
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
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
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      marginTop: spacing.sm,
    },
    currentStateStatIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
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
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    analysisBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
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
      color: colors.primary,
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
      color: colors.primary,
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
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignItems: "center",
      gap: spacing.xs,
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
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    analysisInsightChipText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    projectionBadgeText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.secondary,
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
      color: colors.primary,
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
      color: colors.primary,
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
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      alignItems: "center",
      gap: spacing.xs,
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
      marginTop: spacing.md,
    },
    previewIntro: {
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    previewBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
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
    previewHeroCard: {
      marginVertical: spacing.md,
      overflow: "hidden",
    },
    previewHeroGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    previewHeroTop: {
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    previewHeroTopCompact: {
      flexDirection: "row",
      alignItems: "center",
    },
    previewSpotlight: {
      width: isCompactPreviewViewport ? 72 : isNarrowPreviewLayout ? 96 : 120,
      height: isCompactPreviewViewport ? 72 : isNarrowPreviewLayout ? 96 : 120,
      alignItems: "center",
      justifyContent: "center",
    },
    previewSpotlightRing: {
      width: "100%",
      height: "100%",
      borderRadius: 999,
      padding: isCompactPreviewViewport ? 10 : isNarrowPreviewLayout ? 12 : 14,
      shadowColor: colors.primary,
      shadowOpacity: 0.22,
      shadowRadius: isCompactPreviewViewport ? 18 : 26,
      shadowOffset: { width: 0, height: isCompactPreviewViewport ? 6 : 10 },
    },
    previewSpotlightCore: {
      flex: 1,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(245, 247, 251, 0.88)",
    },
    previewHeroCopy: {
      alignItems: "center",
      gap: spacing.xs,
    },
    previewHeroCopyCompact: {
      flex: 1,
      alignItems: "flex-start",
    },
    previewHeroTitle: {
      fontFamily: fonts.semiBold,
      fontSize: isCompactPreviewViewport
        ? typography.heading.fontSize
        : isNarrowPreviewLayout
          ? typography.title.fontSize
          : 30,
      lineHeight: isCompactPreviewViewport
        ? typography.heading.lineHeight
        : isNarrowPreviewLayout
          ? typography.title.lineHeight
          : 36,
      letterSpacing: -0.4,
      color: colors.text,
      textAlign: isCompactPreviewViewport ? "left" : "center",
      maxWidth: isCompactPreviewViewport ? undefined : 320,
    },
    previewHeroDescription: {
      fontFamily: fonts.regular,
      fontSize: isCompactPreviewViewport
        ? typography.caption.fontSize
        : typography.body.fontSize,
      lineHeight: isCompactPreviewViewport ? 20 : typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: isCompactPreviewViewport ? "left" : "center",
      maxWidth: isCompactPreviewViewport ? undefined : 320,
    },
    previewMetricsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: isNarrowPreviewLayout ? spacing.sm : spacing.md,
      borderRadius: radius.card,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    previewMetric: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      minHeight: isCompactPreviewViewport ? 44 : 60,
    },
    previewMetricValue: {
      fontFamily: fonts.thin,
      fontSize: isCompactPreviewViewport ? 28 : 34,
      lineHeight: isCompactPreviewViewport ? 30 : 36,
      letterSpacing: -1.2,
      color: colors.text,
    },
    previewMetricLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    previewMetricDivider: {
      width: 1,
      backgroundColor: colors.glassStroke,
      opacity: 0.8,
    },
    programDays: {
      flexDirection: "column",
      gap: spacing.xs,
    },
    programDay: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      paddingVertical: isCompactPreviewViewport ? spacing.sm : spacing.md,
      paddingHorizontal: isCompactPreviewViewport
        ? spacing.sm + 2
        : isNarrowPreviewLayout
          ? spacing.md
          : spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.045)",
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    programDayIndex: {
      width: isCompactPreviewViewport ? 28 : 34,
      paddingTop: 1,
      alignItems: "center",
      flexShrink: 0,
    },
    programDayIndexText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    programDayIconWrap: {
      width: isCompactPreviewViewport ? 38 : isNarrowPreviewLayout ? 42 : 48,
      height: isCompactPreviewViewport ? 38 : isNarrowPreviewLayout ? 42 : 48,
      borderRadius: isCompactPreviewViewport
        ? 14
        : isNarrowPreviewLayout
          ? 16
          : 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: colors.glassStroke,
      flexShrink: 0,
    },
    programDayContent: {
      flex: 1,
      gap: 2,
      paddingTop: 1,
    },
    programDayLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.text,
    },
    programDayDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    programConnector: {
      flexDirection: isNarrowPreviewLayout ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      opacity: 0.82,
      paddingVertical: isNarrowPreviewLayout ? 0 : 2,
      paddingHorizontal: isNarrowPreviewLayout ? 0 : spacing.lg,
    },
    programConnectorLine: {
      width: isNarrowPreviewLayout ? 1 : 44,
      height: isNarrowPreviewLayout ? (isCompactPreviewViewport ? 10 : 14) : 1,
      backgroundColor: colors.glassStroke,
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
    upgradePromptPriceRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    upgradePromptPriceChip: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.button,
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      gap: 2,
    },
    upgradePromptPriceValue: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    upgradePromptPriceLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.small.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.7,
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          step === "program-preview" && styles.previewContentContainer,
        ]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ReanimatedAnimated.View key={stepKey} style={stepAnimation}>
          {step === "welcome-hero" && (
            <>
              <View style={styles.heroContainer}>
                {/* Animated glow behind logo */}
                <View style={styles.heroGlowContainer}>
                  <ReanimatedAnimated.View style={[styles.heroGlow, glowStyle]}>
                    <LinearGradient
                      colors={[
                        colors.gradientAccent1,
                        colors.gradientAccent2,
                        "transparent",
                      ]}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: width * 0.35,
                      }}
                      start={{ x: 0.5, y: 0.5 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </ReanimatedAnimated.View>

                  {/* Logo */}
                  <Image
                    source={mainLogo}
                    style={{ width: 120, height: 120 }}
                    resizeMode="contain"
                  />
                </View>

                {/* App name */}
                <Text style={styles.appNameLarge}>
                  Gentle<Text style={styles.appNameAccent}>Wait</Text>
                </Text>
              </View>

              <Text style={styles.subtitle}>
                Take a moment.{"\n"}
                <Text style={styles.subtitleAccent}>Breathe.</Text>
              </Text>
              <Text style={styles.description}>
                Before you scroll, we&apos;ll help you pause.{"\n"}A gentle
                moment to{" "}
                <Text style={styles.descriptionAccent}>choose mindfully</Text>
                {"\n"}instead of reaching out of habit.
              </Text>
            </>
          )}

          {step === "program-preview" && (
            <>
              <View style={styles.previewIntro}>
                <View style={styles.previewBadge}>
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color={colors.secondary}
                  />
                  <Text style={styles.previewBadgeText}>
                    A calmer ritual in 3 moves
                  </Text>
                </View>

                <Text style={styles.title}>
                  Breathe. Reflect.{" "}
                  <Text style={styles.titleAccent}>Grow.</Text>
                </Text>
              </View>

              <GlassCard glowColor="primary" style={styles.previewHeroCard}>
                <LinearGradient
                  colors={[
                    colors.primaryLight,
                    "rgba(126, 230, 198, 0.14)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.previewHeroGradient}
                />

                <View
                  style={[
                    styles.previewHeroTop,
                    isCompactPreviewViewport && styles.previewHeroTopCompact,
                  ]}
                >
                  <View style={styles.previewSpotlight}>
                    <LinearGradient
                      colors={[
                        colors.gradientAccent1,
                        colors.gradientAccent2,
                        colors.gradientAccent3,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.previewSpotlightRing}
                    >
                      <View style={styles.previewSpotlightCore}>
                        <Ionicons
                          name="leaf-outline"
                          size={isCompactPreviewViewport ? 24 : 32}
                          color={colors.bg}
                        />
                      </View>
                    </LinearGradient>
                  </View>

                  <View
                    style={[
                      styles.previewHeroCopy,
                      isCompactPreviewViewport && styles.previewHeroCopyCompact,
                    ]}
                  >
                    <Text style={styles.previewHeroTitle}>
                      Every interruption becomes a gentle reset
                    </Text>
                    <Text style={styles.previewHeroDescription}>
                      Slow the urge, surface intent, and make the next choice
                      feel lighter.
                    </Text>
                  </View>
                </View>

                <View style={styles.previewMetricsRow}>
                  <View style={styles.previewMetric}>
                    <Text style={styles.previewMetricValue}>3</Text>
                    <Text style={styles.previewMetricLabel}>small rituals</Text>
                  </View>
                  <View style={styles.previewMetricDivider} />
                  <View style={styles.previewMetric}>
                    <Text style={styles.previewMetricValue}>1</Text>
                    <Text style={styles.previewMetricLabel}>
                      calmer response
                    </Text>
                  </View>
                </View>

                <View style={styles.programDays}>
                  {PROGRAM_PREVIEW_STEPS.map((item, index) => (
                    <Fragment key={item.label}>
                      <View style={styles.programDay}>
                        <View style={styles.programDayIndex}>
                          <Text style={styles.programDayIndexText}>
                            0{index + 1}
                          </Text>
                        </View>

                        <View style={styles.programDayIconWrap}>
                          <Ionicons
                            name={item.icon}
                            size={isCompactPreviewViewport ? 20 : 24}
                            color={
                              index === 1 ? colors.secondary : colors.primary
                            }
                          />
                        </View>

                        <View style={styles.programDayContent}>
                          <Text style={styles.programDayLabel}>
                            {item.label}
                          </Text>
                          <Text style={styles.programDayDescription}>
                            {item.description}
                          </Text>
                        </View>
                      </View>

                      {index < PROGRAM_PREVIEW_STEPS.length - 1 && (
                        <View style={styles.programConnector}>
                          <View style={styles.programConnectorLine} />
                          <Ionicons
                            name={
                              isNarrowPreviewLayout
                                ? "arrow-down"
                                : "arrow-forward"
                            }
                            size={16}
                            color={colors.textMuted}
                          />
                          <View style={styles.programConnectorLine} />
                        </View>
                      )}
                    </Fragment>
                  ))}
                </View>
              </GlassCard>
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
                    color={colors.secondary}
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
                          color={colors.secondary}
                        />
                        <Text style={styles.currentStateEmotionText}>
                          {emotion}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.currentStateStatsGrid}>
                  {currentStateStats.map((item) => (
                    <View key={item.label} style={styles.currentStateStatCard}>
                      <View style={styles.currentStateStatIcon}>
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={colors.primary}
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
                  ))}
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
                  {gentleWaitSupports.map((item) => (
                    <View key={item} style={styles.currentStateSupportRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={colors.primary}
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
                        color={colors.secondary}
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

                  <GlassCard glowColor="primary" style={styles.analysisHeroCard}>
                    <LinearGradient
                      colors={[
                        colors.primaryLight,
                        "rgba(126, 230, 198, 0.12)",
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
                    <View style={styles.analysisStatCard}>
                      <Text style={styles.analysisStatValue}>
                        +{difference}%
                      </Text>
                      <Text style={styles.analysisStatLabel}>
                        above the average pattern
                      </Text>
                    </View>

                    <View style={styles.analysisStatCard}>
                      <Text style={styles.analysisStatValue}>
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
                      {analysisInsights.map((item) => (
                        <View key={item} style={styles.analysisInsightRow}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color={colors.primary}
                            style={{ marginTop: 2 }}
                          />
                          <Text style={styles.analysisInsightText}>
                            {item}
                          </Text>
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
                        color={colors.secondary}
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
                        colors.primaryLight,
                        "rgba(126, 230, 198, 0.12)",
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
                    <View style={styles.projectionStatCard}>
                      <Text style={styles.projectionStatValue}>
                        {yearsInLifetime}
                      </Text>
                      <Text style={styles.projectionStatLabel}>
                        years reclaimed over a lifetime
                      </Text>
                    </View>

                    <View style={styles.projectionStatCard}>
                      <Text style={styles.projectionStatValue}>
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
                <Text style={styles.timeValue}>{dailyScreenTime}h</Text>
                <Text style={styles.timeLabel}>per day</Text>

                <View style={styles.timeButtonsRow}>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeButton,
                        dailyScreenTime === hour && styles.timeButtonSelected,
                      ]}
                      onPress={() => setDailyScreenTime(hour)}
                    >
                      <Text
                        style={[
                          styles.timeButtonText,
                          dailyScreenTime === hour &&
                            styles.timeButtonTextSelected,
                        ]}
                      >
                        {hour}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {step === "time-goal" && (
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
                <Text style={styles.timeValue}>{targetScreenTime}h</Text>
                <Text style={styles.timeLabel}>target per day</Text>

                <View style={styles.timeButtonsRow}>
                  {[1, 2, 3, 4, 5, 6].map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeButton,
                        targetScreenTime === hour && styles.timeButtonSelected,
                      ]}
                      onPress={() => setTargetScreenTime(hour)}
                    >
                      <Text
                        style={[
                          styles.timeButtonText,
                          targetScreenTime === hour &&
                            styles.timeButtonTextSelected,
                        ]}
                      >
                        {hour}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {dailyScreenTime > targetScreenTime && (
                  <View style={styles.savingsCard}>
                    <Text style={styles.savingsText}>
                      That&apos;s{" "}
                      <Text style={styles.savingsHighlight}>
                        {dailyScreenTime - targetScreenTime} hours
                      </Text>{" "}
                      of your life back every day!
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {step === "summary" && (
            <>
              <View style={styles.summaryIntro}>
                <View style={styles.summaryBadge}>
                  <Ionicons
                    name="sparkles-outline"
                    size={14}
                    color={colors.secondary}
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
                    colors.primaryLight,
                    "rgba(126, 230, 198, 0.12)",
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
                  {selectedGoalList.slice(0, 3).map((goal) => (
                    <View key={goal} style={styles.summaryGoalPill}>
                      <Text style={styles.summaryGoalText}>{goal}</Text>
                    </View>
                  ))}
                  {selectedGoalList.length === 0 && (
                    <View style={styles.summaryGoalPill}>
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
                    Choose the apps or categories you want GentleWait to manage
                    from Apple&apos;s secure Family Controls picker.
                  </Text>
                  {!currentSettings.premium && (
                    <Text style={styles.selectedCount}>
                      Free plan: up to {FREE_PROTECTED_APPS_LIMIT} individual
                      iPhone apps. Categories and websites are Premium.
                    </Text>
                  )}
                  <View style={styles.permissionContainer}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      }}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.permissionText, { flex: 1 }]}>
                        Apple shows the selector. GentleWait does not read your
                        full installed app list.
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      }}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.permissionText, { flex: 1 }]}>
                        You can change this selection later from Settings.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.iosPickerCard}>
                    <View style={styles.iosPickerContent}>
                      <Text style={styles.iosPickerEyebrow}>Apple picker</Text>
                      <Text style={styles.iosPickerTitle}>
                        Choose apps in Family Controls
                      </Text>
                      <Text style={styles.iosPickerDescription}>
                        Tap anywhere below to open Apple&apos;s selector.
                      </Text>
                      <Text style={styles.selectedCount}>
                        {getIOSSelectionSummary(iosFamilyActivitySelection)}
                      </Text>
                      {!currentSettings.premium &&
                        exceedsFreeIOSSelectionLimit(
                          iosFamilyActivitySelection,
                          FREE_PROTECTED_APPS_LIMIT,
                        ) && (
                          <Text style={styles.descriptionSmall}>
                            This selection is larger than the free iPhone plan.
                            Upgrade to keep it.
                          </Text>
                        )}
                    </View>
                    {isIOSFamilyControlsAvailable() ? (
                      <DeviceActivitySelectionView
                        style={styles.iosSelectionView}
                        familyActivitySelection={
                          iosFamilyActivitySelection?.familyActivitySelection ||
                          null
                        }
                        headerText="Choose apps GentleWait should manage"
                        footerText="You can update this later in Settings."
                        onSelectionChange={(event) => {
                          const nextSelection = event.nativeEvent;
                          setIOSFamilyActivitySelection({
                            familyActivitySelection:
                              nextSelection.familyActivitySelection || "",
                            applicationCount:
                              nextSelection.applicationCount || 0,
                            categoryCount: nextSelection.categoryCount || 0,
                            webDomainCount: nextSelection.webDomainCount || 0,
                            includeEntireCategory:
                              nextSelection.includeEntireCategory || false,
                            updatedAt: Date.now(),
                          });
                        }}
                      />
                    ) : null}
                  </View>
                  {iosFamilyActivitySelection ? (
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={async () => {
                        setIOSFamilyActivitySelection(null);
                        await clearIOSFamilyControlsSelection();
                      }}
                    >
                      <Text style={styles.selectAllText}>Clear selection</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.description}>
                    Select the apps you reach for most-we&apos;ll add a{" "}
                    <Text style={styles.descriptionAccent}>gentle pause</Text>{" "}
                    before they open.
                  </Text>
                  {!currentSettings.premium && (
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

                  {displayedApps.length > 0 && (
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
                  {!currentSettings.premium && hasReachedFreeAppLimit && (
                    <Text style={styles.descriptionSmall}>
                      You&apos;ve reached the free plan limit. Upgrade to
                      protect more apps and unlock the AI Companion.
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          {step === "permissions" && (
            <>
              <Text style={styles.title}>One small step</Text>
              {permissionEnabled ? (
                <Text style={styles.description}>
                  {isIOSFamilyControlsFlow
                    ? "Family Controls is enabled. Your iPhone is ready for GentleWait protection."
                    : "Great! Accessibility permission is enabled. GentleWait can now help you pause."}
                </Text>
              ) : (
                <Text style={styles.description}>
                  {isIOSFamilyControlsFlow ? (
                    <>
                      To manage selected apps on iPhone, GentleWait needs{" "}
                      <Text style={styles.descriptionAccent}>
                        Family Controls authorization
                      </Text>
                      .
                    </>
                  ) : (
                    <>
                      To create that pause moment, GentleWait needs{" "}
                      <Text style={styles.descriptionAccent}>
                        accessibility access
                      </Text>{" "}
                      to notice when one of your chosen apps opens and bring up
                      the pause screen.
                    </>
                  )}
                </Text>
              )}

              <View style={styles.permissionContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.permissionText, { flex: 1 }]}>
                    Your data never leaves your device
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons
                    name="eye-off-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.permissionText, { flex: 1 }]}>
                    {isIOSFamilyControlsFlow
                      ? "We never see what happens inside your apps."
                      : "We do not read what you type, message, or watch inside apps."}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.permissionText, { flex: 1 }]}>
                    {isIOSFamilyControlsFlow
                      ? "You&apos;re always in control"
                      : "You can turn this off anytime in Android Accessibility settings."}
                  </Text>
                </View>
              </View>

              {permissionEnabled ? (
                <View
                  style={[
                    styles.permissionContainer,
                    {
                      backgroundColor: "rgba(141, 224, 186, 0.16)",
                      borderColor: colors.success,
                      borderWidth: 2,
                      marginTop: spacing.lg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.permissionText,
                      {
                        color: colors.success,
                        fontFamily: fonts.semiBold,
                        fontSize: typography.body.fontSize,
                      },
                    ]}
                  >
                    Permission Enabled
                  </Text>
                  <Text
                    style={[
                      styles.permissionText,
                      {
                        marginTop: spacing.xs,
                        fontSize: typography.caption.fontSize,
                      },
                    ]}
                  >
                    {isIOSFamilyControlsFlow
                      ? "GentleWait is ready to work with your Apple-managed selection."
                      : "GentleWait is ready to help you pause!"}
                  </Text>
                </View>
              ) : (
                <Button
                  label={
                    Platform.OS === "ios"
                      ? "Enable Family Controls"
                      : "Review Accessibility Access"
                  }
                  onPress={async () => {
                    if (Platform.OS === "android") {
                      try {
                        const granted = await requestServiceAuthorization();
                        if (granted) {
                          Alert.alert(
                            "Enable GentleWait",
                            "Find 'GentleWait' in the list and turn it ON, then come back to the app.",
                            [{ text: "OK" }],
                          );
                        } else {
                          Alert.alert(
                            "Error",
                            "Native module not available. Make sure you're running on Android.",
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Error opening accessibility settings:",
                          error,
                        );
                        Alert.alert(
                          "Error",
                          "Could not open accessibility settings. Please go to Settings > Accessibility manually.",
                        );
                      }
                    } else if (Platform.OS === "ios") {
                      try {
                        if (!isIOSFamilyControlsAvailable()) {
                          Alert.alert(
                            "Not Available",
                            "Family Controls is unavailable until the iOS native build includes the entitlement and extension targets.",
                            [{ text: "OK" }],
                          );
                        } else {
                          const granted = await requestServiceAuthorization();
                          if (granted) {
                            setPermissionEnabled(true);
                            Alert.alert(
                              "Success",
                              "Family Controls authorized. You can now choose protected apps on iPhone.",
                              [{ text: "OK" }],
                            );
                          } else {
                            Alert.alert(
                              "Permission Denied",
                              "Family Controls permission is required for GentleWait to work on iPhone. You can enable it later in Settings.",
                              [{ text: "OK" }],
                            );
                          }
                        }
                      } catch (error) {
                        console.error(
                          "Error requesting Family Controls:",
                          error,
                        );
                        Alert.alert(
                          "Error",
                          "Could not request Family Controls permission. Please try again.",
                          [{ text: "OK" }],
                        );
                      }
                    } else {
                      Alert.alert(
                        "Not Supported",
                        "App interception is only available on iOS and Android devices.",
                      );
                    }
                  }}
                  variant="primary"
                  style={{ marginTop: spacing.lg }}
                />
              )}
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

              <View style={{ alignItems: "center", marginTop: spacing.lg }}>
                <WheelPicker
                  items={COOLDOWN_OPTIONS}
                  selectedValue={cooldownMinutes}
                  onValueChange={setCooldownMinutes}
                />
              </View>
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
                  Unlock more protected apps and the AI Companion
                </Text>
              </View>

              <Text style={styles.upgradePromptText}>
                {upgradePromptMessage}
              </Text>

              <View style={styles.upgradePromptPriceRow}>
                <View style={styles.upgradePromptPriceChip}>
                  <Text style={styles.upgradePromptPriceValue}>
                    {PRICING.monthly}
                  </Text>
                  <Text style={styles.upgradePromptPriceLabel}>Monthly</Text>
                </View>
                <View style={styles.upgradePromptPriceChip}>
                  <Text style={styles.upgradePromptPriceValue}>
                    {PRICING.yearly}
                  </Text>
                  <Text style={styles.upgradePromptPriceLabel}>Best value</Text>
                </View>
              </View>

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
                  ? "Let's Begin"
                  : step === "setup-choice"
                    ? "Continue"
                    : step === "summary"
                      ? "Almost There"
                      : skipToStep === "select-apps" && step === "select-apps"
                        ? "Save"
                        : "Continue"
          }
          onPress={handleNext}
          variant="primary"
          disabled={step === "setup-choice" && setupPath === null}
        />
      </View>
    </SafeAreaView>
  );
}
