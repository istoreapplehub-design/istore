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
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(prefillEmail || "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert("Enter Your Email", "Please enter the email address linked to your LesTrades account.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Invalid Email", "That email address doesn't look right. Please double-check it.");
      return;
    }

    try {
      setLoading(true);
      await supabase.auth.resetPasswordForEmail(cleanEmail);
      setSent(true);
    } catch {
      Alert.alert(
        "Password Recovery",
        `We couldn't send a reset link right now. Please contact support@lestrades.com.gh if you need help recovering ${cleanEmail}.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoCard}>
              <Image
                source={require("../../assets/images/lestrades-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="LesTrades — Quality for Less"
              />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              {sent
                ? `We've sent a password recovery link to ${email.trim().toLowerCase()}. Follow the link in your inbox to reset your password.`
                : "Enter the email address linked to your LesTrades account and we'll send you a link to reset your password."}
            </Text>
          </View>

          {sent ? (
            <View style={styles.form}>
              <View style={styles.sentCard}>
                <Ionicons name="mail-open-outline" size={34} color={colors.brandAccent} />
                <Text style={styles.sentTitle}>Check your inbox</Text>
                <Text style={styles.sentText}>
                  The reset link can take a minute to arrive. Didn&apos;t get it? Check your spam folder
                  or try again.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed
                ]}
                onPress={() => setSent(false)}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>

              <Pressable style={styles.backLink} onPress={() => router.back()}>
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
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

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  loading && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                )}
              </Pressable>

              <Pressable style={styles.backLink} onPress={() => router.back()}>
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </Pressable>
            </View>
          )}
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
  sentCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md
  },
  sentTitle: {
    ...typography.headline,
    color: colors.text
  },
  sentText: {
    ...typography.callout,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21
  },
  backLink: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  backLinkText: {
    ...typography.subheadline,
    color: colors.brandAccent,
    fontWeight: "600"
  }
});
