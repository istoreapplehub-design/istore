import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../constants/theme";

export default function AdminOrderDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Order Detail (coming soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500"
  }
});
