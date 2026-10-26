import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
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
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useUserStore } from "../store/useUserStore";
import { updateProfile, uploadAvatar } from "../services/api";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const hydrate = useUserStore((s) => s.hydrate);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.emptyText}>You are browsing as a guest. Sign in to manage your profile.</Text>
        <Pressable style={styles.signInBtn} onPress={() => router.push("/(auth)/login" as never)}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  const handlePickAvatar = async () => {
    Haptics.selectionAsync();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos Access Needed", "Allow LesTrades to access your photos so you can pick a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";

    try {
      setUploading(true);
      const data = await uploadAvatar({
        uri: asset.uri,
        name: `avatar-${Date.now()}.${ext}`,
        type: mimeType
      });
      await hydrate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert(
        "Upload Failed",
        err instanceof Error ? err.message : "Could not upload your photo. Check your connection and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (cleanName.length < 2) {
      Alert.alert("Invalid Name", "Please enter your full name (at least 2 characters).");
      return;
    }
    if (cleanPhone && !/^(\+233|0)[0-9]{9}$/.test(cleanPhone)) {
      Alert.alert("Invalid Phone", "Enter a Ghanaian phone number, e.g. 0242826590 or +233242826590.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: cleanName, phone: cleanPhone || undefined });
      await hydrate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Profile Updated", "Your details have been saved.");
    } catch (err) {
      Alert.alert(
        "Save Failed",
        err instanceof Error ? err.message : "Could not save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          hitSlop={10}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.brandAccent} />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} disabled={uploading} style={styles.avatarWrap}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap the camera to change your photo</Text>
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0242826590"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readonlyRow}>
              <Ionicons name="mail-outline" size={15} color={colors.textTertiary} />
              <Text style={styles.readonlyText}>{user.email || "No email linked"}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
              saving && { opacity: 0.6 }
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarWrap: { position: "relative" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: { fontSize: 38, fontWeight: "700", color: "#FFFFFF" },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brandAccent,
    borderWidth: 2.5,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarHint: { fontSize: 12, color: colors.textSecondary, marginTop: 10 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16
  },
  field: { gap: 6 },
  label: { ...typography.subheadline, fontWeight: "600", color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text
  },
  readonlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12
  },
  readonlyText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  saveBtnText: { ...typography.headline, color: "#FFFFFF", fontWeight: "700" },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32
  },
  signInBtn: {
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radius.pill
  },
  signInBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 }
});
