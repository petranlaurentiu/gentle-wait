export const FREE_PROTECTED_APPS_LIMIT = 3;
export const PREMIUM_ENTITLEMENT_ID = "GentleWait Pro";

export const PRICING = {
  monthly: "$4.99/mo",
  yearly: "$29.99/yr",
  lifetime: "$79.99 once",
} as const;

export function getUpgradePitch() {
  return `Unlock unlimited protected apps, deeper insights, and the AI Companion with GentleWait Pro.\n\nChoose ${PRICING.monthly}, ${PRICING.yearly}, or ${PRICING.lifetime}.`;
}
