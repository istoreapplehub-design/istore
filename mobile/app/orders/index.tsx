/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on order card tap
 * - Haptics.impactAsync("light") on start shopping button
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, typography } from "../../constants/theme";
import { Order } from "../../types";
import { getMyOrders, ApiError } from "../../services/api";
import { useUserStore } from "../../store/useUserStore";
import SkeletonLoader from "../../components/SkeletonLoader";
import ErrorState from "../../components/ErrorState";
import { ProductVisual, getStoredImage } from "../../components/ProductVisual";

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "Recently";
  }
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const config = (() => {
    switch (status) {
      case "paid":
        return {
          bg: "#171717",
          text: "#FFFFFF",
          label: "Paid"
        };
      case "shipped":
        return {
          bg: "#E8E8E6",
          text: "#171717",
          label: "Shipped"
        };
      case "delivered":
        return {
          bg: "#F2F2F7",
          text: "#171717",
          label: "Delivered"
        };
      case "cancelled":
        return {
          bg: "#F2F2F7",
          text: "#AEAEB2",
          label: "Cancelled"
        };
      case "pending":
      default:
        return {
          bg: "#F2F2F7",
          text: "#6E6E73",
          label: "Pending"
        };
    }
  })();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusBadgeText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

export default function OrdersIndexScreen() {
  const router = useRouter();
  const { userId } = useUserStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setError(new ApiError("Sign in to see your order history.", "auth"));
      setLoading(false);
      return;
    }
    try {
      const res = await getMyOrders(userId, { page: 1, limit: 30 });
      setOrders(res.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleOpenOrder = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/orders/${id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonRow}>
                <SkeletonLoader width={100} height={16} />
                <SkeletonLoader width={70} height={22} radius={980} />
              </View>
              <SkeletonLoader
                width="100%"
                height={50}
                radius={8}
                style={{ marginTop: 14 }}
              />
              <View style={[styles.skeletonRow, { marginTop: 14 }]}>
                <SkeletonLoader width={80} height={14} />
                <SkeletonLoader width={80} height={18} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {orders.length === 0 ? (
        error ? (
          <ErrorState
            error={error}
            primaryActionLabel={
              error instanceof ApiError && error.kind === "auth" ? "Sign In" : "Try Again"
            }
            onRetry={() => {
              if (error instanceof ApiError && error.kind === "auth") {
                router.push("/(auth)/login?returnTo=orders");
              } else {
                setLoading(true);
                fetchOrders();
              }
            }}
          />
        ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here.
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
        )
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              title="Pull to refresh"
            />
          }
          renderItem={({ item }) => {
            const firstThreeItems = item.items?.slice(0, 3) || [];
            const remainingCount = (item.items?.length || 0) - 3;
            const orderNum = `#${item.id.slice(0, 8).toUpperCase()}`;

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.orderCard,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }
                ]}
                onPress={() => handleOpenOrder(item.id)}
              >
                {/* Row 1: Order # & Status */}
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNumberText}>{orderNum}</Text>
                  <StatusBadge status={item.status} />
                </View>

                {/* Row 2: Thumbnails */}
                <View style={styles.thumbnailsRow}>
                  {firstThreeItems.map((orderItem, idx) => {
                    const thumb = getStoredImage(orderItem.image);
                    return thumb ? (
                      <Image
                        key={idx}
                        source={{ uri: thumb }}
                        style={styles.thumbnail}
                        resizeMode="contain"
                      />
                    ) : (
                      <View key={idx} style={styles.thumbnailFallback}>
                        <ProductVisual glyphSize={18} />
                      </View>
                    );
                  })}
                  {remainingCount > 0 && (
                    <View style={styles.moreThumbnail}>
                      <Text style={styles.moreThumbnailText}>
                        +{remainingCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Row 3: Date & Total */}
                <View style={styles.detailsRow}>
                  <Text style={styles.dateText}>
                    {formatDate(item.createdAt)}
                  </Text>
                  <Text style={styles.totalText}>
                    {formatGHS(item.totalGHS)}
                  </Text>
                </View>

                {/* Row 4: View Details */}
                <View style={styles.footerRow}>
                  <Text style={styles.viewDetailsText}>View Details →</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  listContent: {
    paddingVertical: 16
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  orderNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 980
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600"
  },
  thumbnailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.imageBg
  },
  thumbnailFallback: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden"
  },
  moreThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  moreThumbnailText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary
  },
  totalText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  footerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  viewDetailsText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600"
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
  },
  skeletonList: {
    padding: 16
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }
});
