export default {
  expo: {
    name: "gentle-wait",
    slug: "gentle-wait",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gentlewait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.petran-laurentiu.gentlewait",
      infoPlist: {
        NSFamilyControlsUsageDescription: "This app needs access to Family Controls to monitor app usage and help you maintain focus by pausing distracting apps.",
      },
      entitlements: {
        "com.apple.developer.family-controls": true,
      },
      buildNumber: "1",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.petran_laurentiu.gentlewait",
      versionCode: 1,
      permissions: [
        "android.permission.BIND_ACCESSIBILITY_SERVICE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.PACKAGE_USAGE_STATS",
      ],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "5518f02a-19c1-4d4a-b78a-2ed3c162d4c1",
      },
      // EAS Secrets are automatically injected here during build
      // Access via: Constants.expoConfig?.extra?.openRouterApiKey
      openRouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "",
    },
  },
};
