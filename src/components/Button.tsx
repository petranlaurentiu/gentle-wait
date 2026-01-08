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
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pills,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      opacity: disabled ? 0.5 : 1,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pills,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      opacity: disabled ? 0.5 : 1,
    },
    primaryText: {
      fontSize: typography.button.fontSize,
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    secondaryText: {
      fontSize: typography.button.fontSize,
      fontWeight: '500',
      color: colors.text,
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
