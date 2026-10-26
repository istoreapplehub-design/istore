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
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius, theme } from "../../constants/theme";
import {
  TodayEvent,
  WorkshopRegistration,
  createTodayEvent,
  deleteTodayEvent,
  getTodayEvents,
  getWorkshopRegistrations
} from "../../services/adminServicesApi";

const CATEGORIES = ["Photography", "Coding", "Art & Design", "Fitness", "Youth"];
const LEVELS = ["All Levels", "Beginner", "Intermediate", "Pro"];

const EMPTY_FORM = {
  title: "",
  schedule: "",
  category: "Photography",
  tagline: "",
  duration: "60 min",
  level: "All Levels",
  seats: "10",
  instructor: "",
  instructorRole: "",
  description: ""
};

export default function AdminEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<"workshops" | "rsvps">("workshops");
  const [events, setEvents] = useState<TodayEvent[]>([]);
  const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deviceProvided, setDeviceProvided] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [evs, regs] = await Promise.all([getTodayEvents(), getWorkshopRegistrations()]);
      setEvents(evs);
      setRegistrations(regs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.schedule.trim()) {
      setFormError("Title and schedule are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createTodayEvent({
        ...form,
        seats: Number(form.seats) || 10,
        deviceProvided
      });
      setEvents((prev) => [created, ...prev]);
      setFormVisible(false);
      setForm(EMPTY_FORM);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not create the workshop");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ev: TodayEvent) => {
    Haptics.selectionAsync();
    Alert.alert("Remove Workshop", `Delete “${ev.title}”? Registered attendees keep their pass reference.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTodayEvent(ev.id);
            setEvents((prev) => prev.filter((e) => e.id !== ev.id));
          } catch (err: unknown) {
            Alert.alert("Delete Failed", err instanceof Error ? err.message : "Could not delete the workshop");
          }
        }
      }
    ]);
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
            <Text style={styles.title}>Today at LesTrades</Text>
            <Text style={styles.subtitle}>Workshops · UCC Cape Coast</Text>
          </View>
          <Pressable onPress={() => router.push("/admin/genius-bar")} style={styles.geniusBtn}>
            <Ionicons name="hammer-outline" size={16} color={colors.text} />
            <Text style={styles.geniusBtnText}>Genius Bar</Text>
          </Pressable>
        </View>

        <View style={styles.switcher}>
          {(["workshops", "rsvps"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
              style={[styles.switchPill, tab === t && styles.switchPillActive]}
            >
              <Text style={[styles.switchText, tab === t && styles.switchTextActive]}>
                {t === "workshops" ? `Workshops (${events.length})` : `RSVPs (${registrations.length})`}
              </Text>
            </Pressable>
          ))}
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
        ) : tab === "workshops" ? (
          <>
            <Pressable onPress={() => { Haptics.selectionAsync(); setFormVisible(true); }} style={styles.newBtn}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newBtnText}>New Workshop</Text>
            </Pressable>

            {events.length === 0 ? (
              <View style={styles.card}>
                <Ionicons name="color-palette-outline" size={28} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No workshops scheduled</Text>
                <Text style={styles.emptyText}>
                  Create your first session with “New Workshop”. It appears instantly in the customer app.
                </Text>
              </View>
            ) : (
              events.map((ev) => (
                <View key={ev.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{ev.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.seats}>
                      {ev.availableSeats}/{ev.totalSeats} seats left
                    </Text>
                  </View>
                  <Text style={styles.evTitle}>{ev.title}</Text>
                  <Text style={styles.evMeta}>{ev.schedule}</Text>
                  <Text style={styles.evMetaSub}>
                    {ev.duration} · {ev.level} · {ev.instructor}
                  </Text>
                  <View style={styles.hairline} />
                  <View style={styles.cardActions}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.instructorRole}>{ev.instructorRole}</Text>
                    </View>
                    <Pressable onPress={() => handleDelete(ev)} style={styles.deleteBtn} hitSlop={6}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      <Text style={styles.deleteBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        ) : registrations.length === 0 ? (
          <View style={styles.card}>
            <Ionicons name="people-outline" size={28} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No RSVPs yet</Text>
            <Text style={styles.emptyText}>
              Attendee registrations from the customer app land here with their pass reference.
            </Text>
          </View>
        ) : (
          registrations.map((r) => (
            <View key={r.passId} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.reference}>{r.passId}</Text>
                <View style={styles.confirmedChip}>
                  <Text style={styles.confirmedChipText}>CONFIRMED</Text>
                </View>
              </View>
              <Text style={styles.rsvpName}>{r.attendeeName}</Text>
              <Text style={styles.rsvpSession}>{r.sessionTitle}</Text>
              <View style={styles.hairline} />
              <Pressable
                onPress={() => Linking.openURL(`tel:${r.attendeePhone}`).catch(() => {})}
                style={styles.contactRow}
              >
                <Ionicons name="call-outline" size={15} color={colors.brandAccent} />
                <Text style={styles.contactText}>{r.attendeePhone}</Text>
                {r.attendeeEmail ? (
                  <>
                    <Ionicons name="mail-outline" size={15} color={colors.brandAccent} style={{ marginLeft: 14 }} />
                    <Text style={styles.contactText} numberOfLines={1}>{r.attendeeEmail}</Text>
                  </>
                ) : null}
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* New workshop modal */}
      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>New Workshop</Text>
          <Text style={styles.modalSub}>Published immediately to Today at LesTrades in the customer app.</Text>

          <ScrollView contentContainerStyle={{ paddingVertical: 16, gap: 12 }}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
              placeholder="e.g. iPhone Photography: Golden Hour at Cape Coast"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Schedule *</Text>
            <TextInput
              value={form.schedule}
              onChangeText={(t) => setForm((f) => ({ ...f, schedule: t }))}
              placeholder="e.g. Saturday · 3:30 PM – 5:00 PM"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.pickerRow}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setForm((f) => ({ ...f, category: c }))}
                  style={[styles.pickPill, form.category === c && styles.pickPillActive]}
                >
                  <Text style={[styles.pickText, form.category === c && styles.pickTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Level</Text>
            <View style={styles.pickerRow}>
              {LEVELS.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setForm((f) => ({ ...f, level: l }))}
                  style={[styles.pickPill, form.level === l && styles.pickPillActive]}
                >
                  <Text style={[styles.pickText, form.level === l && styles.pickTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Duration</Text>
                <TextInput
                  value={form.duration}
                  onChangeText={(t) => setForm((f) => ({ ...f, duration: t }))}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Seats</Text>
                <TextInput
                  value={form.seats}
                  onChangeText={(t) => setForm((f) => ({ ...f, seats: t }))}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Tagline</Text>
            <TextInput
              value={form.tagline}
              onChangeText={(t) => setForm((f) => ({ ...f, tagline: t }))}
              placeholder="One line shown under the title"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Instructor</Text>
            <TextInput
              value={form.instructor}
              onChangeText={(t) => setForm((f) => ({ ...f, instructor: t }))}
              placeholder="Name"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />
            <TextInput
              value={form.instructorRole}
              onChangeText={(t) => setForm((f) => ({ ...f, instructorRole: t }))}
              placeholder="Role, e.g. Senior iOS Engineer"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="What attendees will do and learn"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, styles.multiline]}
            />

            <Pressable
              onPress={() => setDeviceProvided((v) => !v)}
              style={styles.toggleRow}
            >
              <Text style={styles.fieldLabel} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Devices provided on-site</Text>
              </View>
              <View style={[styles.toggle, deviceProvided && styles.toggleOn]}>
                <View style={[styles.toggleKnob, deviceProvided && styles.toggleKnobOn]} />
              </View>
            </Pressable>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable onPress={() => setFormVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleCreate} disabled={saving} style={styles.publishBtn}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.publishBtnText}>Publish Workshop</Text>
              )}
            </Pressable>
          </View>
        </View>
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
  geniusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  geniusBtnText: { fontSize: 12.5, fontWeight: "600", color: colors.text },
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
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    borderRadius: radius.md,
    marginBottom: 16
  },
  newBtnText: { fontSize: 14.5, fontWeight: "700", color: "#FFFFFF" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catBadge: { backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: "700", color: colors.textSecondary, letterSpacing: 0.5 },
  seats: { fontSize: 12.5, fontWeight: "600", color: colors.brandAccent },
  evTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 10 },
  evMeta: { fontSize: 13.5, fontWeight: "600", color: colors.text, marginTop: 6 },
  evMetaSub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 12 },
  cardActions: { flexDirection: "row", alignItems: "center" },
  instructorRole: { fontSize: 12, color: colors.textSecondary },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(217, 45, 32, 0.3)"
  },
  deleteBtnText: { fontSize: 12, fontWeight: "700", color: colors.danger },
  reference: { fontFamily: "monospace", fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  confirmedChip: {
    backgroundColor: colors.brandRedSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  confirmedChipText: { fontSize: 10, fontWeight: "700", color: colors.brandAccent, letterSpacing: 0.4 },
  rsvpName: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 10 },
  rsvpSession: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactText: { fontSize: 13, color: colors.brandAccent, fontWeight: "600", flexShrink: 1 },
  modalBackdrop: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 14
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  fieldLabel: { fontSize: 12.5, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  input: {
    minHeight: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text
  },
  multiline: { height: 96, paddingTop: 10 },
  twoCol: { flexDirection: "row", gap: 12 },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  pickPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pickText: { fontSize: 12.5, fontWeight: "600", color: colors.textSecondary },
  pickTextActive: { color: "#FFFFFF" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 3
  },
  toggleOn: { backgroundColor: colors.accent },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start"
  },
  toggleKnobOn: { alignSelf: "flex-end" },
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
  publishBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  publishBtnText: { fontSize: 14.5, fontWeight: "700", color: "#FFFFFF" }
});
