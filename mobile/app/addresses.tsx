/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on row actions
 * - Haptics.notificationAsync("success"/"warning") on save/delete results
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../constants/theme";
import { GHANA_REGIONS } from "../constants/config";
import { ShippingAddress } from "../types";
import { useUserStore } from "../store/useUserStore";

const MAX_ADDRESSES = 8;
const PHONE_RE = /^(\+233|0)[0-9]{9}$/;

type AddressForm = {
  fullName: string;
  phone: string;
  region: string;
  city: string;
  gpsAddress: string;
  landmark: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  fullName: "",
  phone: "",
  region: "",
  city: "",
  gpsAddress: "",
  landmark: "",
  isDefault: false
};

function formFromAddress(addr: ShippingAddress): AddressForm {
  return {
    fullName: addr.fullName,
    phone: addr.phone,
    region: addr.region,
    city: addr.city,
    gpsAddress: addr.gpsAddress || "",
    landmark: addr.landmark || "",
    isDefault: !!addr.isDefault
  };
}

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, saveAddressBook, session } = useUserStore();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.guestState}>
          <Ionicons name="location-outline" size={44} color={colors.textTertiary} />
          <Text style={typography.h3}>Sign in required</Text>
          <Text style={[typography.bodySmall, { textAlign: "center", marginTop: 8 }]}>
            Sign in to save and manage your delivery addresses.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.blackPill, pressed && { opacity: 0.7 }]}
            onPress={() => router.replace("/(auth)/login?returnTo=addresses")}
          >
            <Text style={styles.blackPillText}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const openAdd = () => {
    if (addresses.length >= MAX_ADDRESSES) {
      Alert.alert("Address book full", `You can save up to ${MAX_ADDRESSES} addresses.`);
      return;
    }
    Haptics.selectionAsync();
    setEditingIndex(null);
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setEditorVisible(true);
  };

  const openEdit = (index: number) => {
    Haptics.selectionAsync();
    setEditingIndex(index);
    setForm(formFromAddress(addresses[index]));
    setEditorVisible(true);
  };

  const validate = (): string | null => {
    if (form.fullName.trim().length < 2) return "Please enter the recipient's full name.";
    if (!PHONE_RE.test(form.phone.trim()))
      return "Enter a valid Ghana phone number (e.g. 0241234567 or +233241234567).";
    if (!form.region) return "Please select a region.";
    if (form.city.trim().length < 2) return "Please enter a city or town.";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Check the details", error);
      return;
    }

    const entry: ShippingAddress = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      region: form.region,
      city: form.city.trim(),
      gpsAddress: form.gpsAddress.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      isDefault: form.isDefault
    };

    const next = [...addresses];
    if (editingIndex === null) {
      next.push(entry);
    } else {
      next[editingIndex] = entry;
    }
    if (entry.isDefault) {
      next.forEach((a) => (a.isDefault = a === entry));
    } else if (!next.some((a) => a.isDefault)) {
      next[0].isDefault = true;
    }

    setSaving(true);
    try {
      await saveAddressBook(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditorVisible(false);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Could not save address",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (index: number) => {
    if (addresses[index].isDefault) return;
    Haptics.selectionAsync();
    const next = addresses.map((a, i) => ({ ...a, isDefault: i === index }));
    try {
      await saveAddressBook(next);
    } catch (err) {
      Alert.alert(
        "Could not update address",
        err instanceof Error ? err.message : "Please try again."
      );
    }
  };

  const handleDelete = (index: number) => {
    const addr = addresses[index];
    Alert.alert("Delete address", `Remove "${addr.fullName}, ${addr.city}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const next = addresses.filter((_, i) => i !== index);
          if (next.length > 0 && !next.some((a) => a.isDefault)) {
            next[0].isDefault = true;
          }
          try {
            await saveAddressBook(next);
          } catch (err) {
            Alert.alert(
              "Could not delete address",
              err instanceof Error ? err.message : "Please try again."
            );
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={typography.bodySmall}>
            Up to {MAX_ADDRESSES} addresses for faster checkout.
          </Text>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={44} color={colors.textTertiary} />
            <Text style={typography.h3}>No addresses yet</Text>
            <Text style={[typography.bodySmall, { textAlign: "center", marginTop: 8 }]}>
              Add a delivery address now and it will be waiting for you at checkout.
            </Text>
          </View>
        ) : (
          addresses.map((addr, idx) => (
            <View key={`${addr.fullName}-${idx}`} style={styles.addressCard}>
              <View style={styles.addressTopRow}>
                <View style={styles.addressNameWrap}>
                  <Text style={styles.addressName}>{addr.fullName}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                {!addr.isDefault && (
                  <Pressable hitSlop={10} onPress={() => handleSetDefault(idx)}>
                    <Text style={styles.setDefaultBtn}>Set as default</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.addressLine}>{addr.phone}</Text>
              <Text style={styles.addressLine}>
                {addr.city}, {addr.region}
              </Text>
              {addr.gpsAddress ? (
                <Text style={styles.addressSub}>GPS: {addr.gpsAddress}</Text>
              ) : null}
              {addr.landmark ? (
                <Text style={styles.addressSub}>Landmark: {addr.landmark}</Text>
              ) : null}

              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => openEdit(idx)}>
                  <Ionicons name="pencil-outline" size={15} color={colors.text} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => handleDelete(idx)}>
                  <Ionicons name="trash-outline" size={15} color={colors.text} />
                  <Text style={styles.actionBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable
          style={({ pressed }) => [styles.blackPill, pressed && { opacity: 0.7 }]}
          onPress={openAdd}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.blackPillText}>
            {addresses.length === 0 ? "Add Address" : "Add New Address"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Add / Edit form */}
      <Modal
        visible={editorVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditorVisible(false)}
      >
        <SafeAreaView style={styles.sheetRoot}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingIndex === null ? "New Address" : "Edit Address"}
              </Text>
              <Pressable hitSlop={12} onPress={() => setEditorVisible(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={{ paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={form.fullName}
                onChangeText={(t) => setForm((f) => ({ ...f, fullName: t }))}
                placeholder="e.g. Kwame Mensah"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                placeholder="0241234567"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Region</Text>
              <Pressable
                style={styles.regionField}
                onPress={() => {
                  Haptics.selectionAsync();
                  setRegionPickerVisible(true);
                }}
              >
                <Text
                  style={form.region ? styles.regionValue : styles.regionPlaceholder}
                >
                  {form.region || "Select your region"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>

              <Text style={styles.fieldLabel}>City / Town</Text>
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(t) => setForm((f) => ({ ...f, city: t }))}
                placeholder="e.g. East Legon"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={styles.fieldLabel}>GPS Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.gpsAddress}
                onChangeText={(t) => setForm((f) => ({ ...f, gpsAddress: t }))}
                placeholder="e.g. GA-515-0524"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>Nearest Landmark (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.landmark}
                onChangeText={(t) => setForm((f) => ({ ...f, landmark: t }))}
                placeholder="e.g. Opposite Kasoa Toll Booth"
                placeholderTextColor={colors.textTertiary}
                multiline
              />

              <View style={styles.defaultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Deliver here by default</Text>
                  <Text style={typography.caption}>Used automatically at checkout.</Text>
                </View>
                <Switch
                  value={form.isDefault}
                  onValueChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
                  trackColor={{ false: colors.border, true: "rgba(23,23,23,0.35)" }}
                  thumbColor={form.isDefault ? colors.accent : "#FFFFFF"}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.blackPill,
                  (pressed || saving) && { opacity: 0.6 }
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.blackPillText}>Save Address</Text>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Region picker */}
        <Modal
          visible={regionPickerVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setRegionPickerVisible(false)}
        >
          <Pressable
            style={styles.regionBackdrop}
            onPress={() => setRegionPickerVisible(false)}
          >
            <Pressable style={styles.regionSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.regionSheetHeader}>
                <Text style={styles.sheetTitle}>Select Region</Text>
                <Pressable hitSlop={12} onPress={() => setRegionPickerVisible(false)}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {GHANA_REGIONS.map((region) => (
                  <Pressable
                    key={region}
                    style={({ pressed }) => [
                      styles.regionRow,
                      pressed && { backgroundColor: colors.surface }
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setForm((f) => ({ ...f, region }));
                      setRegionPickerVisible(false);
                    }}
                  >
                    <Text style={styles.regionRowText}>{region}</Text>
                    {form.region === region && (
                      <Ionicons name="checkmark" size={20} color={colors.accent} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48
  },
  pageHeader: {
    marginBottom: 20
  },
  pageTitle: {
    ...typography.h1,
    marginBottom: 6
  },
  guestState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 4
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  addressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  addressNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexWrap: "wrap"
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  },
  defaultBadge: {
    backgroundColor: "rgba(23, 23, 23, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 980
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent
  },
  setDefaultBtn: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
    textDecorationLine: "underline"
  },
  addressLine: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2
  },
  addressSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  cardActions: {
    flexDirection: "row",
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text
  },
  blackPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingVertical: 14,
    marginTop: 16
  },
  blackPillText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  sheetRoot: {
    flex: 1,
    backgroundColor: colors.background
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 18,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 48
  },
  regionField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    minHeight: 48
  },
  regionValue: {
    fontSize: 16,
    color: colors.text
  },
  regionPlaceholder: {
    fontSize: 16,
    color: colors.textTertiary
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20
  },
  regionBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  regionSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%"
  },
  regionSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  regionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  regionRowText: {
    fontSize: 16,
    color: colors.text
  }
});
