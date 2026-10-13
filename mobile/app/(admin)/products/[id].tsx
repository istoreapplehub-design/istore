import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../../constants/theme";
import { Product } from "../../../types";
import {
  deactivateAdminProduct,
  getAdminProductById,
  restoreAdminProduct,
  updateAdminProduct
} from "../../../services/adminApi";
import { ProductForm, ProductFormData } from "../../../components/admin/ProductForm";

export default function AdminEditProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadProduct() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getAdminProductById(id);
        if (mounted) setProduct(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load product";
        Alert.alert("Error", msg, [{ text: "Go Back", onPress: () => router.back() }]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  const handleSubmit = async (data: ProductFormData) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await updateAdminProduct(id, data as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Changes Saved", "Product has been updated successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update product";
      Alert.alert("Update Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!id || !product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Deactivate Product",
      `Are you sure you want to hide "${product.name}" from customer storefront?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateAdminProduct(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch {
              Alert.alert("Error", "Failed to deactivate product.");
            }
          }
        }
      ]
    );
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      Haptics.selectionAsync();
      const updated = await restoreAdminProduct(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProduct(updated);
    } catch {
      Alert.alert("Error", "Failed to restore product.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Product not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Edit Product
        </Text>

        <Pressable
          hitSlop={8}
          onPress={handleDelete}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      {/* Inactive Banner */}
      {!product.isActive && (
        <View style={styles.inactiveBanner}>
          <Ionicons name="eye-off-outline" size={18} color={colors.danger} />
          <Text style={styles.inactiveText}>
            This product is hidden from the store.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
            onPress={handleRestore}
          >
            <Text style={styles.restoreBtnText}>Restore</Text>
          </Pressable>
        </View>
      )}

      <ProductForm
        key={product.id + String(product.isActive)}
        initialData={product as any}
        mode="edit"
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  backBtn: {
    width: 60,
    justifyContent: "center"
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center"
  },
  deleteBtn: {
    width: 60,
    alignItems: "flex-end",
    justifyContent: "center"
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger
  },
  inactiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(206, 17, 38, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(206, 17, 38, 0.2)"
  },
  inactiveText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500"
  },
  restoreBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14
  },
  restoreBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  }
});
