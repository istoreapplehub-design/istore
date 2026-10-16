/**
 * Haptics Audit:
 * - Haptics.selectionAsync() on every menu row
 * - Haptics.notificationAsync("warning") on sign out confirmation
 */
import React, { useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useUserStore } from "../store/useUserStore";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { getMyOrders } from "../services/api";
import { getPreferences } from "../lib/preferences";
import { checkHasUnreadNotifications } from "../lib/notifications";
import { AppHaptics } from "../lib/haptics";

function Row({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  trailing
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      onPress={() => {
        if (!onPress) return;
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={colors.text} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {trailing}
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
      ) : null}
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, session, signOut } = useUserStore();
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clear);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [defaultRegion, setDefaultRegion] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const refresh = async () => {
    if (!session) return;
    const userId = useUserStore.getState().userId;
    const [orders, prefs, unread] = await Promise.all([
      userId
        ? getMyOrders(userId, { page: 1, limit: 1 })
            .then((res) => res.meta?.total ?? 0)
            .catch(() => null)
        : Promise.resolve(null),
      getPreferences(),
      userId ? checkHasUnreadNotifications(userId) : Promise.resolve(false)
    ]);
    setOrderCount(orders);
    setDefaultRegion(prefs.defaultRegion);
    setHasUnread(unread);
  };

  const onPullRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.gate}>
          <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.gateInner}>
            <Ionicons name="logo-apple" size={44} color={colors.text} />
            <Text style={styles.gateTitle}>Sign in to I-Store</Text>
            <Text style={styles.gateBody}>
              Your bag stays with you either way. Signing in unlocks the parts of I-Store
              that need to know who you are.
            </Text>

            <View style={styles.gatePerks}>
              {[
                { icon: "cube-outline" as const, text: "Track and cancel orders" },
                { icon: "heart-outline" as const, text: "Wishlist synced across devices" },
                { icon: "location-outline" as const, text: "Saved delivery addresses" },
                { icon: "notifications-outline" as const, text: "Delivery and price alerts" }
              ].map((perk) => (
                <View key={perk.text} style={styles.perkRow}>
                  <Ionicons name={perk.icon} size={17} color={colors.textSecondary} />
                  <Text style={styles.perkText}>{perk.text}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(auth)/login?returnTo=account");
              }}
            >
              <Text style={styles.primaryBtnText}>Sign In</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(auth)/register");
              }}
            >
              <Text style={styles.secondaryBtnText}>Create an account</Text>
            </Pressable>

            <Text style={styles.gateFootnote}>
              Just looking around? Flash Sales, the full store and guest checkout are all
              available without an account.
            </Text>

            <View style={styles.gateSupportLinks}>
              <Pressable onPress={() => router.push("/help")}>
                <Text style={styles.gateSupportLink}>Concierge Support</Text>
              </Pressable>
              <Text style={styles.gateSupportDot}>·</Text>
              <Pressable onPress={() => router.push("/legal?type=terms")}>
                <Text style={styles.gateSupportLink}>Terms</Text>
              </Pressable>
              <Text style={styles.gateSupportDot}>·</Text>
              <Pressable onPress={() => router.push("/legal?type=privacy")}>
                <Text style={styles.gateSupportLink}>Privacy</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = user?.role === "admin";
  if (isAdmin) {
    return <Redirect href="/admin" />;
  }

  const name = user?.name || "There";
  const email = user?.email || "";
  const phone = user?.phone || "";
  const initial = name.trim().charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          clearCart();
          clearWishlist();
          router.replace("/(tabs)");
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {name}
              </Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileContact} numberOfLines={1}>
              {email || phone}
            </Text>
          </View>
        </View>

        {/* Real counters */}
        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>
              {orderCount === null ? "—" : orderCount}
            </Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{wishlistCount}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable
            style={({ pressed }) => [styles.statCell, pressed && { opacity: 0.6 }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/preferences");
            }}
          >
            <Text
              style={[styles.statValue, defaultRegion && styles.statValueRegion]}
              numberOfLines={1}
            >
              {defaultRegion || "Set"}
            </Text>
            <Text style={styles.statLabel}>Region</Text>
          </Pressable>
        </View>

        {isAdmin && (
          <Group title="ADMIN">
            <Row
              icon="shield-checkmark-outline"
              label="Admin Dashboard"
              onPress={() => router.push("/admin")}
            />
            <View style={styles.divider} />
            <Row
              icon="cube-outline"
              label="Manage Products"
              onPress={() => router.push("/admin/products")}
            />
            <View style={styles.divider} />
            <Row
              icon="list-outline"
              label="Manage Orders"
              onPress={() => router.push("/admin/orders")}
            />
          </Group>
        )}

        <Group title="YOUR ORDERS">
          <Row
            icon="receipt-outline"
            label="My Orders"
            value={orderCount !== null ? `${orderCount}` : undefined}
            onPress={() => router.push("/orders")}
          />
          <View style={styles.divider} />
          <Row
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push("/notifications")}
            trailing={hasUnread ? <View style={styles.unreadDot} /> : undefined}
          />
        </Group>

        <Group title="SAVED">
          <Row
            icon="heart-outline"
            label="Wishlist"
            value={wishlistCount ? `${wishlistCount}` : undefined}
            onPress={() => router.push("/wishlist")}
          />
          <View style={styles.divider} />
          <Row
            icon="location-outline"
            label="Delivery Addresses"
            onPress={() => router.push("/addresses")}
          />
        </Group>

        <Group title="PREFERENCES">
          <Row
            icon="globe-outline"
            label="Language & Currency"
            value="English · GHS"
            onPress={() => router.push("/preferences")}
          />
          <View style={styles.divider} />
          <Row
            icon="pin-outline"
            label="Default Region"
            value={defaultRegion || "Not set"}
            onPress={() => router.push("/preferences")}
          />
        </Group>

        <Group title="SUPPORT & SPECIALIST ADVICE">
          <Row
            icon="chatbubbles-outline"
            label="Concierge Support & Specialist Advice"
            onPress={() => router.push("/help")}
          />
          <View style={styles.divider} />
          <Row
            icon="help-circle-outline"
            label="Help Center & Contact"
            onPress={() => router.push("/help")}
          />
        </Group>

        <Group title="LEGAL">
          <Row
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push("/legal?type=terms")}
          />
          <View style={styles.divider} />
          <Row
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push("/legal?type=privacy")}
          />
          <View style={styles.divider} />
          <Row icon="information-circle-outline" label="App Version" value={appVersion} showChevron={false} />
        </Group>

        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.6 }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 48
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  profileName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1
  },
  profileContact: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3
  },
  adminBadge: {
    backgroundColor: "rgba(23,23,23,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  adminBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    paddingVertical: spacing.md
  },
  statCell: {
    flex: 1,
    alignItems: "center"
  },
  statValue: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.4
  },
  statValueRegion: {
    fontSize: 14,
    maxWidth: 92
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.3
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: colors.border
  },
  group: {
    marginTop: spacing.lg
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginLeft: 12,
    marginBottom: 8
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    gap: 12
  },
  rowPressed: {
    backgroundColor: colors.surface
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text
  },
  rowValue: {
    fontSize: 15,
    color: colors.textSecondary
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 56
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent
  },
  signOutBtn: {
    marginTop: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  signOutText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600"
  },
  gate: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  gateInner: {
    alignItems: "center"
  },
  gateTitle: {
    ...typography.h1,
    marginTop: spacing.md
  },
  gateBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22
  },
  gatePerks: {
    width: "100%",
    marginTop: spacing.lg,
    gap: 12
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  perkText: {
    fontSize: 15,
    color: colors.text
  },
  primaryBtn: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  secondaryBtn: {
    alignSelf: "stretch",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs
  },
  secondaryBtnText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600"
  },
  gateFootnote: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 19
  },
  gateSupportLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16
  },
  gateSupportLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent
  },
  gateSupportDot: {
    fontSize: 13,
    color: colors.textTertiary
  }
});
