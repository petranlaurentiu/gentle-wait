/**
 * Entry point - Routes to onboarding or home.
 * Interception handling is done exclusively in _layout.tsx to avoid race conditions.
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";

export default function EntryPoint() {
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const { colors } = useTheme();

  useEffect(() => {
    const navigate = () => {
      const hasCompletedOnboarding = settings.selectedApps.length > 0;
      if (hasCompletedOnboarding) {
        router.replace("/home");
      } else {
        router.replace("/onboarding");
      }
    };

    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [settings.selectedApps.length, router]);

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
