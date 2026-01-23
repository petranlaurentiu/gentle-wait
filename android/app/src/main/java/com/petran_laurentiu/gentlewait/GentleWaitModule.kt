package com.petran_laurentiu.gentlewait

import android.content.Context
import android.content.Intent
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

  override fun getName(): String = "GentleWaitModule"

  @ReactMethod
  fun isAccessibilityServiceEnabled(promise: Promise) {
    try {
      val enabledServices =
        Settings.Secure.getString(reactApplicationContext.contentResolver,
          Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
      val packageName = reactApplicationContext.packageName
      val shortComponent = "$packageName/.accessibility.PauseAccessibilityService"
      val fullComponent =
        "$packageName/$packageName.accessibility.PauseAccessibilityService"
      val isEnabled =
        enabledServices.contains(shortComponent) || enabledServices.contains(fullComponent)
      promise.resolve(isEnabled)
    } catch (e: Exception) {
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
      val jsonArray = JSONArray()
      for (i in 0 until packageNames.size()) {
        val value = packageNames.getString(i)
        if (value != null) {
          jsonArray.put(value)
        }
      }
      prefs.edit().putString(KEY_SELECTED_APPS, jsonArray.toString()).apply()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SET_SELECTED_APPS_FAILED", e)
    }
  }

  @ReactMethod
  fun getSelectedApps(promise: Promise) {
    val value = prefs.getString(KEY_SELECTED_APPS, "[]") ?: "[]"
    promise.resolve(value)
  }

  @ReactMethod
  fun getPendingInterception(promise: Promise) {
    val appPackage = prefs.getString(KEY_PENDING_APP_PACKAGE, null)
    val appLabel = prefs.getString(KEY_PENDING_APP_LABEL, null)
    val ts = prefs.getLong(KEY_PENDING_APP_TS, 0L).let { stored ->
      if (stored != 0L) stored else prefs.getLong(KEY_PENDING_TS, 0L)
    }

    if (appPackage == null || appLabel == null || ts == 0L) {
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
    val pendingPackage = prefs.getString(KEY_PENDING_APP_PACKAGE, null)
    if (pendingPackage != null && pendingPackage == appPackage) {
      prefs.edit()
        .remove(KEY_PENDING_APP_PACKAGE)
        .remove(KEY_PENDING_APP_LABEL)
        .remove(KEY_PENDING_APP_TS)
        .remove(KEY_PENDING_TS)
        .putLong("handled_$appPackage", System.currentTimeMillis())
        .apply()
    } else {
      prefs.edit()
        .putLong("handled_$appPackage", System.currentTimeMillis())
        .apply()
    }
    promise.resolve(true)
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    try {
      val intent = reactApplicationContext.packageManager.getLaunchIntentForPackage(packageName)
      if (intent != null) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
      } else {
        promise.reject("LAUNCH_FAILED", "Could not find launch intent for package: $packageName")
      }
    } catch (e: Exception) {
      promise.reject("LAUNCH_FAILED", e.message, e)
    }
  }

  companion object {
    private const val PREFS_NAME = "GentleWaitPrefs"
    private const val KEY_SELECTED_APPS = "selected_apps"
    private const val KEY_PENDING_APP_PACKAGE = "pending_app_package"
    private const val KEY_PENDING_APP_LABEL = "pending_app_label"
    private const val KEY_PENDING_APP_TS = "pending_app_ts"
    private const val KEY_PENDING_TS = "pending_ts"
  }
}
