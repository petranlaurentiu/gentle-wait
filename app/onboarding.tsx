/**
 * Onboarding flow screen
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import { useAppStore } from '@/src/services/storage';
import { getInstalledApps, filterApps } from '@/src/services/apps';
import { Checkbox } from '@/src/components/Checkbox';
import { Button } from '@/src/components/Button';
import { SelectedApp } from '@/src/domain/models';

type OnboardingStep = 'welcome' | 'select-apps' | 'permissions' | 'duration' | 'done';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [availableApps, setAvailableApps] = useState<SelectedApp[]>([]);
  const [selectedAppSet, setSelectedAppSet] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [pauseDuration, setPauseDuration] = useState(15);
  const [permissionEnabled, setPermissionEnabled] = useState(false);
  const updateSettings = useAppStore((state) => state.updateSettings);

  // Load available apps on mount
  useEffect(() => {
    (async () => {
      try {
        const apps = await getInstalledApps();
        setAvailableApps(apps);
      } catch (error) {
        console.error('Failed to load apps:', error);
      }
    })();
  }, []);

  const handleAppToggle = (packageName: string) => {
    const newSet = new Set(selectedAppSet);
    if (newSet.has(packageName)) {
      newSet.delete(packageName);
    } else {
      newSet.add(packageName);
    }
    setSelectedAppSet(newSet);
  };

  const handleNext = async () => {
    const stepOrder: OnboardingStep[] = [
      'welcome',
      'select-apps',
      'permissions',
      'duration',
      'done',
    ];
    const currentIndex = stepOrder.indexOf(step);

    if (currentIndex === stepOrder.length - 1) {
      // Onboarding complete - save settings
      setIsLoading(true);
      const selectedApps = availableApps.filter((app) =>
        selectedAppSet.has(app.packageName)
      );
      updateSettings({
        selectedApps,
        pauseDurationSec: pauseDuration,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace('/home');
    } else {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: OnboardingStep[] = [
      'welcome',
      'select-apps',
      'permissions',
      'duration',
      'done',
    ];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const filteredApps = filterApps(availableApps, searchQuery);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    description: {
      fontSize: typography.prompt.fontSize,
      fontWeight: typography.prompt.fontWeight,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
      opacity: 0.8,
    },
    buttonContainer: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    searchInput: {
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
      color: colors.text,
      fontSize: typography.secondary.fontSize,
    },
    appList: {
      marginBottom: spacing.lg,
    },
    permissionContainer: {
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    permissionText: {
      fontSize: typography.secondary.fontSize,
      color: colors.text,
      lineHeight: 20,
    },
    durationContainer: {
      gap: spacing.lg,
    },
    durationOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.border,
      borderRadius: 12,
      marginBottom: spacing.sm,
    },
    durationLabel: {
      fontSize: typography.secondary.fontSize,
      color: colors.text,
    },
    durationValue: {
      fontSize: typography.prompt.fontSize,
      fontWeight: '600',
      color: colors.primary,
    },
    selectedCount: {
      fontSize: typography.secondary.fontSize,
      color: colors.text,
      opacity: 0.7,
      marginTop: spacing.md,
    },
  });

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentInsetAdjustmentBehavior="automatic">
        {step === 'welcome' && (
          <>
            <Text style={styles.title}>GentleWait</Text>
            <Text style={styles.description}>A gentle moment before distraction.</Text>
            <Text style={styles.description}>
              Pause before opening apps you want to be more mindful about.
            </Text>
          </>
        )}

        {step === 'select-apps' && (
          <>
            <Text style={styles.title}>Select Apps to Pause Before</Text>
            <Text style={styles.description}>
              Choose apps you want a gentle reminder with.
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search apps..."
              placeholderTextColor={colors.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.appList}>
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <Checkbox
                    key={app.packageName}
                    label={app.label}
                    checked={selectedAppSet.has(app.packageName)}
                    onPress={() => handleAppToggle(app.packageName)}
                  />
                ))
              ) : (
                <Text style={styles.description}>No apps found</Text>
              )}
            </View>

            <Text style={styles.selectedCount}>
              {selectedAppSet.size} app{selectedAppSet.size !== 1 ? 's' : ''} selected
            </Text>
          </>
        )}

        {step === 'permissions' && (
          <>
            <Text style={styles.title}>Enable Accessibility Permission</Text>
            <Text style={styles.description}>
              GentleWait uses Android Accessibility to detect when you open apps.
            </Text>

            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                ✓ Your data stays on your phone
              </Text>
              <Text style={styles.permissionText}>
                ✓ No app content is recorded
              </Text>
              <Text style={styles.permissionText}>
                ✓ You can disable anytime in Android Settings
              </Text>
            </View>

            <View style={styles.permissionContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.durationLabel}>Permission enabled</Text>
                <Switch
                  value={permissionEnabled}
                  onValueChange={setPermissionEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={permissionEnabled ? colors.secondary : colors.text}
                />
              </View>
            </View>
          </>
        )}

        {step === 'duration' && (
          <>
            <Text style={styles.title}>Pause Duration</Text>
            <Text style={styles.description}>
              How long should you pause for one breath?
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
                      style={[
                        styles.durationValue,
                        { color: colors.bg },
                      ]}
                    >
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 'done' && (
          <>
            <Text style={styles.title}>You&apos;re All Set</Text>
            <Text style={styles.description}>Your first pause is ready.</Text>
            <Text style={styles.description}>
              Open one of your selected apps to see it in action.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {step !== 'welcome' && <Button label="Back" onPress={handleBack} variant="secondary" />}
        <Button
          label={step === 'done' ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
        />
      </View>
    </View>
  );
}
