import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../constants/theme";

interface BadgeProps {
  count: number;
  style?: ViewStyle;
}

/**
 * Small circular red badge for showing counts (e.g. cart items, notifications)
 */
export function Badge({ count, style }: BadgeProps) {
  if (typeof count !== "number" || count <= 0) {
    return null;
  }

  const displayText = count > 99 ? "99+" : String(count);

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{displayText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.badge,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  text: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center"
  }
});
