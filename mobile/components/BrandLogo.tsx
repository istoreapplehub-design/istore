import React from "react";
import { StyleSheet, Text, View, Image, ViewStyle, StyleProp } from "react-native";
import { colors } from "../constants/theme";

const EMBLEM_ASSET = require("../assets/images/lestrades-emblem.png");
const FULL_LOGO_ASSET = require("../assets/images/lestrades-logo.png");

interface BrandLogoProps {
  size?: number;
  variant?: "dark" | "light" | "minimal";
  mode?: "emblem" | "full";
  showWordmark?: boolean;
  wordmarkSize?: number;
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Official LesTrades Brand Emblem & Wordmark.
 * Uses the authentic 3D ribbon emblem with "Quality for Less".
 */
export function BrandLogo({
  size = 38,
  variant = "dark",
  mode = "emblem",
  showWordmark = false,
  wordmarkSize = 18,
  showTagline = false,
  style
}: BrandLogoProps) {
  if (mode === "full") {
    const fullWidth = size * 2.2;
    return (
      <View style={[styles.container, style]}>
        <Image
          source={FULL_LOGO_ASSET}
          style={{ width: fullWidth, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const isDark = variant === "dark";
  const borderRadius = Math.round(size * 0.28);

  const badge = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: isDark ? "#1D1D1F" : "#FFFFFF",
          borderWidth: isDark ? 1 : 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0, 102, 204, 0.25)"
        },
        !showWordmark && style
      ]}
    >
      <Image
        source={EMBLEM_ASSET}
        style={{ width: size * 0.74, height: size * 0.74 }}
        resizeMode="contain"
      />
    </View>
  );

  if (!showWordmark) {
    return badge;
  }

  return (
    <View style={[styles.wordmarkRow, style]}>
      {badge}
      <View>
        <Text style={[styles.wordmarkText, { fontSize: wordmarkSize }]}>
          LesTrades
        </Text>
        {showTagline && (
          <Text style={styles.taglineText}>Quality for Less</Text>
        )}
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
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  wordmarkText: {
    fontWeight: "800",
    color: "#0066CC",
    letterSpacing: -0.4,
    fontStyle: "italic"
  },
  taglineText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0066CC",
    fontStyle: "italic",
    letterSpacing: 0.2,
    marginTop: -1
  }
});

export default BrandLogo;
