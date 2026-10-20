import React from "react";
import { StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";
import { colors } from "../constants/theme";

interface BrandLogoProps {
  size?: number;
  variant?: "dark" | "light" | "minimal";
  style?: StyleProp<ViewStyle>;
}

/**
 * Original I-Dynamic Brand Emblem.
 * Designed as a clean, geometric architectural monogram ("I·D")
 * ready to be swapped when a custom PNG/SVG logo asset is uploaded.
 */
export function BrandLogo({
  size = 38,
  variant = "dark",
  style
}: BrandLogoProps) {
  const isDark = variant === "dark";
  const borderRadius = Math.round(size * 0.28);
  const fontSize = Math.round(size * 0.42);
  const dotSize = Math.max(4, Math.round(size * 0.11));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: isDark ? "#1D1D1F" : "#FFFFFF",
          borderWidth: isDark ? 1 : 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.14)" : "#1D1D1F"
        },
        style
      ]}
    >
      <View style={styles.innerLockup}>
        <Text
          style={[
            styles.monogramI,
            {
              fontSize,
              color: isDark ? "#FFFFFF" : "#1D1D1F"
            }
          ]}
        >
          I
        </Text>
        <View
          style={[
            styles.dynamicNode,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: "#0066CC"
            }
          ]}
        />
        <Text
          style={[
            styles.monogramD,
            {
              fontSize,
              color: isDark ? "#FFFFFF" : "#1D1D1F"
            }
          ]}
        >
          D
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  innerLockup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1.5
  },
  monogramI: {
    fontWeight: "800",
    letterSpacing: -0.5
  },
  dynamicNode: {
    marginHorizontal: 0.5
  },
  monogramD: {
    fontWeight: "800",
    letterSpacing: -0.5
  }
});

export default BrandLogo;
