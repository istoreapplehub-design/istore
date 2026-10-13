import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from "@expo-google-fonts/inter";
import { colors, typography } from "../constants/theme";
import ErrorBoundary from "../components/ErrorBoundary";

/**
 * Root Application Layout
 * Provides GestureHandler, SafeAreas, Inter typography, ErrorBoundary, and Expo Router stack configuration.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.brandTitle}>I-Store</Text>
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            initialRouteName="(tabs)"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "slide_from_right"
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product/[slug]"
              options={{
                headerShown: false,
                animation: "slide_from_right",
                gestureEnabled: true
              }}
            />
            <Stack.Screen
              name="checkout"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
                headerShown: false
              }}
            />
          <Stack.Screen
            name="order-success"
            options={{
              animation: "fade",
              gestureEnabled: false,
              headerShown: false
            }}
          />
          <Stack.Screen
            name="orders/index"
            options={{
              headerShown: true,
              title: "My Orders",
              headerBackTitle: "Back"
            }}
          />
          <Stack.Screen
            name="orders/[id]"
            options={{
              headerShown: true,
              title: "Order Details",
              headerBackTitle: "Orders"
            }}
          />
          <Stack.Screen
            name="wishlist"
            options={{
              headerShown: true,
              title: "Wishlist",
              headerBackTitle: "Back"
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  brandTitle: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: -0.5
  }
});
