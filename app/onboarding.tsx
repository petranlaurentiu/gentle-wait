/**
 * Onboarding flow screen with hero welcome, program preview, and optional personalization
 * Liquid Glass Design System
 */
import { Button } from "@/src/components/Button";
import { Checkbox } from "@/src/components/Checkbox";
import { GlassCard } from "@/src/components/GlassCard";
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
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import { useFadeInAnimation } from "@/src/utils/animations";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Image,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
const { width, height: screenHeight } = Dimensions.get("window");

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
  }, [skipToStep, currentSettings.selectedApps]);

  // Check accessibility/Family Controls permission status
  const checkPermissionStatus = async () => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    try {
      const { GentleWaitModule } = NativeModules;
      if (
        Platform.OS === "android" &&
        GentleWaitModule?.isAccessibilityServiceEnabled
      ) {
        const isEnabled =
          await GentleWaitModule.isAccessibilityServiceEnabled();
        setPermissionEnabled(isEnabled);
      } else if (
        Platform.OS === "ios" &&
        GentleWaitModule?.isFamilyControlsAuthorized
      ) {
        const isEnabled = await GentleWaitModule.isFamilyControlsAuthorized();
        setPermissionEnabled(isEnabled);
      }
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
      // Select all displayed
      displayedApps.forEach((app) => newSet.add(app.packageName));
    }
    setSelectedAppSet(newSet);
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

    if (step === "select-apps" && selectedAppSet.size === 0) {
      Alert.alert(
        "Select Apps",
        "Please select at least one app to monitor. This is required for GentleWait to work.",
      );
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
        selectedApps,
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

      // Sync selected apps to native storage (Android SharedPreferences / iOS UserDefaults)
      if (Platform.OS === "android" || Platform.OS === "ios") {
        try {
          const { GentleWaitModule } = NativeModules;
          if (GentleWaitModule?.setSelectedApps) {
            const appPackageNames = selectedApps.map((app) => app.packageName);
            await GentleWaitModule.setSelectedApps(appPackageNames);
            console.log(
              "[Settings] Synced",
              appPackageNames.length,
              "apps to native:",
              appPackageNames,
            );
          }
        } catch (error) {
          console.error("[Settings] Failed to sync apps to native:", error);
        }
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
        selectedApps,
        pauseDurationSec: pauseDuration,
        cooldownMinutes,
        userName,
        goals: Array.from(selectedGoals),
        emotions: Array.from(selectedEmotions),
        dailyScreenTimeHours: dailyScreenTime,
        targetScreenTimeHours: targetScreenTime,
        ageRange: selectedAge || undefined,
        onboardingCompleted: true,
      });

      // Sync selected apps to native storage for app interception service
      if (Platform.OS === "android" || Platform.OS === "ios") {
        try {
          const { GentleWaitModule } = NativeModules;
          if (GentleWaitModule?.setSelectedApps) {
            const appPackageNames = selectedApps.map((app) => app.packageName);
            await GentleWaitModule.setSelectedApps(appPackageNames);
            console.log(
              "[Onboarding] Synced",
              appPackageNames.length,
              "apps to native:",
              appPackageNames,
            );
          }
        } catch (error) {
          console.error("[Onboarding] Failed to sync apps to native:", error);
        }
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
      fontFamily: fonts.light,
      fontSize: 42,
      color: colors.text,
      letterSpacing: 0.5,
      marginTop: spacing.xl,
    },
    appNameAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    // Typography
    title: {
      fontFamily: fonts.medium,
      fontSize: 32,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: "center",
      letterSpacing: -0.3,
      lineHeight: 40,
    },
    subtitle: {
      fontFamily: fonts.medium,
      fontSize: 26,
      color: colors.text,
      marginBottom: spacing.xl,
      textAlign: "center",
      lineHeight: 34,
      letterSpacing: -0.2,
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
      fontSize: 18,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: "center",
      lineHeight: 28,
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
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      padding: spacing.md + 4,
      marginBottom: spacing.md,
      color: colors.text,
      fontSize: typography.body.fontSize,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
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
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.pills,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      gap: spacing.xs,
    },
    categoryTabSelected: {
      backgroundColor: "rgba(0, 212, 255, 0.2)",
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
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    selectAllText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
    },
    appList: {
      marginBottom: spacing.lg,
    },
    permissionContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
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
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    durationOptionSelected: {
      backgroundColor: "rgba(0, 212, 255, 0.2)",
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
      borderColor: "rgba(255, 255, 255, 0.1)",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      overflow: "hidden",
    },
    setupOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: "rgba(0, 212, 255, 0.2)",
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
      fontSize: 72,
      color: colors.primary,
      letterSpacing: -4,
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
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
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
      backgroundColor: "rgba(0, 212, 255, 0.15)",
      borderRadius: radius.glass,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: "rgba(0, 212, 255, 0.3)",
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
      backgroundColor: "rgba(0, 212, 255, 0.2)",
      borderRadius: radius.pills,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: "rgba(0, 212, 255, 0.4)",
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
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
    },
    ageOptionSelected: {
      backgroundColor: "rgba(0, 212, 255, 0.2)",
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
      backgroundColor: "rgba(255, 107, 157, 0.2)",
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
      backgroundColor: "rgba(255, 152, 0, 0.15)",
      borderRadius: radius.pills,
      borderWidth: 1,
      borderColor: "rgba(255, 152, 0, 0.4)",
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    stateEmotionPillPositive: {
      backgroundColor: "rgba(0, 212, 255, 0.15)",
      borderColor: "rgba(0, 212, 255, 0.4)",
    },
    stateEmotionIcon: {
      fontSize: 20,
    },
    stateEmotionText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: "#FF9800",
    },
    stateEmotionTextPositive: {
      color: colors.primary,
    },
    stateDivider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
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
      color: "#FF6B6B",
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
      color: "#FF6B6B",
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
      fontSize: 72,
      color: "#FF6B6B",
      textAlign: "center",
      letterSpacing: -4,
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
    programDays: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginVertical: spacing.md,
      width: "100%",
    },
    programDay: {
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: radius.glass,
      minWidth: 85,
    },
    programDayIcon: {
      fontSize: 36,
    },
    programDayLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
      letterSpacing: 0.3,
    },
    programDayArrow: {
      fontSize: 24,
      color: colors.primary,
      opacity: 0.7,
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
                        "rgba(0, 212, 255, 0.35)",
                        "rgba(168, 85, 247, 0.15)",
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
              <Text style={styles.title}>Build Better Habits</Text>
              <Text style={styles.description}>
                Small pauses lead to{" "}
                <Text style={styles.descriptionAccent}>big changes</Text>.
                {"\n"}We&apos;ll guide you one step at a time.
              </Text>

              <GlassCard
                glowColor="primary"
                style={{ marginVertical: spacing.xl }}
              >
                <View style={styles.programDays}>
                  <View style={styles.programDay}>
                    <Ionicons name="flower-outline" size={36} color={colors.primary} />
                    <Text style={styles.programDayLabel}>Breathe</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color={colors.primary} style={{ opacity: 0.7 }} />
                  <View style={styles.programDay}>
                    <Ionicons name="pencil-outline" size={36} color={colors.primary} />
                    <Text style={styles.programDayLabel}>Reflect</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color={colors.primary} style={{ opacity: 0.7 }} />
                  <View style={styles.programDay}>
                    <Ionicons name="leaf-outline" size={36} color={colors.primary} />
                    <Text style={styles.programDayLabel}>Grow</Text>
                  </View>
                </View>
              </GlassCard>

              <Text style={styles.description}>
                Breathing exercises, journaling prompts, and gentle nudges—
                {"\n"}
                <Text style={styles.descriptionAccent}>
                  no judgment, just presence
                </Text>
                .
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
                <Ionicons name="alert-circle-outline" size={20} color="#FF9800" />
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
                          colors={["#FF9999", "#FF6B6B", "#FF4444", "#CC0000"]}
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
                            "rgba(0, 212, 255, 0.2)",
                            "rgba(0, 212, 255, 0.4)",
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
              <Text style={styles.description}>
                Select the apps you reach for most—we&apos;ll add a{" "}
                <Text style={styles.descriptionAccent}>gentle pause</Text>{" "}
                before they open.
              </Text>

              {/* Category Filter Tabs */}
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

              {/* Search Input */}
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Select All / Deselect All Button */}
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

              {/* App List */}
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
            </>
          )}

          {step === "permissions" && (
            <>
              <Text style={styles.title}>One small step</Text>
              {permissionEnabled ? (
                <Text style={styles.description}>
                  Great! Accessibility permission is enabled. GentleWait can now
                  help you pause.
                </Text>
              ) : (
                <Text style={styles.description}>
                  To create that pause moment, GentleWait needs{" "}
                  <Text style={styles.descriptionAccent}>
                    accessibility access
                  </Text>{" "}
                  to know when you open an app.
                </Text>
              )}

              <View style={styles.permissionContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.permissionText, { flex: 1 }]}>Your data never leaves your device</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="eye-off-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.permissionText, { flex: 1 }]}>We never see what&apos;s inside your apps</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.permissionText, { flex: 1 }]}>You&apos;re always in control</Text>
                </View>
              </View>

              {permissionEnabled ? (
                <View
                  style={[
                    styles.permissionContainer,
                    {
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
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
                    GentleWait is ready to help you pause!
                  </Text>
                </View>
              ) : (
                <Button
                  label={
                    Platform.OS === "ios"
                      ? "Enable Family Controls"
                      : "Enable Accessibility Permission"
                  }
                  onPress={async () => {
                    if (Platform.OS === "android") {
                      try {
                        const { GentleWaitModule } = NativeModules;
                        if (GentleWaitModule) {
                          await GentleWaitModule.openAccessibilitySettings();
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
                        const { GentleWaitModule } = NativeModules;
                        if (
                          GentleWaitModule?.requestFamilyControlsAuthorization
                        ) {
                          const granted =
                            await GentleWaitModule.requestFamilyControlsAuthorization();
                          if (granted) {
                            setPermissionEnabled(true);
                            Alert.alert(
                              "Success",
                              "Family Controls authorized! GentleWait can now monitor your app usage.",
                              [{ text: "OK" }],
                            );
                          } else {
                            Alert.alert(
                              "Permission Denied",
                              "Family Controls permission is required for GentleWait to work. You can enable it later in Settings.",
                              [{ text: "OK" }],
                            );
                          }
                        } else {
                          Alert.alert(
                            "Not Available",
                            "Family Controls is not available. Make sure you're running iOS 15+ and the native module is properly configured.",
                            [{ text: "OK" }],
                          );
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
