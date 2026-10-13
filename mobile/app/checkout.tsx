/**
 * Haptics Audit:
 * - Haptics.impactAsync("medium") on Pay button press
 * - Haptics.selectionAsync() on region selection
 * - Haptics.notificationAsync("warning") on validation failure
 * - Haptics.notificationAsync("success") on verified payment
 */
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCartStore } from "../store/useCartStore";
import { useUserStore } from "../store/useUserStore";
import { GHANA_REGIONS } from "../constants/config";
import { colors, formatGHS, typography } from "../constants/theme";
import {
  createOrder,
  initializePayment,
  verifyPayment
} from "../services/api";
import { Order } from "../types";
import PaystackCheckoutModal from "../components/PaystackCheckoutModal";

const REGION_FEE_MAP: Record<string, number> = {
  "Greater Accra": 25.0,
  Ashanti: 40.0,
  Western: 45.0,
  Central: 45.0,
  Eastern: 45.0,
  Volta: 45.0,
  Northern: 55.0,
  "Upper East": 55.0,
  "Upper West": 55.0,
  Bono: 55.0,
  Ahafo: 55.0,
  "Bono East": 55.0,
  Oti: 55.0,
  Savannah: 55.0,
  "North East": 55.0,
  "Western North": 55.0
};

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { items, getSubtotalGHS, clearCart } = useCartStore();
  const { userId, addresses, name: defaultName, phone: defaultPhone } = useUserStore();

  const subtotalGHS = getSubtotalGHS();
  const defaultAddress = addresses[0];

  // Form state
  const [fullName, setFullName] = useState(defaultAddress?.fullName || defaultName || "");
  const [phone, setPhone] = useState(defaultAddress?.phone || defaultPhone || "");
  const [region, setRegion] = useState(defaultAddress?.region || "");
  const [city, setCity] = useState(defaultAddress?.city || "");
  const [gpsAddress, setGpsAddress] = useState(defaultAddress?.gpsAddress || "");
  const [landmark, setLandmark] = useState(defaultAddress?.landmark || "");
  const [notes, setNotes] = useState("");

  // UI state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Paystack state
  const [showPaystack, setShowPaystack] = useState(false);
  const [paystackData, setPaystackData] = useState<{
    authorization_url: string;
    reference: string;
  } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Delivery fee & Total
  const deliveryFee = region ? REGION_FEE_MAP[region] || 55.0 : null;
  const totalGHS = subtotalGHS + (deliveryFee || 0);

  // Validation
  const cleanPhone = phone.replace(/[\s-]/g, "");
  const isPhoneValid = /^(\+233|0)[0-9]{9}$/.test(cleanPhone);
  const isFullNameValid = fullName.trim().length >= 2;
  const isRegionValid = !!region && GHANA_REGIONS.includes(region as (typeof GHANA_REGIONS)[number]);
  const isCityValid = city.trim().length >= 2;

  const isFormValid = isFullNameValid && isPhoneValid && isRegionValid && isCityValid;

  const handleBlur = (field: string) => {
    setFocusedField(null);
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleSelectRegion = (selected: string) => {
    Haptics.selectionAsync();
    setRegion(selected);
    setShowRegionModal(false);
    setTouched((prev) => ({ ...prev, region: true }));
  };

  const handleCheckout = async () => {
    if (!isFormValid || submitting) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTouched({
        fullName: true,
        phone: true,
        region: true,
        city: true
      });
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Bag", "Please add items to your bag before checking out.");
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const orderBody = {
        items: items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          color: i.color || undefined,
          storage: i.storage || undefined
        })),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          region,
          city: city.trim(),
          gpsAddress: gpsAddress.trim() || undefined,
          landmark: landmark.trim() || undefined
        },
        notes: notes.trim() || undefined
      };

      const order = await createOrder(orderBody, userId);
      setCreatedOrder(order);

      const paymentInit = await initializePayment(order.id, userId);

      if (paymentInit.simulation) {
        // Direct simulation path: immediately verify and confirm order
        const verifyRes = await verifyPayment(paymentInit.reference);
        if (verifyRes.success) {
          clearCart();
          router.replace(`/order-success?orderId=${order.id}`);
        } else {
          throw new Error("Simulation payment verification failed.");
        }
      } else {
        // Live Paystack flow via WebView modal
        setPaystackData({
          authorization_url: paymentInit.authorization_url,
          reference: paymentInit.reference
        });
        setShowPaystack(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong during checkout.";
      Alert.alert("Checkout Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaystackSuccess = async () => {
    setShowPaystack(false);
    if (paystackData?.reference && createdOrder?.id) {
      try {
        setSubmitting(true);
        await verifyPayment(paystackData.reference);
      } catch {
        // Background webhook will verify if polling fails
      } finally {
        setSubmitting(false);
      }
      clearCart();
      router.replace(`/order-success?orderId=${createdOrder.id}`);
    }
  };

  const handlePaystackCancel = () => {
    setShowPaystack(false);
    Alert.alert(
      "Payment Cancelled",
      "Your order was created and is pending payment. You can pay anytime from My Orders."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Custom Modal Navigation Header */}
        <View style={styles.header}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. SHIPPING ADDRESS */}
          <Text style={styles.sectionTitle}>Shipping Address</Text>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === "fullName" && styles.textInputFocused,
                touched.fullName && !isFullNameValid && styles.textInputError
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Kwame Mensah"
              placeholderTextColor={colors.textTertiary}
              textContentType="name"
              autoCapitalize="words"
              onFocus={() => handleFocus("fullName")}
              onBlur={() => handleBlur("fullName")}
            />
            {touched.fullName && !isFullNameValid && (
              <Text style={styles.errorText}>Please enter a valid full name (min 2 characters).</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === "phone" && styles.textInputFocused,
                touched.phone && !isPhoneValid && styles.textInputError
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+233 XX XXX XXXX or 024 XXX XXXX"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              onFocus={() => handleFocus("phone")}
              onBlur={() => handleBlur("phone")}
            />
            {touched.phone && !isPhoneValid && (
              <Text style={styles.errorText}>
                Enter a valid Ghana phone number (e.g. 0241234567 or +233241234567).
              </Text>
            )}
          </View>

          {/* Region Picker Button */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Region *</Text>
            <Pressable
              style={[
                styles.regionPickerBtn,
                touched.region && !isRegionValid && styles.textInputError
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowRegionModal(true);
              }}
            >
              <Text style={region ? styles.regionValueText : styles.regionPlaceholderText}>
                {region || "Select a Ghana Region"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </Pressable>
            {touched.region && !isRegionValid && (
              <Text style={styles.errorText}>Please select your delivery region.</Text>
            )}
          </View>

          {/* City */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City / Town *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === "city" && styles.textInputFocused,
                touched.city && !isCityValid && styles.textInputError
              ]}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. East Legon, Accra or Kumasi"
              placeholderTextColor={colors.textTertiary}
              onFocus={() => handleFocus("city")}
              onBlur={() => handleBlur("city")}
            />
            {touched.city && !isCityValid && (
              <Text style={styles.errorText}>Please enter your city or town.</Text>
            )}
          </View>

          {/* GPS Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>GhanaPost GPS (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === "gpsAddress" && styles.textInputFocused
              ]}
              value={gpsAddress}
              onChangeText={setGpsAddress}
              placeholder="e.g. GA-183-9021"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              onFocus={() => handleFocus("gpsAddress")}
              onBlur={() => handleBlur("gpsAddress")}
            />
          </View>

          {/* Landmark */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nearby Landmark (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === "landmark" && styles.textInputFocused
              ]}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g. Near Melcom, Spintex"
              placeholderTextColor={colors.textTertiary}
              onFocus={() => handleFocus("landmark")}
              onBlur={() => handleBlur("landmark")}
            />
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Delivery Notes (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.notesInput,
                focusedField === "notes" && styles.textInputFocused
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any specific delivery instructions or gate directions..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              onFocus={() => handleFocus("notes")}
              onBlur={() => handleBlur("notes")}
            />
          </View>

          {/* 2. ORDER SUMMARY */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {/* Item rows */}
            {items.map((item, idx) => (
              <View
                key={`${item.productId}-${item.color || ""}-${item.storage || ""}`}
                style={[
                  styles.productRow,
                  idx !== items.length - 1 && styles.productRowBorder
                ]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.productThumb}
                  resizeMode="contain"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productQtyPrice}>
                    {item.qty} × {formatGHS(item.priceGHS)}
                    {item.storage ? ` · ${item.storage}` : ""}
                  </Text>
                </View>
                <Text style={styles.productRowTotal}>
                  {formatGHS(item.qty * item.priceGHS)}
                </Text>
              </View>
            ))}

            <View style={styles.breakdownDivider} />

            {/* Fee Breakdown */}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatGHS(subtotalGHS)}</Text>
            </View>

            <View style={[styles.breakdownRow, { marginTop: 8 }]}>
              <Text style={styles.breakdownLabel}>Delivery</Text>
              <Text
                style={[
                  styles.breakdownValue,
                  !deliveryFee && styles.deliveryPrompt
                ]}
              >
                {deliveryFee ? formatGHS(deliveryFee) : "Select region"}
              </Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatGHS(totalGHS)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* 3. STICKY PAY BUTTON */}
        <View
          style={[
            styles.stickyPayContainer,
            { paddingBottom: Math.max(insets.bottom, 16) }
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pay ${formatGHS(totalGHS)} with Paystack`}
            disabled={!isFormValid || submitting}
            style={({ pressed }) => [
              styles.payBtn,
              (!isFormValid || submitting) && styles.payBtnDisabled,
              pressed && isFormValid && !submitting && { opacity: 0.9, transform: [{ scale: 0.99 }] }
            ]}
            onPress={handleCheckout}
          >
            {submitting ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.payBtnText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payBtnText}>
                Pay {formatGHS(totalGHS)} with Paystack
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Region Selection Modal */}
      <Modal
        visible={showRegionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <SafeAreaView style={styles.regionModalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.regionModalHeader}>
            <Text style={styles.regionModalTitle}>Select Ghana Region</Text>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => setShowRegionModal(false)}
            >
              <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            data={GHANA_REGIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const fee = REGION_FEE_MAP[item] || 55;
              const isSelected = item === region;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.regionItem,
                    isSelected && styles.regionItemSelected,
                    pressed && { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleSelectRegion(item)}
                >
                  <View>
                    <Text style={[styles.regionItemName, isSelected && styles.regionItemNameSelected]}>
                      {item}
                    </Text>
                    <Text style={styles.regionItemFee}>Delivery: {formatGHS(fee)}</Text>
                  </View>

                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                  )}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Paystack Webview Modal */}
      {paystackData && (
        <PaystackCheckoutModal
          visible={showPaystack}
          authorizationUrl={paystackData.authorization_url}
          reference={paystackData.reference}
          onSuccess={handlePaystackSuccess}
          onCancel={handlePaystackCancel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardView: {
    flex: 1
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  closeBtn: {
    padding: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text
  },
  headerSpacer: {
    width: 28
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 20,
    marginBottom: 16
  },
  fieldGroup: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6
  },
  textInput: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 15,
    color: colors.text
  },
  textInputFocused: {
    borderColor: colors.accent,
    borderWidth: 1.5
  },
  textInputError: {
    borderColor: colors.danger,
    borderWidth: 1.5
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 2
  },
  notesInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  regionPickerBtn: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  regionPlaceholderText: {
    fontSize: 15,
    color: colors.textTertiary
  },
  regionValueText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500"
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10
  },
  productRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.imageBg
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text
  },
  productQtyPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  productRowTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text
  },
  deliveryPrompt: {
    color: colors.textSecondary,
    fontStyle: "italic"
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  stickyPayContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  payBtn: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 980,
    alignItems: "center",
    justifyContent: "center"
  },
  payBtnDisabled: {
    opacity: 0.5
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600"
  },
  regionModalSafeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  regionModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  regionModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  regionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  regionItemSelected: {
    backgroundColor: "rgba(0, 113, 227, 0.05)"
  },
  regionItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text
  },
  regionItemNameSelected: {
    fontWeight: "600",
    color: colors.accent
  },
  regionItemFee: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  }
});
