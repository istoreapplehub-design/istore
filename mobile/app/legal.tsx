/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on segmented control
 */
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../constants/theme";
import { SUPPORT_EMAIL } from "../constants/support";

interface Section {
  heading: string;
  paras: string[];
}

const TERMS: Section[] = [
  {
    heading: "1. About I-Store",
    paras: [
      "I-Store is an online retailer of genuine Apple devices and accessories serving customers in Ghana. By placing an order through this app you agree to these Terms of Service.",
      "Product images, specifications and prices shown in the app are for identification purposes. Colour, storage and bundle availability may change without notice."
    ]
  },
  {
    heading: "2. Orders & Payment",
    paras: [
      "An order is confirmed only after payment is successfully captured. We accept Mobile Money (MTN, Telecel, AirtelTigo) and Visa/Mastercard cards processed securely by Paystack.",
      "All prices are quoted in Ghana Cedis (GHS) and include applicable VAT. A delivery fee based on your region is shown at checkout before payment.",
      "We may cancel an order and refund in full if a product is found to be unavailable, mispriced, or if payment cannot be verified."
    ]
  },
  {
    heading: "3. Delivery",
    paras: [
      "We deliver to all 16 regions of Ghana. Estimated times are 1–2 working days within Greater Accra and Tema, and 2–4 working days elsewhere.",
      "Delivery estimates assume a reachable address with a valid GPS address or landmark. You may be contacted by our dispatch team to confirm the drop-off point.",
      "Risk in the goods passes to you once delivery is accepted at your stated address."
    ]
  },
  {
    heading: "4. Cancellations & Returns",
    paras: [
      "You may cancel a Pending or Paid order from the order detail screen in the app. Once an order is Shipped, contact support to arrange a return.",
      "Unopened items may be returned within 7 days of delivery with proof of purchase for a refund to your original payment method. Refunds are processed within 5–10 working days, subject to your payment provider.",
      "All devices carry the manufacturer's warranty valid in Ghana. For faults, contact support and we will help you process a warranty claim."
    ]
  },
  {
    heading: "5. Your Account",
    paras: [
      "You are responsible for keeping your login credentials secure and for all activity under your account. Notify us immediately at " + SUPPORT_EMAIL + " if you believe your account has been accessed without permission."
    ]
  },
  {
    heading: "6. Changes to these Terms",
    paras: [
      "We may update these Terms from time to time. The version shown in the app is the one in effect when you order. Continued use of the app after changes constitutes acceptance."
    ]
  }
];

const PRIVACY: Section[] = [
  {
    heading: "1. What we collect",
    paras: [
      "Account information: your name, phone number and email address.",
      "Order information: delivery addresses, order contents, payment references and notes.",
      "Usage information: basic app diagnostics needed to keep I-Store running reliably."
    ]
  },
  {
    heading: "2. How we use it",
    paras: [
      "To process and deliver your orders, communicate order updates, provide customer support, and meet our legal and tax obligations in Ghana.",
      "We do not sell your personal data and do not use it for advertising."
    ]
  },
  {
    heading: "3. Payment data",
    paras: [
      "Card and Mobile Money payments are handled entirely by Paystack. I-Store never sees or stores your card details or Mobile Money credentials; we only keep the payment reference needed for receipts and refunds."
    ]
  },
  {
    heading: "4. Who we share with",
    paras: [
      "Trusted service providers, strictly for what they need to do their job: Paystack (payments), Supabase (hosting and authentication), and our delivery partners (your name, phone and drop-off address)."
    ]
  },
  {
    heading: "5. Your rights",
    paras: [
      "Under Ghana's Data Protection Act, 2012 (Act 843) you may access, correct or request deletion of your personal data. You can update your name, phone and addresses directly in the app; for anything else, email " + SUPPORT_EMAIL + ".",
      "We keep order records for as long as required for tax and warranty purposes."
    ]
  },
  {
    heading: "6. Data protection contact",
    paras: [
      "Questions about this policy or your data: " + SUPPORT_EMAIL + ". Our office is in Accra, Ghana."
    ]
  }
];

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [active, setActive] = useState<"terms" | "privacy">(
    type === "privacy" ? "privacy" : "terms"
  );

  const sections = active === "terms" ? TERMS : PRIVACY;

  const switchTo = (next: "terms" | "privacy") => {
    Haptics.selectionAsync();
    setActive(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentBtn, active === "terms" && styles.segmentActive]}
            onPress={() => switchTo("terms")}
          >
            <Text
              style={[styles.segmentText, active === "terms" && styles.segmentTextActive]}
            >
              Terms of Service
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, active === "privacy" && styles.segmentActive]}
            onPress={() => switchTo("privacy")}
          >
            <Text
              style={[
                styles.segmentText,
                active === "privacy" && styles.segmentTextActive
              ]}
            >
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{s.heading}</Text>
            {s.paras.map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>
        ))}
        <Text style={styles.updated}>Last updated: October 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  segmentActive: {
    backgroundColor: colors.accent
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48
  },
  section: {
    marginBottom: 24
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8
  },
  updated: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8
  }
});
