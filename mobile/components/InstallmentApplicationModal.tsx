import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, formatGHS } from "../constants/theme";
import { AppHaptics } from "../lib/haptics";
import {
  verifyNiaGhanaCard,
  calculateInstallmentBreakdown,
  applyInstallmentPlan
} from "../services/api";

interface InstallmentApplicationModalProps {
  visible: boolean;
  orderTotalGHS: number;
  orderId?: string | null;
  defaultFullName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  onClose: () => void;
  onApplicationCompleted: (plan: any) => void;
}

export function InstallmentApplicationModal({
  visible,
  orderTotalGHS,
  orderId,
  defaultFullName = "",
  defaultPhone = "",
  defaultEmail = "",
  onClose,
  onApplicationCompleted
}: InstallmentApplicationModalProps) {
  // Step state: 1 = NIA Verification, 2 = Plan & Schedule, 3 = Personal & Guarantor Details
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [dob, setDob] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [gpsAddress, setGpsAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employer, setEmployer] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Calculation state
  const [calculating, setCalculating] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Format Ghana card input automatically
  const handleGhanaCardChange = (text: string) => {
    let clean = text.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!clean.startsWith("GHA-") && clean.length > 0) {
      if ("GHA".startsWith(clean)) {
        // user typing GHA
      } else {
        clean = "GHA-" + clean.replace(/^GHA-?/, "");
      }
    }
    setNationalId(clean);
    if (verificationError) setVerificationError(null);
  };

  // Recalculate schedule whenever frequency changes
  useEffect(() => {
    if (orderTotalGHS > 0) {
      calculateBreakdown();
    }
  }, [frequency, orderTotalGHS]);

  const calculateBreakdown = async () => {
    setCalculating(true);
    try {
      const res = await calculateInstallmentBreakdown({
        totalAmountGHS: orderTotalGHS,
        frequency
      });
      if (res.success) {
        setBreakdown(res.data);
      }
    } catch (e) {
      // Offline fallback calculation
      const downPaymentGHS = Math.round(orderTotalGHS * 0.6 * 100) / 100;
      const remainingGHS = Math.round((orderTotalGHS - downPaymentGHS) * 100) / 100;
      const count = frequency === "weekly" ? 4 : 2;
      setBreakdown({
        totalAmountGHS: orderTotalGHS,
        downPaymentPercent: 60,
        downPaymentGHS,
        remainingGHS,
        frequency,
        totalInstallments: count,
        installmentAmountGHS: Math.round((remainingGHS / count) * 100) / 100
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleVerifyNIA = async () => {
    const cleanId = nationalId.trim().toUpperCase();
    if (!cleanId || cleanId.length < 10) {
      setVerificationError("Please enter a valid Ghana Card number (e.g. GHA-722145892-1)");
      return;
    }
    if (!fullName.trim()) {
      setVerificationError("Please enter your full legal name as it appears on your Ghana Card");
      return;
    }

    setVerifying(true);
    setVerificationError(null);
    AppHaptics.selection();

    try {
      const res = await verifyNiaGhanaCard({
        nationalId: cleanId,
        fullName: fullName.trim(),
        dob: dob.trim() || undefined,
        phone: phone.trim() || undefined
      });

      if (res.success) {
        AppHaptics.success();
        setVerificationResult(res.data);
        setStep(2);
      } else {
        setVerificationError(res.message || "Ghana Card verification failed. Please verify details.");
      }
    } catch (err: any) {
      setVerificationError(err.message || "Unable to reach NIA verification servers. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCompleteApplication = async () => {
    if (!orderId) {
      Alert.alert("Order missing", "Please ensure your order is created before applying for an installment plan.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Missing details", "Please provide a valid contact phone number.");
      return;
    }

    setSubmitting(true);
    AppHaptics.impactMedium();

    try {
      const res = await applyInstallmentPlan({
        orderId,
        nationalId: verificationResult?.nationalId || nationalId.trim().toUpperCase(),
        fullName: verificationResult?.fullName || fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        frequency,
        gpsAddress: gpsAddress.trim() || undefined,
        occupation: occupation.trim() || undefined,
        employer: employer.trim() || undefined,
        nextOfKinName: nextOfKinName.trim() || undefined,
        nextOfKinPhone: nextOfKinPhone.trim() || undefined
      });

      if (res.success && res.data) {
        AppHaptics.success();
        onApplicationCompleted(res.data);
      } else {
        Alert.alert("Application Error", res.message || "Failed to create installment plan.");
      }
    } catch (err: any) {
      Alert.alert("Application Failed", err.message || "Error submitting installment plan.");
    } finally {
      setSubmitting(false);
    }
  };

  const downPayment = breakdown?.downPaymentGHS || orderTotalGHS * 0.6;
  const remaining = breakdown?.remainingGHS || orderTotalGHS * 0.4;
  const perInstallment = breakdown?.installmentAmountGHS || 0;
  const totalPeriods = breakdown?.totalInstallments || (frequency === "weekly" ? 4 : 2);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.badge60}>
                <Text style={styles.badge60Text}>60% DOWN</Text>
              </View>
              <Text style={styles.headerTitle}>I-Dynamic Installments</Text>
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Stepper indicator */}
          <View style={styles.stepperBar}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= 1 && styles.stepNumActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= 2 && styles.stepNumActive]}>2</Text>
            </View>
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= 3 && styles.stepNumActive]}>3</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* ─── STEP 1: NIA GHANA CARD VERIFICATION ─── */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.niaBanner}>
                  <Ionicons name="shield-checkmark" size={26} color="#0066CC" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.niaBannerTitle}>National ID Verification</Text>
                    <Text style={styles.niaBannerSubtitle}>
                      Powered by National Identification Authority (NIA) live identity verification.
                    </Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>GHANA CARD NUMBER (PIN) *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="card-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. GHA-722145892-1"
                      placeholderTextColor={colors.textTertiary}
                      value={nationalId}
                      onChangeText={handleGhanaCardChange}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL LEGAL NAME *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="Name as printed on Ghana Card"
                      placeholderTextColor={colors.textTertiary}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DATE OF BIRTH (OPTIONAL)</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>
                </View>

                {verificationError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{verificationError}</Text>
                  </View>
                )}

                <Pressable
                  disabled={verifying}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    verifying && { opacity: 0.6 },
                    pressed && { opacity: 0.88 }
                  ]}
                  onPress={handleVerifyNIA}
                >
                  {verifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>Verify with NIA</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* ─── STEP 2: CHOOSE FREQUENCY & SCHEDULE ─── */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                {/* Verified badge */}
                <View style={styles.verifiedCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#059669" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.verifiedName}>{verificationResult?.fullName || fullName}</Text>
                    <Text style={styles.verifiedCardNo}>{verificationResult?.nationalId || nationalId}</Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>VERIFIED</Text>
                  </View>
                </View>

                {/* Plan Highlights */}
                <View style={styles.planHighlightsCard}>
                  <View style={styles.planHighlightRow}>
                    <Text style={styles.planHighlightLabel}>Device Order Total</Text>
                    <Text style={styles.planHighlightVal}>{formatGHS(orderTotalGHS)}</Text>
                  </View>
                  <View style={styles.planDivider} />
                  <View style={styles.planHighlightRow}>
                    <View>
                      <Text style={styles.planHighlightLabelBold}>60% Initial Down Payment</Text>
                      <Text style={styles.planHighlightSub}>Due immediately to dispatch device</Text>
                    </View>
                    <Text style={styles.downPaymentBigText}>{formatGHS(downPayment)}</Text>
                  </View>
                  <View style={styles.planDivider} />
                  <View style={styles.planHighlightRow}>
                    <Text style={styles.planHighlightLabel}>Remaining Balance (40%)</Text>
                    <Text style={styles.remainingValText}>{formatGHS(remaining)}</Text>
                  </View>
                </View>

                {/* Choose Repayment Frequency */}
                <Text style={styles.sectionHeading}>Choose Repayment Schedule</Text>
                <View style={styles.freqRow}>
                  <Pressable
                    style={[styles.freqCard, frequency === "weekly" && styles.freqCardActive]}
                    onPress={() => {
                      AppHaptics.selection();
                      setFrequency("weekly");
                    }}
                  >
                    <View style={styles.freqTop}>
                      <Ionicons
                        name="repeat"
                        size={18}
                        color={frequency === "weekly" ? colors.brandAccent : colors.textSecondary}
                      />
                      <Text style={[styles.freqTitle, frequency === "weekly" && styles.freqTitleActive]}>
                        Weekly
                      </Text>
                    </View>
                    <Text style={styles.freqPerAmt}>
                      {formatGHS(Math.round(remaining / 4))} <Text style={styles.freqSub}>/ week</Text>
                    </Text>
                    <Text style={styles.freqDuration}>4 equal installments</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.freqCard, frequency === "monthly" && styles.freqCardActive]}
                    onPress={() => {
                      AppHaptics.selection();
                      setFrequency("monthly");
                    }}
                  >
                    <View style={styles.freqTop}>
                      <Ionicons
                        name="calendar"
                        size={18}
                        color={frequency === "monthly" ? colors.brandAccent : colors.textSecondary}
                      />
                      <Text style={[styles.freqTitle, frequency === "monthly" && styles.freqTitleActive]}>
                        Monthly
                      </Text>
                    </View>
                    <Text style={styles.freqPerAmt}>
                      {formatGHS(Math.round(remaining / 2))} <Text style={styles.freqSub}>/ month</Text>
                    </Text>
                    <Text style={styles.freqDuration}>2 equal installments</Text>
                  </Pressable>
                </View>

                {/* Breakdown List */}
                <View style={styles.scheduleBox}>
                  <Text style={styles.scheduleTitle}>Payment Milestone Dates</Text>
                  <View style={styles.milestoneRow}>
                    <View style={styles.milestoneDotActive} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.milestoneName}>Today · Down Payment (60%)</Text>
                      <Text style={styles.milestoneSub}>MoMo or Card via Paystack</Text>
                    </View>
                    <Text style={styles.milestoneAmt}>{formatGHS(downPayment)}</Text>
                  </View>

                  {frequency === "weekly" ? (
                    <>
                      <View style={styles.milestoneRow}>
                        <View style={styles.milestoneDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.milestoneName}>Week 1 · Installment 1</Text>
                        </View>
                        <Text style={styles.milestoneAmt}>{formatGHS(Math.round(remaining / 4))}</Text>
                      </View>
                      <View style={styles.milestoneRow}>
                        <View style={styles.milestoneDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.milestoneName}>Week 2 · Installment 2</Text>
                        </View>
                        <Text style={styles.milestoneAmt}>{formatGHS(Math.round(remaining / 4))}</Text>
                      </View>
                      <View style={styles.milestoneRow}>
                        <View style={styles.milestoneDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.milestoneName}>Week 3 · Installment 3</Text>
                        </View>
                        <Text style={styles.milestoneAmt}>{formatGHS(Math.round(remaining / 4))}</Text>
                      </View>
                      <View style={styles.milestoneRow}>
                        <View style={styles.milestoneDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.milestoneName}>Week 4 · Installment 4 (Final)</Text>
                        </View>
                        <Text style={styles.milestoneAmt}>{formatGHS(Math.round(remaining / 4))}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.milestoneRow}>
                        <View style={styles.milestoneDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.milestoneName}>Month 1 · Installment 1</Text>
                        </View>
                        <Text style={styles.milestoneAmt}>{formatGHS(Math.round(remaining / 2))}</Text>
                      </View>
                      <View style={styles.milestoneRow}>
                        <View style={styles.milestoneDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.milestoneName}>Month 2 · Installment 2 (Final)</Text>
                        </View>
                        <Text style={styles.milestoneAmt}>{formatGHS(Math.round(remaining / 2))}</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.btnRow}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryActionBtnFlex}
                    onPress={() => {
                      AppHaptics.selection();
                      setStep(3);
                    }}
                  >
                    <Text style={styles.primaryActionBtnText}>Next: Guarantor & Work</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─── STEP 3: WORK & GUARANTOR DETAILS ─── */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionHeading}>Employment & Emergency Contact</Text>
                <Text style={styles.sectionSub}>Required under Bank of Ghana & consumer credit regulations.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONTACT PHONE *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 0244123456"
                      placeholderTextColor={colors.textTertiary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DIGITAL GPS ADDRESS (GHANAPOST)</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. GA-183-9021"
                      placeholderTextColor={colors.textTertiary}
                      value={gpsAddress}
                      onChangeText={setGpsAddress}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>OCCUPATION / PROFESSION</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="briefcase-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Software Engineer, Doctor, Trader"
                      placeholderTextColor={colors.textTertiary}
                      value={occupation}
                      onChangeText={setOccupation}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEXT OF KIN / GUARANTOR NAME</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="people-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name of relative or spouse"
                      placeholderTextColor={colors.textTertiary}
                      value={nextOfKinName}
                      onChangeText={setNextOfKinName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEXT OF KIN PHONE NUMBER</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 0501234567"
                      placeholderTextColor={colors.textTertiary}
                      value={nextOfKinPhone}
                      onChangeText={setNextOfKinPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.consentBox}>
                  <Ionicons name="lock-closed" size={14} color="#059669" />
                  <Text style={styles.consentText}>
                    By proceeding, you authorize I-Dynamic to debit the remaining 40% balance ({frequency}) using your verified payment method.
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setStep(2)}>
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </Pressable>
                  <Pressable
                    disabled={submitting}
                    style={[styles.primaryActionBtnFlex, submitting && { opacity: 0.6 }]}
                    onPress={handleCompleteApplication}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryActionBtnText}>Confirm & Pay 60%</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: "92%"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  badge60: {
    backgroundColor: colors.brandAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  badge60Text: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center"
  },
  stepperBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center"
  },
  stepDotActive: {
    backgroundColor: colors.text
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary
  },
  stepNumActive: {
    color: "#FFFFFF"
  },
  stepLine: {
    width: 48,
    height: 2,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 6
  },
  stepLineActive: {
    backgroundColor: colors.text
  },
  scrollBody: {
    paddingBottom: 24
  },
  stepContainer: {
    width: "100%"
  },
  niaBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,102,204,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,102,204,0.18)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16
  },
  niaBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0066CC"
  },
  niaBannerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220,38,38,0.08)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500"
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    height: 50,
    borderRadius: radius.pill,
    marginTop: 8
  },
  primaryActionBtnFlex: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    height: 48,
    borderRadius: radius.pill
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F7",
    marginRight: 10
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16
  },
  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5,150,105,0.06)",
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.2)",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16
  },
  verifiedName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  verifiedCardNo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  verifiedTag: {
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  verifiedTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  planHighlightsCard: {
    backgroundColor: "#F9F9FB",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  planHighlightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  planHighlightLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  planHighlightLabelBold: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  planHighlightSub: {
    fontSize: 11,
    color: colors.brandAccent,
    marginTop: 2
  },
  planHighlightVal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  downPaymentBigText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.brandAccent
  },
  remainingValText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  planDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 10
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12
  },
  freqRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16
  },
  freqCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12
  },
  freqCardActive: {
    borderColor: colors.brandAccent,
    backgroundColor: "rgba(0,102,204,0.03)"
  },
  freqTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6
  },
  freqTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary
  },
  freqTitleActive: {
    color: colors.brandAccent
  },
  freqPerAmt: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  freqSub: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary
  },
  freqDuration: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4
  },
  scheduleBox: {
    backgroundColor: "#F5F5F7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C7C7CC"
  },
  milestoneDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandAccent
  },
  milestoneName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  milestoneSub: {
    fontSize: 11,
    color: colors.brandAccent
  },
  milestoneAmt: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text
  },
  consentBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5,150,105,0.06)",
    padding: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 6
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15
  }
});
