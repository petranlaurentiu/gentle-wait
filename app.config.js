const appleTeamId = process.env.EXPO_PUBLIC_APPLE_TEAM_ID || "CNS3PJ66YR";
const iosAppGroup =
  process.env.EXPO_PUBLIC_IOS_APP_GROUP ||
  "group.com.petran-laurentiu.gentlewait";
const apiOrigin = process.env.EXPO_PUBLIC_API_ORIGIN || "";

export default {
  expo: {
    name: "GentleWait",
    slug: "gentle-wait",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/main_logo-app.png",
    scheme: "gentlewait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      appleTeamId,
      bundleIdentifier: "com.petran-laurentiu.gentlewait",
      infoPlist: {
        NSFamilyControlsUsageDescription: "This app needs access to Family Controls to monitor app usage and help you maintain focus by pausing distracting apps.",
      },
      entitlements: {
        "com.apple.security.application-groups": [iosAppGroup],
      },
      buildNumber: "1",
    },
    android: {
      icon: "./assets/images/main_logo-app.png",
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
      output: "server",
      favicon: "./assets/images/main_logo.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: apiOrigin || undefined,
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      [
        "react-native-device-activity",
        {
          appleTeamId,
          appGroup: iosAppGroup,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/main_logo.png",
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
      router: {
        origin: apiOrigin || undefined,
      },
      eas: {
        projectId: "5518f02a-19c1-4d4a-b78a-2ed3c162d4c1",
      },
      revenueCatAppleApiKey:
        process.env.REVENUECAT_APPLE_PUBLIC_SDK_KEY ||
        process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ||
        "",
      revenueCatGoogleApiKey:
        process.env.REVENUECAT_GOOGLE_PUBLIC_SDK_KEY ||
        process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ||
        "",
      appleTeamId,
      iosAppGroup,
      apiOrigin,
    },
  },
};
