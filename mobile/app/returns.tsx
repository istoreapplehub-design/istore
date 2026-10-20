import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius } from "../constants/theme";

const RETURN_REASONS = [
  "Unopened item — Changed mind (within 7 days)",
  "Wrong model, finish, or storage received",
  "Verified hardware defect out of the box",
  "Damaged shipping package upon arrival"
];

export default function ReturnsAndRefundsScreen() {
  const router = useRouter();
  const { orderId: initialOrderId } = useLocalSearchParams<{ orderId?: string }>();

  const [orderNumber, setOrderNumber] = useState(initialOrderId || "");
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmitReturn = () => {
    if (!orderNumber.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Order Number Required", "Please enter your order number (e.g. #8F3A21C0).");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const refCode = `RET-${orderNumber.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "IDYN"}`;
    setSubmittedRef(refCode);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>I-DYNAMIC ASSURANCE</Text>
          <Text style={styles.title}>Returns & Refunds</Text>
          <Text style={styles.subtitle}>
            Simple, transparent return eligibility and refund tracking for your peace of mind.
          </Text>
        </View>

        {/* Eligibility Summary */}
        <View style={styles.policyCard}>
          <Text style={styles.cardHeading}>Return Eligibility Policy</Text>
          {[
            {
              icon: "calendar-outline" as const,
              title: "7-Day Return Window",
              desc: "Eligible items can be requested for return within 7 calendar days of delivery."
            },
            {
              icon: "cube-outline" as const,
              title: "Original Sealed Condition",
              desc: "Change-of-mind returns must remain factory-sealed in original Apple packaging."
            },
            {
              icon: "card-outline" as const,
              title: "Fast Refund Processing",
              desc: "Approved refunds are credited back to your Mobile Money wallet or card within 3–5 business days."
            }
          ].map((row) => (
            <View key={row.title} style={styles.policyRow}>
              <View style={styles.policyIcon}>
                <Ionicons name={row.icon} size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyRowTitle}>{row.title}</Text>
                <Text style={styles.policyRowDesc}>{row.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Request Form or Confirmation */}
        {submittedRef ? (
          <View style={styles.confirmationCard}>
            <View style={styles.confirmBadge}>
              <Ionicons name="checkmark" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.confirmTitle}>Return Request Received</Text>
            <Text style={styles.confirmRef}>Reference: {submittedRef}</Text>
            <Text style={styles.confirmBody}>
              Our specialist team has logged your return request for order {orderNumber}. We will contact you within 4 business hours to schedule courier pickup or showroom drop-off.
            </Text>

            <View style={styles.statusTracker}>
              <View style={styles.statusStep}>
                <View style={[styles.statusDot, styles.statusDotActive]} />
                <Text style={styles.statusStepTextActive}>Request Logged</Text>
              </View>
              <View style={styles.statusLine} />
              <View style={styles.statusStep}>
                <View style={styles.statusDot} />
                <Text style={styles.statusStepText}>Inspection</Text>
              </View>
              <View style={styles.statusLine} />
              <View style={styles.statusStep}>
                <View style={styles.statusDot} />
                <Text style={styles.statusStepText}>Refund Issued</Text>
              </View>
            </View>

            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                setSubmittedRef(null);
                router.push("/orders");
              }}
            >
              <Text style={styles.doneBtnText}>View My Orders</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>Start a Return Request</Text>

            <Text style={styles.label}>Order Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. #26F2856C"
              placeholderTextColor={colors.textTertiary}
              value={orderNumber}
              onChangeText={setOrderNumber}
              autoCapitalize="characters"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Reason for Return *</Text>
            <View style={styles.reasonsList}>
              {RETURN_REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    style={[styles.reasonOption, active && styles.reasonOptionActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedReason(reason);
                    }}
                  >
                    <Ionicons
                      name={active ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={active ? colors.text : colors.textTertiary}
                    />
                    <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the condition of the package or any serial details..."
              placeholderTextColor={colors.textTertiary}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={3}
            />

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }
              ]}
              onPress={handleSubmitReturn}
            >
              <Text style={styles.submitBtnText}>Submit Return Request</Text>
            </Pressable>
          </View>
        )}
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
  headerBlock: {
    marginBottom: 18
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.brandAccent
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.text,
    marginTop: 4
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 4
  },
  policyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    marginBottom: 20
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  policyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  policyRowTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: colors.text
  },
  policyRowDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  label: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: "top"
  },
  reasonsList: {
    gap: 8
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  reasonOptionActive: {
    borderColor: colors.text,
    backgroundColor: "#FFFFFF"
  },
  reasonText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textSecondary
  },
  reasonTextActive: {
    color: colors.text,
    fontWeight: "600"
  },
  submitBtn: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },
  submitBtnText: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  confirmationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center"
  },
  confirmBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  confirmRef: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brandAccent,
    marginTop: 4
  },
  confirmBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 10
  },
  statusTracker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 14
  },
  statusStep: {
    alignItems: "center",
    gap: 4
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border
  },
  statusDotActive: {
    backgroundColor: colors.text
  },
  statusLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.border,
    marginHorizontal: 6
  },
  statusStepTextActive: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text
  },
  statusStepText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  doneBtn: {
    width: "100%",
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
