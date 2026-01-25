/**
 * Settings screen
 * Liquid Glass Design System
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  NativeModules,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated from "react-native-reanimated";
import { useAppStore } from "@/src/services/storage";
import { mmkvStorage } from "@/src/services/storage/mmkv";
import { deleteAllEvents } from "@/src/services/storage/sqlite";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { useFadeInAnimation, useStaggeredFadeIn } from "@/src/utils/animations";
import { triggerSelectionFeedback } from "@/src/utils/haptics";

const PAUSE_DURATIONS = [8, 10, 15, 20, 30];
const PROMPT_OPTIONS: Array<"off" | "sometimes" | "always"> = [
  "off",
  "sometimes",
  "always",
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const loadSettings = useAppStore((state) => state.loadSettings);

  // Animation hooks
  const headerAnimation = useFadeInAnimation();
  const protectedAppsAnimation = useStaggeredFadeIn(0, 5);
  const pauseDurationAnimation = useStaggeredFadeIn(1, 5);
  const promptsAnimation = useStaggeredFadeIn(2, 5);
  const premiumAnimation = useStaggeredFadeIn(3, 5);
  const privacyAnimation = useStaggeredFadeIn(4, 5);

  // Handlers
  const handleRemoveApp = async (packageName: string) => {
    const appToRemove = settings.selectedApps.find(
      (app) => app.packageName === packageName
    );
    const appName = appToRemove?.label || "this app";

    Alert.alert(
      "Remove App",
      `Remove ${appName} from protected apps? GentleWait will no longer pause when you open it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await triggerSelectionFeedback();
            const updatedApps = settings.selectedApps.filter(
              (app) => app.packageName !== packageName
            );
            updateSettings({ selectedApps: updatedApps });

            // Sync to native storage (Android SharedPreferences / iOS UserDefaults)
            if (Platform.OS === "android" || Platform.OS === "ios") {
              try {
                const { GentleWaitModule } = NativeModules;
                if (GentleWaitModule?.setSelectedApps) {
                  const appPackageNames = updatedApps.map(
                    (app) => app.packageName
                  );
                  await GentleWaitModule.setSelectedApps(appPackageNames);
                  console.log(
                    "[Settings] Synced apps to native after removal:",
                    appPackageNames
                  );
                }
              } catch (error) {
                console.error(
                  "[Settings] Failed to sync apps to native:",
                  error
                );
              }
            }
          },
        },
      ]
    );
  };

  const handleAddApps = () => {
    // Navigate to onboarding but skip to app selection step
    router.push({
      pathname: "/onboarding",
      params: { skipToStep: "select-apps" },
    });
  };

  const handleChangePauseDuration = async () => {
    await triggerSelectionFeedback();
    const currentIndex = PAUSE_DURATIONS.indexOf(settings.pauseDurationSec);
    const nextIndex = (currentIndex + 1) % PAUSE_DURATIONS.length;
    updateSettings({ pauseDurationSec: PAUSE_DURATIONS[nextIndex] });
  };

  const handleChangePromptFrequency = async () => {
    await triggerSelectionFeedback();
    const currentIndex = PROMPT_OPTIONS.indexOf(settings.promptFrequency);
    const nextIndex = (currentIndex + 1) % PROMPT_OPTIONS.length;
    updateSettings({ promptFrequency: PROMPT_OPTIONS[nextIndex] });
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
      "This will permanently delete:\n\n• All your pause history & stats\n• All your settings & preferences\n• All protected apps\n\nThis action cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear SQLite database (all events/stats)
              await deleteAllEvents();
              console.log("[Settings] Cleared all events from database");

              // Clear native storage (selected apps)
              if (Platform.OS === "android" || Platform.OS === "ios") {
                try {
                  const { GentleWaitModule } = NativeModules;
                  if (GentleWaitModule?.setSelectedApps) {
                    await GentleWaitModule.setSelectedApps([]);
                    console.log("[Settings] Cleared native selected apps");
                  }
                } catch (error) {
                  console.error(
                    "[Settings] Failed to clear native apps:",
                    error
                  );
                }
              }

              // Clear MMKV storage (all settings)
              mmkvStorage.clearAll();
              console.log("[Settings] Cleared all MMKV storage");

              // Reload settings (will load defaults since storage is cleared)
              loadSettings();

              // Navigate to onboarding
              router.replace("/onboarding");
            } catch (error) {
              console.error("[Settings] Error clearing all data:", error);
              Alert.alert(
                "Error",
                "Failed to clear all data. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    closeButton: {
      width: 40,
      height: 40,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 3,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.label.fontSize,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.xs,
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    settingItemActive: {
      backgroundColor: "rgba(0, 212, 255, 0.1)",
      borderColor: "rgba(0, 212, 255, 0.2)",
    },
    settingLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      flex: 1,
    },
    settingValue: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.primary,
    },
    settingArrow: {
      fontFamily: fonts.light,
      fontSize: 16,
      color: colors.textMuted,
      marginLeft: spacing.sm,
    },
    appList: {
      gap: spacing.sm,
    },
    appItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    appLabel: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      flex: 1,
    },
    removeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: "rgba(255, 107, 157, 0.2)",
      borderRadius: radius.button / 2,
      borderWidth: 1,
      borderColor: "rgba(255, 107, 157, 0.3)",
    },
    removeButtonText: {
      fontFamily: fonts.medium,
      fontSize: typography.small.fontSize,
      color: colors.accent,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      backgroundColor: "rgba(0, 212, 255, 0.15)",
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: "rgba(0, 212, 255, 0.3)",
      gap: spacing.sm,
    },
    addButtonText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.primary,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      paddingVertical: spacing.md,
      fontStyle: "italic",
    },
    dangerButton: {
      backgroundColor: "rgba(248, 113, 113, 0.1)",
      borderColor: "rgba(248, 113, 113, 0.2)",
    },
    dangerText: {
      color: colors.error,
    },
    versionText: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xl,
    },
  });

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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, headerAnimation]}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Protected Apps */}
        <Animated.View style={[styles.section, protectedAppsAnimation]}>
          <Text style={styles.sectionTitle}>Protected Apps</Text>
          {settings.selectedApps.length > 0 ? (
            <View style={styles.appList}>
              {settings.selectedApps.map((app) => (
                <View key={app.packageName} style={styles.appItem}>
                  <Text style={styles.appLabel}>{app.label}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveApp(app.packageName)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No apps protected yet. Add some apps to get started.
            </Text>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddApps}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ Add Apps</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Pause Duration */}
        <Animated.View style={[styles.section, pauseDurationAnimation]}>
          <Text style={styles.sectionTitle}>Pause Duration</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangePauseDuration}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Breathing pause length</Text>
            <Text style={styles.settingValue}>
              {settings.pauseDurationSec}s
            </Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Prompt Frequency */}
        <Animated.View style={[styles.section, promptsAnimation]}>
          <Text style={styles.sectionTitle}>Reflection Prompts</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangePromptFrequency}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Show reflection questions</Text>
            <Text style={styles.settingValue}>
              {getPromptLabel(settings.promptFrequency)}
            </Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Premium */}
        <Animated.View style={[styles.section, premiumAnimation]}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Current plan</Text>
            <Text style={styles.settingValue}>
              {settings.premium ? "✨ Premium" : "Free"}
            </Text>
          </View>
          {!settings.premium && (
            <TouchableOpacity
              style={[styles.settingItem, styles.settingItemActive]}
              onPress={() => {
                Alert.alert(
                  "Premium",
                  "Premium features coming soon! Stay tuned."
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.settingLabel, { color: colors.primary }]}>
                ✨ Upgrade to Premium
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Privacy & Data */}
        <Animated.View style={[styles.section, privacyAnimation]}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                "Privacy Promise",
                "Your data never leaves your device. We don't collect, store, or share any personal information. All your mindfulness data stays completely private on your phone."
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Privacy policy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerButton]}
            onPress={handleResetOnboarding}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Reset onboarding & preferences
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingItem,
              styles.dangerButton,
              { borderColor: colors.error, borderWidth: 2 },
            ]}
            onPress={handleClearAllData}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              🗑️ Clear All Data & Start Fresh
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.versionText}>GentleWait v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
