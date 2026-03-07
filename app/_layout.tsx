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
import { ActivityIndicator, AppState, View } from "react-native";
import "react-native-reanimated";

import { BackgroundWrapper } from "@/src/components/BackgroundWrapper";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  addBillingCustomerInfoListener,
  getBillingPackages,
  getCustomerInfo,
  hasPremiumAccess,
  initializeBilling,
} from "@/src/services/billing";
import {
  getPendingInterception,
  markAppHandled,
} from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import { initializeDatabase } from "@/src/services/storage/sqlite";
import { ThemeProvider } from "@/src/theme/ThemeProvider";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const loadSettings = useAppStore((state) => state.loadSettings);
  const setBillingAvailable = useAppStore((state) => state.setBillingAvailable);
  const setBillingPackages = useAppStore((state) => state.setBillingPackages);
  const setCurrentInterceptionEvent = useAppStore(
    (state) => state.setCurrentInterceptionEvent
  );
  const updateSettings = useAppStore((state) => state.updateSettings);
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

        const pending = await getPendingInterception();
        if (pending && pending.appPackage) {
          console.log(
            "[DeepLink] Pending interception found:",
            pending.appPackage
          );
          
          // Set processing flag to prevent duplicates
          isProcessing = true;
          
          // Clear the pending interception IMMEDIATELY to prevent loops
          await markAppHandled(pending.appPackage);
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

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const bootstrapBilling = async () => {
      try {
        const result = await initializeBilling();
        setBillingAvailable(result.available && result.configured);

        if (!result.available || !result.configured) {
          setBillingPackages([]);
          return;
        }

        const [customerInfo, packages] = await Promise.all([
          getCustomerInfo(),
          getBillingPackages(),
        ]);

        setBillingPackages(packages);
        updateSettings({ premium: hasPremiumAccess(customerInfo) });

        unsubscribe = await addBillingCustomerInfoListener((info) => {
          updateSettings({ premium: hasPremiumAccess(info) });
        });
      } catch (error) {
        console.warn("[Billing] Failed to bootstrap RevenueCat:", error);
        setBillingAvailable(false);
        setBillingPackages([]);
      }
    };

    bootstrapBilling();

    return () => {
      unsubscribe?.();
    };
  }, [setBillingAvailable, setBillingPackages, updateSettings]);

  // Show loading until fonts are ready
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F1724",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#8FD6FF" />
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
                name="paywall"
                options={{
                  headerShown: false,
                  presentation: "modal",
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
