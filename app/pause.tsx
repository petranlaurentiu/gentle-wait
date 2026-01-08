/**
 * Pause screen - Interception UI shown when user tries to open a protected app
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography, animation } from '@/src/theme/theme';
import { insertEvent } from '@/src/services/storage/sqlite';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type PausePhase = 'breathing' | 'question';

export default function PauseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [phase, setPhase] = useState<PausePhase>('breathing');
  const [breathingScale] = useState(new Animated.Value(1));
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const sessionId = generateId();

  const appPackage = params.appPackage as string;
  const appLabel = (params.appLabel as string) || 'App';

  // Breathing animation
  useEffect(() => {
    if (phase !== 'breathing') return;

    const timing = Animated.loop(
      Animated.sequence([
        // Inhale (4s)
        Animated.timing(breathingScale, {
          toValue: 1.3,
          duration: animation.breathePhase,
          useNativeDriver: true,
        }),
        // Exhale (4s)
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: animation.breathePhase,
          useNativeDriver: true,
        }),
      ])
    );

    timing.start();

    // Auto-advance after one cycle (8s)
    const timer = setTimeout(() => {
      setPhase('question');
    }, animation.breathingCycle);

    return () => {
      timing.stop();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleReasonSelect = async (reason: string) => {
    setSelectedReason(reason);
    // Don't auto-navigate; user must choose next action
  };

  const handleOpenAnyway = async () => {
    await insertEvent({
      id: generateId(),
      ts: Date.now(),
      appPackage,
      appLabel,
      action: 'opened_anyway',
      reason: selectedReason as any || undefined,
      sessionId,
    });
    // In real implementation, this would launch the actual app
    router.back();
  };

  const handleClose = async () => {
    await insertEvent({
      id: generateId(),
      ts: Date.now(),
      appPackage,
      appLabel,
      action: 'closed',
      reason: selectedReason as any || undefined,
      sessionId,
    });
    router.back();
  };

  const handleAlternative = async (type: 'breathe' | 'reflect' | 'grounding') => {
    // Log the choice and navigate to alternatives
    router.push({
      pathname: '/alternatives',
      params: {
        type,
        sessionId,
        appPackage,
        appLabel,
        reason: selectedReason || undefined,
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    breathingCircle: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    breathingText: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
      opacity: 0.8,
    },
    promptContainer: {
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    promptTitle: {
      fontSize: typography.prompt.fontSize,
      fontWeight: typography.prompt.fontWeight,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
      backgroundColor: colors.secondary,
      alignItems: 'center',
    },
    chipText: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.bg,
    },
    actionContainer: {
      width: '100%',
      gap: spacing.md,
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.border,
    },
    buttonText: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.text,
    },
    primaryButtonText: {
      color: colors.bg,
    },
  });

  const reasonChoices = [
    { label: 'Relax', value: 'relax' },
    { label: 'Connect', value: 'connect' },
    { label: 'Distraction', value: 'distraction' },
    { label: 'Info', value: 'info' },
    { label: 'Habit', value: 'habit' },
    { label: "I'm not sure", value: 'unsure' },
  ];

  return (
    <View style={styles.container}>
      {phase === 'breathing' && (
        <>
          <Animated.View
            style={[
              styles.breathingCircle,
              { transform: [{ scale: breathingScale }] },
            ]}
          >
            <Text style={styles.breathingText}>Breathe</Text>
          </Animated.View>
          <Text style={[styles.promptTitle, { opacity: 0.8 }]}>
            Before you scroll, take one breath.
          </Text>
        </>
      )}

      {phase === 'question' && (
        <>
          <View style={styles.promptContainer}>
            <Text style={styles.promptTitle}>What are you looking for?</Text>
            <View style={styles.chipContainer}>
              {reasonChoices.map((choice) => (
                <TouchableOpacity
                  key={choice.value}
                  style={[
                    styles.chip,
                    selectedReason === choice.value && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleReasonSelect(choice.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedReason === choice.value && { color: colors.bg },
                    ]}
                  >
                    {choice.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleOpenAnyway}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            Open {appLabel} anyway
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handleAlternative('breathe')}
        >
          <Text style={styles.buttonText}>Take a short pause</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleClose}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const radius = {
  pills: 999,
};
