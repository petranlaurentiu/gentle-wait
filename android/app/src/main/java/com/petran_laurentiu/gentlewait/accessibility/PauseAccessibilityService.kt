package com.petran_laurentiu.gentlewait.accessibility

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class PauseAccessibilityService : AccessibilityService() {

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    val packageName = event.packageName?.toString()?.trim().orEmpty()
    if (packageName.isBlank() || shouldIgnorePackage(packageName)) {
      return
    }

    val selectedApps = prefs().getStringSet(SELECTED_APPS_KEY, emptySet()) ?: emptySet()
    if (!selectedApps.contains(packageName)) {
      return
    }

    val now = System.currentTimeMillis()
    val cooldownMs = prefs().getLong(COOLDOWN_DURATION_MS_KEY, DEFAULT_COOLDOWN_MS)
    val lastHandledAt = prefs().getLong(lastHandledKey(packageName), 0L)
    if (now - lastHandledAt < cooldownMs) {
      return
    }

    val appLabel = resolveAppLabel(packageName)
    prefs().edit()
      .putString(PENDING_APP_PACKAGE_KEY, packageName)
      .putString(PENDING_APP_LABEL_KEY, appLabel)
      .putLong(PENDING_APP_TS_KEY, now)
      .putLong(lastHandledKey(packageName), now)
      .apply()

    launchGentleWait()
  }

  override fun onInterrupt() = Unit

  private fun prefs() = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private fun shouldIgnorePackage(packageName: String): Boolean {
    if (packageName == this.packageName) {
      return true
    }

    return packageName in IGNORED_PACKAGES
  }

  private fun resolveAppLabel(packageName: String): String {
    return try {
      val appInfo = packageManager.getApplicationInfo(packageName, 0)
      packageManager.getApplicationLabel(appInfo).toString()
    } catch (_: Exception) {
      packageName
    }
  }

  private fun launchGentleWait() {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return
    launchIntent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_SINGLE_TOP or
        Intent.FLAG_ACTIVITY_CLEAR_TOP
    )
    startActivity(launchIntent)
  }

  companion object {
    const val PREFS_NAME = "GentleWaitPrefs"
    const val SELECTED_APPS_KEY = "selected_apps"
    const val PENDING_APP_PACKAGE_KEY = "pending_app_package"
    const val PENDING_APP_LABEL_KEY = "pending_app_label"
    const val PENDING_APP_TS_KEY = "pending_app_ts"
    const val COOLDOWN_DURATION_MS_KEY = "cooldown_duration_ms"
    const val DEFAULT_COOLDOWN_MS = 15 * 60 * 1000L

    private val IGNORED_PACKAGES = setOf(
      "com.android.systemui",
      "com.google.android.permissioncontroller",
      "com.android.permissioncontroller",
      "com.android.settings"
    )

    fun lastHandledKey(packageName: String): String = "last_handled_$packageName"
  }
}
