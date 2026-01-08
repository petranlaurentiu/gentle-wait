# Quick Start Guide - Android Setup

Follow these steps to get GentleWait running on your Android emulator or device.

## Prerequisites

- Android emulator running or Android device connected
- Node.js and npm installed
- Expo CLI: `npm install -g expo-cli`
- Android SDK (for `adb` commands)

## Step 1: Eject from Expo (1-2 minutes)

This creates the native Android directory structure:

```bash
cd /path/to/gentle-wait
npx expo prebuild --clean
```

This will:
- Create `android/` directory with native project
- Update `package.json` with native dependencies
- Create `app.json` config

**If prompted about package name**, use: `com.gentlewait`

## Step 2: Update AndroidManifest.xml (5 minutes)

Open `android/app/src/main/AndroidManifest.xml` and add these permissions and services:

### Add permissions (after `<manifest>` tag):
```xml
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
```

### Add activity (inside `<application>`):
```xml
<activity
  android:name="com.gentlewait.accessibility.PauseInterceptActivity"
  android:theme="@android:style/Theme.Translucent.NoTitleBar"
  android:exported="false" />
```

### Add Accessibility Service (inside `<application>`):
```xml
<service
  android:name="com.gentlewait.accessibility.PauseAccessibilityService"
  android:description="@string/accessibility_service_desc"
  android:enabled="true"
  android:exported="true"
  android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
  <intent-filter>
    <action android:name="android.accessibilityservice.AccessibilityService" />
  </intent-filter>
  <meta-data
    android:name="android.accessibilityservice"
    android:resource="@xml/accessibility_service_config" />
</service>
```

## Step 3: Create String Resources (2 minutes)

Create `android/app/src/main/res/values/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="app_name">GentleWait</string>
  <string name="accessibility_service_desc">
    GentleWait - Mindful pauses before opening distracting apps
  </string>
</resources>
```

## Step 4: Create Accessibility Service Config (2 minutes)

Create `android/app/src/main/res/xml/accessibility_service_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<accessibility-service
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:accessibilityEventTypes="typeWindowStateChanged"
  android:accessibilityFeedbackType="feedbackGeneric"
  android:accessibilityFlags="flagDefault"
  android:canRetrieveWindowContent="false"
  android:description="@string/accessibility_service_desc"
  android:notificationTimeout="100" />
```

## Step 5: Register Native Module (3 minutes)

Open `android/app/src/main/java/com/gentlewait/MainActivity.kt` (or `.java`):

Add this import at the top:
```kotlin
import com.gentlewait.GentleWaitPackage
```

If using Kotlin, your `MainActivity` should look like:
```kotlin
package com.gentlewait

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return DefaultReactActivityDelegate(
      this,
      mainComponentName,
      DefaultNewArchitectureEntryPoint.fabricEnabled
    )
  }
}
```

Then in `MainApplication.kt` (same directory), add:
```kotlin
import com.gentlewait.GentleWaitPackage

class MainApplication : Application(), ReactApplication {
  // ... existing code ...

  override fun getPackages(): List<ReactPackage> {
    return mutableListOf(
      MainReactPackage(),
      GentleWaitPackage(),  // Add this line
      // ... other packages ...
    )
  }
}
```

## Step 6: Build and Run (2-3 minutes)

```bash
# Clear cache and rebuild
npx expo run:android --clear
```

Or if using local Android build tools:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

## Step 7: Enable Accessibility Service (Manual)

Once the app is running:

1. **Open Settings** on your emulator/device
2. **Navigate to**: Accessibility > GentleWait
3. **Toggle ON**: "Use GentleWait"
4. **Confirm** the security warning

## Step 8: Test the Interception

1. **Open the app** → Complete onboarding
2. **Select some apps** (at least 2) from the list
3. **Close the app**
4. **Try opening one of your selected apps** from the home screen
5. **Pause screen should appear!** ✅

---

## Troubleshooting

### "GentleWaitPackage not found"
- Verify the Kotlin files are in `android/app/src/main/java/com/gentlewait/`
- Check package name matches: `com.gentlewait`
- Run `./gradlew clean` and rebuild

### "Accessibility Service not appearing in Settings"
- Verify `AndroidManifest.xml` has the service declaration
- Check `accessibility_service_config.xml` exists in `res/xml/`
- Run `adb shell dumpsys accessibility` to verify service registration
- Restart the emulator/device

### "Service not triggering when opening apps"
- Confirm Accessibility Service is enabled in Settings > Accessibility
- Check Logcat: `adb logcat | grep PauseAccessibility`
- Verify selected apps list is saved (check app settings)
- Try opening a different selected app

### "Permission errors during build"
- Delete `android/.gradle` cache: `rm -rf android/.gradle`
- Delete build artifacts: `rm -rf android/app/build`
- Rebuild: `./gradlew clean && ./gradlew assembleDebug`

### "Device/Emulator not found"
- List devices: `adb devices`
- Create emulator: `android` (SDK Manager) or Android Studio's AVD Manager
- Or use: `npx expo run:android` (auto-selects running device/emulator)

---

## Commands Reference

```bash
# Start dev server (web)
npm start

# Start on emulator/device
npx expo run:android

# Clear Expo cache + rebuild
npx expo run:android --clear

# View Android logs
adb logcat

# Filter for GentleWait logs
adb logcat | grep -i gentlewait

# List connected devices
adb devices

# Uninstall app from device
adb uninstall com.gentlewait

# Open accessibility settings
adb shell am start -a android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS
```

---

## What Happens on First Launch

1. **Entry point** (`index.tsx`) checks if onboarding is done
2. **Onboarding flow** walks user through:
   - Welcome screen
   - App selection (with mock app list)
   - Permissions explainer
   - Pause duration picker
   - Done confirmation
3. **Settings saved** to MMKV and SharedPreferences (native)
4. **Home screen** displays with today's stats (0 initially)
5. **Accessibility Service** listens for app launches

---

## Testing Checklist

Once running on Android:

- [ ] App launches without crashing
- [ ] Onboarding flow completes (all 5 steps)
- [ ] Can select multiple apps
- [ ] Settings persist after app close/reopen
- [ ] Accessibility Service shows as enabled in Settings
- [ ] Opening selected app triggers Pause screen
- [ ] Breathing animation plays (circle grows/shrinks)
- [ ] Can tap reason buttons
- [ ] Can tap "Open anyway" or "Close"
- [ ] Stats are calculated and shown on Home
- [ ] Insights screen shows data

---

## Next Steps After Testing

Once the basic flow works:

1. **Customize selected apps** — Fetch real installed apps (not mock)
2. **Add reflection prompts** — Full prompt library with choices
3. **Build APK for testing** — `./gradlew assembleRelease`
4. **Enable Deep Linking** — Integrate with native intent handling
5. **Add haptic feedback** — Vibration on button press

---

**Estimated Setup Time**: 15-20 minutes
**Difficulty**: Medium (mostly copy-paste)

Once done, you'll have a fully functional Android app with app interception working! 🎉
