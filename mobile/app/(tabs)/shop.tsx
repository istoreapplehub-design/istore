/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on category chip selection
 * - Haptics.impactAsync("light") on filter sheet open and sort option select
 * - Haptics.impactAsync("medium") on filter apply
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../../constants/theme";
import { AppHaptics } from "../../lib/haptics";
import { Product } from "../../types";
import { getProducts } from "../../services/api";
import AppHeader from "../../components/AppHeader";
import ProductCard from "../../components/ProductCard";
import SkeletonLoader from "../../components/SkeletonLoader";
import ErrorState from "../../components/ErrorState";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "iPhone", value: "iPhone" },
  { label: "iPad", value: "iPad" },
  { label: "Mac", value: "Mac" },
  { label: "Watch", value: "Watch" },
  { label: "AirPods", value: "AirPods" },
  { label: "TV & Home", value: "TV & Home" },
  { label: "Accessories", value: "Accessories" }
];

type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest Arrivals",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  rating: "Top Rated"
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, 820);
  const numColumns = containerWidth >= 680 ? 3 : 2;
  const cardWidth = Math.floor((containerWidth - 32 - 12 * (numColumns - 1)) / numColumns);
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; sort?: string }>();

  // Parse initial category from query param
  const initialCategory = (() => {
    if (!params.category) return "all";
    const found = CATEGORIES.find(
      (c) => c.value.toLowerCase() === params.category?.toLowerCase()
    );
    return found ? found.value : "all";
  })();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>(
    (params.sort as SortOption) || "newest"
  );
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Temporary filter sheet state
  const [draftSortBy, setDraftSortBy] = useState<SortOption>(sortBy);
  const [draftMinPrice, setDraftMinPrice] = useState<string>(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>(maxPrice);
  const [draftInStockOnly, setDraftInStockOnly] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Active filters count
  const activeFiltersCount =
    (sortBy !== "newest" ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // Data fetching state
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Fetch products
  const fetchProducts = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (targetPage === 1 && !append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const queryParams: Record<string, string | number | boolean | undefined> = {
          page: targetPage,
          limit: 50,
          sort: sortBy
        };

        if (selectedCategory !== "all") {
          queryParams.category = selectedCategory;
        }

        if (minPrice && !isNaN(Number(minPrice))) {
          queryParams.minPrice = Number(minPrice);
        }

        if (maxPrice && !isNaN(Number(maxPrice))) {
          queryParams.maxPrice = Number(maxPrice);
        }

        if (inStockOnly) {
          queryParams.inStock = true;
        }

        const res = await getProducts(queryParams);

        if (append) {
          setProducts((prev) => [...prev, ...(res?.data || [])]);
        } else {
          setProducts(res?.data && res.data.length > 0 ? res.data : []);
        }

        setPage(targetPage);
        setHasNext(res?.meta?.hasNext ?? false);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, sortBy, minPrice, maxPrice, inStockOnly]
  );

  // Trigger on filter / category changes
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleCategorySelect = (categoryValue: string) => {
    if (categoryValue === selectedCategory) return;
    Haptics.selectionAsync();
    setSelectedCategory(categoryValue);
    setPage(1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, false);
  };

  const handleEndReached = () => {
    if (!loading && !loadingMore && hasNext) {
      fetchProducts(page + 1, true);
    }
  };

  const openFilterModal = () => {
    AppHaptics.impactLight();
    setDraftSortBy(sortBy);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftInStockOnly(inStockOnly);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    AppHaptics.impactMedium();
    setSortBy(draftSortBy);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setInStockOnly(draftInStockOnly);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    AppHaptics.impactLight();
    setDraftSortBy("newest");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftInStockOnly(false);
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setShowFilterModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* 1. Header */}
      <AppHeader
        title="Shop"
        subtitle={
          selectedCategory === "all"
            ? "Every device, new and sealed"
            : `${selectedCategory} · new and sealed`
        }
        showActions={false}
        right={
          <View style={styles.headerActions}>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => {
                AppHaptics.selection();
                router.push("/search");
              }}
              style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.6 }]}
              accessibilityLabel="Search products"
            >
              <Ionicons name="search-outline" size={24} color={colors.text} />
            </Pressable>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={openFilterModal}
              style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.6 }]}
              accessibilityLabel="Sort and filter"
            >
              <View style={{ position: "relative" }}>
                <Ionicons name="options-outline" size={24} color={colors.text} />
                {activeFiltersCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        }
      />

      {/* 2. Category Chips Horizontal Scroll */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <Pressable
                key={cat.value}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => handleCategorySelect(cat.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected ? styles.chipTextSelected : styles.chipTextUnselected
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Product Grid */}
      {loading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.skeletonCard, { width: cardWidth }]}>
              <SkeletonLoader height={160} radius={16} />
              <SkeletonLoader height={18} width="85%" style={{ marginTop: 10 }} />
              <SkeletonLoader height={14} width="50%" style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      ) : products.length === 0 ? (
        error ? (
          <ErrorState error={error} onRetry={() => fetchProducts(1, false)} />
        ) : (
          /* 4. Empty State */
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different category or adjust your filters.
            </Text>
          </View>
        )
      ) : (
        <FlatList
          key={`shop-cols-${numColumns}`}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
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
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="grid"
              style={[styles.gridCard, { width: cardWidth, maxWidth: cardWidth }]}
            />
          )}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : !hasNext && products.length > 0 ? (
                <Text style={styles.endOfResultsText}>{"You've reached the end"}</Text>
              ) : null}
            </View>
          }
        />
      )}

      {/* 5. Filter Bottom Sheet */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, 20) + 16 }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Filter & Sort</Text>

            {/* Sort Options */}
            <Text style={styles.filterSectionLabel}>Sort By</Text>
            {(["newest", "price_asc", "price_desc", "rating"] as SortOption[]).map(
              (option) => {
                const isSelected = draftSortBy === option;
                return (
                  <Pressable
                    key={option}
                    style={styles.sortOptionRow}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDraftSortBy(option);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        isSelected && styles.sortOptionTextSelected
                      ]}
                    >
                      {SORT_LABELS[option]}
                    </Text>
                    <Ionicons
                      name={
                        isSelected
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={20}
                      color={isSelected ? colors.accent : colors.textTertiary}
                    />
                  </Pressable>
                );
              }
            )}

            <View style={styles.sheetDivider} />

            {/* Price Range */}
            <Text style={styles.filterSectionLabel}>Price Range (GHS)</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyPrefix}>₵</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={draftMinPrice}
                  onChangeText={setDraftMinPrice}
                />
              </View>

              <Text style={styles.priceDash}>—</Text>

              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencyPrefix}>₵</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={draftMaxPrice}
                  onChangeText={setDraftMaxPrice}
                />
              </View>
            </View>

            <View style={styles.sheetDivider} />

            {/* Availability */}
            <Text style={styles.filterSectionLabel}>Availability</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>In Stock Only</Text>
                <Text style={styles.toggleSub}>Hide out-of-stock items</Text>
              </View>
              <Switch
                value={draftInStockOnly}
                onValueChange={(v) => {
                  AppHaptics.selection();
                  setDraftInStockOnly(v);
                }}
                trackColor={{ false: colors.border, true: "rgba(23, 23, 23, 0.35)" }}
                thumbColor={draftInStockOnly ? colors.accent : "#FFFFFF"}
              />
            </View>

            <View style={styles.sheetDivider} />

            {/* Actions */}
            <Pressable
              style={({ pressed }) => [
                styles.applyBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }
              ]}
              onPress={applyFilters}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resetBtn,
                pressed && { opacity: 0.6 }
              ]}
              onPress={resetFilters}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  filterBtn: {
    padding: 6
  },
  chipsContainer: {
    paddingBottom: 8
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 980
  },
  chipSelected: {
    backgroundColor: colors.accent
  },
  chipUnselected: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600"
  },
  chipTextSelected: {
    color: "#FFFFFF"
  },
  chipTextUnselected: {
    color: colors.text
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
  gridCard: {
    flex: 1,
    width: "100%"
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: -40
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.text,
    marginTop: 16
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  endOfResultsText: {
    fontSize: 13,
    color: colors.textTertiary
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end"
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10
  },
  sortOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "400"
  },
  sortOptionTextSelected: {
    color: colors.accent,
    fontWeight: "600"
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 14
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  priceInputWrapper: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: colors.background
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    marginRight: 6
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text
  },
  priceDash: {
    fontSize: 16,
    color: colors.textSecondary
  },
  applyBtn: {
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: 980,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  resetBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  resetBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500"
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700"
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text
  },
  toggleSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  }
});
