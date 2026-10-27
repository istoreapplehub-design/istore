import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { colors, radius, theme } from "../../constants/theme";
import { useUserStore } from "../../store/useUserStore";
import {
  AdminStats,
  RevenueStats,
  AdminPendingCount,
  getRevenueStats,
  getAdminProductStats,
  getAdminPendingCount,
  getOrdersExportUrl,
  getAdminInstallments
} from "../../services/adminApi";
import {
  getFlashDealProducts,
  getGeniusBookings,
  getTradeInSubmissions,
  getTodayEvents
} from "../../services/adminServicesApi";
import { StatCard } from "../../components/admin/StatCard";
import { SalesChart } from "../../components/admin/SalesChart";
import { SkeletonLoader } from "../../components/SkeletonLoader";

function OpsTile({
  icon,
  label,
  hint,
  count,
  countLabel,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  count?: number | null;
  countLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${hint}`}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.opsTile, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.opsTileTop}>
        <Ionicons name={icon} size={20} color={colors.text} />
        {count !== undefined && count !== null ? (
          <View style={styles.opsCountPill}>
            <Text style={styles.opsCountText}>{count}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} style={{ marginLeft: "auto" }} />
      </View>
      <Text style={styles.opsLabel}>{label}</Text>
      <Text style={styles.opsHint} numberOfLines={1}>{hint}</Text>
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const signOut = useUserStore((s) => s.signOut);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [productStats, setProductStats] = useState<AdminStats | null>(null);
  const [pendingCount, setPendingCount] = useState<AdminPendingCount | null>(null);
  const [flashDealCount, setFlashDealCount] = useState<number | null>(null);
  const [openBookings, setOpenBookings] = useState<number | null>(null);
  const [pendingTradeIns, setPendingTradeIns] = useState<number | null>(null);
  const [pendingInstallments, setPendingInstallments] = useState<number | null>(null);
  const [todayEventsCount, setTodayEventsCount] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rev, prod, pend, deals, bookings, tradeIns, events, installments] = await Promise.all([
        getRevenueStats("30d").catch(() => null),
        getAdminProductStats().catch(() => null),
        getAdminPendingCount().catch(() => null),
        getFlashDealProducts().catch(() => null),
        getGeniusBookings().catch(() => null),
        getTradeInSubmissions().catch(() => null),
        getTodayEvents().catch(() => null),
        getAdminInstallments({ status: "pending_review", limit: 1 }).catch(() => null)
      ]);

      if (rev) setRevenueStats(rev);
      if (prod) setProductStats(prod);
      if (pend) setPendingCount(pend);
      if (deals) setFlashDealCount(deals.length);
      if (bookings) setOpenBookings(bookings.filter((b) => b.status === "confirmed" || b.status === "in_repair").length);
      if (tradeIns) setPendingTradeIns(tradeIns.filter((t) => t.status === "pending_inspection").length);
      if (events) setTodayEventsCount(events.length);
      if (installments) setPendingInstallments(installments.meta?.total ?? 0);
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

  const handleSignOut = () => {
    Haptics.selectionAsync();
    Alert.alert("Admin Sign Out", "Are you sure you want to sign out of the Admin Console?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          router.replace("/(auth)/login");
        }
      }
    ]);
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
        }
      >
        {/* 1. HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <Image
                source={require("../../assets/images/lestrades-logo.png")}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="LesTrades — Quality for Less"
              />
              <View style={styles.adminPill}>
                <Ionicons name="shield-checkmark" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.adminPillText}>ADMIN CONSOLE</Text>
              </View>
            </View>
            <Text style={styles.title}>Overview</Text>
            <Text style={styles.subtitle}>
              Signed in as {user?.email || "Admin User"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out of admin console"
            onPress={handleSignOut}
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={styles.signOutBtnText}>Sign Out</Text>
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
                  color={colors.brandAccent}
                  onPress={() => {}}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Orders (30d)"
                  value={String(totalOrders)}
                  icon="cart-outline"
                  color={colors.text}
                  onPress={() => router.push("/admin/orders")}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Products"
                  value={String(totalProducts)}
                  icon="cube-outline"
                  color="#34C759"
                  onPress={() => router.push("/admin/products")}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Pending Orders"
                  value={String(pendingOrders)}
                  icon="time-outline"
                  color="#FF9500"
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

            {/* 6. OPERATIONS */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Operations</Text>
              <Pressable onPress={handleExportOrders} hitSlop={8}>
                <Text style={styles.exportLink}>Export orders</Text>
              </Pressable>
            </View>
            <View style={styles.opsGrid}>
              <OpsTile
                icon="receipt-outline"
                label="Orders"
                hint="Track, update status, assign hardware IDs"
                count={pendingCount?.pending ?? null}
                countLabel="pending"
                onPress={() => router.push("/admin/orders")}
              />
              <OpsTile
                icon="cube-outline"
                label="Products"
                hint="Catalogue, stock, variants"
                count={productStats?.totalProducts ?? null}
                countLabel="live"
                onPress={() => router.push("/admin/products")}
              />
              <OpsTile
                icon="flash-outline"
                label="Flash Deals"
                hint="Compare-at price discounts"
                count={flashDealCount}
                countLabel="active"
                onPress={() => router.push("/admin/flash-deals")}
              />
              <OpsTile
                icon="calendar-outline"
                label="Today at LesTrades"
                hint="Workshops & RSVPs"
                count={todayEventsCount}
                countLabel="sessions"
                onPress={() => router.push("/admin/events")}
              />
              <OpsTile
                icon="hammer-outline"
                label="Genius Bar"
                hint="Repair bookings"
                count={openBookings}
                countLabel="open"
                onPress={() => router.push("/admin/genius-bar")}
              />
              <OpsTile
                icon="swap-horizontal-outline"
                label="Trade-In"
                hint="Inspection & credit payouts"
                count={pendingTradeIns}
                countLabel="pending"
                onPress={() => router.push("/admin/trade-in")}
              />
              <OpsTile
                icon="stats-chart-outline"
                label="Installments & Credit"
                hint="Review applications, set schedules"
                count={pendingInstallments}
                countLabel="to review"
                onPress={() => router.push("/admin/installments")}
              />
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },
  brandLogo: {
    width: 44,
    height: 33,
    resizeMode: "contain"
  },
  adminPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  adminPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  storeName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 12
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
    marginTop: 24,
    marginBottom: 12
  },
  exportLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brandAccent,
    textDecorationLine: "underline"
  },
  opsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16
  },
  opsTile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  opsTileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  opsCountPill: {
    minWidth: 24,
    alignItems: "center",
    backgroundColor: colors.brandAccent,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  opsCountText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  opsLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12
  },
  opsHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  }
});
