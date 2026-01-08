import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { NativeModules, AppState } from 'react-native';

import { ThemeProvider } from '@/src/theme/ThemeProvider';
import { useAppStore } from '@/src/services/storage';
import { initializeDatabase } from '@/src/services/storage/sqlite';

const { GentleWaitModule } = NativeModules;

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const loadSettings = useAppStore((state) => state.loadSettings);
  const setCurrentInterceptionEvent = useAppStore((state) => state.setCurrentInterceptionEvent);
  const router = useRouter();

  // Handle pending interception from accessibility service
  useEffect(() => {
    const checkPendingInterception = async () => {
      try {
        if (!GentleWaitModule?.getPendingInterception) {
          console.log('[DeepLink] GentleWaitModule not available, skipping interception check');
          return;
        }

        const pending = await GentleWaitModule.getPendingInterception();
        if (pending && pending.appPackage) {
          console.log('[DeepLink] Pending interception found:', pending.appPackage);
          setCurrentInterceptionEvent({
            appPackage: pending.appPackage,
            appLabel: pending.appLabel || pending.appPackage,
            timestamp: pending.timestamp,
          });
          // Navigate to pause screen with the intercepted app info
          router.push({
            pathname: '/pause',
            params: {
              appPackage: pending.appPackage,
              appLabel: pending.appLabel || pending.appPackage,
            },
          });
        }
      } catch (error) {
        console.log('[DeepLink] Error checking pending interception:', error);
      }
    };

    // Check on app foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
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

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            animationEnabled: true,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
            animationEnabled: true,
          }}
        />
        <Stack.Screen
          name="pause"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            animationEnabled: true,
          }}
        />
        <Stack.Screen
          name="insights"
          options={{
            headerShown: false,
            animationEnabled: true,
          }}
        />
        <Stack.Screen
          name="alternatives"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
