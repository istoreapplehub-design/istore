import React, { useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../constants/theme";
import { OrderStatus, OrderStatusBadge } from "./OrderStatusBadge";

export type UpdatableOrderStatus = "shipped" | "delivered" | "cancelled";

export interface StatusUpdateSheetProps {
  visible: boolean;
  currentStatus: OrderStatus;
  onClose: () => void;
  onSubmit: (data: {
    status: UpdatableOrderStatus;
    trackingNumber?: string;
    courier?: string;
    adminNote?: string;
  }) => Promise<void>;
  submitting: boolean;
}

const COURIER_CHIPS = ["DHL", "EMS", "Yango", "Bolt", "Jumia", "Other"];

interface StatusOption {
  status: UpdatableOrderStatus;
  label: string;
  subtext: string;
}

const TRANSITIONS_MAP: Record<OrderStatus, StatusOption[]> = {
  pending: [
    {
      status: "cancelled",
      label: "Cancel Order",
      subtext: "Void this unpaid pending order"
    }
  ],
  paid: [
    {
      status: "shipped",
      label: "Mark as Shipped",
      subtext: "Order is packaged and handed over to courier"
    },
    {
      status: "cancelled",
      label: "Cancel Order",
      subtext: "Customer cancellation — manual refund via Paystack required"
    }
  ],
  shipped: [
    {
      status: "delivered",
      label: "Mark as Delivered",
      subtext: "Package has been received by customer"
    },
    {
      status: "cancelled",
      label: "Cancel Order",
      subtext: "Order returned or cancelled during transit"
    }
  ],
  delivered: [],
  cancelled: []
};

export function StatusUpdateSheet({
  visible,
  currentStatus,
  onClose,
  onSubmit,
  submitting
}: StatusUpdateSheetProps) {
  const insets = useSafeAreaInsets();
  const availableOptions = TRANSITIONS_MAP[currentStatus] || [];

  const [selectedStatus, setSelectedStatus] = useState<UpdatableOrderStatus | null>(
    availableOptions.length > 0 ? availableOptions[0].status : null
  );
  const [courier, setCourier] = useState("DHL");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (visible) {
      const opts = TRANSITIONS_MAP[currentStatus] || [];
      setSelectedStatus(opts.length > 0 ? opts[0].status : null);
      setCourier("DHL");
      setTrackingNumber("");
      setAdminNote("");
    }
  }, [visible, currentStatus]);

  const handleSelectStatus = (st: UpdatableOrderStatus) => {
    Haptics.selectionAsync();
    setSelectedStatus(st);
  };

  const handleSelectCourierChip = (chip: string) => {
    Haptics.selectionAsync();
    setCourier(chip === "Other" ? "" : chip);
  };

  const isShippedSelected = selectedStatus === "shipped";
  const isValid =
    selectedStatus !== null &&
    (!isShippedSelected || (courier.trim().length > 0 && trackingNumber.trim().length > 0));

  const handleSubmit = async () => {
    if (!selectedStatus || !isValid || submitting) return;
    Haptics.selectionAsync();

    await onSubmit({
      status: selectedStatus,
      trackingNumber: isShippedSelected ? trackingNumber.trim() : undefined,
      courier: isShippedSelected ? courier.trim() : undefined,
      adminNote: adminNote.trim() ? adminNote.trim() : undefined
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 }
          ]}
        >
          {/* 1. Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Update Order Status</Text>
            <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* 2. Current Status */}
          <View style={styles.currentStatusRow}>
            <Text style={styles.currentStatusLabel}>Currently:</Text>
            <OrderStatusBadge status={currentStatus} size="sm" />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {availableOptions.length === 0 ? (
              <View style={styles.emptyTransitions}>
                <Ionicons name="checkmark-done-circle" size={48} color={colors.textTertiary} />
                <Text style={styles.finalStateText}>
                  This order has reached its final state.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.closeOnlyBtn, pressed && { opacity: 0.8 }]}
                  onPress={onClose}
                >
                  <Text style={styles.closeOnlyText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* 4. Options Radio Rows */}
                <Text style={styles.sectionHeader}>Choose New Status</Text>
                <View style={styles.optionsList}>
                  {availableOptions.map((opt) => {
                    const isSelected = selectedStatus === opt.status;
                    return (
                      <Pressable
                        key={opt.status}
                        onPress={() => handleSelectStatus(opt.status)}
                        style={[
                          styles.radioRow,
                          isSelected && styles.radioRowSelected
                        ]}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.radioLabel}>{opt.label}</Text>
                          <Text style={styles.radioSub}>{opt.subtext}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* 5. Extra Fields for Shipped */}
                {isShippedSelected && (
                  <View style={styles.shippedFields}>
                    <Text style={styles.fieldLabel}>Courier Service *</Text>
                    <View style={styles.courierChipsRow}>
                      {COURIER_CHIPS.map((chip) => {
                        const isChipSelected =
                          (chip === "Other" && !["DHL", "EMS", "Yango", "Bolt", "Jumia"].includes(courier)) ||
                          courier === chip;
                        return (
                          <Pressable
                            key={chip}
                            onPress={() => handleSelectCourierChip(chip)}
                            style={[
                              styles.courierChip,
                              isChipSelected && styles.courierChipSelected
                            ]}
                          >
                            <Text
                              style={[
                                styles.courierChipText,
                                isChipSelected && styles.courierChipTextSelected
                              ]}
                            >
                              {chip}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="e.g. DHL, EMS Ghana, Yango"
                      placeholderTextColor={colors.textTertiary}
                      value={courier}
                      onChangeText={setCourier}
                    />

                    <Text style={styles.fieldLabel}>Tracking Number *</Text>
                    <TextInput
                      style={[styles.input, { fontFamily: "monospace" }]}
                      placeholder="e.g. DHL9876543210"
                      placeholderTextColor={colors.textTertiary}
                      value={trackingNumber}
                      autoCapitalize="characters"
                      onChangeText={setTrackingNumber}
                    />
                  </View>
                )}

                {/* 6. Admin Note */}
                <Text style={styles.fieldLabel}>Admin Note (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.noteInput]}
                  placeholder="Internal fulfillment or refund note..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={500}
                  value={adminNote}
                  onChangeText={setAdminNote}
                />

                {/* 7. Submit Button */}
                <Pressable
                  disabled={!isValid || submitting}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    (!isValid || submitting) && styles.submitBtnDisabled,
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  {submitting ? (
                    <View style={styles.submittingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Updating...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitBtnText}>
                      Update to {selectedStatus?.toUpperCase()}
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end"
  },
  dismissOverlay: {
    flex: 1
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  currentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16
  },
  currentStatusLabel: {
    fontSize: 14,
    color: colors.textSecondary
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10
  },
  optionsList: {
    gap: 10,
    marginBottom: 16
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "transparent"
  },
  radioRowSelected: {
    borderColor: colors.accent,
    backgroundColor: "rgba(23, 23, 23, 0.04)"
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  radioCircleSelected: {
    borderColor: colors.accent
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  radioSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  shippedFields: {
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10
  },
  courierChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10
  },
  courierChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  courierChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  courierChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text
  },
  courierChipTextSelected: {
    color: "#FFFFFF"
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border
  },
  noteInput: {
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 16
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6
  },
  submitBtnDisabled: {
    opacity: 0.5
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  emptyTransitions: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12
  },
  finalStateText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
    textAlign: "center"
  },
  closeOnlyBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8
  },
  closeOnlyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  }
});

export default StatusUpdateSheet;
