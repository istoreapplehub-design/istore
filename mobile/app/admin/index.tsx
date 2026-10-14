import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, theme } from "../../constants/theme";
import { useUserStore } from "../../store/useUserStore";
import {
  AdminStats,
  RevenueStats,
  AdminPendingCount,
  getRevenueStats,
  getAdminProductStats,
  getAdminPendingCount,
  getOrdersExportUrl
} from "../../services/adminApi";
import { StatCard } from "../../components/admin/StatCard";
import { SalesChart } from "../../components/admin/SalesChart";
import { SkeletonLoader } from "../../components/SkeletonLoader";

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [productStats, setProductStats] = useState<AdminStats | null>(null);
  const [pendingCount, setPendingCount] = useState<AdminPendingCount | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rev, prod, pend] = await Promise.all([
        getRevenueStats("30d").catch(() => null),
        getAdminProductStats().catch(() => null),
        getAdminPendingCount().catch(() => null)
      ]);

      if (rev) setRevenueStats(rev);
      if (prod) setProductStats(prod);
      if (pend) setPendingCount(pend);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleExportOrders = async () => {
    Haptics.selectionAsync();
    try {
      const url = getOrdersExportUrl();
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open export URL on this device.");
      }
    } catch {
      Alert.alert("Error", "Failed to export orders.");
    }
  };

  const handleBackToAccount = () => {
    Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/account");
    }
  };

  const totalRevenueFormatted = revenueStats
    ? `₵${(revenueStats.revenueGHS || 0).toLocaleString("en-GH")}`
    : "₵0";

  const totalOrders = revenueStats?.orderCount ?? 0;
  const totalProducts = productStats?.totalProducts ?? 0;
  const pendingOrders = pendingCount?.pending ?? 0;

  const lowStockCount = productStats?.lowStock?.length ?? 0;
  const outOfStockCount = productStats?.outOfStock?.length ?? 0;
  const hasInventoryAlerts = lowStockCount > 0 || outOfStockCount > 0;

  const topProducts = revenueStats?.topProducts || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* 1. HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.subtitle}>
              Signed in as {user?.email || "Admin User"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit admin to account"
            onPress={handleBackToAccount}
            style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {loading && !refreshing ? (
          /* 7. LOADING STATE */
          <View style={styles.loadingContainer}>
            {/* Skeleton Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.skeletonStatCard}>
                <SkeletonLoader width={36} height={36} radius={18} />
                <View style={{ marginTop: 12 }}>
                  <SkeletonLoader width={80} height={13} radius={4} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <SkeletonLoader width={100} height={24} radius={6} />
                </View>
              </View>
              <View style={styles.skeletonStatCard}>
                <SkeletonLoader width={36} height={36} radius={18} />
                <View style={{ marginTop: 12 }}>
                  <SkeletonLoader width={80} height={13} radius={4} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <SkeletonLoader width={60} height={24} radius={6} />
                </View>
              </View>
              <View style={styles.skeletonStatCard}>
                <SkeletonLoader width={36} height={36} radius={18} />
                <View style={{ marginTop: 12 }}>
                  <SkeletonLoader width={80} height={13} radius={4} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <SkeletonLoader width={60} height={24} radius={6} />
                </View>
              </View>
              <View style={styles.skeletonStatCard}>
                <SkeletonLoader width={36} height={36} radius={18} />
                <View style={{ marginTop: 12 }}>
                  <SkeletonLoader width={80} height={13} radius={4} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <SkeletonLoader width={60} height={24} radius={6} />
                </View>
              </View>
            </View>

            {/* Skeleton Chart */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <SkeletonLoader width="100%" height={200} radius={18} />
            </View>

            {/* Skeleton Rows */}
            <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 12 }}>
              <SkeletonLoader width="100%" height={48} radius={12} />
              <SkeletonLoader width="100%" height={48} radius={12} />
              <SkeletonLoader width="100%" height={48} radius={12} />
            </View>
          </View>
        ) : (
          <>
            {/* 2. QUICK STATS ROW */}
            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <StatCard
                  label="Revenue (30d)"
                  value={totalRevenueFormatted}
                  icon="trending-up"
                  color={colors.accent}
                  onPress={() => {}}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Orders (30d)"
                  value={String(totalOrders)}
                  icon="cart-outline"
                  color={colors.accent}
                  onPress={() => router.push("/admin/orders")}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Products"
                  value={String(totalProducts)}
                  icon="cube-outline"
                  color={colors.accent}
                  onPress={() => router.push("/admin/products")}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Pending Orders"
                  value={String(pendingOrders)}
                  icon="time-outline"
                  color="#6E6E73"
                  onPress={() => router.push("/admin/orders")}
                />
              </View>
            </View>

            {/* 3. SALES CHART */}
            <Text style={styles.sectionTitle}>Revenue — Last 30 Days</Text>
            <View style={styles.chartWrapper}>
              <SalesChart data={revenueStats?.byDay || []} height={200} />
            </View>

            {/* 4. LOW STOCK ALERTS */}
            {hasInventoryAlerts && (
              <>
                <Text style={styles.sectionTitle}>Inventory Alerts</Text>
                <View style={styles.cardContainer}>
                  {outOfStockCount > 0 && (
                    <Pressable
                      style={({ pressed }) => [styles.alertRow, pressed && { opacity: 0.7 }]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.push("/admin/products");
                      }}
                    >
                      <Ionicons name="alert-circle" size={18} color={colors.danger} />
                      <Text style={styles.alertDangerText}>
                        {outOfStockCount} {outOfStockCount === 1 ? "product" : "products"} out of stock
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.danger} />
                    </Pressable>
                  )}
                  {outOfStockCount > 0 && lowStockCount > 0 && <View style={styles.hairline} />}
                  {lowStockCount > 0 && (
                    <Pressable
                      style={({ pressed }) => [styles.alertRow, pressed && { opacity: 0.7 }]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.push("/admin/products");
                      }}
                    >
                      <Ionicons name="warning" size={18} color="#6E6E73" />
                      <Text style={styles.alertWarningText}>
                        {lowStockCount} {lowStockCount === 1 ? "product" : "products"} low on stock
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#6E6E73" />
                    </Pressable>
                  )}
                </View>
              </>
            )}

            {/* 5. TOP PRODUCTS */}
            {topProducts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Top Selling — 30 Days</Text>
                <View style={styles.cardContainer}>
                  {topProducts.slice(0, 5).map((prod, index) => (
                    <React.Fragment key={prod.productId || index}>
                      {index > 0 && <View style={styles.hairline} />}
                      <View style={styles.topProductRow}>
                        <Text style={styles.rankText}>{index + 1}</Text>
                        <Text style={styles.productName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                        <Text style={styles.soldText}>
                          {prod.unitsSold} sold · ₵{(prod.revenueGHS || 0).toLocaleString("en-GH")}
                        </Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </>
            )}

            {/* 6. QUICK ACTIONS */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/admin/products/new");
                  }}
                >
                  <Ionicons name="add" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Add Product</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/admin/orders");
                  }}
                >
                  <Ionicons name="receipt-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>View Orders</Text>
                </Pressable>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                  onPress={handleExportOrders}
                >
                  <Ionicons name="download-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Export Orders</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/admin/products");
                  }}
                >
                  <Ionicons name="cube-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Manage Products</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    paddingBottom: 40
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12
  },
  loadingContainer: {
    marginTop: 8
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16
  },
  statCol: {
    width: "48%",
    flexGrow: 1
  },
  skeletonStatCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12
  },
  chartWrapper: {
    paddingHorizontal: 16
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6
  },
  alertDangerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
    marginLeft: 8
  },
  alertWarningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#6E6E73",
    marginLeft: 8
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8
  },
  topProductRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8
  },
  rankText: {
    width: 24,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    paddingRight: 8
  },
  soldText: {
    fontSize: 13,
    color: colors.textSecondary
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    gap: 12
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  actionButtonPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(23, 23, 23, 0.05)"
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  }
});
