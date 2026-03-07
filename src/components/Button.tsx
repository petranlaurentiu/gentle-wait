/**
 * Liquid-glass button variants with softer accent treatment.
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
import { radius, spacing, typography, fonts, glassEffects } from "@/src/theme/theme";
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
          name={iconName as never}
          size={size}
          color={color}
          style={{ marginRight: spacing.sm }}
        />
      );
    }
    return (
      <Ionicons
        name={iconName as never}
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
        activeOpacity={0.88}
        style={[styles.buttonContainer, style]}
      >
        <LinearGradient
          colors={["rgba(189, 231, 255, 0.92)", colors.primary, colors.primaryDark]}
          start={{ x: 0.04, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryButton, disabled && styles.disabled]}
        >
          <View style={styles.primaryHighlight} />
          <View style={styles.labelRow}>
            {renderIcon(colors.textInverse, 19)}
            <Text style={[styles.primaryText, { color: colors.textInverse }, textStyle]}>
              {label}
            </Text>
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
        activeOpacity={0.88}
        style={[styles.buttonContainer, style]}
      >
        <View style={[styles.glassButtonContainer, disabled && styles.disabled]}>
          <BlurView intensity={glassEffects.blur.medium} style={styles.glassBlur} tint="dark">
            <LinearGradient
              colors={[colors.glassFillStrong, colors.glassFill]}
              style={styles.glassGradient}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.labelRow}>
                {renderIcon(colors.textPrimary, 18)}
                <Text
                  style={[styles.secondaryText, { color: colors.textPrimary }, textStyle]}
                >
                  {label}
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
          <View style={[styles.glassBorder, { borderColor: colors.glassStroke }]} pointerEvents="none" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.ghostButton, disabled && styles.disabled, style]}
    >
      <View style={styles.labelRow}>
        {renderIcon(colors.textSecondary, 18)}
        <Text style={[styles.ghostText, { color: colors.textSecondary }, textStyle]}>
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
    paddingVertical: spacing.md + 3,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  primaryHighlight: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.56)",
    borderRadius: 1,
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: typography.button.fontSize,
    letterSpacing: 0.2,
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
    paddingVertical: spacing.md + 3,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: typography.button.fontSize,
    letterSpacing: 0.1,
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
