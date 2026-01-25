/**
 * Entry point - Routes to onboarding or home
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, NativeModules, Platform } from "react-native";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";

const { GentleWaitModule } = NativeModules;

export default function EntryPoint() {
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const setCurrentInterceptionEvent = useAppStore(
    (state) => state.setCurrentInterceptionEvent
  );
  const { colors } = useTheme();

  useEffect(() => {
    // Check for pending interception first (from accessibility service or DeviceActivity)
    const checkAndNavigate = async () => {
      // Check for pending interception on both iOS and Android
      if ((Platform.OS === "android" || Platform.OS === "ios") && GentleWaitModule?.getPendingInterception) {
        try {
          const pending = await GentleWaitModule.getPendingInterception();
          if (pending && pending.appPackage) {
            console.log(
              "[EntryPoint] Pending interception found:",
              pending.appPackage
            );
            setCurrentInterceptionEvent({
              id: `pending-${Date.now()}`,
              ts: pending.ts || Date.now(),
              appPackage: pending.appPackage,
              appLabel: pending.appLabel || pending.appPackage,
              action: "opened_anyway",
            });
            // Navigate directly to pause screen
            router.replace({
              pathname: "/pause",
              params: {
                appPackage: pending.appPackage,
                appLabel: pending.appLabel || pending.appPackage,
              },
            });
            return; // Don't navigate to home/onboarding
          }
        } catch (error) {
          console.log("[EntryPoint] Error checking pending interception:", error);
        }
      }

      // No pending interception - normal navigation
      const hasCompletedOnboarding = settings.selectedApps.length > 0;

      if (hasCompletedOnboarding) {
        router.replace("/home");
      } else {
        router.replace("/onboarding");
      }
    };

    // Defer navigation until Stack has mounted
    const timer = setTimeout(checkAndNavigate, 100);

    return () => clearTimeout(timer);
  }, [settings.selectedApps.length, router, setCurrentInterceptionEvent]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
