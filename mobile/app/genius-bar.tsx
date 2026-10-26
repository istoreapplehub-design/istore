import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../constants/theme";
import { SUPPORT_WHATSAPP_URL } from "../constants/support";

interface StoreHub {
  id: string;
  name: string;
  city: string;
  address: string;
  landmark: string;
  hours: string;
  slots: string[];
}

const GHANA_HUBS: StoreHub[] = [
  {
    id: "lestrades-ucc-cape-coast",
    name: "LESTRADES_UCC CAPE COAST",
    city: "Cape Coast",
    address: "University of Cape Coast, Cape Coast",
    landmark: "Directly opposite UCC Science Market",
    hours: "Mon–Sat: 8:30 AM – 8:00 PM · Sun: 12:00 PM – 6:00 PM",
    slots: ["9:00 AM", "11:30 AM", "1:30 PM", "3:45 PM", "5:30 PM"]
  }
];

const DEVICE_CATEGORIES = [
  { id: "iphone", name: "iPhone", icon: "phone-portrait-outline" },
  { id: "mac", name: "Mac", icon: "laptop-outline" },
  { id: "ipad", name: "iPad", icon: "tablet-portrait-outline" },
  { id: "watch", name: "Apple Watch", icon: "watch-outline" },
  { id: "airpods", name: "AirPods", icon: "headset-outline" }
];

const ISSUE_TYPES = [
  { id: "screen", label: "Display & Screen Damage", estTime: "Same-day (1–2 hrs)" },
  { id: "battery", label: "Battery Health Replacement", estTime: "Same-day (45 mins)" },
  { id: "liquid", label: "Water & Liquid Ingress Diagnostic", estTime: "24–48 hrs" },
  { id: "charging", label: "Power, MagSafe & Charging Port", estTime: "Same-day" },
  { id: "camera", label: "Camera & Face ID Diagnostic", estTime: "Same-day (1 hr)" },
  { id: "system", label: "Logic Board & System Startup", estTime: "24–72 hrs" }
];

export default function GeniusBarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;

  // Flow State
  const [selectedDevice, setSelectedDevice] = useState<string>("iphone");
  const [selectedIssue, setSelectedIssue] = useState<string>("screen");
  const [selectedHub, setSelectedHub] = useState<StoreHub>(GHANA_HUBS[0]);
  const [selectedDate, setSelectedDate] = useState<string>("Today");
  const [selectedSlot, setSelectedSlot] = useState<string>(GHANA_HUBS[0].slots[0]);

  // Contact Info
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceSerial, setDeviceSerial] = useState("");
  const [notes, setNotes] = useState("");

  // Confirmation Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    hub: StoreHub;
    date: string;
    slot: string;
    device: string;
    issue: string;
  } | null>(null);

  const dates = ["Today", "Tomorrow", "Thursday", "Friday", "Saturday"];

  const handleBookAppointment = () => {
    if (!customerName.trim() || !phone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Contact Details Required", "Please enter your name and phone number for SMS/WhatsApp verification.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsSubmitting(false);
      const randomRef = `GB-GH-${Math.floor(1000 + Math.random() * 9000)}`;
      setConfirmedBooking({
        reference: randomRef,
        hub: selectedHub,
        date: selectedDate,
        slot: selectedSlot,
        device: DEVICE_CATEGORIES.find((d) => d.id === selectedDevice)?.name || "Apple Device",
        issue: ISSUE_TYPES.find((i) => i.id === selectedIssue)?.label || "Hardware Diagnostic"
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Genius Bar Support</Text>
          <Pressable
            onPress={() => router.push("/today-at-apple" as any)}
            style={({ pressed }) => [styles.workshopsLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.workshopsLinkText}>Workshops</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.scrollContentDesktop
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.geniusBadge}>
              <Ionicons name="construct" size={14} color="#0066CC" />
              <Text style={styles.geniusBadgeText}>OFFICIAL CERTIFIED HARDWARE REPAIR · GHANA</Text>
            </View>
            <Text style={styles.heroHeadline}>Expert Apple support in person.</Text>
            <Text style={styles.heroSubtext}>
              Book a one-on-one diagnostic session with an Apple Certified Technician at our
              LESTRADES_UCC CAPE COAST lounge. Genuine Apple parts guaranteed.
            </Text>
          </View>

          {/* Quick Hub Navigator Pill */}
          <View style={styles.switcherRow}>
            <View style={styles.activePill}>
              <Ionicons name="hammer-outline" size={16} color="#FFFFFF" />
              <Text style={styles.activePillText}>Genius Bar (Repairs)</Text>
            </View>
            <Pressable
              onPress={() => router.push("/today-at-apple" as any)}
              style={styles.idlePill}
            >
              <Ionicons name="color-palette-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.idlePillText}>Today at LesTrades</Text>
            </Pressable>
          </View>

          {/* Step 1: Select Hardware Category */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Which device needs service?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {DEVICE_CATEGORIES.map((cat) => {
                const isActive = selectedDevice === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setSelectedDevice(cat.id);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.deviceTile, isActive && styles.deviceTileActive]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={24}
                      color={isActive ? "#0066CC" : colors.text}
                    />
                    <Text style={[styles.deviceTileText, isActive && styles.deviceTileTextActive]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Step 2: Choose Issue */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. What issue are you experiencing?</Text>
            <View style={styles.issueList}>
              {ISSUE_TYPES.map((issue) => {
                const isActive = selectedIssue === issue.id;
                return (
                  <Pressable
                    key={issue.id}
                    onPress={() => {
                      setSelectedIssue(issue.id);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.issueCard, isActive && styles.issueCardActive]}
                  >
                    <View style={styles.issueRadioRow}>
                      <View style={[styles.radioCircle, isActive && styles.radioCircleActive]} />
                      <Text style={[styles.issueLabel, isActive && styles.issueLabelActive]}>
                        {issue.label}
                      </Text>
                    </View>
                    <Text style={styles.estTimeBadge}>{issue.estTime}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Step 3: Select Ghana Hub */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Select an Apple Hub in Ghana</Text>
            <View style={styles.hubList}>
              {GHANA_HUBS.map((hub) => {
                const isActive = selectedHub.id === hub.id;
                return (
                  <Pressable
                    key={hub.id}
                    onPress={() => {
                      setSelectedHub(hub);
                      setSelectedSlot(hub.slots[0]);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.hubCard, isActive && styles.hubCardActive]}
                  >
                    <View style={styles.hubHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.hubName, isActive && styles.hubNameActive]}>
                          {hub.name}
                        </Text>
                        <Text style={styles.hubAddress}>{hub.address}</Text>
                        <Text style={styles.hubLandmark}>📍 {hub.landmark}</Text>
                      </View>
                      <View style={[styles.hubCheckCircle, isActive && styles.hubCheckCircleActive]}>
                        <Ionicons
                          name={isActive ? "checkmark" : "chevron-forward"}
                          size={14}
                          color={isActive ? "#FFFFFF" : colors.textTertiary}
                        />
                      </View>
                    </View>
                    <Text style={styles.hubHours}>{hub.hours}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Step 4: Pick Date & Time */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>4. Preferred Date & Time Slot</Text>

            {/* Date Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {dates.map((d) => {
                const isSelected = selectedDate === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      setSelectedDate(d);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.datePill, isSelected && styles.datePillActive]}
                  >
                    <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <Text style={styles.subSectionTitle}>Available Slots at {selectedHub.city}</Text>
            <View style={styles.slotsGrid}>
              {selectedHub.slots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => {
                      setSelectedSlot(slot);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.slotPill, isSelected && styles.slotPillActive]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={isSelected ? "#FFFFFF" : colors.text}
                    />
                    <Text style={[styles.slotPillText, isSelected && styles.slotPillTextActive]}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Step 5: Contact Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>5. Your Details (For SMS & WhatsApp Pass)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="e.g. Kwame Mensah"
                placeholderTextColor={colors.textTertiary}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghana Phone Number (MTN / Telecel / AT) *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 024 123 4567"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Device Serial / IMEI (Optional)</Text>
              <TextInput
                value={deviceSerial}
                onChangeText={setDeviceSerial}
                placeholder="e.g. F2LL80R0Q2 (from Settings > General > About)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes / Symptom Description</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Describe when the issue occurs..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                style={[styles.textInput, { height: 76, paddingTop: 10 }]}
              />
            </View>

            <Pressable
              onPress={handleBookAppointment}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                isSubmitting && { opacity: 0.6 },
                pressed && { opacity: 0.85 }
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Genius Bar Appointment</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>

        {/* Confirmation Modal */}
        <Modal
          visible={!!confirmedBooking}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setConfirmedBooking(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalCheckCircle}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>Appointment Confirmed</Text>
              <Text style={styles.modalSubtitle}>
                Your reservation at {confirmedBooking?.hub.name} has been booked.
              </Text>
            </View>

            {/* Apple Ticket Pass */}
            <View style={styles.ticketPass}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketBrand}>GENIUS BAR RESERVATION</Text>
                <Text style={styles.ticketRef}>{confirmedBooking?.reference}</Text>
              </View>

              <View style={styles.ticketBody}>
                <View style={styles.ticketField}>
                  <Text style={styles.ticketFieldLabel}>DEVICE & ISSUE</Text>
                  <Text style={styles.ticketFieldValue}>{confirmedBooking?.device}</Text>
                  <Text style={styles.ticketFieldSub}>{confirmedBooking?.issue}</Text>
                </View>

                <View style={styles.ticketField}>
                  <Text style={styles.ticketFieldLabel}>DATE & TIME</Text>
                  <Text style={styles.ticketFieldValue}>
                    {confirmedBooking?.date} at {confirmedBooking?.slot}
                  </Text>
                </View>

                <View style={styles.ticketField}>
                  <Text style={styles.ticketFieldLabel}>LOCATION</Text>
                  <Text style={styles.ticketFieldValue}>{confirmedBooking?.hub.name}</Text>
                  <Text style={styles.ticketFieldSub}>{confirmedBooking?.hub.address}</Text>
                </View>
              </View>

              <View style={styles.ticketFooter}>
                <Text style={styles.ticketInstructions}>
                  Please back up your device before arriving. Bring a valid Ghana Card.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActionGroup}>
              <Pressable
                onPress={() => {
                  Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => { });
                }}
                style={styles.whatsappBtn}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappBtnText}>Send Pass to WhatsApp</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setConfirmedBooking(null);
                  router.push("/(tabs)/shop");
                }}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  backBtnText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.fontFamily.medium
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  workshopsLink: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  workshopsLinkText: {
    fontSize: 14,
    color: "#0066CC",
    fontFamily: typography.fontFamily.semibold
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  scrollContentDesktop: {
    maxWidth: 760,
    alignSelf: "center",
    width: "100%"
  },
  heroBanner: {
    paddingVertical: 24,
    alignItems: "flex-start"
  },
  geniusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12
  },
  geniusBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: "#0066CC",
    letterSpacing: 0.5
  },
  heroHeadline: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: 8
  },
  heroSubtext: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 22
  },
  switcherRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 20
  },
  activePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.text,
    paddingVertical: 10,
    borderRadius: radius.pill
  },
  activePillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  idlePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10
  },
  idlePillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    letterSpacing: -0.2
  },
  subSectionTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 18,
    marginBottom: 10
  },
  deviceTile: {
    alignItems: "center",
    justifyContent: "center",
    width: 86,
    height: 86,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    padding: 8
  },
  deviceTileActive: {
    borderColor: "#0066CC",
    backgroundColor: "rgba(0, 102, 204, 0.04)"
  },
  deviceTileText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
    marginTop: 6
  },
  deviceTileTextActive: {
    color: "#0066CC",
    fontFamily: typography.fontFamily.semibold
  },
  issueList: {
    gap: 8,
    marginTop: 12
  },
  issueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  issueCardActive: {
    borderColor: colors.text,
    backgroundColor: "#FBFBFC"
  },
  issueRadioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textTertiary
  },
  radioCircleActive: {
    borderColor: colors.text,
    backgroundColor: colors.text
  },
  issueLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  issueLabelActive: {
    fontFamily: typography.fontFamily.semibold
  },
  estTimeBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary
  },
  hubList: {
    gap: 10,
    marginTop: 12
  },
  hubCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  hubCardActive: {
    borderColor: "#0066CC",
    backgroundColor: "#FAFBFD"
  },
  hubHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  hubName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.text
  },
  hubNameActive: {
    color: "#0066CC"
  },
  hubAddress: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2
  },
  hubLandmark: {
    fontSize: 12,
    color: "#0066CC",
    marginTop: 4
  },
  hubCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  hubCheckCircleActive: {
    backgroundColor: "#0066CC"
  },
  hubHours: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  datePillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  datePillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  datePillTextActive: {
    color: "#FFFFFF",
    fontFamily: typography.fontFamily.semibold
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  slotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border
  },
  slotPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  slotPillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  slotPillTextActive: {
    color: "#FFFFFF",
    fontFamily: typography.fontFamily.semibold
  },
  inputGroup: {
    marginTop: 14
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 6
  },
  textInput: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text
  },
  submitBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: "#0066CC",
    alignItems: "center",
    justifyContent: "center"
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center"
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24
  },
  modalCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.text
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4
  },
  ticketPass: {
    backgroundColor: "#1D1D1F",
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 24
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingBottom: 12,
    marginBottom: 12
  },
  ticketBrand: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 1
  },
  ticketRef: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  ticketBody: {
    gap: 12
  },
  ticketField: {},
  ticketFieldLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.5
  },
  ticketFieldValue: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    marginTop: 2
  },
  ticketFieldSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 1
  },
  ticketFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 12,
    marginTop: 14
  },
  ticketInstructions: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.65)",
    lineHeight: 15
  },
  modalActionGroup: {
    gap: 10
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#25D366"
  },
  whatsappBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  doneBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  doneBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  }
});
