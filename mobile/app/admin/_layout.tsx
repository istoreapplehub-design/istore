import React from "react";
import { Stack } from "expo-router";
import { AdminGuard } from "../../components/admin/AdminGuard";
import { theme } from "../../constants/theme";

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { fontWeight: "700", fontSize: 17 },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: "slide_from_right"
        }}
      >
        <Stack.Screen name="index" options={{ title: "Admin", headerShown: false }} />
        <Stack.Screen name="products/index" options={{ title: "Products" }} />
        <Stack.Screen name="products/new" options={{ title: "New Product", presentation: "modal" }} />
        <Stack.Screen name="products/[id]" options={{ title: "Edit Product" }} />
        <Stack.Screen name="orders/index" options={{ title: "Orders" }} />
        <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
      </Stack>
    </AdminGuard>
  );
}
