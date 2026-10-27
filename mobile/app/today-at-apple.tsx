import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { WorkshopEvent, getWorkshopEvents, registerForWorkshop } from "../services/servicesApi";

type Session = WorkshopEvent;

export default function TodayAtAppleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Live workshops from the store
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // RSVP Modal
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedPass, setConfirmedPass] = useState<{
    passId: string;
    session: Session;
  } | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoadError(null);
    try {
      const events = await getWorkshopEvents();
      setSessions(events);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Could not reach the workshop schedule.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(sessions.map((s) => s.category)))],
    [sessions]
  );

  const filteredSessions = sessions.filter(
    (s) => selectedCategory === "All" || s.category === selectedCategory
  );

  const handleOpenRsvp = (session: Session) => {
    setSelectedSession(session);
    setSubmitError(null);
    setRsvpModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmRsvp = async () => {
    if (!attendeeName.trim() || !attendeePhone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Information Required", "Please enter your name and phone number for attendance confirmation.");
      return;
    }
    if (!selectedSession) return;

    setIsSubmitting(true);
    setSubmitError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const registration = await registerForWorkshop({
        attendeeName: attendeeName.trim(),
        attendeePhone: attendeePhone.trim(),
        attendeeEmail: attendeeEmail.trim() || undefined,
        sessionId: selectedSession.id,
        sessionTitle: selectedSession.title
      });
      setConfirmedPass({ passId: registration.passId, session: selectedSession });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, availableSeats: Math.max(0, s.availableSeats - 1) }
            : s
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Could not reserve your spot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchSessions();
            }}
            tintColor={colors.text}
          />
        }
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

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={styles.stateText}>Loading the workshop schedule…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={30} color={colors.textSecondary} />
            <Text style={styles.stateTitle}>Couldn’t load workshops</Text>
            <Text style={styles.stateText}>{loadError}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                fetchSessions();
              }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="calendar-outline" size={30} color={colors.textSecondary} />
            <Text style={styles.stateTitle}>No workshops scheduled right now</Text>
            <Text style={styles.stateText}>
              New Today at LesTrades sessions appear here as soon as the store publishes them.
              Pull down to refresh.
            </Text>
          </View>
        ) : (
          <>
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
                {session.availableSeats > 0 ? (
                  <Pressable
                    onPress={() => handleOpenRsvp(session)}
                    style={({ pressed }) => [styles.rsvpBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={styles.rsvpBtnText}>Reserve Spot</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </Pressable>
                ) : (
                  <View style={styles.fullPill}>
                    <Text style={styles.fullPillText}>FULL</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
        </View>
          </>
        )}
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

              {submitError ? (
                <Text style={styles.submitErrorText}>{submitError}</Text>
              ) : null}

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
              <Text style={styles.passSuccessTitle}>{"You're Registered!"}</Text>
              <Text style={styles.passSuccessSub}>
                {"We've reserved a workstation and seat for you."}
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
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8
  },
  stateTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginTop: 6,
    textAlign: "center"
  },
  stateText: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20
  },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.text
  },
  retryBtnText: { fontSize: 13.5, fontFamily: typography.fontFamily.semibold, color: "#FFFFFF" },
  fullPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface
  },
  fullPillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  submitErrorText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: "#C40000",
    marginTop: 10,
    textAlign: "center"
  }
});
