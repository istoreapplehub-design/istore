import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Ionicons name="compass-outline" size={44} color={colors.textTertiary} />
        <Text style={styles.title}>This page doesn&apos;t exist</Text>
        <Text style={styles.body}>
          The link may be old, or the product may have sold out.
        </Text>
        <Link href="/(tabs)" asChild>
          <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
            <Text style={styles.buttonText}>Back to the store</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 32,
    gap: 10
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: 8
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21
  },
  button: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: radius.full,
    backgroundColor: colors.accent
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600"
  }
});
