/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 * Note: Uses hardcoded colors since it wraps ThemeProvider
 */
import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { spacing, typography, fonts } from "@/src/theme/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Error caught:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback error={this.state.error} onReset={this.resetError} />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  // Use hardcoded colors since ErrorBoundary wraps ThemeProvider
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0F1724",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    content: {
      width: "100%",
      alignItems: "center",
    },
    icon: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: "#F2A6A0",
      marginBottom: spacing.md,
      textAlign: "center",
    },
    message: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: "#FFFFFF", // colors.text
      marginBottom: spacing.lg,
      textAlign: "center",
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: "rgba(218, 228, 248, 0.12)",
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.lg,
      width: "100%",
      maxHeight: 120,
    },
    errorText: {
      fontSize: 12,
      color: "#FFFFFF", // colors.text
      fontFamily: "Courier New",
    },
    button: {
      backgroundColor: "#8FD6FF",
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minWidth: 120,
    },
    buttonText: {
      fontFamily: fonts.medium,
      color: "#0F1724",
      fontSize: typography.button.fontSize,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="warning-outline" size={64} color="#F2A6A0" style={{ marginBottom: spacing.lg }} />
        <Text style={styles.title}>Something Went Wrong</Text>
        <Text style={styles.message}>
          An unexpected error occurred. Try refreshing or restarting the app.
        </Text>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} numberOfLines={4}>
              {error.message}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.button} onPress={onReset}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
