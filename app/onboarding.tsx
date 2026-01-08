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
import Animated from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import { useAppStore } from '@/src/services/storage';
import { getInstalledApps, filterApps } from '@/src/services/apps';
import { Checkbox } from '@/src/components/Checkbox';
import { Button } from '@/src/components/Button';
import { SelectedApp } from '@/src/domain/models';
import { useFadeInAnimation } from '@/src/utils/animations';

type OnboardingStep = 'welcome' | 'name' | 'goals' | 'barriers' | 'emotional' | 'screen-time' | 'select-apps' | 'permissions' | 'duration' | 'done';

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
  const [stepKey, setStepKey] = useState(0);

  // New onboarding state for expanded questionnaire
  const [userName, setUserName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [selectedBarriers, setSelectedBarriers] = useState<Set<string>>(new Set());
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set());
  const [dailyScreenTime, setDailyScreenTime] = useState(3); // hours

  // Animation hook for step transitions
  const stepAnimation = useFadeInAnimation();

  // Reset animation key when step changes to trigger new animation
  useEffect(() => {
    setStepKey((prev) => prev + 1);
  }, [step]);

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
      'name',
      'goals',
      'barriers',
      'emotional',
      'screen-time',
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
        userName,
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
      'name',
      'goals',
      'barriers',
      'emotional',
      'screen-time',
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
      padding: spacing.lg,
    },
    contentContainer: {
      flexGrow: 1,
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
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} contentInsetAdjustmentBehavior="automatic">
        <Animated.View key={stepKey} style={stepAnimation}>
          {step === 'welcome' && (
            <>
              <Text style={styles.title}>GentleWait</Text>
              <Text style={styles.description}>A gentle moment before distraction.</Text>
              <Text style={styles.description}>
                Pause before opening apps you want to be more mindful about.
              </Text>
            </>
          )}

          {step === 'name' && (
            <>
              <Text style={styles.title}>What&apos;s your name?</Text>
              <Text style={styles.description}>
                Let&apos;s get to know you a bit better.
              </Text>

              <TextInput
                style={[styles.searchInput, { marginVertical: spacing.lg, fontSize: 18, paddingVertical: spacing.lg }]}
                placeholder="Enter your name..."
                placeholderTextColor={colors.text}
                value={userName}
                onChangeText={setUserName}
                autoFocus
              />

              <Text style={styles.description}>
                We&apos;ll use this to personalize your experience.
              </Text>
            </>
          )}

          {step === 'goals' && (
            <>
              <Text style={styles.title}>What are your goals?</Text>
              <Text style={styles.description}>
                Choose up to 3 goals you want to achieve with GentleWait.
              </Text>

              <View style={styles.appList}>
                {['Reduce screen time', 'Better focus', 'Improve sleep', 'More quality time', 'Boost productivity', 'Build healthy habits'].map((goal) => (
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
                {selectedGoals.size} goal{selectedGoals.size !== 1 ? 's' : ''} selected
              </Text>
            </>
          )}

          {step === 'barriers' && (
            <>
              <Text style={styles.title}>What makes it hard?</Text>
              <Text style={styles.description}>
                What usually makes it difficult to avoid these apps? Choose up to 2.
              </Text>

              <View style={styles.appList}>
                {['FOMO (missing out)', 'Addictive design', 'Stress/boredom', 'Habit/automatic', 'Social pressure', 'Too easy to reach'].map((barrier) => (
                  <Checkbox
                    key={barrier}
                    label={barrier}
                    checked={selectedBarriers.has(barrier)}
                    onPress={() => {
                      const newSet = new Set(selectedBarriers);
                      if (newSet.has(barrier)) {
                        newSet.delete(barrier);
                      } else if (newSet.size < 2) {
                        newSet.add(barrier);
                      }
                      setSelectedBarriers(newSet);
                    }}
                  />
                ))}
              </View>

              <Text style={styles.selectedCount}>
                {selectedBarriers.size} barrier{selectedBarriers.size !== 1 ? 's' : ''} selected
              </Text>
            </>
          )}

          {step === 'emotional' && (
            <>
              <Text style={styles.title}>How do they make you feel?</Text>
              <Text style={styles.description}>
                How do these apps typically make you feel? Choose up to 2.
              </Text>

              <View style={styles.appList}>
                {['Guilty', 'Anxious', 'Drained', 'Not present', 'Irritable', 'Regretful'].map((emotion) => (
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
                {selectedEmotions.size} emotion{selectedEmotions.size !== 1 ? 's' : ''} selected
              </Text>
            </>
          )}

          {step === 'screen-time' && (
            <>
              <Text style={styles.title}>Daily screen time?</Text>
              <Text style={styles.description}>
                How much time do you spend on your phone daily?
              </Text>

              <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
                <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg }}>
                  {dailyScreenTime}h
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: spacing.lg }}
                >
                  <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.durationOption,
                          dailyScreenTime === hour && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => setDailyScreenTime(hour)}
                      >
                        <Text
                          style={[
                            styles.durationLabel,
                            dailyScreenTime === hour && { color: colors.bg },
                          ]}
                        >
                          {hour}h
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={styles.description}>
                  You can adjust this in settings anytime.
                </Text>
              </View>
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
        </Animated.View>
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
