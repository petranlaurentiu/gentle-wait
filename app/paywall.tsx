import { Button } from "@/src/components/Button";
import { GlassCard } from "@/src/components/GlassCard";
import { LiquidGlassBackground } from "@/src/components/LiquidGlassBackground";
import { Text as AppText } from "@/src/components/Typography";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/src/constants/legal";
import {
  BillingPackage,
  getBillingPackages,
  presentBillingPaywall,
  purchaseBillingPackage,
  restoreBillingPurchases,
} from "@/src/services/billing";
import { useAppStore } from "@/src/services/storage";
import { useTheme } from "@/src/theme/ThemeProvider";
import { animation, radius, spacing } from "@/src/theme/theme";
import {
  useLoopAnimation,
  useStaggeredFadeIn,
} from "@/src/utils/animations";
import { triggerLightImpact } from "@/src/utils/haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type NeonTint = "primary" | "secondary" | "accent";

type BenefitDef = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tint: NeonTint;
};

const PRO_BENEFITS: BenefitDef[] = [
  {
    icon: "shield-checkmark",
    title: "Protect every app",
    subtitle:
      "Cover your full distraction stack, not just one high-risk app.",
    tint: "primary",
  },
  {
    icon: "analytics",
    title: "See the real patterns",
    subtitle:
      "App breakdowns and the times of day that cost you the most attention.",
    tint: "secondary",
  },
  {
    icon: "sparkles",
    title: "Guidance that fits you",
    subtitle:
      "Nudges tied to your real pause history, not generic advice.",
    tint: "accent",
  },
  {
    icon: "heart",
    title: "Priority support",
    subtitle:
      "Get a thoughtful reply when you reach out, usually same day.",
    tint: "primary",
  },
];

function getPackageValue(pkg: BillingPackage) {
  return `${pkg.packageType} ${pkg.identifier} ${pkg.productIdentifier} ${pkg.title}`.toLowerCase();
}

function getPackageKind(pkg: BillingPackage) {
  const value = getPackageValue(pkg);
  if (value.includes("annual") || value.includes("year")) return "yearly";
  if (value.includes("month")) return "monthly";
  return "other";
}

function formatIntroDuration(period: string) {
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/i.exec(
    period.trim(),
  );

  if (!match) return period;

  const units = [
    { value: Number(match[1] || 0), label: "year" },
    { value: Number(match[2] || 0), label: "month" },
    { value: Number(match[3] || 0), label: "week" },
    { value: Number(match[4] || 0), label: "day" },
  ].filter((item) => item.value > 0);

  if (units.length === 0) return period;

  return units
    .map(({ value, label }) => `${value} ${label}${value === 1 ? "" : "s"}`)
    .join(" ");
}

function formatIntroOfferText(introOffer?: string) {
  if (!introOffer) return null;

  const parts = introOffer.split(" for ");
  if (parts.length !== 2) return introOffer;

  const [price, period] = parts;
  const readablePeriod = formatIntroDuration(period);
  const normalizedPrice = price.replace(/\s/g, "");
  const isFree =
    normalizedPrice.startsWith("0") ||
    normalizedPrice.startsWith("0,00") ||
    normalizedPrice.startsWith("0.00");

  return isFree ? `Free for ${readablePeriod}` : `${price} for ${readablePeriod}`;
}

function parsePriceNumber(priceString: string): number | null {
  const match = /[\d]+[.,]?[\d]*/.exec(priceString);
  if (!match) return null;
  const value = Number(match[0].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function computeSavingsPercent(
  yearly: BillingPackage | null,
  monthly: BillingPackage | null,
): number | null {
  if (!yearly || !monthly) return null;
  const y = parsePriceNumber(yearly.priceString);
  const m = parsePriceNumber(monthly.priceString);
  if (y == null || m == null || m <= 0) return null;
  const fullYear = m * 12;
  if (fullYear <= y) return null;
  const savings = Math.round((1 - y / fullYear) * 100);
  return savings > 0 ? savings : null;
}

function formatPerMonthFromYearly(pkg: BillingPackage): string | null {
  const match = /([\d]+[.,]?[\d]*)/.exec(pkg.priceString);
  if (!match) return null;
  const value = Number(match[0].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  const perMonth = (value / 12).toFixed(2);
  const separator = match[0].includes(",") ? "," : ".";
  const formatted = perMonth.replace(".", separator);
  return pkg.priceString.replace(match[0], formatted);
}

type BenefitRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tint: NeonTint;
};

function BenefitRow({ icon, title, subtitle, tint }: BenefitRowProps) {
  const { colors } = useTheme();

  const tintColor =
    tint === "primary"
      ? colors.primary
      : tint === "secondary"
        ? colors.secondary
        : colors.accent;
  const tintFill =
    tint === "primary"
      ? colors.primaryLight
      : tint === "secondary"
        ? colors.secondaryLight
        : colors.accentLight;

  return (
    <View style={benefitStyles.row}>
      <View
        style={[
          benefitStyles.iconWrap,
          {
            backgroundColor: tintFill,
            borderColor: colors.glassStroke,
            shadowColor: tintColor,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={tintColor} />
      </View>
      <View style={benefitStyles.copy}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="caption" color="secondary">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const benefitStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

type PlanTileProps = {
  packageInfo: BillingPackage;
  kindLabel: string;
  isSelected: boolean;
  savingsPercent?: number | null;
  perPeriodLabel?: string | null;
  secondaryLine?: string | null;
  onPress: () => void;
  disabled?: boolean;
};

function PlanTile({
  packageInfo,
  kindLabel,
  isSelected,
  savingsPercent,
  perPeriodLabel,
  secondaryLine,
  onPress,
  disabled,
}: PlanTileProps) {
  const { colors } = useTheme();
  const formattedIntroOffer = formatIntroOfferText(packageInfo.introOffer);

  const ringProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    ringProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSelected, ringProgress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringProgress.value,
    transform: [
      {
        scale: interpolate(ringProgress.value, [0, 1], [0.98, 1]),
      },
    ],
  }));

  const handlePress = () => {
    void triggerLightImpact();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={disabled}
      style={planTileStyles.wrap}
    >
      <GlassCard
        intensity={isSelected ? "strong" : "light"}
        glowColor={isSelected ? "primary" : "none"}
        noPadding
        style={planTileStyles.card}
      >
        <View style={planTileStyles.inner}>
          <View style={planTileStyles.header}>
            <AppText variant="eyebrow" color={isSelected ? "primary" : "secondary"}>
              {kindLabel}
            </AppText>
            <View
              style={[
                planTileStyles.selectionDot,
                {
                  borderColor: isSelected ? colors.primary : colors.glassStroke,
                  backgroundColor: isSelected
                    ? colors.primary
                    : "transparent",
                },
              ]}
            >
              {isSelected ? (
                <Ionicons
                  name="checkmark"
                  size={12}
                  color={colors.textInverse}
                />
              ) : null}
            </View>
          </View>

          <View style={planTileStyles.priceBlock}>
            <AppText variant="title">{packageInfo.priceString}</AppText>
            {perPeriodLabel ? (
              <AppText variant="caption" color="tertiary">
                {perPeriodLabel}
              </AppText>
            ) : null}
          </View>

          <View style={planTileStyles.footer}>
            {formattedIntroOffer ? (
              <View style={planTileStyles.offerRow}>
                <Ionicons
                  name="gift-outline"
                  size={14}
                  color={colors.primary}
                />
                <AppText variant="caption" color="primary">
                  {formattedIntroOffer}
                </AppText>
              </View>
            ) : secondaryLine ? (
              <AppText variant="caption" color="secondary">
                {secondaryLine}
              </AppText>
            ) : (
              <View style={planTileStyles.offerSpacer} />
            )}
          </View>
        </View>
      </GlassCard>

      <Animated.View
        pointerEvents="none"
        style={[
          planTileStyles.ring,
          ringStyle,
          {
            borderColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      />

      {savingsPercent ? (
        <View
          style={[
            planTileStyles.savingsBadge,
            {
              backgroundColor: colors.accent,
              borderColor: "rgba(255, 201, 169, 0.8)",
              shadowColor: colors.accent,
            },
          ]}
        >
          <AppText
            variant="eyebrow"
            color="inverse"
            style={planTileStyles.savingsText}
          >
            {`Save ${savingsPercent}%`}
          </AppText>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const planTileStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    position: "relative",
  },
  card: {
    minHeight: 176,
  },
  inner: {
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: "space-between",
    flex: 1,
    minHeight: 176,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  priceBlock: {
    gap: 2,
  },
  footer: {
    minHeight: 18,
  },
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  offerSpacer: {
    height: 18,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.glass,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  savingsBadge: {
    position: "absolute",
    top: -10,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  savingsText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
});

type ExtraPlanRowProps = {
  packageInfo: BillingPackage;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function ExtraPlanRow({
  packageInfo,
  isSelected,
  onPress,
  disabled,
}: ExtraPlanRowProps) {
  const { colors } = useTheme();
  const handlePress = () => {
    void triggerLightImpact();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={disabled}
    >
      <GlassCard
        intensity={isSelected ? "strong" : "light"}
        glowColor={isSelected ? "primary" : "none"}
        noPadding
        style={{
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? colors.primary : "transparent",
        }}
      >
        <View style={extraRowStyles.inner}>
          <View style={extraRowStyles.copy}>
            <AppText variant="heading">{packageInfo.title}</AppText>
            <AppText variant="caption" color="secondary">
              {packageInfo.description || "Subscription option"}
            </AppText>
          </View>
          <View style={extraRowStyles.right}>
            <AppText variant="heading">{packageInfo.priceString}</AppText>
            <View
              style={[
                extraRowStyles.dot,
                {
                  borderColor: isSelected ? colors.primary : colors.glassStroke,
                  backgroundColor: isSelected
                    ? colors.primary
                    : "transparent",
                },
              ]}
            >
              {isSelected ? (
                <Ionicons
                  name="checkmark"
                  size={12}
                  color={colors.textInverse}
                />
              ) : null}
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const extraRowStyles = StyleSheet.create({
  inner: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

function BreathingHalo({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(0, { duration: 240 });
    }
  }, [active, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.2, 0.6]),
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [0.96, 1.05]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[haloStyles.wrap, haloStyle]}
    >
      <LinearGradient
        colors={[colors.primary, "rgba(143, 214, 255, 0)"]}
        style={haloStyles.halo}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
}

const haloStyles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: -18,
    left: -18,
    right: -18,
    bottom: -18,
  },
  halo: {
    flex: 1,
    borderRadius: radius.button + 14,
  },
});

type SuccessOverlayProps = {
  message: string;
  onContinue: () => void;
};

function SuccessOverlay({ message, onContinue }: SuccessOverlayProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const ringPulse = useLoopAnimation(1, 1.08, 2600);

  useEffect(() => {
    progress.value = withSpring(1, {
      damping: 16,
      stiffness: 160,
      mass: 0.8,
    });
  }, [progress]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [24, 0]) },
    ],
  }));

  return (
    <View
      style={[
        successStyles.overlay,
        { backgroundColor: colors.overlay },
      ]}
    >
      <Animated.View style={[successStyles.cardWrap, cardStyle]}>
        <GlassCard
          intensity="strong"
          glowColor="primary"
          style={successStyles.card}
        >
          <View style={successStyles.iconStack}>
            <Animated.View
              style={[
                successStyles.ringOuter,
                ringPulse,
                {
                  borderColor: "rgba(143, 214, 255, 0.35)",
                  shadowColor: colors.primary,
                },
              ]}
            />
            <View
              style={[
                successStyles.ringInner,
                {
                  backgroundColor: "rgba(143, 214, 255, 0.20)",
                  borderColor: colors.glassStroke,
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={34}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={successStyles.textGroup}>
            <AppText variant="title" align="center">
              Pro is live.
            </AppText>
            <AppText
              variant="bodyLarge"
              color="secondary"
              align="center"
            >
              {message}
            </AppText>
          </View>

          <Button
            label="Continue"
            onPress={onContinue}
            variant="primary"
          />
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const successStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    zIndex: 30,
    elevation: 12,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 420,
  },
  card: {
    gap: spacing.lg,
    alignItems: "center",
  },
  iconStack: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  ringInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textGroup: {
    gap: spacing.sm,
    alignItems: "center",
  },
});

type AnimatedSectionProps = {
  index: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

function AnimatedSection({ index, children, style }: AnimatedSectionProps) {
  const animatedStyle = useStaggeredFadeIn(index, 6, animation.enterLift, 70);
  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [packages, setPackages] = useState<BillingPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );

  const heroIconStyle = useLoopAnimation(1, 1.06, 4200);
  const heroGlowPulse = useSharedValue(0);

  useEffect(() => {
    heroGlowPulse.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [heroGlowPulse]);

  const heroGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(heroGlowPulse.value, [0, 1], [0.35, 0.75]),
    transform: [
      { scale: interpolate(heroGlowPulse.value, [0, 1], [0.9, 1.08]) },
    ],
  }));

  useEffect(() => {
    let isMounted = true;

    void getBillingPackages()
      .then((nextPackages) => {
        if (!isMounted) return;
        setPackages(nextPackages);
        const yearlyPackage =
          nextPackages.find((pkg) => getPackageKind(pkg) === "yearly") ??
          nextPackages[0];
        setSelectedPackageId(yearlyPackage?.productIdentifier ?? null);
      })
      .catch((error) => {
        console.warn("[Billing] Failed to load packages:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPackage = useMemo(
    () =>
      packages.find((pkg) => pkg.productIdentifier === selectedPackageId) ??
      null,
    [packages, selectedPackageId],
  );

  const yearlyPackage = useMemo(
    () => packages.find((pkg) => getPackageKind(pkg) === "yearly") ?? null,
    [packages],
  );

  const monthlyPackage = useMemo(
    () => packages.find((pkg) => getPackageKind(pkg) === "monthly") ?? null,
    [packages],
  );

  const extraPackages = useMemo(
    () =>
      packages.filter(
        (pkg) =>
          pkg.productIdentifier !== yearlyPackage?.productIdentifier &&
          pkg.productIdentifier !== monthlyPackage?.productIdentifier,
      ),
    [packages, yearlyPackage, monthlyPackage],
  );

  const savingsPercent = useMemo(
    () => computeSavingsPercent(yearlyPackage, monthlyPackage),
    [yearlyPackage, monthlyPackage],
  );

  const yearlyPerMonthLabel = useMemo(() => {
    if (!yearlyPackage) return null;
    const perMonth = formatPerMonthFromYearly(yearlyPackage);
    return perMonth ? `${perMonth} / month` : "billed yearly";
  }, [yearlyPackage]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      setIsProcessing(true);
      const fallback = await presentBillingPaywall();
      setIsProcessing(false);

      if (!fallback.success) {
        if (fallback.cancelled) return;
        Alert.alert(
          "Purchase unavailable",
          fallback.error || "Please try again in a moment.",
        );
        return;
      }

      updateSettings({ premium: true });
      setSuccessMessage("Your GentleWait Pro access is active.");
      return;
    }

    setIsProcessing(true);
    const result = await purchaseBillingPackage(selectedPackage);
    setIsProcessing(false);

    if (!result.success) {
      if (result.cancelled) return;
      Alert.alert(
        "Purchase unavailable",
        result.error || "Please try again in a moment.",
      );
      return;
    }

    updateSettings({ premium: true });
    setSuccessMessage("Your GentleWait Pro access is active.");
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

  const formattedSelectedIntroOffer = formatIntroOfferText(
    selectedPackage?.introOffer,
  );
  const primaryButtonLabel = formattedSelectedIntroOffer
    ? formattedSelectedIntroOffer.toLowerCase().startsWith("free")
      ? `Start ${formattedSelectedIntroOffer.toLowerCase()}`
      : `Start with ${formattedSelectedIntroOffer}`
    : selectedPackage
      ? `Continue with ${
          getPackageKind(selectedPackage) === "yearly"
            ? "Yearly"
            : getPackageKind(selectedPackage) === "monthly"
              ? "Monthly"
              : selectedPackage.title
        }`
      : "Continue with Pro";

  const hasPrimaryTier = Boolean(yearlyPackage || monthlyPackage);

  const styles = StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      position: "absolute",
      top: insets.top + spacing.xs,
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 10,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
      overflow: "hidden",
    },
    headerRestore: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.glassFill,
      borderWidth: 1,
      borderColor: colors.glassStroke,
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + 64,
      paddingBottom: 180,
      gap: spacing.xl,
    },
    heroSection: {
      alignItems: "center",
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    heroIconWrap: {
      width: 96,
      height: 96,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    heroIconGlow: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
    },
    heroIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(143, 214, 255, 0.20)",
      borderWidth: 1,
      borderColor: "rgba(143, 214, 255, 0.45)",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 22,
      elevation: 10,
    },
    heroEyebrow: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(143, 214, 255, 0.14)",
      borderWidth: 1,
      borderColor: "rgba(143, 214, 255, 0.38)",
    },
    heroHeadline: {
      textAlign: "center",
    },
    heroBody: {
      textAlign: "center",
      maxWidth: 420,
    },
    benefitsCard: {
      gap: spacing.md,
    },
    benefitsHeader: {
      gap: 2,
      marginBottom: spacing.xs,
    },
    plansSection: {
      gap: spacing.md,
    },
    plansEyebrow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    plansRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    soloTileRow: {
      gap: spacing.md,
    },
    extraPlansWrap: {
      gap: spacing.sm,
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
    stickyFooter: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: spacing.sm,
      paddingBottom: insets.bottom + spacing.sm,
      paddingHorizontal: spacing.lg,
      overflow: "hidden",
    },
    stickyFooterBlur: {
      ...StyleSheet.absoluteFillObject,
    },
    stickyFooterTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 16, 28, 0.45)",
    },
    stickyFooterAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 1,
    },
    ctaWrap: {
      position: "relative",
      justifyContent: "center",
    },
    finePrint: {
      textAlign: "center",
      marginTop: spacing.sm,
    },
  });

  const renderPlanRow = () => {
    if (yearlyPackage && monthlyPackage) {
      return (
        <View style={styles.plansRow}>
          <PlanTile
            packageInfo={yearlyPackage}
            kindLabel="Yearly"
            isSelected={
              selectedPackageId === yearlyPackage.productIdentifier
            }
            savingsPercent={savingsPercent}
            perPeriodLabel={yearlyPerMonthLabel}
            onPress={() =>
              setSelectedPackageId(yearlyPackage.productIdentifier)
            }
            disabled={isProcessing}
          />
          <PlanTile
            packageInfo={monthlyPackage}
            kindLabel="Monthly"
            isSelected={
              selectedPackageId === monthlyPackage.productIdentifier
            }
            perPeriodLabel="billed monthly"
            secondaryLine="Flexible, month-to-month."
            onPress={() =>
              setSelectedPackageId(monthlyPackage.productIdentifier)
            }
            disabled={isProcessing}
          />
        </View>
      );
    }

    if (yearlyPackage) {
      return (
        <View style={styles.soloTileRow}>
          <PlanTile
            packageInfo={yearlyPackage}
            kindLabel="Yearly"
            isSelected={
              selectedPackageId === yearlyPackage.productIdentifier
            }
            perPeriodLabel={yearlyPerMonthLabel}
            onPress={() =>
              setSelectedPackageId(yearlyPackage.productIdentifier)
            }
            disabled={isProcessing}
          />
        </View>
      );
    }

    if (monthlyPackage) {
      return (
        <View style={styles.soloTileRow}>
          <PlanTile
            packageInfo={monthlyPackage}
            kindLabel="Monthly"
            isSelected={
              selectedPackageId === monthlyPackage.productIdentifier
            }
            perPeriodLabel="billed monthly"
            secondaryLine="Flexible, month-to-month."
            onPress={() =>
              setSelectedPackageId(monthlyPackage.productIdentifier)
            }
            disabled={isProcessing}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <LiquidGlassBackground>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.82}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isProcessing}
            activeOpacity={0.82}
            style={styles.headerRestore}
          >
            <AppText variant="label" color="secondary">
              Restore
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedSection index={0} style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <Animated.View style={[styles.heroIconGlow, heroGlowStyle]}>
                <LinearGradient
                  colors={[
                    "rgba(143, 214, 255, 0.55)",
                    "rgba(143, 214, 255, 0)",
                  ]}
                  style={{ flex: 1, borderRadius: 70 }}
                  start={{ x: 0.5, y: 0.3 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
              <Animated.View
                style={[styles.heroIconCircle, heroIconStyle]}
              >
                <Ionicons
                  name="diamond"
                  size={32}
                  color={colors.primary}
                />
              </Animated.View>
            </View>

            <View style={styles.heroEyebrow}>
              <AppText variant="eyebrow" color="primary">
                GentleWait Pro
              </AppText>
            </View>

            <AppText variant="screenTitle" style={styles.heroHeadline}>
              Protect every app that pulls you in.
            </AppText>
            <AppText
              variant="bodyLarge"
              color="secondary"
              style={styles.heroBody}
            >
              Upgrade for full coverage, sharper insights, and guidance
              tied to your real pause history.
            </AppText>
          </AnimatedSection>

          <AnimatedSection index={1}>
            <GlassCard intensity="medium" style={styles.benefitsCard}>
              <View style={styles.benefitsHeader}>
                <AppText variant="eyebrow" color="primary">
                  What you unlock
                </AppText>
                <AppText variant="heading">
                  Pro is the full protection layer.
                </AppText>
              </View>
              {PRO_BENEFITS.map((benefit) => (
                <BenefitRow
                  key={benefit.title}
                  icon={benefit.icon}
                  title={benefit.title}
                  subtitle={benefit.subtitle}
                  tint={benefit.tint}
                />
              ))}
            </GlassCard>
          </AnimatedSection>

          <AnimatedSection index={2} style={styles.plansSection}>
            <View style={styles.plansEyebrow}>
              <AppText variant="eyebrow" color="secondary">
                Choose your plan
              </AppText>
              {savingsPercent ? (
                <AppText variant="caption" color="accent">
                  {`Yearly saves ${savingsPercent}%`}
                </AppText>
              ) : null}
            </View>

            {hasPrimaryTier ? renderPlanRow() : null}

            {extraPackages.length > 0 ? (
              <View style={styles.extraPlansWrap}>
                {extraPackages.map((pkg) => (
                  <ExtraPlanRow
                    key={pkg.productIdentifier}
                    packageInfo={pkg}
                    isSelected={
                      selectedPackageId === pkg.productIdentifier
                    }
                    onPress={() =>
                      setSelectedPackageId(pkg.productIdentifier)
                    }
                    disabled={isProcessing}
                  />
                ))}
              </View>
            ) : null}
          </AnimatedSection>

          <AnimatedSection index={3}>
            <GlassCard intensity="light" style={styles.legalCard}>
              <AppText variant="caption" color="secondary" align="center">
                Payment will be charged to your Apple ID at confirmation of
                purchase. Subscriptions renew automatically unless canceled
                at least 24 hours before the end of the current period. You
                can manage and cancel in your App Store account settings.
              </AppText>
              <TouchableOpacity
                style={styles.legalLink}
                onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                activeOpacity={0.82}
              >
                <AppText variant="body">Privacy Policy</AppText>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.legalLink}
                onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
                activeOpacity={0.82}
              >
                <AppText variant="body">Terms of Use</AppText>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </GlassCard>
          </AnimatedSection>
        </ScrollView>

        <View style={styles.stickyFooter}>
          <BlurView
            intensity={60}
            tint="dark"
            style={styles.stickyFooterBlur}
          />
          <View style={styles.stickyFooterTint} pointerEvents="none" />
          <LinearGradient
            colors={[
              "rgba(143, 214, 255, 0)",
              "rgba(143, 214, 255, 0.55)",
              "rgba(143, 214, 255, 0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.stickyFooterAccent}
          />
          <View style={styles.ctaWrap}>
            <BreathingHalo active={!isProcessing} />
            <Button
              label={isProcessing ? "Working..." : primaryButtonLabel}
              onPress={handlePurchase}
              disabled={isProcessing}
              variant="primary"
            />
          </View>
          <AppText
            variant="caption"
            color="tertiary"
            style={styles.finePrint}
          >
            Cancel anytime in App Store settings.
          </AppText>
        </View>

        {successMessage ? (
          <SuccessOverlay
            message={successMessage}
            onContinue={() => {
              setSuccessMessage(null);
              router.back();
            }}
          />
        ) : null}
      </View>
    </LiquidGlassBackground>
  );
}
