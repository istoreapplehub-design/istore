import React from "react";
import { StyleSheet, StyleProp, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";
import { Product } from "../types";

/**
 * The catalogue is photographed in-house, so a product either has a real photo or
 * none at all. Placeholder hosts (placehold.co) are treated as "no photo" so the UI
 * never presents a stock image as the device someone is about to buy.
 */
export function getProductImage(product?: Pick<Product, "images"> | null): string | null {
  const url = product?.images?.find((u) => u && !u.includes("placehold.co"));
  return url || null;
}

/** Same rule for single stored URLs (cart rows, order line items). */
export function getStoredImage(url?: string | null): string | null {
  return url && !url.includes("placehold.co") ? url : null;
}

const GLYPHS: Record<string, keyof typeof Ionicons.glyphMap> = {
  iphone: "phone-portrait-outline",
  ipad: "tablet-portrait-outline",
  mac: "laptop-outline",
  watch: "watch-outline",
  airpods: "headset-outline",
  "tv & home": "tv-outline",
  accessories: "cube-outline"
};

function glyphFor(category?: string): keyof typeof Ionicons.glyphMap {
  const key = (category || "").trim().toLowerCase();
  return GLYPHS[key] || "cube-outline";
}

interface ProductVisualProps {
  category?: string;
  name?: string;
  glyphSize?: number;
  showName?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Monochrome stand-in for products without photography: device silhouette on a
 * plinth, with the product name kept small so the tile still reads as intentional.
 */
export function ProductVisual({
  category,
  name,
  glyphSize = 44,
  showName = false,
  style
}: ProductVisualProps) {
  return (
    <View style={[styles.plinth, style]}>
      <View style={[styles.halo, { width: glyphSize * 2.1, height: glyphSize * 2.1 }]}>
        <Ionicons name={glyphFor(category)} size={glyphSize} color={colors.textSecondary} />
      </View>
      {showName && name ? (
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plinth: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface
  },
  halo: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 10,
    paddingHorizontal: 12,
    textAlign: "center"
  }
});

export default ProductVisual;
