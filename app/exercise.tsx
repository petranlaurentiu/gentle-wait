/**
 * Exercise screen - Physical exercise alternatives during pause breaks
 */
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import { insertEvent } from '@/src/services/storage/sqlite';
import { ImagePlaceholder } from '@/src/components/ImagePlaceholder';
import { getRandomExercise } from '@/src/data/exercises';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function ExerciseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const sessionId = (params.sessionId as string) || '';
  const appPackage = (params.appPackage as string) || '';
  const appLabel = (params.appLabel as string) || 'App';

  const [exercise, setExercise] = useState(() => getRandomExercise());
  const [timeLeft, setTimeLeft] = useState(exercise.durationSec);
  const [startTime] = useState(Date.now());
  const [isRunning, setIsRunning] = useState(true);

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const handleComplete = async () => {
    await insertEvent({
      id: generateId(),
      ts: Date.now(),
      appPackage,
      appLabel,
      action: 'alternative_exercise',
      durationMs: Date.now() - startTime,
      sessionId,
    });
    router.back();
  };

  const handleGetNewExercise = () => {
    const newExercise = getRandomExercise();
    setExercise(newExercise);
    setTimeLeft(newExercise.durationSec);
    setIsRunning(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.lg,
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    category: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.text,
      opacity: 0.7,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    imagePlaceholder: {
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    instructions: {
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    instructionsTitle: {
      fontSize: typography.prompt.fontSize,
      fontWeight: typography.prompt.fontWeight,
      color: colors.text,
      marginBottom: spacing.md,
    },
    instructionsText: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.text,
      lineHeight: 22,
    },
    timerContainer: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    timerLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
      opacity: 0.8,
      marginBottom: spacing.sm,
    },
    timer: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.bg,
    },
    details: {
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.text,
      opacity: 0.7,
      marginBottom: spacing.sm,
    },
    detailValue: {
      fontSize: typography.prompt.fontSize,
      fontWeight: typography.prompt.fontWeight,
      color: colors.text,
    },
    buttonContainer: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
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

  const categoryLabels: Record<string, string> = {
    'desk-stretch': 'Desk Stretch',
    standing: 'Standing Exercise',
    energy: 'Energy Booster',
    'eye-posture': 'Eye & Posture',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.category}>{categoryLabels[exercise.category]}</Text>
      </View>

      <View style={styles.imagePlaceholder}>
        <ImagePlaceholder
          width={250}
          height={200}
          label={exercise.imagePlaceholder}
        />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions</Text>
        <Text style={styles.instructionsText}>{exercise.instructions}</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Time Remaining</Text>
        <Text style={styles.timer}>{timeLeft}s</Text>
      </View>

      {exercise.reps && (
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{exercise.durationSec}s</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reps</Text>
            <Text style={styles.detailValue}>{exercise.reps}</Text>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleComplete}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Keep Going...' : 'Done'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGetNewExercise}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Try Another Exercise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
