import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts } from "@/src/theme/theme";
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import LibWheelPicker from "@quidone/react-native-wheel-picker";
import type { ValueChangedEvent } from "@quidone/react-native-wheel-picker";

export interface WheelPickerItem {
  label: string;
  value: number;
}

interface WheelPickerProps {
  items: WheelPickerItem[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  itemHeight?: number;
  visibleItems?: number;
}

export function WheelPicker({
  items,
  selectedValue,
  onValueChange,
  itemHeight = 48,
  visibleItems = 5,
}: WheelPickerProps) {
  const { colors } = useTheme();

  const handleValueChanged = useCallback(
    (event: ValueChangedEvent<{ value: number; label: string }>) => {
      onValueChange(event.item.value);
    },
    [onValueChange],
  );

  return (
    <LibWheelPicker
      data={items}
      value={selectedValue}
      onValueChanged={handleValueChanged}
      itemHeight={itemHeight}
      visibleItemCount={visibleItems}
      itemTextStyle={[
        styles.itemText,
        { color: colors.textMuted, fontFamily: fonts.regular },
      ]}
      overlayItemStyle={[
        styles.overlay,
        {
          borderColor: colors.glassStroke,
          backgroundColor: colors.primaryLight,
        },
      ]}
      style={styles.picker}
    />
  );
}

const styles = StyleSheet.create({
  picker: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(218, 228, 248, 0.08)",
  },
  itemText: {
    fontSize: 18,
    textAlign: "center",
  },
  overlay: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
});

export const COOLDOWN_OPTIONS: WheelPickerItem[] = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "1.5 hr", value: 90 },
  { label: "2 hr", value: 120 },
  { label: "3 hr", value: 180 },
  { label: "4 hr", value: 240 },
  { label: "6 hr", value: 360 },
  { label: "8 hr", value: 480 },
  { label: "10 hr", value: 600 },
  { label: "12 hr", value: 720 },
];

export function formatCooldown(minutes: number): string {
  const option = COOLDOWN_OPTIONS.find((o) => o.value === minutes);
  if (option) return option.label;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr`;
}
