import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, spacing } from "../constants/theme";
import { ProductColor } from "../types";

interface ColorPickerProps {
  colors: ProductColor[];
  selected?: string;
  onSelect: (name: string) => void;
}

export function ColorPicker({
  colors: colorOptions,
  selected,
  onSelect
}: ColorPickerProps) {
  if (!colorOptions || colorOptions.length === 0) {
    return null;
  }

  const selectedName = selected || colorOptions[0]?.name || "";

  return (
    <View style={styles.container}>
      <View style={styles.swatchRow}>
        {colorOptions.map((item) => {
          const isSelected = item.name === selectedName;
          return (
            <Pressable
              key={item.name}
              hitSlop={6}
              style={[
                styles.swatchOuter,
                isSelected ? styles.swatchSelected : styles.swatchUnselected
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(item.name);
              }}
            >
              <View
                style={[
                  styles.swatchInner,
                  { backgroundColor: item.hex || "#333333" }
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.selectedNameText}>
        Color: <Text style={styles.boldText}>{selectedName}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  swatchOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2
  },
  swatchSelected: {
    borderColor: colors.accent
  },
  swatchUnselected: {
    borderColor: "transparent"
  },
  swatchInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  selectedNameText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary
  },
  boldText: {
    color: colors.text,
    fontWeight: "600"
  }
});
