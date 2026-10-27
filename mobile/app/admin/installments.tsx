import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius, formatGHS } from "../../constants/theme";
import { AdminHeader } from "../../components/admin/AdminHeader";
import {
  AdminInstallmentPlan,
  approveAdminInstallment,
  getAdminInstallments,
  rejectAdminInstallment,
  updateAdminInstallmentSerial
} from "../../services/adminApi";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: "UNDER REVIEW", color: "#B25000", bg: "rgba(178, 80, 0, 0.10)" },
  pending_downpayment: { label: "AWAITING DOWN PAYMENT", color: colors.brandAccent, bg: colors.brandRedSoft },
  active: { label: "ACTIVE", color: colors.brandAccent, bg: colors.brandRedSoft },
  completed: { label: "COMPLETED", color: "#059669", bg: "rgba(5, 150, 105, 0.10)" },
  rejected: { label: "REJECTED", color: colors.danger, bg: "rgba(217, 45, 32, 0.08)" },
  defaulted: { label: "DEFAULTED", color: colors.danger, bg: "rgba(217, 45, 32, 0.08)" },
  cancelled: { label: "CANCELLED", color: colors.textSecondary, bg: colors.surface }
};

const FILTERS = ["pending_review", "pending_downpayment", "active", "completed", "rejected", "all"] as const;

function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.pending_review;
  return (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AdminInstallmentsScreen() {
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<AdminInstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending_review");

  const [selected, setSelected] = useState<AdminInstallmentPlan | null>(null);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [installments, setInstallments] = useState("4");
  const [downPercent, setDownPercent] = useState("60");
  const [creditScore, setCreditScore] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [serial, setSerial] = useState("");
  const [imei, setImei] = useState("");
  const [savingSerial, setSavingSerial] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await getAdminInstallments({ status: filter, limit: 50 });
      setPlans(res.data || []);
      setSelected((prev) => (prev ? (res.data || []).find((p) => p.id === prev.id) || prev : prev));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load installment applications");
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  React.useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const openDetail = (plan: AdminInstallmentPlan) => {
    Haptics.selectionAsync();
    setSelected(plan);
    setFrequency(plan.frequency || "weekly");
    setInstallments(String(plan.totalInstallments || 4));
    setDownPercent(String(Math.round(plan.downPaymentPercent || 60)));
    setCreditScore(plan.user?.creditScore != null ? String(plan.user.creditScore) : "");
    setReviewNotes("");
    setSerial(plan.serialNumber || "");
    setImei(plan.imei || "");
  };

  const validateReviewForm = () => {
    const count = parseInt(installments, 10);
    const pct = parseInt(downPercent, 10);
    const score = parseInt(creditScore, 10);
    if (!Number.isInteger(count) || count < 2 || count > 12) {
      Alert.alert("Invalid Schedule", "Total installments must be between 2 and 12.");
      return null;
    }
    if (!Number.isInteger(pct) || pct < 10 || pct > 80) {
      Alert.alert("Invalid Down Payment", "Down payment percentage must be between 10 and 80.");
      return null;
    }
    if (!Number.isInteger(score) || score < 300 || score > 850) {
      Alert.alert("Invalid Trust Rating", "Enter the trust rating to grant (300–850).");
      return null;
    }
    return { count, pct, score };
  };

  const handleApprove = async () => {
    if (!selected) return;
    const form = validateReviewForm();
    if (!form) return;

    Alert.alert(
      "Approve Application",
      `Grant ${formatGHS(Math.round((selected.totalAmountGHS * (100 - form.pct)) / 100 / form.count))} ${frequency} payments × ${form.count} and trust rating ${form.score}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setSaving(true);
            try {
              await approveAdminInstallment(selected.id, {
                frequency,
                totalInstallments: form.count,
                downPaymentPercent: form.pct,
                creditScore: form.score,
                notes: reviewNotes.trim() || undefined
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelected(null);
              fetchData();
            } catch (err: unknown) {
              Alert.alert("Approval Failed", err instanceof Error ? err.message : "Could not approve this application.");
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!selected) return;
    const reason = reviewNotes.trim();
    if (reason.length < 3) {
      Alert.alert("Reason Required", "Enter the rejection reason the applicant will see.");
      return;
    }
    setSaving(true);
    try {
      await rejectAdminInstallment(selected.id, reason);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelected(null);
      fetchData();
    } catch (err: unknown) {
      Alert.alert("Rejection Failed", err instanceof Error ? err.message : "Could not reject this application.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSerial = async () => {
    if (!selected) return;
    setSavingSerial(true);
    try {
      await updateAdminInstallmentSerial(selected.id, {
        serialNumber: serial.trim() || null,
        imei: imei.trim() || null
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Serial & IMEI recorded on the plan and its order item.");
      fetchData();
    } catch (err: unknown) {
      Alert.alert("Save Failed", err instanceof Error ? err.message : "Could not save serial/IMEI.");
    } finally {
      setSavingSerial(false);
    }
  };

  const deviceName = (plan: AdminInstallmentPlan) =>
    plan.order?.items?.[0]?.name || "Apple Device";

  return (
    <View style={styles.container}>
      <AdminHeader title="Installments & Trust Ratings" subtitle="Review applications, set schedules, assign hardware IDs" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.brandAccent} />
        }
      >
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === "all" ? "All" : STATUS_META[f].label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.brandAccent} />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No {filter === "all" ? "" : STATUS_META[filter].label.toLowerCase()} applications</Text>
            <Text style={styles.emptyText}>
              {filter === "pending_review"
                ? "New installment applications land here for review."
                : "Nothing in this queue right now."}
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <Pressable key={plan.id} onPress={() => openDetail(plan)} style={({ pressed }) => [styles.planCard, pressed && { opacity: 0.9 }]}>
              <View style={styles.planCardTop}>
                <StatusChip status={plan.status} />
                <Text style={styles.planDate}>
                  {new Date(plan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </View>
              <Text style={styles.planDevice}>{deviceName(plan)}</Text>
              <Text style={styles.planApplicant}>
                {plan.applicantName} · {plan.applicantPhone}
              </Text>
              <View style={styles.planMetaRow}>
                <Text style={styles.planTotal}>{formatGHS(plan.totalAmountGHS)}</Text>
                <Text style={styles.planFreq}>
                  {plan.frequency.toUpperCase()} · requested {plan.totalInstallments} payments
                </Text>
              </View>
              {plan.status === "pending_review" && (
                <View style={styles.actionHintRow}>
                  <Ionicons name="hourglass-outline" size={14} color="#B25000" />
                  <Text style={styles.actionHintText}>Awaiting your review — tap to approve or reject</Text>
                </View>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Review / management sheet */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modalRoot}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
              <Text style={styles.modalTitle}>Application Detail</Text>
              <Pressable hitSlop={10} onPress={() => setSelected(null)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
              <StatusChip status={selected.status} />

              {selected.kyc?.photoUrl ? (
                <Image source={{ uri: selected.kyc.photoUrl }} style={styles.kycPhoto} />
              ) : null}

              <Text style={styles.sectionHeading}>Applicant</Text>
              <InfoRow label="Name" value={selected.applicantName} />
              <InfoRow label="Phone" value={selected.applicantPhone} />
              <InfoRow label="Email" value={selected.applicantEmail} />
              <InfoRow label="Ghana Card" value={selected.ghanaCardNumber} />
              <InfoRow label="GPS Address" value={selected.gpsAddress} />
              <InfoRow label="Occupation" value={selected.occupation} />
              <InfoRow label="Employer" value={selected.employer} />
              <InfoRow label="Next of Kin" value={selected.nextOfKinName ? `${selected.nextOfKinName} · ${selected.nextOfKinPhone || ""}` : null} />
              <InfoRow label="Account Rating" value={selected.user ? (selected.user.creditScore == null ? "Unrated" : `${selected.user.creditScore} · ${selected.user.creditTier}`) : "Guest applicant"} />

              <Text style={styles.sectionHeading}>Order</Text>
              <InfoRow label="Device" value={deviceName(selected)} />
              <InfoRow label="Order Total" value={formatGHS(selected.totalAmountGHS)} />
              <InfoRow label="Order ID" value={selected.orderId} />
              <InfoRow
                label="Fulfillment"
                value={
                  typeof selected.order?.shippingAddress === "string" && selected.order.shippingAddress.includes("Store Pickup")
                    ? "Store Pickup"
                    : "Check order"
                }
              />

              {selected.reviewNotes ? (
                <>
                  <Text style={styles.sectionHeading}>Review Note</Text>
                  <Text style={styles.reviewNoteText}>{selected.reviewNotes}</Text>
                </>
              ) : null}

              {selected.status === "pending_review" && (
                <>
                  <Text style={styles.sectionHeading}>Approval — set the schedule</Text>
                  <View style={styles.freqRow}>
                    {(["weekly", "monthly"] as const).map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => { setFrequency(f); setInstallments(f === "weekly" ? "4" : "2"); }}
                        style={[styles.freqChip, frequency === f && styles.freqChipActive]}
                      >
                        <Text style={[styles.freqChipText, frequency === f && styles.freqChipTextActive]}>
                          {f === "weekly" ? "Weekly" : "Monthly"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.fieldCol}>
                      <Text style={styles.fieldLabel}>Installments (2–12)</Text>
                      <TextInput
                        value={installments}
                        onChangeText={setInstallments}
                        keyboardType="number-pad"
                        placeholder="4"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.fieldCol}>
                      <Text style={styles.fieldLabel}>Down payment % (10–80)</Text>
                      <TextInput
                        value={downPercent}
                        onChangeText={setDownPercent}
                        keyboardType="number-pad"
                        placeholder="60"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Trust rating to grant (300–850)</Text>
                  <TextInput
                    value={creditScore}
                    onChangeText={setCreditScore}
                    keyboardType="number-pad"
                    placeholder="e.g. 620"
                    style={styles.input}
                  />

                  <Text style={styles.fieldLabel}>Notes / rejection reason (visible to applicant)</Text>
                  <TextInput
                    value={reviewNotes}
                    onChangeText={setReviewNotes}
                    placeholder="Approval terms, or why the application was rejected"
                    multiline
                    style={[styles.input, { height: 72, textAlignVertical: "top" }]}
                  />

                  <View style={styles.btnRow}>
                    <Pressable onPress={handleApprove} disabled={saving} style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}>
                      {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.approveBtnText}>Approve & Grant Rating</Text>}
                    </Pressable>
                    <Pressable onPress={handleReject} disabled={saving} style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}>
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {(selected.status === "pending_downpayment" || selected.status === "active" || selected.status === "completed") && (
                <>
                  <Text style={styles.sectionHeading}>Hardware</Text>
                  {selected.milestones?.length ? (
                    <InfoRow
                      label="Schedule"
                      value={`${Math.round(selected.downPaymentPercent)}% down (${formatGHS(selected.downPaymentGHS)}) · ${selected.totalInstallments} × ${formatGHS(selected.installmentAmountGHS)} ${selected.frequency}`}
                    />
                  ) : null}
                  <InfoRow label="Down Payment" value={selected.downPaymentPaid ? "Paid" : "Unpaid"} />
                  <Text style={styles.fieldLabel}>Serial number</Text>
                  <TextInput value={serial} onChangeText={setSerial} placeholder="FVFX…" style={styles.input} autoCapitalize="characters" />
                  <Text style={styles.fieldLabel}>IMEI</Text>
                  <TextInput value={imei} onChangeText={setImei} keyboardType="phone-pad" placeholder="15 digits" style={styles.input} />
                  <Pressable onPress={handleSaveSerial} disabled={savingSerial} style={({ pressed }) => [styles.serialBtn, pressed && { opacity: 0.85 }, savingSerial && { opacity: 0.5 }]}>
                    {savingSerial ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.serialBtnText}>Save Serial & IMEI</Text>}
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 16,
    gap: 12
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  filterChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: "#FFFFFF"
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: "center"
  },
  retryBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.pill
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center"
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4
  },
  planCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  chipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  planDate: {
    fontSize: 11,
    color: colors.textSecondary
  },
  planDevice: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  planApplicant: {
    fontSize: 12,
    color: colors.textSecondary
  },
  planMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4
  },
  planTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text
  },
  planFreq: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary
  },
  actionHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6
  },
  actionHintText: {
    fontSize: 11,
    color: "#B25000",
    fontWeight: "600"
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text
  },
  kycPhoto: {
    width: 96,
    height: 120,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginTop: 12,
    alignSelf: "flex-start"
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 6
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  infoLabel: {
    width: 130,
    fontSize: 12,
    color: colors.textSecondary
  },
  infoValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  reviewNoteText: {
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10
  },
  freqRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  freqChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  freqChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  freqChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary
  },
  freqChipTextActive: {
    color: "#FFFFFF"
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10
  },
  fieldCol: {
    flex: 1
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    color: colors.text
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18
  },
  approveBtn: {
    flex: 1.5,
    backgroundColor: colors.brandAccent,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: "center"
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "rgba(217, 45, 32, 0.08)",
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: "center"
  },
  rejectBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  serialBtn: {
    marginTop: 16,
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: "center"
  },
  serialBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  }
});
