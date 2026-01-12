/**
 * Empty State Component - Liquid Glass Design
 * Displayed when there's no data to show
 */
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, radius } from "@/src/theme/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    icon: {
      fontSize: 56,
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: "200",
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: "center",
      letterSpacing: 0.5,
    },
    description: {
      fontSize: typography.secondary.fontSize + 1,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: "center",
      lineHeight: 22,
    },
    buttonContainer: {
      width: "100%",
      maxWidth: 200,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <View style={styles.buttonContainer}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      )}
    </View>
  );
}
