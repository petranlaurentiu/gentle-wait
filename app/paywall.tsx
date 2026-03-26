import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { Text as AppText } from "@/src/components/Typography";
import {
  presentBillingPaywall,
  restoreBillingPurchases,
} from "@/src/services/billing";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing } from "@/src/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BENEFITS = [
  { icon: "shield-checkmark-outline" as const, text: "More protected apps" },
  { icon: "sparkles-outline" as const, text: "AI Companion & daily smart nudges" },
  { icon: "trophy-outline" as const, text: "Streaks, badges & advanced analytics" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenPaywall = async () => {
    setIsProcessing(true);
    const result = await presentBillingPaywall();
    setIsProcessing(false);

    if (__DEV__) {
      console.log("[Billing] Paywall result:", JSON.stringify(result, null, 2));
    }

    if (!result.success) {
      if (result.cancelled) return;
      Alert.alert(
        "Paywall unavailable",
        result.error || "Please try again in a moment.",
      );
      return;
    }

    if (result.purchased || result.restored) {
      updateSettings({ premium: true });
      setSuccessMessage("Your GentleWait Pro access is active.");
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    const result = await restoreBillingPurchases();
    setIsProcessing(false);

    if (!result.success) {
      Alert.alert("Restore failed", result.error || "Please try again.");
      return;
    }

    if (!result.restored) {
      Alert.alert(
        "No purchases found",
        "We couldn't find an active GentleWait Pro subscription.",
      );
      return;
    }

    updateSettings({ premium: true });
    setSuccessMessage("Your GentleWait Pro access has been restored.");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    body: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    heroSection: {
      alignItems: "center",
      gap: spacing.md,
      paddingTop: spacing.lg,
    },
    heroIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    heroTextGroup: {
      gap: spacing.xs,
      alignItems: "center",
    },
    benefitsCard: {
      gap: spacing.sm,
    },
    benefitRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center",
    },
    ctaSection: {
      gap: spacing.md,
    },
    finePrint: {
      textAlign: "center",
    },
    successOverlay: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(4, 10, 20, 0.74)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      zIndex: 20,
      elevation: 8,
    },
    successCard: {
      width: "100%",
      maxWidth: 420,
      gap: spacing.lg,
      alignItems: "center",
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.3,
      shadowRadius: 28,
      elevation: 16,
    },
    successIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(143, 214, 255, 0.22)",
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    successTextGroup: {
      gap: spacing.sm,
      alignItems: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {successMessage && (
        <View style={styles.successOverlay}>
          <GlassCard intensity="strong" glowColor="primary" style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons
                name="checkmark-circle-outline"
                size={34}
                color={colors.primary}
              />
            </View>
            <View style={styles.successTextGroup}>
              <AppText variant="title" align="center">
                Premium unlocked
              </AppText>
              <AppText variant="bodyLarge" color="secondary" align="center">
                {successMessage}
              </AppText>
            </View>
            <Button
              label="Continue"
              onPress={() => {
                setSuccessMessage(null);
                router.back();
              }}
              variant="primary"
            />
          </GlassCard>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.82}
        >
          <Ionicons name="close" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons
              name="sparkles-outline"
              size={36}
              color={colors.primary}
            />
          </View>
          <View style={styles.heroTextGroup}>
            <AppText variant="screenTitle" align="center">
              Unlock GentleWait Pro
            </AppText>
            <AppText variant="body" color="secondary" align="center">
              Get the full experience with premium features
            </AppText>
          </View>
        </View>

        <GlassCard intensity="light" style={styles.benefitsCard}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <Ionicons name={b.icon} size={20} color={colors.primary} />
              <AppText variant="body">{b.text}</AppText>
            </View>
          ))}
        </GlassCard>

        <View style={styles.ctaSection}>
          <Button
            label={isProcessing ? "Opening..." : "See Plans & Subscribe"}
            onPress={handleOpenPaywall}
            disabled={isProcessing}
            variant="primary"
          />
          <Button
            label={isProcessing ? "Restoring..." : "Restore Purchases"}
            onPress={handleRestore}
            disabled={isProcessing}
            variant="secondary"
          />
          <AppText variant="caption" color="tertiary" style={styles.finePrint}>
            Subscriptions renew automatically unless cancelled in your store
            account settings.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}
