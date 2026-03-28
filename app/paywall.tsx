import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { Text as AppText } from "@/src/components/Typography";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/src/constants/legal";
import {
  BillingPackage,
  getBillingPackages,
  presentBillingPaywall,
  restoreBillingPurchases,
} from "@/src/services/billing";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing } from "@/src/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BENEFITS = [
  { icon: "shield-checkmark-outline" as const, text: "More protected apps" },
  { icon: "sparkles-outline" as const, text: "Lumi & daily smart nudges" },
  {
    icon: "trophy-outline" as const,
    text: "Streaks, badges & advanced analytics",
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [packages, setPackages] = useState<BillingPackage[]>([]);

  useEffect(() => {
    let isMounted = true;

    void getBillingPackages()
      .then((nextPackages) => {
        if (isMounted) {
          setPackages(nextPackages);
        }
      })
      .catch((error) => {
        console.warn("[Billing] Failed to load packages:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
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
    packageCard: {
      gap: spacing.sm,
    },
    packageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
      alignItems: "center",
    },
    packageMeta: {
      flex: 1,
      gap: 2,
    },
    legalCard: {
      gap: spacing.sm,
    },
    legalLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    benefitRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center",
    },
    ctaSection: {
      gap: spacing.md,
      paddingBottom: spacing.md,
    },
    finePrint: {
      textAlign: "center",
    },
    scrollView: {
      flex: 1,
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
          <GlassCard
            intensity="strong"
            glowColor="primary"
            style={styles.successCard}
          >
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {packages.length > 0 && (
          <GlassCard intensity="light" style={styles.packageCard}>
            <AppText variant="heading">Subscriptions</AppText>
            {packages.map((pkg) => (
              <View key={pkg.productIdentifier} style={styles.packageRow}>
                <View style={styles.packageMeta}>
                  <AppText variant="body">{pkg.title}</AppText>
                  <AppText variant="caption" color="secondary">
                    {pkg.description}
                  </AppText>
                </View>
                <AppText variant="body">{pkg.priceString}</AppText>
              </View>
            ))}
          </GlassCard>
        )}

        <GlassCard intensity="light" style={styles.legalCard}>
          <AppText variant="caption" color="secondary" align="center">
            Payment will be charged to your Apple ID account at confirmation of
            purchase. Subscriptions renew automatically unless canceled at least
            24 hours before the end of the current period. You can manage and
            cancel subscriptions in your App Store account settings.
          </AppText>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            activeOpacity={0.82}
          >
            <AppText variant="body">Privacy Policy</AppText>
            <Ionicons name="open-outline" size={18} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
            activeOpacity={0.82}
          >
            <AppText variant="body">Terms of Use</AppText>
            <Ionicons name="open-outline" size={18} color={colors.secondary} />
          </TouchableOpacity>
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
      </ScrollView>
    </SafeAreaView>
  );
}
