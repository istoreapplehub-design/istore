import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { colors } from "../../../constants/theme";
import { Product } from "../../../types";
import {
  deactivateAdminProduct,
  getAdminProducts,
  restoreAdminProduct
} from "../../../services/adminApi";
import { SkeletonLoader } from "../../../components/SkeletonLoader";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "featured", label: "Featured" },
  { id: "lowStock", label: "Low Stock" },
  { id: "outOfStock", label: "Out" }
];

export default function AdminProductsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  const handleSearchChange = (txt: string) => {
    setSearch(txt);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(txt);
    }, 300);
  };

  const fetchProducts = useCallback(
    async (targetPage = 1, isRefresh = false) => {
      try {
        if (targetPage === 1 && !isRefresh) setLoading(true);

        const params: Record<string, string | number | boolean | undefined> = {
          page: targetPage,
          limit: 15
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        if (activeFilter === "active") params.isActive = true;
        if (activeFilter === "inactive") params.isActive = false;
        if (activeFilter === "featured") params.featured = true;
        if (activeFilter === "lowStock") params.stockLt = 5;
        if (activeFilter === "outOfStock") params.stock = 0;

        const res = await getAdminProducts(params);

        if (targetPage === 1) {
          setProducts(res.data);
        } else {
          setProducts((prev) => [...prev, ...res.data]);
        }

        setPage(res.meta.page);
        setHasMore(res.meta.hasNext);
      } catch {
        // Silently handled
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, activeFilter]
  );

  // Refetch when screen gains focus or when filter/search changes
  useFocusEffect(
    useCallback(() => {
      fetchProducts(1, true);
    }, [fetchProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchProducts(page + 1);
  };

  const handleDeactivate = (id: string, name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Deactivate Product", `Hide "${name}" from customer storefront?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          try {
            await deactivateAdminProduct(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setProducts((prev) =>
              prev.map((p) => (p.id === id ? { ...p, isActive: false } : p))
            );
          } catch {
            Alert.alert("Error", "Failed to deactivate product.");
          }
        }
      }
    ]);
  };

  const handleRestore = async (id: string) => {
    try {
      Haptics.selectionAsync();
      await restoreAdminProduct(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: true } : p))
      );
    } catch {
      Alert.alert("Error", "Failed to restore product.");
    }
  };

  const renderRightActions = (item: Product) => {
    if (item.isActive) {
      return (
        <Pressable
          style={styles.deleteAction}
          onPress={() => handleDeactivate(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      );
    } else {
      return (
        <Pressable
          style={styles.restoreAction}
          onPress={() => handleRestore(item.id)}
        >
          <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Restore</Text>
        </Pressable>
      );
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const heroImage = item.images?.[0] || item.colors?.[0]?.images?.[0];
    const isOutOfStock = item.stock === 0;
    const isLowStock = item.stock > 0 && item.stock < 5;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <Pressable
          style={({ pressed }) => [styles.productRow, pressed && styles.rowPressed]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(`/(admin)/products/${item.id}`);
          }}
        >
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Ionicons name="cube-outline" size={24} color={colors.textTertiary} />
            </View>
          )}

          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>

            <View style={styles.tagsRow}>
              <View style={styles.miniPill}>
                <Text style={styles.miniPillText}>{item.category}</Text>
              </View>
              <View style={[styles.miniPill, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniPillText, { color: colors.textSecondary }]}>
                  {item.condition}
                </Text>
              </View>
              {!item.isActive && (
                <View style={[styles.miniPill, { backgroundColor: "rgba(206,17,38,0.1)" }]}>
                  <Text style={[styles.miniPillText, { color: colors.danger }]}>
                    Inactive
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.priceStockRow}>
              <Text style={styles.priceText}>
                ₵{(item.priceGHS || 0).toLocaleString("en-GH")}
              </Text>
              <Text style={styles.dotSeparator}>·</Text>
              <Text
                style={[
                  styles.stockText,
                  isOutOfStock && styles.stockOutOfStock,
                  isLowStock && styles.stockLow
                ]}
              >
                Stock: {item.stock}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. STICKY HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Pressable
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Products</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.newBtn, pressed && { opacity: 0.8 }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(admin)/products/new");
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      {/* 2. SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by title or model..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
          {search ? (
            <Pressable onPress={() => handleSearchChange("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 3. FILTER CHIPS */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(f.id);
                }}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillSelected : styles.filterPillUnselected
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. PRODUCT LIST */}
      {loading && !refreshing ? (
        <View style={styles.skeletonList}>
          <SkeletonLoader width="100%" height={80} radius={14} />
          <SkeletonLoader width="100%" height={80} radius={14} />
          <SkeletonLoader width="100%" height={80} radius={14} />
          <SkeletonLoader width="100%" height={80} radius={14} />
          <SkeletonLoader width="100%" height={80} radius={14} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 40 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            /* 6. EMPTY STATE */
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>
                {debouncedSearch
                  ? "Try searching for a different keyword or filter."
                  : "Start populating your storefront with Apple products."}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push("/(admin)/products/new")}
              >
                <Text style={styles.emptyBtnText}>Create your first product</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20
  },
  newBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0
  },
  filtersContainer: {
    paddingBottom: 10
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16
  },
  filterPillSelected: {
    backgroundColor: colors.accent
  },
  filterPillUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  filterPillTextSelected: {
    color: "#FFFFFF"
  },
  skeletonList: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12
  },
  rowPressed: {
    backgroundColor: colors.surface
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.imageBg,
    resizeMode: "cover"
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center"
  },
  productDetails: {
    flex: 1
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  miniPill: {
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent
  },
  priceStockRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: colors.textSecondary
  },
  stockText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary
  },
  stockLow: {
    color: "#FF9500",
    fontWeight: "700"
  },
  stockOutOfStock: {
    color: colors.danger,
    fontWeight: "700"
  },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    width: 76,
    borderRadius: 14,
    marginBottom: 8,
    marginLeft: 6
  },
  restoreAction: {
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    width: 76,
    borderRadius: 14,
    marginBottom: 8,
    marginLeft: 6
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20
  },
  emptyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  }
});
