/**
 * Entry point - Routes to onboarding or home
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAppStore } from '@/src/services/storage';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function EntryPoint() {
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);
  const { colors } = useTheme();

  useEffect(() => {
    // Simple check: if user has added apps and completed onboarding, go to home
    const hasCompletedOnboarding = settings.selectedApps.length > 0;

    if (hasCompletedOnboarding) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }, [settings.selectedApps.length, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
