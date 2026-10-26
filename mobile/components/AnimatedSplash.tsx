import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import { radius } from "../constants/theme";
import { BrandLogo } from "./BrandLogo";

interface AnimatedSplashProps {
  ready: boolean;
  onFinish: () => void;
}

export function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  const logoScale = useSharedValue(0.75);
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

    const timer = setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
      containerScale.value = withTiming(1.04, {
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

      setTimeout(() => onFinish(), 380);
    }, 1150);

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
        {/* LesTrades Brand Logo */}
        <Animated.View style={[styles.emblemBox, logoAnimatedStyle]}>
          <BrandLogo size={130} mode="full" />
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(280).duration(420)} style={styles.brandSubtitle}>
          UCC Cape Coast · Ghana's Apple Destination
        </Animated.Text>

        {/* Minimal Progress Bar */}
        <Animated.View entering={FadeInDown.delay(380).duration(350)} style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(480).duration(400)} style={styles.bottomFooter}>
        <Text style={styles.tagline}>QUALITY FOR LESS · UCC CAPE COAST</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  centerStage: {
    alignItems: "center",
    justifyContent: "center"
  },
  emblemBox: {
    width: 280,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0066CC",
    letterSpacing: 0.2,
    marginTop: 4
  },
  progressTrack: {
    width: 120,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: "#E5E5EA",
    marginTop: 26,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: "#0066CC"
  },
  bottomFooter: {
    position: "absolute",
    bottom: 48,
    alignItems: "center"
  },
  tagline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "#86868B"
  }
});

export default AnimatedSplash;
