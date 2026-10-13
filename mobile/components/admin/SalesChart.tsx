import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../../constants/theme";

export interface SalesChartProps {
  data: Array<{ date: string; revenueGHS: number }>;
  height?: number;
}

export function SalesChart({ data, height = 200 }: SalesChartProps) {
  const hasData = Array.isArray(data) && data.length > 0;
  const totalRevenue = data?.reduce((acc, item) => acc + (item.revenueGHS || 0), 0) || 0;

  if (!hasData || totalRevenue === 0) {
    return (
      <View style={[styles.container, { height: height + 32, justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.emptyText}>No sales yet</Text>
      </View>
    );
  }

  // Calculate label step so roughly 4 labels appear along X-axis
  const totalPoints = data.length;
  const labelInterval = Math.max(1, Math.floor(totalPoints / 4));

  const chartData = data.map((item, index) => {
    const isLabelStep = index % labelInterval === 0 || index === totalPoints - 1;
    let label = "";
    if (isLabelStep && item.date) {
      try {
        const d = new Date(item.date);
        label = d.toLocaleDateString("en-GH", { month: "short", day: "numeric" });
      } catch {
        label = item.date.slice(5);
      }
    }

    return {
      value: item.revenueGHS || 0,
      label
    };
  });

  const formatY = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "₵0";
    if (num >= 1000) {
      return `₵${(num / 1000).toFixed(0)}k`;
    }
    return `₵${num.toFixed(0)}`;
  };

  return (
    <View style={styles.container}>
      <View style={{ overflow: "hidden" }}>
        <LineChart
          data={chartData}
          height={height}
          curved
          isAnimated
          animationDuration={800}
          areaChart
          color={colors.accent}
          startFillColor={colors.accent}
          endFillColor="rgba(0, 113, 227, 0.0)"
          startOpacity={0.2}
          endOpacity={0.0}
          hideDataPoints
          thickness={2.5}
          noOfSections={4}
          formatYLabel={formatY}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          rulesColor={colors.border}
          rulesType="solid"
          initialSpacing={12}
          endSpacing={40}
          backgroundColor="transparent"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500"
  },
  axisText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: "500"
  }
});

export default SalesChart;
