import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { useCartStore } from "../../store/useCartStore";
import { useUserStore } from "../../store/useUserStore";

/**
 * Four guest-first destinations. Search and Account live in the root stack and are
 * reached from the header, so browsing never requires an account.
 * Admins are strictly redirected to the admin portal.
 */
export default function TabLayout() {
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const isAdmin = useUserStore((state) => state.user?.role === "admin");

  if (isAdmin) {
    return <Redirect href="/admin" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 86 : 62,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 26 : 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          letterSpacing: 0.1
        },
        tabBarItemStyle: {
          paddingTop: 4
        },
        tabBarIconStyle: {
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "storefront" : "storefront-outline"} size={23} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="flash"
        options={{
          title: "Flash",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flash" : "flash-outline"} size={23} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Bag",
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.badge,
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: "700",
            minWidth: 18,
            height: 18
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bag" : "bag-outline"} size={23} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
