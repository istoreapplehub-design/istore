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
  { name: "All", icon: "sparkles-outline", slug: "All" },
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
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function AppleCategoryRibbon({
  products = [],
  selectedCategory = "All",
  onSelectCategory
}: AppleCategoryRibbonProps) {
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
        const isActive = selectedCategory === item.slug;

        return (
          <Pressable
            style={({ pressed }) => [
              styles.capsule,
              isActive ? styles.capsuleActive : styles.capsuleIdle,
              pressed && styles.capsulePressed
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              if (onSelectCategory) {
                onSelectCategory(item.slug);
              } else if (item.slug === "All") {
                router.push("/(tabs)/shop");
              } else {
                router.push(`/(tabs)/shop?category=${encodeURIComponent(item.slug)}`);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Shop ${item.name}`}
          >
            <View
              style={[
                styles.thumbCircle,
                isActive ? styles.thumbCircleActive : styles.thumbCircleIdle
              ]}
            >
              {thumb && item.slug !== "All" ? (
                <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={isActive ? "#FFFFFF" : "#0D0D12"}
                />
              )}
            </View>
            <Text
              style={[
                styles.capsuleText,
                isActive ? styles.capsuleTextActive : styles.capsuleTextIdle
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    gap: 10
  },
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1
  },
  capsuleActive: {
    backgroundColor: "#0D0D12",
    borderColor: "#0D0D12",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3
  },
  capsuleIdle: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.07)"
  },
  capsulePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }]
  },
  thumbCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 0
  },
  thumbCircleActive: {
    backgroundColor: colors.brandRed
  },
  thumbCircleIdle: {
    backgroundColor: "#FFFFFF"
  },
  thumb: {
    width: "100%",
    height: "100%"
  },
  capsuleText: {
    fontSize: 13,
    letterSpacing: -0.2
  },
  capsuleTextActive: {
    fontWeight: "800",
    color: "#FFFFFF"
  },
  capsuleTextIdle: {
    fontWeight: "600",
    color: "#0D0D12"
  }
});

export default AppleCategoryRibbon;

