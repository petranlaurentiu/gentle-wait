import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { deleteJournalEntry, getRecentJournalEntries, JournalEntry } from "@/src/services/storage/sqlite";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JournalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const highlightId = typeof params.highlightId === "string" ? params.highlightId : "";
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const recentEntries = await getRecentJournalEntries(50);
      setEntries(recentEntries);
    } catch (error) {
      console.error("[Journal] Failed to load entries:", error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await deleteJournalEntry(entryToDelete.id);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
    } catch (error) {
      console.error("[Journal] Failed to delete entry:", error);
    } finally {
      setEntryToDelete(null);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    content: {
      paddingBottom: spacing.xxl,
    },
    header: {
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    eyebrow: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 1.8,
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    loadingText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
    },
    emptyCard: {
      marginTop: spacing.md,
      alignItems: "center",
    },
    emptyTitle: {
      fontFamily: fonts.light,
      fontSize: typography.sectionTitle.fontSize,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: spacing.lg,
    },
    entryCard: {
      marginBottom: spacing.md,
    },
    entryDate: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 1.1,
    },
    entryPrompt: {
      fontFamily: fonts.light,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: spacing.sm,
      fontStyle: "italic",
    },
    entryContent: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      lineHeight: 24,
    },
    highlightBadge: {
      alignSelf: "flex-start",
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pills,
      backgroundColor: "rgba(126, 230, 198, 0.14)",
    },
    highlightBadgeText: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.secondary,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    deleteButton: {
      alignSelf: "flex-end",
      marginTop: spacing.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    deleteButtonText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      width: "100%",
      maxWidth: 340,
      borderRadius: radius.card,
      padding: spacing.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.12)",
      gap: spacing.md,
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    modalTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.sectionTitle.fontSize,
      color: colors.text,
      textAlign: "center",
    },
    modalText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
    },
    modalActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.button,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      alignItems: "center",
    },
    modalCancelText: {
      fontFamily: fonts.medium,
      fontSize: typography.body.fontSize,
      color: colors.textSecondary,
    },
    modalDeleteButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.button,
      backgroundColor: "rgba(242, 166, 160, 0.15)",
      alignItems: "center",
    },
    modalDeleteText: {
      fontFamily: fonts.semiBold,
      fontSize: typography.body.fontSize,
      color: colors.error,
    },
    footer: {
      marginTop: spacing.sm,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading your journal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Journal</Text>
          <Text style={styles.title}>Your reflections</Text>
          <Text style={styles.subtitle}>
            Everything here stays on this device. Newest entries appear first.
          </Text>
        </View>

        {entries.length === 0 ? (
          <GlassCard glowColor="secondary" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No reflections saved yet</Text>
            <Text style={styles.emptyText}>
              Write after a pause and your entries will show up here.
            </Text>
            <Button
              label="Start Journaling"
              onPress={() => router.push({ pathname: "/alternatives", params: { type: "reflect" } })}
              variant="primary"
            />
          </GlassCard>
        ) : (
          entries.map((entry) => (
            <GlassCard
              key={entry.id}
              style={styles.entryCard}
              glowColor={entry.id === highlightId ? "secondary" : "none"}
            >
              {entry.id === highlightId && (
                <View style={styles.highlightBadge}>
                  <Text style={styles.highlightBadgeText}>Just saved</Text>
                </View>
              )}
              <Text style={styles.entryDate}>
                {new Date(entry.ts).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              {entry.prompt ? (
                <Text style={styles.entryPrompt}>&ldquo;{entry.prompt}&rdquo;</Text>
              ) : null}
              <Text style={styles.entryContent}>{entry.content}</Text>
              <Pressable
                onPress={() => setEntryToDelete(entry)}
                style={styles.deleteButton}
                hitSlop={8}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </GlassCard>
          ))
        )}

        <View style={styles.footer}>
          <Button label="Back" onPress={() => router.back()} variant="ghost" />
        </View>
      </ScrollView>

      <Modal
        visible={entryToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEntryToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Reflection</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this entry? This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEntryToDelete(null)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={styles.modalDeleteButton}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
