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
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import "react-native-reanimated";

import { BackgroundWrapper } from "@/src/components/BackgroundWrapper";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  addBillingCustomerInfoListener,
  getBillingDebugSnapshot,
  getBillingPackages,
  getCustomerInfo,
  hasPremiumAccess,
  initializeBilling,
} from "@/src/services/billing";
import {
  clearIOSFamilyControlsSelection,
  configureIOSProtection,
  getPendingInterception,
  isIOSFamilyControlsAvailable,
  isServiceEnabled,
  markAppHandled,
} from "@/src/services/native";
import { useAppStore } from "@/src/services/storage";
import { initializeDatabase } from "@/src/services/storage/sqlite";
import { ThemeProvider } from "@/src/theme/ThemeProvider";

// Show notification banners even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const loadSettings = useAppStore((state) => state.loadSettings);
  const settings = useAppStore((state) => state.settings);
  const setBillingAvailable = useAppStore((state) => state.setBillingAvailable);
  const setBillingPackages = useAppStore((state) => state.setBillingPackages);
  const setCurrentInterceptionEvent = useAppStore(
    (state) => state.setCurrentInterceptionEvent
  );
  const updateSettings = useAppStore((state) => state.updateSettings);
  const setNotificationsDenied = useAppStore((state) => state.setNotificationsDenied);
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

  // Handle notification taps from shield "Step back" action (iOS)
  const notificationResponseRef = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener>>(undefined);
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    // Check notification permission status (actual request happens in onboarding)
    Notifications.getPermissionsAsync().then((result) => {
      setNotificationsDenied(!result.granted);
    }).catch(() => {});

    notificationResponseRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        if (data?.source === "shield" && data?.action === "pause") {
          const familyActivitySelectionId =
            typeof data.familyActivitySelectionId === "string"
              && data.familyActivitySelectionId !== "familyActivitySelectionId"
              ? data.familyActivitySelectionId
              : "";
          const appLabel =
            typeof data.appLabel === "string" && data.appLabel !== "applicationName"
              ? data.appLabel
              : typeof data.webDomain === "string" && data.webDomain !== "webDomain"
                ? data.webDomain
                : "Protected app";

          // Clear pending UserDefaults data to prevent double navigation
          // from the AppState "active" handler
          markAppHandled(familyActivitySelectionId || "ios.familycontrols");

          router.push({
            pathname: "/pause",
            params: {
              appPackage: familyActivitySelectionId || "ios.familycontrols",
              appLabel,
              familyActivitySelectionId,
              source: "shield",
            },
          });
        }
      });

    return () => {
      notificationResponseRef.current?.remove();
    };
  }, [router]);

  // Handle pending interception (Android: accessibility service, iOS: shield UserDefaults)
  useEffect(() => {
    let isProcessing = false;

    const checkPendingInterception = async () => {
      try {
        // Prevent concurrent processing
        if (isProcessing) {
          if (__DEV__) console.log("[DeepLink] Already processing interception, skipping");
          return;
        }

        const pending = await getPendingInterception();
        if (pending && pending.appPackage) {
          if (__DEV__) console.log(
            "[DeepLink] Pending interception found:",
            pending.appPackage
          );
          
          // Set processing flag to prevent duplicates
          isProcessing = true;
          
          // Clear the pending interception IMMEDIATELY to prevent loops
          await markAppHandled(pending.appPackage);
          if (__DEV__) console.log("[DeepLink] Cleared pending interception:", pending.appPackage);
          
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
              familyActivitySelectionId: Platform.OS === "ios" ? pending.appPackage : undefined,
              source: Platform.OS === "ios" ? "shield" : undefined,
            },
          });
          
          // Reset processing flag after navigation
          setTimeout(() => {
            isProcessing = false;
          }, 1000);
        }
      } catch (error) {
        if (__DEV__) console.log("[DeepLink] Error checking pending interception:", error);
        isProcessing = false;
      }
    };

    // Check on app foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPendingInterception();
        // Re-check notification permission (user may have enabled in Settings)
        if (Platform.OS === "ios") {
          Notifications.getPermissionsAsync().then((result) => {
            setNotificationsDenied(!result.granted);
          }).catch(() => {});
        }
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
    const syncIOSProtection = async () => {
      if (!isIOSFamilyControlsAvailable()) {
        return;
      }

      const authorized = await isServiceEnabled();

      if (!authorized) {
        return;
      }

      if (settings.iosFamilyActivitySelection?.familyActivitySelection) {
        await configureIOSProtection(
          settings.iosFamilyActivitySelection,
          settings.cooldownMinutes || 15,
        );
      } else {
        await clearIOSFamilyControlsSelection();
      }
    };

    syncIOSProtection().catch((error) => {
      console.warn("[FamilyControls] Failed to sync iOS protection:", error);
    });
  }, [settings.cooldownMinutes, settings.iosFamilyActivitySelection]);

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

        if (__DEV__) {
          const snapshot = await getBillingDebugSnapshot();
          console.log("[Billing] Bootstrap snapshot:", snapshot);
        }

        setBillingPackages(packages);
        updateSettings({ premium: hasPremiumAccess(customerInfo) });

        unsubscribe = await addBillingCustomerInfoListener((info) => {
          if (__DEV__) {
            console.log("[Billing] Customer info update:", {
              activeEntitlementIds: Object.keys(info?.entitlements?.active ?? {}),
              activeSubscriptions: info?.activeSubscriptions ?? [],
            });
          }
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
                  animation: "fade",
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
                name="journal"
                options={{
                  headerShown: false,
                  animation: "fade_from_bottom",
                }}
              />
              <Stack.Screen
                name="exercise"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                  animation: "fade",
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
