/**
 * AI Assistant Screen
 * Powered by OpenRouter - Your mindful companion
 */
import { Button } from "@/src/components/Button";
import {
  getRandomAffirmation,
  getRandomJournalingPrompt,
} from "@/src/data/mindfulness";
import { PRICING } from "@/src/constants/monetization";
import {
  type AiQuotaSnapshot,
  getAiQuotaSnapshot,
  recordAiRequestAttempt,
  recordAiResponseSuccess,
} from "@/src/services/ai/usage";
import {
  ChatMessage,
  getAiConfigurationError,
  sendMessage,
  setUserContext,
  UserContext,
} from "@/src/services/ai/openrouter";
import { MAX_USER_MESSAGE_CHARS } from "@/src/services/ai/shared";
import { getTodayStats, getWeeklyStats } from "@/src/services/stats";
import { useAppStore } from "@/src/services/storage";
import { getRecentJournalEntries } from "@/src/services/storage/sqlite";
import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "@/src/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "I'm feeling anxious about my screen time",
  "Help me understand why I reach for my phone",
  "I need motivation to stay off social media",
  "What's a quick mindfulness exercise?",
  "How can I break my scrolling habit?",
];

function buildWelcomeMessage(userName?: string): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: userName
      ? `Hello, ${userName}! I'm your mindful companion. I know your goals and progress. Ask me anything about building healthier digital habits, or try one of the prompts below.`
      : "Hello! I'm your mindful companion. I'm here to help you build a healthier relationship with technology.\n\nYou can ask me anything about digital wellbeing, or try one of the suggested prompts below.",
  };
}

export default function AssistantScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const settings = useAppStore((state) => state.settings);
  const aiConfigurationError = settings.premium
    ? getAiConfigurationError()
    : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showClearPrompt, setShowClearPrompt] = useState(false);
  const [quotaSnapshot, setQuotaSnapshot] = useState<AiQuotaSnapshot>(() =>
    getAiQuotaSnapshot(),
  );

  // Load user context and set welcome message on mount
  useEffect(() => {
    if (!settings.premium || aiConfigurationError) {
      return;
    }

    async function loadContext() {
      try {
        // Get stats
        const todayStats = await getTodayStats();
        const weeklyStats = await getWeeklyStats();

        // Get recent journal entries
        const journalEntries = await getRecentJournalEntries(5);
        const recentJournalEntries = journalEntries.map((entry) => entry.content);

        // Build user context
        const context: UserContext = {
          userName: settings.userName,
          ageRange: settings.ageRange,
          goals: settings.goals,
          emotions: settings.emotions,
          dailyScreenTimeHours: settings.dailyScreenTimeHours,
          targetScreenTimeHours: settings.targetScreenTimeHours,
          selectedApps: settings.selectedApps.map((app) => app.label),
          pauseDurationSec: settings.pauseDurationSec,
          todayPauses: todayStats.pauses,
          weeklyPauses: weeklyStats.pausesTotal,
          weeklyMindfulMinutes: weeklyStats.totalMindfulMinutes,
          weeklyOpenedAnyway: weeklyStats.openedAnyway,
          weeklyChoseCalm:
            weeklyStats.closedCount +
            weeklyStats.alternativeBreathed +
            weeklyStats.alternativeReflected +
            weeklyStats.alternativeGrounded +
            weeklyStats.alternativeExercise +
            weeklyStats.alternativePrayed,
          recentJournalEntries:
            recentJournalEntries.length > 0 ? recentJournalEntries : undefined,
        };

        // Set context for AI
        setUserContext(context);
        setMessages([buildWelcomeMessage(settings.userName)]);
        setQuotaSnapshot(getAiQuotaSnapshot());
      } catch (error) {
        console.error("Failed to load user context:", error);
        setMessages([buildWelcomeMessage(settings.userName)]);
        setQuotaSnapshot(getAiQuotaSnapshot());
      }
    }

    loadContext();
  }, [aiConfigurationError, settings]);

  const handleSend = async (text?: string) => {
    const messageText = (text || inputText).trim().slice(0, MAX_USER_MESSAGE_CHARS);
    if (!messageText || isLoading) return;

    const currentQuota = getAiQuotaSnapshot();
    setQuotaSnapshot(currentQuota);
    if (!currentQuota.canSend) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setQuotaSnapshot(recordAiRequestAttempt());

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const response = await sendMessage(messageText, conversationHistory);
    const nextQuota = response.success
      ? recordAiResponseSuccess()
      : getAiQuotaSnapshot();

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.success
        ? response.message
        : response.error || "I'm having trouble connecting. Please try again.",
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    setQuotaSnapshot(nextQuota);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleQuickAction = (action: "affirmation" | "journal") => {
    if (action === "affirmation") {
      const affirmation = getRandomAffirmation();
      const message: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Here's an affirmation for you:\n\n"${affirmation}"\n\nTake a moment to let this sink in. You're doing great.`,
      };
      setMessages((prev) => [...prev, message]);
    } else {
      const prompt = getRandomJournalingPrompt();
      const message: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Journaling prompt:\n\n"${prompt}"\n\nTake a few minutes to reflect on this. There's no right or wrong answer.`,
      };
      setMessages((prev) => [...prev, message]);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleClearChat = () => {
    setShowClearPrompt(true);
  };

  const confirmClearChat = () => {
    setMessages([buildWelcomeMessage(settings.userName)]);
    setInputText("");
    setShowClearPrompt(false);
  };

  const showFallbackTools =
    messages.length <= 1 || quotaSnapshot.limitedReason === "daily_limit" || quotaSnapshot.limitedReason === "monthly_limit";
  const canSubmit = Boolean(inputText.trim()) && !isLoading && quotaSnapshot.canSend;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    backButton: {
      padding: spacing.sm,
    },
    backText: {
      fontFamily: fonts.regular,
      fontSize: typography.heading.fontSize,
      color: colors.text,
    },
    title: {
      fontFamily: fonts.light,
      fontSize: typography.title.fontSize,
      color: colors.text,
      letterSpacing: 0.5,
    },
    clearButton: {
      padding: spacing.sm,
    },
    clearText: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    messagesContent: {
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    messageBubble: {
      maxWidth: "85%",
      padding: spacing.md,
      borderRadius: radius.button,
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
    },
    assistantBubble: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    messageText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: 22,
    },
    userText: {
      color: "#FFFFFF",
    },
    assistantText: {
      color: colors.text,
    },
    suggestedPromptsContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    suggestedLabel: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    suggestedScrollContent: {
      gap: spacing.sm,
    },
    suggestedPrompt: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pills,
    },
    suggestedPromptText: {
      fontFamily: fonts.regular,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
    },
    quickActionsContainer: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    quickAction: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      padding: spacing.md,
      borderRadius: radius.button,
      alignItems: "center",
    },
    quickActionText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.text,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    textInput: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: radius.button,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.text,
      maxHeight: 120,
    },
    sendButton: {
      backgroundColor: colors.primary,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendText: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: "#FFFFFF",
    },
    loadingContainer: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
    },
    loadingText: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      color: colors.textMuted,
    },
    lockedWrap: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      justifyContent: "center",
      gap: spacing.lg,
    },
    lockedCard: {
      gap: spacing.lg,
    },
    lockedIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      alignSelf: "center",
    },
    lockedTextGroup: {
      gap: spacing.sm,
      alignItems: "center",
    },
    lockedTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.sectionTitle.fontSize,
      lineHeight: typography.sectionTitle.lineHeight,
      color: colors.text,
      textAlign: "center",
    },
    lockedDescription: {
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
      textAlign: "center",
    },
    lockedFeatureList: {
      gap: spacing.sm,
    },
    lockedFeatureRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start",
    },
    lockedFeatureText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.textSecondary,
    },
    lockedFooter: {
      fontFamily: fonts.medium,
      fontSize: typography.caption.fontSize,
      color: colors.primary,
      textAlign: "center",
    },
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      zIndex: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: radius.card,
      padding: spacing.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.12)",
      gap: spacing.md,
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    modalIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      alignSelf: "center",
    },
    modalTitle: {
      fontFamily: fonts.semiBold,
      fontSize: typography.sectionTitle.fontSize,
      lineHeight: typography.sectionTitle.lineHeight,
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
    },
    modalAction: {
      flex: 1,
    },
  });

  if (!settings.premium) {
    return (
	      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>AI Companion</Text>
          </View>
        </View>

        <View style={styles.lockedWrap}>
          <View style={[styles.messageBubble, styles.assistantBubble, styles.lockedCard]}>
            <View style={styles.lockedIconWrap}>
              <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
            </View>

            <View style={styles.lockedTextGroup}>
              <Text style={styles.lockedTitle}>Premium guided reflection</Text>
              <Text style={styles.lockedDescription}>
                The AI Companion is a premium feature so the core app can stay
                free while covering live model costs.
              </Text>
            </View>

            <View style={styles.lockedFeatureList}>
              <View style={styles.lockedFeatureRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.secondary} />
                <Text style={styles.lockedFeatureText}>
                  Personalized coaching based on your pauses, goals, and journal history.
                </Text>
              </View>
              <View style={styles.lockedFeatureRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.secondary} />
                <Text style={styles.lockedFeatureText}>
                  Unlimited protected apps and richer support when focus slips.
                </Text>
              </View>
            </View>

            <Text style={styles.lockedFooter}>
              Premium starts at {PRICING.monthly} or {PRICING.yearly}.
            </Text>
          </View>

          <Button
            label="View Premium"
            onPress={() => router.push("/paywall")}
            variant="primary"
          />
          <Button label="Back" onPress={() => router.back()} variant="ghost" />
        </View>
	      </SafeAreaView>
	    );
	  }

  if (aiConfigurationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>AI Companion</Text>
          </View>
        </View>

        <View style={styles.lockedWrap}>
          <View style={[styles.messageBubble, styles.assistantBubble, styles.lockedCard]}>
            <View style={styles.lockedIconWrap}>
              <Ionicons name="cloud-offline-outline" size={28} color={colors.primary} />
            </View>

            <View style={styles.lockedTextGroup}>
              <Text style={styles.lockedTitle}>AI setup incomplete</Text>
              <Text style={styles.lockedDescription}>
                {aiConfigurationError} Add a production API origin before shipping
                premium AI on Android.
              </Text>
            </View>

            <View style={styles.lockedFeatureList}>
              <View style={styles.lockedFeatureRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.secondary} />
                <Text style={styles.lockedFeatureText}>
                  The rest of GentleWait can still work without the AI backend.
                </Text>
              </View>
              <View style={styles.lockedFeatureRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.secondary} />
                <Text style={styles.lockedFeatureText}>
                  Set `EXPO_PUBLIC_API_ORIGIN` for native builds to enable this screen.
                </Text>
              </View>
            </View>
          </View>

          <Button label="Back" onPress={() => router.back()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>AI Companion</Text>
        </View>
        {messages.length > 1 && (
          <TouchableOpacity
            onPress={handleClearChat}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === "user"
                ? styles.userBubble
                : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === "user"
                  ? styles.userText
                  : styles.assistantText,
              ]}
            >
              {message.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick actions */}
      {showFallbackTools && (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleQuickAction("affirmation")}
          >
            <Text style={styles.quickActionText}>Get Affirmation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleQuickAction("journal")}
          >
            <Text style={styles.quickActionText}>Journal Prompt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suggested prompts */}
      {messages.length <= 1 && quotaSnapshot.canSend && (
        <View style={styles.suggestedPromptsContainer}>
          <Text style={styles.suggestedLabel}>Try asking:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedScrollContent}
          >
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedPrompt}
                onPress={() => handleSend(prompt)}
              >
                <Text style={styles.suggestedPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={(value) => setInputText(value.slice(0, MAX_USER_MESSAGE_CHARS))}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textMuted}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            maxLength={MAX_USER_MESSAGE_CHARS}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !canSubmit && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!canSubmit}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showClearPrompt && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={styles.modalTitle}>Clear conversation?</Text>
            <Text style={styles.modalText}>
              This removes the current chat and starts fresh, while keeping your
              personalized assistant.
            </Text>
            <View style={styles.modalActions}>
              <View style={styles.modalAction}>
                <Button
                  label="Cancel"
                  onPress={() => setShowClearPrompt(false)}
                  variant="ghost"
                />
              </View>
              <View style={styles.modalAction}>
                <Button
                  label="Clear"
                  onPress={confirmClearChat}
                  variant="primary"
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
