/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on menu row press
 * - Haptics.notificationAsync("warning") on sign out confirmation
 */
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, typography } from "../../constants/theme";
import { useUserStore } from "../../store/useUserStore";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";

export default function AccountScreen() {
  const router = useRouter();
  const { name, phone, email, addresses, logout } = useUserStore();
  const { clearCart } = useCartStore();
  const { clear: clearWishlist } = useWishlistStore();

  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const initialLetter = (name || "G").charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          logout();
          clearCart();
          clearWishlist();
          router.replace("/(tabs)");
        }
      }
    ]);
  };

  const handleRowPress = (action?: () => void, stubTitle?: string) => {
    Haptics.selectionAsync();
    if (action) {
      action();
    } else if (stubTitle) {
      Alert.alert(stubTitle, "This feature will be available in the next release.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* 2. Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || "Guest User"}</Text>
            <Text style={styles.profileContact}>
              {phone || email || "guest@istore.com.gh"}
            </Text>
          </View>
        </View>

        {/* 3. Menu Groups */}

        {/* GROUP 1: SHOPPING */}
        <Text style={styles.groupLabel}>SHOPPING</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(() => router.push("/orders"))}
          >
            <Ionicons name="cube-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>My Orders</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(() => router.push("/wishlist"))}
          >
            <Ionicons name="heart-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Wishlist</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(() => setAddressModalVisible(true))}
          >
            <Ionicons name="location-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Addresses</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* GROUP 2: PREFERENCES */}
        <Text style={styles.groupLabel}>PREFERENCES</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Language")}
          >
            <Ionicons name="globe-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Language</Text>
            <View style={styles.rowRight}>
              <Text style={styles.valueText}>English</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Currency")}
          >
            <Ionicons name="cash-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Currency</Text>
            <View style={styles.rowRight}>
              <Text style={styles.valueText}>GHS (₵)</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        {/* GROUP 3: SUPPORT */}
        <Text style={styles.groupLabel}>SUPPORT</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Help Center")}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Help Center</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Contact Us")}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* GROUP 4: ABOUT */}
        <Text style={styles.groupLabel}>ABOUT</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Terms of Service")}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            onPress={() => handleRowPress(undefined, "Privacy Policy")}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.menuRow}>
            <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
            <Text style={styles.menuLabel}>App Version</Text>
            <Text style={styles.valueText}>1.0.0</Text>
          </View>
        </View>

        {/* 4. Sign Out Button */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutBtn,
            pressed && { opacity: 0.6 }
          ]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      {/* Address Management Modal Stub */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <SafeAreaView style={styles.addressModalContainer}>
          <View style={styles.addressModalHeader}>
            <Text style={styles.addressModalTitle}>Saved Addresses</Text>
            <Pressable
              hitSlop={12}
              onPress={() => setAddressModalVisible(false)}
            >
              <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {addresses.map((addr, idx) => (
              <View key={idx} style={styles.addressCard}>
                <View style={styles.addressBadgeRow}>
                  <Text style={styles.addressName}>{addr.fullName}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText}>{addr.phone}</Text>
                <Text style={styles.addressText}>
                  {addr.city}, {addr.region}
                </Text>
                {addr.landmark ? (
                  <Text style={styles.addressSub}>{addr.landmark}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scrollContent: {
    paddingBottom: 40
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.text
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center"
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14
  },
  profileName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text
  },
  profileContact: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginLeft: 28,
    marginBottom: 8,
    marginTop: 24
  },
  groupContainer: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  rowPressed: {
    backgroundColor: colors.surface
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 14,
    fontWeight: "400"
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  valueText: {
    fontSize: 15,
    color: colors.textSecondary
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52
  },
  signOutBtn: {
    marginTop: 32,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12
  },
  signOutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600"
  },
  addressModalContainer: {
    flex: 1,
    backgroundColor: colors.background
  },
  addressModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  addressCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12
  },
  addressBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text
  },
  defaultBadge: {
    backgroundColor: "rgba(0, 113, 227, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 980
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2
  },
  addressSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  }
});
