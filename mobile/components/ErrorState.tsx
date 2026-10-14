import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { ApiError } from "../services/api";
import { colors, spacing, typography } from "../constants/theme";

export interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  primaryActionLabel?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
}

function classify(error: unknown): { kind: "network" | "server" | "auth"; message: string } {
  if (error instanceof ApiError) return { kind: error.kind, message: error.message };
  const msg = error instanceof Error ? error.message : String(error);
  return { kind: "server", message: msg || "Something went wrong." };
}

export default function ErrorState({
  error,
  onRetry,
  retrying,
  primaryActionLabel = "Try Again",
  empty,
  emptyTitle = "Nothing here yet",
  emptySubtitle,
  emptyIcon = "cube-outline"
}: ErrorStateProps) {
  if (empty) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.iconCircle}>
          <Ionicons name={emptyIcon} size={30} color={colors.text} />
        </View>
        <Text style={styles.title}>{emptyTitle}</Text>
        {!!emptySubtitle && <Text style={styles.subtitle}>{emptySubtitle}</Text>}
      </View>
    );
  }

  const { kind, message } = classify(error);

  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={kind === "network" ? "cloud-offline-outline" : kind === "auth" ? "lock-closed-outline" : "alert-circle-outline"}
          size={30}
          color={colors.text}
        />
      </View>
      <Text style={styles.title}>
        {kind === "network"
          ? "Can't connect to I-Store"
          : kind === "auth"
          ? "Sign in required"
          : "Something went wrong"}
      </Text>
      <Text style={styles.message} numberOfLines={5}>
        {message}
      </Text>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onRetry?.();
        }}
        style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.75 }]}
        disabled={retrying}
      >
        {retrying ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.retryText}>{primaryActionLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  title: {
    ...typography.h3,
    textAlign: "center"
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: "center",
    marginTop: 6
  },
  message: {
    ...typography.bodySmall,
    textAlign: "center",
    marginTop: 8,
    color: colors.textTertiary
  },
  retryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 980,
    paddingHorizontal: 32,
    paddingVertical: 13,
    marginTop: spacing.lg,
    minHeight: 46,
    justifyContent: "center"
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  }
});
