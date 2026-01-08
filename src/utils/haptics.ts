/**
 * Haptic feedback utility using expo-haptics
 * Provides vibration feedback for user interactions
 */
import * as Haptics from 'expo-haptics';

/**
 * Light impact feedback - for button presses
 */
export async function triggerLightImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

/**
 * Medium impact feedback - for selections and confirmations
 */
export async function triggerMediumImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

/**
 * Heavy impact feedback - for important actions
 */
export async function triggerHeavyImpact() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

/**
 * Success notification - for successful completions
 */
export async function triggerSuccessNotification() {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

/**
 * Warning notification - for warnings or errors
 */
export async function triggerWarningNotification() {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning
    );
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

/**
 * Selection feedback - subtle haptic for selections
 */
export async function triggerSelectionFeedback() {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}
