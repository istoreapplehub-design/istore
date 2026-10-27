import React from "react";
import { Stack } from "expo-router";
import { AdminGuard } from "../../components/admin/AdminGuard";
import { theme } from "../../constants/theme";

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack
        screenOptions={{
          // Every admin screen ships its own branded header — no native stack header.
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: "slide_from_right"
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="products/index" />
        <Stack.Screen name="products/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="products/[id]" />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="flash-deals" />
        <Stack.Screen name="events" />
        <Stack.Screen name="genius-bar" />
        <Stack.Screen name="trade-in" />
        <Stack.Screen name="installments" />
      </Stack>
    </AdminGuard>
  );
}
