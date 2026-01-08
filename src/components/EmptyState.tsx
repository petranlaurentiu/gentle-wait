/**
 * Empty State Component
 * Displayed when there's no data to show
 */
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    icon: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    description: {
      fontSize: typography.secondary.fontSize,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
      opacity: 0.7,
      lineHeight: 20,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    buttonText: {
      color: colors.bg,
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
