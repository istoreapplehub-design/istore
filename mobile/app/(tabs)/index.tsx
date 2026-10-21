import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue
} from "react-native-reanimated";
import AppHeader from "../../components/AppHeader";
import ErrorState from "../../components/ErrorState";
import { AppleCategoryRibbon } from "../../components/AppleCategoryRibbon";
import CountdownTimer from "../../components/CountdownTimer";
import { HeroCarousel } from "../../components/HeroCarousel";
import { FlashDealCard } from "../../components/FlashDealCard";
import { ProductCard } from "../../components/ProductCard";
import { SectionHeader } from "../../components/SectionHeader";
import { ValuePropRail } from "../../components/ValuePropRail";
import { SkeletonProductCard } from "../../components/SkeletonLoader";
import { ProductVisual, getProductImage } from "../../components/ProductVisual";
import { useHomeData } from "../../hooks/useHomeData";
import { useFlashDeals } from "../../hooks/useFlashDeals";
import { colors, formatGHS, radius } from "../../constants/theme";
import { SUPPORT_WHATSAPP_URL } from "../../constants/support";

const EDITORIAL_GAP = 14;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const maxContainer = isDesktop ? 1200 : isTablet ? 960 : 820;
  const stageWidth = Math.min(width, maxContainer);
  const numCols = isDesktop ? 4 : isTablet ? 3 : 2;
  const gridGap = isDesktop ? 16 : 12;
  const horizontalPadding = isDesktop ? 20 : 16;
  const cardWidth = Math.floor(
    (stageWidth - horizontalPadding * 2 - gridGap * (numCols - 1)) / numCols
  );
  const editorialWidth = isDesktop ? 340 : Math.min(Math.max(stageWidth - 64, 270), 330);

  const { featured, newArrivals, bestSellers, loading, error, refetch } = useHomeData();
  const { deals, products, endsAt, error: flashError } = useFlashDeals();

  const [scrolled, setScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const scrolledFlag = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const past = event.contentOffset.y > 6;
      if (past && scrolledFlag.value === 0) {
        scrolledFlag.value = 1;
        runOnJS(setScrolled)(true);
      } else if (!past && scrolledFlag.value === 1) {
        scrolledFlag.value = 0;
        runOnJS(setScrolled)(false);
      }
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  const allCatalog = useMemo(() => {
    if (products && products.length > 0) return products;
    const map = new Map<string, (typeof newArrivals)[0]>();
    [...featured, ...newArrivals, ...bestSellers].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [products, featured, newArrivals, bestSellers]);

  const filteredFeatured = useMemo(() => {
    const pool =
      selectedCategory === "All"
        ? bestSellers.length > 0
          ? bestSellers
          : allCatalog
        : allCatalog.filter(
            (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
          );
    return pool.slice(0, numCols * 5);
  }, [selectedCategory, bestSellers, allCatalog, numCols]);

  const accessoriesCollection = useMemo(
    () =>
      allCatalog
        .filter((p) => p.category.toLowerCase() === "accessories")
        .slice(0, 8),
    [allCatalog]
  );

  const heroProducts = featured.length > 0 ? featured : newArrivals.slice(0, 6);
  const latestArrivals = newArrivals.slice(0, 10);

  const nothingLoaded =
    !loading && heroProducts.length === 0 && latestArrivals.length === 0 && bestSellers.length === 0;

  if (nothingLoaded && (error || flashError)) {
    return (
      <View style={styles.root}>
        <AppHeader scrolled={scrolled} />
        <ErrorState error={error || flashError} onRetry={() => refetch()} />
      </View>
    );
  }

  if (nothingLoaded) {
    return (
      <View style={styles.root}>
        <AppHeader scrolled={scrolled} />
        <ErrorState
          empty
          emptyTitle="The store is being stocked"
          emptySubtitle="No devices are published yet. Please check back shortly."
          emptyIcon="cube-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* 1. Minimal Header with Brand Identity, Search, Favorites, and Bag */}
      <AppHeader scrolled={scrolled} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
      >
        {/* Quick Search Bar */}
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/search");
            }}
            style={({ pressed }) => [
              styles.searchPill,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search iPhone, Mac, iPad, Watch, AirPods...
            </Text>
          </Pressable>
        </View>

        {/* 2. Large Hero Section Featuring a Flagship Product */}
        <HeroCarousel products={heroProducts} />

        {/* 3. Horizontal Category Selector */}
        <View style={styles.ribbonWrap}>
          <AppleCategoryRibbon
            products={allCatalog}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        {/* 4. New Arrivals Section */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <SectionHeader
            title="New Arrivals"
            subtitle="The latest generation of Apple innovation"
            onSeeAll={() => router.push("/(tabs)/shop?sort=newest")}
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={latestArrivals}
            keyExtractor={(item) => item.id}
            snapToInterval={editorialWidth + EDITORIAL_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.editorialContent}
            renderItem={({ item }) => {
              const image = getProductImage(item);
              const isSale = Boolean(
                item.compareAtPriceGHS && item.compareAtPriceGHS > item.priceGHS
              );

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.editorialCard,
                    { width: editorialWidth },
                    pressed && { transform: [{ scale: 0.985 }] }
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/product/${item.slug}`);
                  }}
                >
                  <View style={styles.editorialStage}>
                    <View style={styles.editorialTopRow}>
                      <View
                        style={[
                          styles.editorialBadge,
                          isSale ? styles.editorialBadgeSale : styles.editorialBadgeNew
                        ]}
                      >
                        <Text style={styles.editorialBadgeText}>
                          {isSale ? "SPECIAL OFFER" : "NEW"}
                        </Text>
                      </View>
                      <Text style={styles.editorialStorageTag}>
                        {item.storage || item.category}
                      </Text>
                    </View>

                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.editorialImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.editorialImageFallback}>
                        <ProductVisual category={item.category} glyphSize={54} />
                      </View>
                    )}
                  </View>

                  <View style={styles.editorialFooter}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.editorialTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.editorialPrice}>
                        {formatGHS(item.priceGHS)}
                      </Text>
                    </View>
                    <View style={styles.editorialPill}>
                      <Text style={styles.editorialPillText}>Shop</Text>
                      <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </Animated.View>

        {/* FLASH DEALS BANNER */}
        <Animated.View entering={FadeInDown.delay(50).duration(360)} style={styles.flashDealsSection}>
          <Pressable
            style={({ pressed }) => [
              styles.flashDealsCard,
              pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/deals" as any);
            }}
          >
            <View style={styles.flashDealsLeft}>
              <View style={styles.flashDealsBadge}>
                <Ionicons name="flash" size={11} color="#FFFFFF" />
                <Text style={styles.flashDealsBadgeText}>TODAY'S FLASH DEALS</Text>
              </View>
              <Text style={styles.flashDealsTitle}>Limited-Time Apple Drops</Text>
              <Text style={styles.flashDealsSub}>Save up to ₵1,800 on iPhones, iPads & accessories</Text>
            </View>
            <View style={styles.flashDealsBtn}>
              <Text style={styles.flashDealsBtnText}>View Deals</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
            </View>
          </Pressable>
        </Animated.View>

        {/* 5. Featured Products in a Clean Product Grid */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <SectionHeader
            title={
              selectedCategory === "All" ? "Featured Products" : `${selectedCategory} Collection`
            }
            subtitle={
              selectedCategory === "All"
                ? "Curated hardware ready for immediate dispatch"
                : `Factory-sealed ${selectedCategory} models in stock`
            }
            onSeeAll={() =>
              router.push(
                selectedCategory === "All"
                  ? "/(tabs)/shop"
                  : `/(tabs)/shop?category=${encodeURIComponent(selectedCategory)}`
              )
            }
          />

          {loading && filteredFeatured.length === 0 ? (
            <View style={styles.skeletonRow}>
              <SkeletonProductCard />
              <SkeletonProductCard />
            </View>
          ) : (
            <View style={[styles.bentoGrid, { gap: gridGap, paddingHorizontal: horizontalPadding }]}>
              {filteredFeatured.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  variant="grid"
                  style={{ width: cardWidth }}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* 6. Accessories Collection */}
        {accessoriesCollection.length > 0 && (
          <Animated.View entering={FadeInDown.delay(90).duration(400)}>
            <SectionHeader
              title="Accessories Collection"
              subtitle="Cases, MagSafe chargers, wallets & precision essentials"
              onSeeAll={() => router.push("/(tabs)/shop?category=Accessories")}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={accessoriesCollection}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.accessoriesContent}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  variant="grid"
                  style={{ width: 182 }}
                />
              )}
            />
          </Animated.View>
        )}

        {/* 7. Promotional or Seasonal Collection */}
        {deals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(110).duration(420)} style={styles.promoSection}>
            <View style={styles.promoHead}>
              <View>
                <Text style={styles.promoEyebrow}>SEASONAL COLLECTION</Text>
                <Text style={styles.promoTitle}>Special Offers</Text>
              </View>
              <CountdownTimer endsAt={endsAt} variant="inline" />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={deals.slice(0, 8)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.promoListContent}
              renderItem={({ item }) => <FlashDealCard product={item} />}
            />

            <Pressable
              style={({ pressed }) => [styles.promoSeeAll, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/flash");
              }}
            >
              <Text style={styles.promoSeeAllText}>View all {deals.length} special offers</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.text} />
            </Pressable>
          </Animated.View>
        )}

        {/* 8. Customer Support & Shopping Assistance Section */}
        <Animated.View entering={FadeInDown.delay(140).duration(420)} style={styles.assistanceWrap}>
          <SectionHeader
            title="Shopping Assistance"
            subtitle="Personal guidance, model comparison & official protection"
          />

          <View style={styles.assistanceGrid}>
            <Pressable
              style={({ pressed }) => [styles.assistCard, pressed && { opacity: 0.88 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/compare" as never);
              }}
            >
              <View style={styles.assistIcon}>
                <Ionicons name="git-compare-outline" size={20} color={colors.text} />
              </View>
              <Text style={styles.assistCardTitle}>Compare Models</Text>
              <Text style={styles.assistCardSub}>
                Compare processors, cameras, displays & prices side by side.
              </Text>
              <View style={styles.assistLinkRow}>
                <Text style={styles.assistLinkText}>Open Compare</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.brandAccent} />
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.assistCard, pressed && { opacity: 0.88 }]}
              onPress={() => {
                Haptics.selectionAsync();
                Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {
                  router.push("/help");
                });
              }}
            >
              <View style={styles.assistIcon}>
                <Ionicons name="chatbubbles-outline" size={20} color={colors.text} />
              </View>
              <Text style={styles.assistCardTitle}>Ask a Specialist</Text>
              <Text style={styles.assistCardSub}>
                Get one-on-one help choosing the right configuration.
              </Text>
              <View style={styles.assistLinkRow}>
                <Text style={styles.assistLinkText}>Start Chat</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.brandAccent} />
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* The I-Dynamic Standard */}
        <Animated.View entering={FadeInDown.delay(160).duration(420)} style={styles.standardSection}>
          <SectionHeader
            title="The I-Dynamic Standard"
            subtitle="Engineered for peace of mind on every order"
            style={styles.standardHeader}
          />
          <ValuePropRail />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingBottom: 16
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6
  },
  searchPill: {
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary
  },
  ribbonWrap: {
    paddingTop: 12,
    paddingBottom: 2
  },
  editorialContent: {
    paddingHorizontal: 16,
    gap: EDITORIAL_GAP
  },
  editorialCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border
  },
  editorialStage: {
    height: 204,
    backgroundColor: "#FFFFFF",
    padding: 0,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  editorialTopRow: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  editorialBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full
  },
  editorialBadgeSale: {
    backgroundColor: colors.brandAccent
  },
  editorialBadgeNew: {
    backgroundColor: colors.text
  },
  editorialBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#FFFFFF"
  },
  editorialStorageTag: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    overflow: "hidden"
  },
  editorialImage: {
    width: "100%",
    height: "100%"
  },
  editorialImageFallback: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  editorialFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  editorialTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.text
  },
  editorialPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2
  },
  editorialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full
  },
  editorialPillText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "600"
  },
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12
  },
  accessoriesContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  promoSection: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 18,
    overflow: "hidden"
  },
  promoHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14
  },
  promoEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: colors.brandAccent
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: 2
  },
  promoListContent: {
    paddingLeft: 18,
    paddingRight: 8,
    gap: 12,
    paddingBottom: 16
  },
  promoSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  promoSeeAllText: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "600"
  },
  assistanceWrap: {
    marginTop: 4
  },
  assistanceGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12
  },
  assistCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between"
  },
  assistIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  assistCardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3
  },
  assistCardSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4
  },
  assistLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 10
  },
  assistLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brandAccent
  },
  standardSection: {
    marginTop: 4,
    marginBottom: 8
  },
  standardHeader: {
    paddingTop: 10,
    paddingBottom: 6
  },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 14
  },
  flashDealsSection: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 4
  },
  flashDealsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1D1D1F",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2
  },
  flashDealsLeft: {
    flex: 1,
    marginRight: 12
  },
  flashDealsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0066CC",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6
  },
  flashDealsBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  flashDealsTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3
  },
  flashDealsSub: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 11.5,
    marginTop: 2
  },
  flashDealsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill
  },
  flashDealsBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  }
});
