/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on FAQ toggle and contact rows
 */
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../constants/theme";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  SUPPORT_WHATSAPP_URL
} from "../constants/support";

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "How long does delivery take?",
    a: "Orders confirmed before 12:00pm are dispatched the same working day within Greater Accra. Delivery takes 1–2 working days in Accra and Tema, and 2–4 working days for other regions."
  },
  {
    q: "How do I pay?",
    a: "We accept Mobile Money (MTN, Telecel and AirtelTigo) and Visa/Mastercard cards through Paystack. Payment is captured securely at checkout before your order is confirmed."
  },
  {
    q: "Can I track my order?",
    a: "Yes. Sign in and open My Orders from the Account screen to see live status: Pending, Paid, Shipped or Delivered. You will also see each status change in your Notifications. Guest orders are not tracked in the app — keep your order number and contact support."
  },
  {
    q: "Can I cancel my order?",
    a: "Orders can be cancelled while they are still Pending or Paid from the order detail page. Once an order is Shipped, contact support and we will arrange a return."
  },
  {
    q: "What is your return policy?",
    a: "Unopened devices can be returned within 7 days of delivery with proof of purchase for a refund to your original payment method. Faulty devices are covered by manufacturer warranty — we help you process the claim."
  },
  {
    q: "Are the products genuine?",
    a: "Every device sold on LesTrades is genuine, new and sealed, sourced through authorized distribution channels with full manufacturer warranty valid in Ghana."
  },
  {
    q: "Which regions do you deliver to?",
    a: "We deliver to all 16 regions of Ghana. A delivery fee applies per region and is shown at checkout before you pay."
  }
];

export default function HelpScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const openChannel = async (url: string, label: string) => {
    Haptics.selectionAsync();
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("unsupported");
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        label,
        url.startsWith("mailto")
          ? `No email app is set up on this device. Write to us at ${url.replace("mailto:", "")}.`
          : `We could not open this link. You can reach us at ${SUPPORT_PHONE_DISPLAY}.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageHeader}>
          <Text style={typography.bodySmall}>
            Answers, order tools, warranty coverage, and ways to reach the LesTrades team.
          </Text>
        </View>

        {/* ORDER TOOLS */}
        <Text style={styles.sectionLabel}>MY ORDERS & WARRANTY</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/orders");
            }}
          >
            <Ionicons name="cube-outline" size={20} color={colors.accent} />
            <Text style={styles.menuLabel}>Track an order</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/warranty" as any);
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            <Text style={styles.menuLabel}>Warranty coverage & serial check</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/returns" as any);
            }}
          >
            <Ionicons name="refresh-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.menuLabel}>Returns & refunds request</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/addresses");
            }}
          >
            <Ionicons name="location-outline" size={20} color={colors.accent} />
            <Text style={styles.menuLabel}>Update a delivery address</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED</Text>
        <View style={styles.faqContainer}>
          {FAQS.map((faq, idx) => {
            const open = openIndex === idx;
            return (
              <View key={faq.q}>
                {idx > 0 && <View style={styles.dividerFull} />}
                <Pressable
                  style={({ pressed }) => [styles.faqRow, pressed && styles.rowPressed]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setOpenIndex(open ? null : idx);
                  }}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
                {open && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </View>
            );
          })}
        </View>

        {/* CONTACT */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => openChannel(SUPPORT_WHATSAPP_URL, "WhatsApp")}
          >
            <Ionicons name="logo-whatsapp" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>WhatsApp chat</Text>
              <Text style={styles.menuSub}>Fastest response, 8am–8pm daily</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => openChannel(SUPPORT_PHONE_TEL, "Call")}
          >
            <Ionicons name="call-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Call support</Text>
              <Text style={styles.menuSub}>{SUPPORT_PHONE_DISPLAY}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => openChannel(`mailto:${SUPPORT_EMAIL}`, "Email")}
          >
            <Ionicons name="mail-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Email</Text>
              <Text style={styles.menuSub}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.footnote}>
          UCC Campus, Cape Coast support team · Mon–Sat 8am–8pm, Sun 12pm–6pm (GMT)
        </Text>
      </ScrollView>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginLeft: 12,
    marginBottom: 8,
    marginTop: 24
  },
  groupContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12
  },
  rowPressed: {
    backgroundColor: colors.surface
  },
  menuLabel: {
    fontSize: 15,
    color: colors.text
  },
  menuSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 48
  },
  dividerFull: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16
  },
  faqContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  faqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 15
  },
  footnote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: 28
  }
});
