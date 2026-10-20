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
import { colors, radius, typography } from "../../constants/theme";
import { Product } from "../../types";
import { getProduct } from "../../services/api";
import { useWishlistStore } from "../../store/useWishlistStore";
import AppHeader from "../../components/AppHeader";
import ProductCard from "../../components/ProductCard";
import SkeletonLoader from "../../components/SkeletonLoader";

export default function FavoritesTabScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, 820);
  const numColumns = containerWidth >= 680 ? 3 : 2;
  const cardWidth = Math.floor((containerWidth - 32 - 12 * (numColumns - 1)) / numColumns);
  const { items: wishlistIds, clear: clearWishlist } = useWishlistStore();

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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppHeader
        title="Favorites"
        subtitle={
          displayedProducts.length > 0
            ? `${displayedProducts.length} saved ${displayedProducts.length === 1 ? "device" : "devices"}`
            : "Save devices to compare and buy later"
        }
      />

      {loading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={[styles.skeletonCard, { width: cardWidth }]}>
              <SkeletonLoader height={160} radius={16} />
              <SkeletonLoader height={18} width="85%" style={{ marginTop: 10 }} />
              <SkeletonLoader height={14} width="50%" style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      ) : displayedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={38} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any iPhone, Mac, iPad, Watch, or accessory to save it to your personal shortlist.
          </Text>

          <View style={styles.emptyActions}>
            <Pressable
              style={({ pressed }) => [
                styles.startShoppingBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/shop");
              }}
            >
              <Text style={styles.startShoppingText}>Explore Products</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.compareLinkBtn,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/compare" as never);
              }}
            >
              <Ionicons name="git-compare-outline" size={16} color={colors.brandAccent} />
              <Text style={styles.compareLinkText}>Compare Apple Models</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          key={`favorites-cols-${numColumns}`}
          data={displayedProducts}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.toolbarRow}>
              <Pressable
                style={({ pressed }) => [styles.compareBtn, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  const slugs = displayedProducts
                    .slice(0, 2)
                    .map((p) => p.slug)
                    .join(",");
                  router.push(`/compare?items=${encodeURIComponent(slugs)}` as never);
                }}
              >
                <Ionicons name="git-compare-outline" size={15} color={colors.text} />
                <Text style={styles.compareBtnText}>Compare Saved</Text>
              </Pressable>

              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearWishlist();
                }}
              >
                <Text style={styles.clearText}>Clear All</Text>
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          renderItem={({ item }) => (
            <Animated.View
              layout={Layout.springify()}
              entering={FadeIn}
              exiting={FadeOut.duration(200)}
              style={[styles.cardWrapper, { width: cardWidth, maxWidth: cardWidth }]}
            >
              <ProductCard product={item} variant="grid" style={styles.gridCard} />
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
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  compareBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  clearText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: 16
  },
  listContent: {
    gap: 12,
    paddingTop: 8,
    paddingBottom: 32
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
    paddingHorizontal: 36,
    marginTop: -20
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 22,
    color: colors.text,
    marginTop: 18
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21
  },
  emptyActions: {
    alignItems: "center",
    marginTop: 24,
    gap: 14
  },
  startShoppingBtn: {
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingHorizontal: 28,
    paddingVertical: 14
  },
  startShoppingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  },
  compareLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6
  },
  compareLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brandAccent
  }
});
