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
  View
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
  const { items: wishlistIds, toggle } = useWishlistStore();

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

  const handleRemove = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggle(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {products.length === 0 ? (
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
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={5}
          removeClippedSubviews={true}
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
              style={styles.cardWrapper}
            >
              <ProductCard
                product={item}
                variant="grid"
                style={styles.gridCard}
              />

              {/* Heart badge button to remove from wishlist */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name} from wishlist`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.heartBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }
                ]}
                onPress={() => handleRemove(item.id)}
              >
                <Ionicons name="heart" size={18} color={colors.danger} />
              </Pressable>
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
    paddingTop: 16,
    paddingBottom: 100
  },
  cardWrapper: {
    flex: 1,
    position: "relative"
  },
  gridCard: {
    width: "100%"
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
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
