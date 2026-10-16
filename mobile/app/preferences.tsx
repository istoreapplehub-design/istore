/**
 * Haptics Audit:
 * - AppHaptics.selection() on option rows and toggles
 * - AppHaptics.success() when the default region is saved
 */
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../constants/theme";
import { GHANA_REGIONS } from "../constants/config";
import { getPreferences, savePreferences } from "../lib/preferences";
import { AppHaptics, setHapticsEnabled } from "../lib/haptics";

export default function PreferencesScreen() {
  const [defaultRegion, setDefaultRegion] = useState("");
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promotionsNotifications, setPromotionsNotifications] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);

  useEffect(() => {
    getPreferences().then((p) => {
      setDefaultRegion(p.defaultRegion || "");
      if (typeof p.orderNotifications === "boolean") {
        setOrderNotifications(p.orderNotifications);
      }
      if (typeof p.promotionsNotifications === "boolean") {
        setPromotionsNotifications(p.promotionsNotifications);
      }
      if (typeof p.hapticFeedback === "boolean") {
        setHapticFeedback(p.hapticFeedback);
      }
    });
  }, []);

  const handleSelectRegion = async (region: string) => {
    AppHaptics.selection();
    setDefaultRegion(region);
    setRegionPickerVisible(false);
    await savePreferences({ defaultRegion: region });
    AppHaptics.success();
  };

  const handleToggleOrderNotifications = async (val: boolean) => {
    AppHaptics.selection();
    setOrderNotifications(val);
    await savePreferences({ orderNotifications: val });
  };

  const handleTogglePromotions = async (val: boolean) => {
    AppHaptics.selection();
    setPromotionsNotifications(val);
    await savePreferences({ promotionsNotifications: val });
  };

  const handleToggleHaptics = async (val: boolean) => {
    setHapticsEnabled(val);
    setHapticFeedback(val);
    if (val) {
      AppHaptics.selection();
    }
    await savePreferences({ hapticFeedback: val });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <Text style={typography.bodySmall}>
            How I-Store speaks, alerts, prices and delivers to you.
          </Text>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.groupContainer}>
          <View style={styles.optionRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.optionLabel}>Order & Delivery Updates</Text>
              <Text style={styles.optionSub}>
                Updates when your devices are confirmed, packed, shipped and delivered.
              </Text>
            </View>
            <Switch
              value={orderNotifications}
              onValueChange={handleToggleOrderNotifications}
              trackColor={{ false: colors.border, true: "rgba(23, 23, 23, 0.35)" }}
              thumbColor={orderNotifications ? colors.accent : "#FFFFFF"}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.optionRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.optionLabel}>Flash Sales & Drops</Text>
              <Text style={styles.optionSub}>
                Alerts when new daily flash deals go live at midnight.
              </Text>
            </View>
            <Switch
              value={promotionsNotifications}
              onValueChange={handleTogglePromotions}
              trackColor={{ false: colors.border, true: "rgba(23, 23, 23, 0.35)" }}
              thumbColor={promotionsNotifications ? colors.accent : "#FFFFFF"}
            />
          </View>
        </View>

        {/* FEEDBACK & HAPTICS */}
        <Text style={styles.sectionLabel}>TACTILE FEEDBACK</Text>
        <View style={styles.groupContainer}>
          <View style={styles.optionRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.optionLabel}>Haptic Feedback</Text>
              <Text style={styles.optionSub}>
                Subtle micro-vibrations for taps, button presses, variant picks and state changes.
              </Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: colors.border, true: "rgba(23, 23, 23, 0.35)" }}
              thumbColor={hapticFeedback ? colors.accent : "#FFFFFF"}
            />
          </View>
        </View>

        {/* LANGUAGE & CURRENCY */}
        <Text style={styles.sectionLabel}>LANGUAGE &amp; CURRENCY</Text>
        <View style={styles.groupContainer}>
          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>English (Ghana)</Text>
              <Text style={styles.optionSub}>The language of the whole store.</Text>
            </View>
            <Ionicons name="checkmark" size={20} color={colors.accent} />
          </View>
          <View style={styles.divider} />
          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Ghana Cedi — ₵ (GHS)</Text>
              <Text style={styles.optionSub}>
                Every price, delivery fee and MoMo charge is in cedis.
              </Text>
            </View>
            <Ionicons name="checkmark" size={20} color={colors.accent} />
          </View>
        </View>

        {/* DELIVERY */}
        <Text style={styles.sectionLabel}>DELIVERY</Text>
        <View style={styles.groupContainer}>
          <Pressable
            style={({ pressed }) => [styles.optionRow, pressed && styles.rowPressed]}
            onPress={() => {
              AppHaptics.selection();
              setRegionPickerVisible(true);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Default delivery region</Text>
              <Text style={styles.optionSub}>
                Preselects your region at checkout when no saved address applies.
              </Text>
            </View>
            <Text style={styles.valueText}>
              {defaultRegion || "Not set"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={regionPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRegionPickerVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setRegionPickerVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Delivery Region</Text>
              <Pressable hitSlop={12} onPress={() => setRegionPickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Pressable
                style={styles.sheetRow}
                onPress={() => handleSelectRegion("")}
              >
                <Text style={styles.sheetRowText}>No preference</Text>
                {defaultRegion === "" && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </Pressable>
              {GHANA_REGIONS.map((region) => (
                <Pressable
                  key={region}
                  style={styles.sheetRow}
                  onPress={() => handleSelectRegion(region)}
                >
                  <Text style={styles.sheetRowText}>{region}</Text>
                  {defaultRegion === region && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48
  },
  pageHeader: {
    marginBottom: 8
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginLeft: 12,
    marginBottom: 8,
    marginTop: 24
  },
  groupContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden"
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10
  },
  rowPressed: {
    backgroundColor: colors.surface
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text
  },
  optionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16
  },
  valueText: {
    fontSize: 15,
    color: colors.textSecondary
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%"
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  sheetRowText: {
    fontSize: 16,
    color: colors.text
  }
});
