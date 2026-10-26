import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { colors, radius, theme } from "../../constants/theme";
import {
  TradeInStatus,
  TradeInSubmission,
  VerifiedDevice,
  getTradeInSubmissions,
  updateTradeInSubmission,
  verifyDeviceSerial
} from "../../services/adminServicesApi";

const STATUS_META: Record<TradeInStatus, { label: string; color: string; bg: string }> = {
  pending_inspection: { label: "PENDING", color: "#B25000", bg: "rgba(178, 80, 0, 0.10)" },
  inspecting: { label: "INSPECTING", color: colors.brandAccent, bg: colors.brandRedSoft },
  approved: { label: "APPROVED", color: colors.text, bg: colors.surface },
  completed: { label: "COMPLETED", color: colors.text, bg: colors.surface },
  rejected: { label: "REJECTED", color: colors.danger, bg: "rgba(217, 45, 32, 0.08)" }
};

const STATUS_ORDER: TradeInStatus[] = ["pending_inspection", "inspecting", "approved", "completed", "rejected"];

function StatusChip({ status }: { status: TradeInStatus }) {
  const meta = STATUS_META[status] || STATUS_META.pending_inspection;
  return (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export default function AdminTradeInScreen() {
  const insets = useSafeAreaInsets();

  const [submissions, setSubmissions] = useState<TradeInSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending_inspection">("pending_inspection");

  const [selected, setSelected] = useState<TradeInSubmission | null>(null);
  const [draftStatus, setDraftStatus] = useState<TradeInStatus>("pending_inspection");
  const [finalCredit, setFinalCredit] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState<VerifiedDevice | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const data = await getTradeInSubmissions();
      setSubmissions(data);
      // Keep the open inspection sheet in sync with the latest record
      setSelected((prev) => (prev ? data.find((s) => s.id === prev.id) || prev : prev));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load trade-in requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openInspection = (s: TradeInSubmission) => {
    Haptics.selectionAsync();
    setSelected(s);
    setDraftStatus(s.status);
    setFinalCredit(s.finalCreditGHS !== undefined ? String(s.finalCreditGHS) : "");
    setNotes(s.inspectionNotes || s.notes || "");
    setVerified(null);
  };

  const visible = useMemo(
    () => (filter === "all" ? submissions : submissions.filter((s) => s.status === filter)),
    [submissions, filter]
  );

  const pendingCount = submissions.filter((s) => s.status === "pending_inspection").length;

  const handleVerify = async () => {
    if (!selected) return;
    setVerifying(true);
    try {
      const device = await verifyDeviceSerial(selected.serialOrImei);
      setVerified(device);
    } catch (err: unknown) {
      Alert.alert(
        "Verification Failed",
        err instanceof Error ? err.message : "Hardware lookup did not return a result for this serial/IMEI."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateTradeInSubmission(selected.id, {
        status: draftStatus,
        finalCreditGHS: finalCredit.trim() ? Number(finalCredit) : undefined,
        inspectionNotes: notes.trim() || undefined
      });
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSelected(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      Alert.alert("Save Failed", err instanceof Error ? err.message : "Could not update the submission");
    } finally {
      setSaving(false);
    }
  };

  const photos = selected
    ? Object.entries(selected.photos || {}).filter(([, uri]) => !!uri) as Array<[string, string]>
    : [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
      >
        <Text style={styles.title}>Trade-In Inspection</Text>
        <Text style={styles.subtitle}>Customer devices awaiting verification at UCC Cape Coast</Text>

        <View style={styles.switcher}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setFilter("pending_inspection"); }}
            style={[styles.switchPill, filter === "pending_inspection" && styles.switchPillActive]}
          >
            <Text style={[styles.switchText, filter === "pending_inspection" && styles.switchTextActive]}>
              Pending ({pendingCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setFilter("all"); }}
            style={[styles.switchPill, filter === "all" && styles.switchPillActive]}
          >
            <Text style={[styles.switchText, filter === "all" && styles.switchTextActive]}>
              All ({submissions.length})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.card}>
            <Ionicons name="swap-horizontal-outline" size={28} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {filter === "pending_inspection" ? "No devices pending inspection" : "No trade-in requests yet"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "pending_inspection"
                ? "Every submitted device has been processed. Switch to All to review past inspections."
                : "Customer trade-in submissions from the app appear here for inspection and credit."}
            </Text>
          </View>
        ) : (
          visible.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => openInspection(s)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.reference}>{s.reference}</Text>
                <StatusChip status={s.status} />
              </View>
              <Text style={styles.modelName}>{s.modelName}</Text>
              <Text style={styles.specLine}>{s.storage} · {s.color} · {s.category}</Text>
              <Text style={styles.serialMono}>{s.serialOrImei}</Text>
              <View style={styles.hairline} />
              <View style={styles.valueRow}>
                <View>
                  <Text style={styles.valueLabel}>ESTIMATED</Text>
                  <Text style={styles.valueText}>₵{s.estimatedValueGHS.toLocaleString("en-GH")}</Text>
                </View>
                {s.finalCreditGHS !== undefined ? (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.valueLabel}>FINAL CREDIT</Text>
                    <Text style={[styles.valueText, { color: colors.brandAccent }]}>
                      ₵{Number(s.finalCreditGHS).toLocaleString("en-GH")}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.inspectHint}>Tap to inspect ›</Text>
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetHandle} />
            <ScrollView contentContainerStyle={{ paddingVertical: 14 }}>
              <Text style={styles.modalTitle}>{selected.modelName}</Text>
              <Text style={styles.modalSub}>
                {selected.reference} · {selected.customerName} · {selected.customerPhone}
              </Text>

              <Pressable
                onPress={() => Linking.openURL(`tel:${selected.customerPhone}`).catch(() => {})}
                style={styles.callRow}
              >
                <Ionicons name="call-outline" size={16} color={colors.brandAccent} />
                <Text style={styles.callText}>Call customer</Text>
              </Pressable>

              <Text style={styles.fieldLabel}>DEVICE IDENTITY</Text>
              <View style={styles.specBox}>
                <Text style={styles.serialMono}>{selected.serialOrImei}</Text>
                <Text style={styles.specLine}>
                  {selected.condition.screenCondition} screen · battery {selected.condition.batteryHealth} ·
                  sensors {selected.condition.sensorsWorking ? "OK" : "faulty"} ·
                  iCloud {selected.condition.icloudUnlocked ? "unlocked" : "LOCKED"}
                </Text>
                <Pressable onPress={handleVerify} disabled={verifying} style={styles.verifyBtn}>
                  {verifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify serial / IMEI live</Text>
                  )}
                </Pressable>
              </View>

              {verified ? (
                <View style={styles.verifiedBox}>
                  {[
                    ["Model", verified.model],
                    ["Storage", verified.storage],
                    ["Color", verified.color],
                    ["Warranty", verified.warrantyStatus],
                    ["Coverage", verified.coverageExpires],
                    ["iCloud / FMI", verified.icloudStatus],
                    ["SIM lock", verified.simLock],
                    ["Source", verified.provider]
                  ].map(([label, value]) => (
                    <View key={label} style={styles.verifiedRow}>
                      <Text style={styles.verifiedLabel}>{label}</Text>
                      <Text style={styles.verifiedValue}>{String(value || "—")}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {photos.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>CUSTOMER PHOTOS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {photos.map(([slot, uri]) => (
                      <View key={slot}>
                        <Image source={{ uri }} style={styles.photo} />
                        <Text style={styles.photoLabel}>{slot.toUpperCase()}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              <Text style={styles.fieldLabel}>INSPECTION STATUS</Text>
              <View style={styles.statusRow}>
                {STATUS_ORDER.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => { Haptics.selectionAsync(); setDraftStatus(s); }}
                    style={[styles.statusPill, draftStatus === s && styles.statusPillActive]}
                  >
                    <Text style={[styles.statusText, draftStatus === s && styles.statusTextActive]}>
                      {STATUS_META[s].label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>FINAL TRADE-IN CREDIT (GHS)</Text>
              <TextInput
                value={finalCredit}
                onChangeText={setFinalCredit}
                keyboardType="decimal-pad"
                placeholder={`Suggested max: ₵${selected.estimatedValueGHS.toLocaleString("en-GH")}`}
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>INSPECTION NOTES</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder="Physical findings, payout method (MoMo / bag credit), etc."
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, styles.multiline]}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setSelected(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Inspection</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 16 },
  switcher: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: 16
  },
  switchPill: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radius.full },
  switchPillActive: { backgroundColor: colors.accent },
  switchText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  switchTextActive: { color: "#FFFFFF" },
  centerBox: { alignItems: "center", paddingTop: 60 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  errorText: { fontSize: 14, color: colors.danger, textAlign: "center", marginTop: 8 },
  retryBtn: {
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: colors.text },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 8 },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reference: { fontFamily: "monospace", fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  chipText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  modelName: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 10 },
  specLine: { fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },
  serialMono: { fontFamily: "monospace", fontSize: 12.5, color: colors.text, marginTop: 6 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 12 },
  valueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  valueLabel: { fontSize: 10, fontWeight: "700", color: colors.textTertiary, letterSpacing: 0.5 },
  valueText: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 2 },
  inspectHint: { fontSize: 12.5, fontWeight: "600", color: colors.brandAccent },
  modalBackdrop: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 10
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  callRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  callText: { fontSize: 13.5, fontWeight: "600", color: colors.brandAccent },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 8
  },
  specBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
  verifyBtn: {
    marginTop: 12,
    backgroundColor: colors.brandAccent,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: "center"
  },
  verifyBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  verifiedBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12
  },
  verifiedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  verifiedLabel: { fontSize: 12.5, color: colors.textSecondary },
  verifiedValue: { fontSize: 12.5, fontWeight: "600", color: colors.text, flex: 1, textAlign: "right", marginLeft: 12 },
  photo: { width: 110, height: 160, borderRadius: 12, backgroundColor: colors.imageBg },
  photoLabel: { fontSize: 10, fontWeight: "700", color: colors.textTertiary, marginTop: 4, letterSpacing: 0.5 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  statusPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.3 },
  statusTextActive: { color: "#FFFFFF" },
  input: {
    minHeight: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 15,
    color: colors.text
  },
  multiline: { height: 84 },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtnText: { fontSize: 14.5, fontWeight: "600", color: colors.textSecondary },
  saveBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  saveBtnText: { fontSize: 14.5, fontWeight: "700", color: "#FFFFFF" }
});
