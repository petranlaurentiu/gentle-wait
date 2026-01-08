# Native Integration Example

This document shows how to integrate the Android native modules with the React Native code once the app is built and running.

## Syncing Settings with Native Storage

The accessibility service stores selected apps in SharedPreferences. To keep them in sync with the React Native store:

### 1. After User Selects Apps in Onboarding

```typescript
import { setSelectedApps } from '@/src/services/native';
import { useAppStore } from '@/src/services/storage';

// In onboarding.tsx after user confirms selection:
const handleNext = async () => {
  const selectedApps = availableApps.filter((app) =>
    selectedAppSet.has(app.packageName)
  );

  // Save to React Native store
  updateSettings({ selectedApps, pauseDurationSec: pauseDuration });

  // Also sync to native storage (for accessibility service)
  await setSelectedApps(selectedApps);

  router.replace('/home');
};
```

## Checking Accessibility Service Status

Add this to onboarding permissions screen:

```typescript
import { isAccessibilityServiceEnabled, openAccessibilitySettings } from '@/src/services/native';

const PermissionsStep = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const isEnabled = await isAccessibilityServiceEnabled();
    setEnabled(isEnabled);
  };

  const handleEnable = async () => {
    await openAccessibilitySettings();
    // User returns from settings, check again
    setTimeout(() => checkStatus(), 500);
  };

  return (
    <View>
      <Text>Accessibility Service: {enabled ? '✓ Enabled' : '✗ Disabled'}</Text>
      {!enabled && (
        <Button onPress={handleEnable} label="Enable in Settings" />
      )}
    </View>
  );
};
```

## Handling Pending Interceptions

When the accessibility service detects an app launch, it starts the PauseInterceptActivity, which then launches the main app with intent extras. Handle this in the root layout:

```typescript
// In app/_layout.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getPendingInterception } from '@/src/services/native';
import { useAppStore } from '@/src/services/storage';

export default function RootLayout() {
  const router = useRouter();
  const setCurrentInterceptionEvent = useAppStore(
    (state) => state.setCurrentInterceptionEvent
  );

  useEffect(() => {
    // Check for pending interception from accessibility service
    checkPendingInterception();
  }, []);

  const checkPendingInterception = async () => {
    const pending = await getPendingInterception();
    if (pending) {
      setCurrentInterceptionEvent({
        id: `${pending.ts}`,
        ts: pending.ts,
        appPackage: pending.appPackage,
        appLabel: pending.appLabel,
        action: 'opened_anyway', // Will be overwritten by user action
      });

      // Navigate to pause screen
      router.push({
        pathname: '/pause',
        params: {
          appPackage: pending.appPackage,
          appLabel: pending.appLabel,
        },
      });
    }
  };

  return (
    <ThemeProvider>
      {/* ... rest of layout ... */}
    </ThemeProvider>
  );
}
```

## Example: Complete Permissions Flow

```typescript
// In permissions step of onboarding
import {
  isAccessibilityServiceEnabled,
  openAccessibilitySettings
} from '@/src/services/native';

const PermissionsStep = () => {
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      checkServiceStatus();
    }, [])
  );

  const checkServiceStatus = async () => {
    const enabled = await isAccessibilityServiceEnabled();
    setServiceEnabled(enabled);
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    await openAccessibilitySettings();
    setLoading(false);

    // Give user time to enable, then recheck
    setTimeout(() => checkServiceStatus(), 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enable Accessibility Permission</Text>

      <View style={styles.statusBox}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Service Status</Text>
          <Text style={[
            styles.statusValue,
            { color: serviceEnabled ? colors.success : colors.error }
          ]}>
            {serviceEnabled ? '✓ Enabled' : '✗ Disabled'}
          </Text>
        </View>
      </View>

      {!serviceEnabled && (
        <Button
          label="Open Settings"
          onPress={handleRequestPermission}
          disabled={loading}
        />
      )}

      {serviceEnabled && (
        <Text style={styles.confirmText}>
          ✓ Permission enabled! You're all set.
        </Text>
      )}
    </View>
  );
};
```

## Testing Without Native Module (Web/Dev)

If testing on web or before ejecting, the native functions return gracefully:

```typescript
// In src/services/native/index.ts
export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android' || !GentleWaitModule) {
    return false; // Graceful fallback
  }
  // ... actual native call
}
```

So the app continues to work on web, just without the interception feature.

## Debugging Tips

### View Native SharedPreferences

In Android Studio, use Device File Explorer:
```
/data/data/com.gentlewait/shared_prefs/GentleWaitPrefs.xml
```

### View Logcat

```bash
npx react-native log-android
# or
adb logcat
```

Look for:
- `PauseAccessibilityService`: Service logs
- `GentleWaitModule`: Native module logs
- `ReactNativeJS`: React Native logs

### Test Accessibility Service Manually

```bash
adb shell settings put secure enabled_accessibility_services \
  com.gentlewait/.accessibility.PauseAccessibilityService
```

## Common Issues & Solutions

### Service Not Triggering?
1. Check if enabled: Settings > Accessibility > GentleWait (should be ON)
2. Verify package name in service filter matches selected app
3. Check cooldown logic (1500ms between same-app triggers)
4. Ensure `TYPE_WINDOW_STATE_CHANGED` events are firing

### "Cannot find GentleWaitModule"?
1. Verify package registered in `MainApplication.kt`
2. Check build includes native module (run `./gradlew clean` first)
3. Rebuild and reinstall: `npx expo run:android`

### Settings Not Syncing?
1. Ensure `setSelectedApps()` is called after store update
2. Verify SharedPreferences key matches: `SELECTED_APPS_KEY`
3. Check JSON format is valid

---

**Note**: These examples assume the Android native build is complete. See `ANDROID_SETUP.md` for build instructions.
