import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radius } from "../constants/theme";

interface ValueProp {
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: "shield-checkmark-outline",
    eyebrow: "Warranty",
    title: "Covered, officially.",
    body: "Every device carries Apple's manufacturer warranty, honoured at authorised service centres.",
    href: "/help"
  },
  {
    icon: "cube-outline",
    eyebrow: "Authenticity",
    title: "Sealed, serial-checked.",
    body: "Products arrive in original retail packaging with a serial number you can verify on Apple's site."
  },
  {
    icon: "card-outline",
    eyebrow: "Payments",
    title: "Fast, secure payments.",
    body: "MTN MoMo, Telecel Cash, AT Money and Visa or Mastercard through Paystack.",
    href: "/help"
  },
  {
    icon: "bicycle-outline",
    eyebrow: "Delivery",
    title: "All 16 regions.",
    body: "Riders in Accra and Kumasi, tracked courier nationwide. Your fee shows before you pay."
  },
  {
    icon: "refresh-outline",
    eyebrow: "Changes of mind",
    title: "Cancel while pending.",
    body: "Cancel an unpaid order from My Orders in two taps — no phone calls, no arguments."
  }
];

export function ValuePropRail() {
  const router = useRouter();

  return (
    <FlatList
      horizontal
      snapToInterval={268}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      data={VALUE_PROPS}
      keyExtractor={(item) => item.title}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          onPress={() => {
            if (!item.href) return;
            Haptics.selectionAsync();
            router.push(item.href as never);
          }}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={20} color={colors.brandRed} />
          </View>
          <Text style={styles.eyebrow}>{item.eyebrow.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          {item.href ? (
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Find out more</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.brandRed} />
            </View>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 12
  },
  card: {
    width: 256,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    padding: 18
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: colors.brandRed
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text,
    marginTop: 3
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 7
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 2
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandRed
  }
});

export default ValuePropRail;
