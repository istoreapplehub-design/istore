import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
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
import { colors, formatGHS, radius, spacing } from "../../constants/theme";

const EDITORIAL_GAP = 14;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const stageWidth = Math.min(width, 820);
  const numCols = stageWidth >= 680 ? 3 : 2;
  const gridGap = 12;
  const cardWidth = Math.floor((stageWidth - 32 - gridGap * (numCols - 1)) / numCols);
  const editorialWidth = Math.min(Math.max(stageWidth - 64, 270), 340);

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

  const filteredCurated = useMemo(() => {
    const pool =
      selectedCategory === "All"
        ? bestSellers.length > 0
          ? bestSellers
          : allCatalog
        : allCatalog.filter(
            (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
          );
    return pool.slice(0, numCols * 3);
  }, [selectedCategory, bestSellers, allCatalog, numCols]);

  const heroProducts = featured.length > 0 ? featured : newArrivals.slice(0, 5);
  const editorial = newArrivals.slice(0, 6);

  const nothingLoaded =
    !loading && heroProducts.length === 0 && editorial.length === 0 && bestSellers.length === 0;

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
            tintColor={colors.brandRed}
            colors={[colors.brandRed]}
          />
        }
      >
        {/* Dribbble Tactile Search & Quick-Filter Bar */}
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/search");
            }}
            style={({ pressed }) => [
              styles.searchPill,
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search iPhone 18 Pro Max, iPhone Duo, Watch Ultra 3...
            </Text>
            <View style={styles.searchKbd}>
              <Ionicons name="sparkles" size={11} color={colors.brandRed} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/shop");
            }}
            style={({ pressed }) => [
              styles.filterBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }
            ]}
            accessibilityLabel="Browse full catalog and filters"
          >
            <Ionicons name="options-outline" size={19} color="#FFFFFF" />
            <View style={styles.filterBtnDot} />
          </Pressable>
        </View>

        {/* Split-Stage Obsidian Titanium Bento Hero */}
        <HeroCarousel products={heroProducts} />

        {/* Express Assurance Mini-Bento Strip */}
        <View style={styles.assuranceRow}>
          <Pressable
            style={styles.assuranceCard}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/shop");
            }}
          >
            <View style={styles.assuranceIconWrap}>
              <Ionicons name="flash" size={14} color={colors.brandRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assuranceTitle} numberOfLines={1}>
                Same-Day Delivery
              </Text>
              <Text style={styles.assuranceSub} numberOfLines={1}>
                Accra & Kumasi Express
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.assuranceCard}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/help");
            }}
          >
            <View style={styles.assuranceIconWrap}>
              <Ionicons name="shield-checkmark" size={14} color="#0D0D12" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assuranceTitle} numberOfLines={1}>
                1-Yr Apple Care
              </Text>
              <Text style={styles.assuranceSub} numberOfLines={1}>
                100% Sealed & Verified
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Interactive Category Capsule Rail */}
        <View style={styles.ribbonWrap}>
          <AppleCategoryRibbon
            products={allCatalog}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        {/* Curated Studio Grid (Live Filtered by Category) */}
        <Animated.View entering={FadeInDown.duration(380)}>
          <SectionHeader
            title={
              selectedCategory === "All" ? "Popular Flagships" : `${selectedCategory} Lineup`
            }
            subtitle={
              selectedCategory === "All"
                ? "Tap + on any device to add directly to your bag"
                : `Authorized ${selectedCategory} models ready to ship`
            }
            onSeeAll={() =>
              router.push(
                selectedCategory === "All"
                  ? "/(tabs)/shop"
                  : `/(tabs)/shop?category=${encodeURIComponent(selectedCategory)}`
              )
            }
          />

          {loading && filteredCurated.length === 0 ? (
            <View style={styles.skeletonRow}>
              <SkeletonProductCard />
              <SkeletonProductCard />
            </View>
          ) : (
            <View style={styles.bentoGrid}>
              {filteredCurated.map((item) => (
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

        {/* Flash Drops Dark Bento Band */}
        {deals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(420)} style={styles.flashBand}>
            <View style={styles.flashBandHead}>
              <View style={styles.flashTitleRow}>
                <View style={styles.flashIconCircle}>
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.flashEyebrow}>LIMITED TIME DROPS</Text>
                  <Text style={styles.flashTitle}>Flash Sales</Text>
                </View>
              </View>
              <CountdownTimer endsAt={endsAt} variant="inline" />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={deals.slice(0, 8)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flashListContent}
              renderItem={({ item }) => <FlashDealCard product={item} />}
            />

            <Pressable
              style={({ pressed }) => [styles.flashSeeAll, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(tabs)/flash");
              }}
            >
              <Text style={styles.flashSeeAllText}>Explore all {deals.length} live drops</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* The Latest — Studio Pedestal Editorial Cards */}
        <Animated.View entering={FadeInDown.delay(100).duration(420)}>
          <SectionHeader
            title="New Arrivals"
            subtitle="Freshly unboxed in our Accra showroom"
            onSeeAll={() => router.push("/(tabs)/shop?sort=newest")}
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={editorial}
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
                    pressed && { transform: [{ scale: 0.98 }] }
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
                          {isSale ? "SPECIAL OFFER" : "JUST LANDED"}
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
                      <Text style={styles.editorialPillText}>Buy</Text>
                      <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </Animated.View>

        {/* Why I-Store — The I-Store Standard as the final section */}
        <Animated.View entering={FadeInDown.delay(140).duration(420)} style={styles.standardSection}>
          <SectionHeader
            title="The I-Store Standard"
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
    backgroundColor: "#F6F7FB"
  },
  scrollContent: {
    paddingBottom: 8
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6
  },
  searchPill: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "500",
    color: colors.textSecondary
  },
  searchKbd: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.brandRedSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3
  },
  filterBtnDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandRed
  },
  assuranceRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12
  },
  assuranceCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  assuranceIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F4F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  assuranceTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0D0D12",
    letterSpacing: -0.2
  },
  assuranceSub: {
    fontSize: 10.5,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 1
  },
  ribbonWrap: {
    paddingTop: 14,
    paddingBottom: 4
  },
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12
  },
  flashBand: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: "#0D0D12",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.35)",
    paddingTop: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6
  },
  flashBandHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14
  },
  flashTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  flashIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.brandRed,
    alignItems: "center",
    justifyContent: "center"
  },
  flashEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.brandRed
  },
  flashTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5
  },
  flashListContent: {
    paddingLeft: 18,
    paddingRight: 8,
    gap: 12,
    paddingBottom: 16
  },
  flashSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    backgroundColor: colors.brandRed
  },
  flashSeeAllText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.1
  },
  editorialContent: {
    paddingHorizontal: 16,
    gap: EDITORIAL_GAP
  },
  editorialCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3
  },
  editorialStage: {
    height: 210,
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
    backgroundColor: colors.brandRed
  },
  editorialBadgeNew: {
    backgroundColor: "#0D0D12"
  },
  editorialBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#FFFFFF"
  },
  editorialStorageTag: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    backgroundColor: "rgba(255,255,255,0.9)",
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
    borderTopColor: "rgba(0,0,0,0.05)"
  },
  editorialTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#0D0D12"
  },
  editorialPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brandRed,
    marginTop: 2
  },
  editorialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0D0D12",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full
  },
  editorialPillText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800"
  },
  standardSection: {
    marginTop: 6,
    marginBottom: 0
  },
  standardHeader: {
    paddingTop: 6,
    paddingBottom: 6
  },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 14
  }
});

