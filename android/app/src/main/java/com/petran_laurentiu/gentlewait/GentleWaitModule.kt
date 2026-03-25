package com.petran_laurentiu.gentlewait

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.petran_laurentiu.gentlewait.accessibility.PauseAccessibilityService
import org.json.JSONArray

class GentleWaitModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "GentleWaitModule"

  @ReactMethod
  fun isAccessibilityServiceEnabled(promise: Promise) {
    promise.resolve(isAccessibilityEnabled())
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("OPEN_ACCESSIBILITY_SETTINGS_FAILED", error)
    }
  }

  @ReactMethod
  fun setSelectedApps(apps: ReadableArray, promise: Promise) {
    try {
      val selectedApps = mutableSetOf<String>()
      for (index in 0 until apps.size()) {
        val packageName = apps.getString(index)
        if (!packageName.isNullOrBlank()) {
          selectedApps.add(packageName)
        }
      }
      prefs()
        .edit()
        .putStringSet(PauseAccessibilityService.SELECTED_APPS_KEY, selectedApps)
        .apply()
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("SET_SELECTED_APPS_FAILED", error)
    }
  }

  @ReactMethod
  fun getSelectedApps(promise: Promise) {
    try {
      val packages = prefs()
        .getStringSet(PauseAccessibilityService.SELECTED_APPS_KEY, emptySet())
        ?.toList()
        ?.sorted()
        ?: emptyList()

      val json = JSONArray()
      packages.forEach { packageName ->
        val item = org.json.JSONObject()
        item.put("packageName", packageName)
        item.put("label", resolveAppLabel(packageName))
        json.put(item)
      }

      promise.resolve(json.toString())
    } catch (error: Exception) {
      promise.reject("GET_SELECTED_APPS_FAILED", error)
    }
  }

  @ReactMethod
  fun getInstalledApps(promise: Promise) {
    try {
      val packageManager = reactContext.packageManager
      val apps = Arguments.createArray()
      val seenPackages = mutableSetOf<String>()

      @Suppress("DEPRECATION")
      val installedApps = packageManager.getInstalledApplications(
        PackageManager.GET_META_DATA
      )

      installedApps
        .asSequence()
        .filter { appInfo ->
          appInfo.packageName != reactContext.packageName &&
            packageManager.getLaunchIntentForPackage(appInfo.packageName) != null &&
            packageManager.getApplicationLabel(appInfo).toString().isNotBlank() &&
            (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0
        }
        .sortedBy { packageManager.getApplicationLabel(it).toString().lowercase() }
        .forEach { appInfo ->
          if (!seenPackages.add(appInfo.packageName)) {
            return@forEach
          }
          val item = Arguments.createMap().apply {
            putString("packageName", appInfo.packageName)
            putString("label", packageManager.getApplicationLabel(appInfo).toString())
          }
          apps.pushMap(item)
        }

      promise.resolve(apps)
    } catch (error: Exception) {
      promise.reject("GET_INSTALLED_APPS_FAILED", error)
    }
  }

  @ReactMethod
  fun getPendingInterception(promise: Promise) {
    val preferences = prefs()
    val appPackage = preferences.getString(PauseAccessibilityService.PENDING_APP_PACKAGE_KEY, null)
    if (appPackage.isNullOrBlank()) {
      promise.resolve(null)
      return
    }

    val payload = Arguments.createMap().apply {
      putString("appPackage", appPackage)
      putString(
        "appLabel",
        preferences.getString(PauseAccessibilityService.PENDING_APP_LABEL_KEY, appPackage)
      )
      putDouble(
        "ts",
        preferences.getLong(PauseAccessibilityService.PENDING_APP_TS_KEY, System.currentTimeMillis())
          .toDouble()
      )
    }
    promise.resolve(payload)
  }

  @ReactMethod
  fun markAppHandled(packageName: String, promise: Promise) {
    try {
      val preferences = prefs()
      preferences.edit()
        .remove(PauseAccessibilityService.PENDING_APP_PACKAGE_KEY)
        .remove(PauseAccessibilityService.PENDING_APP_LABEL_KEY)
        .remove(PauseAccessibilityService.PENDING_APP_TS_KEY)
        .putLong(
          PauseAccessibilityService.lastHandledKey(packageName),
          System.currentTimeMillis()
        )
        .apply()
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("MARK_APP_HANDLED_FAILED", error)
    }
  }

  @ReactMethod
  fun setCooldownDuration(durationMs: Double, promise: Promise) {
    try {
      prefs()
        .edit()
        .putLong(PauseAccessibilityService.COOLDOWN_DURATION_MS_KEY, durationMs.toLong())
        .apply()
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("SET_COOLDOWN_DURATION_FAILED", error)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    try {
      val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
      if (launchIntent == null) {
        promise.resolve(false)
        return
      }

      prefs()
        .edit()
        .putLong(PauseAccessibilityService.lastHandledKey(packageName), System.currentTimeMillis())
        .apply()

      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(launchIntent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("LAUNCH_APP_FAILED", error)
    }
  }

  private fun prefs() = reactContext.getSharedPreferences(
    PauseAccessibilityService.PREFS_NAME,
    Context.MODE_PRIVATE
  )

  private fun resolveAppLabel(packageName: String): String {
    return try {
      val appInfo = reactContext.packageManager.getApplicationInfo(packageName, 0)
      reactContext.packageManager.getApplicationLabel(appInfo).toString()
    } catch (_: Exception) {
      packageName
    }
  }

  private fun isAccessibilityEnabled(): Boolean {
    val expectedComponent = ComponentName(
      reactContext,
      PauseAccessibilityService::class.java
    )
    val expectedId = expectedComponent.flattenToString()
    val expectedShortId = expectedComponent.flattenToShortString()

    val enabledServices = Settings.Secure.getString(
      reactContext.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false

    val splitter = TextUtils.SimpleStringSplitter(':').apply {
      setString(enabledServices)
    }

    splitter.forEach { service ->
      if (service.equals(expectedId, ignoreCase = true) ||
        service.equals(expectedShortId, ignoreCase = true)
      ) {
        return true
      }
    }

    return false
  }
}
