import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "../constants/theme";
import { Badge } from "./Badge";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useUserStore } from "../store/useUserStore";
import { checkHasUnreadNotifications } from "../lib/notifications";
import { AppHaptics } from "../lib/haptics";

interface AppHeaderProps {
  /** Drives the hairline separator + frosted background once the screen is scrolled. */
  scrolled?: boolean;
  /** Optional large title rendered under the bar (Apple-style page header). */
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  showActions?: boolean;
}

/**
 * Global I-Store flagship studio bar: sculpted monogram, two-tier brand lockup,
 * and tactile soft-surface circular action buttons.
 */
export function AppHeader({
  scrolled = false,
  title,
  subtitle,
  right,
  showActions = true
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const name = useUserStore((state) => state.user?.name);
  const signedIn = useUserStore((state) => !!state.session);
  const userId = useUserStore((state) => state.userId);
  const [hasUnread, setHasUnread] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (signedIn && userId) {
      checkHasUnreadNotifications(userId).then((unread) => {
        if (active) setHasUnread(unread);
      });
    } else {
      setHasUnread(false);
    }
    return () => {
      active = false;
    };
  }, [signedIn, userId]);

  const initial = name ? name.trim().charAt(0).toUpperCase() : "";

  const press = (action: () => void) => {
    AppHaptics.selection();
    action();
  };

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 8 },
        scrolled && styles.barScrolled
      ]}
    >
      <View style={styles.row}>
        <Pressable
          hitSlop={10}
          onPress={() => press(() => router.push("/(tabs)"))}
          style={styles.brand}
        >
          <View style={styles.logoMark}>
            <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
            <View style={styles.logoLiveDot} />
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.eyebrow}>APPLE HUB · GHANA</Text>
            <Text style={styles.wordmark}>I-Store</Text>
          </View>
        </Pressable>

        {showActions ? (
          <View style={styles.actions}>
            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/wishlist"))}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}
              accessibilityLabel="Saved wishlist"
            >
              <Ionicons
                name={wishlistCount > 0 ? "heart" : "heart-outline"}
                size={19}
                color={wishlistCount > 0 ? colors.brandRed : colors.text}
              />
              {wishlistCount > 0 && <View style={styles.wishDot} />}
            </Pressable>

            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/(tabs)/bag"))}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}
              accessibilityLabel={`Bag, ${cartItemCount} items`}
            >
              <Ionicons name="bag-handle-outline" size={19} color={colors.text} />
              {cartItemCount > 0 && (
                <View style={styles.badgeWrapper}>
                  <Badge count={cartItemCount} />
                </View>
              )}
            </Pressable>

            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/account"))}
              style={({ pressed }) => [
                styles.iconCircle,
                signedIn && styles.iconCircleDark,
                pressed && styles.iconCirclePressed
              ]}
              accessibilityLabel={signedIn ? "Your account" : "Sign in"}
            >
              {signedIn ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial || "?"}</Text>
                  {hasUnread && <View style={styles.avatarUnreadDot} />}
                </View>
              ) : (
                <Ionicons name="person-outline" size={19} color={colors.text} />
              )}
            </Pressable>
          </View>
        ) : (
          right
        )}
      </View>

      {title ? (
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {scrolled ? <View style={styles.hairline} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor:
      Platform.OS === "web"
        ? ("rgba(255,255,255,0.88)" as unknown as string)
        : colors.background,
    paddingHorizontal: 16,
    paddingBottom: 10
  },
  barScrolled: {
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.95)" : colors.background
  },
  row: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3
  },
  logoLiveDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandRed,
    borderWidth: 1,
    borderColor: "#0D0D12"
  },
  brandTextCol: {
    justifyContent: "center"
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: colors.textSecondary
  },
  wordmark: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: "#0D0D12",
    marginTop: -1
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F3F7",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  iconCircleDark: {
    backgroundColor: "#0D0D12",
    borderColor: "#0D0D12"
  },
  iconCirclePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.95 }]
  },
  wishDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandRed
  },
  badgeWrapper: {
    position: "absolute",
    top: -4,
    right: -4
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarUnreadDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.badge,
    borderWidth: 1.5,
    borderColor: "#0D0D12"
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  titleBlock: {
    paddingTop: 8,
    paddingBottom: 4
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.9,
    color: "#0D0D12"
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 4
  }
});

export default AppHeader;

