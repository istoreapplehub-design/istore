import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { useUserStore } from "../../store/useUserStore";
import { useCartStore } from "../../store/useCartStore";
import { BrandLogo } from "../../components/BrandLogo";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const signIn = useUserStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim().toLowerCase(), password);
      const isUserAdmin = useUserStore.getState().isAdmin();
      if (isUserAdmin) {
        router.replace("/admin" as Href);
        return;
      }
      if (returnTo === "checkout") {
        useCartStore.getState().setGuestCheckout(false);
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/checkout" as Href);
        }
        return;
      }
      const destination = returnTo ? `/${returnTo}` : "/(tabs)";
      router.replace(destination as Href);
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Top dismissal bar */}
        <View style={styles.topBar}>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              if (returnTo === "checkout") {
                useCartStore.getState().setGuestCheckout(true);
              }
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(
                  returnTo === "checkout"
                    ? (({ pathname: "/checkout", params: { mode: "guest" } } as any))
                    : ("/(tabs)" as Href)
                );
              }
            }}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel={returnTo === "checkout" ? "Back to Checkout" : "Close"}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          {returnTo === "checkout" && (
            <View style={styles.checkoutBadge}>
              <Ionicons name="cart-outline" size={13} color={colors.accent} />
              <Text style={styles.checkoutBadgeText}>Checkout in progress</Text>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ marginBottom: 12 }}>
              <BrandLogo size={38} showWordmark wordmarkSize={19} />
            </View>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>
              Sign in with your I-Dynamic account to manage orders, saved favorites, and check out securely.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.label}>Password</Text>
                <Pressable
                  onPress={async () => {
                    const cleanEmail = email.trim().toLowerCase();
                    if (!cleanEmail) {
                      Alert.alert(
                        "Reset Password",
                        "Enter your email address above first, then tap Forgot Password to receive a password recovery link."
                      );
                      return;
                    }
                    try {
                      await supabase.auth.resetPasswordForEmail(cleanEmail);
                      Alert.alert(
                        "Recovery Email Sent",
                        `If an I-Dynamic account exists for ${cleanEmail}, a password reset link has been sent to your inbox.`
                      );
                    } catch {
                      Alert.alert(
                        "Password Recovery",
                        `Please contact support@idynamic.com.gh if you need help recovering ${cleanEmail}.`
                      );
                    }
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brandRed }}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Blue Pill Sign In Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            {/* Guest button */}
            <Pressable
              style={({ pressed }) => [
                styles.guestButton,
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => {
                if (returnTo === "checkout") {
                  useCartStore.getState().setGuestCheckout(true);
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace({ pathname: "/checkout", params: { mode: "guest" } } as any);
                  }
                  return;
                }
                router.replace("/(tabs)");
              }}
            >
              <Text style={styles.guestButtonText}>
                {returnTo === "checkout" ? "Continue to Guest Checkout" : "Continue as Guest"}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account?"}</Text>
            <Pressable
              onPress={() =>
                router.push(
                  returnTo
                    ? (`/(auth)/register?returnTo=${encodeURIComponent(returnTo)}` as Href)
                    : ("/(auth)/register" as Href)
                )
              }
            >
              <Text style={styles.footerLink}> Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardView: {
    flex: 1
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  checkoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  checkoutBadgeText: {
    ...typography.caption1,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  header: {
    marginBottom: spacing.xl
  },
  brandSubtitle: {
    ...typography.subheadline,
    color: colors.accent,
    fontWeight: "600",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22
  },
  form: {
    gap: spacing.md
  },
  inputGroup: {
    gap: spacing.xs
  },
  label: {
    ...typography.subheadline,
    fontWeight: "600",
    color: colors.text
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.body,
    color: colors.text
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }]
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    ...typography.headline,
    color: "#FFFFFF",
    fontWeight: "700"
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  guestButtonText: {
    ...typography.callout,
    color: colors.textSecondary,
    fontWeight: "500"
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl
  },
  footerText: {
    ...typography.subheadline,
    color: colors.textSecondary
  },
  footerLink: {
    ...typography.subheadline,
    color: colors.accent,
    fontWeight: "600"
  }
});
