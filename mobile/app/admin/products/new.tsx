import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors } from "../../../constants/theme";
import { createAdminProduct } from "../../../services/adminApi";
import { ProductForm, ProductFormData } from "../../../components/admin/ProductForm";

export default function AdminNewProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (data: ProductFormData) => {
    try {
      setSubmitting(true);
      await createAdminProduct(data as any);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Product Created",
        "The product is now live on the store.",
        [
          {
            text: "View Products",
            onPress: () => router.replace("/admin/products")
          },
          {
            text: "Add Another",
            onPress: () => {
              setFormKey((k) => k + 1);
            }
          }
        ]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create product.";
      Alert.alert("Failed to Create", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Product</Text>
        <View style={{ width: 60 }} />
      </View>

      <ProductForm
        key={formKey}
        mode="create"
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
  cancelBtn: {
    width: 60,
    justifyContent: "center"
  },
  cancelText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: "500"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center"
  }
});
