/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on search chip tap
 * - Haptics.impactAsync("light") on search clear
 * - Haptics.impactAsync("medium") on recent search delete
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../constants/theme";
import { Product } from "../types";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import ErrorState from "../components/ErrorState";
import { SectionHeader } from "../components/SectionHeader";

const RECENT_SEARCHES_KEY = "ghanaapps_recent_searches";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from AsyncStorage
  useEffect(() => {
    async function loadRecent() {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch {
        // Silently continue
      }
    }
    loadRecent();
  }, []);

  // Trending terms come from the live catalog so a tap always finds something.
  useEffect(() => {
    let mounted = true;
    getProducts({ sort: "popular", limit: 8 })
      .then((res) => {
        if (mounted) setTrending(res.data.map((p) => p.name));
      })
      .catch(() => {
        if (mounted) setTrending([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const saveRecentSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) return;

    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Silently continue
    }
  };

  const removeRecentSearch = (term: string) => {
    Alert.alert("Remove Search", `Remove "${term}" from recent searches?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const updated = recentSearches.filter((s) => s !== term);
          setRecentSearches(updated);
          await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        }
      }
    ]);
  };

  // Debounced live search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await getProducts({ search: query.trim(), limit: 20 });
        setResults(res.data);
        setError(null);
      } catch (err) {
        setResults([]);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, retryTick]);

  const handleSelectChip = (text: string) => {
    Haptics.selectionAsync();
    setQuery(text);
    saveRecentSearch(text);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery("");
    setResults([]);
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 1. Header & Sticky Search Bar */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Search</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close search"
            hitSlop={10}
            onPress={handleCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search iPhones, Macs, AirPods..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={handleClear}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 2. Content */}
      {query.trim().length === 0 ? (
        /* Empty Query State: Recent & Trending */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {recentSearches.length > 0 && (
            <View style={styles.sectionContainer}>
              <SectionHeader title="Recent" />
              <View style={styles.chipsWrap}>
                {recentSearches.slice(0, 6).map((item) => (
                  <Pressable
                    key={item}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => handleSelectChip(item)}
                    onLongPress={() => removeRecentSearch(item)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.chipText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {trending.length > 0 && (
            <View style={styles.sectionContainer}>
              <SectionHeader title="Popular in the store" />
              <View style={styles.chipsWrap}>
                {trending.map((item) => (
                  <Pressable
                    key={item}
                    style={({ pressed }) => [
                      styles.chip,
                      styles.trendingChip,
                      pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => handleSelectChip(item)}
                  >
                    <Ionicons
                      name="trending-up-outline"
                      size={14}
                      color={colors.accent}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.chipText, { color: colors.text }]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : loading ? (
        /* Skeletons while searching */
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <SkeletonLoader width={64} height={64} radius={12} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <SkeletonLoader height={16} width="70%" />
                <SkeletonLoader height={12} width="40%" style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : results.length === 0 ? (
        error ? (
          <ErrorState error={error} onRetry={() => setRetryTick((t) => t + 1)} />
        ) : (
          /* No results */
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{`No results for "${query}"`}</Text>
            <Text style={styles.emptySubtitle}>
              Check the spelling or try a different keyword.
            </Text>
          </View>
        )
      ) : (
        /* Search Results List */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} variant="row" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsListContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent
  },
  searchBar: {
    height: 44,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: "100%"
  },
  clearBtn: {
    padding: 4
  },
  scrollContent: {
    paddingBottom: 40
  },
  sectionContainer: {
    marginBottom: 16
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 980
  },
  trendingChip: {
    backgroundColor: "rgba(23, 23, 23, 0.08)"
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
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
    marginTop: 16,
    textAlign: "center"
  },
  emptySubtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6
  },
  resultsListContent: {
    paddingBottom: 40
  }
});
