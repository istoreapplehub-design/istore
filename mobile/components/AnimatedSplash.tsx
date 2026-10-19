import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { colors, radius } from "../constants/theme";

interface AnimatedSplashProps {
  ready: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // Hard safety timeout: Ensure splash is dismissed even if animations or readiness hang
  useEffect(() => {
    const hardFallback = setTimeout(() => {
      onFinish();
    }, 2400);

    return () => clearTimeout(hardFallback);
  }, [onFinish]);

  useEffect(() => {
    // Apple-style entrance: pristine logo fade & spring
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, { damping: 16, stiffness: 120 });

    progressWidth.value = withDelay(
      150,
      withTiming(100, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [logoOpacity, logoScale, progressWidth]);

  useEffect(() => {
    if (!ready) return;

    // Graceful reveal once ready
    const timer = setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
      containerScale.value = withTiming(1.05, {
        duration: 360,
        easing: Easing.out(Easing.cubic)
      });
      containerOpacity.value = withTiming(
        0,
        {
          duration: 320,
          easing: Easing.inOut(Easing.quad)
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      );

      // Extra guarantee in case worklet doesn't finish
      setTimeout(() => onFinish(), 380);
    }, 1200);

    return () => clearTimeout(timer);
  }, [ready, containerOpacity, containerScale, onFinish]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }]
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  return (
    <Animated.View style={[styles.overlay, containerAnimatedStyle]}>
      <View style={styles.centerStage}>
        {/* Apple Iconic Monogram */}
        <Animated.View style={[styles.emblemBox, logoAnimatedStyle]}>
          <Ionicons name="logo-apple" size={54} color="#FFFFFF" />
        </Animated.View>

        {/* Clean Apple-style Typography: I-Store */}
        <Animated.Text entering={FadeIn.delay(200).duration(450)} style={styles.brandTitle}>
          I-Store
        </Animated.Text>

        <Animated.Text entering={FadeIn.delay(350).duration(450)} style={styles.brandSubtitle}>
          Apple Hub Official Store
        </Animated.Text>

        {/* Minimal Progress Bar */}
        <Animated.View entering={FadeInDown.delay(400).duration(350)} style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </Animated.View>
      </View>

      {/* Subtle Apple-style Footer (Without any 'Accra') */}
      <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.bottomFooter}>
        <Text style={styles.tagline}>DESIGNED FOR EXCELLENCE</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  centerStage: {
    alignItems: "center",
    justifyContent: "center"
  },
  emblemBox: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.8
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.2,
    marginTop: 4
  },
  progressTrack: {
    width: 120,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginTop: 28,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: "#FFFFFF"
  },
  bottomFooter: {
    position: "absolute",
    bottom: 48,
    alignItems: "center"
  },
  tagline: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(255, 255, 255, 0.32)"
  }
});

export default AnimatedSplash;
