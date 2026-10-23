import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius } from "../constants/theme";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "../constants/support";

const COVERAGE_ITEMS = [
  {
    icon: "barcode-outline" as const,
    title: "Serial Number Authenticity Guarantee",
    body: "Every device arrives factory-sealed with an official Apple serial number that can be verified directly on checkcoverage.apple.com upon unboxing."
  },
  {
    icon: "build-outline" as const,
    title: "Authorized Diagnostics & Repair",
    body: "Hardware defects, battery service, and factory component issues are serviced using genuine Apple parts through authorized service partners."
  },
  {
    icon: "sync-outline" as const,
    title: "Priority Replacement for DOA Units",
    body: "If a sealed device exhibits a verified factory defect within 7 days of delivery, LesTrades provides an expedited unit replacement."
  }
];

export default function WarrantyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroEyebrow}>THE LESTRADES PROTECTION PROMISE</Text>
          <Text style={styles.heroTitle}>Official Warranty & Authenticity Coverage</Text>
          <Text style={styles.heroBody}>
            Every product sold by LesTrades is sourced through official distribution channels and backed by comprehensive hardware protection.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What Is Covered</Text>
        <View style={styles.cardsStack}>
          {COVERAGE_ITEMS.map((item) => (
            <View key={item.title} style={styles.coverageCard}>
              <View style={styles.coverageIconCircle}>
                <Ionicons name={item.icon} size={20} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coverageTitle}>{item.title}</Text>
                <Text style={styles.coverageBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>How to Verify Your Device</Text>
        <View style={styles.stepsCard}>
          {[
            "Open Settings → General → About on your iPhone or iPad (or System Settings → General → About on Mac).",
            "Copy your device Serial Number from the About screen or original retail box.",
            "Visit checkcoverage.apple.com to view your active warranty status and coverage expiration date."
          ].map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}

          <Pressable
            style={styles.verifyBtn}
            onPress={() => {
              Haptics.selectionAsync();
              Linking.openURL("https://checkcoverage.apple.com").catch(() => {});
            }}
          >
            <Text style={styles.verifyBtnText}>Verify Serial on Apple.com</Text>
            <Ionicons name="open-outline" size={16} color={colors.brandAccent} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Need Warranty Support?</Text>
        <View style={styles.supportCard}>
          <Text style={styles.supportText}>
            Have your LesTrades order number and device serial number ready. Our technical specialists will guide you through diagnostics or service intake.
          </Text>
          <View style={styles.supportActions}>
            <Pressable
              style={styles.primaryAction}
              onPress={() => {
                Haptics.selectionAsync();
                Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {});
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Chat with Warranty Specialist</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryAction}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/returns" as never);
              }}
            >
              <Text style={styles.secondaryActionText}>
                Request a Return or Replacement ({SUPPORT_PHONE_DISPLAY})
              </Text>
            </Pressable>
          </View>
        </View>
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
  heroCard: {
    backgroundColor: colors.text,
    borderRadius: 24,
    padding: 22
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.7)"
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 4
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.78)",
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
    marginTop: 26,
    marginBottom: 12
  },
  cardsStack: {
    gap: 12
  },
  coverageCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  coverageIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  coverageTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: colors.text
  },
  coverageBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 4
  },
  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brandAccent
  },
  supportCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  supportText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  },
  supportActions: {
    marginTop: 16,
    gap: 10
  },
  primaryAction: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  secondaryAction: {
    paddingVertical: 10,
    alignItems: "center"
  },
  secondaryActionText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.brandAccent
  }
});
