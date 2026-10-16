import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useCartStore } from "../../store/useCartStore";
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
    label: "Discover",
    activeIcon: "sparkles",
    inactiveIcon: "sparkles-outline"
  },
  shop: {
    label: "Catalog",
    activeIcon: "grid",
    inactiveIcon: "grid-outline"
  },
  flash: {
    label: "Drops",
    activeIcon: "flash",
    inactiveIcon: "flash-outline"
  },
  bag: {
    label: "Bag",
    activeIcon: "bag-handle",
    inactiveIcon: "bag-handle-outline"
  }
};

export default function TabLayout() {
  const cartItemCount = useCartStore((state) => state.getItemCount());
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
          pointerEvents="box-none"
          style={[
            styles.dockOuter,
            { paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 12) }
          ]}
        >
          <View style={styles.dock}>
            {state.routes.map((route, index) => {
              const cfg = TAB_CONFIG[route.name];
              if (!cfg) return null;
              const isFocused = state.index === index;

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
                    isFocused && styles.tabItemActive,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }
                  ]}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={cfg.label}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={isFocused ? cfg.activeIcon : cfg.inactiveIcon}
                      size={19}
                      color={isFocused ? "#FFFFFF" : "#8E8E98"}
                    />
                    {route.name === "bag" && cartItemCount > 0 && (
                      <View
                        style={[
                          styles.badge,
                          isFocused && styles.badgeOnActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isFocused && styles.badgeTextOnActive
                          ]}
                        >
                          {cartItemCount > 9 ? "9+" : cartItemCount}
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
      <Tabs.Screen name="index" options={{ title: "Discover" }} />
      <Tabs.Screen name="shop" options={{ title: "Catalog" }} />
      <Tabs.Screen name="flash" options={{ title: "Drops" }} />
      <Tabs.Screen name="bag" options={{ title: "Bag" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockOuter: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 6,
    alignItems: "center"
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#0D0D12",
    borderRadius: 36,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 30
  },
  tabItemActive: {
    backgroundColor: colors.brandRed,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 4
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: -0.2
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800"
  },
  tabLabelIdle: {
    color: "#8E8E98",
    fontWeight: "600"
  },
  badge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.brandRed,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#0D0D12"
  },
  badgeOnActive: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.brandRed
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  badgeTextOnActive: {
    color: colors.brandRed
  }
});

