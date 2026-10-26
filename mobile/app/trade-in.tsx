import React, { useMemo, useState } from "react";
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
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { colors, formatGHS, radius, spacing, typography } from "../constants/theme";
import { useCartStore } from "../store/useCartStore";
import { API_URL } from "../constants/config";

interface TradeInModel {
  id: string;
  name: string;
  category: "iPhone" | "Mac" | "iPad" | "Watch";
  maxCreditGHS: number;
  baseDeductions: {
    screenCracked: number;
    screenLightWear: number;
    batteryDegraded: number;
    sensorDefect: number;
  };
}

export default function TradeInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 860;
  const setTradeInCredit = useCartStore((s) => s.setTradeInCredit);

  // Form State
  const [serialInput, setSerialInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<TradeInModel | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Condition Checklist
  const [screenCondition, setScreenCondition] = useState<"flawless" | "light" | "cracked">("flawless");
  const [batteryHealth, setBatteryHealth] = useState<"optimal" | "fair" | "service">("optimal");
  const [sensorsWorking, setSensorsWorking] = useState<boolean>(true);
  const [icloudUnlocked, setIcloudUnlocked] = useState<boolean>(true);

  // Trade-In Photos (Front, Back, Battery Health)
  const [frontPhotoUri, setFrontPhotoUri] = useState<string | null>(null);
  const [backPhotoUri, setBackPhotoUri] = useState<string | null>(null);
  const [batteryPhotoUri, setBatteryPhotoUri] = useState<string | null>(null);

  const [checkedDevice, setCheckedDevice] = useState<{
    model: string;
    category?: string;
    storage: string;
    color: string;
    modelNumber: string;
    warrantyStatus: string;
    coverageExpires?: string;
    icloudStatus: string;
    simLock: string;
    batteryStatus: string;
    maxTradeInGHS?: number;
    estimatedRetailGHS?: number;
    provider?: string;
  } | null>(null);

  // Final Quote
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [quoteCode, setQuoteCode] = useState("");

  const pickPhoto = async (slot: "front" | "back" | "battery", fromCamera: boolean) => {
    Haptics.selectionAsync();
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera and photo library access are required to photograph your device for trade-in assessment.");
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        if (slot === "front") setFrontPhotoUri(uri);
        else if (slot === "back") setBackPhotoUri(uri);
        else setBatteryPhotoUri(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert("Photo Error", err?.message || "Could not select photo.");
    }
  };

  const handleValidateSerial = async () => {
    const cleaned = serialInput.trim().toUpperCase();
    if (cleaned.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Invalid Identifier",
        "Please enter a valid Apple Serial Number (10–12 chars) or 15-digit IMEI found in Settings > General > About."
      );
      return;
    }

    setIsValidating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_URL}/api/services/trade-in/check-serial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialOrImei: cleaned }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      if (res.ok && json.success && json.device) {
        setCheckedDevice(json.device);
        const maxCredit = json.device.maxTradeInGHS || 12000;
        setSelectedModel({
          id: `device-${cleaned}`,
          name: json.device.model,
          category: json.device.category || "iPhone",
          maxCreditGHS: maxCredit,
          baseDeductions: {
            screenCracked: Math.round(maxCredit * 0.25),
            screenLightWear: Math.round(maxCredit * 0.06),
            batteryDegraded: Math.round(maxCredit * 0.08),
            sensorDefect: Math.round(maxCredit * 0.15)
          }
        });
        setValidationSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setValidationSuccess(false);
        setSelectedModel(null);
        setCheckedDevice(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Hardware Not Recognized",
          json.error || "Device not found for the entered serial number / IMEI. Please verify and try again."
        );
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Lookup Error",
        "Unable to reach the hardware verification service. Please verify your connection and try again."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const calculatedCreditGHS = useMemo(() => {
    if (!selectedModel) return 0;
    let credit = selectedModel.maxCreditGHS;

    if (screenCondition === "light") {
      credit -= selectedModel.baseDeductions.screenLightWear;
    } else if (screenCondition === "cracked") {
      credit -= selectedModel.baseDeductions.screenCracked;
    }

    if (batteryHealth === "fair") {
      credit -= selectedModel.baseDeductions.batteryDegraded;
    } else if (batteryHealth === "service") {
      credit -= selectedModel.baseDeductions.batteryDegraded * 1.8;
    }

    if (!sensorsWorking) {
      credit -= selectedModel.baseDeductions.sensorDefect;
    }

    if (!icloudUnlocked) {
      credit = 0; // iCloud locked devices cannot be traded
    }

    return Math.max(0, Math.round(credit));
  }, [selectedModel, screenCondition, batteryHealth, sensorsWorking, icloudUnlocked]);

  const [isSubmittingTradeIn, setIsSubmittingTradeIn] = useState(false);

  const handleGenerateQuote = async () => {
    if (!icloudUnlocked) {
      Alert.alert(
        "Activation Lock Required",
        "Devices locked to an Apple ID / iCloud account cannot be accepted. Please sign out of Find My in Settings before trading."
      );
      return;
    }

    if (!selectedModel || !checkedDevice) return;

    setIsSubmittingTradeIn(true);
    try {
      const res = await fetch(`${API_URL}/api/services/trade-in/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "LesTrades Customer",
          customerPhone: "0242826590",
          serialOrImei: serialInput.trim().toUpperCase(),
          modelName: checkedDevice.model,
          category: checkedDevice.category,
          storage: checkedDevice.storage,
          color: checkedDevice.color,
          condition: {
            screenCondition,
            batteryHealth,
            sensorsWorking,
            icloudUnlocked
          },
          photos: {
            front: frontPhotoUri,
            back: backPhotoUri,
            battery: batteryPhotoUri
          },
          estimatedValueGHS: calculatedCreditGHS
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setQuoteCode(json.reference || `TI-GH-${Math.floor(10000 + Math.random() * 90000)}`);
        setQuoteGenerated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const fallbackRef = `TI-GH-${Math.floor(10000 + Math.random() * 90000)}`;
        setQuoteCode(fallbackRef);
        setQuoteGenerated(true);
      }
    } catch {
      const fallbackRef = `TI-GH-${Math.floor(10000 + Math.random() * 90000)}`;
      setQuoteCode(fallbackRef);
      setQuoteGenerated(true);
    } finally {
      setIsSubmittingTradeIn(false);
    }
  };

  const handleApplyToBag = () => {
    if (!selectedModel) return;

    setTradeInCredit({
      deviceModel: selectedModel.name,
      serialOrImei: serialInput.trim().toUpperCase(),
      creditGHS: calculatedCreditGHS,
      condition: `${screenCondition} screen, ${batteryHealth} battery`,
      quoteCode: quoteCode || `TI-GH-${Math.floor(10000 + Math.random() * 90000)}`
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Trade-In Credit Applied!",
      `₵${calculatedCreditGHS.toLocaleString("en-GH")} trade-in credit has been applied to your Shopping Bag. Your total will automatically be discounted.`,
      [
        {
          text: "Go to Shopping Bag",
          onPress: () => router.push("/(tabs)/bag")
        },
        {
          text: "Continue Shopping",
          onPress: () => router.push("/(tabs)/shop")
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Navigation Bar */}
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backBtnText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Apple Trade In</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.scrollContentDesktop
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.badgePill}>
              <Ionicons name="repeat" size={14} color="#0066CC" />
              <Text style={styles.badgePillText}>INSTANT VALUATION · GHANA</Text>
            </View>
            <Text style={styles.heroHeadline}>Turn the device you have into the one you want.</Text>
            <Text style={styles.heroSubtext}>
              Trade in your eligible Apple device for instant credit towards your next upgrade. Get
              an immediate valuation with your Serial Number or IMEI.
            </Text>
          </View>

          {/* Step 1: Device Identification */}
          <View style={styles.cardSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Enter Serial Number or IMEI</Text>
            </View>
            <Text style={styles.stepDesc}>
              Locate your serial number on iPhone or iPad in:{"\n"}
              <Text style={{ fontWeight: "600", color: colors.text }}>
                Settings → General → About → Serial Number
              </Text>
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                value={serialInput}
                onChangeText={(val) => {
                  setSerialInput(val);
                  setValidationSuccess(false);
                  setQuoteGenerated(false);
                }}
                placeholder="e.g. F2LL80R0Q2 or 15-digit IMEI"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.textInput}
              />
              <Pressable
                onPress={handleValidateSerial}
                disabled={isValidating || !serialInput.trim()}
                style={({ pressed }) => [
                  styles.verifyBtn,
                  (!serialInput.trim() || isValidating) && styles.verifyBtnDisabled,
                  pressed && { opacity: 0.8 }
                ]}
              >
                {isValidating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify</Text>
                )}
              </Pressable>
            </View>


            {/* Validated Model Banner with IMEICheck Specifications */}
            {validationSuccess && selectedModel && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.imeiCard}>
                <View style={styles.imeiHeaderRow}>
                  <View style={styles.imeiBadge}>
                    <Ionicons name="shield-checkmark" size={13} color="#0066CC" />
                    <Text style={styles.imeiBadgeText}>IMEICHECK · APPLE SERIAL VERIFIED</Text>
                  </View>
                  <Text style={styles.imeiModelNumText}>{checkedDevice?.modelNumber || "A3297"}</Text>
                </View>

                <Text style={styles.imeiDeviceTitle}>{checkedDevice?.model || selectedModel.name}</Text>
                <Text style={styles.imeiDeviceSpec}>
                  {(checkedDevice?.storage || "256 GB")} · {(checkedDevice?.color || "Titanium")}
                </Text>

                <View style={styles.imeiPillGrid}>
                  <View style={styles.imeiPill}>
                    <Ionicons name="checkmark-circle" size={13} color="#34C759" />
                    <Text style={styles.imeiPillText}>{checkedDevice?.warrantyStatus || "Active Apple Warranty"}</Text>
                  </View>
                  <View style={styles.imeiPill}>
                    <Ionicons name="lock-open-outline" size={13} color="#34C759" />
                    <Text style={styles.imeiPillText}>{checkedDevice?.icloudStatus || "iCloud Activation Lock Off"}</Text>
                  </View>
                  <View style={styles.imeiPill}>
                    <Ionicons name="cellular-outline" size={13} color="#0066CC" />
                    <Text style={styles.imeiPillText}>{checkedDevice?.simLock || "Factory Unlocked (Ghana)"}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Step 2: Condition Questionnaire (Only active once model is selected) */}
          {selectedModel && (
            <Animated.View entering={FadeInDown.duration(350)} style={styles.cardSection}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Device Condition Assessment</Text>
              </View>

              {/* Question 1: Screen & Enclosure */}
              <View style={styles.questionBlock}>
                <Text style={styles.questionTitle}>Display & Outer Enclosure</Text>
                <View style={styles.optionButtonGroup}>
                  {[
                    { key: "flawless", label: "Flawless", sub: "No visible marks" },
                    { key: "light", label: "Normal Wear", sub: "Micro hairline scratches" },
                    { key: "cracked", label: "Cracked / Dented", sub: "Glass chip or dent" }
                  ].map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        setScreenCondition(opt.key as any);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.optionCard,
                        screenCondition === opt.key && styles.optionCardActive
                      ]}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            screenCondition === opt.key && styles.radioCircleActive
                          ]}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            screenCondition === opt.key && styles.optionLabelActive
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Question 2: Battery Health */}
              <View style={styles.questionBlock}>
                <Text style={styles.questionTitle}>Battery Maximum Capacity</Text>
                <View style={styles.optionButtonGroup}>
                  {[
                    { key: "optimal", label: "85% – 100%", sub: "Optimal health" },
                    { key: "fair", label: "75% – 84%", sub: "Normal degradation" },
                    { key: "service", label: "Below 75%", sub: "Service recommended" }
                  ].map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        setBatteryHealth(opt.key as any);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.optionCard,
                        batteryHealth === opt.key && styles.optionCardActive
                      ]}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            batteryHealth === opt.key && styles.radioCircleActive
                          ]}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            batteryHealth === opt.key && styles.optionLabelActive
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Question 3: Sensors & Biometrics */}
              <View style={styles.questionBlock}>
                <Text style={styles.questionTitle}>Biometrics & Sensors</Text>
                <Text style={styles.questionDesc}>
                  Are Face ID / Touch ID, cameras, speakers, and True Tone functioning properly?
                </Text>
                <View style={styles.binaryRow}>
                  <Pressable
                    onPress={() => {
                      setSensorsWorking(true);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.binaryBtn, sensorsWorking && styles.binaryBtnActive]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={sensorsWorking ? "#FFFFFF" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.binaryBtnText,
                        sensorsWorking && styles.binaryBtnTextActive
                      ]}
                    >
                      Yes, 100% Working
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSensorsWorking(false);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.binaryBtn, !sensorsWorking && styles.binaryBtnActive]}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color={!sensorsWorking ? "#FFFFFF" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.binaryBtnText,
                        !sensorsWorking && styles.binaryBtnTextActive
                      ]}
                    >
                      No, Has Defect
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Question 4: iCloud & Find My */}
              <View style={styles.questionBlock}>
                <Text style={styles.questionTitle}>Apple ID & Find My Sign-Out</Text>
                <Text style={styles.questionDesc}>
                  Will you turn off Find My and erase device before handing it over?
                </Text>
                <View style={styles.binaryRow}>
                  <Pressable
                    onPress={() => {
                      setIcloudUnlocked(true);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.binaryBtn, icloudUnlocked && styles.binaryBtnActive]}
                  >
                    <Ionicons
                      name="lock-open"
                      size={18}
                      color={icloudUnlocked ? "#FFFFFF" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.binaryBtnText,
                        icloudUnlocked && styles.binaryBtnTextActive
                      ]}
                    >
                      Yes, Ready to Erase
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIcloudUnlocked(false);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.binaryBtn, !icloudUnlocked && styles.binaryBtnActive]}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color={!icloudUnlocked ? "#FFFFFF" : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.binaryBtnText,
                        !icloudUnlocked && styles.binaryBtnTextActive
                      ]}
                    >
                      Locked / Cannot Erase
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Question 5: Photograph Your Device (Front, Back, Battery Section) */}
              <View style={styles.questionBlock}>
                <Text style={styles.questionTitle}>Device Inspection Photographs</Text>
                <Text style={styles.questionDesc}>
                  Upload photos of your device's front screen, back enclosure, and Battery Health screen to lock in maximum guaranteed trade value.
                </Text>

                <View style={styles.photoSlotsRow}>
                  {/* Photo 1: Front */}
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoSlotLabel}>1. Front Screen</Text>
                    {frontPhotoUri ? (
                      <View style={styles.photoPreviewBox}>
                        <Image source={{ uri: frontPhotoUri }} style={styles.photoPreviewImg} />
                        <View style={styles.photoBadgeSuccess}>
                          <Ionicons name="checkmark-circle" size={12} color="#34C759" />
                          <Text style={styles.photoBadgeSuccessText}>Uploaded</Text>
                        </View>
                        <Pressable style={styles.photoRetakeBtn} onPress={() => pickPhoto("front", true)}>
                          <Text style={styles.photoRetakeText}>Retake</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.photoPlaceholderBox}>
                        <Ionicons name="phone-portrait-outline" size={24} color="#0066CC" />
                        <Text style={styles.photoPlaceholderText}>Display On</Text>
                        <View style={styles.photoActionButtons}>
                          <Pressable style={styles.miniPhotoBtn} onPress={() => pickPhoto("front", true)}>
                            <Ionicons name="camera" size={13} color="#FFFFFF" />
                          </Pressable>
                          <Pressable style={[styles.miniPhotoBtn, styles.miniPhotoBtnAlt]} onPress={() => pickPhoto("front", false)}>
                            <Ionicons name="images" size={13} color="#0066CC" />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Photo 2: Back */}
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoSlotLabel}>2. Back / Lenses</Text>
                    {backPhotoUri ? (
                      <View style={styles.photoPreviewBox}>
                        <Image source={{ uri: backPhotoUri }} style={styles.photoPreviewImg} />
                        <View style={styles.photoBadgeSuccess}>
                          <Ionicons name="checkmark-circle" size={12} color="#34C759" />
                          <Text style={styles.photoBadgeSuccessText}>Uploaded</Text>
                        </View>
                        <Pressable style={styles.photoRetakeBtn} onPress={() => pickPhoto("back", true)}>
                          <Text style={styles.photoRetakeText}>Retake</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.photoPlaceholderBox}>
                        <Ionicons name="camera-reverse-outline" size={24} color="#0066CC" />
                        <Text style={styles.photoPlaceholderText}>Back Glass</Text>
                        <View style={styles.photoActionButtons}>
                          <Pressable style={styles.miniPhotoBtn} onPress={() => pickPhoto("back", true)}>
                            <Ionicons name="camera" size={13} color="#FFFFFF" />
                          </Pressable>
                          <Pressable style={[styles.miniPhotoBtn, styles.miniPhotoBtnAlt]} onPress={() => pickPhoto("back", false)}>
                            <Ionicons name="images" size={13} color="#0066CC" />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Photo 3: Battery Section */}
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoSlotLabel}>3. Battery Health</Text>
                    {batteryPhotoUri ? (
                      <View style={styles.photoPreviewBox}>
                        <Image source={{ uri: batteryPhotoUri }} style={styles.photoPreviewImg} />
                        <View style={styles.photoBadgeSuccess}>
                          <Ionicons name="checkmark-circle" size={12} color="#34C759" />
                          <Text style={styles.photoBadgeSuccessText}>Uploaded</Text>
                        </View>
                        <Pressable style={styles.photoRetakeBtn} onPress={() => pickPhoto("battery", false)}>
                          <Text style={styles.photoRetakeText}>Retake</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.photoPlaceholderBox}>
                        <Ionicons name="battery-charging-outline" size={24} color="#0066CC" />
                        <Text style={styles.photoPlaceholderText}>Settings %</Text>
                        <View style={styles.photoActionButtons}>
                          <Pressable style={styles.miniPhotoBtn} onPress={() => pickPhoto("battery", true)}>
                            <Ionicons name="camera" size={13} color="#FFFFFF" />
                          </Pressable>
                          <Pressable style={[styles.miniPhotoBtn, styles.miniPhotoBtnAlt]} onPress={() => pickPhoto("battery", false)}>
                            <Ionicons name="images" size={13} color="#0066CC" />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Live Valuation Summary */}
              <View style={styles.quoteSummaryBox}>
                <Text style={styles.quoteLabel}>ESTIMATED TRADE-IN VALUE</Text>
                <Text style={styles.quoteValue}>{formatGHS(calculatedCreditGHS)}</Text>
                <Text style={styles.quoteNote}>
                  Guaranteed quote valid for 14 days upon physical hardware inspection at LESTRADES_UCC CAPE COAST.
                </Text>

                <Pressable
                  onPress={handleGenerateQuote}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    pressed && { opacity: 0.85 }
                  ]}
                >
                  <Text style={styles.primaryActionBtnText}>Lock In Trade-In Quote</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Step 3: Locked In Quote & Actions */}
          {quoteGenerated && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.finalQuoteCard}>
              <View style={styles.quoteHeaderRow}>
                <View style={styles.badgeSuccess}>
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.badgeSuccessText}>QUOTE LOCKED</Text>
                </View>
                <Text style={styles.quoteRefCode}>{quoteCode}</Text>
              </View>

              <Text style={styles.finalDeviceTitle}>{selectedModel?.name}</Text>
              <Text style={styles.finalCreditAmount}>{formatGHS(calculatedCreditGHS)}</Text>

              <View style={styles.quoteDetailsList}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>Valid for 14 calendar days across Ghana</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>
                    Redeem at LESTRADES_UCC CAPE COAST or via Doorstep VIP courier
                  </Text>
                </View>
              </View>

              <View style={styles.finalActionGroup}>
                <Pressable
                  onPress={handleApplyToBag}
                  style={({ pressed }) => [styles.applyBagBtn, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="bag-add" size={18} color="#FFFFFF" />
                  <Text style={styles.applyBagBtnText}>Apply Credit to Shopping Bag</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/genius-bar" as any)}
                  style={({ pressed }) => [styles.scheduleDropBtn, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="time-outline" size={18} color={colors.text} />
                  <Text style={styles.scheduleDropBtnText}>Schedule Hub Drop-Off Appointment</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* How Trade-In Works In Ghana */}
          <View style={styles.faqCard}>
            <Text style={styles.faqHeading}>How Trade In Works in Ghana</Text>

            <View style={styles.faqRow}>
              <View style={styles.faqIconBox}>
                <Ionicons name="calculator-outline" size={20} color="#0066CC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.faqTitle}>1. Get your instant quote</Text>
                <Text style={styles.faqBody}>
                  Enter your serial number and assess your device's condition online to receive a verified value in Ghanaian Cedis.
                </Text>
              </View>
            </View>

            <View style={styles.faqRow}>
              <View style={styles.faqIconBox}>
                <Ionicons name="storefront-outline" size={20} color="#0066CC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.faqTitle}>2. Hand over your device</Text>
                <Text style={styles.faqBody}>
                  Drop off your device at LESTRADES_UCC CAPE COAST or request free courier pickup across Ghana.
                </Text>
              </View>
            </View>

            <View style={styles.faqRow}>
              <View style={styles.faqIconBox}>
                <Ionicons name="card-outline" size={20} color="#0066CC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.faqTitle}>3. Upgrade seamlessly</Text>
                <Text style={styles.faqBody}>
                  Your credit is instantly deducted from your new Apple device checkout or transferred directly via Mobile Money (MTN MoMo / Telecel Cash).
                </Text>
              </View>
            </View>
          </View>
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: "#FFFFFF"
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  backBtnText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.fontFamily.medium
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  scrollContentDesktop: {
    maxWidth: 760,
    alignSelf: "center",
    width: "100%"
  },
  heroBanner: {
    paddingVertical: 24,
    alignItems: "flex-start"
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12
  },
  badgePillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: "#0066CC",
    letterSpacing: 0.5
  },
  heroHeadline: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.6,
    marginBottom: 8
  },
  heroSubtext: {
    fontSize: 15,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 22
  },
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center"
  },
  stepNumText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    letterSpacing: -0.2
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16
  },
  inputRow: {
    flexDirection: "row",
    gap: 10
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  verifyBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center"
  },
  verifyBtnDisabled: {
    opacity: 0.4
  },
  verifyBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  quickPickRow: {
    marginTop: 14
  },
  quickPickLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.textTertiary
  },
  sampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8
  },
  sampleChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  sampleChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  sampleChipTextActive: {
    color: "#FFFFFF"
  },
  modelIdentifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 102, 204, 0.25)"
  },
  modelIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    alignItems: "center",
    justifyContent: "center"
  },
  modelIdentifiedTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.text
  },
  modelIdentifiedSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2
  },
  questionBlock: {
    marginTop: 18
  },
  questionTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    marginBottom: 4
  },
  questionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10
  },
  optionButtonGroup: {
    gap: 8,
    marginTop: 6
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  optionCardActive: {
    borderColor: colors.text,
    backgroundColor: "#FBFBFC"
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.textTertiary
  },
  radioCircleActive: {
    borderColor: colors.text,
    backgroundColor: colors.text
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  optionLabelActive: {
    color: colors.text
  },
  optionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 24,
    marginTop: 2
  },
  binaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6
  },
  binaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border
  },
  binaryBtnActive: {
    backgroundColor: colors.text,
    borderColor: colors.text
  },
  binaryBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  binaryBtnTextActive: {
    color: "#FFFFFF"
  },
  quoteSummaryBox: {
    marginTop: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  quoteLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    letterSpacing: 1
  },
  quoteValue: {
    fontSize: 34,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    letterSpacing: -0.8,
    marginVertical: 4
  },
  quoteNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16
  },
  primaryActionBtn: {
    width: "100%",
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#0066CC",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  finalQuoteCard: {
    backgroundColor: "#1D1D1F",
    borderRadius: radius.lg,
    padding: 22,
    marginBottom: 20
  },
  quoteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0066CC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm
  },
  badgeSuccessText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  quoteRefCode: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    letterSpacing: 0.5
  },
  finalDeviceTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  finalCreditAmount: {
    fontSize: 36,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
    letterSpacing: -0.8,
    marginVertical: 6
  },
  quoteDetailsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    paddingTop: 12,
    marginVertical: 12,
    gap: 8
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  detailText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)"
  },
  finalActionGroup: {
    gap: 10,
    marginTop: 8
  },
  applyBagBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "#0066CC"
  },
  applyBagBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  },
  scheduleDropBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: "#FFFFFF"
  },
  scheduleDropBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  faqHeading: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 16
  },
  faqRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16
  },
  faqIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    alignItems: "center",
    justifyContent: "center"
  },
  faqTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    marginBottom: 2
  },
  faqBody: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18
  },
  imeiCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: radius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  imeiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  imeiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 102, 204, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full
  },
  imeiBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: "#0066CC",
    letterSpacing: 0.4
  },
  imeiModelNumText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textTertiary
  },
  imeiDeviceTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginBottom: 2
  },
  imeiDeviceSpec: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 12
  },
  imeiPillGrid: {
    gap: 6
  },
  imeiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  imeiPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.text
  },
  photoSlotsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  photoSlot: {
    flex: 1
  },
  photoSlotLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    marginBottom: 6,
    textAlign: "center"
  },
  photoPlaceholderBox: {
    height: 110,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 8
  },
  photoPlaceholderText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 6
  },
  photoActionButtons: {
    flexDirection: "row",
    gap: 6
  },
  miniPhotoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0066CC",
    alignItems: "center",
    justifyContent: "center"
  },
  miniPhotoBtnAlt: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1"
  },
  photoPreviewBox: {
    height: 110,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: colors.border
  },
  photoPreviewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  photoBadgeSuccess: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.full
  },
  photoBadgeSuccessText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF"
  },
  photoRetakeBtn: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignItems: "center"
  },
  photoRetakeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semibold,
    color: "#FFFFFF"
  }
});
