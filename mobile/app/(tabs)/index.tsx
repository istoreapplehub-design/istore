/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on category chip and top bar actions
 * - Haptics.notificationAsync("error") on network/API load failure
 */
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { CATEGORIES } from "../../constants/config";
import { useHomeData } from "../../hooks/useHomeData";
import { useCartStore } from "../../store/useCartStore";
import { Product } from "../../types";
import { Badge } from "../../components/Badge";
import { CategoryTile } from "../../components/CategoryTile";
import { HeroCarousel } from "../../components/HeroCarousel";
import { ProductCard } from "../../components/ProductCard";
import { SectionHeader } from "../../components/SectionHeader";
import {
  SkeletonHeroBanner,
  SkeletonProductCard,
  SkeletonRow
} from "../../components/SkeletonLoader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CATEGORY_TILE_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;
const TODAY_CARD_WIDTH = 300;
const TODAY_CARD_GAP = 16;
const TODAY_SNAP_INTERVAL = TODAY_CARD_WIDTH + TODAY_CARD_GAP;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const {
    featured,
    newArrivals,
    bestSellers,
    categories,
    loading,
    error,
    refetch
  } = useHomeData();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (error && !loading && featured.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error, loading, featured.length]);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  const topBarBorderStyle = useAnimatedStyle(() => {
    const isScrolled = scrollY.value > 40;
    return {
      opacity: withTiming(isScrolled ? 1 : 0, { duration: 180 })
    };
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  // Find product with the highest discount for the Featured Deal section
  const featuredDealProduct: Product | undefined = [...newArrivals, ...bestSellers]
    .filter((p) => p.compareAtPriceGHS && p.compareAtPriceGHS > p.priceGHS)
    .sort(
      (a, b) =>
        (b.compareAtPriceGHS! - b.priceGHS) - (a.compareAtPriceGHS! - a.priceGHS)
    )[0] || featured[0];

  const featuredDealSavings =
    featuredDealProduct && featuredDealProduct.compareAtPriceGHS
      ? featuredDealProduct.compareAtPriceGHS - featuredDealProduct.priceGHS
      : 1400;

  // ─── ERROR STATE ──────────────────────────────────────────────────────────
  if (error && !loading && featured.length === 0) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            Haptics.selectionAsync();
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ─── 1. STICKY TOP BAR ────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>I-Store</Text>

        <View style={styles.topBarActions}>
          <Pressable
            hitSlop={8}
            style={styles.iconButton}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/search");
            }}
          >
            <Ionicons name="search-outline" size={24} color={colors.text} />
          </Pressable>

          <Pressable
            hitSlop={8}
            style={styles.iconButton}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/bag");
            }}
          >
            <Ionicons name="bag-outline" size={24} color={colors.text} />
            {cartItemCount > 0 && (
              <View style={styles.badgeWrapper}>
                <Badge count={cartItemCount} />
              </View>
            )}
          </Pressable>
        </View>

        <Animated.View style={[styles.topBarBottomBorder, topBarBorderStyle]} />
      </View>

      {/* ─── MAIN SCROLL VIEW ──────────────────────────────────────────────── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            title="Pull to refresh"
          />
        }
      >
        {/* ─── 2. HERO CAROUSEL ───────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={styles.heroSection}
        >
          {loading && featured.length === 0 ? (
            <SkeletonHeroBanner />
          ) : (
            <HeroCarousel products={featured} />
          )}
        </Animated.View>

        {/* ─── 3. "TODAY" EDITORIAL CARDS ─────────────────────────────────── */}
        {!loading && newArrivals.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(80).springify()}
            style={styles.sectionWrapper}
          >
            <SectionHeader title="Today" subtitle="Handpicked for you" />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={newArrivals.slice(0, 4)}
              keyExtractor={(item) => item.id}
              snapToInterval={TODAY_SNAP_INTERVAL}
              decelerationRate="fast"
              contentContainerStyle={styles.todayListContent}
              renderItem={({ item }) => {
                const img =
                  item.images && item.images.length > 0
                    ? item.images[0]
                    : "https://placehold.co/800x800?text=Apple";

                return (
                  <Pressable
                    style={styles.todayCard}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/product/${item.slug}`);
                    }}
                  >
                    <Image source={{ uri: img }} style={styles.todayImage} resizeMode="cover" />
                    <LinearGradient
                      colors={[colors.gradientTop, colors.gradientBottom]}
                      style={styles.todayGradient}
                    />

                    <View style={styles.todayChevron}>
                      <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                    </View>

                    <View style={styles.todayTextContainer}>
                      <Text style={styles.todayCategory}>
                        {item.category.toUpperCase()}
                      </Text>
                      <Text style={styles.todayTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.todayPrice}>
                        ₵{item.priceGHS.toLocaleString("en-GH", { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </Animated.View>
        )}

        {/* ─── 4. "NEW ARRIVALS" HORIZONTAL SCROLLER ──────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(160).springify()}
          style={styles.sectionWrapper}
        >
          <SectionHeader
            title="New Arrivals"
            onSeeAll={() => router.push("/(tabs)/shop")}
          />
          {loading && newArrivals.length === 0 ? (
            <View style={styles.skeletonsRow}>
              <SkeletonProductCard />
              <SkeletonProductCard />
              <SkeletonProductCard />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={newArrivals}
              keyExtractor={(item) => item.id}
              removeClippedSubviews={true}
              windowSize={3}
              maxToRenderPerBatch={3}
              contentContainerStyle={styles.horizontalListContent}
              renderItem={({ item }) => <ProductCard product={item} variant="grid" />}
            />
          )}
        </Animated.View>

        {/* ─── 5. "SHOP BY CATEGORY" GRID ─────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(240).springify()}
          style={styles.sectionWrapper}
        >
          <SectionHeader title="Shop by Category" />
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const configDef = CATEGORIES.find(
                (c) => c.slug.toLowerCase() === cat.slug.toLowerCase()
              );
              const iconName = (configDef?.icon || "cube-outline") as keyof typeof Ionicons.glyphMap;

              return (
                <View key={cat.slug} style={{ width: CATEGORY_TILE_WIDTH }}>
                  <CategoryTile
                    name={cat.name}
                    count={cat.count}
                    icon={iconName}
                    onPress={() =>
                      router.push(`/(tabs)/shop?category=${encodeURIComponent(cat.name)}`)
                    }
                  />
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ─── 6. "BEST SELLERS" VERTICAL GROUPED LIST ────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(320).springify()}
          style={styles.sectionWrapper}
        >
          <SectionHeader
            title="Best Sellers"
            onSeeAll={() => router.push("/(tabs)/shop?sort=popular")}
          />

          <View style={styles.bestSellersGroup}>
            {loading && bestSellers.length === 0 ? (
              <View style={{ padding: spacing.md }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </View>
            ) : (
              bestSellers.slice(0, 5).map((item) => (
                <ProductCard key={item.id} product={item} variant="row" />
              ))
            )}
          </View>
        </Animated.View>

        {/* ─── 7. FEATURED DEAL BANNER ────────────────────────────────────── */}
        {featuredDealProduct && (
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.dealSectionWrapper}
          >
            <Pressable
              style={styles.dealCard}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/product/${featuredDealProduct.slug}`);
              }}
            >
              <LinearGradient
                colors={[colors.accent, "#0051A3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dealGradient}
              >
                <View style={styles.dealContent}>
                  <Text style={styles.dealLabel}>LIMITED TIME</Text>
                  <Text style={styles.dealTitle} numberOfLines={2}>
                    {featuredDealProduct.name}
                  </Text>
                  <Text style={styles.dealSavings}>
                    Save ₵{featuredDealSavings.toLocaleString("en-GH")}
                  </Text>
                  <View style={styles.dealCta}>
                    <Text style={styles.dealCtaText}>Shop Now</Text>
                  </View>
                </View>

                {featuredDealProduct.images && featuredDealProduct.images[0] && (
                  <Image
                    source={{ uri: featuredDealProduct.images[0] }}
                    style={styles.dealImage}
                    resizeMode="contain"
                  />
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* ─── 8. FOOTER ──────────────────────────────────────────────────── */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Made in Ghana 🇬🇭</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    height: 56,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    zIndex: 10
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconButton: {
    position: "relative",
    padding: 4
  },
  badgeWrapper: {
    position: "absolute",
    top: -2,
    right: -6
  },
  topBarBottomBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border
  },
  scrollContent: {
    paddingBottom: 100
  },
  heroSection: {
    marginTop: spacing.xs
  },
  sectionWrapper: {
    marginTop: spacing.lg
  },
  todayListContent: {
    paddingHorizontal: spacing.md,
    gap: TODAY_CARD_GAP
  },
  todayCard: {
    width: TODAY_CARD_WIDTH,
    height: 340,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative"
  },
  todayImage: {
    width: "100%",
    height: "100%"
  },
  todayGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200
  },
  todayChevron: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  todayTextContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20
  },
  todayCategory: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)"
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginTop: 4
  },
  todayPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 8
  },
  skeletonsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md
  },
  horizontalListContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md - 4
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: spacing.md
  },
  bestSellersGroup: {
    marginHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.soft,
    paddingVertical: 4
  },
  dealSectionWrapper: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md
  },
  dealCard: {
    borderRadius: 24,
    height: 200,
    overflow: "hidden"
  },
  dealGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    position: "relative"
  },
  dealContent: {
    flex: 1,
    paddingRight: 110
  },
  dealLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "700"
  },
  dealTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginTop: 6
  },
  dealSavings: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    marginTop: 8
  },
  dealCta: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 14
  },
  dealCtaText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600"
  },
  dealImage: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 100,
    height: 100,
    borderRadius: radius.lg
  },
  footerContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500"
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md
  },
  errorMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    marginTop: spacing.lg
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  }
});
