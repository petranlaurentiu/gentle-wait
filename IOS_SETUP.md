# iOS Setup for GentleWait

**Last Updated**: January 23, 2026  
**Status**: ✅ Basic Implementation Complete  
**iOS Version Required**: iOS 15.0+

---

## 📋 Overview

iOS implementation uses Apple's **Family Controls** and **DeviceActivity** frameworks to monitor app usage and provide mindful pause moments. This is different from Android's Accessibility Service approach.

---

## ⚠️ Important iOS Limitations

### 1. **Apple Approval Required**
- Family Controls entitlement requires special approval from Apple
- Submit request through [App Store Connect](https://developer.apple.com/contact/request/family-controls-distribution/)
- Approval can take several days and may require justification
- **Development**: Works in Xcode without approval
- **Distribution**: Requires approval for TestFlight and App Store

### 2. **App Interception Differences**
- **Android**: Can intercept BEFORE app opens (blocks launch)
- **iOS**: Can only detect AFTER app starts opening
- User experience differs: pause screen appears slightly after app launch

### 3. **Direct App Launch Not Supported**
- iOS doesn't allow third-party apps to launch other apps by bundle ID
- "Open anyway" button won't work the same as Android
- Workaround: User manually switches to the app

---

## 🛠️ Setup Instructions

### Prerequisites
- Xcode 14+ installed
- iOS 15.0+ deployment target
- Mac with Apple Silicon or Intel processor
- Apple Developer account (for device testing)

---

## Step 1: Add Files to Xcode Project

The following files have been created and need to be added to your Xcode project:

1. **`ios/gentlewait/GentleWaitModule.swift`** - Native module implementation
2. **`ios/gentlewait/GentleWaitModule.m`** - Objective-C bridge

### Add to Xcode:
1. Open `ios/gentlewait.xcworkspace` in Xcode
2. Right-click on the `gentlewait` folder in Xcode
3. Select "Add Files to gentlewait..."
4. Select both `GentleWaitModule.swift` and `GentleWaitModule.m`
5. Ensure "Copy items if needed" is **unchecked** (files already in folder)
6. Ensure "Add to targets: gentlewait" is **checked**
7. Click "Add"

---

## Step 2: Configure Xcode Project Settings

### 2.1 Update Deployment Target
1. Select the project in Xcode (top-level "gentlewait")
2. Select the "gentlewait" target
3. Go to "General" tab
4. Set **Minimum Deployments** to **iOS 15.0** or higher

### 2.2 Add Family Controls Capability
1. Select the "gentlewait" target
2. Go to "Signing & Capabilities" tab
3. Click "+ Capability"
4. Search for and add **"Family Controls"**
5. Verify the entitlement appears in the list

The entitlements file has already been updated with:
```xml
<key>com.apple.developer.family-controls</key>
<true/>
```

### 2.3 Add Required Frameworks
The following frameworks are automatically linked via CocoaPods:
- **FamilyControls.framework**
- **ManagedSettings.framework**
- **DeviceActivity.framework**

Verify in "General" > "Frameworks, Libraries, and Embedded Content"

---

## Step 3: Install iOS Dependencies

Run the following commands to install iOS pods:

```bash
cd ios
pod install
cd ..
```

This will install:
- React Native dependencies
- Expo modules
- Additional iOS frameworks

---

## Step 4: Build for iOS

### Simulator (Quick Test)
```bash
npm run ios
```

This will:
- Build the iOS app
- Launch iOS Simulator
- Install and run the app

### Physical Device (Full Testing)
```bash
# Connect your iPhone via USB
npm run ios -- --device
```

**Note**: Family Controls features may have limited functionality in Simulator. Physical device testing is recommended.

---

## Step 5: Request Family Controls Authorization

When the app launches, users need to authorize Family Controls:

1. Open the app
2. Go through onboarding
3. When prompted, tap "Enable App Monitoring"
4. System dialog appears requesting permission
5. User taps "Allow" to grant authorization

The authorization is handled by:
```typescript
import { requestServiceAuthorization } from '@/src/services/native';

await requestServiceAuthorization(); // iOS: Family Controls, Android: Accessibility
```

---

## 📱 Testing on iOS

### Testing Checklist

#### Basic Functionality
- [ ] App builds without errors in Xcode
- [ ] App launches on iOS Simulator
- [ ] Onboarding flow displays correctly
- [ ] Can request Family Controls authorization
- [ ] Authorization status persists after app restart

#### App Selection (Manual for Now)
- [ ] Can select apps in onboarding
- [ ] Selected apps save to UserDefaults
- [ ] Settings screen shows selected apps

#### Interception (Requires DeviceActivity Extension)
- [ ] App usage is detected (requires extension implementation)
- [ ] Pause screen appears when protected app opens
- [ ] User can choose action (continue, close, alternatives)
- [ ] Events are logged to SQLite

---

## 🔧 Troubleshooting

### Build Errors

#### Error: "No such module 'FamilyControls'"
**Solution**:
1. Run `cd ios && pod install`
2. Open `gentlewait.xcworkspace` (not `.xcodeproj`)
3. Clean build folder: Product > Clean Build Folder
4. Rebuild

#### Error: "Entitlements file not found"
**Solution**:
1. Verify `gentlewait.entitlements` exists in `ios/gentlewait/`
2. In Xcode, select target > "Signing & Capabilities"
3. Verify entitlements file path is correct

#### Error: "Module 'GentleWaitModule' not found"
**Solution**:
1. Verify `GentleWaitModule.swift` and `.m` are added to Xcode project
2. Check they're in the target membership (File Inspector panel)
3. Verify bridging header is configured correctly

### Runtime Errors

#### Authorization Always Returns False
**Solution**:
- Family Controls authorization requires user action
- Must be tested on a physical device (limited Simulator support)
- Ensure iOS version is 15.0+

#### App Interception Not Working
**Solution**:
- DeviceActivity monitoring requires an App Extension (Phase 2.2)
- This is not yet fully implemented
- For now, you can manually trigger the pause screen for testing

---

## 🚧 Phase 2.2: DeviceActivity Extension (Advanced)

To fully implement app interception on iOS, you need to create a **DeviceActivity Monitor Extension**. This is a separate app extension that runs in the background.

### Extension Setup (Future Implementation)

1. **Create Extension in Xcode**:
   - File > New > Target
   - Select "Device Activity Monitor Extension"
   - Name it "GentleWaitMonitor"

2. **Implement Monitor**:
```swift
import DeviceActivity

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        // App usage started
        super.intervalDidStart(for: activity)
    }
    
    override func intervalDidEnd(for activity: DeviceActivityName) {
        // App usage ended
        super.intervalDidEnd(for: activity)
    }
}
```

3. **Schedule Monitoring**:
```swift
let center = DeviceActivityCenter()
let schedule = DeviceActivitySchedule(
    intervalStart: DateComponents(hour: 0),
    intervalEnd: DateComponents(hour: 23, minute: 59),
    repeats: true
)
try? await center.startMonitoring(.daily, during: schedule)
```

4. **Communicate with Main App**:
   - Use App Groups to share data
   - Set pending interception in shared UserDefaults
   - Main app checks on launch/activation

**Note**: This is advanced setup and requires careful Xcode configuration. Recommended for Phase 2 after basic functionality is tested.

---

## 📚 iOS-Specific Code Files

### Created Files
- ✅ `ios/gentlewait/GentleWaitModule.swift` - Native module
- ✅ `ios/gentlewait/GentleWaitModule.m` - Objective-C bridge
- ✅ `ios/gentlewait/gentlewait.entitlements` - Updated with Family Controls
- ✅ `ios/gentlewait/Info.plist` - Updated with usage description

### React Native Integration
- ✅ `src/services/native/index.ts` - Updated to support iOS and Android
- ✅ Cross-platform API for both platforms

### Documentation
- ✅ `IOS_SETUP.md` - This file
- ✅ `IOS_IMPLEMENTATION_PROGRESS.md` - Progress tracking

---

## 🎯 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Family Controls Authorization | ✅ Complete | Request/check authorization |
| App Selection Storage | ✅ Complete | Save/retrieve selected apps |
| Pending Interception API | ✅ Complete | Store/retrieve interception events |
| Native Module Bridge | ✅ Complete | Swift to React Native |
| Cross-Platform Service Layer | ✅ Complete | Works on iOS & Android |
| DeviceActivity Extension | ⏳ Planned | Required for automatic detection |
| App Launch Detection | ⏳ Planned | Requires extension |

---

## 🔐 Privacy & Permissions

### Info.plist Usage Description
Already added:
```xml
<key>NSFamilyControlsUsageDescription</key>
<string>GentleWait needs access to monitor app usage to provide mindful pause moments before opening distracting apps.</string>
```

This description is shown to users when requesting Family Controls authorization.

### What Family Controls Can Access
- Which apps are opened and for how long
- Web browsing activity (if configured)
- **Cannot** access app content, messages, or personal data
- User controls which apps are monitored

---

## 📝 Development Notes

### Testing Without DeviceActivity Extension

For development and testing before implementing the full extension:

1. **Manual Interception Testing**:
```typescript
// Simulate an interception event
import { NativeModules } from 'react-native';
const { GentleWaitModule } = NativeModules;

await GentleWaitModule.setPendingInterception(
  'com.example.app',
  'Example App',
  Date.now()
);

// App will detect this on next launch
```

2. **Test Authorization Flow**:
```typescript
import { isServiceEnabled, requestServiceAuthorization } from '@/src/services/native';

const isAuthorized = await isServiceEnabled(); // Check status
if (!isAuthorized) {
  await requestServiceAuthorization(); // Request permission
}
```

3. **Test Settings Persistence**:
```typescript
import { setSelectedApps, getSelectedApps } from '@/src/services/native';

await setSelectedApps([
  { packageName: 'com.example.app1', label: 'App 1' },
  { packageName: 'com.example.app2', label: 'App 2' }
]);

const apps = await getSelectedApps(); // Verify saved
```

---

## 🚀 Next Steps

1. **Test Basic Implementation**:
   - Build and run on iOS Simulator
   - Test authorization flow
   - Verify settings persistence

2. **Test on Physical Device**:
   - Family Controls requires device testing
   - Test authorization on real iOS device
   - Verify user experience

3. **Implement DeviceActivity Extension** (Phase 2.2):
   - Create App Extension in Xcode
   - Implement activity monitoring
   - Set up App Groups for data sharing
   - Test automatic app detection

4. **Refine User Experience**:
   - Handle iOS-specific edge cases
   - Improve onboarding for iOS users
   - Add iOS-specific help documentation

---

## 📞 Support Resources

- [Family Controls Documentation](https://developer.apple.com/documentation/familycontrols)
- [DeviceActivity Framework](https://developer.apple.com/documentation/deviceactivity)
- [ManagedSettings Documentation](https://developer.apple.com/documentation/managedsettings)
- [Request Family Controls Entitlement](https://developer.apple.com/contact/request/family-controls-distribution/)

---

**Status**: ✅ Basic implementation complete, ready for initial testing  
**Next Phase**: DeviceActivity Extension for automatic app detection  
**Estimated Time to Full Implementation**: 4-6 hours additional work
