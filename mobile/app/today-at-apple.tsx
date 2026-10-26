import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../constants/theme";
import { SUPPORT_WHATSAPP_URL } from "../constants/support";

interface WorkshopSession {
  id: string;
  category: "Photography" | "Coding" | "Art & Design" | "Fitness" | "Youth";
  title: string;
  tagline: string;
  duration: string;
  level: "All Levels" | "Beginner" | "Intermediate" | "Pro";
  hub: string;
  address: string;
  schedule: string;
  availableSeats: number;
  instructor: string;
  instructorRole: string;
  description: string;
  deviceProvided: boolean;
}

const SESSIONS: WorkshopSession[] = [
  {
    id: "campus-creative-ucc",
    category: "Photography",
    title: "Campus Creative: Coastal Light & 4K Cinema on iPhone 16 Pro",
    tagline: "Frame Cape Coast's coastal horizons and historic architecture with ProRAW.",
    duration: "90 min",
    level: "All Levels",
    hub: "LESTRADES_UCC CAPE COAST",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    schedule: "Saturday · 3:30 PM – 5:00 PM",
    availableSeats: 12,
    instructor: "Kofi Ansah & Campus Media Fellows",
    instructorRole: "Apple Creative Lead & Documentarian",
    description:
      "Join us at LESTRADES_UCC CAPE COAST for an interactive masterclass exploring dynamic perspectives, cinematic audio mix, and portrait depth maps across the university campus and coastal vistas.",
    deviceProvided: true
  },
  {
    id: "swift-student-lab-ucc",
    category: "Coding",
    title: "Swift Lab: Building iOS Apps with SwiftUI & Apple Silicon",
    tagline: "Hands-on app architecture on M4 Mac workstations at UCC campus.",
    duration: "75 min",
    level: "Intermediate",
    hub: "LESTRADES_UCC CAPE COAST",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    schedule: "Thursday · 5:00 PM – 6:15 PM",
    availableSeats: 10,
    instructor: "Esinam Dogbe",
    instructorRole: "Senior iOS Engineer & Tech Mentor",
    description:
      "A hands-on engineering workshop at LESTRADES_UCC CAPE COAST. Dive into modern Swift async/await, Instruments profiling, and building responsive native mobile experiences.",
    deviceProvided: true
  },
  {
    id: "digital-art-ipad-ucc",
    category: "Art & Design",
    title: "Art Lab: Digital Lettering & Ghanaian Motifs on iPad Pro",
    tagline: "Blend Adinkra geometry with typography using Apple Pencil Pro.",
    duration: "60 min",
    level: "All Levels",
    hub: "LESTRADES_UCC CAPE COAST",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    schedule: "Sunday · 2:00 PM – 3:00 PM",
    availableSeats: 8,
    instructor: "Nana Yaa",
    instructorRole: "Visual Artist & Procreate Specialist",
    description:
      "Learn stroke dynamics, pressure curves, and vector shading with the new Apple Pencil Pro on Ultra Retina XDR displays at LESTRADES_UCC CAPE COAST.",
    deviceProvided: true
  },
  {
    id: "apple-watch-vitality",
    category: "Fitness",
    title: "Health & Fitness: Tracking Vitals in the Tropics",
    tagline: "Master Heart Rate Zones, ECG, Workout Metrics & Sleep Stages.",
    duration: "45 min",
    level: "Beginner",
    hub: "LESTRADES_UCC CAPE COAST",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    schedule: "Saturday · 9:30 AM – 10:15 AM",
    availableSeats: 12,
    instructor: "Dr. Kwesi Appiah",
    instructorRole: "Sports Physician & Health Advocate",
    description:
      "Optimize your daily wellness routine with Apple Watch Ultra and Series 10. Understand cardiovascular health metrics, recovery intervals, and staying hydrated in Ghana's climate.",
    deviceProvided: false
  },
  {
    id: "kids-playgrounds",
    category: "Youth",
    title: "Kids Hour: Make Your First Interactive Animation",
    tagline: "Code Byte the character through puzzle worlds with Swift Playgrounds.",
    duration: "60 min",
    level: "Beginner",
    hub: "LESTRADES_UCC CAPE COAST",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    schedule: "Saturday · 11:00 AM – 12:00 PM",
    availableSeats: 8,
    instructor: "Abena Serwaa",
    instructorRole: "Youth STEM Educator",
    description:
      "Designed for young creators aged 8–14. Kids will learn commands, loops, and conditional logic by animating colorful worlds on iPad at LESTRADES_UCC CAPE COAST.",
    deviceProvided: true
  }
];

export default function TodayAtAppleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSession, setSelectedSession] = useState<WorkshopSession | null>(null);

  // RSVP Modal
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState<{
    passId: string;
    session: WorkshopSession;
  } | null>(null);

  const categories = ["All", "Photography", "Coding", "Art & Design", "Fitness", "Youth"];

  const filteredSessions = SESSIONS.filter(
    (s) => selectedCategory === "All" || s.category === selectedCategory
  );

  const handleOpenRsvp = (session: WorkshopSession) => {
    setSelectedSession(session);
    setRsvpModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmRsvp = () => {
    if (!attendeeName.trim() || !attendeePhone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Information Required", "Please enter your name and phone number for attendance confirmation.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsSubmitting(false);
      const randomCode = `TAA-GH-${Math.floor(1000 + Math.random() * 9000)}`;
      setConfirmedPass({
        passId: randomCode,
        session: selectedSession!
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
        <Text style={styles.headerTitle}>Today at LesTrades</Text>
        <Pressable
          onPress={() => router.push("/genius-bar" as any)}
          style={({ pressed }) => [styles.geniusLink, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.geniusLinkText}>Genius Bar</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLargeScreen && styles.scrollContentDesktop
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#0066CC" />
            <Text style={styles.heroBadgeText}>FREE IN-PERSON WORKSHOPS · UCC CAPE COAST</Text>
          </View>
          <Text style={styles.heroHeadline}>Inspiring sessions created for everyday genius.</Text>
          <Text style={styles.heroSubtext}>
            Join hands-on creative labs led by LesTrades Specialists and guest creators at
            LESTRADES_UCC CAPE COAST. Complimentary Apple devices provided.
          </Text>
        </View>

        {/* Switcher Tab */}
        <View style={styles.switcherRow}>
          <Pressable
            onPress={() => router.push("/genius-bar" as any)}
            style={styles.idlePill}
          >
            <Ionicons name="hammer-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.idlePillText}>Genius Bar (Repairs)</Text>
          </Pressable>
          <View style={styles.activePill}>
            <Ionicons name="color-palette-outline" size={16} color="#FFFFFF" />
            <Text style={styles.activePillText}>Today at LesTrades</Text>
          </View>
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {categories.map((c) => {
            const isActive = selectedCategory === c;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  setSelectedCategory(c);
                  Haptics.selectionAsync();
                }}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sessions List */}
        <View style={styles.sessionsContainer}>
          {filteredSessions.map((session, index) => (
            <Animated.View
              key={session.id}
              entering={FadeInDown.delay(index * 80).duration(320)}
              style={styles.sessionCard}
            >
              {/* Category & Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{session.category.toUpperCase()}</Text>
                </View>
                <View style={styles.seatsBadge}>
                  <Ionicons name="people-outline" size={13} color="#0066CC" />
                  <Text style={styles.seatsBadgeText}>{session.availableSeats} seats left</Text>
                </View>
              </View>

              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionTagline}>{session.tagline}</Text>

              {/* Hub & Schedule Info */}
              <View style={styles.sessionMetaBox}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.text} />
                  <Text style={styles.metaText}>{session.schedule}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="business-outline" size={16} color={colors.text} />
                  <Text style={styles.metaText}>{session.hub}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaSubText}>
                    {session.duration} · {session.level} · {session.deviceProvided ? "Devices provided" : "Bring device"}
                  </Text>
                </View>
              </View>

              {/* Instructor */}
              <View style={styles.instructorRow}>
                <View style={styles.instructorAvatar}>
                  <Text style={styles.instructorInitial}>{session.instructor.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.instructorName}>{session.instructor}</Text>
                  <Text style={styles.instructorRole}>{session.instructorRole}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardFooter}>
                <Text style={styles.freeBadge}>FREE ADMISSION</Text>
                <Pressable
                  onPress={() => handleOpenRsvp(session)}
                  style={({ pressed }) => [styles.rsvpBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.rsvpBtnText}>Reserve Spot</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* RSVP Modal */}
      <Modal
        visible={rsvpModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setRsvpModalVisible(false);
          setConfirmedPass(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          {!confirmedPass ? (
            <ScrollView contentContainerStyle={styles.rsvpSheetContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Reserve Your Spot</Text>
              <Text style={styles.sheetSessionName}>{selectedSession?.title}</Text>
              <Text style={styles.sheetHubName}>{selectedSession?.hub}</Text>
              <Text style={styles.sheetScheduleText}>{selectedSession?.schedule}</Text>

              <View style={styles.sheetDivider} />

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Full Name *</Text>
                <TextInput
                  value={attendeeName}
                  onChangeText={setAttendeeName}
                  placeholder="e.g. Ama Serwaa"
                  placeholderTextColor={colors.textTertiary}
                  style={styles.sheetInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ghana Phone Number (MTN / Telecel / AT) *</Text>
                <TextInput
                  value={attendeePhone}
                  onChangeText={setAttendeePhone}
                  placeholder="e.g. 054 987 6543"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  style={styles.sheetInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address (For Calendar Invite)</Text>
                <TextInput
                  value={attendeeEmail}
                  onChangeText={setAttendeeEmail}
                  placeholder="e.g. ama@gmail.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.sheetInput}
                />
              </View>

              <Pressable
                onPress={handleConfirmRsvp}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.confirmRsvpBtn,
                  isSubmitting && { opacity: 0.6 },
                  pressed && { opacity: 0.85 }
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRsvpBtnText}>Confirm Free RSVP</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setRsvpModalVisible(false)}
                style={styles.cancelSheetBtn}
              >
                <Text style={styles.cancelSheetBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          ) : (
            /* Digital Wallet Workshop Pass */
            <View style={styles.passSuccessContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.passSuccessTitle}>You're Registered!</Text>
              <Text style={styles.passSuccessSub}>
                We've reserved a workstation and seat for you.
              </Text>

              {/* Wallet Card */}
              <View style={styles.walletPassCard}>
                <View style={styles.walletTopBar}>
                  <Text style={styles.walletBrand}>TODAY AT LESTRADES · WORKSHOP PASS</Text>
                  <Text style={styles.walletCode}>{confirmedPass.passId}</Text>
                </View>

                <Text style={styles.passTitle}>{confirmedPass.session.title}</Text>

                <View style={styles.passInfoBlock}>
                  <Text style={styles.passLabel}>DATE & TIME</Text>
                  <Text style={styles.passValue}>{confirmedPass.session.schedule}</Text>
                </View>

                <View style={styles.passInfoBlock}>
                  <Text style={styles.passLabel}>LOCATION</Text>
                  <Text style={styles.passValue}>{confirmedPass.session.hub}</Text>
                  <Text style={styles.passSubValue}>{confirmedPass.session.address}</Text>
                </View>

                <View style={styles.passInfoBlock}>
                  <Text style={styles.passLabel}>ATTENDEE</Text>
                  <Text style={styles.passValue}>{attendeeName}</Text>
                </View>

                <View style={styles.passBarcodeStub}>
                  <Ionicons name="qr-code-outline" size={42} color="#FFFFFF" />
                  <Text style={styles.barcodeHelp}>Present QR at Forum entrance</Text>
                </View>
              </View>

              <View style={styles.passActions}>
                <Pressable
                  onPress={() => {
                    Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {});
                  }}
                  style={styles.shareWhatsappBtn}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.shareWhatsappBtnText}>Send Pass to WhatsApp</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setRsvpModalVisible(false);
                    setConfirmedPass(null);
                  }}
                  style={styles.doneModalBtn}
                >
                  <Text style={styles.doneModalBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
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
  geniusLink: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  geniusLinkText: {
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
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12
  },
  heroBadgeText: {
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
  categoriesScroll: {
    marginBottom: 20
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  categoryPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  categoryPillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontFamily: typography.fontFamily.semibold
  },
  sessionsContainer: {
    gap: 18
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  catBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm
  },
  catBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  seatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  seatsBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: "#0066CC"
  },
  sessionTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 6
  },
  sessionTagline: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14
  },
  sessionMetaBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
    marginBottom: 14
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  metaText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  metaSubText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16
  },
  instructorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center"
  },
  instructorInitial: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  instructorName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  instructorRole: {
    fontSize: 11,
    color: colors.textSecondary
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 14
  },
  freeBadge: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: "#34C759",
    letterSpacing: 0.5
  },
  rsvpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0066CC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill
  },
  rsvpBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  rsvpSheetContent: {
    paddingBottom: 40
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 18
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    letterSpacing: -0.4
  },
  sheetSessionName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semibold,
    color: "#0066CC",
    marginTop: 6
  },
  sheetHubName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  sheetScheduleText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
    marginTop: 2
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18
  },
  formGroup: {
    marginBottom: 14
  },
  formLabel: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 6
  },
  sheetInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text
  },
  confirmRsvpBtn: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: "#0066CC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12
  },
  confirmRsvpBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  cancelSheetBtn: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8
  },
  cancelSheetBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium
  },
  passSuccessContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  passSuccessTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.text
  },
  passSuccessSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20
  },
  walletPassCard: {
    width: "100%",
    backgroundColor: "#1D1D1F",
    borderRadius: radius.lg,
    padding: 20,
    gap: 12
  },
  walletTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    paddingBottom: 10
  },
  walletBrand: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 0.5
  },
  walletCode: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  passTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  passInfoBlock: {},
  passLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.5
  },
  passValue: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    marginTop: 2
  },
  passSubValue: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)"
  },
  passBarcodeStub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 12,
    marginTop: 6
  },
  barcodeHelp: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)"
  },
  passActions: {
    width: "100%",
    gap: 10,
    marginTop: 20
  },
  shareWhatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#25D366"
  },
  shareWhatsappBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  doneModalBtn: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  doneModalBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  }
});
