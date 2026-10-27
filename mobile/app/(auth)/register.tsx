import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { useUserStore } from "../../store/useUserStore";
import { useCartStore } from "../../store/useCartStore";

export default function RegisterScreen() {
  const router = useRouter();
  const { email: prefillEmail, returnTo } = useLocalSearchParams<{
    email?: string;
    returnTo?: string;
  }>();
  const signUp = useUserStore((state) => state.signUp);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(prefillEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      Alert.alert("Missing Fields", "Please fill in all registration fields.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Password Too Short", "Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      await signUp(name.trim(), phone.trim(), email.trim().toLowerCase(), password);
      Alert.alert("Welcome!", "Your account has been created successfully.", [
        {
          text: "Continue",
          onPress: () => {
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
          }
        }
      ]);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Failed to create account.");
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
            <View style={styles.logoCard}>
              <Image
                source={require("../../assets/images/lestrades-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="LesTrades — Quality for Less"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up with LesTrades to track purchases, save your delivery addresses, and get manufacturer-backed warranty support on every device.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Kwame Mensah"
                placeholderTextColor={colors.textTertiary}
                autoCorrect={false}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="024 123 4567"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

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
              <Text style={styles.label}>Password (min. 8 characters)</Text>
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

            {/* Blue Pill Sign Up Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>

            {/* Guest button when checking out */}
            {returnTo === "checkout" && (
              <Pressable
                style={({ pressed }) => [
                  styles.guestButton,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => {
                  useCartStore.getState().setGuestCheckout(true);
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace({ pathname: "/checkout", params: { mode: "guest" } } as any);
                  }
                }}
              >
                <Text style={styles.guestButtonText}>Cancel & Continue to Guest Checkout</Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable
              onPress={() =>
                router.push(
                  returnTo
                    ? (`/(auth)/login?returnTo=${encodeURIComponent(returnTo)}` as Href)
                    : ("/(auth)/login" as Href)
                )
              }
            >
              <Text style={styles.footerLink}> Sign In</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  header: {
    marginBottom: spacing.xl
  },
  logoCard: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brandRedBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
    ...shadow.card
  },
  logoImage: {
    width: 88,
    height: 65
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
    marginBottom: spacing.xs,
    textAlign: "center"
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center"
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
