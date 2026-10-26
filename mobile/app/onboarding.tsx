import React, { useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { colors, radius } from "../constants/theme";
import { BrandLogo } from "../components/BrandLogo";

export const ONBOARDING_SEEN_KEY = "idynamic_onboarding_seen_v1";

interface OnboardingSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  highlights: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "flagship",
    eyebrow: "CURATED FLAGSHIP HARDWARE",
    title: "The Complete Apple Lineup, Reimagined.",
    description:
      "Browse and experience the latest iPhone 18 Pro Max, foldable iPhone Duo, M5 MacBook Pro, iPad Pro, Apple Watch Ultra 3, and AirPods Pro 3 in a minimalist gallery.",
    icon: "phone-portrait-outline",
    highlights: [
      "100% factory-sealed, serial-verified devices",
      "Real-time stock availability & pricing",
      "Compatible MagSafe & Beats accessories"
    ]
  },
  {
    id: "configure",
    eyebrow: "CONFIGURE & COMPARE",
    title: "Tailor Every Detail. Compare Side by Side.",
    description:
      "Select your preferred finish and storage capacity with instant price updates, or compare specifications across multiple models before you decide.",
    icon: "git-compare-outline",
    highlights: [
      "Interactive finish swatches & storage tiers",
      "Side-by-side model & chip comparison",
      "Save favorites for instant access"
    ]
  },
  {
    id: "assurance",
    eyebrow: "SEAMLESS CHECKOUT & WARRANTY",
    title: "Protected by the LesTrades Standard.",
    description:
      "Check out effortlessly with Mobile Money or Card via Paystack, track your delivery in real time, and enjoy 1-Year Official Apple Warranty coverage.",
    icon: "shield-checkmark-outline",
    highlights: [
      "Same-day express dispatch in Accra & Kumasi",
      "1-Year Official Apple Warranty & 7-day returns",
      "Dedicated specialist concierge support"
    ]
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const slideWidth = Math.min(width, 820);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);

  const completeOnboarding = async (target: string = "/(tabs)") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } catch {
      // Ignore storage error
    }
    router.replace(target as never);
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      setActiveIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      void completeOnboarding("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandLogo size={32} variant="dark" />
          <Text style={styles.brandName}>LesTrades</Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => void completeOnboarding("/(tabs)")}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideWidth }]}>
            <View style={styles.iconPedestal}>
              <Ionicons name={item.icon} size={44} color={colors.text} />
            </View>

            <Text style={styles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.highlightsCard}>
              {item.highlights.map((pt) => (
                <View key={pt} style={styles.highlightRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.brandAccent}
                  />
                  <Text style={styles.highlightText}>{pt}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />

      {/* Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotIdle
              ]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }
          ]}
          onPress={handleNext}
        >
          <Text style={styles.primaryBtnText}>
            {activeIndex === SLIDES.length - 1 ? "Start Shopping" : "Continue"}
          </Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.text
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textSecondary
  },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center"
  },
  iconPedestal: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.brandAccent,
    marginBottom: 8
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 36,
    color: colors.text
  },
  description: {
    fontSize: 15.5,
    lineHeight: 23,
    color: colors.textSecondary,
    marginTop: 12
  },
  highlightsCard: {
    marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
    gap: 20
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  dot: {
    height: 6,
    borderRadius: 3
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.text
  },
  dotIdle: {
    width: 6,
    backgroundColor: colors.border
  },
  primaryBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
