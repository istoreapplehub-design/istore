import React from "react";
import { View, StyleSheet } from "react-native";
import AppHeader from "../../components/AppHeader";
import AccountScreen from "../account";
import { colors } from "../../constants/theme";

export default function AccountTabScreen() {
  return (
    <View style={styles.root}>
      <AppHeader title="Account" subtitle="Orders, saved addresses, warranty & support" />
      <AccountScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  }
});
