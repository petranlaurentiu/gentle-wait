/**
 * Glass Button Component - Liquid Glass styled buttons
 */
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, fonts, radius } from "@/src/theme/theme";
import { triggerLightImpact } from "@/src/utils/haptics";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = async () => {
    if (!disabled) {
      await triggerLightImpact();
      onPress();
    }
  };

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[styles.buttonContainer, style]}
      >
        <LinearGradient
          colors={["#00D4FF", "#0099CC", "#007ACC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryButton, disabled && styles.disabled]}
        >
          {/* Inner highlight */}
          <View style={styles.primaryHighlight} />
          <Text style={[styles.primaryText, textStyle]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "secondary") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[styles.buttonContainer, style]}
      >
        <View
          style={[styles.glassButtonContainer, disabled && styles.disabled]}
        >
          <BlurView intensity={30} style={styles.glassBlur} tint="dark">
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.15)",
                "rgba(255, 255, 255, 0.05)",
              ]}
              style={styles.glassGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text
                style={[
                  styles.secondaryText,
                  { color: colors.text },
                  textStyle,
                ]}
              >
                {label}
              </Text>
            </LinearGradient>
          </BlurView>
          <View style={styles.glassBorder} pointerEvents="none" />
        </View>
      </TouchableOpacity>
    );
  }

  // Ghost variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.6}
      style={[styles.ghostButton, disabled && styles.disabled, style]}
    >
      <Text
        style={[styles.ghostText, { color: colors.textSecondary }, textStyle]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: radius.button,
    overflow: "hidden",
  },
  primaryButton: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryHighlight: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 1,
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: typography.button.fontSize + 1,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  glassButtonContainer: {
    borderRadius: radius.button,
    overflow: "hidden",
  },
  glassBlur: {
    borderRadius: radius.button,
    overflow: "hidden",
  },
  glassGradient: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: typography.button.fontSize,
    letterSpacing: 0.3,
  },
  ghostButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: {
    fontFamily: fonts.medium,
    fontSize: typography.button.fontSize,
  },
  disabled: {
    opacity: 0.5,
  },
});
