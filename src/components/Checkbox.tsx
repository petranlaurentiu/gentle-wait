/**
 * Checkbox Component - Liquid Glass Design
 */
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography, radius } from "@/src/theme/theme";
import { triggerSelectionFeedback } from "@/src/utils/haptics";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

export function Checkbox({ label, checked, onPress }: CheckboxProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      backgroundColor: checked
        ? "rgba(0, 212, 255, 0.15)"
        : "rgba(255, 255, 255, 0.08)",
      borderRadius: radius.button,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: checked ? colors.primary : "rgba(255, 255, 255, 0.1)",
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: checked ? colors.primary : "rgba(255, 255, 255, 0.3)",
      backgroundColor: checked ? colors.primary : "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    checkmark: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },
    label: {
      flex: 1,
      fontSize: typography.secondary.fontSize + 1,
      fontWeight: "400",
      color: colors.text,
    },
  });

  const handlePress = async () => {
    await triggerSelectionFeedback();
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.checkbox}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
