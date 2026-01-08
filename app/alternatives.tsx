/**
 * Alternatives screen - Breathe, reflect, or grounding
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography, animation } from '@/src/theme/theme';
import { insertEvent } from '@/src/services/storage/sqlite';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type AlternativeType = 'breathe' | 'reflect' | 'grounding';

export default function AlternativesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const type = (params.type as AlternativeType) || 'breathe';
  const sessionId = (params.sessionId as string) || '';
  const appPackage = (params.appPackage as string) || '';
  const appLabel = (params.appLabel as string) || 'App';

  const [breathingScale] = useState(new Animated.Value(1));
  const [timeLeft, setTimeLeft] = useState(20);
  const [startTime] = useState(Date.now());

  // Handle different alternative types
  useEffect(() => {
    if (type === 'breathe') {
      // Breathing animation loop
      const timing = Animated.loop(
        Animated.sequence([
          Animated.timing(breathingScale, {
            toValue: 1.3,
            duration: animation.breathePhase,
            useNativeDriver: true,
          }),
          Animated.timing(breathingScale, {
            toValue: 1,
            duration: animation.breathePhase,
            useNativeDriver: true,
          }),
        ])
      );

      timing.start();

      // 20 second timer
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-complete after 20s
      const completeTimer = setTimeout(async () => {
        timing.stop();
        await insertEvent({
          id: generateId(),
          ts: Date.now(),
          appPackage,
          appLabel,
          action: 'alternative_breathe',
          durationMs: Date.now() - startTime,
          sessionId,
        });
        router.back();
      }, 20000);

      return () => {
        timing.stop();
        clearInterval(timer);
        clearTimeout(completeTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

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
      fontSize: typography.prompt.fontSize,
      fontWeight: typography.prompt.fontWeight,
      color: colors.bg,
    },
    timer: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: typography.prompt.fontSize,
      fontWeight: typography.prompt.fontWeight,
      color: colors.text,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    buttonText: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.bg,
    },
    secondaryButton: {
      backgroundColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      {type === 'breathe' && (
        <>
          <Text style={styles.timer}>{timeLeft}s</Text>
          <Animated.View
            style={[
              styles.breathingCircle,
              { transform: [{ scale: breathingScale }] },
            ]}
          >
            <Text style={styles.breathingText}>Breathe</Text>
          </Animated.View>
          <Text style={styles.label}>Follow the circle breathing pattern</Text>
        </>
      )}

      {type === 'reflect' && (
        <>
          <Text style={styles.label}>
            What do you actually need right now?
          </Text>
          <View style={{ gap: spacing.md, width: '100%' }}>
            {['Rest', 'Move', 'Connect', 'Nothing'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {type === 'grounding' && (
        <>
          <Text style={styles.label}>
            Relax your shoulders, jaw, and hands
          </Text>
          <Text style={styles.timer}>{timeLeft}s</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.back()}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Back
        </Text>
      </TouchableOpacity>
    </View>
  );
}
