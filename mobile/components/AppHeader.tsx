import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "../constants/theme";
import { Badge } from "./Badge";
import { useCartStore } from "../store/useCartStore";
import { useUserStore } from "../store/useUserStore";

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
 * Global I-Store bar: wordmark, search, bag with live badge, and the account avatar.
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
  const name = useUserStore((state) => state.user?.name);
  const signedIn = useUserStore((state) => !!state.session);

  const initial = name ? name.trim().charAt(0).toUpperCase() : "";

  const press = (action: () => void) => {
    Haptics.selectionAsync();
    action();
  };

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 6 },
        scrolled && styles.barScrolled
      ]}
    >
      <View style={styles.row}>
        <Pressable
          hitSlop={10}
          onPress={() => press(() => router.push("/(tabs)"))}
          style={styles.brand}
        >
          <Ionicons name="logo-apple" size={22} color={colors.text} />
          <Text style={styles.wordmark}>I-Store</Text>
        </Pressable>

        {showActions ? (
          <View style={styles.actions}>
            <Pressable
              hitSlop={10}
              onPress={() => press(() => router.push("/search"))}
              style={styles.iconButton}
              accessibilityLabel="Search products"
            >
              <Ionicons name="search-outline" size={22} color={colors.text} />
            </Pressable>

            <Pressable
              hitSlop={10}
              onPress={() => press(() => router.push("/(tabs)/bag"))}
              style={styles.iconButton}
              accessibilityLabel={`Bag, ${cartItemCount} items`}
            >
              <Ionicons name="bag-outline" size={22} color={colors.text} />
              {cartItemCount > 0 && (
                <View style={styles.badgeWrapper}>
                  <Badge count={cartItemCount} />
                </View>
              )}
            </Pressable>

            <Pressable
              hitSlop={10}
              onPress={() => press(() => router.push("/account"))}
              style={styles.iconButton}
              accessibilityLabel={signedIn ? "Your account" : "Sign in"}
            >
              {signedIn ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial || "?"}</Text>
                </View>
              ) : (
                <Ionicons name="person-outline" size={22} color={colors.text} />
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
        ? ("rgba(255,255,255,0.82)" as unknown as string)
        : colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  barScrolled: {
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : colors.background
  },
  row: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  wordmark: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.text
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18
  },
  iconButton: {
    position: "relative",
    padding: 2
  },
  badgeWrapper: {
    position: "absolute",
    top: -4,
    right: -8
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  titleBlock: {
    paddingTop: 4,
    paddingBottom: 6
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.9,
    color: colors.text
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 2
  }
});

export default AppHeader;
