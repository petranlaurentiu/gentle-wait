package com.petran_laurentiu.gentlewait.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.petran_laurentiu.gentlewait.GentleWaitModule
import com.petran_laurentiu.gentlewait.MainActivity
import org.json.JSONArray
import java.util.concurrent.ConcurrentHashMap

class PauseAccessibilityService : AccessibilityService() {
  companion object {
    private const val TAG = "PauseAccessibility"
    private const val SHORT_COOLDOWN_MS = 2_000L
    private const val DEFAULT_HANDLED_COOLDOWN_MS = 60_000L
    private const val RELAUNCH_DELAY_MS = 300L
    private const val PENDING_INTERCEPTION_GUARD_MS = 1_500L
    private val SYSTEM_PACKAGE_PREFIXES = setOf(
      "android",
      "com.android",
      "com.google.android.permissioncontroller",
      "com.google.android.packageinstaller",
      "com.samsung.android",
      "com.miui",
      "com.oppo",
      "com.vivo",
      "com.oneplus",
    )
  }

  private val appInterceptCooldowns = ConcurrentHashMap<String, Long>()
  private val mainHandler = Handler(Looper.getMainLooper())
  private val prefs by lazy {
    getSharedPreferences(GentleWaitModule.PREFS_NAME, Context.MODE_PRIVATE)
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    val info = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
      notificationTimeout = 100
    }
    serviceInfo = info
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      return
    }

    val packageName = event.packageName?.toString()?.trim().orEmpty()
    if (packageName.isBlank() || shouldIgnorePackage(packageName)) {
      return
    }

    val selectedPackages = getSelectedPackages()
    if (!selectedPackages.contains(packageName)) {
      return
    }

    if (isInCooldown(packageName) || hasFreshPendingInterception(packageName)) {
      return
    }

    val appLabel = getAppLabel(packageName)
    appInterceptCooldowns[packageName] = System.currentTimeMillis()
    persistPendingInterception(packageName, appLabel)
    showPauseScreen(packageName, appLabel)
  }

  override fun onInterrupt() = Unit

  private fun shouldIgnorePackage(packageName: String): Boolean {
    if (packageName == applicationContext.packageName) {
      return true
    }

    if (packageName == getDefaultLauncherPackage()) {
      return true
    }

    return SYSTEM_PACKAGE_PREFIXES.any { prefix ->
      packageName == prefix || packageName.startsWith("$prefix.")
    }
  }

  private fun getDefaultLauncherPackage(): String? {
    val launchIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
    }

    val resolveInfo = packageManager.resolveActivity(
      launchIntent,
      PackageManager.MATCH_DEFAULT_ONLY,
    )

    return resolveInfo?.activityInfo?.packageName
  }

  private fun hasFreshPendingInterception(packageName: String): Boolean {
    val pendingPackage = prefs.getString(GentleWaitModule.KEY_PENDING_APP_PACKAGE, null)
    val pendingAt = prefs.getLong(GentleWaitModule.KEY_PENDING_APP_TS, 0L)
    val now = System.currentTimeMillis()
    return pendingPackage == packageName && now - pendingAt < PENDING_INTERCEPTION_GUARD_MS
  }

  private fun persistPendingInterception(appPackage: String, appLabel: String) {
    prefs.edit()
      .putString(GentleWaitModule.KEY_PENDING_APP_PACKAGE, appPackage)
      .putString(GentleWaitModule.KEY_PENDING_APP_LABEL, appLabel)
      .putLong(GentleWaitModule.KEY_PENDING_APP_TS, System.currentTimeMillis())
      .apply()
  }

  private fun isInCooldown(packageName: String): Boolean {
    val now = System.currentTimeMillis()

    val lastInterceptTime = appInterceptCooldowns[packageName] ?: 0L
    if (now - lastInterceptTime < SHORT_COOLDOWN_MS) {
      return true
    }

    val handledTime = prefs.getLong(GentleWaitModule.handledKey(packageName), 0L)
    val cooldownDuration = prefs.getLong(
      GentleWaitModule.KEY_COOLDOWN_DURATION,
      DEFAULT_HANDLED_COOLDOWN_MS,
    )

    return handledTime > 0 && now - handledTime < cooldownDuration
  }

  private fun getSelectedPackages(): Set<String> {
    val cached = prefs.getStringSet(GentleWaitModule.KEY_SELECTED_APPS_SET, null)
    if (!cached.isNullOrEmpty()) {
      return cached.filter { it.isNotBlank() }.toSet()
    }

    val selectedAppsJson =
      prefs.getString(GentleWaitModule.KEY_SELECTED_APPS_JSON, "[]") ?: "[]"

    return try {
      val parsedPackages = mutableSetOf<String>()
      val jsonArray = JSONArray(selectedAppsJson)
      for (index in 0 until jsonArray.length()) {
        val value = jsonArray.optString(index).trim()
        if (value.isNotBlank()) {
          parsedPackages.add(value)
        }
      }

      prefs.edit().putStringSet(GentleWaitModule.KEY_SELECTED_APPS_SET, parsedPackages).apply()
      parsedPackages
    } catch (error: Exception) {
      Log.w(TAG, "Failed to parse selected apps JSON", error)
      emptySet()
    }
  }

  private fun getAppLabel(packageName: String): String {
    return try {
      val appInfo = packageManager.getApplicationInfo(packageName, 0)
      packageManager.getApplicationLabel(appInfo).toString()
    } catch (_: PackageManager.NameNotFoundException) {
      packageName
    }
  }

  private fun showPauseScreen(appPackage: String, appLabel: String) {
    try {
      performGlobalAction(GLOBAL_ACTION_HOME)

      val intent = Intent(this, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_SINGLE_TOP or
          Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra("appPackage", appPackage)
        putExtra("appLabel", appLabel)
      }

      mainHandler.postDelayed(
        { startActivity(intent) },
        RELAUNCH_DELAY_MS,
      )
    } catch (error: Exception) {
      Log.e(TAG, "Error showing pause screen", error)
    }
  }
}
