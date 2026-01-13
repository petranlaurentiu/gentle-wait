package com.petran_laurentiu.gentlewait.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

class PauseAccessibilityService : AccessibilityService() {
  companion object {
    const val PREFS_NAME = "GentleWaitPrefs"
    private const val SHORT_COOLDOWN_MS = 2000L // 2 seconds
    private const val DEFAULT_HANDLED_COOLDOWN_MS = 1 * 60 * 1000L // 1 minute
    private const val APP_CLOSED_THRESHOLD_MS = 30 * 1000L // 30 seconds
    private val SYSTEM_PACKAGES = setOf(
      "android", "com.android", "com.google.android", "com.sec.android", "com.samsung.android"
    )
  }

  private val appInterceptCooldowns = ConcurrentHashMap<String, Long>()
  private val appLastSeenTime = ConcurrentHashMap<String, Long>() // Track last seen time

  override fun onServiceConnected() {
    super.onServiceConnected()
    val info = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
      notificationTimeout = 100
    }
    setServiceInfo(info)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

    val packageName = event.packageName?.toString() ?: return
    if (isSystemPackage(packageName) || packageName == "com.petran_laurentiu.gentlewait") return

    val currentTime = System.currentTimeMillis()
    val lastSeen = appLastSeenTime[packageName] ?: 0

    // If app was closed for a while, reset its handled cooldown
    if (currentTime - lastSeen > APP_CLOSED_THRESHOLD_MS) {
      val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit().remove("handled_$packageName").apply()
      Log.d("PauseAccessibility", "Reset handled cooldown for $packageName due to inactivity")
    }
    appLastSeenTime[packageName] = currentTime // Update last seen time

    if (isInCooldown(packageName)) return

    if (!isAppSelected(packageName)) return

    appInterceptCooldowns[packageName] = currentTime
    showPauseScreen(packageName, event.text?.firstOrNull()?.toString() ?: packageName)
  }

  override fun onInterrupt() {}

  private fun isInCooldown(packageName: String): Boolean {
    val currentTime = System.currentTimeMillis()

    // First check in-memory cooldown (short-term, for immediate app switching)
    val lastInterceptTime = appInterceptCooldowns[packageName] ?: 0
    if (currentTime - lastInterceptTime < SHORT_COOLDOWN_MS) {
      Log.d("PauseAccessibility", "App $packageName is in short cooldown")
      return true
    }

    // Check SharedPreferences for handled cooldown (long-term, survives service restart)
    val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val handledTime = prefs.getLong("handled_$packageName", 0)
    val cooldownDuration = prefs.getLong("cooldown_duration", DEFAULT_HANDLED_COOLDOWN_MS)

    if (handledTime > 0 && currentTime - handledTime < cooldownDuration) {
      Log.d("PauseAccessibility", "App $packageName is in handled cooldown")
      return true
    }

    return false
  }

  private fun isSystemPackage(packageName: String): Boolean {
    return SYSTEM_PACKAGES.any { packageName.startsWith(it) } || packageName.isEmpty()
  }

  private fun isAppSelected(packageName: String): Boolean {
    val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val selectedAppsJson = prefs.getString("selected_apps", "[]")
    return selectedAppsJson?.contains("\"$packageName\"") ?: false
  }

  private fun showPauseScreen(appPackage: String, appLabel: String) {
    try {
      // Save interception to SharedPreferences for React Native to pick up
      val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit().apply {
        putString("pending_app_package", appPackage)
        putString("pending_app_label", appLabel)
        putLong("pending_app_ts", System.currentTimeMillis())
        apply()
      }

      // Launch main activity to show pause screen
      val intent = Intent(this, com.petran_laurentiu.gentlewait.MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra("appPackage", appPackage)
        putExtra("appLabel", appLabel)
      }
      startActivity(intent)
    } catch (e: Exception) {
      Log.e("PauseAccessibility", "Error showing pause screen: ${e.message}")
    }
  }
}
