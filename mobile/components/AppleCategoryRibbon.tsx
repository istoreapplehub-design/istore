import React, { useMemo } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius } from "../constants/theme";
import { Product } from "../types";
import { getProductImage } from "./ProductVisual";

interface CategoryItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  slug: string;
}

const APPLE_CATEGORIES: CategoryItem[] = [
  { name: "iPhone", icon: "phone-portrait-outline", slug: "iPhone" },
  { name: "Mac", icon: "laptop-outline", slug: "Mac" },
  { name: "iPad", icon: "tablet-portrait-outline", slug: "iPad" },
  { name: "Watch", icon: "watch-outline", slug: "Watch" },
  { name: "AirPods", icon: "headset-outline", slug: "AirPods" },
  { name: "TV & Home", icon: "tv-outline", slug: "TV & Home" },
  { name: "Accessories", icon: "hardware-chip-outline", slug: "Accessories" }
];

interface AppleCategoryRibbonProps {
  /** Used to pull a real thumbnail per category; falls back to the glyph. */
  products?: Product[];
}

export function AppleCategoryRibbon({ products = [] }: AppleCategoryRibbonProps) {
  const router = useRouter();

  const thumbByCategory = useMemo(() => {
    const map: Record<string, string> = {};
    for (const product of products) {
      const key = product.category;
      if (map[key]) continue;
      const image = getProductImage(product);
      if (image) map[key] = image;
    }
    return map;
  }, [products]);

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={APPLE_CATEGORIES}
      keyExtractor={(item) => item.slug}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const thumb = thumbByCategory[item.slug];

        return (
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/(tabs)/shop?category=${encodeURIComponent(item.slug)}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Shop ${item.name}`}
          >
            <View style={styles.thumbWrap}>
              {thumb ? (
                <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="contain" />
              ) : (
                <Ionicons name={item.icon} size={26} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.tileName}>{item.name}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    gap: 14
  },
  tile: {
    alignItems: "center",
    width: 74
  },
  tilePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }]
  },
  thumbWrap: {
    width: 70,
    height: 70,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 9
  },
  thumb: {
    width: "100%",
    height: "100%"
  },
  tileName: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
    marginTop: 7,
    textAlign: "center"
  }
});

export default AppleCategoryRibbon;
