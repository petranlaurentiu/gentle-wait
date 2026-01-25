/**
 * Onboarding flow screen with hero welcome, program preview, and optional personalization
 * Liquid Glass Design System
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Image,
  Dimensions,
  NativeModules,
  Platform,
  Alert,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { useAppStore } from "@/src/services/storage";
import {
  getInstalledApps,
  filterApps,
  getAppsByCategory,
  getSuggestedApps,
  APP_CATEGORIES,
  CategorizedApp,
  AppCategory,
} from "@/src/services/apps";
import { Checkbox } from "@/src/components/Checkbox";
import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { useFadeInAnimation } from "@/src/utils/animations";

const logoImage = require("@/assets/logo.png");
const { width } = Dimensions.get("window");

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
    title: "The Research",
    text: "A 2024 survey of 42,000 US adults found heavy social media users felt more irritable.",
    source: "JAMA Network Open",
  },
  {
    title: "The Science",
    text: "Excessive phone use is linked to reduced attention span and increased anxiety levels.",
    source: "Nature Human Behaviour",
  },
];

const getStepOrder = (setupPath: SetupPath): OnboardingStep[] => {
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
      "done",
    ];
  }

  // Quick setup path - skip all personalized questions
  return [...baseSteps, "select-apps", "permissions", "duration", "done"];
};

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  // Check if we should skip to a specific step (e.g., from settings)
  const skipToStep = params.skipToStep as OnboardingStep | undefined;
  const initialStep = skipToStep || "welcome-hero";

  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [setupPath, setSetupPath] = useState<SetupPath>(
    skipToStep === "select-apps" ? "quick" : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [availableApps, setAvailableApps] = useState<CategorizedApp[]>([]);
  const [selectedAppSet, setSelectedAppSet] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    AppCategory | "all" | "suggested"
  >("suggested");
  const [pauseDuration, setPauseDuration] = useState(15);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const currentSettings = useAppStore((state) => state.settings);
  const [stepKey, setStepKey] = useState(0);

  // Onboarding state
  const [userName, setUserName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(
    new Set()
  );
  const [dailyScreenTime, setDailyScreenTime] = useState(4);
  const [targetScreenTime, setTargetScreenTime] = useState(2);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
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
            currentSettings.selectedApps.map((app) => app.packageName)
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
      if (Platform.OS === "android" && GentleWaitModule?.isAccessibilityServiceEnabled) {
        const isEnabled = await GentleWaitModule.isAccessibilityServiceEnabled();
        setPermissionEnabled(isEnabled);
      } else if (Platform.OS === "ios" && GentleWaitModule?.isFamilyControlsAuthorized) {
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
        }
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
    const stepOrder = getStepOrder(setupPath);
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
        "Please select at least one goal to continue."
      );
      return;
    }

    if (step === "emotional" && selectedEmotions.size === 0) {
      Alert.alert(
        "Select Emotions",
        "Please select at least one emotion to continue."
      );
      return;
    }

    if (step === "time-current" && dailyScreenTime === 0) {
      Alert.alert(
        "Select Screen Time",
        "Please select your current daily screen time."
      );
      return;
    }

    if (step === "time-goal" && targetScreenTime === 0) {
      Alert.alert(
        "Select Target Time",
        "Please select your target screen time goal."
      );
      return;
    }

    if (step === "select-apps" && selectedAppSet.size === 0) {
      Alert.alert(
        "Select Apps",
        "Please select at least one app to monitor. This is required for GentleWait to work."
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
        selectedAppSet.has(app.packageName)
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
              appPackageNames
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
      const selectedApps = availableApps.filter((app) =>
        selectedAppSet.has(app.packageName)
      );

      updateSettings({
        selectedApps,
        pauseDurationSec: pauseDuration,
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
              appPackageNames
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
    if (skipToStep === "select-apps") {
      router.back();
      return;
    }

    const stepOrder = getStepOrder(setupPath);
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
      true
    );
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
      padding: spacing.lg,
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center",
    },
    // Hero styles
    heroContainer: {
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    heroGlowContainer: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    heroGlow: {
      position: "absolute",
      width: width * 0.6,
      height: width * 0.6,
      borderRadius: width * 0.3,
    },
    heroLogoContainer: {
      width: 100,
      height: 100,
      borderRadius: 28,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    heroLogo: {
      width: "100%",
      height: "100%",
    },
    appNameLarge: {
      fontFamily: fonts.light,
      fontSize: typography.hero.fontSize,
      color: colors.text,
      letterSpacing: 1,
      marginTop: spacing.lg,
      fontWeight: "700",
    },
    appNameAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    // Typography
    title: {
      fontFamily: fonts.light,
      fontSize: 30,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: "center",
      letterSpacing: 0.2,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 20,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: "center",
      lineHeight: 28,
    },
    titleAccent: {
      color: colors.primary,
    },
    subtitleAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
    },
    description: {
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      textAlign: "center",
      lineHeight: 26,
    },
    descriptionAccent: {
      fontFamily: fonts.medium,
      color: colors.primary,
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
      marginBottom: spacing.lg,
    },
    analysisSubtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 26,
      marginBottom: spacing.xl,
    },
    analysisHighlight: {
      fontFamily: fonts.semiBold,
      color: "#FF6B6B",
    },
    chartContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      height: 200,
      gap: spacing.xl * 2,
      marginBottom: spacing.xl,
    },
    chartBar: {
      alignItems: "center",
      width: 80,
    },
    chartBarFill: {
      width: 70,
      borderRadius: 12,
      justifyContent: "flex-start",
      alignItems: "center",
      paddingTop: spacing.md,
      marginBottom: spacing.sm,
    },
    chartBarUser: {
      backgroundColor: "#FF6B6B",
    },
    chartBarAverage: {
      backgroundColor: "rgba(0, 212, 255, 0.3)",
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
    },
    analysisComparison: {
      fontFamily: fonts.light,
      fontSize: typography.bodyLarge.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xl * 2,
    },
    analysisDisclaimer: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
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
      marginVertical: spacing.lg,
      width: "100%",
    },
    programDay: {
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: radius.button,
      minWidth: 80,
    },
    programDayIcon: {
      fontSize: 28,
    },
    programDayLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    programDayArrow: {
      fontSize: 20,
      color: colors.primary,
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
                        "rgba(0, 212, 255, 0.4)",
                        "rgba(168, 85, 247, 0.2)",
                        "transparent",
                      ]}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: width * 0.3,
                      }}
                      start={{ x: 0.5, y: 0.5 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </ReanimatedAnimated.View>

                  {/* Logo with glass effect */}
                  <View style={styles.heroLogoContainer}>
                    <Image source={logoImage} style={styles.heroLogo} />
                  </View>
                </View>

                {/* App name */}
                <Text style={styles.appNameLarge}>
                  Gentle<Text style={styles.appNameAccent}>Wait</Text>
                </Text>
              </View>

              <Text style={styles.subtitle}>
                Reclaim Your{" "}
                <Text style={styles.subtitleAccent}>Attention</Text>
              </Text>
              <Text style={styles.description}>
                That split second before you scroll?{"\n"}
                <Text style={styles.descriptionAccent}>
                  That&apos;s where change happens.
                </Text>
                {"\n\n"}
                GentleWait creates a mindful pause—giving you the power to{" "}
                <Text style={styles.descriptionSecondary}>
                  choose intentionally
                </Text>
                .
              </Text>
            </>
          )}

          {step === "program-preview" && (
            <>
              <Text style={styles.title}>Your Journey Begins</Text>
              <Text style={styles.description}>
                We&apos;ll create a{" "}
                <Text style={styles.descriptionAccent}>
                  personalized program
                </Text>{" "}
                just for you—building new habits one mindful moment at a time.
              </Text>

              <GlassCard
                glowColor="primary"
                style={{ marginVertical: spacing.lg }}
              >
                <View style={styles.programDays}>
                  <View style={styles.programDay}>
                    <Text style={styles.programDayIcon}>🧘</Text>
                    <Text style={styles.programDayLabel}>Day 1</Text>
                  </View>
                  <Text style={styles.programDayArrow}>→</Text>
                  <View style={styles.programDay}>
                    <Text style={styles.programDayIcon}>🏃</Text>
                    <Text style={styles.programDayLabel}>Day 7</Text>
                  </View>
                  <Text style={styles.programDayArrow}>→</Text>
                  <View style={styles.programDay}>
                    <Text style={styles.programDayIcon}>🌱</Text>
                    <Text style={styles.programDayLabel}>Day 21</Text>
                  </View>
                </View>
              </GlassCard>

              <Text style={styles.description}>
                <Text style={styles.descriptionAccent}>
                  Breathing exercises
                </Text>
                ,{" "}
                <Text style={styles.descriptionSecondary}>movement breaks</Text>
                , journaling prompts, and an{" "}
                <Text style={styles.descriptionAccent}>AI companion</Text> to
                guide you.{"\n\n"}
                No judgment. Just gentle nudges toward presence.
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
                    ⚡ Quick Setup
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
                    3 min
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
                    🎯 Personalized Setup
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
              <Text style={styles.title}>Hey, who&apos;s there? 👋</Text>
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
                  "📱 Reduce my screen time",
                  "🎯 Sharpen my focus",
                  "😴 Sleep better at night",
                  "👨‍👩‍👧 More presence with loved ones",
                  "🧘 Find calm in the chaos",
                  "⚡ Boost my energy",
                  "🌱 Build lasting habits",
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
                  "😔 Guilty about wasted time",
                  "😰 More anxious than before",
                  "🔋 Mentally drained",
                  "🌫️ Disconnected from the moment",
                  "😤 Irritable and restless",
                  "😞 Wishing I hadn't",
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
                <Text style={styles.stateAppIconText}>📱</Text>
              </View>

              {/* Current emotion pill */}
              <View style={styles.stateEmotionPill}>
                <Text style={styles.stateEmotionIcon}>😤</Text>
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
                  <Image source={logoImage} style={styles.stateLogoIcon} />
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
                <Text style={styles.stateEmotionIcon}>😌</Text>
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
                  <Text style={styles.researchIcon}>🔬</Text>
                  <Text style={styles.researchTitle}>
                    {RESEARCH_QUOTES[0].title}
                  </Text>
                </View>
                <Text style={styles.researchText}>
                  {RESEARCH_QUOTES[0].text} From{" "}
                  <Text style={styles.researchSource}>
                    {RESEARCH_QUOTES[0].source}
                  </Text>
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

              return (
                <>
                  <Text style={styles.analysisTitle}>
                    It doesn&apos;t look good so far...
                  </Text>
                  <Text style={styles.analysisSubtitle}>
                    Your response indicates a clear{"\n"}
                    <Text style={styles.analysisHighlight}>
                      negative dependence
                    </Text>{" "}
                    on your phone*
                  </Text>

                  {/* Bar chart */}
                  <View style={styles.chartContainer}>
                    <View style={styles.chartBar}>
                      <View
                        style={[
                          styles.chartBarFill,
                          styles.chartBarUser,
                          { height: `${userScore}%` },
                        ]}
                      >
                        <Text style={styles.chartBarValue}>{userScore}%</Text>
                      </View>
                      <Text style={styles.chartBarLabel}>Your Result</Text>
                    </View>
                    <View style={styles.chartBar}>
                      <View
                        style={[
                          styles.chartBarFill,
                          styles.chartBarAverage,
                          { height: `${averageScore}%` },
                        ]}
                      >
                        <Text style={styles.chartBarValue}>
                          {averageScore}%
                        </Text>
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
                    *This is not a psychological diagnosis
                  </Text>
                </>
              );
            })()}

          {step === "projection" &&
            (() => {
              // Calculate projections
              const daysPerYear = Math.round((dailyScreenTime * 365) / 24);
              const yearsInLifetime = Math.round(
                (dailyScreenTime * 365 * 50) / (24 * 365)
              );

              return (
                <>
                  <Text style={styles.projectionTitle}>
                    At your current rate, you&apos;ll spend{"\n"}
                    <Text style={styles.projectionHighlight}>
                      {daysPerYear} days
                    </Text>{" "}
                    on your phone over the next year
                  </Text>

                  <Text style={styles.projectionSubtitle}>
                    Which means you&apos;re on track to spend
                  </Text>

                  <Text style={styles.projectionYears}>
                    {yearsInLifetime} years
                  </Text>

                  <Text style={styles.projectionDescription}>
                    of your life looking down at your phone.{"\n"}
                    Yep, you read this right.
                  </Text>

                  <Text style={styles.projectionDisclaimer}>
                    Projection of your screen time habits based on an 85-year
                    lifespan and 16 waking hours a day.
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
                <Text style={styles.laurelLeft}>🌿</Text>
                <View style={styles.laurelContent}>
                  <Text style={styles.laurelTitle}>
                    Over{" "}
                    <Text style={styles.laurelHighlight}>300,000 People</Text>
                  </Text>
                  <Text style={styles.laurelSubtitle}>
                    started with the same goals!
                  </Text>
                </View>
                <Text style={styles.laurelRight}>🌿</Text>
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
                      📱 Reduce Screen Time by{" "}
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
                  <Text style={styles.testimonialStars}>⭐⭐⭐⭐⭐</Text>
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
                  <Text style={styles.testimonialStars}>⭐⭐⭐⭐⭐</Text>
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
                  <Text style={styles.categoryTabIcon}>⭐</Text>
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
                  <Text style={styles.categoryTabIcon}>📋</Text>
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
                    <Text style={styles.categoryTabIcon}>{category.icon}</Text>
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
                <Text style={styles.permissionText}>
                  🔒 Your data never leaves your device
                </Text>
                <Text style={styles.permissionText}>
                  👁️ We never see what&apos;s inside your apps
                </Text>
                <Text style={styles.permissionText}>
                  ⚙️ You&apos;re always in control
                </Text>
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
                    ✅ Permission Enabled
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
                  label={Platform.OS === "ios" ? "Enable Family Controls" : "Enable Accessibility Permission"}
                  onPress={async () => {
                    if (Platform.OS === "android") {
                      try {
                        const { GentleWaitModule } = NativeModules;
                        if (GentleWaitModule) {
                          await GentleWaitModule.openAccessibilitySettings();
                          Alert.alert(
                            "Enable GentleWait",
                            "Find 'GentleWait' in the list and turn it ON, then come back to the app.",
                            [{ text: "OK" }]
                          );
                        } else {
                          Alert.alert(
                            "Error",
                            "Native module not available. Make sure you're running on Android."
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Error opening accessibility settings:",
                          error
                        );
                        Alert.alert(
                          "Error",
                          "Could not open accessibility settings. Please go to Settings > Accessibility manually."
                        );
                      }
                    } else if (Platform.OS === "ios") {
                      try {
                        const { GentleWaitModule } = NativeModules;
                        if (GentleWaitModule?.requestFamilyControlsAuthorization) {
                          const granted = await GentleWaitModule.requestFamilyControlsAuthorization();
                          if (granted) {
                            setPermissionEnabled(true);
                            Alert.alert(
                              "Success",
                              "Family Controls authorized! GentleWait can now monitor your app usage.",
                              [{ text: "OK" }]
                            );
                          } else {
                            Alert.alert(
                              "Permission Denied",
                              "Family Controls permission is required for GentleWait to work. You can enable it later in Settings.",
                              [{ text: "OK" }]
                            );
                          }
                        } else {
                          Alert.alert(
                            "Not Available",
                            "Family Controls is not available. Make sure you're running iOS 15+ and the native module is properly configured.",
                            [{ text: "OK" }]
                          );
                        }
                      } catch (error) {
                        console.error("Error requesting Family Controls:", error);
                        Alert.alert(
                          "Error",
                          "Could not request Family Controls permission. Please try again.",
                          [{ text: "OK" }]
                        );
                      }
                    } else {
                      Alert.alert(
                        "Not Supported",
                        "App interception is only available on iOS and Android devices."
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
                      <Text
                        style={[styles.durationValue, { color: colors.bg }]}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === "done" && (
            <>
              <Text style={styles.title}>You&apos;re ready! 🌟</Text>
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
              ? "Begin My Journey"
              : step === "welcome-hero"
              ? "Let's Go"
              : step === "program-preview"
              ? "I'm Ready"
              : step === "setup-choice"
              ? "Continue"
              : step === "summary"
              ? "I'm Next"
              : skipToStep === "select-apps" && step === "select-apps"
              ? "Save"
              : "Next"
          }
          onPress={handleNext}
          variant="primary"
          disabled={step === "setup-choice" && setupPath === null}
        />
      </View>
    </SafeAreaView>
  );
}
