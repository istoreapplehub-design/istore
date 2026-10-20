import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
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
import { AnimatedSplash } from "../components/AnimatedSplash";
import { useUserStore } from "../store/useUserStore";
import { useWishlistStore } from "../store/useWishlistStore";

/**
 * Root Application Layout
 * Provides GestureHandler, SafeAreas, Inter typography, ErrorBoundary, Supabase session hydration,
 * cinematic AnimatedSplash sequence, and Expo Router stack configuration.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
  });

  const [hydrated, setHydrated] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 1500);

    useUserStore
      .getState()
      .hydrate()
      .finally(() => {
        if (useUserStore.getState().userId) {
          void useWishlistStore.getState().syncOnSignIn();
        }
        setHydrated(true);
        clearTimeout(timer);
      });

    return () => clearTimeout(timer);
  }, []);

  const appReady = Boolean(hydrated);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaProvider>
          <View style={styles.webContainer}>
            <StatusBar style="dark" />
            {appReady && (
              <Stack
                initialRouteName="(tabs)"
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                animation: "slide_from_right",
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerShadowVisible: false,
                headerTitleStyle: {
                  fontFamily: typography.fontFamily.semibold,
                  fontSize: 16
                },
                headerBackTitleStyle: {
                  fontFamily: typography.fontFamily.regular
                }
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  animation: "fade"
                }}
              />
              <Stack.Screen
                name="compare"
                options={{
                  headerShown: true,
                  title: "Compare Models",
                  headerBackTitle: "Back"
                }}
              />
              <Stack.Screen
                name="warranty"
                options={{
                  headerShown: true,
                  title: "Warranty Information",
                  headerBackTitle: "Back"
                }}
              />
              <Stack.Screen
                name="returns"
                options={{
                  headerShown: true,
                  title: "Returns & Refunds",
                  headerBackTitle: "Back"
                }}
              />
            <Stack.Screen
              name="account"
              options={{
                headerShown: true,
                title: "Account",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                animation: "fade"
              }}
            />
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
                title: wishlistCount > 0 ? `Wishlist (${wishlistCount})` : "Wishlist",
                headerBackTitle: "Back"
              }}
            />
            <Stack.Screen
              name="addresses"
              options={{
                headerShown: true,
                title: "Addresses",
                headerBackTitle: "Account"
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: true,
                title: "Notifications",
                headerBackTitle: "Account"
              }}
            />
            <Stack.Screen
              name="preferences"
              options={{
                headerShown: true,
                title: "Preferences",
                headerBackTitle: "Account"
              }}
            />
            <Stack.Screen
              name="help"
              options={{
                headerShown: true,
                title: "Help Center",
                headerBackTitle: "Account"
              }}
            />
            <Stack.Screen
              name="legal"
              options={{
                headerShown: true,
                title: "Legal",
                headerBackTitle: "Account"
              }}
            />
              </Stack>
            )}
            {!splashFinished && (
              <AnimatedSplash
                ready={appReady}
                onFinish={() => setSplashFinished(true)}
              />
            )}
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    backgroundColor: colors.background
  }
});

