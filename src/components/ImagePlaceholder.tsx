/**
 * Reusable placeholder for images and videos
 * Used during onboarding and exercise screens while assets are being added
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

interface ImagePlaceholderProps {
  width?: number;
  height?: number;
  label?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  width = 300,
  height = 300,
  label = 'Image/Video Placeholder',
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width,
      height,
      backgroundColor: colors.border,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.text,
      opacity: 0.5,
    },
    text: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};
