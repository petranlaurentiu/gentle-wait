# GentleWait - Mindful Pause Moments 🧘‍♀️

A React Native app that provides gentle pause moments before opening distracting apps, helping you build healthier digital habits.

**Status**: ✅ iOS & Android support implemented  
**Platforms**: iOS (15.0+), Android (API 21+), Web  
**Tech Stack**: React Native, Expo, TypeScript, SQLite, MMKV

---

## 🎯 What is GentleWait?

GentleWait helps you create mindful pauses before opening apps that might distract you. Instead of blocking apps entirely, it:

- **Detects** when you open a selected app
- **Shows** a gentle pause screen with breathing animation
- **Offers** alternatives (breathing exercise, reflection, grounding)
- **Tracks** your patterns and insights
- **Respects** your choice (you can always proceed)

No punishment, no guilt — just awareness and gentle guidance.

---

## 📱 Platform-Specific Setup

### Android Setup (20 minutes)

Uses Android Accessibility Service to intercept app launches.

**Quick Start**:
```bash
npm run android
```

**Detailed Guide**: See [`QUICK_START_ANDROID.md`](./QUICK_START_ANDROID.md)

**Requirements**:
- Android SDK installed
- Android emulator or device
- Enable Accessibility Service in Settings

### iOS Setup (30 minutes)

Uses Apple Family Controls and DeviceActivity frameworks.

**Quick Start**:
```bash
npm run ios
```

**Detailed Guide**: See [`QUICK_START_IOS.md`](./QUICK_START_IOS.md)

**Requirements**:
- macOS with Xcode 14+
- iOS 15.0+ device or simulator
- Add Swift files to Xcode project (see guide)
- Family Controls authorization

**⚠️ Note**: iOS requires manual Xcode configuration before first run.

### Web/Development

For testing UI and logic without native modules:

```bash
npm start
```

Opens Expo development server. Native interception features won't work, but you can test all screens and flows.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Choose Your Platform

#### Android
```bash
npm run android
# Follow prompts to enable Accessibility Service
```

#### iOS
```bash
# First, configure Xcode (see QUICK_START_IOS.md)
npm run ios
```

#### Web (Testing)
```bash
npm start
```

### 3. Complete Onboarding

1. Welcome screens
2. Select apps to monitor
3. Grant permissions (platform-specific)
4. Set pause duration
5. Done! 🎉

---

## 🏭 Production Builds

### Build Commands

```bash
# iOS development build (local simulator)
npm run ios

# Android development build (local emulator/device)
npm run android

# Preview builds for testing (generates IPA/APK)
npm run build:preview:ios
npm run build:preview:android

# Production builds for App Store/Play Store
npm run build:prod:ios
npm run build:prod:android
npm run build:prod:all  # Both platforms
```

### First-Time iOS Setup

iOS requires adding Swift native files to Xcode:

```bash
npm run setup-ios
```

This will:
1. Install CocoaPods dependencies
2. Open Xcode workspace
3. Show instructions to add Swift files

**📖 Complete guide**: See [PRODUCTION_BUILD_GUIDE.md](./PRODUCTION_BUILD_GUIDE.md)

### Store Submission

Both iOS and Android require special permissions review:
- **iOS**: Family Controls capability (2-3 weeks review)
- **Android**: Accessibility Service declaration (video demo required)

See [PRODUCTION_BUILD_GUIDE.md](./PRODUCTION_BUILD_GUIDE.md) for detailed submission instructions.

---

## 📚 Documentation

### 🚀 Getting Started
- **[QUICK_START_ANDROID.md](./QUICK_START_ANDROID.md)** - Android setup (20 min)
- **[QUICK_START_IOS.md](./QUICK_START_IOS.md)** - iOS setup (30 min)

### 📦 Production & Deployment
- **[PRODUCTION_BUILD_GUIDE.md](./PRODUCTION_BUILD_GUIDE.md)** - Complete guide to build and deploy to stores

### 🔧 Detailed Setup
- **[ANDROID_SETUP.md](./ANDROID_SETUP.md)** - Detailed Android configuration
- **[IOS_SETUP.md](./IOS_SETUP.md)** - Detailed iOS configuration

### 💻 Development
- **[DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md)** - Architecture overview
- **[BUILD_COMPLETE.md](./BUILD_COMPLETE.md)** - Build status and features
- **[NATIVE_INTEGRATION_EXAMPLE.md](./NATIVE_INTEGRATION_EXAMPLE.md)** - Native module usage

### ✅ Testing & Progress
- **[IOS_IMPLEMENTATION_PROGRESS.md](./IOS_IMPLEMENTATION_PROGRESS.md)** - iOS implementation status
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures

### ✨ Features
- **[PRAYER_FEATURE.md](./PRAYER_FEATURE.md)** - Prayer/meditation feature
- **[COOLDOWN_STRATEGY.md](./COOLDOWN_STRATEGY.md)** - App cooldown logic

---

## 🏗️ Project Structure

```
gentle-wait/
├── app/                        # Expo Router screens
│   ├── index.tsx              # Entry point
│   ├── onboarding.tsx         # Multi-step onboarding
│   ├── home.tsx               # Dashboard
│   ├── pause.tsx              # Interception screen
│   ├── alternatives.tsx       # Breathing/reflect/ground
│   ├── settings.tsx           # App settings
│   └── insights.tsx           # Weekly stats
│
├── src/
│   ├── services/
│   │   ├── native/            # iOS & Android bridge
│   │   ├── storage/           # MMKV, SQLite, Zustand
│   │   ├── stats/             # Statistics calculation
│   │   └── apps/              # App detection
│   ├── theme/                 # Design system
│   └── components/            # Reusable UI
│
├── android/                   # Android native code
│   └── app/src/main/java/com/petran_laurentiu/gentlewait/
│       ├── accessibility/     # Accessibility Service
│       ├── GentleWaitModule.kt
│       └── GentleWaitPackage.kt
│
├── ios/                       # iOS native code
│   └── gentlewait/
│       ├── GentleWaitModule.swift
│       ├── GentleWaitModule.m
│       └── DeviceActivityHelper.swift
│
└── docs/                      # Documentation (markdown files)
```

---

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development tooling and native modules
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **Reanimated** - Smooth animations

### State & Storage
- **Zustand** - Global state management
- **MMKV** - Fast key-value storage
- **SQLite** - Event logging and stats

### Native Modules
- **Android**: Accessibility Service (Kotlin)
- **iOS**: Family Controls + DeviceActivity (Swift)

---

## 🎨 Key Features

### Core Functionality
- ✅ App selection and management
- ✅ Gentle pause screen with breathing animation
- ✅ Reason selection (6 types)
- ✅ Alternative activities (breathe, reflect, ground)
- ✅ Daily and weekly statistics
- ✅ Insights and trends

### Platform-Specific
- ✅ **Android**: Accessibility Service interception
- ✅ **iOS**: Family Controls authorization
- ✅ **Both**: Cross-platform native module
- ✅ **Both**: Settings persistence

### Data & Privacy
- ✅ All data stored locally (no servers)
- ✅ SQLite event logging
- ✅ MMKV settings storage
- ✅ Privacy-focused (no analytics by default)

---

## 📊 Development Status

| Feature | Android | iOS | Web |
|---------|---------|-----|-----|
| App Interception | ✅ Complete | ✅ Complete* | N/A |
| Authorization Flow | ✅ Complete | ✅ Complete | N/A |
| Settings Persistence | ✅ Complete | ✅ Complete | ✅ Complete |
| Event Logging | ✅ Complete | ✅ Complete | ✅ Complete |
| Statistics | ✅ Complete | ✅ Complete | ✅ Complete |
| Onboarding | ✅ Complete | ✅ Complete | ✅ Complete |

\* iOS requires DeviceActivity Extension for automatic detection (manual setup in Xcode)

---

## 🔐 Permissions

### Android
- **Accessibility Service** - Detect app launches
- **Query All Packages** - List installed apps

### iOS
- **Family Controls** - Monitor app usage (requires Apple approval for distribution)

Both platforms require explicit user authorization.

---

## 🧪 Testing

### Run Tests
```bash
npm run lint        # Code linting
npm test           # Unit tests (if implemented)
```

### Platform Testing

**Android**:
1. Build and run: `npm run android`
2. Enable Accessibility Service in Settings
3. Select apps to monitor
4. Open protected app → Pause screen appears

**iOS**:
1. Configure Xcode (see `QUICK_START_IOS.md`)
2. Build and run: `npm run ios`
3. Grant Family Controls authorization
4. Select apps to monitor
5. (Requires DeviceActivity Extension for automatic detection)

See **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for comprehensive testing procedures.

---

## 🤝 Contributing

This is a personal project. If you have suggestions or find bugs:
1. Check existing documentation
2. Review setup guides
3. Report issues with detailed steps to reproduce

---

## 📝 License

See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [MMKV](https://github.com/mrousavy/react-native-mmkv)

---

## 📞 Support

For setup help, see the quick start guides:
- Android: [`QUICK_START_ANDROID.md`](./QUICK_START_ANDROID.md)
- iOS: [`QUICK_START_IOS.md`](./QUICK_START_IOS.md)

For technical details, see:
- Architecture: [`DEVELOPMENT_SUMMARY.md`](./DEVELOPMENT_SUMMARY.md)
- Native modules: [`NATIVE_INTEGRATION_EXAMPLE.md`](./NATIVE_INTEGRATION_EXAMPLE.md)

---

**Made with 💙 to help build healthier digital habits**
