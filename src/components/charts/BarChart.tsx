/**
 * Horizontal bar chart for per-app breakdown
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, radius, spacing } from "@/src/theme/theme";

export interface BarChartItem {
  label: string;
  value: number;
  rate: number; // calm rate 0-100
}

interface BarChartProps {
  data: BarChartItem[];
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
}

function getRateColor(rate: number, primaryColor: string, accentColor: string): string {
  if (rate >= 70) return "#7EE6C6"; // green
  if (rate >= 50) return accentColor; // yellow/amber
  return "#FF8A8A"; // red
}

export function BarChart({
  data,
  primaryColor,
  accentColor,
  textColor,
  mutedColor,
}: BarChartProps) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.stats, { color: mutedColor }]}>
              {item.value} pauses · {item.rate}% calm
            </Text>
          </View>
          <View style={[styles.barBackground, { backgroundColor: mutedColor + "20" }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: getRateColor(item.rate, primaryColor, accentColor),
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    flex: 1,
  },
  stats: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    minWidth: 4,
  },
});
