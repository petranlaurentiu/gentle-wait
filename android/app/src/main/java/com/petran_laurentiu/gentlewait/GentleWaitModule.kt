package com.petran_laurentiu.gentlewait

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONArray

class GentleWaitModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val prefs =
    reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private val accessibilityComponentName by lazy {
    ComponentName(
      reactApplicationContext,
      "com.petran_laurentiu.gentlewait.accessibility.PauseAccessibilityService",
    )
  }
  private val ignoredSelectablePackages = setOf(
    "com.google.android.permissioncontroller",
    "com.google.android.packageinstaller",
    "com.android.packageinstaller",
  )

  override fun getName(): String = "GentleWaitModule"

  @ReactMethod
  fun getInstalledApps(promise: Promise) {
    try {
      val packageManager = reactApplicationContext.packageManager
      val launcherIntent =
        Intent(Intent.ACTION_MAIN).apply {
          addCategory(Intent.CATEGORY_LAUNCHER)
        }
      val homePackage = getDefaultLauncherPackage(packageManager)
      val apps = Arguments.createArray()
      val seenPackages = linkedSetOf<String>()

      packageManager.queryIntentActivities(launcherIntent, 0)
        .asSequence()
        .mapNotNull { resolveInfo ->
          val activityInfo = resolveInfo.activityInfo ?: return@mapNotNull null
          val packageName = activityInfo.packageName?.trim().orEmpty()
          if (
            packageName.isBlank() ||
            packageName == reactApplicationContext.packageName ||
            packageName == homePackage ||
            ignoredSelectablePackages.contains(packageName) ||
            !seenPackages.add(packageName)
          ) {
            return@mapNotNull null
          }

          val label = resolveInfo.loadLabel(packageManager)?.toString()?.trim().orEmpty()
          if (label.isBlank()) {
            return@mapNotNull null
          }

          packageName to label
        }
        .sortedBy { (_, label) -> label.lowercase() }
        .forEach { (packageName, label) ->
          val map =
            Arguments.createMap().apply {
              putString("packageName", packageName)
              putString("label", label)
            }
          apps.pushMap(map)
        }

      promise.resolve(apps)
    } catch (e: Exception) {
      promise.reject("GET_INSTALLED_APPS_FAILED", e)
    }
  }

  @ReactMethod
  fun isAccessibilityServiceEnabled(promise: Promise) {
    try {
      val enabledServices =
        Settings.Secure.getString(
          reactApplicationContext.contentResolver,
          Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ) ?: ""
      val flattened = accessibilityComponentName.flattenToString()
      val shortFlattened = accessibilityComponentName.flattenToShortString()
      val isEnabled =
        enabledServices.contains(flattened, ignoreCase = true) ||
          enabledServices.contains(shortFlattened, ignoreCase = true)
      promise.resolve(isEnabled)
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("OPEN_SETTINGS_FAILED", e)
    }
  }

  @ReactMethod
  fun setSelectedApps(packageNames: com.facebook.react.bridge.ReadableArray, promise: Promise) {
    try {
      val normalizedPackages = linkedSetOf<String>()
      val jsonArray = JSONArray()

      for (index in 0 until packageNames.size()) {
        val packageName = packageNames.getString(index)?.trim().orEmpty()
        if (packageName.isBlank()) {
          continue
        }

        if (normalizedPackages.add(packageName)) {
          jsonArray.put(packageName)
        }
      }

      prefs.edit()
        .putString(KEY_SELECTED_APPS_JSON, jsonArray.toString())
        .putStringSet(KEY_SELECTED_APPS_SET, normalizedPackages)
        .apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SET_SELECTED_APPS_FAILED", e)
    }
  }

  @ReactMethod
  fun getSelectedApps(promise: Promise) {
    val value = prefs.getString(KEY_SELECTED_APPS_JSON, "[]") ?: "[]"
    promise.resolve(value)
  }

  @ReactMethod
  fun getPendingInterception(promise: Promise) {
    val appPackage = prefs.getString(KEY_PENDING_APP_PACKAGE, null)
    val appLabel = prefs.getString(KEY_PENDING_APP_LABEL, null)
    val ts = prefs.getLong(KEY_PENDING_APP_TS, 0L)

    if (appPackage.isNullOrBlank() || appLabel.isNullOrBlank() || ts == 0L) {
      promise.resolve(null)
      return
    }

    val map = Arguments.createMap().apply {
      putString("appPackage", appPackage)
      putString("appLabel", appLabel)
      putDouble("ts", ts.toDouble())
    }
    promise.resolve(map)
  }

  @ReactMethod
  fun markAppHandled(appPackage: String, promise: Promise) {
    val normalizedPackage = appPackage.trim()
    if (normalizedPackage.isBlank()) {
      promise.resolve(false)
      return
    }

    prefs.edit()
      .remove(KEY_PENDING_APP_PACKAGE)
      .remove(KEY_PENDING_APP_LABEL)
      .remove(KEY_PENDING_APP_TS)
      .putLong(handledKey(normalizedPackage), System.currentTimeMillis())
      .apply()
    promise.resolve(true)
  }

  @ReactMethod
  fun setCooldownDuration(durationMs: Double, promise: Promise) {
    try {
      prefs.edit()
        .putLong(KEY_COOLDOWN_DURATION, durationMs.toLong().coerceAtLeast(MIN_COOLDOWN_MS))
        .apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SET_COOLDOWN_FAILED", e)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    val normalizedPackage = packageName.trim()
    if (normalizedPackage.isBlank()) {
      promise.reject("LAUNCH_FAILED", "Package name is empty")
      return
    }

    try {
      val packageManager = reactApplicationContext.packageManager
      var intent = packageManager.getLaunchIntentForPackage(normalizedPackage)

      if (intent == null) {
        val launcherIntent =
          Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
            `package` = normalizedPackage
          }

        val resolveInfo =
          packageManager.queryIntentActivities(launcherIntent, 0).firstOrNull()

        if (resolveInfo != null) {
          intent =
            Intent(Intent.ACTION_MAIN).apply {
              addCategory(Intent.CATEGORY_LAUNCHER)
              component =
                ComponentName(
                  resolveInfo.activityInfo.packageName,
                  resolveInfo.activityInfo.name,
                )
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        }
      }

      if (intent != null) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
      } else {
        promise.reject("LAUNCH_FAILED", "Could not find launch intent for package: $normalizedPackage")
      }
    } catch (e: Exception) {
      promise.reject("LAUNCH_FAILED", e.message, e)
    }
  }

  companion object {
    const val PREFS_NAME = "GentleWaitPrefs"
    const val KEY_PENDING_APP_PACKAGE = "pending_app_package"
    const val KEY_PENDING_APP_LABEL = "pending_app_label"
    const val KEY_PENDING_APP_TS = "pending_app_ts"
    const val KEY_COOLDOWN_DURATION = "cooldown_duration"
    const val KEY_SELECTED_APPS_JSON = "selected_apps_json"
    const val KEY_SELECTED_APPS_SET = "selected_apps_set"
    private const val MIN_COOLDOWN_MS = 15_000L

    fun handledKey(packageName: String): String = "handled_$packageName"
  }

  private fun getDefaultLauncherPackage(packageManager: PackageManager): String? {
    val launchIntent =
      Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_HOME)
      }

    val resolveInfo = packageManager.resolveActivity(
      launchIntent,
      PackageManager.MATCH_DEFAULT_ONLY,
    )

    return resolveInfo?.activityInfo?.packageName
  }
}
