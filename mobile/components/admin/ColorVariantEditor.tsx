import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors as themeColors } from "../../constants/theme";

export interface ColorVariant {
  name: string;
  hex: string;
  images: string[];
}

export interface ColorVariantEditorProps {
  colors: ColorVariant[];
  onChange: (colors: ColorVariant[]) => void;
}

export function ColorVariantEditor({
  colors,
  onChange
}: ColorVariantEditorProps) {
  const handleAddColor = () => {
    Haptics.selectionAsync();
    const newVariant: ColorVariant = {
      name: "New Color",
      hex: "#000000",
      images: []
    };
    onChange([...colors, newVariant]);
  };

  const handleRemoveColor = (index: number) => {
    Haptics.selectionAsync();
    const next = colors.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleUpdateName = (index: number, name: string) => {
    const next = [...colors];
    next[index] = { ...next[index], name };
    onChange(next);
  };

  const handleUpdateHex = (index: number, rawHex: string) => {
    let clean = rawHex.trim();
    if (!clean.startsWith("#")) {
      clean = `#${clean}`;
    }
    const next = [...colors];
    next[index] = { ...next[index], hex: clean };
    onChange(next);
  };

  const handleUpdateImageUrl = (index: number, url: string) => {
    const next = [...colors];
    next[index] = { ...next[index], images: url.trim() ? [url.trim()] : [] };
    onChange(next);
  };

  return (
    <View style={styles.container}>
      {colors.map((variant, index) => {
        const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(
          variant.hex
        );
        const displayColor = isValidHex ? variant.hex : "#CCCCCC";
        const colorImg =
          Array.isArray(variant.images) && variant.images.length > 0
            ? variant.images[0]
            : (variant as any).image || "";

        return (
          <View key={index} style={styles.card}>
            <View style={styles.row}>
              {/* Color Swatch Circle */}
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: displayColor }
                ]}
              />

              {/* Color Name Input */}
              <TextInput
                style={styles.nameInput}
                value={variant.name}
                placeholder="Color Name"
                placeholderTextColor={themeColors.textTertiary}
                onChangeText={(txt) => handleUpdateName(index, txt)}
              />

              {/* Hex Input */}
              <TextInput
                style={styles.hexInput}
                value={variant.hex}
                placeholder="#000000"
                placeholderTextColor={themeColors.textTertiary}
                autoCapitalize="characters"
                maxLength={7}
                onChangeText={(txt) => handleUpdateHex(index, txt)}
              />

              {/* Trash Button */}
              <Pressable
                hitSlop={8}
                onPress={() => handleRemoveColor(index)}
                style={styles.removeBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={themeColors.danger}
                />
              </Pressable>
            </View>

            {/* Color Finish Image Row */}
            <View style={styles.imageRow}>
              {colorImg ? (
                <Image
                  source={{ uri: colorImg }}
                  style={styles.thumb}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={15} color={themeColors.textTertiary} />
                </View>
              )}

              <TextInput
                style={styles.imageInput}
                value={colorImg}
                placeholder="Finish image URL (https://...)"
                placeholderTextColor={themeColors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(txt) => handleUpdateImageUrl(index, txt)}
              />

              {colorImg ? (
                <Pressable
                  hitSlop={6}
                  onPress={() => handleUpdateImageUrl(index, "")}
                  style={styles.clearImgBtn}
                >
                  <Ionicons name="close-circle" size={16} color={themeColors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}

      <Pressable
        style={({ pressed }) => [
          styles.addBtn,
          pressed && { opacity: 0.7 }
        ]}
        onPress={handleAddColor}
      >
        <Ionicons name="add" size={18} color={themeColors.accent} />
        <Text style={styles.addBtnText}>Add Color</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginVertical: 4
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: 10,
    gap: 8
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.2)"
  },
  nameInput: {
    flex: 1,
    fontSize: 14,
    color: themeColors.text,
    paddingVertical: 4
  },
  hexInput: {
    width: 80,
    fontFamily: "monospace",
    fontSize: 13,
    color: themeColors.textSecondary,
    backgroundColor: themeColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: "center"
  },
  removeBtn: {
    padding: 4
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: themeColors.border
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F4F5F9"
  },
  thumbPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F4F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  imageInput: {
    flex: 1,
    fontSize: 12,
    color: themeColors.text,
    backgroundColor: themeColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  clearImgBtn: {
    padding: 2
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.accent,
    borderStyle: "dashed",
    backgroundColor: "rgba(23, 23, 23, 0.04)",
    gap: 6
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.accent
  }
});

export default ColorVariantEditor;
