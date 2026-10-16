/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on sort chips
 * - Haptics.impactAsync("light") on pull to refresh
 */
import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import AppHeader from "../../components/AppHeader";
import CountdownTimer from "../../components/CountdownTimer";
import FlashDealCard from "../../components/FlashDealCard";
import ErrorState from "../../components/ErrorState";
import { SkeletonProductCard } from "../../components/SkeletonLoader";
import { useFlashDeals } from "../../hooks/useFlashDeals";
import { colors, radius, spacing } from "../../constants/theme";

type SortKey = "best" | "price_asc" | "price_desc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "best", label: "Biggest discount" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" }
];

export default function FlashSalesScreen() {
  const router = useRouter();
  const { deals, endsAt, loading, error, refetch } = useFlashDeals();
  const [sort, setSort] = useState<SortKey>("best");
  const [refreshing, setRefreshing] = useState(false);

  const sorted = useMemo(() => {
    const list = [...deals];
    if (sort === "price_asc") list.sort((a, b) => a.priceGHS - b.priceGHS);
    if (sort === "price_desc") list.sort((a, b) => b.priceGHS - a.priceGHS);
    return list;
  }, [deals, sort]);

  const bestDiscount = deals.length > 0
    ? Math.max(...deals.map((d) => Math.round(((d.compareAtPriceGHS! - d.priceGHS) / d.compareAtPriceGHS!) * 100)))
    : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppHeader title="Flash Sales" subtitle="Real discounts. New window every midnight." />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
      >
        {/* Countdown band */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.band}>
          <View style={styles.bandTop}>
            <View style={styles.bandIconWrap}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.bandCopy}>
              <Text style={styles.bandTitle}>Today&apos;s drop</Text>
              <Text style={styles.bandSub}>
                {deals.length > 0
                  ? `${deals.length} live deals · up to ${bestDiscount}% off`
                  : "Curating the next drop"}
              </Text>
            </View>
          </View>
          <CountdownTimer endsAt={endsAt} label="Ends in" />
        </Animated.View>

        {/* Sort chips */}
        <View style={styles.chipRow}>
          {SORTS.map((option) => {
            const active = option.key === sort;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSort(option.key);
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && deals.length === 0 ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: "48%" }}>
                <SkeletonProductCard />
              </View>
            ))}
          </View>
        ) : error && deals.length === 0 ? (
          <ErrorState error={error} onRetry={refetch} retrying={refreshing} />
        ) : sorted.length === 0 ? (
          <ErrorState
            error={null}
            onRetry={refetch}
            empty
            emptyIcon="flash-outline"
            emptyTitle="No flash deals right now"
            emptySubtitle="New prices drop every midnight. Pull to refresh, or keep browsing the full store."
          />
        ) : (
          <View style={styles.grid}>
            {sorted.map((product) => (
              <FlashDealCard key={product.id} product={product} variant="tile" style={styles.gridItem} />
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.browseBtn, pressed && { opacity: 0.88 }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(tabs)/shop");
          }}
        >
          <Text style={styles.browseBtnText}>Browse the full store</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 48
  },
  band: {
    backgroundColor: colors.accentDark,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: 4
  },
  bandTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md
  },
  bandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center"
  },
  bandCopy: {
    flex: 1
  },
  bandTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4
  },
  bandSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing.lg,
    marginBottom: spacing.md
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  chipTextActive: {
    color: "#FFFFFF"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md - 4,
    justifyContent: "space-between"
  },
  gridItem: {
    width: "48.5%"
  },
  browseBtn: {
    marginTop: spacing.xl,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  browseBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  }
});
