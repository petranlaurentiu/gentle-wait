# Production Build Guide

Complete guide for building and deploying Gentle Wait to production.

## 📋 Prerequisites

### For iOS:
- Mac with Xcode 15+ installed
- Apple Developer Account ($99/year)
- iOS device for testing (iOS 15+ required for Family Controls)
- CocoaPods installed

### For Android:
- Android Studio
- Google Play Developer Account ($25 one-time)
- Android device for testing (API 26+ / Android 8.0+)

### General:
- EAS CLI installed: `npm install -g eas-cli`
- Expo account (free)
- Git for version control

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file (if not exists):
```bash
EXPO_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
```

### 3. iOS Setup (One-Time)

#### Add Swift Files to Xcode:
```bash
open ios/gentlewait.xcworkspace
```

In Xcode:
1. Right-click on `gentlewait` folder → "Add Files to 'gentlewait'..."
2. Navigate to `ios/gentlewait/`
3. Select both:
   - `GentleWaitModule.swift`
   - `GentleWaitModule.m`
4. ✅ Check "Copy items if needed"
5. ✅ Check "Add to targets: gentlewait"
6. Click "Add"

#### Verify Entitlements:
- Select project in Xcode
- Go to "Signing & Capabilities"
- Ensure "Family Controls" capability is added
- If not: Click "+ Capability" → Search "Family Controls" → Add

#### Configure Signing:
- Select your team/provisioning profile
- Ensure bundle identifier: `com.petran-laurentiu.gentlewait`

### 4. Android Setup (One-Time)

Already configured! Just ensure:
- Android Studio is installed
- USB debugging enabled on device
- Device connected or emulator running

---

## 🔨 Build Commands

### Development Builds (with Metro bundler)

#### iOS Simulator:
```bash
npm run ios
```

#### Android Emulator/Device:
```bash
npm run android
```

### Preview Builds (APK/IPA for testing)

#### iOS (TestFlight/Ad-hoc):
```bash
eas build --profile preview --platform ios
```

#### Android (APK):
```bash
eas build --profile preview --platform android
```

### Production Builds (Store-ready)

#### iOS (App Store):
```bash
eas build --profile production --platform ios
```

#### Android (Play Store):
```bash
eas build --profile production --platform android
```

#### Both Platforms:
```bash
eas build --profile production --platform all
```

---

## 📦 Build Profiles Explained

### Development
- **Purpose**: Testing on simulators/emulators with hot reload
- **Distribution**: Local only
- **Build time**: Fast (~2-5 min)
- **Best for**: Active development

### Preview
- **Purpose**: Internal testing on real devices
- **Distribution**: Internal (TestFlight, APK download)
- **Build time**: Medium (~10-15 min)
- **Best for**: QA testing, beta testing

### Production
- **Purpose**: App Store/Play Store submission
- **Distribution**: Public via stores
- **Build time**: Slower (~15-20 min)
- **Best for**: Public releases

---

## 🍎 iOS Deployment

### 1. First-Time Setup

```bash
eas login
eas build:configure
```

### 2. Build for TestFlight

```bash
eas build --profile production --platform ios
```

This will:
- Build the app on EAS servers
- Sign with your Apple Developer credentials
- Generate an IPA file

### 3. Submit to TestFlight

```bash
eas submit --platform ios
```

Or manually:
1. Download the `.ipa` from EAS dashboard
2. Open Xcode → Window → Organizer
3. Drag IPA to Archives
4. Click "Distribute App" → "TestFlight & App Store"

### 4. App Store Submission

After TestFlight testing:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app listing
3. Fill in metadata (description, screenshots, privacy policy)
4. Submit TestFlight build for review

**⚠️ IMPORTANT: Family Controls Review**
- Apple requires manual review for Family Controls usage
- Include detailed explanation in "App Review Information"
- Expect 2-3 weeks review time (first submission)

---

## 🤖 Android Deployment

### 1. First-Time Setup

```bash
eas login
eas build:configure
```

### 2. Build AAB for Play Store

```bash
eas build --profile production --platform android
```

This generates an `.aab` (Android App Bundle) file.

### 3. Submit to Play Store

```bash
eas submit --platform android
```

Or manually:
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Navigate to "Production" → "Create new release"
4. Upload the `.aab` file
5. Fill in release notes

### 4. Play Store Listing

Required information:
- App description
- Screenshots (at least 2)
- Feature graphic (1024x500)
- Privacy policy URL
- Content rating questionnaire

**⚠️ IMPORTANT: Accessibility Service Permission**
- Declare usage in "Permissions" section
- Provide video demonstrating accessibility service usage
- Explain why it's necessary for core functionality

---

## 🔐 Environment Variables & Secrets

### Development (.env)
```bash
EXPO_PUBLIC_OPENROUTER_API_KEY=your_key_here
```

### Production (EAS Secrets)

Set secrets for EAS builds:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_OPENROUTER_API_KEY --value your_key_here
```

Verify secrets:
```bash
eas secret:list
```

---

## 📱 Testing Checklist

### iOS Testing:
- [ ] Build runs on iOS Simulator
- [ ] Build runs on physical device (iOS 15+)
- [ ] Family Controls permission prompt appears
- [ ] Can authorize Family Controls
- [ ] Can select apps to monitor
- [ ] App interception works (opens alternatives screen)
- [ ] Alternatives (breathe, reflect, prayer, exercise) work
- [ ] Quick breaks work
- [ ] Insights screen displays data
- [ ] Settings (theme, duration) persist

### Android Testing:
- [ ] Build runs on Android Emulator
- [ ] Build runs on physical device (API 26+)
- [ ] Accessibility Service permission prompt appears
- [ ] Can enable Accessibility Service
- [ ] Can select apps to monitor
- [ ] App interception works
- [ ] All alternatives work
- [ ] Quick breaks work
- [ ] Insights screen displays data
- [ ] Settings persist

### Cross-Platform:
- [ ] Both light and dark themes work
- [ ] All animations are smooth (60fps)
- [ ] No console errors or warnings
- [ ] App handles network errors gracefully
- [ ] Data persists after app restart
- [ ] Deep links work (gentlewait://)

---

## 🐛 Common Build Issues

### iOS

#### "pod install failed"
```bash
# Fix CocoaPods cache
rm -rf ~/.cocoapods/repos/trunk
pod repo update
cd ios && pod install
```

#### "Cannot find type 'RCTPromiseRejectBlock'"
- Ensure `import React` is in `GentleWaitModule.swift`
- Clean build: Cmd+Shift+K in Xcode

#### "GentleWaitModule.swift not found"
- Files must be added to Xcode project (see iOS Setup above)
- Check files are in target membership

#### "Family Controls entitlement not found"
- Verify `gentlewait.entitlements` has `com.apple.developer.family-controls`
- Check in Xcode: Signing & Capabilities tab

### Android

#### "Accessibility Service not working"
```bash
# Rebuild native code
cd android && ./gradlew clean
cd .. && npm run android
```

#### "Permission denied" errors
- Ensure all permissions are in `AndroidManifest.xml`
- Check `app.config.js` has correct permissions array

#### "Could not resolve all dependencies"
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
cd .. && npm run android
```

---

## 📊 Version Management

### Increment Version

Update `app.config.js`:
```javascript
version: "1.0.1", // Semantic versioning
ios: {
  buildNumber: "2", // iOS build number
},
android: {
  versionCode: 2, // Android version code
}
```

### Auto-Increment (EAS)
- Set in `eas.json`: `"autoIncrement": true`
- EAS will increment build numbers automatically

---

## 🚢 Release Workflow

### 1. Pre-Release
```bash
# Run tests
npm run lint

# Test both platforms
npm run ios
npm run android

# Commit changes
git add .
git commit -m "Release v1.0.1"
git push
```

### 2. Build
```bash
# Production builds
eas build --profile production --platform all
```

### 3. Test Preview
```bash
# Download builds from EAS dashboard
# Install on test devices
# Run full testing checklist
```

### 4. Submit
```bash
# Submit to both stores
eas submit --platform ios
eas submit --platform android
```

### 5. Monitor
- Check App Store Connect / Play Console for review status
- Monitor crash reports
- Respond to user reviews

---

## 📄 Store Listing Assets

### App Description Template

**Gentle Wait - Mindful App Breaks**

Take a pause before opening distracting apps. Replace mindless scrolling with mindful moments.

**Features:**
• 🧘 Mindful alternatives: Breathing exercises, reflections, prayers
• ⏸️ Customizable pause durations (30s - 5min)
• 📊 Usage insights and streak tracking
• 🎨 Beautiful liquid glass design
• 🌙 Dark mode support
• 🔒 Privacy-first: All data stored locally

**How it works:**
1. Select apps you want to pause
2. When you open them, choose a mindful alternative
3. Complete the exercise or wait
4. Build better digital habits!

Perfect for reducing phone addiction and improving focus.

### Screenshots Needed

#### iOS (Required):
- 6.5" (iPhone 14 Pro Max): 1290 x 2796
- 5.5" (iPhone 8 Plus): 1242 x 2208

#### Android (Required):
- Phone: 1080 x 1920 (minimum)
- Tablet (optional): 1536 x 2048

### Screenshot Ideas:
1. Onboarding screen
2. App selection screen
3. Pause screen with alternatives
4. Breathing exercise in action
5. Insights/stats screen
6. Settings screen

---

## 🔒 Privacy & Compliance

### Privacy Policy Required

Create a privacy policy covering:
- What data is collected (app usage, settings)
- Where it's stored (locally on device)
- What permissions are used (Family Controls/Accessibility)
- Third-party services (OpenRouter API for AI)
- User rights (data deletion, export)

Host at: `https://your-website.com/privacy-policy`

### App Store Privacy Questions

**Data Collected:**
- Usage Data (app open timestamps) - Analytics only
- User Content (reflections, exercises completed) - App Functionality

**Data Linked to User:**
- None (all data stored locally)

**Data Not Collected:**
- Personal Information
- Location
- Contact Info
- Financial Info

---

## 📞 Support

### Issues During Build
1. Check this guide for common issues
2. Review error logs carefully
3. Search Expo forums: https://forums.expo.dev
4. Check React Native issues: https://github.com/facebook/react-native

### Contact
- GitHub Issues: [Create issue](https://github.com/your-repo/issues)
- Email: your-email@example.com

---

## ✅ Final Checklist

Before submitting to stores:

### Code:
- [ ] All features tested on both platforms
- [ ] No console errors or warnings
- [ ] Linting passes (`npm run lint`)
- [ ] All TypeScript types are correct
- [ ] No hardcoded API keys (use environment variables)

### Assets:
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] Screenshots (iOS and Android)
- [ ] Feature graphic (Android)
- [ ] Privacy policy URL

### Store Listings:
- [ ] App name and description
- [ ] Keywords/tags
- [ ] Category selection
- [ ] Age rating/content rating
- [ ] Support URL
- [ ] Marketing URL (optional)

### Legal:
- [ ] Privacy policy published
- [ ] Terms of service (if applicable)
- [ ] COPPA compliance (if targeting children)
- [ ] GDPR compliance (if EU users)

### Post-Launch:
- [ ] Monitor crash reports
- [ ] Set up app analytics (optional)
- [ ] Prepare update roadmap
- [ ] Plan user feedback collection

---

**Good luck with your launch! 🚀**
