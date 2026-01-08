/**
 * Settings screen
 */
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/src/services/storage';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const settings = useAppStore((state) => state.settings);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      color: colors.text,
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.text,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      opacity: 0.8,
    },
    settingLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.bg,
    },
    settingValue: {
      fontSize: typography.secondary.fontSize,
      fontWeight: '600',
      color: colors.bg,
    },
    appList: {
      gap: spacing.sm,
    },
    appItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.border,
      borderRadius: 12,
    },
    appLabel: {
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.text,
    },
    removeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    removeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.bg,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Protected Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protected Apps</Text>
          <View style={styles.appList}>
            {settings.selectedApps.map((app) => (
              <View key={app.packageName} style={styles.appItem}>
                <Text style={styles.appLabel}>{app.label}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    // Remove app logic
                  }}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Open add app screen
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.bg }]}>
              + Add app
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pause Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pause Duration</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>One breath</Text>
            <Text style={styles.settingValue}>
              {settings.pauseDurationSec}s
            </Text>
          </View>
        </View>

        {/* Prompt Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reflection Prompts</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Show prompts</Text>
            <Text style={styles.settingValue}>
              {settings.promptFrequency === 'always'
                ? 'Always'
                : settings.promptFrequency === 'sometimes'
                ? 'Sometimes'
                : 'Off'}
            </Text>
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingValue}>
              {themeMode === 'system'
                ? 'System'
                : themeMode === 'light'
                ? 'Light'
                : 'Dark'}
            </Text>
          </View>
        </View>

        {/* Premium */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Plan</Text>
            <Text style={styles.settingValue}>
              {settings.premium ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>

        {/* Privacy & Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Permissions</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // Open permissions screen
            }}
          >
            <Text style={styles.settingLabel}>Manage permissions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // Open privacy policy
            }}
          >
            <Text style={styles.settingLabel}>Privacy policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
