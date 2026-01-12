/**
 * Loading State Component - Liquid Glass Design
 * Displayed while data is being loaded
 */
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/theme";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    content: {
      alignItems: "center",
      gap: spacing.lg,
    },
    message: {
      fontSize: typography.secondary.fontSize + 1,
      color: colors.textSecondary,
      textAlign: "center",
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

/**
 * Minimal loading indicator (for inline loading)
 */
export function InlineLoadingState() {
  const { colors } = useTheme();

  return (
    <View style={{ padding: spacing.md, alignItems: "center" }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}
