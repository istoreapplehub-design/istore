/**
 * Haptics Audit:
 * - Haptics.impactAsync("medium") on wishlist item removal
 * - Haptics.impactAsync("light") on start shopping button
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { colors, typography } from "../constants/theme";
import { Product } from "../types";
import { getProduct } from "../services/api";
import { useWishlistStore } from "../store/useWishlistStore";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";

export default function WishlistScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, 820);
  const numColumns = containerWidth >= 680 ? 3 : 2;
  const cardWidth = Math.floor((containerWidth - 32 - 12 * (numColumns - 1)) / numColumns);
  const { items: wishlistIds } = useWishlistStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlistProducts = useCallback(async () => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const results = await Promise.all(
        wishlistIds.map(async (id) => {
          try {
            return await getProduct(id);
          } catch {
            return null;
          }
        })
      );

      const validProducts = results.filter((p): p is Product => p !== null);
      setProducts(validProducts);
    } catch {
      // Silently handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wishlistIds]);

  useEffect(() => {
    fetchWishlistProducts();
  }, [fetchWishlistProducts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWishlistProducts();
  };

  const displayedProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={[styles.skeletonCard, { width: cardWidth }]}>
              <SkeletonLoader height={160} radius={16} />
              <SkeletonLoader height={18} width="85%" style={{ marginTop: 10 }} />
              <SkeletonLoader height={14} width="50%" style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {displayedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="heart-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any product to save it here.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.startShoppingBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)");
            }}
          >
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={`wishlist-cols-${numColumns}`}
          data={displayedProducts}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={styles.countHeader}>
              <View style={styles.countRow}>
                <Ionicons name="heart" size={16} color={colors.brandRed} />
                <Text style={styles.countTitle}>Saved Devices</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {displayedProducts.length}{" "}
                  {displayedProducts.length === 1 ? "item" : "items"}
                </Text>
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              title="Pull to refresh"
            />
          }
          renderItem={({ item }) => (
            <Animated.View
              layout={Layout.springify()}
              entering={FadeIn}
              exiting={FadeOut.duration(200)}
              style={[styles.cardWrapper, { width: cardWidth, maxWidth: cardWidth }]}
            >
              <ProductCard
                product={item}
                variant="grid"
                style={styles.gridCard}
              />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12
  },
  skeletonCard: {
    width: "48%",
    marginBottom: 16
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: 16
  },
  listContent: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 32
  },
  countHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  countTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  countBadge: {
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 980
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandRed
  },
  cardWrapper: {
    flex: 1,
    position: "relative"
  },
  gridCard: {
    width: "100%"
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: -40
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 22,
    color: colors.text,
    marginTop: 18
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6
  },
  startShoppingBtn: {
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 24
  },
  startShoppingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  }
});
