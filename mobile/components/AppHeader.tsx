import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { Badge } from "./Badge";
import { BrandLogo } from "./BrandLogo";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";
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
 * Global LesTrades minimalist header:
 * Original brand identity on the left, and clean Search, Favorites, and Bag indicators on the right.
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
          <BrandLogo size={36} variant="light" />
          <View style={styles.brandTextCol}>
            <Text style={styles.wordmark}>LesTrades</Text>
            <Text style={styles.eyebrow}>QUALITY FOR LESS</Text>
          </View>
        </Pressable>

        {showActions ? (
          <View style={styles.actions}>
            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/search"))}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}
              accessibilityLabel="Search products"
            >
              <Ionicons name="search-outline" size={19} color={colors.text} />
            </Pressable>

            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/compare" as never))}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}
              accessibilityLabel="Compare models"
            >
              <Ionicons name="git-compare-outline" size={18} color={colors.text} />
            </Pressable>

            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/wishlist"))}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}
              accessibilityLabel={`Favorites, ${wishlistCount} items`}
            >
              <Ionicons
                name={wishlistCount > 0 ? "heart" : "heart-outline"}
                size={19}
                color={wishlistCount > 0 ? colors.brandAccent : colors.text}
              />
              {wishlistCount > 0 && (
                <View style={styles.badgeWrapper}>
                  <Badge count={wishlistCount} />
                </View>
              )}
            </Pressable>

            <Pressable
              hitSlop={6}
              onPress={() => press(() => router.push("/(tabs)/bag"))}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}
              accessibilityLabel={`Shopping bag, ${cartItemCount} items`}
            >
              <Ionicons name="bag-handle-outline" size={19} color={colors.text} />
              {cartItemCount > 0 && (
                <View style={styles.badgeWrapper}>
                  <Badge count={cartItemCount} />
                </View>
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
        ? ("rgba(255,255,255,0.92)" as unknown as string)
        : colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  barScrolled: {
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.96)" : colors.background
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
  brandTextCol: {
    justifyContent: "center"
  },
  wordmark: {
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "800",
    letterSpacing: -0.6,
    color: "#0465B3"
  },
  eyebrow: {
    fontSize: 8.5,
    fontStyle: "italic",
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#0465B3",
    opacity: 0.85,
    marginTop: 0
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  iconCirclePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.95 }]
  },
  badgeWrapper: {
    position: "absolute",
    top: -4,
    right: -4,
    zIndex: 10
  },
  titleBlock: {
    paddingTop: 8,
    paddingBottom: 4
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: colors.text
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
