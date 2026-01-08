import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/theme';
import { triggerSelectionFeedback } from '@/src/utils/haptics';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

export function Checkbox({ label, checked, onPress }: CheckboxProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.border,
      borderRadius: 12,
      marginBottom: spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: checked ? colors.primary : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: colors.bg,
      fontSize: 14,
      fontWeight: 'bold',
    },
    label: {
      flex: 1,
      fontSize: typography.secondary.fontSize,
      fontWeight: typography.secondary.fontWeight,
      color: colors.text,
    },
  });

  const handlePress = async () => {
    await triggerSelectionFeedback();
    onPress();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.checkbox}>{checked && <Text style={styles.checkmark}>✓</Text>}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
