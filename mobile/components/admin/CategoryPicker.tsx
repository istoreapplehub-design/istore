import React from "react";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../../constants/theme";

const CATEGORIES = [
  "iPhone",
  "iPad",
  "Mac",
  "Watch",
  "AirPods",
  "TV & Home",
  "Accessories"
];

export interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const handleSelect = (cat: string) => {
    Haptics.selectionAsync();
    onChange(cat);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = value === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => handleSelect(cat)}
              style={[
                styles.pill,
                isSelected ? styles.pillSelected : styles.pillUnselected
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 8
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20
  },
  pillSelected: {
    backgroundColor: colors.accent
  },
  pillUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600"
  },
  pillTextSelected: {
    color: "#FFFFFF"
  },
  pillTextUnselected: {
    color: colors.text
  }
});

export default CategoryPicker;
