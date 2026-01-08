# Testing Guide - GentleWait

Comprehensive guide for testing GentleWait on web and Android.

## 🌐 Testing on Web (Right Now)

Perfect for testing UI, navigation, and non-interception features.

### Start the dev server:
```bash
npm start
```

### Navigate to:
```
http://localhost:3000
```
Or use Expo Go on your phone.

### Test these flows on web:

#### ✅ Onboarding
1. Complete all 5 steps:
   - Welcome
   - Select apps (with search)
   - Permissions explainer
   - Pause duration (10-30s)
   - Done
2. Verify settings are saved

#### ✅ Home Dashboard
1. View "Today" stat card
2. View "This Week" summary
3. See selected apps list
4. Click "Insights" and "Settings"

#### ✅ Insights Screen
1. View weekly stats
2. See "Top triggers" list (initially empty)
3. Check 7-day trend chart placeholder

#### ✅ Settings Screen
1. See protected apps list
2. Adjust pause duration
3. Manage prompt frequency
4. View privacy section

#### ✅ Generate Test Data (Development Only)

On the Home screen, you'll see a 🐛 **debug button** in the bottom-right corner (only in dev mode):

**Tap it to:**
1. **Generate 30 Events** — Random events over 7 days
2. **Generate Daily Data** — 3 events per day for 7 days
3. **Clear All Events** — Reset all data

After generating:
- Home shows updated stats
- Insights shows weekly summary + triggers
- Logs appear in browser console

### Commands:
```bash
# Start dev server
npm start

# Run linting (0 errors expected)
npm run lint

# Test a specific screen (if using deep linking)
# In Expo Go: Universal links or custom routing
```

---

## 📱 Testing on Android (When Emulator is Ready)

### Prerequisites:
- Android emulator running or device connected
- Follow `QUICK_START_ANDROID.md` setup guide

### Basic Testing Checklist:

#### Phase 1: Build & Install
- [ ] `npx expo prebuild --clean` succeeds
- [ ] AndroidManifest.xml updates don't break build
- [ ] `npx expo run:android` deploys app successfully
- [ ] App launches without crashing

#### Phase 2: Onboarding
- [ ] Can complete all 5 onboarding steps
- [ ] Settings are saved
- [ ] Can select 2+ apps from the mock list
- [ ] Pause duration picker works

#### Phase 3: Accessibility Service
- [ ] Accessibility Service option appears in Settings > Accessibility
- [ ] Can enable the service
- [ ] No crashes after enabling
- [ ] Service stays enabled after app restart

#### Phase 4: App Interception
- [ ] Open a selected app → Pause screen appears <1 second
- [ ] Breathing circle animates smoothly
- [ ] Can tap reason buttons (they highlight)
- [ ] "Open anyway" button works → launches the app
- [ ] "Close" button works → returns to home/launcher
- [ ] "Take a short pause" → goes to alternatives

#### Phase 5: Alternatives
- [ ] Breathe mode: 20-second timer with animation
- [ ] Reflect mode: Shows prompt (if implemented)
- [ ] Grounding mode: Shows timer and instructions
- [ ] All alternatives log events to database

#### Phase 6: Home Screen
- [ ] Home shows real pause counts after interceptions
- [ ] Stats update correctly
- [ ] Protected apps list displays

#### Phase 7: Insights
- [ ] Weekly stats reflect actual interceptions
- [ ] Top triggers show correct reasons
- [ ] 7-day trend shows real data

#### Phase 8: Debug Menu (still works on Android)
- [ ] 🐛 button visible on Home
- [ ] "Generate 30 Events" works
- [ ] "Clear All Events" works
- [ ] Insights update after generating data

---

## 🔬 Advanced Testing Scenarios

### Scenario 1: Test Accessibility Service Reliability
1. Generate test data with debug menu
2. Enable accessibility service
3. Repeatedly open the same protected app
4. Verify:
   - Pause screen appears every time
   - No race conditions or crashes
   - Service stays responsive

### Scenario 2: Test Stats Accuracy
1. Manually trigger pauses (or use debug menu)
2. Choose different actions:
   - "Open anyway" (count as opens)
   - "Close" (count as closes)
   - "Breathe/Reflect/Ground" (count as alternatives)
3. Verify stats match:
   - Total pauses = opens + closes + alternatives
   - Mindful minutes = sum of alternative durations

### Scenario 3: Test Data Persistence
1. Generate 30 test events
2. View stats on Insights
3. **Force close the app** (Settings > Apps > GentleWait > Force Stop)
4. **Reopen the app**
5. Verify:
   - Events still exist
   - Stats unchanged
   - Data survived app restart

### Scenario 4: Test Onboarding -> Interception Flow
1. Fresh install (or clear app data)
2. Complete onboarding
3. Select 2-3 apps
4. Go back to launcher
5. Try opening each selected app
6. Verify all trigger pause screen

### Scenario 5: Test Permission Revocation
1. Enable accessibility service
2. Open Settings > Accessibility > GentleWait > Turn OFF
3. Try to open a protected app
4. Service should NOT trigger (normal app opens)
5. Re-enable service
6. Service should work again

---

## 🐛 Debugging Tips

### View Logs

**Web:**
```
Open browser DevTools (F12) → Console tab
Look for [Test Data] messages
```

**Android:**
```bash
# View all logs
adb logcat

# Filter for GentleWait logs
adb logcat | grep -i gentlewait

# Filter for accessibility service logs
adb logcat | grep -i "PauseAccessibility"

# Filter for React Native logs
adb logcat | grep ReactNativeJS
```

### Check if Service is Registered
```bash
adb shell dumpsys accessibility
# Should list com.gentlewait.accessibility.PauseAccessibilityService
```

### Check SharedPreferences
```bash
adb shell run-as com.gentlewait cat \
  /data/data/com.gentlewait/shared_prefs/GentleWaitPrefs.xml
```

### Manually Test Service Trigger
```bash
# Simulate window state change to a package
adb shell cmd accessibility-service test-window-state com.instagram.android

# Or just open the app manually
adb shell am start -n com.instagram.android/com.instagram.android.activity.MainActivity
```

---

## ✅ Success Criteria

When all phases pass:

1. **Web**: Onboarding, stats, insights all work
2. **Android**: Accessibility service intercepts app launches
3. **Data**: Events logged correctly, stats accurate
4. **UX**: Breathing animation smooth, no crashes
5. **Persistence**: Data survives app restart

---

## 📊 Sample Test Data

Use the debug menu to quickly generate:

**Option 1: Random 30 Events**
```
Generates 30 events randomly distributed over 7 days
Good for testing trends and aggregations
```

**Option 2: Daily Data (7 days × 3 events)**
```
Generates 21 events: 3 per day for the last 7 days
Good for testing 7-day chart and daily stats
```

**Output example:**
```
[Test Data] Generating 30 test events over 7 days...
[Test Data] ✓ Generated 30 test events
[Test Data] Summary:
  Total events: 30
  By action: {
    opened_anyway: 10,
    closed: 8,
    alternative_breathe: 7,
    alternative_reflect: 3,
    alternative_grounding: 2
  }
  By reason: {
    distraction: 8,
    relax: 6,
    connect: 4,
    ...
  }
  By app: { Instagram: 10, TikTok: 8, Facebook: 5, ... }
  Total mindful time: 15 minutes
```

---

## 🚀 Performance Expectations

### Web Startup
- Bundle: ~1-2s
- Route navigation: <300ms
- Stats calculation: <500ms

### Android (After Eject)
- App launch: ~2-3s
- Pause screen appears: <1s after app tap
- Breathing animation: Smooth 60fps
- Event insertion: <100ms

### Database Queries
- `getRecentEvents(7)`: <50ms
- `getWeeklyStats()`: <100ms
- `getTopTriggers()`: <100ms

If you see delays:
1. Check device specs (emulator slower than real device)
2. Clear app cache: `adb shell pm clear com.gentlewait`
3. Rebuild native code: `./gradlew clean && ./gradlew assembleDebug`

---

## 🔄 Regression Testing

Use this checklist before each build:

```
Web:
  ☐ Onboarding completes
  ☐ Settings saved
  ☐ Home shows data
  ☐ Insights displays stats
  ☐ Debug menu generates data

Android (After Rebuild):
  ☐ App launches
  ☐ Accessibility service enabled
  ☐ Selected app triggers pause
  ☐ All actions log correctly
  ☐ Home/Insights show data
```

---

## 📝 Test Report Template

Use this template to document test sessions:

```
Test Session: [Date] [Tester Name]
Environment: [Web / Android Device / Emulator]
Build: [Version/Git Hash]
Duration: [Time Spent]

Passed:
  ☑ Feature X
  ☑ Feature Y

Failed:
  ☒ Feature Z
     Logs: [Any error messages]
     Steps: [How to reproduce]

Notes:
  - Device info (if Android)
  - OS version
  - Any unusual behavior

Performance:
  - App load: [Time]
  - Pause trigger: [Time]
  - Query speed: [Time]
```

---

## ❓ FAQ

**Q: The pause screen doesn't appear when I open an app**
A: 1) Check accessibility service is enabled
   2) Verify the app is in your selected list
   3) Check logcat for errors
   4) Restart the accessibility service

**Q: Stats show 0 even after testing**
A: 1) Verify events were logged (check SQLite)
   2) Use debug menu to generate test data
   3) Restart the app to refresh stats

**Q: The app crashes on launch**
A: 1) Check AndroidManifest.xml syntax
   2) Verify GentleWaitModule is registered
   3) Run: `./gradlew clean && ./gradlew assembleDebug`

**Q: How do I reset all data?**
A: Use debug menu "Clear All Events" or:
   ```bash
   adb shell pm clear com.gentlewait
   ```

---

**Happy Testing! 🎉**
