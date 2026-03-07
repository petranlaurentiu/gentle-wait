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
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
  iconName?: string;
  iconSet?: "ionicons" | "material";
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
  iconName,
  iconSet = "ionicons",
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = async () => {
    if (!disabled) {
      await triggerLightImpact();
      onPress();
    }
  };

  const renderIcon = (color: string, size: number) => {
    if (!iconName) return null;
    if (iconSet === "material") {
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={size}
          color={color}
          style={{ marginRight: spacing.sm }}
        />
      );
    }
    return (
      <Ionicons
        name={iconName as any}
        size={size}
        color={color}
        style={{ marginRight: spacing.sm }}
      />
    );
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
          <View style={styles.primaryHighlight} />
          <View style={styles.labelRow}>
            {renderIcon("#FFFFFF", 20)}
            <Text style={[styles.primaryText, textStyle]}>{label}</Text>
          </View>
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
              <View style={styles.labelRow}>
                {renderIcon(colors.text, 20)}
                <Text
                  style={[
                    styles.secondaryText,
                    { color: colors.text },
                    textStyle,
                  ]}
                >
                  {label}
                </Text>
              </View>
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
      <View style={styles.labelRow}>
        {renderIcon(colors.textSecondary, 18)}
        <Text
          style={[styles.ghostText, { color: colors.textSecondary }, textStyle]}
        >
          {label}
        </Text>
      </View>
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
    textAlign: "center",
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
    textAlign: "center",
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
    textAlign: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
