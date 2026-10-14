import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../../constants/theme";
import { Order } from "../../../types";
import {
  AdminOrderSummary,
  getAdminOrders,
  getOrdersExportUrl
} from "../../../services/adminApi";
import { OrderStatusBadge } from "../../../components/admin/OrderStatusBadge";
import { SkeletonLoader } from "../../../components/SkeletonLoader";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" }
];

export default function AdminOrdersListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ status?: string }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<AdminOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(
    routeParams.status || "all"
  );

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (txt: string) => {
    setSearch(txt);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(txt);
    }, 300);
  };

  const fetchOrders = useCallback(
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

        if (activeFilter !== "all") {
          params.status = activeFilter;
        }

        const res = await getAdminOrders(params);

        if (targetPage === 1) {
          setOrders(res.data);
          if (res.summary) {
            setSummary(res.summary);
          }
        } else {
          setOrders((prev) => [...prev, ...res.data]);
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

  useFocusEffect(
    useCallback(() => {
      fetchOrders(1, true);
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, true);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchOrders(page + 1);
  };

  const handleExport = async () => {
    Haptics.selectionAsync();
    try {
      const url = getOrdersExportUrl({
        status: activeFilter !== "all" ? activeFilter : undefined,
        search: debouncedSearch || undefined
      });
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Export Error", "Cannot open export URL on this device.");
      }
    } catch {
      Alert.alert("Export Error", "Failed to export orders.");
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const shortId = `#${item.id.slice(0, 8).toUpperCase()}`;
    const customerName = item.shippingAddress?.fullName || "Guest Customer";
    const customerPhone = item.shippingAddress?.phone || "";
    const items = item.items || [];
    const extraItemsCount = items.length > 3 ? items.length - 3 : 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.orderCard, pressed && styles.cardPressed]}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/admin/orders/${item.id}`);
        }}
      >
        {/* Row 1: Short ID & Status */}
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>{shortId}</Text>
          <OrderStatusBadge status={item.status} size="sm" />
        </View>

        {/* Row 2: Customer Info */}
        <View style={styles.customerRow}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customerName}
          </Text>
          {customerPhone ? (
            <Text style={styles.customerPhone}>{customerPhone}</Text>
          ) : null}
        </View>

        {/* Row 3: Item thumbnails & Total */}
        <View style={styles.itemsTotalRow}>
          <View style={styles.thumbnailsRow}>
            {items.slice(0, 3).map((it, idx) => (
              <View
                key={`${it.id || idx}`}
                style={[
                  styles.thumbnailWrap,
                  idx > 0 && { marginLeft: -8, zIndex: 10 - idx }
                ]}
              >
                {it.image ? (
                  <Image source={{ uri: it.image }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
                    <Ionicons name="cube-outline" size={18} color={colors.textTertiary} />
                  </View>
                )}
              </View>
            ))}
            {extraItemsCount > 0 && (
              <View style={[styles.thumbnailWrap, styles.extraThumbWrap]}>
                <Text style={styles.extraThumbText}>+{extraItemsCount}</Text>
              </View>
            )}
          </View>

          <Text style={styles.totalPrice}>
            ₵{(item.totalGHS || 0).toLocaleString("en-GH")}
          </Text>
        </View>

        {/* Row 4: Date & Payment method */}
        <View style={styles.dateChannelRow}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          {item.paymentChannel ? (
            <Text style={styles.channelText}>· {item.paymentChannel.replace("_", " ")}</Text>
          ) : null}
        </View>

        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </Pressable>
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
          <Text style={styles.title}>Orders</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.7 }]}
          onPress={handleExport}
        >
          <Ionicons name="download-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      {/* 2. SUMMARY ROW */}
      {summary && (
        <View style={styles.summaryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryScroll}
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL REVENUE</Text>
              <Text style={styles.summaryValue}>
                ₵{(summary.totalRevenueGHS || 0).toLocaleString("en-GH")}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>ORDERS</Text>
              <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>PENDING</Text>
              <Text style={[styles.summaryValue, { color: "#6E6E73" }]}>
                {summary.byStatus?.pending || 0}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>PAID</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>
                {summary.byStatus?.paid || 0}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>SHIPPED</Text>
              <Text style={[styles.summaryValue, { color: "#3D3D42" }]}>
                {summary.byStatus?.shipped || 0}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>DELIVERED</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {summary.byStatus?.delivered || 0}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* 3. SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID, name, or phone..."
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

      {/* 4. STATUS FILTER CHIPS */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((f) => {
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

      {/* 5. ORDER LIST */}
      {loading && !refreshing ? (
        <View style={styles.skeletonList}>
          <SkeletonLoader width="100%" height={120} radius={16} />
          <SkeletonLoader width="100%" height={120} radius={16} />
          <SkeletonLoader width="100%" height={120} radius={16} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
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
              <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>
                Orders will appear here as customers check out and complete payments.
              </Text>
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
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text
  },
  exportBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  summaryContainer: {
    paddingBottom: 10
  },
  summaryScroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
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
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative"
  },
  cardPressed: {
    backgroundColor: colors.surface
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  orderId: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  customerRow: {
    marginTop: 12
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  },
  customerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  itemsTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12
  },
  thumbnailsRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  thumbnailWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: colors.imageBg,
    overflow: "hidden"
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  thumbnailEmpty: {
    alignItems: "center",
    justifyContent: "center"
  },
  extraThumbWrap: {
    marginLeft: -8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  extraThumbText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3
  },
  dateChannelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },
  dateText: {
    fontSize: 12,
    color: colors.textTertiary
  },
  channelText: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: "capitalize",
    marginLeft: 4
  },
  chevronWrap: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: [{ translateY: -9 }]
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
  }
});
