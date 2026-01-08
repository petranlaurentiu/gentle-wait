# Android Setup for GentleWait

## Prerequisites

This project requires native Android code to implement the Accessibility Service for app interception. Since the project was initialized with `create-expo-app`, you'll need to eject or use `eas build` with custom configuration.

## Option 1: Eject from Expo (Recommended for Development)

```bash
npx expo prebuild --clean
npx expo run:android
```

This will create the `android/` directory with the standard React Native structure.

## Option 2: Use EAS Build (For Production)

Create `eas.json` and configure a custom native build that includes our Android modules.

## AndroidManifest.xml Changes

After ejecting or building, update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest ...>
  <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
  <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />

  <application ...>

    <!-- Existing activities -->
    <activity android:name=".MainActivity" .../>

    <!-- Add PauseInterceptActivity -->
    <activity
      android:name="com.gentlewait.accessibility.PauseInterceptActivity"
      android:theme="@android:style/Theme.Translucent.NoTitleBar"
      android:exported="false" />

    <!-- Register Accessibility Service -->
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
  </application>
</manifest>
```

## String Resources

Create `android/app/src/main/res/values/strings.xml` with:

```xml
<resources>
  <string name="accessibility_service_desc">
    GentleWait Accessibility Service - Detects app launches for mindfulness pauses
  </string>
</resources>
```

## Accessibility Service Configuration

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

## Build & Run

After making these changes:

```bash
npx expo run:android
```

The app will build with the native Android modules included.

## User Activation

Users must manually enable the Accessibility Service:
- Settings > Accessibility > GentleWait > Turn on

The onboarding flow will guide them through this process.

## Notes

- The `PauseAccessibilityService` listens for `TYPE_WINDOW_STATE_CHANGED` events
- When a protected app is detected, it launches `PauseInterceptActivity`
- The activity then navigates to the React Native `/pause` route via Deep Linking
- The service stores selected apps in SharedPreferences, which syncs with the React Native store

## Troubleshooting

1. **Service not triggering**: Verify accessibility service is enabled in Settings
2. **App crashes on launch**: Check AndroidManifest.xml syntax and file paths
3. **Access denied errors**: Ensure `BIND_ACCESSIBILITY_SERVICE` permission is requested
