import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius, theme } from "../../constants/theme";
import { Product } from "../../types";
import { getAdminProducts } from "../../services/adminApi";
import { setFlashDeal } from "../../services/adminServicesApi";
import { discountPercent, selectFlashDeals } from "../../hooks/useFlashDeals";
import { AdminHeader } from "../../components/admin/AdminHeader";

function heroImage(p: Product): string | undefined {
  return p.images?.[0] || p.colors?.[0]?.images?.[0];
}

export default function AdminFlashDealsScreen() {
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState<Product | null>(null);
  const [compareValue, setCompareValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await getAdminProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deals = useMemo(() => selectFlashDeals(products), [products]);
  const dealIds = useMemo(() => new Set(deals.map((d) => d.id)), [deals]);
  const candidates = useMemo(
    () => products.filter((p) => !dealIds.has(p.id) && p.isActive !== false && p.stock > 0),
    [products, dealIds]
  );

  const openSetDeal = (p: Product) => {
    Haptics.selectionAsync();
    setTarget(p);
    setCompareValue(p.compareAtPriceGHS ? String(p.compareAtPriceGHS) : "");
    setFormError(null);
  };

  const handleSave = async () => {
    if (!target) return;
    const was = Number(compareValue);
    if (!compareValue.trim() || !Number.isFinite(was) || was <= 0) {
      setFormError("Enter the original price in GHS (greater than 0).");
      return;
    }
    if (was <= target.priceGHS) {
      setFormError(`Compare-at price must be higher than the current price (₵${target.priceGHS.toLocaleString("en-GH")}).`);
      return;
    }
    setSaving(true);
    try {
      const updated = await setFlashDeal(target.id, was);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setTarget(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not save the deal");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (p: Product) => {
    Haptics.selectionAsync();
    Alert.alert("Remove Flash Deal", `Clear the compare-at price for “${p.name}”? The product itself stays live.`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove Deal",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = await setFlashDeal(p.id, null);
            setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          } catch (err: unknown) {
            Alert.alert("Failed", err instanceof Error ? err.message : "Could not remove the deal");
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Flash Deals"
        subtitle="Daily offers · resets at midnight"
        right={
          <View style={styles.dealCountPill}>
            <Text style={styles.dealCountText}>{deals.length} LIVE</Text>
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 14, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.brandAccent} />}
      >
        <Text style={styles.subtitle}>
          A deal is any live product with a compare-at price above its selling price. Deals reset daily at midnight.
        </Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>ACTIVE DEALS ({deals.length})</Text>
            {deals.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>
                  No flash deals right now. Add one from “More products” below.
                </Text>
              </View>
            ) : (
              deals.map((p) => (
                <View key={p.id} style={styles.row}>
                  {heroImage(p) ? (
                    <Image source={{ uri: heroImage(p)! }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Ionicons name="cube-outline" size={18} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.priceLine}>
                      ₵{p.priceGHS.toLocaleString("en-GH")}{"  "}
                      <Text style={styles.wasPrice}>
                        ₵{(p.compareAtPriceGHS || 0).toLocaleString("en-GH")}
                      </Text>
                    </Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{discountPercent(p)}%</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => openSetDeal(p)} style={styles.editBtn} hitSlop={6}>
                    <Ionicons name="create-outline" size={17} color={colors.text} />
                  </Pressable>
                  <Pressable onPress={() => handleRemove(p)} style={styles.removeBtn} hitSlop={6}>
                    <Ionicons name="close" size={17} color={colors.danger} />
                  </Pressable>
                </View>
              ))
            )}

            <Text style={styles.sectionLabel}>MORE PRODUCTS</Text>
            {candidates.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Every in-stock product already has a deal.</Text>
              </View>
            ) : (
              candidates.slice(0, 40).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => openSetDeal(p)}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
                >
                  {heroImage(p) ? (
                    <Image source={{ uri: heroImage(p)! }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <Ionicons name="cube-outline" size={18} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.priceLine}>₵{p.priceGHS.toLocaleString("en-GH")} · stock {p.stock}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={20} color={colors.brandAccent} />
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!target} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTarget(null)}>
        {target ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Flash Deal Price</Text>
            <Text style={styles.modalSub} numberOfLines={2}>{target.name}</Text>
            <Text style={styles.modalPrice}>Selling price: ₵{target.priceGHS.toLocaleString("en-GH")}</Text>

            <Text style={styles.fieldLabel}>COMPARE-AT / ORIGINAL PRICE (GHS)</Text>
            <TextInput
              value={compareValue}
              onChangeText={setCompareValue}
              keyboardType="decimal-pad"
              placeholder="e.g. 15500"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoFocus
            />
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setTarget(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Deal</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 20, lineHeight: 19 },
  dealCountPill: {
    backgroundColor: colors.brandRedSoft,
    borderColor: colors.brandRedBorder,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  dealCountText: { fontSize: 10, fontWeight: "800", color: colors.brandAccent, letterSpacing: 0.6 },
  centerBox: { alignItems: "center", paddingTop: 60 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  errorText: { fontSize: 13.5, color: colors.danger, marginTop: 8 },
  retryBtn: {
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: colors.text },
  emptyText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 8
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.imageBg, resizeMode: "cover" },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14.5, fontWeight: "600", color: colors.text },
  priceLine: { fontSize: 13, color: colors.text, marginTop: 2, fontWeight: "600" },
  wasPrice: { color: colors.textTertiary, textDecorationLine: "line-through", fontWeight: "400" },
  discountBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandRedSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5
  },
  discountText: { fontSize: 11, fontWeight: "700", color: colors.brandAccent },
  editBtn: { padding: 6 },
  removeBtn: { padding: 6 },
  modalBackdrop: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  modalSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  modalPrice: { fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 8 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    marginTop: 20,
    marginBottom: 8
  },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtnText: { fontSize: 14.5, fontWeight: "600", color: colors.textSecondary },
  saveBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandAccent,
    alignItems: "center",
    justifyContent: "center"
  },
  saveBtnText: { fontSize: 14.5, fontWeight: "700", color: "#FFFFFF" }
});
