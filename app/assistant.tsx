/**
 * AI Assistant Screen
 * Powered by OpenRouter - Your mindful companion
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { useAppStore } from "@/src/services/storage";
import { getTodayStats, getWeeklyStats } from "@/src/services/stats";
import {
  sendMessage,
  setUserContext,
  ChatMessage,
  UserContext,
} from "@/src/services/ai/openrouter";
import {
  getRandomAffirmation,
  getRandomJournalingPrompt,
} from "@/src/data/mindfulness";

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

export default function AssistantScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const settings = useAppStore((state) => state.settings);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load user context and set welcome message on mount
  useEffect(() => {
    async function loadContext() {
      try {
        // Get stats
        const todayStats = await getTodayStats();
        const weeklyStats = await getWeeklyStats();

        // Build user context
        const context: UserContext = {
          userName: settings.userName,
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
            weeklyStats.alternativeBreathed +
            weeklyStats.alternativeReflected +
            weeklyStats.alternativeGrounded +
            weeklyStats.closedCount,
        };

        // Set context for AI
        setUserContext(context);

        // Personalized welcome message
        const userName = settings.userName;
        const welcomeMessage: Message = {
          id: "welcome",
          role: "assistant",
          content: userName
            ? `Hello${
                userName ? `, ${userName}` : ""
              }! 👋 I'm your mindful companion. I know your goals and progress—ask me anything about building healthier digital habits, or try one of the prompts below.`
            : `Hello! 👋 I'm your mindful companion. I'm here to help you build a healthier relationship with technology.\n\nYou can ask me anything about digital wellbeing, or try one of the suggested prompts below.`,
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error("Failed to load user context:", error);
        // Fallback welcome
        const welcomeMessage: Message = {
          id: "welcome",
          role: "assistant",
          content: `Hello! 👋 I'm your mindful companion. I'm here to help you build a healthier relationship with technology.\n\nYou can ask me anything about digital wellbeing, or try one of the suggested prompts below.`,
        };
        setMessages([welcomeMessage]);
      }
    }

    loadContext();
  }, [settings]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

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

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.success
        ? response.message
        : response.error || "I'm having trouble connecting. Please try again.",
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleQuickAction = (action: "affirmation" | "journal") => {
    if (action === "affirmation") {
      const affirmation = getRandomAffirmation();
      const message: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `✨ Here's an affirmation for you:\n\n"${affirmation}"\n\nTake a moment to let this sink in. You're doing great.`,
      };
      setMessages((prev) => [...prev, message]);
    } else {
      const prompt = getRandomJournalingPrompt();
      const message: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `📝 Journaling prompt:\n\n"${prompt}"\n\nTake a few minutes to reflect on this. There's no right or wrong answer.`,
      };
      setMessages((prev) => [...prev, message]);
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleClearChat = () => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: `Hello! 👋 I'm your mindful companion. I'm here to help you build a healthier relationship with technology.\n\nYou can ask me anything about digital wellbeing, or try one of the suggested prompts below.`,
    };
    setMessages([welcomeMessage]);
  };

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
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
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
      {messages.length <= 1 && (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleQuickAction("affirmation")}
          >
            <Text style={styles.quickActionText}>✨ Get Affirmation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleQuickAction("journal")}
          >
            <Text style={styles.quickActionText}>📝 Journal Prompt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suggested prompts */}
      {messages.length <= 1 && (
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
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textMuted}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
