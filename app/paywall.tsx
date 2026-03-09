import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { Text as AppText } from "@/src/components/Typography";
import {
  BillingPackage,
  getBillingPackages,
  initializeBilling,
  presentBillingPaywall,
  restoreBillingPurchases,
} from "@/src/services/billing";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { radius, spacing } from "@/src/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getPackagePriority(pkg: BillingPackage) {
  const key =
    `${pkg.packageType} ${pkg.identifier} ${pkg.productIdentifier}`.toLowerCase();

  if (key.includes("annual") || key.includes("year")) return 0;
  if (key.includes("monthly") || key.includes("month")) return 1;
  if (key.includes("lifetime")) return 2;
  return 3;
}

function getPackageKind(pkg: BillingPackage) {
  const key =
    `${pkg.packageType} ${pkg.identifier} ${pkg.productIdentifier}`.toLowerCase();

  if (key.includes("annual") || key.includes("year")) return "annual";
  if (key.includes("monthly") || key.includes("month")) return "monthly";
  if (key.includes("lifetime")) return "lifetime";
  return "other";
}

function getPackageDisplayTitle(pkg: BillingPackage) {
  switch (getPackageKind(pkg)) {
    case "annual":
      return "Annual";
    case "monthly":
      return "Monthly";
    case "lifetime":
      return "Lifetime";
    default:
      return pkg.title;
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const setBillingPackages = useAppStore((state) => state.setBillingPackages);

  const [packages, setPackages] = useState<BillingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadBilling = async () => {
      try {
        const init = await initializeBilling();
        if (!active) return;

        if (!init.available || !init.configured) {
          setPackages([]);
          return;
        }

        const nextPackages = await getBillingPackages();
        if (!active) return;

        const sortedPackages = [...nextPackages].sort(
          (a, b) => getPackagePriority(a) - getPackagePriority(b),
        );
        setPackages(sortedPackages);
        setBillingPackages(sortedPackages);
      } catch (error) {
        console.error("[Paywall] Failed to load RevenueCat offerings:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadBilling();

    return () => {
      active = false;
    };
  }, [setBillingPackages]);

  const handleOpenPaywall = async () => {
    setIsProcessing(true);
    const result = await presentBillingPaywall();
    setIsProcessing(false);

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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl * 2,
      gap: spacing.lg,
    },
    heroCard: {
      gap: spacing.md,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    packageList: {
      gap: spacing.md,
    },
    packageCard: {
      borderRadius: radius.glass,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.glassFill,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    packageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pills,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      backgroundColor: colors.surfaceElevated,
      marginBottom: spacing.xs,
    },
    benefitRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start",
    },
    footer: {
      gap: spacing.md,
    },
    finePrint: {
      textAlign: "center",
    },
    loadingWrap: {
      paddingVertical: spacing.xxl,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    successOverlay: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(5, 10, 20, 0.44)",
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
    },
    successIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
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
          <GlassCard glowColor="primary" style={styles.successCard}>
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
        <View>
          <AppText variant="eyebrow" color="secondary">
            Premium
          </AppText>
          <AppText variant="screenTitle">GentleWait Pro</AppText>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.82}
        >
          <Ionicons name="close" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <GlassCard glowColor="primary">
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons
                name="sparkles-outline"
                size={30}
                color={colors.primary}
              />
            </View>
            <AppText variant="title" align="center">
              Unlock GentleWait Pro
            </AppText>
            <AppText variant="bodyLarge" color="secondary" align="center">
              Choose the plan that fits your rhythm. Purchases, renewals, and
              restores stay managed by the App Store or Google Play.
            </AppText>
          </View>
        </GlassCard>

        <GlassCard intensity="light">
          <View style={styles.packageList}>
            <View style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.secondary}
              />
              <AppText variant="body" color="secondary">
                Unlimited protected apps
              </AppText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.secondary}
              />
              <AppText variant="body" color="secondary">
                AI Companion and guided reflection
              </AppText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.secondary}
              />
              <AppText variant="body" color="secondary">
                Future premium insights and advanced personalization
              </AppText>
            </View>
          </View>
        </GlassCard>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="body" color="secondary">
              Loading RevenueCat offering…
            </AppText>
          </View>
        ) : packages.length > 0 ? (
          <View style={styles.packageList}>
            {packages.map((pkg) => (
              <View key={pkg.identifier} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <View style={{ flex: 1 }}>
                    {getPackageKind(pkg) === "annual" && (
                      <View style={styles.badge}>
                        <AppText variant="eyebrow" color="primary">
                          Recommended
                        </AppText>
                      </View>
                    )}
                    <AppText variant="heading">
                      {getPackageDisplayTitle(pkg)}
                    </AppText>
                    <AppText variant="body" color="secondary">
                      {pkg.description}
                    </AppText>
                  </View>
                  <AppText variant="heading" color="primary">
                    {pkg.priceString}
                  </AppText>
                </View>
                {pkg.introOffer && (
                  <AppText variant="caption" color="secondary">
                    Intro offer: {pkg.introOffer}
                  </AppText>
                )}
              </View>
            ))}
          </View>
        ) : (
          <GlassCard intensity="light">
            <View style={styles.loadingWrap}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={colors.accent}
              />
              <AppText variant="body" color="secondary" align="center">
                No current offering is available yet. Finish configuring your
                RevenueCat offering and dashboard paywall first.
              </AppText>
            </View>
          </GlassCard>
        )}

        <View style={styles.footer}>
          <Button
            label={settings.premium ? "View plans" : "See plans"}
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
            Subscriptions renew automatically unless cancelled in your App Store
            or Google Play account settings.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
