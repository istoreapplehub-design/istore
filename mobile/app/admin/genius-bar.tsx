import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius, theme } from "../../constants/theme";
import {
  GeniusBooking,
  GeniusBookingStatus,
  VerifiedDevice,
  getGeniusBookings,
  updateGeniusBookingStatus,
  verifyDeviceSerial
} from "../../services/adminServicesApi";

const STATUS_META: Record<GeniusBookingStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: "CONFIRMED", color: colors.brandAccent, bg: colors.brandRedSoft },
  in_repair: { label: "IN REPAIR", color: "#B25000", bg: "rgba(178, 80, 0, 0.10)" },
  completed: { label: "COMPLETED", color: colors.text, bg: colors.surface },
  cancelled: { label: "CANCELLED", color: colors.danger || "#C40000", bg: "rgba(196, 0, 0, 0.08)" },
  no_show: { label: "NO SHOW", color: colors.textSecondary, bg: colors.surface }
};

const STATUS_OPTIONS: GeniusBookingStatus[] = ["confirmed", "in_repair", "completed", "cancelled", "no_show"];

function StatusChip({ status }: { status: GeniusBookingStatus }) {
  const meta = STATUS_META[status] || STATUS_META.confirmed;
  return (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export default function AdminGeniusBarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bookings, setBookings] = useState<GeniusBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceModal, setDeviceModal] = useState<{ booking: GeniusBooking; device: VerifiedDevice } | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const data = await getGeniusBookings();
      setBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangeStatus = (booking: GeniusBooking) => {
    Haptics.selectionAsync();
    Alert.alert(
      `Set status · ${booking.reference}`,
      `${booking.customerName} · ${booking.device}`,
      [
        ...STATUS_OPTIONS.map((s) => ({
          text: (STATUS_META[s]?.label || s).replace("_", " "),
          onPress: async () => {
            try {
              const updated = await updateGeniusBookingStatus(booking.reference, { status: s });
              setBookings((prev) => prev.map((b) => (b.reference === updated.reference ? updated : b)));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: unknown) {
              Alert.alert("Update Failed", err instanceof Error ? err.message : "Could not update booking");
            }
          }
        })),
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleVerify = async (booking: GeniusBooking) => {
    if (!booking.serialNumber) return;
    setVerifying(booking.reference);
    try {
      const device = await verifyDeviceSerial(booking.serialNumber);
      setDeviceModal({ booking, device });
    } catch (err: unknown) {
      Alert.alert(
        "Verification Failed",
        err instanceof Error ? err.message : "Hardware lookup service did not return a result."
      );
    } finally {
      setVerifying(null);
    }
  };

  const openCalls = (phone: string) => {
    Haptics.selectionAsync();
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.accent} />}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Genius Bar</Text>
            <Text style={styles.subtitle}>Repair bookings at LESTRADES_UCC CAPE COAST</Text>
          </View>
          <Pressable onPress={() => router.push("/admin/events")} style={styles.eventsBtn}>
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
            <Text style={styles.eventsBtnText}>Events</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.danger || "#C40000"} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.card}>
            <Ionicons name="hammer-outline" size={28} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No repair bookings yet</Text>
            <Text style={styles.emptyText}>
              Bookings appear here as soon as customers reserve a Genius Bar slot from the app.
            </Text>
          </View>
        ) : (
          bookings.map((b) => (
            <View key={b.reference} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.reference}>{b.reference}</Text>
                <Pressable onPress={() => handleChangeStatus(b)} hitSlop={8}>
                  <StatusChip status={b.status} />
                </Pressable>
              </View>

              <Text style={styles.deviceIssue}>{b.device} · {b.issue}</Text>
              <Text style={styles.meta}>{b.date} · {b.slot}</Text>

              <View style={styles.hairline} />

              <View style={styles.contactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{b.customerName}</Text>
                  <Text style={styles.customerPhone}>{b.phone}</Text>
                </View>
                <Pressable onPress={() => openCalls(b.phone)} style={styles.callBtn} hitSlop={8}>
                  <Ionicons name="call" size={16} color={colors.brandAccent} />
                </Pressable>
              </View>

              {b.serialNumber ? (
                <View style={styles.serialRow}>
                  <Text style={styles.serialLabel}>SERIAL</Text>
                  <Text style={styles.serialValue} numberOfLines={1}>{b.serialNumber}</Text>
                  <Pressable
                    onPress={() => handleVerify(b)}
                    disabled={verifying === b.reference}
                    style={styles.verifyBtn}
                  >
                    {verifying === b.reference ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.verifyBtnText}>Verify</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {b.notes ? <Text style={styles.notes}>{b.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!deviceModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDeviceModal(null)}>
        {deviceModal ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{deviceModal.device.model}</Text>
            <Text style={styles.modalSub}>Verified via {deviceModal.device.provider}</Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
              {[
                ["Serial", deviceModal.booking.serialNumber || deviceModal.device.serialNumber],
                ["IMEI", deviceModal.device.imei || "—"],
                ["Category", deviceModal.device.category],
                ["Storage", deviceModal.device.storage],
                ["Color", deviceModal.device.color],
                ["Model number", deviceModal.device.modelNumber],
                ["Warranty", deviceModal.device.warrantyStatus],
                ["Coverage", deviceModal.device.coverageExpires],
                ["iCloud / FMI", deviceModal.device.icloudStatus],
                ["SIM lock", deviceModal.device.simLock],
                ["Retail est.", `₵${deviceModal.device.estimatedRetailGHS.toLocaleString("en-GH")}`]
              ].map(([label, value]) => (
                <View key={String(label)} style={styles.modalRow}>
                  <Text style={styles.modalLabel}>{label}</Text>
                  <Text style={styles.modalValue}>{String(value || "—")}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => setDeviceModal(null)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  eventsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full
  },
  eventsBtnText: { fontSize: 12.5, fontWeight: "700", color: "#FFFFFF" },
  centerBox: { alignItems: "center", paddingTop: 60 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start"
  },
  errorText: { fontSize: 14, color: colors.danger || "#C40000", marginTop: 8, textAlign: "center" },
  retryBtn: {
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
  deviceIssue: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 10 },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 12, alignSelf: "stretch" },
  contactRow: { flexDirection: "row", alignItems: "center" },
  customerName: { fontSize: 14, fontWeight: "600", color: colors.text },
  customerPhone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandRedSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  serialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "stretch"
  },
  serialLabel: { fontSize: 10, fontWeight: "700", color: colors.textTertiary, letterSpacing: 0.5 },
  serialValue: { flex: 1, fontFamily: "monospace", fontSize: 12.5, fontWeight: "600", color: colors.text },
  verifyBtn: {
    backgroundColor: colors.brandAccent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full
  },
  verifyBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  notes: { fontSize: 13, color: colors.textSecondary, marginTop: 10, fontStyle: "italic" },
  modalBackdrop: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  modalLabel: { fontSize: 13, color: colors.textSecondary },
  modalValue: { fontSize: 13.5, fontWeight: "600", color: colors.text, flex: 1, textAlign: "right", marginLeft: 16 },
  doneBtn: {
    backgroundColor: colors.accent,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12
  },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" }
});
