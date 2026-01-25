import {
  Outfit_100Thin,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, AppState, NativeModules, View } from "react-native";
import "react-native-reanimated";

import { BackgroundWrapper } from "@/src/components/BackgroundWrapper";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { useAppStore } from "@/src/services/storage";
import { initializeDatabase } from "@/src/services/storage/sqlite";
import { ThemeProvider } from "@/src/theme/ThemeProvider";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const { GentleWaitModule } = NativeModules;

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const loadSettings = useAppStore((state) => state.loadSettings);
  const setCurrentInterceptionEvent = useAppStore(
    (state) => state.setCurrentInterceptionEvent
  );
  const router = useRouter();

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    "Outfit-Thin": Outfit_100Thin,
    "Outfit-ExtraLight": Outfit_200ExtraLight,
    "Outfit-Light": Outfit_300Light,
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
  });

  // Hide splash screen when fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Handle pending interception from accessibility service
  useEffect(() => {
    let isProcessing = false;

    const checkPendingInterception = async () => {
      try {
        // Prevent concurrent processing
        if (isProcessing) {
          console.log("[DeepLink] Already processing interception, skipping");
          return;
        }

        if (!GentleWaitModule?.getPendingInterception || !GentleWaitModule?.markAppHandled) {
          console.log(
            "[DeepLink] GentleWaitModule not available, skipping interception check"
          );
          return;
        }

        const pending = await GentleWaitModule.getPendingInterception();
        if (pending && pending.appPackage) {
          console.log(
            "[DeepLink] Pending interception found:",
            pending.appPackage
          );
          
          // Set processing flag to prevent duplicates
          isProcessing = true;
          
          // Clear the pending interception IMMEDIATELY to prevent loops
          await GentleWaitModule.markAppHandled(pending.appPackage);
          console.log("[DeepLink] Cleared pending interception:", pending.appPackage);
          
          setCurrentInterceptionEvent({
            id: `pending-${Date.now()}`,
            ts: pending.ts || Date.now(),
            appPackage: pending.appPackage,
            appLabel: pending.appLabel || pending.appPackage,
            action: "opened_anyway",
          });
          
          // Navigate to pause screen with the intercepted app info
          router.push({
            pathname: "/pause",
            params: {
              appPackage: pending.appPackage,
              appLabel: pending.appLabel || pending.appPackage,
            },
          });
          
          // Reset processing flag after navigation
          setTimeout(() => {
            isProcessing = false;
          }, 1000);
        }
      } catch (error) {
        console.log("[DeepLink] Error checking pending interception:", error);
        isProcessing = false;
      }
    };

    // Check on app foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPendingInterception();
      }
    });

    // Initial check on mount
    checkPendingInterception();

    return () => {
      subscription.remove();
    };
  }, [setCurrentInterceptionEvent, router]);

  useEffect(() => {
    // Initialize database on app load
    initializeDatabase().catch(console.error);
    // Load settings from storage
    loadSettings();
  }, [loadSettings]);

  // Show loading until fonts are ready
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A0E1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#00D4FF" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BackgroundWrapper>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="home"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="pause"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="insights"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="alternatives"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="assistant"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="exercise"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </View>
        </BackgroundWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
