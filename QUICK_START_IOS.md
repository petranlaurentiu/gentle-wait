# Quick Start Guide - iOS Setup

**Estimated Time**: 20-30 minutes  
**Difficulty**: Medium (requires Xcode)  
**iOS Version Required**: iOS 15.0+

---

## Prerequisites

- ✅ Mac with macOS (Xcode only runs on Mac)
- ✅ Xcode 14+ installed ([Download from App Store](https://apps.apple.com/app/xcode/id497799835))
- ✅ Node.js and npm installed
- ✅ iOS Simulator or physical iOS device

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd /path/to/gentle-wait
npm install
```

This installs React Native dependencies including `react-native-device-activity` for iOS Screen Time API support.

---

## Step 2: Add Swift Files to Xcode (5 minutes)

The iOS native files have been created but need to be added to Xcode:

### 2.1 Open Xcode Workspace

```bash
cd ios
open gentlewait.xcworkspace
```

⚠️ **Important**: Open `.xcworkspace`, NOT `.xcodeproj`

### 2.2 Add Swift Files

In Xcode:
1. In the left sidebar (Project Navigator), right-click the `gentlewait` folder
2. Select **"Add Files to gentlewait..."**
3. Navigate to `ios/gentlewait/` folder
4. Select these files:
   - `GentleWaitModule.swift`
   - `GentleWaitModule.m`
   - `DeviceActivityHelper.swift` (optional)
5. **Uncheck** "Copy items if needed" (files are already in folder)
6. **Check** "Add to targets: gentlewait"
7. Click **"Add"**

### 2.3 Verify Bridging Header

Xcode may prompt to create a bridging header. If it does:
- Click **"Create Bridging Header"**

If not prompted, verify the existing bridging header:
1. Select project > target `gentlewait`
2. Go to "Build Settings"
3. Search for "Bridging Header"
4. Verify path: `gentlewait/gentlewait-Bridging-Header.h`

---

## Step 3: Configure Xcode Settings (5 minutes)

### 3.1 Set Deployment Target

1. Select the project (top-level "gentlewait")
2. Select target: `gentlewait`
3. Go to "General" tab
4. Set **Minimum Deployments** to **iOS 15.0** or higher

### 3.2 Verify Family Controls Capability

The entitlements file has been updated, but verify in Xcode:

1. Select target `gentlewait`
2. Go to "Signing & Capabilities" tab
3. Verify **"Family Controls"** appears in the capabilities list
4. If not, click "+ Capability" and add it

### 3.3 Configure Signing (Required for Device Testing)

1. In "Signing & Capabilities" tab
2. Select your **Team** (Apple Developer account)
3. Xcode will automatically manage provisioning profiles

---

## Step 4: Install iOS Pods (3 minutes)

Close Xcode temporarily, then in Terminal:

```bash
cd ios

# If you have CocoaPods installed:
pod install

# If pod command not found:
sudo gem install cocoapods
pod install
```

This installs:
- React Native pods
- Expo modules
- iOS frameworks (FamilyControls, DeviceActivity, etc.)

**Expected output**: "Pod installation complete! There are X dependencies..."

---

## Step 5: Build & Run on Simulator (5 minutes)

### Option A: Using npm (Recommended)

```bash
cd ..  # Back to project root
npm run ios
```

This will:
- Open Xcode
- Build the app
- Launch iOS Simulator
- Install and run the app

### Option B: Using Xcode

1. Reopen Xcode workspace: `open ios/gentlewait.xcworkspace`
2. Select target: `gentlewait`
3. Select device: Choose iPhone simulator (e.g., "iPhone 15")
4. Click ▶️ (Run) button or press ⌘R

---

## Step 6: Test Authorization Flow (5 minutes)

Once the app launches in Simulator:

1. **Complete Onboarding**:
   - Follow the welcome screens
   - When prompted for app monitoring permission:
     - On iOS: Tap "Enable App Monitoring"
     - System dialog requests Family Controls authorization
     - Tap "Allow"

2. **Select Apps**:
   - Choose apps to monitor (currently uses mock list)
   - Tap "Next" to save selection

3. **Verify Settings**:
   - Go to app Settings screen
   - Verify selected apps are saved
   - Close app and reopen
   - Settings should persist

---

## Step 7: Test on Physical Device (Optional, 10 minutes)

Family Controls features work best on physical devices.

### 7.1 Connect Device

1. Connect iPhone via USB cable to Mac
2. Trust the device (unlock iPhone and tap "Trust")
3. In Xcode, select your device from device menu

### 7.2 Configure Signing

Xcode may prompt to configure signing:
1. Select your Apple ID team
2. Click "Register Device" if prompted
3. Xcode handles provisioning automatically

### 7.3 Build & Run

```bash
npm run ios -- --device
```

Or in Xcode, select your device and click Run (⌘R)

---

## ✅ Testing Checklist

### Basic Functionality
- [ ] App builds without errors
- [ ] App launches in Simulator
- [ ] Onboarding screens display correctly
- [ ] No crashes during navigation

### iOS-Specific Features
- [ ] Family Controls authorization request appears
- [ ] Authorization dialog shows app name and description
- [ ] Authorization status is saved after app restart
- [ ] Selected apps persist in settings

### Cross-Platform
- [ ] App still works on Android (if you've tested before)
- [ ] Native module gracefully handles unsupported platforms
- [ ] Web version still works (if applicable)

---

## 🐛 Troubleshooting

### Build Errors

#### "No such module 'FamilyControls'"
**Fix**:
```bash
cd ios
pod install
# Then rebuild in Xcode
```

#### "Module 'GentleWaitModule' not found"
**Fix**:
1. Verify Swift files are added to Xcode project (Step 2.2)
2. Check target membership (select file, File Inspector panel on right)
3. Clean build: Product > Clean Build Folder (⇧⌘K)
4. Rebuild

#### "Bridging header not found"
**Fix**:
1. In Xcode: Build Settings > "Objective-C Bridging Header"
2. Set to: `gentlewait/gentlewait-Bridging-Header.h`
3. Verify file exists at `ios/gentlewait/gentlewait-Bridging-Header.h`

#### "Code signing failed"
**Fix** (Device testing only):
1. Select target > "Signing & Capabilities"
2. Select your Team
3. Let Xcode automatically manage signing
4. If device not registered, Xcode will prompt to register it

### Runtime Errors

#### Authorization Dialog Doesn't Appear
**Possible causes**:
- iOS Simulator limitations (try physical device)
- iOS version < 15.0 (check deployment target)
- Family Controls capability not added (verify in Xcode)

#### "GentleWaitModule is null"
**Fix**:
1. Verify native module is linked (rebuild app)
2. Check `.m` file is in Xcode project
3. Clean and rebuild

---

## 📝 Manual Testing Script

Use this to thoroughly test the iOS implementation:

```typescript
// In onboarding or settings screen
import { 
  isServiceEnabled, 
  requestServiceAuthorization,
  setSelectedApps,
  getSelectedApps 
} from '@/src/services/native';

// 1. Check authorization status
const isAuthorized = await isServiceEnabled();
console.log('iOS authorized:', isAuthorized);

// 2. Request authorization (if not authorized)
if (!isAuthorized) {
  const success = await requestServiceAuthorization();
  console.log('Authorization result:', success);
}

// 3. Save selected apps
await setSelectedApps([
  { packageName: 'com.apple.MobileSafari', label: 'Safari' },
  { packageName: 'com.apple.mobilemail', label: 'Mail' }
]);

// 4. Retrieve selected apps
const apps = await getSelectedApps();
console.log('Retrieved apps:', apps);

// 5. Test pending interception (manual)
import { NativeModules } from 'react-native';
const { GentleWaitModule } = NativeModules;
await GentleWaitModule.setPendingInterception(
  'com.apple.MobileSafari',
  'Safari',
  Date.now()
);
// Close and reopen app to test interception detection
```

---

## 🚧 Known Limitations

### iOS vs Android Differences

| Feature | iOS | Android |
|---------|-----|---------|
| **Permission Model** | Family Controls authorization | Accessibility Service |
| **Interception Timing** | After app starts opening | Before app opens |
| **Direct App Launch** | ❌ Not supported | ✅ Supported |
| **Automatic Detection** | Requires App Extension | Built-in |
| **Apple Approval** | Required for App Store | Not required |

### Current Implementation Status

✅ **Working**:
- Family Controls authorization
- App selection storage
- Settings persistence
- Cross-platform native module
- Basic iOS support

⏳ **Requires Manual Setup** (in Xcode):
- DeviceActivity Monitor Extension for automatic app detection
- App Groups for data sharing between extension and main app
- Full automatic interception flow

📚 **For Full Implementation**, see:
- `IOS_SETUP.md` - Detailed setup instructions
- `IOS_IMPLEMENTATION_PROGRESS.md` - Implementation roadmap
- Section "Phase 2.2: DeviceActivity Extension" in `IOS_SETUP.md`

---

## 🎯 Next Steps After Testing

Once basic iOS functionality is verified:

1. **Implement DeviceActivity Extension**:
   - Create extension in Xcode (File > New > Target)
   - Implement automatic app launch detection
   - Set up App Groups for communication

2. **Test Full Flow**:
   - Open protected app on iOS
   - Verify pause screen appears
   - Test user actions (continue, close, alternatives)

3. **Refine User Experience**:
   - Handle iOS-specific edge cases
   - Improve iOS onboarding messaging
   - Add iOS-specific help content

4. **Submit for Apple Review**:
   - Request Family Controls distribution entitlement
   - Prepare App Store submission
   - Include privacy policy and usage justification

---

## 📚 Additional Resources

- [Apple Family Controls Documentation](https://developer.apple.com/documentation/familycontrols)
- [DeviceActivity Framework Guide](https://developer.apple.com/documentation/deviceactivity)
- [Family Controls Entitlement Request](https://developer.apple.com/contact/request/family-controls-distribution/)
- [React Native iOS Native Modules](https://reactnative.dev/docs/native-modules-ios)

---

## ✨ Success!

If you've completed all steps and the app runs:

🎉 **Congratulations!** You now have GentleWait running on iOS with:
- ✅ Family Controls authorization working
- ✅ App selection and settings persistence
- ✅ Cross-platform native module
- ✅ Foundation for full app interception

**Next**: Implement DeviceActivity Extension for automatic app detection (see `IOS_SETUP.md` Phase 2.2)

---

**Total Time**: ~20-30 minutes  
**Difficulty**: Medium (requires Xcode familiarity)  
**Result**: iOS app running with basic Family Controls integration
