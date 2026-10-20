import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useCartStore } from "../../store/useCartStore";
import { useWishlistStore } from "../../store/useWishlistStore";
import { useUserStore } from "../../store/useUserStore";
import { AppHaptics } from "../../lib/haptics";

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: {
    label: "Home",
    activeIcon: "home",
    inactiveIcon: "home-outline"
  },
  shop: {
    label: "Shop",
    activeIcon: "grid",
    inactiveIcon: "grid-outline"
  },
  favorites: {
    label: "Favorites",
    activeIcon: "heart",
    inactiveIcon: "heart-outline"
  },
  bag: {
    label: "Bag",
    activeIcon: "bag-handle",
    inactiveIcon: "bag-handle-outline"
  },
  "account-tab": {
    label: "Account",
    activeIcon: "person",
    inactiveIcon: "person-outline"
  }
};

export default function TabLayout() {
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const isAdmin = useUserStore((state) => state.user?.role === "admin");
  const insets = useSafeAreaInsets();

  if (isAdmin) {
    return <Redirect href="/admin" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false
      }}
      tabBar={({ state, navigation }) => (
        <View
          style={[
            styles.barOuter,
            { paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 12 : 10) }
          ]}
        >
          <View style={styles.barInner}>
            {state.routes.map((route, index) => {
              const cfg = TAB_CONFIG[route.name];
              if (!cfg) return null;
              const isFocused = state.index === index;

              const badgeCount =
                route.name === "bag"
                  ? cartItemCount
                  : route.name === "favorites"
                  ? wishlistCount
                  : 0;

              const onPress = () => {
                AppHaptics.selection();
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.tabItem,
                    pressed && { opacity: 0.7 }
                  ]}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={cfg.label}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={isFocused ? cfg.activeIcon : cfg.inactiveIcon}
                      size={22}
                      color={isFocused ? colors.text : colors.tabInactive}
                    />
                    {badgeCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused ? styles.tabLabelActive : styles.tabLabelIdle
                    ]}
                    numberOfLines={1}
                  >
                    {cfg.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="shop" options={{ title: "Shop" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
      <Tabs.Screen name="bag" options={{ title: "Bag" }} />
      <Tabs.Screen name="account-tab" options={{ title: "Account" }} />
      <Tabs.Screen name="flash" options={{ href: null, title: "Special Offers" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 8,
    alignItems: "center"
  },
  barInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 680
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2
  },
  iconWrap: {
    position: "relative",
    height: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.1
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: "600"
  },
  tabLabelIdle: {
    color: colors.tabInactive,
    fontWeight: "500"
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
