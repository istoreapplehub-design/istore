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
    href: "/warranty"
  },
  {
    icon: "cube-outline",
    eyebrow: "Authenticity",
    title: "Sealed, serial-checked.",
    body: "Products arrive in original retail packaging with a serial number you can verify on Apple's site.",
    href: "/warranty"
  },
  {
    icon: "git-compare-outline",
    eyebrow: "Compare",
    title: "Side-by-side specs.",
    body: "Compare processors, cameras, displays, and storage across iPhone, Mac, iPad, and Watch models.",
    href: "/compare"
  },
  {
    icon: "sync-outline",
    eyebrow: "Returns",
    title: "7-day return assurance.",
    body: "Eligible unopened items can be returned within 7 days of delivery with fast refund processing.",
    href: "/returns"
  },
  {
    icon: "gift-outline",
    eyebrow: "Referral Bonus",
    title: "Refer & earn bonus.",
    body: "Invite friends with your I-Dynamic referral code — they save GHS 250 and you earn GHS 300 bonus credit.",
    href: "/account"
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
            <Ionicons name={item.icon} size={20} color={colors.text} />
          </View>
          <Text style={styles.eyebrow}>{item.eyebrow.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          {item.href ? (
            <View style={styles.linkRow}>
              <Text style={styles.linkText}>
                {item.eyebrow === "Referral Bonus" ? "Claim referral bonus" : "Learn more"}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.brandAccent} />
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
    padding: 16
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: colors.brandAccent
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.text,
    marginTop: 2
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 5
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 2
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brandAccent
  }
});

export default ValuePropRail;
