import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, formatGHS, radius, spacing, typography } from "../constants/theme";
import { Product } from "../types";
import { getProducts } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import { AppHaptics } from "../lib/haptics";
import ErrorState from "../components/ErrorState";

const CATEGORIES = ["All", "iPhone", "Mac", "iPad", "Watch", "AirPods", "Accessories"];

export default function FlashDealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Countdown timer to midnight
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDeals = async () => {
    try {
      setError(null);
      const res = await getProducts({ limit: 100 });
      // Filter products that have compareAtPriceGHS higher than priceGHS OR tagged with 'deal'
      const dealItems = (res.data || []).filter(
        (p) => (p.compareAtPriceGHS && p.compareAtPriceGHS > p.priceGHS) || p.tags?.includes("deal")
      );
      setProducts(dealItems);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [products, selectedCategory]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const totalSavings = useMemo(() => {
    return products.reduce((acc, p) => {
      const diff = (p.compareAtPriceGHS || p.priceGHS) - p.priceGHS;
      return acc + (diff > 0 ? diff : 0);
    }, 0);
  }, [products]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Flash Deals</Text>
          <Text style={styles.headerSub}>Limited-Time Apple Savings</Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => router.push("/(tabs)/cart" as any)}
          style={styles.backBtn}
        >
          <Ionicons name="bag-outline" size={21} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={filteredDeals}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 40 }
        ]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDeals();
            }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.topSection}>
            {/* Banner with live timer */}
            <View style={styles.countdownBanner}>
              <View style={styles.bannerRow}>
                <View style={styles.fireBadge}>
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={styles.fireBadgeText}>DAILY DROP</Text>
                </View>
                <Text style={styles.bannerHeadline}>Ends Tonight at Midnight</Text>
              </View>

              <View style={styles.timerRow}>
                <View style={styles.timerBlock}>
                  <Text style={styles.timerDigit}>{pad(timeLeft.hours)}</Text>
                  <Text style={styles.timerUnit}>HRS</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerBlock}>
                  <Text style={styles.timerDigit}>{pad(timeLeft.minutes)}</Text>
                  <Text style={styles.timerUnit}>MIN</Text>
                </View>
                <Text style={styles.timerColon}>:</Text>
                <View style={styles.timerBlock}>
                  <Text style={styles.timerDigit}>{pad(timeLeft.seconds)}</Text>
                  <Text style={styles.timerUnit}>SEC</Text>
                </View>
              </View>

              <View style={styles.bannerFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#0066CC" />
                <Text style={styles.bannerFooterText}>
                  Genuine Apple warranty · Free delivery across Greater Accra
                </Text>
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected
                    ]}
                    onPress={() => {
                      AppHaptics.selection();
                      setSelectedCategory(cat);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Results Count & Savings Bar */}
            <View style={styles.resultsBar}>
              <Text style={styles.resultsCount}>
                {filteredDeals.length} active deal{filteredDeals.length === 1 ? "" : "s"}
              </Text>
              {totalSavings > 0 && (
                <Text style={styles.savingsHighlight}>
                  Up to {formatGHS(totalSavings)} in savings
                </Text>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Fetching today's flash deals...</Text>
            </View>
          ) : error ? (
            <ErrorState error={error} onRetry={loadDeals} />
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="pricetags-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No deals in this category</Text>
              <Text style={styles.emptySubtitle}>
                New promotional items drop at midnight. Check back soon or browse all deals.
              </Text>
              <Pressable
                style={styles.resetBtn}
                onPress={() => setSelectedCategory("All")}
              >
                <Text style={styles.resetBtnText}>View All Deals</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            variant="grid"
            style={styles.cardItem}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleBox: {
    alignItems: "center"
  },
  headerTitle: {
    ...typography.headline,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
    marginTop: 1
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16
  },
  cardItem: {
    width: "48%"
  },
  topSection: {
    marginBottom: 16
  },
  countdownBanner: {
    backgroundColor: "#1D1D1F",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  fireBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0066CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  fireBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  bannerHeadline: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14
  },
  timerBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 54
  },
  timerDigit: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  timerUnit: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2
  },
  timerColon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10
  },
  bannerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    width: "100%",
    justifyContent: "center"
  },
  bannerFooterText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "500"
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  categoryChipSelected: {
    backgroundColor: "#1D1D1F",
    borderColor: "#1D1D1F"
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  categoryChipTextSelected: {
    color: "#FFFFFF"
  },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 2
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  savingsHighlight: {
    fontSize: 12,
    color: "#0066CC",
    fontWeight: "700"
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: 14,
    color: colors.text
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6
  },
  resetBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.pill
  },
  resetBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600"
  }
});
