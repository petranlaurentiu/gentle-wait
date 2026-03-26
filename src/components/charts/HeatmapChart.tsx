/**
 * Heatmap chart — 7x24 grid showing pause frequency by day and hour
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, spacing, typography } from "@/src/theme/theme";

interface HeatmapChartProps {
  /** 7-element array (Sun-Sat), each containing 24-element array (hours) */
  data: number[][];
  primaryColor: string;
  textColor: string;
  mutedColor: string;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
const HOUR_INDICES = [0, 3, 6, 9, 12, 15, 18, 21];

export function HeatmapChart({
  data,
  primaryColor,
  textColor,
  mutedColor,
}: HeatmapChartProps) {
  // Find max value for color scaling
  const maxVal = Math.max(1, ...data.flat());

  return (
    <View style={styles.container}>
      {/* Hour labels on the left */}
      <View style={styles.hourLabels}>
        {HOUR_INDICES.map((hour, i) => (
          <Text
            key={hour}
            style={[styles.label, { color: mutedColor }]}
            numberOfLines={1}
          >
            {HOUR_LABELS[i]}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {/* Day labels on top */}
        <View style={styles.dayLabelsRow}>
          {DAY_LABELS.map((label, i) => (
            <Text key={i} style={[styles.dayLabel, { color: mutedColor }]}>
              {label}
            </Text>
          ))}
        </View>

        {/* Heat cells — iterate hours (rows) then days (columns) */}
        <View style={styles.grid}>
          {HOUR_INDICES.map((hour) => (
            <View key={hour} style={styles.row}>
              {data.map((dayData, dayIndex) => {
                // Sum the 3-hour block for this cell
                const value =
                  (dayData[hour] || 0) +
                  (dayData[hour + 1] || 0) +
                  (dayData[hour + 2] || 0);
                const intensity = value / (maxVal * 3);

                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          value === 0
                            ? mutedColor + "15"
                            : primaryColor +
                              Math.round(
                                Math.max(0.15, Math.min(1, intensity)) * 255
                              )
                                .toString(16)
                                .padStart(2, "0"),
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  hourLabels: {
    justifyContent: "space-between",
    paddingTop: 20, // offset for day labels
    paddingBottom: 2,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 9,
    textAlign: "right",
    width: 24,
  },
  gridContainer: {
    flex: 1,
  },
  dayLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  dayLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    textAlign: "center",
    flex: 1,
  },
  grid: {
    gap: 3,
  },
  row: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "space-around",
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
    maxWidth: 32,
    maxHeight: 32,
  },
});
