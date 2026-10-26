import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius } from "../../constants/theme";
import { OrderItem } from "../../types";
import { VerifiedDevice, verifyDeviceSerial } from "../../services/adminServicesApi";

interface Props {
  item: OrderItem;
  onClose: () => void;
  onSubmit: (payload: { serialNumber: string | null; imei: string | null }) => Promise<void>;
  saving: boolean;
}

export function SerialImeiSheet({ item, onClose, onSubmit, saving }: Props) {
  const [open, setOpen] = useState(true);
  const [serial, setSerial] = useState(item.serialNumber || "");
  const [imei, setImei] = useState(item.imei || "");
  const [device, setDevice] = useState<VerifiedDevice | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const dismiss = () => {
    setOpen(false);
    setTimeout(onClose, 280);
  };

  const handleVerify = async () => {
    const value = (imei.trim() || serial.trim()).toUpperCase();
    if (value.length < 8) {
      setVerifyError("Enter a serial number or 15-digit IMEI first.");
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyDeviceSerial(value);
      setDevice(result);
      if (!serial.trim() && result.serialNumber) setSerial(result.serialNumber);
      if (result.imei) setImei(result.imei);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "Hardware lookup failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = () => {
    const s = serial.trim().toUpperCase() || null;
    const i = imei.trim() || null;
    if (!s && !i) {
      setVerifyError("Enter at least a serial number or an IMEI.");
      return;
    }
    onSubmit({ serialNumber: s, imei: i });
  };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheetHandle} />
        <Text style={styles.title}>Assign Serial / IMEI</Text>
        <Text style={styles.sub} numberOfLines={1}>{item?.name}</Text>

        <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
          <Text style={styles.fieldLabel}>APPLE SERIAL NUMBER</Text>
          <TextInput
            value={serial}
            onChangeText={(t) => { setSerial(t); setDevice(null); }}
            autoCapitalize="characters"
            placeholder="e.g. DNPQK1ABN5W7"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>IMEI (15 DIGITS)</Text>
          <TextInput
            value={imei}
            onChangeText={(t) => { setImei(t.replace(/[^0-9]/g, "")); setDevice(null); }}
            keyboardType="number-pad"
            maxLength={15}
            placeholder="e.g. 353685071052662"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
          />

          <Pressable onPress={handleVerify} disabled={verifying} style={styles.verifyBtn}>
            {verifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="search-outline" size={16} color="#FFFFFF" />
                <Text style={styles.verifyBtnText}>Verify live against hardware databases</Text>
              </>
            )}
          </Pressable>

          {verifyError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{verifyError}</Text>
            </View>
          ) : null}

          {device ? (
            <View style={styles.verifiedCard}>
              <View style={styles.verifiedHeader}>
                <Ionicons name="checkmark-circle" size={18} color={colors.brandAccent} />
                <Text style={styles.verifiedTitle}>{device.model}</Text>
              </View>
              <Text style={styles.verifiedSource}>Verified via {device.provider}</Text>
              {[
                ["Storage", device.storage],
                ["Color", device.color],
                ["Model number", device.modelNumber],
                ["Warranty", device.warrantyStatus],
                ["Coverage", device.coverageExpires],
                ["iCloud / FMI", device.icloudStatus],
                ["SIM lock", device.simLock]
              ].map(([label, value]) => (
                <View key={label} style={styles.verifiedRow}>
                  <Text style={styles.verifiedLabel}>{label}</Text>
                  <Text style={styles.verifiedValue}>{String(value || "—")}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={dismiss} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleSubmit} disabled={saving} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>
                {item?.serialNumber || item?.imei ? "Update" : "Assign"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8
  },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15.5,
    fontFamily: "monospace",
    color: colors.text
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.brandAccent,
    marginTop: 18
  },
  verifyBtnText: { fontSize: 13.5, fontWeight: "700", color: "#FFFFFF" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    backgroundColor: "rgba(217, 45, 32, 0.07)",
    borderRadius: 10,
    padding: 10
  },
  errorText: { flex: 1, fontSize: 12.5, color: colors.danger, lineHeight: 17 },
  verifiedCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14
  },
  verifiedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  verifiedTitle: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 },
  verifiedSource: { fontSize: 11.5, color: colors.textTertiary, marginTop: 3, marginBottom: 6 },
  verifiedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  verifiedLabel: { fontSize: 12.5, color: colors.textSecondary },
  verifiedValue: { fontSize: 12.5, fontWeight: "600", color: colors.text, flex: 1, textAlign: "right", marginLeft: 12 },
  footer: {
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
