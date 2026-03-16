import { useTheme } from "@/src/theme/ThemeProvider";
import { fonts } from "@/src/theme/theme";
import React, { useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  showSelectionBadge?: boolean;
}

export function WheelPicker({
  items,
  selectedValue,
  onValueChange,
  itemHeight = 56,
  visibleItems = 5,
  showSelectionBadge = false,
}: WheelPickerProps) {
  const { colors } = useTheme();
  const selectedItem =
    items.find((item) => item.value === selectedValue) ?? items[0];

  const handleValueChanged = useCallback(
    (event: ValueChangedEvent<{ value: number; label: string }>) => {
      onValueChange(event.item.value);
    },
    [onValueChange],
  );

  return (
    <View style={styles.wrapper}>
      {showSelectionBadge && selectedItem ? (
        <View
          style={[
            styles.selectionBadge,
            {
              backgroundColor: colors.glassFillStrong,
              borderColor: colors.glassStroke,
            },
          ]}
        >
          <Text style={[styles.selectionCaption, { color: colors.textMuted }]}>
            Selected break
          </Text>
          <Text style={[styles.selectionValue, { color: colors.text }]}>
            {selectedItem.label}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.pickerFrame,
          {
            backgroundColor: colors.glassFill,
            borderColor: colors.glassStroke,
            shadowColor: colors.glassShadow,
          },
        ]}
      >
        <LibWheelPicker
          data={items}
          value={selectedValue}
          onValueChanged={handleValueChanged}
          itemHeight={itemHeight}
          visibleItemCount={visibleItems}
          itemTextStyle={[
            styles.itemText,
            { color: colors.textMuted, fontFamily: fonts.medium },
          ]}
          overlayItemStyle={[
            styles.overlay,
            {
              borderColor: colors.primary,
              backgroundColor: "rgba(143, 214, 255, 0.20)",
              shadowColor: colors.primary,
            },
          ]}
          style={styles.picker}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[colors.bg, "rgba(15, 23, 36, 0.08)"]}
          style={styles.topFade}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(15, 23, 36, 0.08)", colors.bg]}
          style={styles.bottomFade}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  selectionBadge: {
    minWidth: 170,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCaption: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  selectionValue: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  pickerFrame: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  picker: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  itemText: {
    fontSize: 24,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  overlay: {
    marginHorizontal: 14,
    borderWidth: 1,
    borderRadius: 18,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 44,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
  },
});

// iOS DeviceActivitySchedule requires a minimum 15-minute monitoring interval
const IOS_MIN_COOLDOWN_MINUTES = 15;

const ALL_COOLDOWN_OPTIONS: WheelPickerItem[] = [
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

export const COOLDOWN_OPTIONS: WheelPickerItem[] =
  Platform.OS === "ios"
    ? ALL_COOLDOWN_OPTIONS.filter((o) => o.value >= IOS_MIN_COOLDOWN_MINUTES)
    : ALL_COOLDOWN_OPTIONS;

export function formatCooldown(minutes: number): string {
  const option = COOLDOWN_OPTIONS.find((o) => o.value === minutes);
  if (option) return option.label;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr`;
}
