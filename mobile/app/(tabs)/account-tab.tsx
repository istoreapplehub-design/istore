import React from "react";
import { View, StyleSheet } from "react-native";
import AccountScreen from "../account";
import { colors } from "../../constants/theme";

export default function AccountTabScreen() {
  return (
    <View style={styles.root}>
      <AccountScreen inTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  }
});
