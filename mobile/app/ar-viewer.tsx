import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { PanGestureHandler, PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import { colors, radius, spacing, typography } from "../constants/theme";
import { getStoredImage } from "../components/ProductVisual";

interface DeviceFinishes {
  name: string;
  hex: string;
  accent: string;
  image: string;
}

const DEVICE_MODELS: Record<
  string,
  {
    name: string;
    category: string;
    dimensions: { height: string; width: string; depth: string; weight: string };
    finishes: DeviceFinishes[];
    features: string[];
    usdzUrl: string;
  }
> = {
  "iphone-16-pro-max": {
    name: "iPhone 16 Pro Max",
    category: "iPhone",
    dimensions: { height: "163.0 mm", width: "77.6 mm", depth: "8.25 mm", weight: "227 grams" },
    finishes: [
      {
        name: "Desert Titanium",
        hex: "#C4A287",
        accent: "#D4B297",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      },
      {
        name: "Natural Titanium",
        hex: "#9E978E",
        accent: "#B8B1A8",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-naturaltitanium?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      },
      {
        name: "White Titanium",
        hex: "#F2F1ED",
        accent: "#FFFFFF",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-whitetitanium?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      },
      {
        name: "Black Titanium",
        hex: "#3C3B37",
        accent: "#1A1A1A",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      }
    ],
    features: [
      "Grade 5 Titanium enclosure with micro-blasted texture",
      "Camera Control sensor for instant visual intelligence",
      "A18 Pro 3nm silicon with 6-core GPU & hardware ray tracing",
      "48MP Fusion Camera with 5x Telephoto tetraprism optical zoom"
    ],
    usdzUrl: "https://www.apple.com/105/media/us/iphone-16-pro/2024/usdz/iphone_16_pro_max.usdz"
  },
  "iphone-16-pro": {
    name: "iPhone 16 Pro",
    category: "iPhone",
    dimensions: { height: "149.6 mm", width: "71.5 mm", depth: "8.25 mm", weight: "199 grams" },
    finishes: [
      {
        name: "Desert Titanium",
        hex: "#C4A287",
        accent: "#D4B297",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      },
      {
        name: "Natural Titanium",
        hex: "#9E978E",
        accent: "#B8B1A8",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      }
    ],
    features: [
      "6.3″ Super Retina XDR display with ProMotion 120Hz",
      "Action button with haptic feedback & Camera Control",
      "A18 Pro chip with next-gen Neural Engine",
      "Studio-quality 4-mic array with Audio Mix"
    ],
    usdzUrl: "https://www.apple.com/105/media/us/iphone-16-pro/2024/usdz/iphone_16_pro.usdz"
  },
  "macbook-pro-16-m3": {
    name: "MacBook Pro 16″",
    category: "Mac",
    dimensions: { height: "16.8 mm", width: "355.7 mm", depth: "248.1 mm", weight: "2.16 kg" },
    finishes: [
      {
        name: "Space Black",
        hex: "#2E2C2D",
        accent: "#1A1A1A",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spaceblack-select-202310?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      },
      {
        name: "Silver",
        hex: "#E3E4E5",
        accent: "#FFFFFF",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-silver-select-202310?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      }
    ],
    features: [
      "Liquid Retina XDR with 1,600 nits peak HDR brightness",
      "M3 Max silicon: up to 16-core CPU and 40-core GPU",
      "Up to 22 hours of continuous battery life",
      "Six-speaker sound system with force-cancelling woofers"
    ],
    usdzUrl: "https://www.apple.com/105/media/us/macbook-pro-14-and-16/2023/usdz/macbook_pro_16.usdz"
  },
  "apple-watch-ultra-2": {
    name: "Apple Watch Ultra 2",
    category: "Watch",
    dimensions: { height: "49.0 mm", width: "44.0 mm", depth: "14.4 mm", weight: "61.4 grams" },
    finishes: [
      {
        name: "Natural Titanium",
        hex: "#A8A59E",
        accent: "#B8B5AE",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra-2-case-select-202409?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      },
      {
        name: "Black Titanium",
        hex: "#2D2D2F",
        accent: "#151515",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra-2-black-select-202409?wid=1024&hei=1024&fmt=jpeg&qlt=90"
      }
    ],
    features: [
      "Rugged 49mm aerospace-grade titanium case",
      "3,000-nit Always-On Retina display",
      "Precision dual-frequency GPS (L1 and L5)",
      "100m water resistance and high-speed water sports certified"
    ],
    usdzUrl: "https://www.apple.com/105/media/us/apple-watch-ultra-2/2023/usdz/apple_watch_ultra_2.usdz"
  }
};

export default function ArViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ model?: string; color?: string }>();

  // Determine Active Model
  const modelKey = (params.model?.toLowerCase() || "iphone-16-pro-max")
    .replace(/[^a-z0-9-]/g, "-")
    .trim();
  const activeDevice = DEVICE_MODELS[modelKey] || DEVICE_MODELS["iphone-16-pro-max"];

  // View Mode: 'studio' (3D inspector) or 'ar' ("View in your space")
  const [viewMode, setViewMode] = useState<"studio" | "ar">("studio");
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [showDimensions, setShowDimensions] = useState(false);
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);

  // Gesture Values for 3D Orbit & Scale
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const arPlanePulse = useSharedValue(0.4);

  // Simulated Surface Detection Pulse in AR mode
  useEffect(() => {
    if (viewMode === "ar") {
      setSurfaceDetected(false);
      arPlanePulse.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      const timer = setTimeout(() => {
        setSurfaceDetected(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  const onPanGesture = (event: PanGestureHandlerGestureEvent) => {
    rotateY.value = event.nativeEvent.translationX * 0.4;
    rotateX.value = -event.nativeEvent.translationY * 0.3;
  };

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.state === 5) {
      // Gesture ended: return to smooth resting tilt
      rotateY.value = withSpring(0, { damping: 14 });
      rotateX.value = withSpring(0, { damping: 14 });
    }
  };

  const animated3DStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 900 },
        { rotateY: `${rotateY.value}deg` },
        { rotateX: `${rotateX.value}deg` },
        { scale: scale.value }
      ]
    };
  });

  const animatedReticleStyle = useAnimatedStyle(() => ({
    opacity: arPlanePulse.value,
    transform: [{ scale: 1 + (1 - arPlanePulse.value) * 0.2 }]
  }));

  const activeFinish = activeDevice.finishes[selectedFinishIndex] || activeDevice.finishes[0];

  const handleCaptureSnapshot = () => {
    setIsPhotoCaptured(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setIsPhotoCaptured(false);
      Alert.alert(
        "Snapshot Saved",
        "Your Apple Quick Look photo in room space has been captured. You can share it or review it in Photos."
      );
    }, 600);
  };

  const handleLaunchUsdzNative = async () => {
    if (Platform.OS === "ios") {
      const supported = await Linking.canOpenURL(activeDevice.usdzUrl);
      if (supported) {
        await Linking.openURL(activeDevice.usdzUrl);
        return;
      }
    }
    Alert.alert(
      "Apple Quick Look USDZ",
      `Opening native 3D RealityKit file for ${activeDevice.name}. On iOS Safari, this will launch directly in Apple Quick Look AR.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open USDZ File", onPress: () => Linking.openURL(activeDevice.usdzUrl) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>

        {/* View Mode Toggle: Studio 3D vs AR Camera */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => {
              setViewMode("studio");
              Haptics.selectionAsync();
            }}
            style={[styles.toggleBtn, viewMode === "studio" && styles.toggleBtnActive]}
          >
            <Ionicons
              name="cube-outline"
              size={15}
              color={viewMode === "studio" ? "#FFFFFF" : colors.text}
            />
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === "studio" && styles.toggleBtnTextActive
              ]}
            >
              3D Studio
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setViewMode("ar");
              Haptics.selectionAsync();
            }}
            style={[styles.toggleBtn, viewMode === "ar" && styles.toggleBtnActive]}
          >
            <Ionicons
              name="scan-outline"
              size={15}
              color={viewMode === "ar" ? "#FFFFFF" : colors.text}
            />
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === "ar" && styles.toggleBtnTextActive
              ]}
            >
              View in Space
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleLaunchUsdzNative}
          style={({ pressed }) => [styles.usdzBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          <Ionicons name="sparkles-outline" size={20} color="#0066CC" />
        </Pressable>
      </View>

      {/* Main Interactive Stage */}
      <View style={[styles.stage, viewMode === "ar" && styles.stageArMode]}>
        {/* AR Mode: Simulated Camera Surface & Room Grid */}
        {viewMode === "ar" && (
          <View style={styles.arCameraCanvas}>
            {/* Perspective Room Grid Lines */}
            <View style={styles.arGridFloor}>
              <View style={styles.gridLineHorizontal} />
              <View style={styles.gridLineHorizontal} />
              <View style={styles.gridLineHorizontal} />
            </View>

            {/* Surface Reticle */}
            {!surfaceDetected ? (
              <Animated.View style={[styles.reticleRing, animatedReticleStyle]}>
                <Ionicons name="scan" size={36} color="#0066CC" />
                <Text style={styles.reticleText}>Move camera to detect flat desk surface...</Text>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.surfaceLockedBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                <Text style={styles.surfaceLockedText}>SURFACE LOCKED · 1:1 TRUE PHYSICAL SCALE</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* 3D Model Display with Interactive Pan Gesture */}
        <PanGestureHandler
          onGestureEvent={onPanGesture}
          onHandlerStateChange={onPanStateChange}
        >
          <Animated.View style={[styles.modelContainer, animated3DStyle]}>
            {/* Contact Drop Shadow */}
            <View
              style={[
                styles.contactShadow,
                viewMode === "ar" && styles.contactShadowAr
              ]}
            />

            {/* Device Asset */}
            <Image
              source={{ uri: activeFinish.image }}
              style={styles.deviceImage}
              resizeMode="contain"
            />

            {/* Physical Dimensions Overlays */}
            {showDimensions && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.dimensionsOverlay}>
                <View style={styles.heightDimBox}>
                  <Text style={styles.dimText}>↕ {activeDevice.dimensions.height}</Text>
                </View>
                <View style={styles.widthDimBox}>
                  <Text style={styles.dimText}>↔ {activeDevice.dimensions.width}</Text>
                </View>
                <View style={styles.depthDimBox}>
                  <Text style={styles.dimText}>Depth: {activeDevice.dimensions.depth} · {activeDevice.dimensions.weight}</Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </PanGestureHandler>

        {/* Studio Lighting Specular Ring */}
        <View style={styles.lightingHalo} />
      </View>

      {/* Snapshot Flash Overlay */}
      {isPhotoCaptured && <View style={styles.cameraFlashOverlay} />}

      {/* Bottom Control Bar */}
      <View style={styles.bottomControls}>
        {/* Device Finish Picker */}
        <View style={styles.finishPickerRow}>
          <Text style={styles.finishNameLabel}>Finish: {activeFinish.name}</Text>
          <View style={styles.swatchRow}>
            {activeDevice.finishes.map((f, idx) => {
              const isSelected = selectedFinishIndex === idx;
              return (
                <Pressable
                  key={f.name}
                  onPress={() => {
                    setSelectedFinishIndex(idx);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.swatchRing,
                    isSelected && { borderColor: colors.text }
                  ]}
                >
                  <View style={[styles.swatchDot, { backgroundColor: f.hex }]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Controls Strip */}
        <View style={styles.controlButtonsRow}>
          <Pressable
            onPress={() => {
              setShowDimensions(!showDimensions);
              Haptics.selectionAsync();
            }}
            style={[styles.toolPill, showDimensions && styles.toolPillActive]}
          >
            <Ionicons
              name="resize-outline"
              size={16}
              color={showDimensions ? "#FFFFFF" : colors.text}
            />
            <Text
              style={[
                styles.toolPillText,
                showDimensions && styles.toolPillTextActive
              ]}
            >
              {showDimensions ? "Hide Scale" : "True Scale (mm)"}
            </Text>
          </Pressable>

          {viewMode === "ar" ? (
            <Pressable
              onPress={handleCaptureSnapshot}
              style={({ pressed }) => [styles.shutterBtn, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.shutterInner} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                scale.value = withTiming(scale.value === 1 ? 1.25 : 1, { duration: 250 });
                Haptics.selectionAsync();
              }}
              style={styles.toolPill}
            >
              <Ionicons name="scan-circle-outline" size={16} color={colors.text} />
              <Text style={styles.toolPillText}>Inspect Closer</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push(`/product/${modelKey}` as any)}
            style={styles.buyPill}
          >
            <Text style={styles.buyPillText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F7"
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
    zIndex: 10
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: radius.pill,
    padding: 3
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  toggleBtnActive: {
    backgroundColor: colors.text
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
    fontFamily: typography.fontFamily.semibold
  },
  usdzBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
  },
  stageArMode: {
    backgroundColor: "#E8E8ED"
  },
  arCameraCanvas: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center"
  },
  arGridFloor: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignItems: "center"
  },
  gridLineHorizontal: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(0, 102, 204, 0.15)",
    marginVertical: 20
  },
  reticleRing: {
    alignItems: "center",
    gap: 12
  },
  reticleText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: "#0066CC",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  surfaceLockedBanner: {
    position: "absolute",
    top: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  surfaceLockedText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    letterSpacing: 0.5
  },
  modelContainer: {
    width: Math.min(SCREEN_WIDTH * 0.85, 420),
    height: Math.min(SCREEN_HEIGHT * 0.52, 480),
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  deviceImage: {
    width: "100%",
    height: "100%",
    zIndex: 2
  },
  contactShadow: {
    position: "absolute",
    bottom: 24,
    width: "75%",
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.16)",
    transform: [{ scaleY: 0.35 }],
    zIndex: 1
  },
  contactShadowAr: {
    backgroundColor: "rgba(0, 0, 0, 0.28)"
  },
  dimensionsOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
    pointerEvents: "none"
  },
  heightDimBox: {
    position: "absolute",
    left: 4,
    top: "45%",
    backgroundColor: "rgba(29, 29, 31, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  widthDimBox: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(29, 29, 31, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  depthDimBox: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    backgroundColor: "rgba(29, 29, 31, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  dimText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  lightingHalo: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    zIndex: 0
  },
  cameraFlashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
    zIndex: 999
  },
  bottomControls: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8
  },
  finishPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  finishNameLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  swatchRow: {
    flexDirection: "row",
    gap: 8
  },
  swatchRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center"
  },
  swatchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)"
  },
  controlButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  toolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  toolPillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  toolPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  toolPillTextActive: {
    color: "#FFFFFF",
    fontFamily: typography.fontFamily.semibold
  },
  shutterBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#0066CC",
    alignItems: "center",
    justifyContent: "center"
  },
  shutterInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0066CC"
  },
  buyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: "#0066CC"
  },
  buyPillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  }
});
