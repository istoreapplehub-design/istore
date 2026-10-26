import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, showBack = true, right }: AdminHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.brandAccent} />
          </Pressable>
        ) : null}
        <Image
          source={require("../../assets/images/lestrades-logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="LesTrades — Quality for Less"
        />
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  logo: {
    width: 40,
    height: 30,
    resizeMode: "contain"
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandRedSoft,
    borderWidth: 1,
    borderColor: colors.brandRedBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  titles: {
    flex: 1,
    marginLeft: 4
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.text
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
    marginTop: 1
  }
});

export default AdminHeader;
