# Pre-Launch Checklist

Complete this checklist before submitting to App Store and Play Store.

---

## 🔧 Technical Setup

### iOS
- [ ] Swift files added to Xcode project
  - [ ] `GentleWaitModule.swift`
  - [ ] `GentleWaitModule.m`
- [ ] Family Controls capability enabled in Xcode
- [ ] Build succeeds without errors (`⌘B` in Xcode)
- [ ] App runs on iOS Simulator
- [ ] App runs on physical iOS device (iOS 15+)
- [ ] CocoaPods dependencies installed
- [ ] Entitlements file configured correctly
- [ ] Info.plist has `NSFamilyControlsUsageDescription`

### Android
- [ ] Build succeeds (`npm run android`)
- [ ] App runs on Android Emulator
- [ ] App runs on physical Android device (API 26+)
- [ ] AndroidManifest.xml has all permissions
- [ ] Accessibility Service defined correctly
- [ ] Release signing configured

### Both Platforms
- [ ] No linter errors (`npm run lint`)
- [ ] Environment variables configured (`.env` file)
- [ ] EAS configured (`eas.json`)
- [ ] Git repository clean
- [ ] Latest code committed

---

## 🧪 Functional Testing

### Onboarding Flow
- [ ] **iOS**: Welcome screens display correctly
- [ ] **Android**: Welcome screens display correctly
- [ ] **iOS**: Can select apps from list
- [ ] **Android**: Can select apps from list
- [ ] **iOS**: Family Controls permission prompt appears
- [ ] **Android**: Accessibility Service permission prompt appears
- [ ] **iOS**: Permission grant flow works
- [ ] **Android**: Permission grant flow works
- [ ] **iOS**: Duration selection persists
- [ ] **Android**: Duration selection persists
- [ ] **Both**: Can complete onboarding

### Core Functionality
- [ ] **iOS**: App interception triggers pause screen
- [ ] **Android**: App interception triggers pause screen
- [ ] **Both**: Pause screen displays app name correctly
- [ ] **Both**: Reason selection works (6 reasons)
- [ ] **Both**: All alternatives work:
  - [ ] Breathe exercise
  - [ ] Reflect exercise
  - [ ] Prayer exercise
  - [ ] Ground exercise
  - [ ] Exercise
- [ ] **Both**: "Just this once" button works
- [ ] **Both**: Timer countdown works correctly
- [ ] **Both**: Can complete alternatives
- [ ] **Both**: Events are logged to database

### Quick Breaks
- [ ] **Both**: Quick break screen accessible
- [ ] **Both**: All quick break types work:
  - [ ] Quick breathe
  - [ ] Quick reflect
  - [ ] Quick prayer
- [ ] **Both**: Quick breaks complete successfully
- [ ] **Both**: Quick breaks are logged

### Settings
- [ ] **Both**: Can change theme (light/dark)
- [ ] **Both**: Can modify app selection
- [ ] **Both**: Can change pause duration
- [ ] **Both**: Settings persist after restart
- [ ] **Both**: Can clear selected apps
- [ ] **Both**: About screen displays version

### Insights
- [ ] **Both**: Daily stats display correctly
- [ ] **Both**: Weekly stats display correctly
- [ ] **Both**: Charts render properly
- [ ] **Both**: Streak tracking works
- [ ] **Both**: Best day/time calculations correct
- [ ] **Both**: Empty state displays when no data

### Navigation
- [ ] **Both**: Tab navigation works
- [ ] **Both**: Deep links work (`gentlewait://`)
- [ ] **Both**: Back navigation works
- [ ] **Both**: Screen transitions smooth

---

## 🎨 UI/UX Testing

### Visual Polish
- [ ] **Both**: Liquid glass design renders correctly
- [ ] **Both**: Animations are smooth (60fps)
- [ ] **Both**: No visual glitches or artifacts
- [ ] **Both**: Text is readable in all themes
- [ ] **Both**: Icons display correctly
- [ ] **Both**: Colors match design system
- [ ] **Both**: Spacing is consistent
- [ ] **Both**: Safe areas respected on all devices

### Responsive Design
- [ ] **iOS**: Works on iPhone SE (small screen)
- [ ] **iOS**: Works on iPhone 14 Pro (standard)
- [ ] **iOS**: Works on iPhone 14 Pro Max (large)
- [ ] **iOS**: Works on iPad (if supporting tablets)
- [ ] **Android**: Works on small phone (5" screen)
- [ ] **Android**: Works on standard phone (6" screen)
- [ ] **Android**: Works on large phone (6.5"+ screen)
- [ ] **Android**: Works on tablet (if supporting tablets)

### Dark Mode
- [ ] **Both**: Dark theme applies correctly
- [ ] **Both**: All screens readable in dark mode
- [ ] **Both**: Contrast is sufficient
- [ ] **Both**: No bright flashes when switching

### Accessibility
- [ ] **iOS**: VoiceOver works (basic support)
- [ ] **Android**: TalkBack works (basic support)
- [ ] **Both**: Font scales correctly
- [ ] **Both**: Touch targets ≥44px
- [ ] **Both**: Error messages are clear

---

## 🔐 Security & Privacy

### Data Handling
- [ ] **Both**: All data stored locally
- [ ] **Both**: No data sent to external servers
- [ ] **Both**: SQLite database encrypted (if applicable)
- [ ] **Both**: MMKV storage secure
- [ ] **Both**: API keys not hardcoded
- [ ] **Both**: `.env` file in `.gitignore`
- [ ] **Both**: No sensitive data in logs

### Permissions
- [ ] **iOS**: Only requests necessary permissions
- [ ] **Android**: Only requests necessary permissions
- [ ] **iOS**: Permission descriptions are clear
- [ ] **Android**: Permission descriptions are clear
- [ ] **Both**: App handles permission denial gracefully
- [ ] **Both**: Can re-request permissions if denied

---

## 📝 Legal & Compliance

### Documentation
- [ ] Privacy Policy written and published
- [ ] Terms of Service written (if applicable)
- [ ] Support email/URL configured
- [ ] Privacy Policy URL in app config
- [ ] LICENSE file included

### Store Requirements
- [ ] **iOS**: App Store Review Guidelines compliant
- [ ] **iOS**: Family Controls usage justified
- [ ] **Android**: Play Store policies compliant
- [ ] **Android**: Accessibility Service usage explained
- [ ] **Both**: Content rating appropriate
- [ ] **Both**: Age rating appropriate
- [ ] **Both**: No copyrighted content

---

## 🖼️ Assets & Metadata

### App Icons
- [ ] **iOS**: 1024x1024 App Store icon
- [ ] **Android**: Adaptive icon (foreground/background)
- [ ] **Both**: Icons look good on all backgrounds
- [ ] **Both**: Icons follow platform guidelines

### Screenshots
- [ ] **iOS**: 6.5" iPhone screenshots (5-10)
- [ ] **iOS**: 5.5" iPhone screenshots (5-10)
- [ ] **Android**: Phone screenshots (2-8)
- [ ] **Android**: Tablet screenshots (if supporting)
- [ ] **Both**: Screenshots showcase key features
- [ ] **Both**: Screenshots include captions/text

### Splash Screen
- [ ] **Both**: Splash screen displays correctly
- [ ] **Both**: Fast load time (<2 seconds)
- [ ] **Both**: No flash of unstyled content

### Store Listing
- [ ] App name chosen (max 30 chars)
- [ ] Subtitle/tagline written (iOS)
- [ ] Short description written (Android, 80 chars)
- [ ] Full description written (4000 chars)
- [ ] Keywords selected (iOS, 100 chars)
- [ ] Category selected
- [ ] Contact email configured
- [ ] Support URL configured
- [ ] Marketing URL configured (optional)

---

## 🚀 Build & Deploy

### Build Configuration
- [ ] Version number updated (`app.config.js`)
- [ ] **iOS**: Build number incremented
- [ ] **Android**: Version code incremented
- [ ] Bundle identifiers correct:
  - iOS: `com.petran-laurentiu.gentlewait`
  - Android: `com.petran_laurentiu.gentlewait`
- [ ] **iOS**: Signing certificates configured
- [ ] **Android**: Keystore configured

### Test Builds
- [ ] **iOS**: Preview build succeeds
- [ ] **Android**: Preview build succeeds
- [ ] **iOS**: Preview build installs on device
- [ ] **Android**: Preview build installs on device
- [ ] **Both**: Preview builds fully functional

### Production Builds
- [ ] **iOS**: Production build succeeds
- [ ] **Android**: Production build succeeds
- [ ] **iOS**: IPA file size reasonable (<100MB)
- [ ] **Android**: AAB file size reasonable (<50MB)
- [ ] **Both**: No debug/development code included
- [ ] **Both**: Console logs removed/minimized
- [ ] **Both**: Error tracking configured (optional)

---

## 📱 Store Submission

### iOS (App Store Connect)
- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] App ID matches bundle identifier
- [ ] Build uploaded to App Store Connect
- [ ] Build processed successfully
- [ ] TestFlight testing complete
- [ ] App information filled:
  - [ ] Name
  - [ ] Subtitle
  - [ ] Description
  - [ ] Keywords
  - [ ] Support URL
  - [ ] Privacy Policy URL
- [ ] Screenshots uploaded (all sizes)
- [ ] App icon uploaded
- [ ] App Store category selected
- [ ] Content rating completed
- [ ] Privacy details completed
- [ ] Age rating selected
- [ ] App Review Information filled:
  - [ ] Contact info
  - [ ] Demo account (if applicable)
  - [ ] Family Controls usage explanation
  - [ ] Notes for reviewer
- [ ] Build selected for release
- [ ] Release type selected (manual/automatic)
- [ ] Submitted for review

### Android (Google Play Console)
- [ ] Google Play Developer account active
- [ ] App created in Play Console
- [ ] App ID matches package name
- [ ] Build uploaded to production track
- [ ] Release notes written
- [ ] Store listing completed:
  - [ ] App name
  - [ ] Short description
  - [ ] Full description
  - [ ] Screenshots
  - [ ] Feature graphic
  - [ ] App icon
  - [ ] Privacy policy URL
- [ ] Content rating completed
- [ ] Target audience selected
- [ ] App category selected
- [ ] Contact details filled
- [ ] Privacy & security:
  - [ ] Data safety section completed
  - [ ] Accessibility Service usage declared
  - [ ] Video demonstration uploaded
- [ ] Pricing & distribution set
- [ ] Countries/regions selected
- [ ] Submitted for review

---

## 🎯 Post-Launch

### Monitoring
- [ ] App Store Connect dashboard bookmarked
- [ ] Google Play Console dashboard bookmarked
- [ ] Crash reporting enabled (optional)
- [ ] Analytics configured (optional)
- [ ] Support email monitored

### Marketing
- [ ] Product Hunt launch (optional)
- [ ] Social media announcement (optional)
- [ ] Website/landing page (optional)
- [ ] Press kit prepared (optional)

### Maintenance
- [ ] Bug fix process defined
- [ ] Update schedule planned
- [ ] User feedback system ready
- [ ] Backup strategy for data (if cloud sync added)

---

## ✅ Final Check

Before clicking "Submit for Review":

1. **Install the exact production build on your device**
2. **Go through the entire user flow from scratch**
3. **Test all core features one more time**
4. **Check for any crashes or errors**
5. **Review all store listing text for typos**
6. **Verify all screenshots are up-to-date**
7. **Ensure contact information is correct**
8. **Read platform-specific review guidelines one more time**

---

## 📞 Emergency Contacts

If something goes wrong:

- **Apple Developer Support**: https://developer.apple.com/contact/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/
- **Expo Forums**: https://forums.expo.dev/
- **React Native GitHub**: https://github.com/facebook/react-native/issues

---

**Remember**: First submission always takes longer. Be patient with the review process!

**Good luck! 🚀**
