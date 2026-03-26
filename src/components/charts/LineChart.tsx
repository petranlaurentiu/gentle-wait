/**
 * Simple line chart for calm rate trend
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, spacing } from "@/src/theme/theme";

export interface LineChartPoint {
  label: string;
  value: number; // 0-100
}

interface LineChartProps {
  data: LineChartPoint[];
  primaryColor: string;
  textColor: string;
  mutedColor: string;
}

const CHART_HEIGHT = 120;

export function LineChart({
  data,
  primaryColor,
  textColor,
  mutedColor,
}: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = 100; // Fixed scale for percentages

  return (
    <View style={styles.container}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={[styles.axisLabel, { color: mutedColor }]}>100%</Text>
        <Text style={[styles.axisLabel, { color: mutedColor }]}>50%</Text>
        <Text style={[styles.axisLabel, { color: mutedColor }]}>0%</Text>
      </View>

      <View style={styles.chartArea}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: 0, borderColor: mutedColor + "20" }]} />
        <View style={[styles.gridLine, { top: "50%", borderColor: mutedColor + "20" }]} />
        <View style={[styles.gridLine, { top: "100%", borderColor: mutedColor + "20" }]} />

        {/* Bars as vertical columns (simulated line) */}
        <View style={styles.barsRow}>
          {data.map((point, index) => {
            const barHeight = (point.value / maxValue) * CHART_HEIGHT;
            return (
              <View key={index} style={styles.barColumn}>
                <View style={{ height: CHART_HEIGHT, justifyContent: "flex-end" }}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 2),
                        backgroundColor: primaryColor,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: primaryColor,
                        bottom: barHeight - 4,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.xLabel, { color: mutedColor }]}
                  numberOfLines={1}
                >
                  {point.label}
                </Text>
              </View>
            );
          })}
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
  yAxis: {
    justifyContent: "space-between",
    height: CHART_HEIGHT,
    width: 30,
  },
  axisLabel: {
    fontFamily: fonts.regular,
    fontSize: 9,
    textAlign: "right",
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT + 20, // extra for x labels
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: CHART_HEIGHT,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    left: -1,
  },
  xLabel: {
    fontFamily: fonts.regular,
    fontSize: 8,
    marginTop: 4,
  },
});
