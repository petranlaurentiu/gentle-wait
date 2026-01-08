import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography, radius } from '@/src/theme/theme';
import { triggerLightImpact } from '@/src/utils/haptics';

type ButtonVariant = 'primary' | 'secondary';

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
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      opacity: disabled ? 0.6 : 1,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    secondaryButton: {
      backgroundColor: colors.secondaryLight,
      borderWidth: 1,
      borderColor: colors.secondary,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      opacity: disabled ? 0.6 : 1,
    },
    primaryText: {
      fontSize: typography.button.fontSize + 1,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryText: {
      fontSize: typography.button.fontSize,
      fontWeight: '600',
      color: colors.primaryDark,
    },
  });

  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle_ = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  const handlePress = async () => {
    if (!disabled) {
      await triggerLightImpact();
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[textStyle_, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}
