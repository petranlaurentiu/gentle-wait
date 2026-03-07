/**
 * Onboarding flow screen with hero welcome, program preview, and optional personalization
 * Liquid Glass Design System
 */
import { Button } from "@/src/components/Button";
import { Checkbox } from "@/src/components/Checkbox";
import { GlassCard } from "@/src/components/GlassCard";
import {
  FREE_PROTECTED_APPS_LIMIT,
  getUpgradePitch,
} from "@/src/constants/monetization";
import {
  COOLDOWN_OPTIONS,
  WheelPicker,
} from "@/src/components/WheelPicker";
import {
  APP_CATEGORIES,
  AppCategory,
  CategorizedApp,
  filterApps,
  getAppsByCategory,
  getInstalledApps,
  getSuggestedApps,
} from "@/src/services/apps";
import type { IOSFamilyActivitySelection } from "@/src/domain/models";
import {
  DeviceActivitySelectionView,
} from "react-native-device-activity";
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
    description: "Interrupt the impulse with one calm inhale and a softer exhale.",
  },
  {
    label: "Reflect",
    icon: "pencil-outline",
    description: "Notice what you need before habit takes over the moment.",
  },
  {
    label: "Grow",
    icon: "leaf-outline",
    description: "Build a steadier relationship with your time, focus, and energy.",
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

// Testimonials data
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    rating: 5,
    comment:
      "This app changed my relationship with my phone. I finally feel in control of my screen time.",
  },
  {
    name: "Daniel B.",
    rating: 5,
    comment:
      "It's a very good app; I really recommend it if you want to reduce your screen time and exercise more.",
  },
  {
    name: "Emily K.",
    rating: 5,
    comment:
      "The gentle pause feature is brilliant. No guilt, just awareness. Exactly what I needed.",
  },
];

// Age ranges
const AGE_RANGES = [
  { id: "under-18", label: "Under 18" },
  { id: "18-24", label: "18-24" },
  { id: "25-34", label: "25-34" },
  { id: "35-44", label: "35-44" },
  { id: "45-54", label: "45-54" },
  { id: "55+", label: "55+" },
];

// Research quotes
const RESEARCH_QUOTES = [
  {
    title: "Did You Know?",
    text: "Breaking the habit of mindless scrolling can improve focus, sleep quality, and overall well-being.",
    source: "",
  },
  {
    title: "The Goal",
    text: "Small pauses before opening apps help build awareness and give you back control of your time.",
    source: "",
  },
];

const getStepOrder = (setupPath: SetupPath, isCompleteProfileMode: boolean = false): OnboardingStep[] => {
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
  return [...baseSteps, "select-apps", "permissions", "duration", "cooldown", "done"];
};

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { width, height: screenHeight } = useWindowDimensions();
  const isNarrowPreviewLayout = width < 420;

  // Check if we should skip to a specific step (e.g., from settings)
  const skipToStep = params.skipToStep as OnboardingStep | undefined;
  const mode = params.mode as string | undefined; // "complete-profile" for adding personalization later
  const isCompleteProfileMode = mode === "complete-profile";
  
  // For complete-profile mode, start at goals step
  const initialStep = isCompleteProfileMode ? "goals" : (skipToStep || "welcome-hero");

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
  const updateSettings = useAppStore((state) => state.updateSettings);
  const currentSettings = useAppStore((state) => state.settings);
  const [stepKey, setStepKey] = useState(0);

  // Onboarding state - initialize from current settings if in complete-profile mode
  const [userName, setUserName] = useState(
    isCompleteProfileMode ? (currentSettings.userName || "") : ""
  );
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(
    isCompleteProfileMode && currentSettings.goals?.length
      ? new Set(currentSettings.goals)
      : new Set()
  );
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(
    isCompleteProfileMode && currentSettings.emotions?.length
      ? new Set(currentSettings.emotions)
      : new Set()
  );
  const [dailyScreenTime, setDailyScreenTime] = useState(
    isCompleteProfileMode ? (currentSettings.dailyScreenTimeHours || 4) : 4
  );
  const [targetScreenTime, setTargetScreenTime] = useState(
    isCompleteProfileMode ? (currentSettings.targetScreenTimeHours || 2) : 2
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    isCompleteProfileMode ? (currentSettings.ageRange || null) : null
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

  // Reset animation key when step changes
  useEffect(() => {
    setStepKey((prev) => prev + 1);
  }, [step]);

  // Load available apps on mount
  useEffect(() => {
    (async () => {
      try {
        if (isIOSFamilyControlsFlow) {
          if (skipToStep === "select-apps" && currentSettings.iosFamilyActivitySelection) {
            setIOSFamilyActivitySelection(currentSettings.iosFamilyActivitySelection);
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
        Alert.alert(
          "Free plan limit",
          `You can protect up to ${FREE_PROTECTED_APPS_LIMIT} apps on the free plan.\n\n${getUpgradePitch()}`,
          [
            { text: "Not now", style: "cancel" },
            { text: "View Premium", onPress: () => router.push("/paywall") },
          ],
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
          Alert.alert(
            "Free plan limit",
            `You can protect up to ${FREE_PROTECTED_APPS_LIMIT} apps on the free plan.\n\n${getUpgradePitch()}`,
            [
              { text: "Not now", style: "cancel" },
              { text: "View Premium", onPress: () => router.push("/paywall") },
            ],
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
          Alert.alert(
            "Free plan limit",
            `Only ${remainingSlots} more ${
              remainingSlots === 1 ? "app fits" : "apps fit"
            } on the free plan.\n\n${getUpgradePitch()}`,
            [
              { text: "Not now", style: "cancel" },
              { text: "View Premium", onPress: () => router.push("/paywall") },
            ],
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
      Alert.alert(
        "Premium required",
        `On iPhone, the free plan supports up to ${FREE_PROTECTED_APPS_LIMIT} individual apps. Categories, websites, and larger selections are part of Premium.`,
        [
          { text: "Not now", style: "cancel" },
          { text: "View Premium", onPress: () => router.push("/paywall") },
        ],
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
      Alert.alert(
        "Select Goals",
        "Please select at least one goal to continue.",
      );
      return;
    }

    if (step === "emotional" && selectedEmotions.size === 0) {
      Alert.alert(
        "Select Emotions",
        "Please select at least one emotion to continue.",
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
      Alert.alert("Select Age Range", "Please select your age range.");
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
      paddingBottom: spacing.lg,
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
      marginBottom: spacing.lg,
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
    // Summary / Testimonials styles
    laurelContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    laurelLeft: {
      fontSize: 40,
      transform: [{ scaleX: -1 }],
    },
    laurelRight: {
      fontSize: 40,
    },
    laurelContent: {
      alignItems: "center",
      paddingHorizontal: spacing.md,
    },
    laurelTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    laurelHighlight: {
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    laurelSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
    },
    selectedGoalsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    goalPill: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.pills,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    goalPillText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.primary,
    },
    testimonialCard: {
      marginBottom: spacing.md,
    },
    testimonialHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    testimonialName: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.text,
    },
    testimonialStars: {
      fontSize: 14,
    },
    testimonialComment: {
      fontFamily: fonts.light,
      fontSize: typography.body.fontSize,
      color: colors.text,
      fontStyle: "italic",
      lineHeight: 24,
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
    stateTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.primary,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    stateAppIcon: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: colors.accentLight,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: spacing.lg,
    },
    stateAppIconText: {
      fontSize: 32,
    },
    stateEmotionPill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.accentLight,
      borderRadius: radius.pills,
      borderWidth: 1,
      borderColor: colors.accent,
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    stateEmotionPillPositive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    stateEmotionIcon: {
      fontSize: 20,
    },
    stateEmotionText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.accent,
    },
    stateEmotionTextPositive: {
      color: colors.primary,
    },
    stateDivider: {
      height: 1,
      backgroundColor: colors.glassStroke,
      marginVertical: spacing.xl,
      width: "80%",
      alignSelf: "center",
    },
    stateWithApp: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    stateWithText: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
    },
    stateLogoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    stateLogoIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
    },
    stateLogoText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.title.fontSize,
      color: colors.primary,
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
    analysisTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    analysisSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 26,
      marginBottom: spacing.md,
    },
    analysisHighlight: {
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
    chartContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      gap: spacing.xl * 2,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    chartBar: {
      alignItems: "center",
      width: 96,
    },
    chartBarFill: {
      width: 86,
      borderRadius: 12,
      justifyContent: "flex-start",
      alignItems: "center",
      paddingTop: spacing.md,
      overflow: "hidden",
      minHeight: 60,
    },
    chartBarValue: {
      fontFamily: fonts.bold,
      fontSize: typography.heading.fontSize,
      color: colors.text,
    },
    chartBarLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.text,
      marginTop: spacing.sm,
    },
    analysisComparison: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    analysisDisclaimer: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    // Projection styles
    projectionTitle: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      textAlign: "center",
      lineHeight: 36,
      marginBottom: spacing.xl,
    },
    projectionHighlight: {
      fontFamily: fonts.semiBold,
      color: colors.error,
    },
    projectionSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    projectionYears: {
      fontFamily: fonts.thin,
      fontSize: typography.display.fontSize,
      color: colors.error,
      textAlign: "center",
      letterSpacing: typography.display.letterSpacing,
      marginBottom: spacing.md,
    },
    projectionDescription: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 28,
      marginBottom: spacing.xl * 2,
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
      marginBottom: spacing.lg,
      gap: spacing.md,
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
      marginVertical: spacing.xl,
      overflow: "hidden",
    },
    previewHeroGradient: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    previewHeroTop: {
      alignItems: "center",
      gap: spacing.lg,
      marginBottom: spacing.xl,
    },
    previewSpotlight: {
      width: isNarrowPreviewLayout ? 110 : 132,
      height: isNarrowPreviewLayout ? 110 : 132,
      alignItems: "center",
      justifyContent: "center",
    },
    previewSpotlightRing: {
      width: "100%",
      height: "100%",
      borderRadius: 999,
      padding: isNarrowPreviewLayout ? 12 : 14,
      shadowColor: colors.primary,
      shadowOpacity: 0.22,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 10 },
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
      gap: spacing.sm,
    },
    previewHeroTitle: {
      fontFamily: fonts.semiBold,
      fontSize: isNarrowPreviewLayout ? typography.title.fontSize : 30,
      lineHeight: isNarrowPreviewLayout ? typography.title.lineHeight : 36,
      letterSpacing: -0.4,
      color: colors.text,
      textAlign: "center",
      maxWidth: 320,
    },
    previewHeroDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 320,
    },
    previewMetricsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "center",
      gap: spacing.md,
      marginBottom: spacing.xl,
      paddingVertical: spacing.sm,
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
      minHeight: 60,
    },
    previewMetricValue: {
      fontFamily: fonts.thin,
      fontSize: 34,
      lineHeight: 36,
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
      gap: spacing.sm,
    },
    programDay: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: isNarrowPreviewLayout ? spacing.md : spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.045)",
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    programDayIndex: {
      width: 34,
      paddingTop: 2,
      alignItems: "center",
      flexShrink: 0,
    },
    programDayIndexText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.small.fontSize,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    programDayIconWrap: {
      width: isNarrowPreviewLayout ? 46 : 52,
      height: isNarrowPreviewLayout ? 46 : 52,
      borderRadius: isNarrowPreviewLayout ? 18 : 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: colors.glassStroke,
      flexShrink: 0,
    },
    programDayContent: {
      flex: 1,
      gap: spacing.xs,
      paddingTop: 2,
    },
    programDayLabel: {
      fontFamily: fonts.semiBold,
      fontSize: typography.heading.fontSize,
      lineHeight: typography.heading.lineHeight,
      color: colors.text,
    },
    programDayDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    programConnector: {
      flexDirection: isNarrowPreviewLayout ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      opacity: 0.82,
      paddingVertical: isNarrowPreviewLayout ? 0 : spacing.xs,
      paddingHorizontal: isNarrowPreviewLayout ? 0 : spacing.lg,
    },
    programConnectorLine: {
      width: isNarrowPreviewLayout ? 1 : 44,
      height: isNarrowPreviewLayout ? 18 : 1,
      backgroundColor: colors.glassStroke,
    },
    previewFooter: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.lg,
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
        contentContainerStyle={styles.contentContainer}
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
                Before you scroll, we&apos;ll help you pause.{"\n"}
                A gentle moment to{" "}
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
                  <Text style={styles.previewBadgeText}>A calmer ritual in 3 moves</Text>
                </View>

                <Text style={styles.title}>
                  Breathe. Reflect.{" "}
                  <Text style={styles.titleAccent}>Grow.</Text>
                </Text>
                <Text style={styles.description}>
                  Instead of dropping you into another habit loop, GentleWait
                  creates a short, beautiful pause that helps you come back to
                  yourself.
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

                <View style={styles.previewHeroTop}>
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
                          size={isNarrowPreviewLayout ? 30 : 36}
                          color={colors.bg}
                        />
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.previewHeroCopy}>
                    <Text style={styles.previewHeroTitle}>
                      Every interruption becomes a gentle reset
                    </Text>
                    <Text style={styles.previewHeroDescription}>
                      A short sequence designed to slow the urge, surface intent,
                      and make the next choice feel lighter.
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
                    <Text style={styles.previewMetricLabel}>calmer response</Text>
                  </View>
                </View>

                <View style={styles.programDays}>
                  {PROGRAM_PREVIEW_STEPS.map((item, index) => (
                    <Fragment key={item.label}>
                      <View style={styles.programDay}>
                        <View style={styles.programDayIndex}>
                          <Text style={styles.programDayIndexText}>0{index + 1}</Text>
                        </View>

                        <View style={styles.programDayIconWrap}>
                          <Ionicons
                            name={item.icon}
                            size={isNarrowPreviewLayout ? 24 : 28}
                            color={index === 1 ? colors.secondary : colors.primary}
                          />
                        </View>

                        <View style={styles.programDayContent}>
                          <Text style={styles.programDayLabel}>{item.label}</Text>
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

              <Text style={styles.previewFooter}>
                Breathing space, reflection prompts, and steady encouragement.
                {"\n"}
                <Text style={styles.descriptionAccent}>
                  No guilt. No pressure. Just a better rhythm.
                </Text>
              </Text>
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

              <View style={styles.appList}>
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

              <Text style={styles.selectedCount}>
                {selectedEmotions.size} emotion
                {selectedEmotions.size !== 1 ? "s" : ""} selected
              </Text>
            </>
          )}

          {step === "current-state" && (
            <>
              {/* Current State Section */}
              <Text style={styles.stateTitle}>Current State</Text>

              {/* Show first selected goal as app icon placeholder */}
              <View style={styles.stateAppIcon}>
                <Ionicons name="phone-portrait-outline" size={32} color={colors.accent} />
              </View>

              {/* Current emotion pill */}
              <View style={styles.stateEmotionPill}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.accent} />
                <Text style={styles.stateEmotionText}>
                  {selectedEmotions.size > 0
                    ? Array.from(selectedEmotions)[0]
                        .split(" ")
                        .slice(1)
                        .join(" ")
                    : "Irritable"}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.stateDivider} />

              {/* With GentleWait Section */}
              <View style={styles.stateWithApp}>
                <Text style={styles.stateWithText}>With </Text>
                <View style={styles.stateLogoContainer}>
                  <Image
                    source={mainLogo}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.stateLogoText}>GentleWait</Text>
                </View>
              </View>

              {/* Target emotion pill */}
              <View
                style={[
                  styles.stateEmotionPill,
                  styles.stateEmotionPillPositive,
                ]}
              >
                <Ionicons name="happy-outline" size={20} color={colors.primary} />
                <Text
                  style={[
                    styles.stateEmotionText,
                    styles.stateEmotionTextPositive,
                  ]}
                >
                  Calm
                </Text>
              </View>

              {/* Research quote */}
              <GlassCard style={styles.researchCard}>
                <View style={styles.researchHeader}>
                  <Ionicons name="flask-outline" size={20} color={colors.primary} />
                  <Text style={styles.researchTitle}>
                    {RESEARCH_QUOTES[0].title}
                  </Text>
                </View>
                <Text style={styles.researchText}>
                  {RESEARCH_QUOTES[0].text}
                </Text>
              </GlassCard>
            </>
          )}

          {step === "analysis" &&
            (() => {
              // Calculate a "dependence score" based on user inputs
              const baseScore = Math.min(dailyScreenTime * 8, 70);
              const emotionBonus = selectedEmotions.size * 5;
              const userScore = Math.min(baseScore + emotionBonus, 85);
              const averageScore = 33;
              const difference = userScore - averageScore;

              // Calculate bar heights based on screen height (responsive)
              const maxBarHeight = screenHeight * 0.45;
              const userBarHeight = (userScore / 100) * maxBarHeight;
              const averageBarHeight = (averageScore / 100) * maxBarHeight;

              return (
                <>
                  <Text style={styles.analysisTitle}>
                    It doesn&apos;t look good so far...
                  </Text>
                  <Text style={styles.analysisSubtitle}>
                    Your responses suggest a strong{"\n"}
                    <Text style={styles.analysisHighlight}>
                      reliance on your phone
                    </Text>{" "}
                    that may be affecting your well-being
                  </Text>

                  {/* Bar chart */}
                  <View style={styles.chartContainer}>
                    <View style={styles.chartBar}>
                      <View
                        style={[styles.chartBarFill, { height: userBarHeight }]}
                      >
                        <LinearGradient
                          colors={["#FF9999", colors.error, "#FF4444", "#CC0000"]}
                          start={{ x: 0.5, y: 1 }}
                          end={{ x: 0.5, y: 0 }}
                          style={{
                            width: "100%",
                            height: "100%",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            paddingTop: spacing.md,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={styles.chartBarValue}>{userScore}%</Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.chartBarLabel}>Your Result</Text>
                    </View>
                    <View style={styles.chartBar}>
                      <View
                        style={[
                          styles.chartBarFill,
                          { height: averageBarHeight },
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            colors.primaryLight,
                            colors.primary,
                            "rgba(0, 212, 255, 0.6)",
                            "rgba(0, 212, 255, 0.8)",
                          ]}
                          start={{ x: 0.5, y: 1 }}
                          end={{ x: 0.5, y: 0 }}
                          style={{
                            width: "100%",
                            height: "100%",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            paddingTop: spacing.md,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={styles.chartBarValue}>
                            {averageScore}%
                          </Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.chartBarLabel}>Average</Text>
                    </View>
                  </View>

                  <Text style={styles.analysisComparison}>
                    <Text style={styles.analysisHighlight}>
                      {difference}% higher
                    </Text>{" "}
                    than the average!
                  </Text>

                  <Text style={styles.analysisDisclaimer}>
                    Based on your responses about screen time and how you feel
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
                  <Text style={styles.projectionTitle}>
                    Imagine what you could do with{"\n"}
                    <Text style={styles.projectionHighlight}>
                      {daysPerYear} extra days
                    </Text>{" "}
                    each year
                  </Text>

                  <Text style={styles.projectionSubtitle}>
                    That&apos;s how much time you could reclaim
                  </Text>

                  <Text style={styles.projectionYears}>
                    {yearsInLifetime} years
                  </Text>

                  <Text style={styles.projectionDescription}>
                    of presence, creativity, and connection{"\n"}
                    waiting to be unlocked.
                  </Text>

                  <Text style={styles.projectionDisclaimer}>
                    Based on your current screen time and mindful reduction
                    goals.
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
              {/* Laurel wreath with stats */}
              <View style={styles.laurelContainer}>
                <Ionicons name="leaf-outline" size={40} color={colors.primary} style={{ transform: [{ scaleX: -1 }] }} />
                <View style={styles.laurelContent}>
                  <Text style={styles.laurelTitle}>
                    Over{" "}
                    <Text style={styles.laurelHighlight}>300,000 People</Text>
                  </Text>
                  <Text style={styles.laurelSubtitle}>
                    started with the same goals!
                  </Text>
                </View>
                <Ionicons name="leaf-outline" size={40} color={colors.primary} />
              </View>

              {/* User's selected goals */}
              <View style={styles.selectedGoalsContainer}>
                {Array.from(selectedGoals)
                  .slice(0, 2)
                  .map((goal, index) => (
                    <View key={index} style={styles.goalPill}>
                      <Text style={styles.goalPillText}>{goal}</Text>
                    </View>
                  ))}
                {selectedGoals.size === 0 && (
                  <View style={styles.goalPill}>
                    <Text style={styles.goalPillText}>
                      Reduce Screen Time by{" "}
                      {dailyScreenTime - targetScreenTime}h
                    </Text>
                  </View>
                )}
              </View>

              {/* Testimonial */}
              <GlassCard glowColor="primary" style={styles.testimonialCard}>
                <View style={styles.testimonialHeader}>
                  <Text style={styles.testimonialName}>
                    {TESTIMONIALS[0].name}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons key={i} name="star" size={14} color="#FFD700" />
                    ))}
                  </View>
                </View>
                <Text style={styles.testimonialComment}>
                  &ldquo;{TESTIMONIALS[0].comment}&rdquo;
                </Text>
              </GlassCard>

              <GlassCard intensity="light" style={styles.testimonialCard}>
                <View style={styles.testimonialHeader}>
                  <Text style={styles.testimonialName}>
                    {TESTIMONIALS[1].name}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons key={i} name="star" size={14} color="#FFD700" />
                    ))}
                  </View>
                </View>
                <Text style={styles.testimonialComment}>
                  &ldquo;{TESTIMONIALS[1].comment}&rdquo;
                </Text>
              </GlassCard>
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
                      <Text style={[styles.permissionText, { flex: 1 }]}>
                        Apple shows the selector. GentleWait does not read your full installed app list.
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
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
                          iosFamilyActivitySelection?.familyActivitySelection || null
                        }
                        headerText="Choose apps GentleWait should manage"
                        footerText="You can update this later in Settings."
                        onSelectionChange={(event) => {
                          const nextSelection = event.nativeEvent;
                          setIOSFamilyActivitySelection({
                            familyActivitySelection:
                              nextSelection.familyActivitySelection || "",
                            applicationCount: nextSelection.applicationCount || 0,
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
                      <Ionicons name="star-outline" size={16} color={selectedCategory === "suggested" ? colors.primary : colors.textSecondary} />
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
                        selectedCategory === "all" && styles.categoryTabSelected,
                      ]}
                      onPress={() => setSelectedCategory("all")}
                    >
                      <Ionicons name="list-outline" size={16} color={selectedCategory === "all" ? colors.primary : colors.textSecondary} />
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
                        <Ionicons name={category.icon as any} size={16} color={selectedCategory === category.id ? colors.primary : colors.textSecondary} />
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
                    {selectedAppSet.size} app{selectedAppSet.size !== 1 ? "s" : ""}{" "}
                    selected
                  </Text>
                  {!currentSettings.premium && hasReachedFreeAppLimit && (
                    <Text style={styles.descriptionSmall}>
                      You&apos;ve reached the free plan limit. Upgrade to protect more
                      apps and unlock the AI Companion.
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
                      to notice when one of your chosen apps opens and bring up the pause screen.
                    </>
                  )}
                </Text>
              )}

              <View style={styles.permissionContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.permissionText, { flex: 1 }]}>Your data never leaves your device</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="eye-off-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.permissionText, { flex: 1 }]}>
                    {isIOSFamilyControlsFlow
                      ? "We never see what happens inside your apps."
                      : "We do not read what you type, message, or watch inside apps."}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
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
