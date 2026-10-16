import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { colors, radius } from "../constants/theme";

interface AnimatedSplashProps {
  ready: boolean;
  onFinish: () => void;
}

const LETTERS = ["I", "-", "S", "t", "o", "r", "e"];

export function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  const logoScale = useSharedValue(0.3);
  const logoRotate = useSharedValue(-12);
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const dotPulse = useSharedValue(1);

  useEffect(() => {
    // Initial entrance choreography
    logoScale.value = withSpring(1, { damping: 12, stiffness: 140 });
    logoRotate.value = withSpring(0, { damping: 14, stiffness: 120 });

    ringOpacity.value = withTiming(0.65, { duration: 500 });
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    dotPulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 550 }),
        withTiming(1, { duration: 550 })
      ),
      -1,
      true
    );

    progressWidth.value = withDelay(
      220,
      withTiming(100, {
        duration: 1450,
        easing: Easing.bezier(0.22, 1, 0.36, 1)
      })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [dotPulse, logoRotate, logoScale, progressWidth, ringOpacity, ringScale]);

  useEffect(() => {
    if (!ready) return;

    // Wait for wordmark & progress bar choreography before zoom-out reveal
    const timer = setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
      containerScale.value = withTiming(1.14, {
        duration: 460,
        easing: Easing.out(Easing.cubic)
      });
      containerOpacity.value = withTiming(
        0,
        {
          duration: 440,
          easing: Easing.inOut(Easing.quad)
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      );
    }, 1850);

    return () => clearTimeout(timer);
  }, [ready, containerOpacity, containerScale, onFinish]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }]
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` }
    ]
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }]
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }]
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  return (
    <Animated.View style={[styles.overlay, containerAnimatedStyle]}>
      <LinearGradient
        colors={["#14141D", "#09090D", "#050507"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient Crimson & Titanium Glow Orbs */}
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.centerStage}>
        {/* Animated Halo Ring + Squircle Emblem */}
        <View style={styles.emblemWrapper}>
          <Animated.View style={[styles.haloRing, ringAnimatedStyle]} />
          <Animated.View style={[styles.emblemBox, logoAnimatedStyle]}>
            <LinearGradient
              colors={["#232330", "#0D0D12"]}
              style={styles.emblemGradient}
            >
              <Ionicons name="logo-apple" size={44} color="#FFFFFF" />
              <Animated.View style={[styles.emblemLiveDot, dotAnimatedStyle]} />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Staggered Letter-by-Letter Store Name: I-Store. */}
        <View style={styles.wordmarkRow}>
          {LETTERS.map((char, idx) => (
            <Animated.Text
              key={`${char}-${idx}`}
              entering={FadeInDown.delay(160 + idx * 55)
                .duration(420)
                .springify()
                .damping(13)}
              style={styles.wordmarkChar}
            >
              {char}
            </Animated.Text>
          ))}
          <Animated.Text
            entering={FadeInDown.delay(560).duration(420).springify()}
            style={[styles.wordmarkChar, styles.wordmarkDot]}
          >
            .
          </Animated.Text>
        </View>

        {/* Animated Subtitle Pill */}
        <Animated.View
          entering={FadeInUp.delay(480).duration(450)}
          style={styles.hubBadge}
        >
          <View style={styles.hubBadgeDot} />
          <Text style={styles.hubBadgeText}>APPLE HUB · OFFICIAL STORE</Text>
        </Animated.View>

        {/* Sleek Crimson Progress Bar */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(400)}
          style={styles.progressTrack}
        >
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </Animated.View>
      </View>

      {/* Bottom Ecosystem Category Pills */}
      <Animated.View
        entering={FadeInUp.delay(680).duration(480)}
        style={styles.bottomFooter}
      >
        <View style={styles.ecosystemRow}>
          {[
            { icon: "phone-portrait-outline" as const, label: "iPhone" },
            { icon: "laptop-outline" as const, label: "Mac" },
            { icon: "watch-outline" as const, label: "Watch" },
            { icon: "headset-outline" as const, label: "AirPods" }
          ].map((item) => (
            <View key={item.label} style={styles.ecoPill}>
              <Ionicons name={item.icon} size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.ecoPillText}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.tagline}>DESIGNED FOR EXCELLENCE · ACCRA</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  topGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(225, 29, 72, 0.16)"
  },
  bottomGlow: {
    position: "absolute",
    bottom: -140,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(225, 29, 72, 0.10)"
  },
  centerStage: {
    alignItems: "center",
    justifyContent: "center"
  },
  emblemWrapper: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18
  },
  haloRing: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "rgba(225, 29, 72, 0.45)",
    backgroundColor: "rgba(225, 29, 72, 0.08)"
  },
  emblemBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    padding: 1.5,
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10
  },
  emblemGradient: {
    flex: 1,
    borderRadius: 26.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  emblemLiveDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.brandRed,
    borderWidth: 1.5,
    borderColor: "#0D0D12"
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center"
  },
  wordmarkChar: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.2
  },
  wordmarkDot: {
    color: colors.brandRed
  },
  hubBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  hubBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandRed
  },
  hubBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.86)"
  },
  progressTrack: {
    width: 148,
    height: 3.5,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 26,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.brandRed
  },
  bottomFooter: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
    gap: 14
  },
  ecosystemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  ecoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  ecoPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)"
  },
  tagline: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.38)"
  }
});

export default AnimatedSplash;
