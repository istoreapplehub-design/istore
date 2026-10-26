import React, { useMemo } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../constants/theme";
import { SUPPORT_WHATSAPP_URL } from "../constants/support";
import { useUserStore } from "../store/useUserStore";

export default function PickupPassScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLarge = width >= 860;
  const session = useUserStore((s) => s.session);
  const currentUser = useUserStore((s) => s.user);

  const params = useLocalSearchParams<{
    orderId?: string;
    customerName?: string;
    hubId?: string;
    items?: string;
  }>();

  const hasExplicitOrder = Boolean(params.orderId);
  const orderId = params.orderId || "";
  const customerName = params.customerName || currentUser?.name || "Valued Customer";

  const hubInfo = useMemo(() => {
    const hubs = {
      "lestrades-ucc-cape-coast": {
        name: "LESTRADES_UCC CAPE COAST",
        address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
        landmark: "Directly opposite UCC Central Library / Main Gate",
        gpsCode: "CC-041-9201",
        phone: "024 282 6590",
        hours: "Mon–Sat: 8:30 AM – 8:00 PM · Sun: 12:00 PM – 6:00 PM"
      }
    };
    return hubs["lestrades-ucc-cape-coast"];
  }, []);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `LesTrades Store Pickup Pass\nOrder: ${orderId}\nCustomer: ${customerName}\nPickup Hub: ${hubInfo.name}\nAddress: ${hubInfo.address} (${hubInfo.gpsCode})\nContact: ${hubInfo.phone}\nHours: ${hubInfo.hours}`;
    await Share.share({ message });
  };

  const handleOpenMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      hubInfo.name + " " + hubInfo.address
    )}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleCallHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${hubInfo.phone.replace(/\s+/g, "")}`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backBtnText}>Done</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Digital Pickup Pass</Text>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLarge && styles.scrollContentDesktop
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gate 1: User Not Logged In */}
        {!session && (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.gateCard}>
            <View style={styles.gateIconWrap}>
              <Ionicons name="lock-closed" size={36} color="#0066CC" />
            </View>
            <Text style={styles.gateTitle}>Sign In to Access Your Pickup Pass</Text>
            <Text style={styles.gateSubtitle}>
              Your digital Apple Wallet-style pickup pass is automatically linked to your verified LesTrades account and active store orders.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.gatePrimaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/(auth)/login?returnTo=pickup-pass" as any)}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
              <Text style={styles.gatePrimaryBtnText}>Sign In to LesTrades</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.gateSecondaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/(auth)/register?returnTo=pickup-pass" as any)}
            >
              <Text style={styles.gateSecondaryBtnText}>Create Account</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Gate 2: User Logged In But No Order Ready */}
        {session && !hasExplicitOrder && (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.gateCard}>
            <View style={[styles.gateIconWrap, { backgroundColor: "rgba(0, 102, 204, 0.08)" }]}>
              <Ionicons name="bag-check-outline" size={38} color="#0066CC" />
            </View>
            <Text style={styles.gateTitle}>No Orders Ready for Pickup</Text>
            <Text style={styles.gateSubtitle}>
              You do not have any orders awaiting pickup at LESTRADES_UCC CAPE COAST right now. When you choose Store Pickup at checkout, your barcode pass will appear here automatically.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.gatePrimaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/(tabs)/shop" as any)}
            >
              <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
              <Text style={styles.gatePrimaryBtnText}>Shop Apple Catalog</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.gateSecondaryBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push("/account" as any)}
            >
              <Text style={styles.gateSecondaryBtnText}>View My Account & Orders</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Active Ticket Pass: Only when logged in with order */}
        {session && hasExplicitOrder && (
          <>
            {/* Status Pill */}
            <View style={styles.statusBadge}>
              <Ionicons name="bag-check" size={16} color="#34C759" />
              <Text style={styles.statusBadgeText}>READY FOR CONTACTLESS STORE PICKUP</Text>
            </View>

            {/* Apple Wallet Style Ticket Pass */}
            <Animated.View entering={FadeInDown.duration(350)} style={styles.walletTicket}>
          {/* Top Notch Brand Header */}
          <View style={styles.ticketTopBar}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoI}>L</Text>
                <View style={styles.logoDot} />
                <Text style={styles.logoD}>T</Text>
              </View>
              <Text style={styles.walletBrandText}>LESTRADES STORE PICKUP PASS</Text>
            </View>
            <Text style={styles.orderNumberText}>{orderId}</Text>
          </View>

          {/* Ticket Body Details */}
          <View style={styles.ticketBody}>
            <View style={styles.fieldGrid}>
              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>CUSTOMER NAME</Text>
                <Text style={styles.fieldValue}>{customerName}</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>STATUS</Text>
                <Text style={[styles.fieldValue, { color: "#34C759" }]}>Verified Ready</Text>
              </View>
            </View>

            <View style={styles.ticketDivider} />

            <View style={styles.hubDetailsBlock}>
              <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
              <Text style={styles.hubTitle}>{hubInfo.name}</Text>
              <Text style={styles.hubAddress}>{hubInfo.address}</Text>
              <View style={styles.gpsRow}>
                <Ionicons name="navigate-circle-outline" size={14} color="#0066CC" />
                <Text style={styles.gpsCode}>GhanaPost GPS: {hubInfo.gpsCode}</Text>
              </View>
              <Text style={styles.hubHours}>🕒 {hubInfo.hours}</Text>
            </View>

            <View style={styles.ticketDivider} />

            {/* Barcode & QR Code Section */}
            <View style={styles.codeContainer}>
              {/* Simulated Code128 Barcode Bars */}
              <View style={styles.barcodeLines}>
                {[...Array(38)].map((_, idx) => {
                  const width = idx % 3 === 0 ? 3 : idx % 5 === 0 ? 4 : 1.5;
                  const opacity = idx % 7 === 0 ? 0.35 : 1;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.barcodeBar,
                        { width, opacity, backgroundColor: "#FFFFFF" }
                      ]}
                    />
                  );
                })}
              </View>

              <Text style={styles.barcodeCaption}>{orderId}</Text>

              {/* QR Code Graphic */}
              <View style={styles.qrBox}>
                <Ionicons name="qr-code" size={110} color="#FFFFFF" />
              </View>

              <Text style={styles.scanInstruction}>
                Present this barcode or QR to an Apple Store Specialist upon arrival at the Hub.
              </Text>
            </View>
          </View>

          {/* Perforated Edge Bottom Notch */}
          <View style={styles.ticketPerforation}>
            <View style={styles.notchLeft} />
            <View style={styles.perforatedDottedLine} />
            <View style={styles.notchRight} />
          </View>

          {/* Ticket Bottom Security Stamp */}
          <View style={styles.ticketBottom}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.securityStampText}>
              SECURE VERIFICATION CODE · LESTRADES GHANA
            </Text>
          </View>
        </Animated.View>

        {/* Quick Hub Navigation & Actions */}
        <View style={styles.actionButtonGroup}>
          <Pressable
            onPress={handleOpenMaps}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="map-outline" size={20} color={colors.text} />
            <Text style={styles.actionButtonText}>Get Directions to Hub</Text>
          </Pressable>

          <Pressable
            onPress={handleCallHub}
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="call-outline" size={20} color={colors.text} />
            <Text style={styles.actionButtonText}>Call Store Specialist ({hubInfo.phone})</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {});
            }}
            style={({ pressed }) => [
              styles.actionButton,
              styles.whatsappAction,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsappActionText}>Forward Pass to WhatsApp</Text>
          </Pressable>
        </View>

        {/* Pickup Guidelines */}
        <View style={styles.guidelinesBox}>
          <Text style={styles.guidelinesHeading}>What to Bring for Pickup:</Text>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0066CC" />
            <Text style={styles.guidelineText}>
              A valid government ID (Ghana Card, Passport, or Driver's License)
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0066CC" />
            <Text style={styles.guidelineText}>
              This digital pass or your Order Confirmation SMS/Email
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0066CC" />
            <Text style={styles.guidelineText}>
              Designating someone else? Forward this pass to their WhatsApp.
            </Text>
          </View>
        </View>
      </>
    )}
  </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  backBtnText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.fontFamily.medium
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  shareBtn: {
    padding: 4
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  scrollContentDesktop: {
    maxWidth: 620,
    alignSelf: "center",
    width: "100%"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: 20,
    marginBottom: 16
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: "#34C759",
    letterSpacing: 0.5
  },
  walletTicket: {
    backgroundColor: "#1D1D1F",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    position: "relative",
    overflow: "hidden"
  },
  ticketTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingBottom: 14
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  logoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 2
  },
  logoI: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },
  logoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#0066CC"
  },
  logoD: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800"
  },
  walletBrandText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5
  },
  orderNumberText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  ticketBody: {
    paddingVertical: 18
  },
  fieldGrid: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  fieldItem: {},
  fieldLabel: {
    fontSize: 9.5,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.8
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    marginTop: 3
  },
  ticketDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    marginVertical: 16
  },
  hubDetailsBlock: {},
  hubTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    marginTop: 4
  },
  hubAddress: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6
  },
  gpsCode: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: "#0066CC"
  },
  hubHours: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.65)",
    marginTop: 4
  },
  codeContainer: {
    alignItems: "center",
    paddingTop: 10
  },
  barcodeLines: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    gap: 2.5
  },
  barcodeBar: {
    height: "100%",
    borderRadius: 1
  },
  barcodeCaption: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 14
  },
  qrBox: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  scanInstruction: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 15,
    maxWidth: 280
  },
  ticketPerforation: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -22,
    height: 24,
    overflow: "hidden"
  },
  notchLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginLeft: -12
  },
  perforatedDottedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed"
  },
  notchRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginRight: -12
  },
  ticketBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 10
  },
  securityStampText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.5
  },
  actionButtonGroup: {
    gap: 10,
    marginTop: 24
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  whatsappAction: {
    backgroundColor: "#25D366",
    borderColor: "#25D366"
  },
  whatsappActionText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  guidelinesBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  guidelinesHeading: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 10
  },
  guidelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  guidelineText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 17
  },
  gateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 28,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    textAlign: "center"
  },
  gateIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  gateTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8
  },
  gateSubtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8
  },
  gatePrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 48,
    backgroundColor: "#0066CC",
    borderRadius: radius.md,
    marginBottom: 10
  },
  gatePrimaryBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  gateSecondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 44,
    backgroundColor: "transparent",
    borderRadius: radius.md
  },
  gateSecondaryBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary
  }
});
