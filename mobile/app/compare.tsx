import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, formatGHS, radius } from "../constants/theme";
import { Product } from "../types";
import { getProducts } from "../services/api";
import { useCartStore } from "../store/useCartStore";
import { ProductVisual, getProductImage } from "../components/ProductVisual";

const CATEGORIES = ["All", "iPhone", "Mac", "iPad", "Watch", "AirPods"];

export default function CompareModelsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ base?: string; items?: string }>();
  const addItem = useCartStore((state) => state.addItem);

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [leftProduct, setLeftProduct] = useState<Product | null>(null);
  const [rightProduct, setRightProduct] = useState<Product | null>(null);
  const [pickerSlot, setPickerSlot] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    let mounted = true;
    getProducts({ limit: 50, sort: "newest" })
      .then((res) => {
        if (!mounted) return;
        const list = res.data || [];
        setCatalog(list);

        const initialSlugs = params.items
          ? params.items.split(",").filter(Boolean)
          : params.base
          ? [params.base]
          : [];

        const first =
          (initialSlugs[0] && list.find((p) => p.slug === initialSlugs[0])) ||
          list.find((p) => p.slug === "iphone-18-pro-max-512gb") ||
          list[0] ||
          null;

        const second =
          (initialSlugs[1] && list.find((p) => p.slug === initialSlugs[1])) ||
          list.find(
            (p) =>
              p.id !== first?.id &&
              (first ? p.category === first.category : true)
          ) ||
          list[1] ||
          null;

        setLeftProduct(first);
        setRightProduct(second);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [params.base, params.items]);

  const filteredPickerProducts = useMemo(() => {
    if (selectedCategory === "All") return catalog;
    return catalog.filter(
      (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [catalog, selectedCategory]);

  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    if (leftProduct?.specs) Object.keys(leftProduct.specs).forEach((k) => keys.add(k));
    if (rightProduct?.specs) Object.keys(rightProduct.specs).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [leftProduct, rightProduct]);

  const formatSpecLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase());

  const handleQuickAdd = (product: Product | null) => {
    if (!product || product.stock <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      productId: product.id,
      name: product.name,
      priceGHS: product.priceGHS,
      image: getProductImage(product) || "",
      color: product.colors?.[0]?.name,
      storage: product.storage || undefined,
      qty: 1
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={colors.text} />
        <Text style={styles.loadingText}>Loading comparison studio...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introBlock}>
          <Text style={styles.eyebrow}>I-DYNAMIC COMPARE</Text>
          <Text style={styles.title}>Compare Apple Models</Text>
          <Text style={styles.subtitle}>
            Tap either slot below to switch models and compare specifications side by side.
          </Text>
        </View>

        {/* Product Selector Columns */}
        <View style={styles.columnsRow}>
          {[
            { slot: "left" as const, item: leftProduct },
            { slot: "right" as const, item: rightProduct }
          ].map(({ slot, item }) => {
            const img = item ? getProductImage(item) : null;
            return (
              <View key={slot} style={styles.modelCol}>
                <Pressable
                  style={({ pressed }) => [
                    styles.selectorTrigger,
                    pressed && { opacity: 0.75 }
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPickerSlot(slot);
                  }}
                >
                  <Text style={styles.selectorTriggerText} numberOfLines={1}>
                    {item ? item.name : "Select Model"}
                  </Text>
                  <Ionicons name="chevron-down" size={15} color={colors.textSecondary} />
                </Pressable>

                {item ? (
                  <View style={styles.modelCard}>
                    <Pressable
                      style={styles.imageStage}
                      onPress={() => router.push(`/product/${item.slug}`)}
                    >
                      {img ? (
                        <Image source={{ uri: img }} style={styles.modelImg} resizeMode="contain" />
                      ) : (
                        <ProductVisual category={item.category} glyphSize={46} />
                      )}
                    </Pressable>

                    <Text style={styles.modelCategory}>{item.category}</Text>
                    <Text style={styles.modelName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.modelPrice}>{formatGHS(item.priceGHS)}</Text>

                    {/* Color Swatches */}
                    {Array.isArray(item.colors) && item.colors.length > 0 && (
                      <View style={styles.swatchRow}>
                        {item.colors.slice(0, 4).map((c, idx) => (
                          <View
                            key={c.name || idx}
                            style={[
                              styles.swatchDot,
                              { backgroundColor: c.hex || "#CCCCCC" }
                            ]}
                          />
                        ))}
                      </View>
                    )}

                    <View style={styles.modelActions}>
                      <Pressable
                        style={styles.buyBtn}
                        onPress={() => handleQuickAdd(item)}
                      >
                        <Text style={styles.buyBtnText}>Add to Bag</Text>
                      </Pressable>

                      <Pressable
                        style={styles.detailLink}
                        onPress={() => router.push(`/product/${item.slug}`)}
                      >
                        <Text style={styles.detailLinkText}>Learn more</Text>
                        <Ionicons name="chevron-forward" size={12} color={colors.brandAccent} />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Core Comparison Rows */}
        <View style={styles.specSection}>
          <Text style={styles.specSectionHeader}>Key Overview</Text>

          <View style={styles.specCompareBlock}>
            <Text style={styles.specLabel}>Price</Text>
            <View style={styles.specValuesRow}>
              <Text style={styles.specValText}>
                {leftProduct ? formatGHS(leftProduct.priceGHS) : "—"}
              </Text>
              <Text style={styles.specValText}>
                {rightProduct ? formatGHS(rightProduct.priceGHS) : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.specCompareBlock}>
            <Text style={styles.specLabel}>Base Storage / Config</Text>
            <View style={styles.specValuesRow}>
              <Text style={styles.specValText}>{leftProduct?.storage || "Standard"}</Text>
              <Text style={styles.specValText}>{rightProduct?.storage || "Standard"}</Text>
            </View>
          </View>

          <View style={styles.specCompareBlock}>
            <Text style={styles.specLabel}>Model Identifier</Text>
            <View style={styles.specValuesRow}>
              <Text style={styles.specValText}>{leftProduct?.model || "—"}</Text>
              <Text style={styles.specValText}>{rightProduct?.model || "—"}</Text>
            </View>
          </View>

          <View style={styles.specCompareBlock}>
            <Text style={styles.specLabel}>Customer Rating</Text>
            <View style={styles.specValuesRow}>
              <Text style={styles.specValText}>
                {leftProduct ? `${leftProduct.rating.toFixed(1)} ★ (${leftProduct.reviewCount})` : "—"}
              </Text>
              <Text style={styles.specValText}>
                {rightProduct ? `${rightProduct.rating.toFixed(1)} ★ (${rightProduct.reviewCount})` : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.specCompareBlock}>
            <Text style={styles.specLabel}>Condition & Warranty</Text>
            <View style={styles.specValuesRow}>
              <Text style={styles.specValText}>
                {leftProduct ? `${leftProduct.condition} · ${leftProduct.warranty}` : "—"}
              </Text>
              <Text style={styles.specValText}>
                {rightProduct ? `${rightProduct.condition} · ${rightProduct.warranty}` : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.specCompareBlock}>
            <Text style={styles.specLabel}>Availability</Text>
            <View style={styles.specValuesRow}>
              <Text style={styles.specValText}>
                {leftProduct
                  ? leftProduct.stock > 0
                    ? `In Stock (${leftProduct.stock})`
                    : "Out of Stock"
                  : "—"}
              </Text>
              <Text style={styles.specValText}>
                {rightProduct
                  ? rightProduct.stock > 0
                    ? `In Stock (${rightProduct.stock})`
                    : "Out of Stock"
                  : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Hardware Specs */}
        {allSpecKeys.length > 0 && (
          <View style={styles.specSection}>
            <Text style={styles.specSectionHeader}>Technical Specifications</Text>
            {allSpecKeys.map((key) => (
              <View key={key} style={styles.specCompareBlock}>
                <Text style={styles.specLabel}>{formatSpecLabel(key)}</Text>
                <View style={styles.specValuesRow}>
                  <Text style={styles.specValText}>
                    {leftProduct?.specs?.[key] || "—"}
                  </Text>
                  <Text style={styles.specValText}>
                    {rightProduct?.specs?.[key] || "—"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Model Picker Modal */}
      <Modal
        visible={pickerSlot !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerSlot(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerSlot(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Model to Compare</Text>
              <Pressable onPress={() => setPickerSlot(null)}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catFilterRow}
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat);
                    }}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <FlatList
              data={filteredPickerProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => {
                const thumb = getProductImage(item);
                return (
                  <Pressable
                    style={styles.pickerRow}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (pickerSlot === "left") {
                        setLeftProduct(item);
                      } else {
                        setRightProduct(item);
                      }
                      setPickerSlot(null);
                    }}
                  >
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.pickerThumb} resizeMode="contain" />
                    ) : (
                      <View style={styles.pickerThumb}>
                        <ProductVisual category={item.category} glyphSize={22} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.pickerItemSub}>
                        {[item.category, item.storage].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <Text style={styles.pickerItemPrice}>{formatGHS(item.priceGHS)}</Text>
                  </Pressable>
                );
              }}
            />
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10
  },
  scrollContent: {
    paddingBottom: 48
  },
  introBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.brandAccent
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.text,
    marginTop: 4
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20
  },
  columnsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12
  },
  modelCol: {
    flex: 1
  },
  selectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  selectorTriggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginRight: 6
  },
  modelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center"
  },
  imageStage: {
    width: "100%",
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  modelImg: {
    width: "100%",
    height: "100%"
  },
  modelCategory: {
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  modelName: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    minHeight: 38,
    marginTop: 3
  },
  modelPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)"
  },
  modelActions: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    gap: 8
  },
  buyBtn: {
    width: "100%",
    backgroundColor: colors.text,
    paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: "center"
  },
  buyBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  detailLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 2
  },
  detailLinkText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.brandAccent
  },
  specSection: {
    marginTop: 28,
    paddingHorizontal: 16
  },
  specSectionHeader: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text,
    marginBottom: 12
  },
  specCompareBlock: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  specLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8
  },
  specValuesRow: {
    flexDirection: "row",
    gap: 12
  },
  specValText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: "500"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingHorizontal: 16,
    paddingTop: 12
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 12
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  catFilterRow: {
    gap: 8,
    paddingBottom: 12
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  catChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  catChipTextActive: {
    color: "#FFFFFF"
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  pickerThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  pickerItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  pickerItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  pickerItemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  }
});
