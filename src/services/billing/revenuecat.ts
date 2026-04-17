import Constants from "expo-constants";
import { Platform } from "react-native";
import { PREMIUM_ENTITLEMENT_ID } from "@/src/constants/monetization";

type RevenueCatEntitlement = {
  identifier?: string;
  productIdentifier?: string;
  expirationDate?: string | null;
  willRenew?: boolean;
};

export type RevenueCatCustomerInfo = {
  entitlements: {
    active: Record<string, RevenueCatEntitlement | undefined>;
  };
  activeSubscriptions?: string[];
};

export type BillingPackage = {
  identifier: string;
  packageType: string;
  productIdentifier: string;
  title: string;
  description: string;
  priceString: string;
  introOffer?: string;
};

type RevenueCatPackage =
  NonNullable<
    Awaited<ReturnType<PurchasesModule["getOfferings"]>>["current"]
  >["availablePackages"][number];

type BillingInitialization = {
  available: boolean;
  configured: boolean;
  reason?: string;
};

type PurchasesModule = typeof import("react-native-purchases").default;
type PurchasesUiModule = typeof import("react-native-purchases-ui");
type RevenueCatOfferings = Awaited<ReturnType<PurchasesModule["getOfferings"]>>;
type RevenueCatOffering = NonNullable<RevenueCatOfferings["current"]>;

let purchasesModulePromise: Promise<PurchasesModule | null> | null = null;
let purchasesUiModulePromise: Promise<PurchasesUiModule | null> | null = null;
let isConfigured = false;

const PREFERRED_OFFERING_IDENTIFIERS = ["premium"] as const;

function getRevenueCatApiKey() {
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.extra?.revenueCatAppleApiKey || "";
  }

  if (Platform.OS === "android") {
    return Constants.expoConfig?.extra?.revenueCatGoogleApiKey || "";
  }

  return "";
}

export function isBillingSupported() {
  return Platform.OS === "ios" || Platform.OS === "android";
}

async function getPurchasesModule() {
  if (!isBillingSupported()) {
    return null;
  }

  if (!purchasesModulePromise) {
    purchasesModulePromise = import("react-native-purchases")
      .then((module) => module.default)
      .catch((error) => {
        console.warn("[Billing] RevenueCat SDK unavailable:", error);
        return null;
      });
  }

  return purchasesModulePromise;
}

async function getPurchasesUiModule() {
  if (!isBillingSupported()) {
    return null;
  }

  if (!purchasesUiModulePromise) {
    purchasesUiModulePromise = import("react-native-purchases-ui").catch(
      (error) => {
        console.warn("[Billing] RevenueCat UI unavailable:", error);
        return null;
      },
    );
  }

  return purchasesUiModulePromise;
}

function resolveOffering(
  offerings: RevenueCatOfferings | null | undefined,
): RevenueCatOffering | null {
  const allOfferings = offerings?.all ?? {};

  for (const identifier of PREFERRED_OFFERING_IDENTIFIERS) {
    const preferredOffering = allOfferings[identifier];
    if (preferredOffering) {
      return preferredOffering;
    }
  }

  if (offerings?.current) {
    return offerings.current;
  }

  const fallbackOffering = Object.values(allOfferings).find(Boolean);
  return fallbackOffering ?? null;
}

function getAvailableOfferingIdentifiers(
  offerings: RevenueCatOfferings | null | undefined,
) {
  return Object.keys(offerings?.all ?? {});
}

function mapPackage(pkg: RevenueCatPackage): BillingPackage {
  const introPrice = pkg.product.introPrice;

  return {
    identifier: pkg.identifier,
    packageType: pkg.packageType || pkg.identifier,
    productIdentifier: pkg.product.identifier,
    title: pkg.product.title,
    description: pkg.product.description,
    priceString: pkg.product.priceString,
    introOffer:
      introPrice?.priceString && introPrice?.period
        ? `${introPrice.priceString} for ${introPrice.period}`
        : undefined,
  };
}

function getPackageSortRank(pkg: BillingPackage) {
  const value = `${pkg.packageType} ${pkg.identifier} ${pkg.productIdentifier}`.toLowerCase();

  if (value.includes("annual") || value.includes("year")) return 0;
  if (value.includes("month")) return 1;
  if (value.includes("week")) return 2;
  if (value.includes("life")) return 3;

  return 4;
}

function isLifetimePackage(pkg: BillingPackage) {
  const value = `${pkg.packageType} ${pkg.identifier} ${pkg.productIdentifier} ${pkg.title}`.toLowerCase();
  return value.includes("life");
}

function filterVisiblePackages(packages: BillingPackage[]) {
  return packages
    .filter((pkg) => !isLifetimePackage(pkg))
    .sort((a, b) => getPackageSortRank(a) - getPackageSortRank(b));
}

async function getResolvedOfferingAndPackages() {
  const Purchases = await getPurchasesModule();
  const offerings = await Purchases?.getOfferings();
  const offering = resolveOffering(offerings);

  return {
    Purchases,
    offerings,
    offering,
    packages: offering?.availablePackages ?? [],
  };
}

export async function initializeBilling(): Promise<BillingInitialization> {
  if (!isBillingSupported()) {
    return {
      available: false,
      configured: false,
      reason: "unsupported_platform",
    };
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    return {
      available: false,
      configured: false,
      reason: "missing_api_key",
    };
  }

  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return { available: false, configured: false, reason: "sdk_unavailable" };
  }

  if (!isConfigured) {
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({ apiKey });
    isConfigured = true;
  }

  return { available: true, configured: true };
}

export async function getCustomerInfo() {
  const init = await initializeBilling();
  if (!init.configured) {
    return null;
  }

  const Purchases = await getPurchasesModule();
  return Purchases?.getCustomerInfo() ?? null;
}

export async function getBillingDebugSnapshot() {
  const init = await initializeBilling();
  if (!init.configured) {
    return {
      configured: false,
      available: init.available,
      reason: init.reason,
    };
  }

  const Purchases = await getPurchasesModule();
  const [appUserID, customerInfo] = await Promise.all([
    Purchases?.getAppUserID?.() ?? null,
    Purchases?.getCustomerInfo?.() ?? null,
  ]);

  return {
    configured: true,
    available: init.available,
    appUserID,
    activeEntitlementIds: Object.keys(customerInfo?.entitlements?.active ?? {}),
    activeSubscriptions: customerInfo?.activeSubscriptions ?? [],
    customerInfo,
  };
}

export function hasPremiumAccess(customerInfo: RevenueCatCustomerInfo | null) {
  if (__DEV__) {
    console.log("[Billing] Checking premium access:", {
      expectedEntitlement: PREMIUM_ENTITLEMENT_ID,
      activeEntitlements: Object.keys(customerInfo?.entitlements?.active ?? {}),
      hasAccess: Boolean(customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID]),
    });
  }
  return Boolean(customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}

export async function getBillingPackages(): Promise<BillingPackage[]> {
  const init = await initializeBilling();
  if (!init.configured) {
    return [];
  }

  const { packages } = await getResolvedOfferingAndPackages();
  return filterVisiblePackages(packages.map(mapPackage));
}

export async function restoreBillingPurchases() {
  const init = await initializeBilling();
  if (!init.configured) {
    return {
      success: false,
      restored: false,
      error: "Billing is not configured yet.",
    };
  }

  const Purchases = await getPurchasesModule();

  try {
    const customerInfo = await Purchases?.restorePurchases();
    const restored = hasPremiumAccess(customerInfo ?? null);

    return {
      success: true,
      restored,
      customerInfo: customerInfo ?? null,
    };
  } catch (error: any) {
    return {
      success: false,
      restored: false,
      error: error?.message || "Restore failed.",
    };
  }
}

export async function presentBillingPaywall() {
  const init = await initializeBilling();
  if (!init.configured) {
    return {
      success: false,
      presented: false,
      cancelled: false,
      purchased: false,
      restored: false,
      result: "not_configured",
      error: "Billing is not configured yet.",
    };
  }

  const RevenueCatUI = await getPurchasesUiModule();
  if (!RevenueCatUI) {
    return {
      success: false,
      presented: false,
      cancelled: false,
      purchased: false,
      restored: false,
      result: "ui_unavailable",
      error: "RevenueCat paywall UI is unavailable.",
    };
  }

  try {
    const { offerings, offering } = await getResolvedOfferingAndPackages();

    if (!offering) {
      const availableOfferingIdentifiers =
        getAvailableOfferingIdentifiers(offerings);

      return {
        success: false,
        presented: false,
        cancelled: false,
        purchased: false,
        restored: false,
        result: "missing_offering",
        error:
          availableOfferingIdentifiers.length > 0
            ? `No usable RevenueCat offering was found. Available offerings: ${availableOfferingIdentifiers.join(", ")}.`
            : "No RevenueCat offering is available yet.",
      };
    }

    const paywallResult = await RevenueCatUI.default.presentPaywall({
      offering,
      displayCloseButton: true,
    });

    const purchased =
      paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED;
    const restored =
      paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED;
    const cancelled =
      paywallResult === RevenueCatUI.PAYWALL_RESULT.CANCELLED;
    const presented =
      paywallResult !== RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED &&
      paywallResult !== RevenueCatUI.PAYWALL_RESULT.ERROR;

    return {
      success: purchased || restored,
      presented,
      cancelled,
      purchased,
      restored,
      result: String(paywallResult),
      error:
        paywallResult === RevenueCatUI.PAYWALL_RESULT.NOT_PRESENTED
          ? "No RevenueCat paywall is available for the current offering yet."
          : paywallResult === RevenueCatUI.PAYWALL_RESULT.ERROR
            ? "Unable to present the RevenueCat paywall."
            : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      presented: false,
      cancelled: false,
      purchased: false,
      restored: false,
      result: "error",
      error: error?.message || "Unable to present paywall.",
    };
  }
}

export async function purchaseBillingPackage(
  targetPackage: Pick<BillingPackage, "identifier" | "productIdentifier">,
) {
  const init = await initializeBilling();
  if (!init.configured) {
    return {
      success: false,
      cancelled: false,
      purchased: false,
      customerInfo: null,
      error: "Billing is not configured yet.",
    };
  }

  try {
    const { Purchases, packages } = await getResolvedOfferingAndPackages();

    if (!Purchases) {
      return {
        success: false,
        cancelled: false,
        purchased: false,
        customerInfo: null,
        error: "Billing SDK is unavailable.",
      };
    }

    const selectedPackage = packages.find(
      (pkg) =>
        pkg.identifier === targetPackage.identifier ||
        pkg.product.identifier === targetPackage.productIdentifier,
    );

    if (!selectedPackage) {
      return {
        success: false,
        cancelled: false,
        purchased: false,
        customerInfo: null,
        error: "The selected subscription is not available right now.",
      };
    }

    const purchaseResult = await Purchases.purchasePackage(selectedPackage);
    const customerInfo = purchaseResult.customerInfo ?? null;

    return {
      success: hasPremiumAccess(customerInfo),
      cancelled: false,
      purchased: hasPremiumAccess(customerInfo),
      customerInfo,
    };
  } catch (error: any) {
    const cancelled =
      Boolean(error?.userCancelled) || error?.code === "PURCHASE_CANCELLED";

    return {
      success: false,
      cancelled,
      purchased: false,
      customerInfo: null,
      error: cancelled ? undefined : error?.message || "Unable to complete purchase.",
    };
  }
}

export async function presentBillingCustomerCenter() {
  const init = await initializeBilling();
  if (!init.configured) {
    return {
      success: false,
      error: "Billing is not configured yet.",
    };
  }

  const RevenueCatUI = await getPurchasesUiModule();
  if (!RevenueCatUI) {
    return {
      success: false,
      error: "Customer Center UI is unavailable.",
    };
  }

  try {
    await RevenueCatUI.default.presentCustomerCenter();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Unable to open Customer Center.",
    };
  }
}

export async function addBillingCustomerInfoListener(
  listener: (customerInfo: RevenueCatCustomerInfo) => void,
) {
  const init = await initializeBilling();
  if (!init.configured) {
    return () => {};
  }

  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return () => {};
  }

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
