/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 */
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';

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
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.resetError} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    content: {
      width: '100%',
      alignItems: 'center',
    },
    icon: {
      fontSize: 64,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.error,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    message: {
      fontSize: typography.secondary.fontSize,
      color: colors.text,
      marginBottom: spacing.lg,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.lg,
      width: '100%',
      maxHeight: 120,
    },
    errorText: {
      fontSize: 12,
      color: colors.text,
      fontFamily: 'Courier New',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minWidth: 120,
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
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
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
