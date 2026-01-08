/**
 * Pause screen - Interception UI shown when user tries to open a protected app
 * Redesigned with calm & minimalist aesthetic
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography, animation, radius } from '@/src/theme/theme';
import { insertEvent } from '@/src/services/storage/sqlite';
import { useLoopAnimation } from '@/src/utils/animations';
import { triggerSelectionFeedback, triggerSuccessNotification } from '@/src/utils/haptics';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type PausePhase = 'breathing' | 'question';

export default function PauseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [phase, setPhase] = useState<PausePhase>('breathing');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [timer, setTimer] = useState(8);
  const sessionId = generateId();

  const appPackage = params.appPackage as string;
  const appLabel = (params.appLabel as string) || 'App';

  // Animation hooks
  const breathingAnimation = useLoopAnimation(1, 1.25, animation.breathingCycle);
  const phaseOpacity = useSharedValue(1);
  const phaseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phaseOpacity.value,
  }));

  // Button press animations
  const primaryButtonScale = useSharedValue(1);
  const primaryButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryButtonScale.value }],
  }));

  const secondaryButtonScales = {
    breathe: useSharedValue(1),
    exercise: useSharedValue(1),
    close: useSharedValue(1),
  };

  const secondaryButtonAnimStyles = {
    breathe: useAnimatedStyle(() => ({
      transform: [{ scale: secondaryButtonScales.breathe.value }],
    })),
    exercise: useAnimatedStyle(() => ({
      transform: [{ scale: secondaryButtonScales.exercise.value }],
    })),
    close: useAnimatedStyle(() => ({
      transform: [{ scale: secondaryButtonScales.close.value }],
    })),
  };

  // Breathing phase - auto-advance to question after one cycle
  useEffect(() => {
    if (phase !== 'breathing') return;

    const timer = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    const advanceTimer = setTimeout(() => {
      // Fade out breathing phase
      phaseOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });

      // Switch phase after fade
      setTimeout(() => {
        setPhase('question');
        phaseOpacity.value = 1;
      }, 300);
    }, animation.breathingCycle);

    return () => {
      clearInterval(timer);
      clearTimeout(advanceTimer);
    };
  }, [phase, phaseOpacity]);

  const handleReasonSelect = async (reason: string) => {
    await triggerSelectionFeedback();
    setSelectedReason(reason);
  };

  const handleButtonPress = (
    scaleRef: Animated.Shared<number>,
    callback: () => void
  ) => {
    scaleRef.value = withTiming(0.95, { duration: 100 });
    setTimeout(() => {
      scaleRef.value = withTiming(1, { duration: 100 });
      callback();
    }, 100);
  };

  const handleOpenAnyway = async () => {
    handleButtonPress(primaryButtonScale, async () => {
      await triggerSuccessNotification();
      await insertEvent({
        id: generateId(),
        ts: Date.now(),
        appPackage,
        appLabel,
        action: 'opened_anyway',
        reason: (selectedReason as any) || undefined,
        sessionId,
      });
      router.back();
    });
  };

  const handleClose = async () => {
    handleButtonPress(secondaryButtonScales.close, async () => {
      await triggerSuccessNotification();
      await insertEvent({
        id: generateId(),
        ts: Date.now(),
        appPackage,
        appLabel,
        action: 'closed',
        reason: (selectedReason as any) || undefined,
        sessionId,
      });
      router.back();
    });
  };

  const handleAlternative = (type: 'breathe' | 'reflect' | 'grounding' | 'exercise') => {
    const scaleRef =
      type === 'breathe'
        ? secondaryButtonScales.breathe
        : secondaryButtonScales.exercise;

    handleButtonPress(scaleRef, () => {
      if (type === 'exercise') {
        router.push({
          pathname: '/exercise',
          params: {
            sessionId,
            appPackage,
            appLabel,
          },
        });
      } else {
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
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    breathingPhaseContainer: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    breathingCircle: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    breathingText: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    timerText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.md,
    },
    breathingMessage: {
      fontSize: typography.secondary.fontSize,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    questionContainer: {
      width: '100%',
      alignItems: 'center',
    },
    questionTitle: {
      fontSize: typography.title.fontSize + 2,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing.xl,
      width: '100%',
    },
    chip: {
      width: '30%',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.button,
      backgroundColor: colors.primaryLight,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 60,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryDark,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryDark,
      textAlign: 'center',
    },
    chipSelectedText: {
      color: '#FFFFFF',
    },
    actionContainer: {
      width: '100%',
      gap: spacing.md,
    },
    primaryButtonWrapper: {
      width: '100%',
    },
    button: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    secondaryButton: {
      backgroundColor: colors.secondaryLight,
      borderWidth: 1,
      borderColor: colors.secondary,
    },
    buttonText: {
      fontSize: typography.button.fontSize,
      fontWeight: '600',
      color: colors.text,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    secondaryButtonText: {
      color: colors.primaryDark,
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
        <Animated.View style={[phaseAnimatedStyle, styles.breathingPhaseContainer]}>
          <Text style={styles.timerText}>{timer}s</Text>
          <Animated.View style={[styles.breathingCircle, breathingAnimation]}>
            <Text style={styles.breathingText}>Breathe</Text>
          </Animated.View>
          <Text style={styles.breathingMessage}>
            Take one mindful breath
          </Text>
        </Animated.View>
      )}

      {phase === 'question' && (
        <Animated.View
          style={[phaseAnimatedStyle, styles.questionContainer]}
        >
          <Text style={styles.questionTitle}>What are you looking for?</Text>
          <View style={styles.chipGrid}>
            {reasonChoices.map((choice) => (
              <TouchableOpacity
                key={choice.value}
                style={[
                  styles.chip,
                  selectedReason === choice.value && styles.chipSelected,
                ]}
                onPress={() => handleReasonSelect(choice.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedReason === choice.value &&
                      styles.chipSelectedText,
                  ]}
                >
                  {choice.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      <View style={styles.actionContainer}>
        <Animated.View
          style={[styles.primaryButtonWrapper, primaryButtonAnimStyle]}
        >
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleOpenAnyway}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Open {appLabel} anyway
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimStyles.breathe}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleAlternative('breathe')}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Take a short pause
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimStyles.exercise}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleAlternative('exercise')}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Quick movement break
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={secondaryButtonAnimStyles.close}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Close
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
