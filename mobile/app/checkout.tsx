/**
 * Haptics Audit:
 * - Haptics.impactAsync("medium") on Pay button press
 * - Haptics.selectionAsync() on region selection
 * - Haptics.notificationAsync("warning") on validation failure
 * - Haptics.notificationAsync("success") on verified payment
 */
import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "../store/useCartStore";
import { useUserStore } from "../store/useUserStore";
import { getPreferences } from "../lib/preferences";
import { GHANA_REGIONS, getDeliveryQuote } from "../constants/config";
import { colors, formatGHS, radius } from "../constants/theme";
import {
  createGuestOrder,
  createOrder,
  initializePayment,
  verifyPayment
} from "../services/api";
import { Order, ShippingAddress } from "../types";
import { AppHaptics } from "../lib/haptics";
import PaystackCheckoutModal from "../components/PaystackCheckoutModal";
import { ProductVisual, getStoredImage } from "../components/ProductVisual";
import { InstallmentApplicationModal } from "../components/InstallmentApplicationModal";
import { initializeDownPayment, verifyDownPayment } from "../services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STORE_PICKUP_LOCATIONS = [
  {
    id: "flagship-ucc-cape-coast",
    name: "LesTrades Flagship — UCC Cape Coast",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    region: "Central Region",
    city: "Cape Coast",
    hours: "Mon–Sat: 8:30 AM – 8:00 PM | Sun: 12:00 PM – 6:00 PM",
    readyTime: "Ready for pickup in 1 hour"
  },
  {
    id: "flagship-east-legon",
    name: "LesTrades Hub — East Legon",
    address: "Boundary Road, Opp. A&C Mall, East Legon, Accra",
    region: "Greater Accra",
    city: "Accra",
    hours: "Mon–Sat: 9:00 AM – 8:00 PM | Sun: 12:00 PM – 6:00 PM",
    readyTime: "Ready for pickup in 1 hour"
  },
  {
    id: "studio-accra-mall",
    name: "LesTrades Studio — Accra Mall",
    address: "Tetteh Quarshie Interchange, Shop G12, Accra",
    region: "Greater Accra",
    city: "Accra",
    hours: "Mon–Sat: 9:00 AM – 9:00 PM | Sun: 10:00 AM – 8:00 PM",
    readyTime: "Ready for pickup in 1 hour"
  },
  {
    id: "hub-kumasi",
    name: "LesTrades Experience — Kumasi City Mall",
    address: "Asokwa, Kumasi City Mall, Shop 24, Kumasi",
    region: "Ashanti",
    city: "Kumasi",
    hours: "Mon–Sat: 9:00 AM – 8:00 PM | Sun: 12:00 PM – 6:00 PM",
    readyTime: "Ready for pickup in 2 hours"
  }
];


const PAYMENT_METHODS = [
  {
    id: "momo",
    name: "Mobile Money (MTN · Telecel · AirtelTigo)",
    subtitle: "Instant MoMo prompt via Paystack",
    icon: "phone-portrait-outline" as const
  },
  {
    id: "card",
    name: "Credit / Debit Card (Visa · Mastercard)",
    subtitle: "3D Secure encrypted card checkout",
    icon: "card-outline" as const
  },
  {
    id: "bank",
    name: "Instant Bank Transfer / USSD",
    subtitle: "Supported Ghanaian banks via Paystack",
    icon: "business-outline" as const
  }
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const { items, getSubtotalGHS, clearCart, guestCheckout, setGuestCheckout } = useCartStore();
  const { userId, session, addresses, name: defaultName, phone: defaultPhone, email: defaultEmail } =
    useUserStore();

  /** Guests pick a checkout lane before the form; members go straight in. */
  const [userSelectedMode, setUserSelectedMode] = useState<"guest" | null>(null);
  const isGuestMode = guestCheckout || mode === "guest" || userSelectedMode === "guest";
  const checkoutMode: "choose" | "guest" | "member" = session
    ? "member"
    : isGuestMode
    ? "guest"
    : "choose";

  const subtotalGHS = getSubtotalGHS();
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  // Form state
  const [email, setEmail] = useState(defaultEmail || "");
  const [fullName, setFullName] = useState(
    defaultAddress?.fullName || (defaultName === "Guest User" ? "" : defaultName || "")
  );
  const [phone, setPhone] = useState(defaultAddress?.phone || defaultPhone || "");
  const [region, setRegion] = useState(defaultAddress?.region || "");
  const [city, setCity] = useState(defaultAddress?.city || "");
  const [gpsAddress, setGpsAddress] = useState(defaultAddress?.gpsAddress || "");
  const [landmark, setLandmark] = useState(defaultAddress?.landmark || "");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (defaultAddress?.region) return;
    getPreferences().then((p) => {
      if (p.defaultRegion) setRegion((prev) => prev || p.defaultRegion);
    });
  }, [defaultAddress?.region]);

  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail((prev) => prev || defaultEmail || "");
    setFullName((prev) => prev || (defaultName === "Guest User" ? "" : defaultName || ""));
    setPhone((prev) => prev || defaultPhone || "");
  }, [session, defaultEmail, defaultName, defaultPhone]);

  // UI state
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [selectedPickupLocation, setSelectedPickupLocation] = useState(STORE_PICKUP_LOCATIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("momo");
  const [paymentPlanType, setPaymentPlanType] = useState<"full" | "installment">("full");
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState<any>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Paystack state
  const [showPaystack, setShowPaystack] = useState(false);
  const [paystackData, setPaystackData] = useState<{
    authorization_url: string;
    reference: string;
  } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Delivery quote & Total calculations
  const deliveryQuote = getDeliveryQuote(region);
  const deliveryFee = fulfillmentType === "pickup" ? 0 : region ? deliveryQuote.feeGHS : null;
  const discountAmount = appliedDiscount
    ? Math.round((subtotalGHS * appliedDiscount.percent) / 100)
    : 0;
  const totalGHS = Math.max(0, subtotalGHS - discountAmount + (deliveryFee || 0));
  const downPaymentAmountGHS = Math.round(totalGHS * 0.6 * 100) / 100;
  const remainingInstallmentGHS = Math.round((totalGHS - downPaymentAmountGHS) * 100) / 100;
  const payableTodayGHS = paymentPlanType === "installment" ? downPaymentAmountGHS : totalGHS;

  // Validation
  const cleanPhone = phone.replace(/[\s-]/g, "");
  const isPhoneValid = /^(\+233|0)[0-9]{9}$/.test(cleanPhone);
  const isFullNameValid = fullName.trim().length >= 2;
  const isRegionValid = !!region && GHANA_REGIONS.includes(region as (typeof GHANA_REGIONS)[number]);
  const isCityValid = city.trim().length >= 2;
  const isEmailValid = EMAIL_RE.test(email.trim());
  const needsGuestEmail = checkoutMode === "guest";

  const isFormValid =
    isFullNameValid &&
    isPhoneValid &&
    (!needsGuestEmail || isEmailValid) &&
    (fulfillmentType === "pickup" || (isRegionValid && isCityValid));

  const handleBlur = (field: string) => {
    setFocusedField(null);
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleSelectRegion = (selected: string) => {
    AppHaptics.selection();
    setRegion(selected);
    setShowRegionModal(false);
    setTouched((prev) => ({ ...prev, region: true }));
  };

  const handleSelectSavedAddress = (addr: ShippingAddress) => {
    AppHaptics.selection();
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setRegion(addr.region);
    setCity(addr.city);
    setGpsAddress(addr.gpsAddress || "");
    setLandmark(addr.landmark || "");
    setShowAddressPicker(false);
    setTouched({});
  };

  const handleApplyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;
    if (clean === "LESTRADES10" || clean === "IDYNAMIC10" || clean === "APPLEGH" || clean === "WELCOME10" || clean === "VIP10") {
      AppHaptics.success();
      setAppliedDiscount({ code: clean, percent: 10 });
      setPromoSuccess("10% discount applied!");
      setPromoError(null);
    } else if (clean === "LESTRADES5" || clean === "IDYNAMIC5" || clean === "SAVE5") {
      AppHaptics.success();
      setAppliedDiscount({ code: clean, percent: 5 });
      setPromoSuccess("5% discount applied!");
      setPromoError(null);
    } else {
      AppHaptics.warning();
      setPromoError("Promo code is invalid or has expired.");
      setPromoSuccess(null);
    }
  };

  const handleCheckout = async () => {
    if (!isFormValid || submitting) {
      AppHaptics.warning();
      setTouched({
        fullName: true,
        phone: true,
        region: true,
        city: true,
        ...(needsGuestEmail ? { email: true } : {})
      });
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Bag", "Please add items to your bag before checking out.");
      return;
    }

    setSubmitting(true);
    AppHaptics.impactMedium();

    const cleanEmail = email.trim().toLowerCase();

    try {
      const orderBody = {
        items: items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          color: i.color || undefined,
          storage: i.storage || undefined
        })),
        shippingAddress:
          fulfillmentType === "pickup"
            ? {
                fullName: fullName.trim(),
                phone: cleanPhone,
                region: selectedPickupLocation.region,
                city: selectedPickupLocation.city,
                gpsAddress: selectedPickupLocation.address,
                landmark: `Store Pickup: ${selectedPickupLocation.name}`
              }
            : {
                fullName: fullName.trim(),
                phone: cleanPhone,
                region,
                city: city.trim(),
                gpsAddress: gpsAddress.trim() || undefined,
                landmark: landmark.trim() || undefined
              },
        notes: notes.trim() || undefined,
        promoCode: appliedDiscount?.code || undefined
      };

      const order = needsGuestEmail
        ? await createGuestOrder({ ...orderBody, email: cleanEmail })
        : await createOrder(orderBody, userId);

      setCreatedOrder(order);

      // If user selected installment plan and hasn't completed application yet, open modal
      if (paymentPlanType === "installment" && !installmentPlan) {
        setShowInstallmentModal(true);
        return;
      }

      // If user is paying 60% down payment for an approved plan
      if (paymentPlanType === "installment" && installmentPlan) {
        const downInit = await initializeDownPayment({
          planId: installmentPlan.id,
          email: cleanEmail
        });

        if (downInit.data?.isSimulation) {
          await verifyDownPayment({
            reference: downInit.data.reference,
            planId: installmentPlan.id
          });
          clearCart();
          router.replace(
            `/order-success?orderId=${order.id}&installment=1${needsGuestEmail ? `&guest=1&email=${encodeURIComponent(cleanEmail)}` : ""}`
          );
          return;
        } else {
          setPaystackData({
            authorization_url: downInit.data.authorization_url,
            reference: downInit.data.reference
          });
          setShowPaystack(true);
          return;
        }
      }

      const paymentInit = needsGuestEmail
        ? await initializePayment(order.id, { email: cleanEmail })
        : await initializePayment(order.id, { userId });

      if (paymentInit.simulation) {
        // Direct simulation path: immediately verify and confirm order
        const verifyRes = await verifyPayment(paymentInit.reference);
        if (verifyRes.success) {
          clearCart();
          router.replace(
            `/order-success?orderId=${order.id}${needsGuestEmail ? `&guest=1&email=${encodeURIComponent(cleanEmail)}` : ""}`
          );
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
      const guestQuery = needsGuestEmail
        ? `&guest=1&email=${encodeURIComponent(email.trim().toLowerCase())}`
        : "";
      router.replace(`/order-success?orderId=${createdOrder.id}${guestQuery}`);
    }
  };

  const handlePaystackCancel = () => {
    setShowPaystack(false);
    Alert.alert(
      "Payment Cancelled",
      needsGuestEmail
        ? "Your order is saved as pending. Finish payment within 30 minutes or it will be released automatically."
        : "Your order was created and is pending payment. You can pay anytime from My Orders."
    );
  };

  if (checkoutMode === "choose") {
    const lanes = [
      {
        key: "guest" as const,
        icon: "flash-outline" as const,
        title: "Continue as a guest",
        body: "No account needed. Pay with MoMo or card — we attach the order to your email so you can follow up on it."
      },
      {
        key: "signin" as const,
        icon: "person-circle-outline" as const,
        title: "Sign in",
        body: "Faster checkout with your saved addresses, wishlist and order history."
      },
      {
        key: "register" as const,
        icon: "add-circle-outline" as const,
        title: "Create an I-Dynamic account",
        body: "Takes about 20 seconds. Worth it if you order more than once."
      }
    ];

    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
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

        <ScrollView contentContainerStyle={styles.laneContent}>
          <Text style={styles.laneTitle}>How would you like to check out?</Text>
          <Text style={styles.laneSubtitle}>
            {items.length} {items.length === 1 ? "item" : "items"} · {formatGHS(subtotalGHS)} in
            your bag
          </Text>

          {lanes.map((lane) => (
            <Pressable
              key={lane.key}
              style={({ pressed }) => [styles.laneCard, pressed && styles.laneCardPressed]}
              onPress={() => {
                AppHaptics.selection();
                if (lane.key === "guest") {
                  setGuestCheckout(true);
                  setUserSelectedMode("guest");
                  return;
                }
                if (lane.key === "signin") {
                  router.push("/(auth)/login?returnTo=checkout");
                  return;
                }
                router.push("/(auth)/register?returnTo=checkout");
              }}
            >
              <Ionicons name={lane.icon} size={26} color={colors.text} />
              <View style={styles.laneCopy}>
                <Text style={styles.laneCardTitle}>{lane.title}</Text>
                <Text style={styles.laneCardBody}>{lane.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.textTertiary} />
            </Pressable>
          ))}

          <View style={styles.laneAssurance}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.laneAssuranceText}>
              Payments run through Paystack. I-Dynamic never stores your card details or MoMo
              credentials.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            onPress={() => {
              setGuestCheckout(false);
              setUserSelectedMode(null);
              router.back();
            }}
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
          {/* Guest banner */}
          {needsGuestEmail && (
            <View style={styles.guestBanner}>
              <Ionicons name="person-outline" size={16} color={colors.text} />
              <Text style={styles.guestBannerText}>Checking out as a guest</Text>
              <Pressable
                hitSlop={10}
                onPress={() => {
                  AppHaptics.selection();
                  router.push("/(auth)/login?returnTo=checkout");
                }}
              >
                <Text style={styles.guestBannerLink}>Sign in instead</Text>
              </Pressable>
            </View>
          )}

          {/* FULFILLMENT MODE: DELIVERY vs STORE PICKUP */}
          <View style={styles.fulfillmentSegment}>
            <Pressable
              style={[
                styles.fulfillmentTab,
                fulfillmentType === "delivery" && styles.fulfillmentTabActive
              ]}
              onPress={() => {
                AppHaptics.selection();
                setFulfillmentType("delivery");
              }}
            >
              <Ionicons
                name="bicycle"
                size={17}
                color={fulfillmentType === "delivery" ? "#FFFFFF" : colors.text}
              />
              <Text
                style={[
                  styles.fulfillmentTabText,
                  fulfillmentType === "delivery" && styles.fulfillmentTabTextActive
                ]}
              >
                Doorstep Delivery
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.fulfillmentTab,
                fulfillmentType === "pickup" && styles.fulfillmentTabActive
              ]}
              onPress={() => {
                AppHaptics.selection();
                setFulfillmentType("pickup");
              }}
            >
              <Ionicons
                name="business"
                size={17}
                color={fulfillmentType === "pickup" ? "#FFFFFF" : colors.text}
              />
              <Text
                style={[
                  styles.fulfillmentTabText,
                  fulfillmentType === "pickup" && styles.fulfillmentTabTextActive
                ]}
              >
                Store Pickup (Free)
              </Text>
            </Pressable>
          </View>

          {/* STORE PICKUP STATIONS */}
          {fulfillmentType === "pickup" && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Select Pickup Station</Text>
              <View style={styles.pickupLocationsList}>
                {STORE_PICKUP_LOCATIONS.map((loc) => {
                  const isSelected = loc.id === selectedPickupLocation.id;
                  return (
                    <Pressable
                      key={loc.id}
                      style={[
                        styles.pickupCard,
                        isSelected && styles.pickupCardSelected
                      ]}
                      onPress={() => {
                        AppHaptics.selection();
                        setSelectedPickupLocation(loc);
                      }}
                    >
                      <View style={styles.pickupHeaderRow}>
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                          size={20}
                          color={isSelected ? colors.brandRed : colors.textSecondary}
                        />
                        <Text style={[styles.pickupName, isSelected && styles.pickupNameSelected]}>
                          {loc.name}
                        </Text>
                      </View>
                      <Text style={styles.pickupAddress}>{loc.address}</Text>
                      <View style={styles.pickupMetaRow}>
                        <View style={styles.pickupReadyBadge}>
                          <Text style={styles.pickupReadyText}>{loc.readyTime}</Text>
                        </View>
                        <Text style={styles.pickupHours}>{loc.hours}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* SHIPPING ADDRESS OR PICKUP PERSON */}
          <Text style={styles.sectionTitle}>
            {fulfillmentType === "pickup" ? "Pickup Contact Details" : "Shipping Address"}
          </Text>

          {fulfillmentType === "delivery" && addresses.length > 0 && !needsGuestEmail && (
            <View style={styles.savedAddressCard}>
              <View style={styles.savedAddressInfo}>
                <View style={styles.savedAddressBadge}>
                  <Ionicons name="location-outline" size={14} color={colors.accent} />
                  <Text style={styles.savedAddressBadgeText}>Saved Address</Text>
                </View>
                <Text style={styles.savedAddressName} numberOfLines={1}>
                  {fullName || "Recipient"}
                </Text>
                <Text style={styles.savedAddressDetail} numberOfLines={1}>
                  {city ? `${city}, ${region}` : region || "Select delivery details"}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.savedAddressSwitchBtn,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => {
                  AppHaptics.selection();
                  setShowAddressPicker(true);
                }}
              >
                <Text style={styles.savedAddressSwitchText}>Switch</Text>
                <Ionicons name="chevron-down" size={13} color={colors.accent} />
              </Pressable>
            </View>
          )}

          {needsGuestEmail && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email for your order *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  focusedField === "email" && styles.textInputFocused,
                  touched.email && !isEmailValid && styles.textInputError
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
              />
              {touched.email && !isEmailValid ? (
                <Text style={styles.errorText}>
                  Enter a valid email — we use it to look this order up if you contact us.
                </Text>
              ) : (
                <Text style={styles.fieldHint}>
                  We keep it on the order and use it to confirm delivery details. No marketing.
                </Text>
              )}
            </View>
          )}

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {fulfillmentType === "pickup" ? "Full Name (Person Collecting) *" : "Full Name *"}
            </Text>
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
            <Text style={styles.fieldLabel}>
              {fulfillmentType === "pickup" ? "Phone Number (Pickup SMS Alert) *" : "Phone Number *"}
            </Text>
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

          {/* Delivery Specific Fields */}
          {fulfillmentType === "delivery" && (
            <>
              {/* Region Picker Button */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Region *</Text>
                <Pressable
                  style={[
                    styles.regionPickerBtn,
                    touched.region && !isRegionValid && styles.textInputError
                  ]}
                  onPress={() => {
                    AppHaptics.impactLight();
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
            </>
          )}

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {fulfillmentType === "pickup" ? "Order Notes (Optional)" : "Delivery Notes (Optional)"}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.notesInput,
                focusedField === "notes" && styles.textInputFocused
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder={
                fulfillmentType === "pickup"
                  ? "e.g. Someone else picking up on my behalf with Ghana Card..."
                  : "Any specific delivery instructions or gate directions..."
              }
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              onFocus={() => handleFocus("notes")}
              onBlur={() => handleBlur("notes")}
            />
          </View>

          {/* Promo code drawer */}
          <View style={styles.promoContainer}>
            <Text style={styles.promoHeaderTitle}>Promo or Gift Card</Text>
            <View style={styles.promoInputRow}>
              <TextInput
                style={[
                  styles.promoInput,
                  promoError ? styles.textInputError : undefined
                ]}
                placeholder="Enter promo code (e.g. APPLEGH)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                value={promoCode}
                onChangeText={(t) => {
                  setPromoCode(t);
                  setPromoError(null);
                }}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.promoApplyBtn,
                  pressed && { opacity: 0.8 }
                ]}
                onPress={handleApplyPromo}
              >
                <Text style={styles.promoApplyText}>Apply</Text>
              </Pressable>
            </View>
            {promoSuccess ? (
              <Text style={styles.promoSuccessText}>✓ {promoSuccess}</Text>
            ) : null}
            {promoError ? (
              <Text style={styles.promoErrorText}>{promoError}</Text>
            ) : null}
          </View>

          {/* PAYMENT METHOD SELECTION */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Payment Options</Text>

          {/* Payment Plan Mode: Full vs 60% Installments */}
          <View style={styles.planSelectionContainer}>
            <Pressable
              style={[
                styles.planOptionCard,
                paymentPlanType === "full" && styles.planOptionCardSelected
              ]}
              onPress={() => {
                AppHaptics.selection();
                setPaymentPlanType("full");
              }}
            >
              <View style={styles.planOptionHeader}>
                <Ionicons
                  name={paymentPlanType === "full" ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={paymentPlanType === "full" ? colors.brandAccent : colors.textSecondary}
                />
                <Text style={[styles.planOptionTitle, paymentPlanType === "full" && styles.planOptionTitleSelected]}>
                  Full Payment (100%)
                </Text>
              </View>
              <Text style={styles.planOptionSub}>Pay {formatGHS(totalGHS)} in full today</Text>
            </Pressable>

            <Pressable
              style={[
                styles.planOptionCard,
                paymentPlanType === "installment" && styles.planOptionCardSelected
              ]}
              onPress={() => {
                AppHaptics.selection();
                setPaymentPlanType("installment");
              }}
            >
              <View style={styles.planOptionHeader}>
                <Ionicons
                  name={paymentPlanType === "installment" ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={paymentPlanType === "installment" ? colors.brandAccent : colors.textSecondary}
                />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.planOptionTitle, paymentPlanType === "installment" && styles.planOptionTitleSelected]}>
                    Pay 60% Down Now
                  </Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>GHANA CARD NIA</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.planOptionSub}>
                Pay {formatGHS(downPaymentAmountGHS)} today, then choose weekly or monthly for remaining {formatGHS(remainingInstallmentGHS)}
              </Text>

              {installmentPlan && (
                <View style={styles.planReadyBox}>
                  <Ionicons name="checkmark-circle" size={15} color="#059669" />
                  <Text style={styles.planReadyText}>
                    Verified with NIA ({installmentPlan.ghanaCardNumber}) · {installmentPlan.frequency.toUpperCase()} schedule ready
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Payment Method (For Today's Amount)</Text>
          <View style={styles.pickupLocationsList}>
            {PAYMENT_METHODS.map((pm) => {
              const selected = paymentMethod === pm.id;
              return (
                <Pressable
                  key={pm.id}
                  style={[styles.pickupCard, selected && styles.pickupCardSelected]}
                  onPress={() => {
                    AppHaptics.selection();
                    setPaymentMethod(pm.id);
                  }}
                >
                  <View style={styles.pickupHeaderRow}>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={selected ? colors.brandRed : colors.textSecondary}
                    />
                    <Ionicons name={pm.icon} size={18} color={colors.text} />
                    <Text style={[styles.pickupName, selected && styles.pickupNameSelected]}>
                      {pm.name}
                    </Text>
                  </View>
                  <Text style={styles.pickupAddress}>{pm.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* 2. ORDER SUMMARY & FINAL REVIEW */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Order Review & Summary</Text>
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
                {getStoredImage(item.image) ? (
                  <Image
                    source={{ uri: getStoredImage(item.image)! }}
                    style={styles.productThumb}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.productThumbFallback}>
                    <ProductVisual glyphSize={20} />
                  </View>
                )}
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

            {discountAmount > 0 && (
              <View style={[styles.breakdownRow, { marginTop: 8 }]}>
                <Text style={[styles.breakdownLabel, { color: colors.accent, fontWeight: "600" }]}>
                  Discount ({appliedDiscount?.code})
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.accent, fontWeight: "600" }]}>
                  -{formatGHS(discountAmount)}
                </Text>
              </View>
            )}

            <View style={[styles.breakdownRow, { marginTop: 8 }]}>
              <View>
                <Text style={styles.breakdownLabel}>
                  {fulfillmentType === "pickup" ? "Store Pickup" : "Delivery"}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  {fulfillmentType === "pickup"
                    ? selectedPickupLocation.name
                    : region
                    ? deliveryQuote.isUber
                      ? "Uber Express"
                      : "Regional Courier / Bus"
                    : "Select region"}
                </Text>
              </View>
              <Text
                style={[
                  styles.breakdownValue,
                  fulfillmentType === "pickup"
                    ? { color: colors.brandRed, fontWeight: "700" }
                    : !region
                    ? styles.deliveryPrompt
                    : deliveryQuote.isTbd
                    ? { color: colors.accent, fontWeight: "600", fontSize: 13 }
                    : null
                ]}
              >
                {fulfillmentType === "pickup"
                  ? "Free"
                  : !region
                  ? "Select region"
                  : deliveryQuote.isTbd
                  ? "TBD (Pay on Delivery)"
                  : formatGHS(deliveryQuote.feeGHS)}
              </Text>
            </View>

            {fulfillmentType === "delivery" && region && deliveryQuote.isTbd && (
              <View style={styles.tbdNoticeContainer}>
                <Ionicons name="information-circle-outline" size={15} color={colors.accent} />
                <Text style={styles.tbdNoticeText}>
                  For {region}, delivery is handled via intercity courier. You pay ₵0.00 online for delivery; the fee is paid directly to the courier or bus terminal upon collection.
                </Text>
              </View>
            )}

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total Order Value</Text>
              <Text style={styles.totalValue}>{formatGHS(totalGHS)}</Text>
            </View>

            {paymentPlanType === "installment" && (
              <>
                <View style={[styles.breakdownRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }]}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.brandAccent }}>
                      Due Today (60% Down Payment)
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {installmentPlan ? `${installmentPlan.frequency.toUpperCase()} plan chosen` : "Application required"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.brandAccent }}>
                    {formatGHS(downPaymentAmountGHS)}
                  </Text>
                </View>

                <View style={[styles.breakdownRow, { marginTop: 6 }]}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Remaining 40% Balance
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                    {formatGHS(remainingInstallmentGHS)}
                  </Text>
                </View>
              </>
            )}
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
                {paymentPlanType === "installment" && !installmentPlan
                  ? "Apply for 60% Installments (NIA Verification)"
                  : paymentPlanType === "installment"
                  ? `Pay 60% Down (${formatGHS(downPaymentAmountGHS)})`
                  : `Pay ${formatGHS(totalGHS)} with Paystack`}
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
              const quote = getDeliveryQuote(item);
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
                    <Text
                      style={[
                        styles.regionItemFee,
                        quote.isTbd && { color: colors.accent, fontWeight: "600" }
                      ]}
                    >
                      {quote.isUber ? `Uber Express: ${formatGHS(quote.feeGHS)}` : "Pay on Delivery (TBD)"}
                    </Text>
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

      {/* Saved Address Selection Modal */}
      <Modal
        visible={showAddressPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <SafeAreaView style={styles.regionModalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.regionModalHeader}>
            <Text style={styles.regionModalTitle}>Choose Saved Address</Text>
            <Pressable
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => setShowAddressPicker(false)}
            >
              <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            data={addresses}
            keyExtractor={(_, idx) => `saved-addr-${idx}`}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => {
              const isSelected =
                item.fullName === fullName &&
                item.phone === phone &&
                item.region === region &&
                item.city === city;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.addressPickerItem,
                    isSelected && styles.addressPickerItemSelected,
                    pressed && { opacity: 0.8 }
                  ]}
                  onPress={() => handleSelectSavedAddress(item)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text style={styles.addressPickerName}>{item.fullName}</Text>
                      {item.isDefault && (
                        <View style={styles.addressPickerDefaultBadge}>
                          <Text style={styles.addressPickerDefaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressPickerSub}>{item.phone}</Text>
                    <Text style={styles.addressPickerSub}>
                      {item.city}, {item.region}
                    </Text>
                    {item.gpsAddress ? (
                      <Text style={styles.addressPickerSub}>GPS: {item.gpsAddress}</Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
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

      {/* 60% Installments Application & NIA Live Verification Modal */}
      <InstallmentApplicationModal
        visible={showInstallmentModal}
        orderTotalGHS={totalGHS}
        orderId={createdOrder?.id}
        defaultFullName={fullName}
        defaultPhone={phone}
        defaultEmail={email}
        onClose={() => setShowInstallmentModal(false)}
        onApplicationCompleted={(plan) => {
          setInstallmentPlan(plan);
          setShowInstallmentModal(false);
          // Automatically trigger the 60% down payment
          handleCheckout();
        }}
      />
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
  // Plan Selection Styles
  planSelectionContainer: {
    gap: 12,
    marginBottom: 20
  },
  planOptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14
  },
  planOptionCardSelected: {
    borderColor: colors.brandAccent,
    backgroundColor: "rgba(0,102,204,0.03)"
  },
  planOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4
  },
  planOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  planOptionTitleSelected: {
    color: colors.brandAccent
  },
  planOptionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 30,
    lineHeight: 16
  },
  planBadge: {
    backgroundColor: "#059669",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill
  },
  planBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  planReadyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(5,150,105,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
    marginLeft: 30
  },
  planReadyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669"
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
  productThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden"
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
    backgroundColor: "rgba(23, 23, 23, 0.05)"
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
  },
  laneContent: {
    padding: 20,
    paddingBottom: 48
  },
  laneTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text,
    marginTop: 12
  },
  laneSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 22
  },
  laneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12
  },
  laneCardPressed: {
    backgroundColor: colors.surface,
    transform: [{ scale: 0.99 }]
  },
  laneCopy: {
    flex: 1
  },
  laneCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  },
  laneCardBody: {
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 3
  },
  laneAssurance: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 4
  },
  laneAssuranceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textTertiary
  },
  guestBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 10
  },
  guestBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  guestBannerLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 5,
    marginLeft: 2
  },
  savedAddressCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  savedAddressInfo: {
    flex: 1,
    paddingRight: 10
  },
  savedAddressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4
  },
  savedAddressBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent
  },
  savedAddressName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  savedAddressDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  savedAddressSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  savedAddressSwitchText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent
  },
  promoContainer: {
    marginTop: 20,
    marginBottom: 8
  },
  promoHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8
  },
  promoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  promoInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    fontSize: 14,
    color: colors.text
  },
  promoApplyBtn: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  promoApplyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  promoSuccessText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
    marginTop: 6
  },
  promoErrorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4
  },
  addressPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "transparent"
  },
  addressPickerItemSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(23, 23, 23, 0.04)"
  },
  addressPickerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  },
  addressPickerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  fulfillmentSegment: {
    flexDirection: "row",
    backgroundColor: "#F2F3F7",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  fulfillmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 11
  },
  fulfillmentTabActive: {
    backgroundColor: colors.brandRed,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  fulfillmentTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  fulfillmentTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  pickupLocationsList: {
    gap: 10,
    marginBottom: 8
  },
  pickupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.06)"
  },
  pickupCardSelected: {
    borderColor: colors.brandRed,
    backgroundColor: "rgba(225, 29, 72, 0.02)"
  },
  pickupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  pickupName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0D0D12"
  },
  pickupNameSelected: {
    fontWeight: "700",
    color: colors.brandRed
  },
  pickupAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 28
  },
  pickupMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginLeft: 28
  },
  pickupReadyBadge: {
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  pickupReadyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#248A3D"
  },
  pickupHours: {
    fontSize: 11.5,
    color: colors.textTertiary
  },
  addressPickerDefaultBadge: {
    backgroundColor: "rgba(23, 23, 23, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 980
  },
  addressPickerDefaultText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent
  },
  tbdNoticeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(0, 113, 227, 0.06)",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 113, 227, 0.15)"
  },
  tbdNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.accent
  }
});
