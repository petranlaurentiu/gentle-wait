/**
 * Debug Menu Component
 *
 * Development-only menu for testing and generating test data.
 * Only appears in __DEV__ mode.
 *
 * Usage in any screen:
 * ```tsx
 * import { DebugMenu } from '@/src/components/DebugMenu';
 *
 * <DebugMenu />
 * ```
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import {
  generateTestEvents,
  generateDailyEvents,
  printDataSummary,
} from '@/src/utils/testDataGenerator';
import { deleteAllEvents, getRecentEvents } from '@/src/services/storage/sqlite';

export function DebugMenu() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  if (!__DEV__) {
    return null; // Only show in development
  }

  const handleGenerateData = async () => {
    setLoading(true);
    setStatus('Generating test data...');
    try {
      const events = await generateTestEvents(30, 7);
      printDataSummary(events);
      setStatus(`✓ Generated 30 events`);
    } catch (error) {
      setStatus(`✗ Error: ${error}`);
    }
    setLoading(false);
  };

  const handleGenerateDailyData = async () => {
    setLoading(true);
    setStatus('Generating daily data...');
    try {
      await generateDailyEvents(7, 3);
      const events = await getRecentEvents(7);
      printDataSummary(events);
      setStatus(`✓ Generated 21 daily events`);
    } catch (error) {
      setStatus(`✗ Error: ${error}`);
    }
    setLoading(false);
  };

  const handleClearData = async () => {
    setLoading(true);
    setStatus('Clearing all events...');
    try {
      await deleteAllEvents();
      setStatus('✓ Cleared all events');
    } catch (error) {
      setStatus(`✗ Error: ${error}`);
    }
    setLoading(false);
  };

  const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      bottom: spacing.lg,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    fabText: {
      fontSize: 24,
      color: colors.bg,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: 12,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.bg,
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
    disabledButton: {
      opacity: 0.5,
    },
    status: {
      fontSize: typography.secondary.fontSize,
      color: colors.text,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.border,
      borderRadius: 8,
      minHeight: 40,
      justifyContent: 'center',
    },
    closeButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.border,
      borderRadius: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.text,
    },
  });

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setVisible(true)}
        accessible={true}
        accessibilityLabel="Debug menu"
      >
        <Text style={styles.fabText}>🐛</Text>
      </TouchableOpacity>

      {/* Debug Menu Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Debug Menu</Text>

            {status && <Text style={styles.status}>{status}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleGenerateData}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Generating...' : '📊 Generate 30 Events'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleGenerateDailyData}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Generating...' : '📈 Generate Daily Data (7 days)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton, loading && styles.disabledButton]}
              onPress={handleClearData}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Clearing...' : '🗑️  Clear All Events'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
